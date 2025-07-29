from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
import json
import logging

from app.database import AsyncSessionLocal
from app.deps import get_current_user_websocket
from app.users.models import User
from . import crud, schemas

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Словарь: room_id -> список WebSocket соединений
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Словарь: websocket -> user_id
        self.user_connections: Dict[WebSocket, int] = {}

    async def connect(self, websocket: WebSocket, room_id: int, user_id: int):
        """Подключить пользователя к комнате"""
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        self.active_connections[room_id].append(websocket)
        self.user_connections[websocket] = user_id
        
        logger.info(f"User {user_id} connected to room {room_id}")

    def disconnect(self, websocket: WebSocket, room_id: int):
        """Отключить пользователя от комнаты"""
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
                
        if websocket in self.user_connections:
            user_id = self.user_connections[websocket]
            del self.user_connections[websocket]
            logger.info(f"User {user_id} disconnected from room {room_id}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Отправить личное сообщение"""
        await websocket.send_text(message)

    async def broadcast_to_room(self, message: dict, room_id: int, exclude_websocket: WebSocket = None):
        """Отправить сообщение всем участникам комнаты"""
        if room_id in self.active_connections:
            message_text = json.dumps(message, default=str, ensure_ascii=False)
            
            # Создаем копию списка для итерации
            connections = self.active_connections[room_id].copy()
            
            for connection in connections:
                if exclude_websocket and connection == exclude_websocket:
                    continue
                    
                try:
                    await connection.send_text(message_text)
                except:
                    # Если соединение разорвано, удаляем его
                    logger.warning(f"Failed to send message to connection in room {room_id}")
                    self.disconnect(connection, room_id)

    async def send_typing_status(self, room_id: int, user_id: int, is_typing: bool, exclude_websocket: WebSocket = None):
        """Отправить статус печати"""
        message = {
            "type": "typing",
            "room_id": room_id,
            "user_id": user_id,
            "is_typing": is_typing
        }
        await self.broadcast_to_room(message, room_id, exclude_websocket)

manager = ConnectionManager()

async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: int,
    token: str
):
    """WebSocket endpoint для чата"""
    try:
        # Аутентификация пользователя по токену
        user = await get_current_user_websocket(token)
        if not user:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        # Создаем асинхронную сессию для работы с базой данных
        async with AsyncSessionLocal() as db:
            # Проверяем, что пользователь является участником комнаты
            membership = await crud.get_user_membership(db, room_id, user.id)

            if not membership:
                await websocket.close(code=4003, reason="Access denied")
                return

            await manager.connect(websocket, room_id, user.id)
            
            # Отправляем уведомление о подключении
            join_message = {
                "type": "user_joined",
                "room_id": room_id,
                "user_id": user.id,
                "username": user.username
            }
            await manager.broadcast_to_room(join_message, room_id, websocket)

            try:
                while True:
                    data = await websocket.receive_text()
                    try:
                        message_data = json.loads(data)
                        await handle_websocket_message(websocket, message_data, user, room_id)
                    except json.JSONDecodeError:
                        await manager.send_personal_message(
                            json.dumps({"type": "error", "message": "Invalid JSON format"}),
                            websocket
                        )
                    except Exception as e:
                        logger.error(f"Error handling message: {e}")
                        await manager.send_personal_message(
                            json.dumps({"type": "error", "message": "Error processing message"}),
                            websocket
                        )

            except WebSocketDisconnect:
                manager.disconnect(websocket, room_id)
                
                # Отправляем уведомление об отключении
                leave_message = {
                    "type": "user_left",
                    "room_id": room_id,
                    "user_id": user.id,
                    "username": user.username
                }
                await manager.broadcast_to_room(leave_message, room_id)

    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.close(code=1011, reason="Internal server error")

async def handle_websocket_message(
    websocket: WebSocket, 
    message_data: dict, 
    user: User, 
    room_id: int
):
    """Обработка WebSocket сообщений"""
    message_type = message_data.get("type")
    
    # Создаем асинхронную сессию для каждой операции
    async with AsyncSessionLocal() as db:
        if message_type == "chat_message":
            # Новое сообщение чата
            content = message_data.get("content", "").strip()
            if not content:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Message content cannot be empty"}),
                    websocket
                )
                return

            # Проверяем права на отправку сообщений
            membership = await crud.get_user_membership(db, room_id, user.id)

            if not membership or not membership.can_post:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "You cannot post messages in this room"}),
                    websocket
                )
                return

            # Создаем сообщение в базе данных
            message_create = schemas.ChatMessageCreate(
                room_id=room_id,
                content=content
            )
            new_message = await crud.create_message(db=db, message=message_create, sender_id=user.id)
            
            # Отправляем сообщение всем участникам комнаты
            broadcast_message = {
                "type": "new_message",
                "message": {
                    "id": new_message.id,
                    "content": new_message.content,
                    "sender_id": new_message.sender_id,
                    "sender_username": user.username,
                    "room_id": new_message.room_id,
                    "created_at": new_message.created_at,
                    "updated_at": new_message.updated_at,
                    "is_edited": new_message.is_edited
                }
            }
            await manager.broadcast_to_room(broadcast_message, room_id)

        elif message_type == "typing":
            # Статус печати
            is_typing = message_data.get("is_typing", False)
            await manager.send_typing_status(room_id, user.id, is_typing, websocket)

        elif message_type == "reaction":
            # Реакция на сообщение
            message_id = message_data.get("message_id")
            emoji = message_data.get("emoji")
            action = message_data.get("action")  # "add" или "remove"

            if not message_id or not emoji:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Missing message_id or emoji"}),
                    websocket
                )
                return

            try:
                if action == "add":
                    reaction = await crud.add_reaction(db=db, message_id=message_id, user_id=user.id, emoji=emoji)
                    
                    broadcast_message = {
                        "type": "reaction_added",
                        "message_id": message_id,
                        "user_id": user.id,
                        "emoji": emoji,
                        "reaction_id": reaction.id
                    }
                elif action == "remove":
                    success = await crud.remove_reaction(db=db, message_id=message_id, user_id=user.id, emoji=emoji)
                    if not success:
                        await manager.send_personal_message(
                            json.dumps({"type": "error", "message": "Reaction not found"}),
                            websocket
                        )
                        return
                    
                    broadcast_message = {
                        "type": "reaction_removed",
                        "message_id": message_id,
                        "user_id": user.id,
                        "emoji": emoji
                    }
                else:
                    await manager.send_personal_message(
                        json.dumps({"type": "error", "message": "Invalid reaction action"}),
                        websocket
                    )
                    return

                await manager.broadcast_to_room(broadcast_message, room_id)

            except Exception as e:
                logger.error(f"Error handling reaction: {e}")
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Error processing reaction"}),
                    websocket
                )

        elif message_type == "ping":
            # Ping для поддержания соединения
            await manager.send_personal_message(
                json.dumps({"type": "pong"}),
                websocket
            )

        else:
            await manager.send_personal_message(
                json.dumps({"type": "error", "message": f"Unknown message type: {message_type}"}),
                websocket
            )
