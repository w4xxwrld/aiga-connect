from fastapi import FastAPI
from app.users.router import router as users_router
from app.classes.router import router as classes_router  
from app.bookings.router import router as bookings_router
from app.progress.router import router as progress_router
from app.notifications.router import router as notifications_router
from app.merchandise.router import router as merchandise_router
from app.chat.router import router as chat_router
from app.chat.websocket import websocket_endpoint
from app.feedback.router import router as feedback_router
from app.forum.router import router as forum_router
from app import models  # Import models to ensure they are registered

app = FastAPI(
    title="AIGA Connect API",
    description="MVP API для управления грэпплинг клубом",
    version="1.0.0"
)

app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(classes_router, prefix="/classes", tags=["classes"])
app.include_router(bookings_router, prefix="/bookings", tags=["bookings"])
app.include_router(progress_router, prefix="/progress", tags=["progress"])
app.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
app.include_router(merchandise_router, prefix="/merchandise", tags=["merchandise"])
app.include_router(chat_router, prefix="/chat", tags=["chat"])

# WebSocket endpoint для чата
@app.websocket("/ws/chat/{room_id}")
async def websocket_chat_endpoint(websocket, room_id: int, token: str):
    await websocket_endpoint(websocket, room_id, token)

@app.get("/")
def read_root():
    return {"message": "AIGA Connect - Грэпплинг клуб MVP backend", "version": "1.0.0"}
    
app.include_router(feedback_router, prefix="/feedback", tags=["feedback"])
app.include_router(forum_router, prefix="/forum", tags=["forum"])