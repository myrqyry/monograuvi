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
        PORT: int = int(os.getenv("PORT", "8000"))
    except ValueError as e:
        raise ValueError("Invalid PORT environment variable. Please set it to a valid integer.") from e
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ["true", "1", "yes"]
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
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

settings = Settings()
