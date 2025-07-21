from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_db
from app.users import schemas, crud

router = APIRouter()

@router.post("/", response_model=schemas.UserOut)
async def register_user(
    user: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
):
    db_user = await crud.create_user(db, user)
    return db_user