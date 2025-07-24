from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_db
from app.users import schemas, crud
from app.core.security import create_access_token

router = APIRouter()

@router.post("/", response_model=schemas.UserOut)
async def register_user(
    user: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
):
    if await crud.get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if await crud.get_user_by_iin(db, user.iin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IIN already registered",
        )

    db_user = await crud.create_user(db, user)
    return db_user

@router.post("/login", response_model=schemas.Token)
async def login_user(
    login_data: schemas.UserLogin,
    db: AsyncSession = Depends(get_db),
):
    user = await crud.authenticate_user(db, login_data.iin, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid IIN or password"
        )
    
    # Create JWT token with user info
    access_token = create_access_token(
        data={"sub": user.iin, "role": user.role.value, "user_id": user.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}