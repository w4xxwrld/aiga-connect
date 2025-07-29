from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, func, select
from typing import List, Optional
from datetime import datetime

from . import models, schemas

# Chat Room CRUD
async def create_chat_room(db: AsyncSession, room: schemas.ChatRoomCreate, created_by_id: int):
    """Создать новую комнату чата"""
    db_room = models.ChatRoom(**room.dict(), created_by_id=created_by_id)
    db.add(db_room)
    await db.commit()
    await db.refresh(db_room)
    
    # Автоматически добавляем создателя как администратора
    membership = models.ChatMembership(
        room_id=db_room.id,
        user_id=created_by_id,
        is_admin=True
    )
    db.add(membership)
    await db.commit()
    
    return db_room

async def get_chat_rooms(db: AsyncSession, skip: int = 0, limit: int = 100):
    """Получить список комнат чата"""
    result = await db.execute(
        select(models.ChatRoom)
        .filter(models.ChatRoom.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_user_chat_rooms(db: AsyncSession, user_id: int):
    """Получить комнаты чата пользователя"""
    result = await db.execute(
        select(models.ChatRoom).join(
            models.ChatMembership
        ).where(
            models.ChatMembership.user_id == user_id,
            models.ChatRoom.is_active == True
        )
    )
    return result.scalars().all()

async def get_chat_room(db: AsyncSession, room_id: int):
    """Получить комнату чата по ID"""
    result = await db.execute(
        select(models.ChatRoom).where(models.ChatRoom.id == room_id)
    )
    return result.scalars().first()

# Chat Message CRUD
async def create_message(db: AsyncSession, message: schemas.ChatMessageCreate, sender_id: int):
    """Создать новое сообщение"""
    db_message = models.ChatMessage(**message.dict(), sender_id=sender_id)
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message

async def get_room_messages(db: AsyncSession, room_id: int, skip: int = 0, limit: int = 50):
    """Получить сообщения комнаты"""
    result = await db.execute(
        select(models.ChatMessage).where(
            models.ChatMessage.room_id == room_id,
            models.ChatMessage.is_deleted == False
        ).order_by(desc(models.ChatMessage.created_at)).offset(skip).limit(limit)
    )
    return result.scalars().all()

