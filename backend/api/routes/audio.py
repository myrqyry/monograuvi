"""
Audio processing API routes.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import logging
import tempfile
import os
from pathlib import Path
from functools import lru_cache

from core.audio_processor import AudioProcessor
from core.ml_models import MLModelManager
from utils.file_validator import file_validator

router = APIRouter()
logger = logging.getLogger(__name__)

# Global instances (will be set by main.py)
_audio_processor: Optional[AudioProcessor] = None
_ml_manager: Optional[MLModelManager] = None

def set_global_instances(audio_processor: AudioProcessor, ml_manager: MLModelManager):
    """Set global instances from main.py startup."""
    global _audio_processor, _ml_manager
    _audio_processor = audio_processor
    _ml_manager = ml_manager
    logger.info("Global instances set for audio routes")

# Dependency injection with caching
@lru_cache(maxsize=1)
def get_audio_processor() -> AudioProcessor:
    """Get cached AudioProcessor instance."""
    if _audio_processor is None:
        # Fallback to creating new instance if not set by main.py
        logger.info("Creating new AudioProcessor instance (fallback)")
        return AudioProcessor()
    logger.debug("Using pre-initialized AudioProcessor instance")
    return _audio_processor

@lru_cache(maxsize=1)
def get_ml_manager() -> MLModelManager:
    """Get cached MLModelManager instance."""
    if _ml_manager is None:
        # Fallback to creating new instance if not set by main.py
        logger.info("Creating new MLModelManager instance (fallback)")
        return MLModelManager()
    logger.debug("Using pre-initialized MLModelManager instance")
    return _ml_manager

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
            raise HTTPException(status_code=400, detail=f"File validation failed: {error_message}")
        
        logger.info(f"Audio file validation passed: {file.filename}")
        return content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating audio file {file.filename}: {e}")
        raise HTTPException(status_code=400, detail=f"File validation error: {str(e)}")

@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    audio_processor: AudioProcessor = Depends(get_audio_processor)
):
    """Upload and process audio file."""
    try:
        # Validate file using robust validation
        content = await validate_audio_file(file)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Load and process audio
            audio_data, sample_rate = await audio_processor.load_audio(tmp_file_path)
            
            # Extract basic features
            features = await audio_processor.extract_advanced_features(audio_data)
            
            return JSONResponse({
                "status": "success",
                "filename": file.filename,
                "duration": features.get("duration"),
                "sample_rate": sample_rate,
                "features": features,
                "temp_file": tmp_file_path
            })
            
        finally:
            # Cleanup temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing audio upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    analysis_type: str = "full",
    audio_processor: AudioProcessor = Depends(get_audio_processor),
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Perform comprehensive audio analysis."""
    try:
        # Validate file using robust validation
        content = await validate_audio_file(file)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Load audio
            audio_data, sample_rate = await audio_processor.load_audio(tmp_file_path)
            
            # Extract features based on analysis type
            results = {"filename": file.filename}
            
            if analysis_type in ["full", "features"]:
                features = await audio_processor.extract_advanced_features(audio_data)
                results["features"] = features
            
            if analysis_type in ["full", "key"]:
                key_analysis = await audio_processor.detect_key_and_scale(audio_data)
                results["key_analysis"] = key_analysis
            
            if analysis_type in ["full", "segments"]:
                segmentation = await audio_processor.segment_audio(audio_data)
                results["segmentation"] = segmentation
            
            if analysis_type in ["full", "rhythm"]:
                rhythm = await audio_processor.extract_rhythm_features(audio_data)
                results["rhythm"] = rhythm
            
            if analysis_type in ["full", "mood"]:
                # Get basic features first if not already extracted
                if "features" not in results:
                    features = await audio_processor.extract_advanced_features(audio_data)
                    results["features"] = features
                
                mood_analysis = await ml_manager.analyze_audio_mood(results["features"])
                results["mood_analysis"] = mood_analysis
            
            if analysis_type in ["full", "genre"]:
                # Get MFCC features for genre classification
                if "features" not in results:
                    features = await audio_processor.extract_advanced_features(audio_data)
                    results["features"] = features
                
                mfcc_features = results["features"].get("mfcc", [])
                if mfcc_features:
                    genre_analysis = await ml_manager.classify_audio_genre(mfcc_features)
                    results["genre_analysis"] = genre_analysis
            
            return JSONResponse({
                "status": "success",
                "analysis_type": analysis_type,
                "results": results
            })
            
        finally:
            # Cleanup temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/spectrogram")
async def generate_spectrogram(
    file: UploadFile = File(...),
    spec_type: str = "mel",
    audio_processor: AudioProcessor = Depends(get_audio_processor)
):
    """Generate spectrogram visualization."""
    try:
        # Validate spectrogram type
        if spec_type not in ["mel", "chroma", "stft"]:
            raise HTTPException(status_code=400, detail="Invalid spectrogram type")
        
        # Validate file using robust validation
        content = await validate_audio_file(file)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Load audio
            audio_data, sample_rate = await audio_processor.load_audio(tmp_file_path)
            
            # Generate spectrogram
            spectrogram_b64 = await audio_processor.generate_spectrogram(audio_data, spec_type)
            
            return JSONResponse({
                "status": "success",
                "spectrogram_type": spec_type,
                "spectrogram": spectrogram_b64,
                "sample_rate": sample_rate,
                "duration": len(audio_data) / sample_rate
            })
            
        finally:
            # Cleanup temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating spectrogram: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-features")
async def extract_audio_features(
    file: UploadFile = File(...),
    feature_types: str = "all",
    audio_processor: AudioProcessor = Depends(get_audio_processor)
):
    """Extract specific audio features."""
    try:
        # Validate file using robust validation
        content = await validate_audio_file(file)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Load audio
            audio_data, sample_rate = await audio_processor.load_audio(tmp_file_path)
            
            # Extract requested features
            features = {}
            
            if feature_types in ["all", "spectral"]:
                advanced_features = await audio_processor.extract_advanced_features(audio_data)
                features.update({
                    "spectral_centroid": advanced_features.get("spectral_centroid"),
                    "spectral_rolloff": advanced_features.get("spectral_rolloff"),
                    "spectral_bandwidth": advanced_features.get("spectral_bandwidth"),
                    "zero_crossing_rate": advanced_features.get("zero_crossing_rate")
                })
            
            if feature_types in ["all", "mfcc"]:
                if "mfcc" not in features:
                    advanced_features = await audio_processor.extract_advanced_features(audio_data)
                features["mfcc"] = advanced_features.get("mfcc")
            
            if feature_types in ["all", "chroma"]:
                if "chroma" not in features:
                    advanced_features = await audio_processor.extract_advanced_features(audio_data)
                features["chroma"] = advanced_features.get("chroma")
            
            if feature_types in ["all", "rhythm"]:
                rhythm_features = await audio_processor.extract_rhythm_features(audio_data)
                features["rhythm"] = rhythm_features
            
            return JSONResponse({
                "status": "success",
                "feature_types": feature_types,
                "features": features,
                "metadata": {
                    "sample_rate": sample_rate,
                    "duration": len(audio_data) / sample_rate,
                    "filename": file.filename
                }
            })
            
        finally:
            # Cleanup temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting audio features: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def audio_health_check(
    audio_processor: AudioProcessor = Depends(get_audio_processor)
):
    """Health check for audio processing service."""
    return JSONResponse({
        "status": "healthy",
        "service": "audio_processor",
        "ready": audio_processor.is_ready()
    })
