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

# Forum endpoints
@router.get("/forum/categories", response_model=List[schemas.ForumCategoryOut])
async def get_forum_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить категории форума"""
    return await crud.get_forum_categories(db=db)

@router.get("/forum/categories/{category_id}/topics", response_model=List[schemas.ForumTopicOut])
async def get_forum_topics(
    category_id: int,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить топики категории"""
    return await crud.get_forum_topics(db=db, category_id=category_id, skip=skip, limit=limit)

@router.post("/forum/topics", response_model=schemas.ForumTopicOut)
async def create_forum_topic(
    topic: schemas.ForumTopicCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать топик"""
    return await crud.create_forum_topic(db=db, topic=topic, created_by_id=current_user.id)

@router.get("/forum/topics/{topic_id}", response_model=schemas.ForumTopicOut)
async def get_forum_topic(
    topic_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить топик"""
    topic = await crud.get_forum_topic(db=db, topic_id=topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@router.get("/forum/topics/{topic_id}/replies", response_model=List[schemas.ForumReplyOut])
async def get_forum_replies(
    topic_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить ответы топика"""
    return await crud.get_forum_replies(db=db, topic_id=topic_id, skip=skip, limit=limit)

@router.post("/forum/replies", response_model=schemas.ForumReplyOut)
async def create_forum_reply(
    reply: schemas.ForumReplyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать ответ"""
    return await crud.create_forum_reply(db=db, reply=reply, author_id=current_user.id)
