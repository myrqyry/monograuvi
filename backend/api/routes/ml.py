"""
Machine Learning API routes.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging
import numpy as np
from functools import lru_cache

from core.ml_models import MLModelManager

router = APIRouter()
logger = logging.getLogger(__name__)

# Global instances (will be set by main.py)
_ml_manager: Optional[MLModelManager] = None

def set_global_instances(ml_manager: MLModelManager):
    """Set global instances from main.py startup."""
    global _ml_manager
    _ml_manager = ml_manager

class GenreClassificationRequest(BaseModel):
    mfcc_features: List[List[float]]

class AudioFeatures(BaseModel):
    tempo: float = Field(..., description="Tempo of the audio in BPM")
    key: str = Field(..., description="Key of the audio (e.g., C major, A minor)")
    loudness: float = Field(..., description="Loudness of the audio in dB")
    energy: float = Field(..., description="Energy level of the audio (0 to 1)")
    valence: float = Field(..., description="Valence of the audio (0 to 1)")

class MoodAnalysis(BaseModel):
    mood: str = Field(..., description="Detected mood (e.g., happy, sad)")
    confidence: float = Field(..., description="Confidence level of the mood analysis (0 to 1)")

class MoodAnalysisRequest(BaseModel):
    audio_features: AudioFeatures

class ClusteringRequest(BaseModel):
    features_matrix: List[List[float]]
    n_clusters: int = 8

class VisualParametersRequest(BaseModel):
    audio_features: AudioFeatures
    mood_analysis: MoodAnalysis

# Dependency injection with caching
@lru_cache(maxsize=1)
def get_ml_manager() -> MLModelManager:
    """Get cached MLModelManager instance."""
    if _ml_manager is None:
        raise RuntimeError("MLModelManager not initialized")
    return _ml_manager

@router.post("/classify-genre")
async def classify_genre(
    request: GenreClassificationRequest,
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Classify audio genre using MFCC features."""
    try:
        mfcc_array = np.array(request.mfcc_features)
        results = await ml_manager.classify_audio_genre(mfcc_array)

        return JSONResponse({
            "status": "success",
            "results": results
        })

    except Exception as e:
        logger.exception(f"Error classifying genre: {e}")
        raise HTTPException(status_code=500, detail="Error classifying genre")

@router.post("/analyze-mood")
async def analyze_mood(
    request: MoodAnalysisRequest,
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Analyze audio mood based on features."""
    try:
        results = await ml_manager.analyze_audio_mood(request.audio_features)

        return JSONResponse({
            "status": "success",
            "results": results
        })

    except Exception as e:
        logger.exception(f"Error analyzing mood: {e}")
        raise HTTPException(status_code=500, detail="Error analyzing mood")

@router.post("/cluster-segments")
async def cluster_segments(
    request: ClusteringRequest,
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Cluster audio segments based on features."""
    try:
        features_array = np.array(request.features_matrix)
        results = await ml_manager.cluster_audio_segments(
            features_array, request.n_clusters
        )

        return JSONResponse({
            "status": "success",
            "results": results
        })

    except Exception as e:
        logger.exception(f"Error clustering segments: {e}")
        raise HTTPException(status_code=500, detail="Error clustering segments")

@router.post("/generate-visual-params")
async def generate_visual_parameters(
    request: VisualParametersRequest,
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Generate visual parameters based on audio analysis."""
    try:
        results = await ml_manager.generate_visual_parameters(
            request.audio_features, request.mood_analysis
        )

        return JSONResponse({
            "status": "success",
            "results": results
        })

    except Exception as e:
        logger.exception(f"Error generating visual parameters: {e}")
        raise HTTPException(status_code=500, detail="Error generating visual parameters")

@router.get("/models/status")
async def get_models_status(
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Get status of all loaded ML models."""
    try:
        status = await ml_manager.get_status()

        return JSONResponse({
            "status": "success",
            "models": status
        })

    except Exception as e:
        logger.exception(f"Error getting models status: {e}")
        raise HTTPException(status_code=500, detail="Error getting models status")

@router.get("/models/genres")
async def get_genre_labels(
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Get available genre labels."""
    try:
        genres = await ml_manager.get_available_genres()
        return JSONResponse({
            "status": "success",
            "genres": genres
        })
    except Exception as e:
        logger.exception(f"Error retrieving genres: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving genres")

@router.get("/models/moods")
async def get_mood_labels(
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Get available mood labels."""
    try:
        moods = await ml_manager.get_available_moods()
        return JSONResponse({
            "status": "success",
            "moods": moods
        })
    except Exception as e:
        logger.exception(f"Error retrieving moods: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving moods")

@router.get("/health")
async def ml_health_check(
    ml_manager: MLModelManager = Depends(get_ml_manager)
):
    """Health check for ML service."""
    try:
        status = await ml_manager.get_status()
        return JSONResponse({
            "status": "healthy",
            "service": "ml_models",
            "ready": status.get("ready", False)
        })
    except Exception as e:
        logger.exception(f"Error in ML health check: {e}")
        return JSONResponse({
            "status": "unhealthy",
            "service": "ml_models",
            "error": str(e)
        })
