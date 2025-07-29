from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.forum.models import Thread, Post
from app.forum.schemas import ThreadCreate, ReplyCreate

async def create_thread(db: AsyncSession, thread_data: ThreadCreate, author_id: int) -> Thread:
    db_thread = Thread(
        title=thread_data.title,
        content=thread_data.content,
        category_id=thread_data.category_id,
        created_by_id=author_id
    )
    db.add(db_thread)
    await db.commit()
    await db.refresh(db_thread)
    return db_thread

async def get_threads(db: AsyncSession) -> List[Thread]:
    result = await db.execute(
        select(Thread).order_by(Thread.created_at.desc())
    )
    return result.scalars().all()

async def get_thread(db: AsyncSession, thread_id: int) -> Thread:
    result = await db.execute(
        select(Thread).where(Thread.id == thread_id)
    )
    return result.scalar_one_or_none()

async def create_reply(db: AsyncSession, reply_data: ReplyCreate, author_id: int) -> Post:
    db_reply = Post(
        thread_id=reply_data.thread_id,
        content=reply_data.content,
        author_id=author_id
    )
    db.add(db_reply)
    await db.commit()
    await db.refresh(db_reply)
    return db_reply

async def get_replies(db: AsyncSession, thread_id: int) -> List[Post]:
    result = await db.execute(
        select(Post).where(Post.thread_id == thread_id).order_by(Post.created_at)
    )
    return result.scalars().all()
