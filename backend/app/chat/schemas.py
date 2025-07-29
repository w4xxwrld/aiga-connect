from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ChatType(str, Enum):
    general = "general"
    parents = "parents"
    athletes = "athletes"
    coaches = "coaches"
    announcement = "announcement"

class MessageType(str, Enum):
    text = "text"
    image = "image"
    file = "file"
    announcement = "announcement"

# Chat Room schemas
class ChatRoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    chat_type: ChatType
    is_public: bool = True
    max_members: Optional[int] = None
    is_moderated: bool = False

class ChatRoomCreate(ChatRoomBase):
    pass

class ChatRoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    max_members: Optional[int] = None
    is_moderated: Optional[bool] = None

class ChatRoomOut(ChatRoomBase):
    id: int
    is_active: bool
    created_by_id: int
    members_count: int
    last_message_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Chat Message schemas
class ChatMessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    message_type: MessageType = MessageType.text
    file_url: Optional[str] = None
    reply_to_id: Optional[int] = None

class ChatMessageCreate(ChatMessageBase):
    room_id: int

class ChatMessageUpdate(BaseModel):
    content: Optional[str] = None
    is_pinned: Optional[bool] = None

class ChatMessageOut(ChatMessageBase):
    id: int
    room_id: int
    sender_id: int
    sender_name: str
    is_edited: bool
    is_deleted: bool
    is_pinned: bool
    reactions_count: dict = {}  # {"👍": 5, "❤️": 2}
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Chat Membership schemas
class ChatMembershipBase(BaseModel):
    is_admin: bool = False
    is_moderator: bool = False
    can_post: bool = True
    notifications_enabled: bool = True

class ChatMembershipCreate(ChatMembershipBase):
    room_id: int
    user_id: int

class ChatMembershipUpdate(BaseModel):
    is_admin: Optional[bool] = None
    is_moderator: Optional[bool] = None
    can_post: Optional[bool] = None
    notifications_enabled: Optional[bool] = None

class ChatMemberOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_role: str
    is_admin: bool
    is_moderator: bool
    can_post: bool
    joined_at: datetime
    last_read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Message Reaction schemas
class MessageReactionCreate(BaseModel):
    message_id: int
    emoji: str = Field(..., min_length=1, max_length=10)

class MessageReactionOut(BaseModel):
    id: int
    message_id: int
    user_id: int
    user_name: str
    emoji: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Forum schemas
class ForumCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_moderated: bool = False
    min_role_to_post: str = "athlete"

class ForumCategoryCreate(ForumCategoryBase):
    pass

class ForumCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    is_moderated: Optional[bool] = None
    min_role_to_post: Optional[str] = None
    sort_order: Optional[int] = None

class ForumCategoryOut(ForumCategoryBase):
    id: int
    is_active: bool
    sort_order: int
    topics_count: int
    last_topic_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ForumTopicBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)

class ForumTopicCreate(ForumTopicBase):
    category_id: int

class ForumTopicUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_locked: Optional[bool] = None

class ForumTopicOut(ForumTopicBase):
    id: int
    category_id: int
    category_name: str
    created_by_id: int
    author_name: str
    views_count: int
    replies_count: int
    is_pinned: bool
    is_locked: bool
    is_approved: bool
    last_reply_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ForumReplyBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    reply_to_id: Optional[int] = None

class ForumReplyCreate(ForumReplyBase):
    topic_id: int

class ForumReplyUpdate(BaseModel):
    content: Optional[str] = None

class ForumReplyOut(ForumReplyBase):
    id: int
    topic_id: int
    author_id: int
    author_name: str
    is_edited: bool
    is_approved: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# WebSocket message schemas
class WSMessageType(str, Enum):
    join_room = "join_room"
    leave_room = "leave_room"
    send_message = "send_message"
    new_message = "new_message"
    user_typing = "user_typing"
    user_stopped_typing = "user_stopped_typing"
    room_update = "room_update"
    error = "error"

class WSMessage(BaseModel):
    type: WSMessageType
    room_id: Optional[int] = None
    message: Optional[str] = None
    data: Optional[dict] = None
