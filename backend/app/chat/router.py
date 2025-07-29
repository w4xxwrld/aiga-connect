from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.deps import get_db, get_current_user
from app.users.models import User
from . import crud, schemas

router = APIRouter()

@router.get("/rooms", response_model=List[schemas.ChatRoomOut])
async def get_chat_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список комнат"""
    return await crud.get_chat_rooms(db=db)

@router.post("/rooms", response_model=schemas.ChatRoomOut)
async def create_chat_room(
    room: schemas.ChatRoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать комнату"""
    return await crud.create_chat_room(db=db, room=room, created_by_id=current_user.id)

@router.get("/rooms/{room_id}/messages", response_model=List[schemas.ChatMessageOut])
async def get_room_messages(
    room_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить сообщения"""
    return await crud.get_room_messages(db=db, room_id=room_id, skip=skip, limit=limit)

@router.post("/messages", response_model=schemas.ChatMessageOut)
async def create_message(
    message: schemas.ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать сообщение"""
    return await crud.create_message(db=db, message=message, sender_id=current_user.id)
