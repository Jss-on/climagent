from pydantic_settings import BaseSettings
from typing import List
import os
from functools import lru_cache
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    APP_TITLE: str = "Knowledge Base API"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Configuration
    ALLOW_ORIGINS: List[str] = ["*"]
    ALLOW_CREDENTIALS: bool = True
    ALLOW_METHODS: List[str] = ["*"]
    ALLOW_HEADERS: List[str] = ["*"]

    # File Upload Configuration
    UPLOAD_DIR: str = "uploads"
    ALLOWED_EXTENSIONS: set = {'.pdf', '.docx', '.txt'}

    # Database Configuration
    DB_PATH: str = "lancedb"

    # Cohere Configuration
    COHERE_API_KEY: str = os.getenv("COHERE_API_KEY", "")
    COHERE_EMBED_MODEL: str = "embed-multilingual-v3.0"
    COHERE_RERANK_MODEL: str = "rerank-v3.5"

    # Text Splitting Configuration
    CHUNK_SIZE: int = 10000
    CHUNK_OVERLAP: int = 200

    # Search Configuration
    DEFAULT_SEARCH_LIMIT: int = 10
    MAX_INITIAL_RESULTS: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Create settings instance
settings = get_settings()

# Create necessary directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.DB_PATH, exist_ok=True)
