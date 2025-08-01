from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.notifications import schemas, crud

router = APIRouter()

# Notification endpoints
@router.get("/", response_model=List[schemas.NotificationOut])
async def get_my_notifications(
    unread_only: bool = Query(False, description="Получить только непрочитанные"),
    limit: int = Query(50, le=100, description="Максимум уведомлений"),
    offset: int = Query(0, ge=0, description="Смещение для пагинации"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить мои уведомления"""
    notifications = await crud.get_user_notifications(
        db, current_user.id, unread_only, limit, offset
    )
    return notifications

@router.get("/unread-count", response_model=int)
async def get_unread_notifications_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить количество непрочитанных уведомлений"""
    count = await crud.get_unread_count(db, current_user.id)
    return count

@router.put("/{notification_id}/read", response_model=schemas.NotificationOut)
async def mark_notification_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отметить уведомление как прочитанное"""
    notification = await crud.mark_notification_as_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return notification

@router.put("/read-all")
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отметить все уведомления как прочитанные"""
    count = await crud.mark_all_notifications_as_read(db, current_user.id)
    return {"marked_as_read": count}

# Push Token endpoints
@router.post("/push-tokens", response_model=schemas.PushTokenOut)
async def register_push_token(
    token_data: schemas.PushTokenCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Зарегистрировать push токен для уведомлений"""
    # Устанавливаем user_id из текущего пользователя
    token_data.user_id = current_user.id
    push_token = await crud.create_or_update_push_token(db, token_data)
    return push_token

@router.delete("/push-tokens/{token}")
async def deactivate_push_token(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Деактивировать push токен"""
    success = await crud.deactivate_push_token(db, token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Push token not found"
        )
    return {"message": "Push token deactivated"}



# Admin endpoints (только для тренеров/администраторов)
@router.post("/send", response_model=schemas.NotificationOut)
async def send_notification(
    notification_data: schemas.NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить уведомление (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can send notifications"
        )
    
    notification = await crud.create_notification(db, notification_data)
    return notification

@router.post("/send-bulk", response_model=List[schemas.NotificationOut])
async def send_bulk_notifications(
    bulk_data: schemas.BulkNotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить уведомления группе пользователей (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can send bulk notifications"
        )
    
    notifications = await crud.create_bulk_notifications(db, bulk_data)
    return notifications

# Notification Templates endpoints
@router.get("/templates", response_model=List[schemas.NotificationTemplateOut])
async def get_notification_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все шаблоны уведомлений (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can view notification templates"
        )
    
    templates = await crud.get_all_notification_templates(db)
    return templates

@router.post("/templates", response_model=schemas.NotificationTemplateOut)
async def create_notification_template(
    template_data: schemas.NotificationTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать шаблон уведомления (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can create notification templates"
        )
    
    template = await crud.create_notification_template(db, template_data)
    return template
