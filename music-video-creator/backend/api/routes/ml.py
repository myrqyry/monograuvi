"""
Machine Learning API routes.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List
import logging
import numpy as np

from core.ml_models import MLModelManager

router = APIRouter()
logger = logging.getLogger(__name__)

class GenreClassificationRequest(BaseModel):
    mfcc_features: List[List[float]]

class MoodAnalysisRequest(BaseModel):
    audio_features: Dict[str, Any]

class ClusteringRequest(BaseModel):
    features_matrix: List[List[float]]
    n_clusters: int = 8

class VisualParametersRequest(BaseModel):
    audio_features: Dict[str, Any]
    mood_analysis: Dict[str, Any]

# Dependency injection
def get_ml_manager() -> MLModelManager:
    return MLModelManager()

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
        logger.error(f"Error classifying genre: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        logger.error(f"Error analyzing mood: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        logger.error(f"Error clustering segments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        logger.error(f"Error generating visual parameters: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        logger.error(f"Error getting models status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/genres")
async def get_genre_labels():
    """Get available genre labels."""
    return JSONResponse({
        "status": "success",
        "genres": [
            'electronic', 'rock', 'pop', 'jazz', 'classical', 
            'hip-hop', 'ambient', 'experimental'
        ]
    })

@router.get("/models/moods")
async def get_mood_labels():
    """Get available mood labels."""
    return JSONResponse({
        "status": "success",
        "moods": [
            'energetic', 'calm', 'happy', 'sad', 'aggressive', 
            'relaxed', 'excited', 'melancholic'
        ]
    })

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
        logger.error(f"Error in ML health check: {e}")
        return JSONResponse({
            "status": "unhealthy",
            "service": "ml_models",
            "error": str(e)
        })
