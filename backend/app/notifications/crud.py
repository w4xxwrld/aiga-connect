from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.notifications.models import Notification, PushToken, NotificationTemplate
from app.notifications.schemas import (
    NotificationCreate, NotificationUpdate, PushTokenCreate, 
    NotificationTemplateCreate, NotificationTemplateUpdate, BulkNotificationCreate
)

# Notification CRUD
async def create_notification(db: AsyncSession, notification_data: NotificationCreate) -> Notification:
    """Создать уведомление"""
    notification = Notification(**notification_data.model_dump())
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification

async def create_bulk_notifications(db: AsyncSession, bulk_data: BulkNotificationCreate) -> List[Notification]:
    """Создать уведомления для группы пользователей"""
    notifications = []
    for user_id in bulk_data.user_ids:
        notification_data = NotificationCreate(
            user_id=user_id,
            title=bulk_data.title,
            message=bulk_data.message,
            type=bulk_data.type,
            priority=bulk_data.priority,
            data=bulk_data.data,
            scheduled_for=bulk_data.scheduled_for
        )
        notification = Notification(**notification_data.model_dump())
        notifications.append(notification)
        db.add(notification)
    
    await db.commit()
    for notification in notifications:
        await db.refresh(notification)
    return notifications

async def get_notification(db: AsyncSession, notification_id: int) -> Optional[Notification]:
    """Получить уведомление по ID"""
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    return result.scalar_one_or_none()

async def get_user_notifications(
    db: AsyncSession, 
    user_id: int, 
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0
) -> List[Notification]:
    """Получить уведомления пользователя"""
    query = select(Notification).where(Notification.user_id == user_id)
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    # Проверяем на истекшие уведомления
    now = datetime.utcnow()
    query = query.where(
        or_(Notification.expires_at.is_(None), Notification.expires_at > now)
    )
    
    query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)
    
    result = await db.execute(query)
    return result.scalars().all()

async def mark_notification_as_read(db: AsyncSession, notification_id: int, user_id: int) -> Optional[Notification]:
    """Отметить уведомление как прочитанное"""
    result = await db.execute(
        select(Notification).where(
            and_(Notification.id == notification_id, Notification.user_id == user_id)
        )
    )
    notification = result.scalar_one_or_none()
    
    if notification and not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        await db.commit()
        await db.refresh(notification)
    
    return notification

async def mark_all_notifications_as_read(db: AsyncSession, user_id: int) -> int:
    """Отметить все уведомления пользователя как прочитанные"""
    now = datetime.utcnow()
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
    )
    notifications = result.scalars().all()
    
    count = 0
    for notification in notifications:
        notification.is_read = True
        notification.read_at = now
        count += 1
    
    await db.commit()
    return count

async def get_unread_count(db: AsyncSession, user_id: int) -> int:
    """Получить количество непрочитанных уведомлений"""
    now = datetime.utcnow()
    result = await db.execute(
        select(func.count(Notification.id)).where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False,
                or_(Notification.expires_at.is_(None), Notification.expires_at > now)
            )
        )
    )
    return result.scalar()

# Push Token CRUD
async def create_or_update_push_token(db: AsyncSession, token_data: PushTokenCreate) -> PushToken:
    """Создать или обновить push токен"""
    # Сначала проверяем, существует ли токен
    result = await db.execute(
        select(PushToken).where(PushToken.token == token_data.token)
    )
    existing_token = result.scalar_one_or_none()
    
    if existing_token:
        # Обновляем существующий токен
        existing_token.user_id = token_data.user_id
        existing_token.platform = token_data.platform
        existing_token.device_info = token_data.device_info
        existing_token.is_active = True
        existing_token.last_used = datetime.utcnow()
        existing_token.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_token)
        return existing_token
    else:
        # Создаем новый токен
        push_token = PushToken(**token_data.model_dump())
        db.add(push_token)
        await db.commit()
        await db.refresh(push_token)
        return push_token

async def get_user_push_tokens(db: AsyncSession, user_id: int) -> List[PushToken]:
    """Получить активные push токены пользователя"""
    result = await db.execute(
        select(PushToken).where(
            and_(PushToken.user_id == user_id, PushToken.is_active == True)
        )
    )
    return result.scalars().all()

async def deactivate_push_token(db: AsyncSession, token: str) -> bool:
    """Деактивировать push токен"""
    result = await db.execute(
        select(PushToken).where(PushToken.token == token)
    )
    push_token = result.scalar_one_or_none()
    
    if push_token:
        push_token.is_active = False
        push_token.updated_at = datetime.utcnow()
        await db.commit()
        return True
    return False

# Notification Template CRUD
async def create_notification_template(db: AsyncSession, template_data: NotificationTemplateCreate) -> NotificationTemplate:
    """Создать шаблон уведомления"""
    template = NotificationTemplate(**template_data.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

async def get_notification_template(db: AsyncSession, notification_type: str) -> Optional[NotificationTemplate]:
    """Получить шаблон уведомления по типу"""
    result = await db.execute(
        select(NotificationTemplate).where(NotificationTemplate.type == notification_type)
    )
    return result.scalar_one_or_none()

async def get_all_notification_templates(db: AsyncSession) -> List[NotificationTemplate]:
    """Получить все шаблоны уведомлений"""
    result = await db.execute(select(NotificationTemplate))
    return result.scalars().all()

# Utility functions
def format_notification_from_template(
    template: NotificationTemplate, 
    data: Dict[str, Any]
) -> Dict[str, str]:
    """Форматировать уведомление по шаблону"""
    title = template.title_template.format(**data)
    message = template.message_template.format(**data)
    
    return {
        "title": title,
        "message": message
    }
