"""
Configuration settings for the backend application.
"""

import os
from pathlib import Path
from typing import List

class Settings:
    """Application settings."""
    
    # Server configuration
    HOST: str = os.getenv("HOST", "localhost")
    try:
        PORT: int = int(os.getenv("PORT", "8001"))
    except ValueError as e:
        raise ValueError("Invalid PORT environment variable. Please set it to a valid integer.") from e
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ["true", "1", "yes"]
    
    # CORS settings
    # Dynamically set allowed origins based on frontend port
    _frontend_port = os.getenv("VITE_PORT", os.getenv("FRONTEND_PORT", "5173"))
    ALLOWED_ORIGINS: List[str] = [
        f"http://localhost:{_frontend_port}",
        f"http://127.0.0.1:{_frontend_port}"
    ]
    # Optionally extend with additional origins from ALLOWED_ORIGINS env
    _extra_origins = os.getenv("ALLOWED_ORIGINS")
    if _extra_origins:
        ALLOWED_ORIGINS += [origin.strip() for origin in _extra_origins.split(",") if origin.strip()]
    
    # File upload settings
    KB: int = 1024
    MB: int = KB * 1024
    MAX_FILE_SIZE: int = 100 * MB  # 100MB
    ALLOWED_AUDIO_FORMATS: List[str] = [".mp3", ".wav", ".flac", ".ogg", ".m4a"]
    ALLOWED_VIDEO_FORMATS: List[str] = [".mp4", ".avi", ".mov", ".mkv"]
    
    # Directories
    BASE_DIR: Path = Path(__file__).parent.parent
    TEMP_AUDIO_DIR: Path = BASE_DIR / "temp" / "audio"
    TEMP_VIDEO_DIR: Path = BASE_DIR / "temp" / "video"
    TEMP_ML_DIR: Path = BASE_DIR / "temp" / "ml"
    TEMP_DIR: Path = BASE_DIR / "temp"
    AUDIO_DIR: Path = TEMP_DIR / "audio"
    VIDEO_DIR: Path = TEMP_DIR / "video"
    ML_CACHE_DIR: Path = TEMP_DIR / "ml"
    
    # Audio processing settings
    SAMPLE_RATE: int = 44100
    CHUNK_SIZE: int = 1024
    FFT_SIZE: int = 2048
    HOP_LENGTH: int = 512
    
    # ML model settings
    MODEL_CACHE_SIZE: int = 3  # Number of models to keep in memory
    ENABLE_GPU: bool = os.getenv("ENABLE_GPU", "true").lower() in ["true", "1", "yes"]
    
    # WebSocket settings
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MAX_CONNECTIONS: int = 100

    # Admin credentials for basic authentication
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin_user")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin_pass")

settings = Settings()
