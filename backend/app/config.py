import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/learning_copilot.db")

# ChromaDB settings
CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", str(BASE_DIR / "chroma_db"))

# Uploads settings
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Default Gemini API Key (can also be passed in headers)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Default Models
DEFAULT_LLM_MODEL = "gemini-1.5-flash"
REASONING_LLM_MODEL = "gemini-1.5-pro"
EMBEDDING_MODEL = "models/text-embedding-004"
