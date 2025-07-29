from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Thread(Base):
    __tablename__ = "forum_threads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by = relationship("User", foreign_keys=[created_by_id])
    posts = relationship("Post", back_populates="thread")

class Post(Base):
    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("forum_threads.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    thread = relationship("Thread", back_populates="posts")
    author = relationship("User", foreign_keys=[author_id])
