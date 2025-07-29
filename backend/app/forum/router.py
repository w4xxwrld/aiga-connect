from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.forum import crud, schemas
from app.deps import get_db, get_current_user

router = APIRouter()

@router.post("/threads", response_model=schemas.ThreadResponse)
async def create_thread(
    thread: schemas.ThreadCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return await crud.create_thread(db, thread, current_user.id)

@router.get("/threads", response_model=List[schemas.ThreadResponse])
async def list_threads(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return await crud.get_threads(db)

@router.get("/threads/{thread_id}", response_model=schemas.ThreadResponse)
async def get_thread(
    thread_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    thread = await crud.get_thread(db, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread

@router.post("/threads/{thread_id}/replies", response_model=schemas.ReplyResponse)
async def create_reply(
    thread_id: int,
    reply: schemas.ReplyCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if thread_id != reply.thread_id:
        raise HTTPException(status_code=400, detail="Thread ID mismatch")
    return await crud.create_reply(db, reply, current_user.id)

@router.get("/threads/{thread_id}/replies", response_model=List[schemas.ReplyResponse])
async def list_replies(
    thread_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return await crud.get_replies(db, thread_id)
