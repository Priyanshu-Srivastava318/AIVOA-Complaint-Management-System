from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import complaints, ai_assistant

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Customer Complaint Management System for pharmaceutical "
                 "(API & FDF) manufacturing QMS, built with FastAPI + LangGraph + Groq.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints.router)
app.include_router(ai_assistant.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/health")
def health():
    return {"status": "healthy"}
