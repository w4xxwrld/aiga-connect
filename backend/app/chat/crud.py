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
    
    # Add sender information
    from app.users.models import User
    sender_result = await db.execute(
        select(User).where(User.id == sender_id)
    )
    sender = sender_result.scalars().first()
    if sender:
        db_message.sender_name = sender.full_name
    else:
        db_message.sender_name = 'Unknown User'
    
    return db_message

async def get_room_messages(db: AsyncSession, room_id: int, skip: int = 0, limit: int = 50):
    """Получить сообщения комнаты"""
    result = await db.execute(
        select(models.ChatMessage).where(
            models.ChatMessage.room_id == room_id,
            models.ChatMessage.is_deleted == False
        ).order_by(desc(models.ChatMessage.created_at)).offset(skip).limit(limit)
    )
    messages = result.scalars().all()
    
    # Add sender information to each message
    for message in messages:
        # Fetch sender info
        from app.users.models import User
        sender_result = await db.execute(
            select(User).where(User.id == message.sender_id)
        )
        sender = sender_result.scalars().first()
        if sender:
            message.sender_name = sender.full_name
        else:
            message.sender_name = 'Unknown User'
    
    return messages

# Forum CRUD
async def get_forum_categories(db: AsyncSession):
    """Получить категории форума"""
    result = await db.execute(
        select(models.ForumCategory)
        .filter(models.ForumCategory.is_active == True)
        .order_by(models.ForumCategory.sort_order, models.ForumCategory.name)
    )
    return result.scalars().all()

async def get_forum_topics(db: AsyncSession, category_id: int, skip: int = 0, limit: int = 20):
    """Получить топики категории"""
    result = await db.execute(
        select(models.ForumTopic)
        .filter(
            models.ForumTopic.category_id == category_id,
            models.ForumTopic.is_approved == True
        )
        .order_by(desc(models.ForumTopic.is_pinned), desc(models.ForumTopic.updated_at))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_forum_topic(db: AsyncSession, topic_id: int):
    """Получить топик по ID"""
    result = await db.execute(
        select(models.ForumTopic).where(models.ForumTopic.id == topic_id)
    )
    return result.scalars().first()

async def create_forum_topic(db: AsyncSession, topic: schemas.ForumTopicCreate, created_by_id: int):
    """Создать новый топик"""
    db_topic = models.ForumTopic(**topic.dict(), created_by_id=created_by_id)
    db.add(db_topic)
    await db.commit()
    await db.refresh(db_topic)
    return db_topic

async def get_forum_replies(db: AsyncSession, topic_id: int, skip: int = 0, limit: int = 50):
    """Получить ответы топика"""
    result = await db.execute(
        select(models.ForumReply)
        .filter(
            models.ForumReply.topic_id == topic_id,
            models.ForumReply.is_approved == True
        )
        .order_by(models.ForumReply.created_at)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def create_forum_reply(db: AsyncSession, reply: schemas.ForumReplyCreate, author_id: int):
    """Создать новый ответ"""
    db_reply = models.ForumReply(**reply.dict(), author_id=author_id)
    db.add(db_reply)
    await db.commit()
    await db.refresh(db_reply)
    return db_reply

