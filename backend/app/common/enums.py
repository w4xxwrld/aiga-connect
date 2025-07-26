from enum import Enum

# Общие энумы для всего приложения

class WeekDay(str, Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"

class NotificationType(str, Enum):
    booking_reminder = "booking_reminder"
    booking_confirmed = "booking_confirmed"
    booking_cancelled = "booking_cancelled"
    class_cancelled = "class_cancelled"
    payment_due = "payment_due"
    payment_confirmed = "payment_confirmed"

class PaymentStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"

class Currency(str, Enum):
    kzt = "KZT"
    usd = "USD"
    eur = "EUR"

# Размеры для мерча (будущее использование)
class ClothingSize(str, Enum):
    xs = "XS"
    s = "S"
    m = "M"
    l = "L"
    xl = "XL"
    xxl = "XXL"
