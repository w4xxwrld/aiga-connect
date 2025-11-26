from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.deps import get_db
from app.users.router import router as users_router
from app.users.admin_router import router as admin_users_router
from app.classes.router import router as classes_router
from app.bookings.router import router as bookings_router
from app.attendance.router import router as attendance_router
from app import models  # Import models to ensure they are registered
from app.core.middleware import error_handler_middleware, logging_middleware
from app.config import settings
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AIGA Connect API",
    description="MVP API для управления грэпплинг клубом",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.middleware("http")(error_handler_middleware)
app.middleware("http")(logging_middleware)

app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(admin_users_router, prefix="/admin/users", tags=["admin-users"])
app.include_router(classes_router, prefix="/classes", tags=["classes"])
app.include_router(bookings_router, prefix="/bookings", tags=["bookings"])
app.include_router(attendance_router, prefix="/attendance", tags=["attendance"])

@app.get("/")
def read_root():
    return {"message": "AIGA Connect - Грэпплинг клуб MVP backend", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""

    try:
        # Test database connection
        async for db in get_db():
            await db.execute(select(1))
            break
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )