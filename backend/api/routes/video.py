"""
Video generation API routes.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
import tempfile
import os
from pathlib import Path
from functools import lru_cache

from core.video_generator import VideoGenerator
from core.ml_models import MLModelManager
from utils.file_validator import file_validator

router = APIRouter()
logger = logging.getLogger(__name__)

# Global instances (will be set by main.py)
_video_generator: Optional[VideoGenerator] = None
_ml_manager: Optional[MLModelManager] = None

def set_global_instances(video_generator: VideoGenerator, ml_manager: MLModelManager):
    """Set global instances from main.py startup."""
    global _video_generator, _ml_manager
    _video_generator = video_generator
    _ml_manager = ml_manager

async def validate_audio_file(file: UploadFile) -> bytes:
    """
    Validate audio file and return file content.
    
    Args:
        file: Uploaded file
        
    Returns:
        File content as bytes
        
    Raises:
        HTTPException: If file validation fails
    """
    try:
        # Read file content
        content = await file.read()
        
        # Validate file using robust validation
        is_valid, error_message = file_validator.validate_audio_file(content, file.filename)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Audio file validation failed: {error_message}")
        
        logger.info(f"Audio file validation passed: {file.filename}")
        return content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating audio file {file.filename}: {e}")
        raise HTTPException(status_code=400, detail=f"Audio file validation error: {str(e)}")

async def validate_video_file(file: UploadFile) -> bytes:
    """
    Validate video file and return file content.
    
    Args:
        file: Uploaded file
        
    Returns:
        File content as bytes
        
    Raises:
        HTTPException: If file validation fails
    """
    try:
        # Read file content
        content = await file.read()
        
        # Validate file using robust validation
        is_valid, error_message = file_validator.validate_video_file(content, file.filename)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Video file validation failed: {error_message}")
        
        logger.info(f"Video file validation passed: {file.filename}")
        return content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating video file {file.filename}: {e}")
        raise HTTPException(status_code=400, detail=f"Video file validation error: {str(e)}")

class VideoConfig(BaseModel):
    fps: int = 30
    width: int = 1920
    height: int = 1080
    duration: Optional[float] = None

class ParticleConfig(BaseModel):
    num_particles: int = 100
    fps: int = 30
    width: int = 1920
    height: int = 1080

class EffectConfig(BaseModel):
    type: str
    duration: Optional[float] = None
    scale: Optional[float] = None
    factor: Optional[float] = None

# Dependency injection with caching
@lru_cache(maxsize=1)
def get_video_generator() -> VideoGenerator:
    """Get cached VideoGenerator instance."""
    if _video_generator is None:
        # Fallback to creating new instance if not set by main.py
        return VideoGenerator()
    return _video_generator

@lru_cache(maxsize=1)
def get_ml_manager() -> MLModelManager:
    """Get cached MLModelManager instance."""
    if _ml_manager is None:
        # Fallback to creating new instance if not set by main.py
        return MLModelManager()
    return _ml_manager

class ReactiveVideoRequest(BaseModel):
    audio_features: Dict[str, Any]
    video_config: VideoConfig

@router.post("/create-reactive")
async def create_reactive_video(
    request: ReactiveVideoRequest,
    video_generator: VideoGenerator = Depends(get_video_generator)
):
    """Create an audio-reactive video from extracted audio features."""
    try:
        # Generate video
        video_path = await video_generator.create_audio_reactive_video(
            request.audio_features, request.video_config.dict()
        )
        
        return JSONResponse({
            "status": "success",
            "video_path": video_path,
            "config": request.video_config.dict()
        })
        
    except Exception as e:
        logger.error(f"Error creating reactive video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-spectrogram")
async def create_spectrogram_video(
    audio_file: UploadFile = File(...),
    spectrogram_type: str = "mel",
    video_generator: VideoGenerator = Depends(get_video_generator)
):
    """Create a spectrogram visualization video."""
    try:
        # Validate audio file using robust validation
        content = await validate_audio_file(audio_file)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio_file.filename).suffix) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Generate spectrogram video
            video_path = await video_generator.create_spectrogram_video(
                tmp_file_path, spectrogram_type
            )
            
            return JSONResponse({
                "status": "success",
                "video_path": video_path,
                "spectrogram_type": spectrogram_type,
                "audio_filename": audio_file.filename
            })
            
        finally:
            # Cleanup temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except Exception as e:
        logger.error(f"Error creating spectrogram video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ParticleVideoRequest(BaseModel):
    audio_features: Dict[str, Any]
    particle_config: ParticleConfig

@router.post("/create-particles")
async def create_particle_video(
    request: ParticleVideoRequest,
    video_generator: VideoGenerator = Depends(get_video_generator)
):
    """Create a particle system video synchronized to audio."""
    try:
        # Generate particle video
        video_path = await video_generator.create_particle_system_video(
            request.audio_features, request.particle_config.dict()
        )
        
        return JSONResponse({
            "status": "success",
            "video_path": video_path,
            "particle_config": request.particle_config.dict()
        })
        
    except Exception as e:
        logger.error(f"Error creating particle video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add-audio")
async def add_audio_to_video(
    video_file: UploadFile = File(...),
    audio_file: UploadFile = File(...),
    video_generator: VideoGenerator = Depends(get_video_generator)
):
    """Combine video with audio track."""
    try:
        # Validate files using robust validation
        video_content = await validate_video_file(video_file)
        audio_content = await validate_audio_file(audio_file)
        
        # Save uploaded files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(video_file.filename).suffix) as video_tmp:
            video_tmp.write(video_content)
            video_tmp_path = video_tmp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio_file.filename).suffix) as audio_tmp:
            audio_tmp.write(audio_content)
            audio_tmp_path = audio_tmp.name
        
        try:
            # Combine video and audio
            output_path = await video_generator.add_audio_to_video(
                video_tmp_path, audio_tmp_path
            )
            
            return JSONResponse({
                "status": "success",
                "output_path": output_path,
                "video_filename": video_file.filename,
                "audio_filename": audio_file.filename
            })
            
        finally:
            # Cleanup temporary files
            for tmp_path in [video_tmp_path, audio_tmp_path]:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                
    except Exception as e:
        logger.error(f"Error adding audio to video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/apply-effects")
async def apply_video_effects(
    effects: List[EffectConfig],
    video_file: UploadFile = File(...),
    video_generator: VideoGenerator = Depends(get_video_generator)
):
    """Apply effects to a video."""
    try:
        # Validate video file using robust validation
        content = await validate_video_file(video_file)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(video_file.filename).suffix) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Convert effects to dict format
            effects_dict = [effect.dict(exclude_none=True) for effect in effects]
            
            # Apply effects
            output_path = await video_generator.apply_video_effects(
                tmp_file_path, effects_dict
            )
            
            return JSONResponse({
                "status": "success",
                "output_path": output_path,
                "effects_applied": effects_dict,
                "input_filename": video_file.filename
            })
            
        finally:
            # Cleanup temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except Exception as e:
        logger.error(f"Error applying video effects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class MoodVideoRequest(BaseModel):
    audio_features: Dict[str, Any]
    mood_analysis: Dict[str, Any]
    video_config: VideoConfig

@router.post("/generate-from-mood")
async def generate_video_from_mood(
    request: MoodVideoRequest,
    video_generator: VideoGenerator = Depends(get_video_generator),
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Generate video with visual parameters based on mood analysis."""
    try:
        # Generate visual parameters from mood
        visual_params = await ml_manager.generate_visual_parameters(
            request.audio_features, request.mood_analysis
        )
        
        # Create enhanced video config with visual parameters
        enhanced_config = request.video_config.dict()
        enhanced_config.update({
            "visual_parameters": visual_params,
            "mood_based": True
        })
        
        # Generate video
        video_path = await video_generator.create_audio_reactive_video(
            request.audio_features, enhanced_config
        )
        
        return JSONResponse({
            "status": "success",
            "video_path": video_path,
            "visual_parameters": visual_params,
            "mood": request.mood_analysis.get("top_mood"),
            "config": enhanced_config
        })
        
    except Exception as e:
        logger.error(f"Error generating mood-based video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
async def download_video(filename: str):
    """Download generated video file."""
    try:
        # Construct file path (in production, add proper security checks)
        file_path = Path("backend/temp/video") / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="video/mp4"
        )
        
    except Exception as e:
        logger.error(f"Error downloading video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def video_health_check(
    video_generator: VideoGenerator = Depends(get_video_generator)
):
    """Health check for video generation service."""
    return JSONResponse({
        "status": "healthy",
        "service": "video_generator",
        "ready": video_generator.is_ready()
    })

@router.get("/formats")
async def get_supported_formats():
    """Get supported video and audio formats."""
    return JSONResponse({
        "video_formats": [".mp4", ".avi", ".mov", ".mkv"],
        "audio_formats": [".mp3", ".wav", ".flac", ".ogg", ".m4a"],
        "output_formats": [".mp4"],
        "codecs": {
            "video": ["libx264", "mp4v"],
            "audio": ["aac", "mp3"]
        }
    })
