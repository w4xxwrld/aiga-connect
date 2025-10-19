from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.users.router import router as users_router
from app.classes.router import router as classes_router
from app.bookings.router import router as bookings_router
from app.merchandise.router import router as merchandise_router
from app.feedback.router import router as feedback_router
from app import models  # Import models to ensure they are registered
from app.config import settings
from app.core.middleware import error_handler_middleware, logging_middleware
from app.api.v1 import api_v1_router

app = FastAPI(
    title="AIGA Connect API",
    description="MVP API для управления грэпплинг клубом",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Add middleware (order matters - they execute in reverse order of adding)
# Logging middleware
app.middleware("http")(logging_middleware)

# Error handler middleware
app.middleware("http")(error_handler_middleware)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 (versioned routes)
app.include_router(api_v1_router)

# Legacy routes (for backward compatibility - will be deprecated in future)
app.include_router(users_router, prefix="/users", tags=["users (legacy)"])
app.include_router(classes_router, prefix="/classes", tags=["classes (legacy)"])
app.include_router(bookings_router, prefix="/bookings", tags=["bookings (legacy)"])
app.include_router(merchandise_router, prefix="/merchandise", tags=["merchandise (legacy)"])
app.include_router(feedback_router, prefix="/feedback", tags=["feedback (legacy)"])

@app.get("/")
def read_root():
    """Root endpoint with API information."""
    return {
        "message": "AIGA Connect - Грэпплинг клуб MVP backend",
        "version": "1.0.0",
        "api_versions": {
            "v1": "/api/v1",
            "legacy": "/"
        },
        "documentation": {
            "swagger": "/api/docs",
            "redoc": "/api/redoc"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}