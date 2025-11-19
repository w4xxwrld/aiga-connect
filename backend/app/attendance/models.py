from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.utils import get_utc_now
from app.core.soft_delete import SoftDeleteMixin

class Attendance(Base, SoftDeleteMixin):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)

    # QR code (3-digit code)
    qr_code = Column(String(3), nullable=False)

    # Attendance details
    attendance_date = Column(Date, nullable=False)
    marked_at = Column(DateTime, default=get_utc_now)

    # Method used to mark attendance
    method = Column(String, nullable=False, default="qr_scan")  # qr_scan or manual_entry

    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    athlete = relationship("User", foreign_keys=[athlete_id])
    class_obj = relationship("Class", foreign_keys=[class_id])
