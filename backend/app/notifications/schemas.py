from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.notifications.models import NotificationType, NotificationPriority

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.normal
    data: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    user_id: int
    scheduled_for: Optional[datetime] = None
    expires_at: Optional[datetime] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None

class NotificationOut(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    is_sent: bool
    scheduled_for: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Push Token Schemas
class PushTokenBase(BaseModel):
    token: str
    platform: str  # "ios", "android", "web"
    device_info: Optional[Dict[str, Any]] = None

class PushTokenCreate(PushTokenBase):
    user_id: int

class PushTokenOut(PushTokenBase):
    id: int
    user_id: int
    is_active: bool
    last_used: datetime
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Notification Template Schemas
class NotificationTemplateBase(BaseModel):
    type: NotificationType
    title_template: str
    message_template: str
    default_priority: NotificationPriority = NotificationPriority.normal
    is_push_enabled: bool = True
    is_email_enabled: bool = False

class NotificationTemplateCreate(NotificationTemplateBase):
    pass

class NotificationTemplateUpdate(BaseModel):
    title_template: Optional[str] = None
    message_template: Optional[str] = None
    default_priority: Optional[NotificationPriority] = None
    is_push_enabled: Optional[bool] = None
    is_email_enabled: Optional[bool] = None

class NotificationTemplateOut(NotificationTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Bulk operations
class BulkNotificationCreate(BaseModel):
    """Создание уведомлений для группы пользователей"""
    user_ids: List[int]
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.normal
    data: Optional[Dict[str, Any]] = None
    scheduled_for: Optional[datetime] = None

class NotificationStats(BaseModel):
    """Статистика уведомлений"""
    total_sent: int
    total_read: int
    read_rate: float
    unread_count: int
