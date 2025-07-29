from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, Enum as SqlEnum
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum
from datetime import datetime

class ChatType(str, Enum):
    general = "general"  # Общий чат
    parents = "parents"  # Чат родителей
    athletes = "athletes"  # Чат спортсменов
    coaches = "coaches"  # Чат тренеров
    announcement = "announcement"  # Объявления

class MessageType(str, Enum):
    text = "text"
    image = "image"
    file = "file"
    announcement = "announcement"

class ChatRoom(Base):
    """Комнаты чата"""
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация
    name = Column(String, nullable=False)  # "Общий чат", "Родители группы A"
    description = Column(Text, nullable=True)
    chat_type = Column(SqlEnum(ChatType), nullable=False)
    
    # Настройки
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)  # Публичный или приватный
    max_members = Column(Integer, nullable=True)  # Максимум участников
    
    # Модерация
    is_moderated = Column(Boolean, default=False)  # Требует одобрения сообщений
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")
    members = relationship("ChatMembership", back_populates="room", cascade="all, delete-orphan")

class ChatMembership(Base):
    """Участники чата"""
    __tablename__ = "chat_memberships"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Роль в чате
    is_admin = Column(Boolean, default=False)
    is_moderator = Column(Boolean, default=False)
    can_post = Column(Boolean, default=True)
    
    # Настройки уведомлений
    notifications_enabled = Column(Boolean, default=True)
    
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_at = Column(DateTime, nullable=True)  # Последнее прочтение

    # Relationships
    room = relationship("ChatRoom", back_populates="members")
    user = relationship("User")

class ChatMessage(Base):
    """Сообщения в чате"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Содержимое
    message_type = Column(SqlEnum(MessageType), default=MessageType.text)
    content = Column(Text, nullable=False)
    file_url = Column(String, nullable=True)  # Для изображений/файлов
    
    # Ответ на сообщение
    reply_to_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)
    
    # Модерация
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)  # Для модерируемых чатов
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    reply_to = relationship("ChatMessage", remote_side=[id])
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")

class MessageReaction(Base):
    """Реакции на сообщения"""
    __tablename__ = "message_reactions"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    emoji = Column(String, nullable=False)  # "👍", "❤️", "😊"
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    message = relationship("ChatMessage", back_populates="reactions")
    user = relationship("User")

class ForumCategory(Base):
    """Категории форума"""
    __tablename__ = "forum_categories"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String, nullable=False)  # "Общие вопросы", "Турниры"
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # Emoji или иконка
    color = Column(String, nullable=True)  # Цвет категории
    
    # Настройки
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Модерация
    is_moderated = Column(Boolean, default=False)
    min_role_to_post = Column(String, default="athlete")  # Минимальная роль для постинга
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    topics = relationship("ForumTopic", back_populates="category", cascade="all, delete-orphan")

class ForumTopic(Base):
    """Топики форума"""
    __tablename__ = "forum_topics"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("forum_categories.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Содержимое
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    
    # Статистика
    views_count = Column(Integer, default=0)
    replies_count = Column(Integer, default=0)
    
    # Настройки
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    
    # Последняя активность
    last_reply_id = Column(Integer, ForeignKey("forum_replies.id"), nullable=True)
    last_reply_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("ForumCategory", back_populates="topics")
    created_by = relationship("User", foreign_keys=[created_by_id])
    replies = relationship("ForumReply", back_populates="topic", cascade="all, delete-orphan")
    last_reply = relationship("ForumReply", foreign_keys=[last_reply_id], post_update=True)

class ForumReply(Base):
    """Ответы в форуме"""
    __tablename__ = "forum_replies"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("forum_topics.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Содержимое
    content = Column(Text, nullable=False)
    
    # Ответ на другой ответ
    reply_to_id = Column(Integer, ForeignKey("forum_replies.id"), nullable=True)
    
    # Модерация
    is_edited = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    topic = relationship("ForumTopic", back_populates="replies", foreign_keys=[topic_id])
    author = relationship("User", foreign_keys=[author_id])
    reply_to = relationship("ForumReply", remote_side=[id])
