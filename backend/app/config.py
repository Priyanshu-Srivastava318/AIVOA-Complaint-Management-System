"""
Central configuration for the Customer Complaint Management System backend.
All secrets/URLs are read from environment variables (see .env.example).
"""
import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # --- Database ---
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5432/aivoa_complaints",
    )

    # --- Groq LLM ---
    # NOTE: the assignment mandates "gemma2-9b-it", but Groq deprecated that model on
    # 2025-08-08 in favor of llama-3.1-8b-instant (same speed/price tier, newer model).
    # We use llama-3.1-8b-instant as the fast/extraction model as a result -- see README
    # "Key Design Decisions" for the documented reasoning behind this substitution.
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL_FAST: str = os.getenv("GROQ_MODEL_FAST", "llama-3.1-8b-instant")
    GROQ_MODEL_REASONING: str = os.getenv("GROQ_MODEL_REASONING", "llama-3.3-70b-versatile")

    # --- App ---
    APP_NAME: str = "AIVOA Customer Complaint Management System"
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    MAX_UPLOAD_MB: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
