"""
Main FastAPI application for the music video creator backend.
Provides API endpoints for audio processing, ML inference, and video generation.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import logging
from pathlib import Path
import os
from typing import List, Dict, Any

from api.routes import audio, video, ml, websocket
from core.config import settings
from core.exceptions import MonograuviBaseException # Import custom exception
from core.audio_processor import AudioProcessor
from core.video_generator import VideoGenerator
from core.ml_models import MLModelManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize core components
audio_processor = AudioProcessor()
video_generator = VideoGenerator()
ml_manager = MLModelManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Monograuvi Backend...")
    
    # Create necessary directories
    os.makedirs(settings.TEMP_AUDIO_DIR, exist_ok=True)
    os.makedirs(settings.TEMP_VIDEO_DIR, exist_ok=True)
    os.makedirs(settings.TEMP_ML_DIR, exist_ok=True)
    
    # Initialize ML models
    await ml_manager.load_default_models()
    
    # Set global instances in route modules
    audio.set_global_instances(audio_processor, ml_manager)
    video.set_global_instances(video_generator, ml_manager)
    ml.set_global_instances(ml_manager)
    
    logger.info("Backend startup complete!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Monograuvi Backend...")
    await ml_manager.cleanup()

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Monograuvi Backend",
    description="Backend API for music video creation with audio processing and ML capabilities",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(MonograuviBaseException)
async def monograuvi_exception_handler(request: Request, exc: MonograuviBaseException):
    logger.error(f"MonograuviBaseException: {exc.message} (Error Code: {exc.error_code}, Status: {exc.status_code}) for request {request.method} {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_code": exc.error_code},
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # This handles FastAPI's built-in HTTPException and other Starlette HTTP errors
    logger.error(f"HTTPException: {exc.detail} (Status: {exc.status_code}) for request {request.method} {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": f"HTTP_{exc.status_code}"},
    )

@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError):
    logger.error(f"ValueError: {str(exc)} for request {request.method} {request.url}")
    return JSONResponse(
        status_code=400, # Bad Request
        content={"detail": str(exc), "error_code": "INVALID_INPUT_VALUE"},
    )

# Generic fallback for unhandled exceptions
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log the full traceback for unhandled exceptions for debugging
    logger.exception(f"Unhandled exception for request {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred.", "error_code": "INTERNAL_SERVER_ERROR"},
    )

# Include API routes
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])
app.include_router(video.router, prefix="/api/video", tags=["video"])
app.include_router(ml.router, prefix="/api/ml", tags=["machine-learning"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Monograuvi Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "audio_processor": audio_processor.is_ready(),
        "video_generator": video_generator.is_ready(),
        "ml_models": await ml_manager.get_status()
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
