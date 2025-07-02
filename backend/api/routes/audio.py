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

from core.audio_processor import AudioProcessor
from core.ml_models import MLModelManager

router = APIRouter()
logger = logging.getLogger(__name__)

# Dependency injection
def get_audio_processor() -> AudioProcessor:
    return AudioProcessor()

def get_ml_manager() -> MLModelManager:
    return MLModelManager()

@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    audio_processor: AudioProcessor = Depends(get_audio_processor)
):
    """Upload and process audio file."""
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.mp3', '.wav', '.flac', '.ogg', '.m4a')):
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
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
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
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
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
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
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
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
