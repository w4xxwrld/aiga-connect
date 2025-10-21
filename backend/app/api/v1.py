"""API v1 router."""

from fastapi import APIRouter

from app.users.router import router as users_router
from app.classes.router import router as classes_router
from app.bookings.router import router as bookings_router


# Create v1 API router
api_v1_router = APIRouter(prefix="/api/v1")

# Include all module routers
api_v1_router.include_router(users_router, prefix="/users", tags=["users"])
api_v1_router.include_router(classes_router, prefix="/classes", tags=["classes"])
api_v1_router.include_router(bookings_router, prefix="/bookings", tags=["bookings"])


@api_v1_router.get("/health")
async def health_check():
    """Health check endpoint for v1 API."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "api_version": "v1"
    }
