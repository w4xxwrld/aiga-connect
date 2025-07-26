from fastapi import FastAPI
from app.users.router import router as users_router
from app.classes.router import router as classes_router  
from app.bookings.router import router as bookings_router

app = FastAPI(
    title="AIGA Connect API",
    description="MVP API для управления грэпплинг клубом",
    version="1.0.0"
)

app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(classes_router, prefix="/classes", tags=["classes"])
app.include_router(bookings_router, prefix="/bookings", tags=["bookings"])

@app.get("/")
def read_root():
    return {"message": "AIGA Connect - Грэпплинг клуб MVP backend", "version": "1.0.0"}