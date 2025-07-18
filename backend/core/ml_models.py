"""
Machine Learning models manager for audio analysis and video generation.
Handles model loading, inference, and caching.
"""

import numpy as np
import torch
import torch.nn as nn
import tensorflow as tf
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import joblib
from typing import Dict, List, Tuple, Optional, Any, Union
import logging
from pathlib import Path
import asyncio
from collections import OrderedDict
import time
from .config import settings

logger = logging.getLogger(__name__)

class AudioClassifier(nn.Module):
    """PyTorch model for audio genre/mood classification."""
    
    def __init__(self, input_size: int = 13, hidden_size: int = 128, num_classes: int = 8):
        super(AudioClassifier, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_size // 2, num_classes),
            nn.Softmax(dim=1)
        )
    
    def forward(self, x):
        return self.network(x)

class MLModelManager:
    """Manages machine learning models for audio and video processing."""
    
    def __init__(self):
        self.models = OrderedDict()
        self.model_cache_size = settings.MODEL_CACHE_SIZE
        self.device = self._get_device()
        self.models = OrderedDict()
        self._ready = False
        
        # Model metadata
        self.genre_labels = [
            'electronic', 'rock', 'pop', 'jazz', 'classical', 
            'hip-hop', 'ambient', 'experimental'
        ]
        self.mood_labels = [
            'energetic', 'calm', 'happy', 'sad', 'aggressive', 
            'relaxed', 'excited', 'melancholic'
        ]
    
    def _get_device(self) -> torch.device:
        """Get the appropriate device for model inference."""
        if settings.ENABLE_GPU and torch.cuda.is_available():
            return torch.device('cuda')
        return torch.device('cpu')
    
    async def load_default_models(self):
        """Load default models on startup."""
        try:
            # Load audio classifier
            await self._load_audio_classifier()
            
            # Load clustering model for audio segmentation
            await self._load_clustering_model()
            
            # Load feature scaler
            await self._load_feature_scaler()
            
            self._ready = True
            logger.info("Default ML models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading default models: {e}")
            model = None
            self._ready = False
    
    def _load_or_create_audio_classifier(self, model_path: Path):
        """Load or create audio genre/mood classifier."""
        try:
            if model_path.exists():
                # Load existing model
                model = AudioClassifier()
                model.load_state_dict(torch.load(model_path, map_location=self.device))
                model.to(self.device)
                model.eval()
                logger.info("Loaded existing audio classifier")
            else:
                # Create new model with random weights
                model = AudioClassifier()
                model.to(self.device)
                model.eval()
                # Save for future use
                model_path.parent.mkdir(parents=True, exist_ok=True)
                torch.save(model.state_dict(), model_path)
                logger.info("Created new audio classifier")
            return model
        except Exception as e:
            logger.error(f"Error loading audio classifier: {e}")
            raise

    def _load_or_create_clustering_model(self, model_path: Path):
        """Load or create clustering model for audio segmentation."""
        try:
            if model_path.exists():
                # Load existing model
                model = joblib.load(model_path)
                logger.info("Loaded existing clustering model")
            else:
                # Create new model
                model = KMeans(n_clusters=8, random_state=42)
                # Save for future use
                model_path.parent.mkdir(parents=True, exist_ok=True)
                joblib.dump(model, model_path)
                logger.info("Created new clustering model")
            return model
        except Exception as e:
            logger.error(f"Error loading clustering model: {e}")
            raise

    def _load_or_create_feature_scaler(self, scaler_path: Path):
        """Load or create feature scaler."""
        try:
            if scaler_path.exists():
                # Load existing scaler
                scaler = joblib.load(scaler_path)
                logger.info("Loaded existing feature scaler")
            else:
                # Create new scaler
                scaler = StandardScaler()
                # Save for future use
                scaler_path.parent.mkdir(parents=True, exist_ok=True)
                joblib.dump(scaler, scaler_path)
                logger.info("Created new feature scaler")
            return scaler
        except Exception as e:
            logger.error(f"Error loading feature scaler: {e}")
            raise

    async def _load_audio_classifier(self):
        """Load or create audio genre/mood classifier."""
        model_path = settings.ML_CACHE_DIR / "audio_classifier.pth"
        
        try:
            model = await asyncio.to_thread(self._load_or_create_audio_classifier, model_path)
            self.models['audio_classifier'] = model
            self._evict_cache_if_needed()
        except Exception as e:
            logger.error(f"Error loading audio classifier: {e}")
            raise
    
    async def _load_clustering_model(self):
        """Load or create clustering model for audio segmentation."""
        model_path = settings.ML_CACHE_DIR / "audio_clustering.pkl"
        
        try:
            model = await asyncio.to_thread(self._load_or_create_clustering_model, model_path)
            self.models['audio_clustering'] = model
            self._evict_cache_if_needed()
        except Exception as e:
            logger.error(f"Error loading clustering model: {e}")
            raise
    
    async def _load_feature_scaler(self):
        """Load or create feature scaler."""
        scaler_path = settings.ML_CACHE_DIR / "feature_scaler.pkl"
        
        try:
            scaler = await asyncio.to_thread(self._load_or_create_feature_scaler, scaler_path)
            self.models['feature_scaler'] = scaler
            self._evict_cache_if_needed()
        except Exception as e:
            logger.error(f"Error loading feature scaler: {e}")
            raise
    
    def _run_model_inference(self, model, features_tensor):
        """Run model inference in a separate thread."""
        with torch.no_grad():
            predictions = model(features_tensor)
        return predictions.cpu().numpy()[0]

    async def classify_audio_genre(self, mfcc_features: Union[np.ndarray, List]) -> Dict[str, Any]:
        """Classify audio genre using MFCC features."""
        try:
            if 'audio_classifier' not in self.models:
                raise ValueError("Audio classifier not loaded")
            
            model = self.models['audio_classifier']
            
            # Ensure mfcc_features is a numpy array
            if isinstance(mfcc_features, list):
                mfcc_features = np.array(mfcc_features)
            
            # Prepare features
            if len(mfcc_features.shape) > 1:
                # Average across time if needed
                features = np.mean(mfcc_features, axis=1)
            else:
                features = mfcc_features
            
            # Convert to tensor
            features_tensor = torch.FloatTensor(features).unsqueeze(0).to(self.device)
            
            # Predict
            probabilities = await asyncio.to_thread(self._run_model_inference, model, features_tensor)
            
            # Get top predictions
            top_indices = np.argsort(probabilities)[::-1][:3]
            
            results = {
                'predictions': [
                    {
                        'genre': self.genre_labels[idx],
                        'probability': float(probabilities[idx])
                    }
                    for idx in top_indices
                ],
                'top_genre': self.genre_labels[top_indices[0]],
                'confidence': float(probabilities[top_indices[0]])
            }
            
            logger.info(f"Audio genre classified: {results['top_genre']} ({results['confidence']:.2f})")
            return model
        except Exception as e:
            logger.error(f"Error classifying audio genre: {e}")
            raise
    
    def _calculate_mood_scores(self, spectral_centroid, spectral_rolloff, zero_crossing_rate, tempo):
        """Calculate mood scores based on audio features."""
        brightness = np.mean(spectral_centroid) / 4000.0  # Normalize
        energy = np.mean(spectral_rolloff) / 8000.0  # Normalize
        rhythmic_complexity = np.std(zero_crossing_rate)
        tempo_factor = min(tempo / 120.0, 2.0)  # Normalize around 120 BPM
        # Simple mood classification based on features
        mood_scores = {
            'energetic': (energy * 0.4 + tempo_factor * 0.6),
            'calm': (1 - energy) * 0.6 + (1 - tempo_factor) * 0.4,
            'happy': brightness * 0.5 + tempo_factor * 0.3 + energy * 0.2,
            'sad': (1 - brightness) * 0.5 + (1 - tempo_factor) * 0.5,
            'aggressive': energy * 0.4 + rhythmic_complexity * 0.3 + tempo_factor * 0.3,
            'relaxed': (1 - energy) * 0.5 + (1 - rhythmic_complexity) * 0.5,
            'excited': energy * 0.3 + tempo_factor * 0.4 + rhythmic_complexity * 0.3,
            'melancholic': (1 - brightness) * 0.4 + (1 - tempo_factor) * 0.4 + (1 - energy) * 0.2
        }
        return mood_scores, brightness, energy, rhythmic_complexity, tempo_factor

    async def analyze_audio_mood(self, audio_features: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze audio mood based on multiple features."""
        try:
            # Extract relevant features for mood analysis
            spectral_centroid = np.array(audio_features.get('spectral_centroid', []))
            spectral_rolloff = np.array(audio_features.get('spectral_rolloff', []))
            zero_crossing_rate = np.array(audio_features.get('zero_crossing_rate', []))
            tempo = audio_features.get('tempo', 120)
            # Calculate mood indicators
            mood_scores, brightness, energy, rhythmic_complexity, tempo_factor = await asyncio.to_thread(
                self._calculate_mood_scores, spectral_centroid, spectral_rolloff, zero_crossing_rate, tempo)
            # Normalize scores
            total_score = sum(mood_scores.values())
            normalized_scores = {mood: score / total_score for mood, score in mood_scores.items()}
            # Get top moods
            sorted_moods = sorted(normalized_scores.items(), key=lambda x: x[1], reverse=True)
            results = {
                'mood_scores': normalized_scores,
                'top_mood': sorted_moods[0][0],
                'confidence': sorted_moods[0][1],
                'secondary_moods': [
                    {'mood': mood, 'score': score}
                    for mood, score in sorted_moods[1:4]
                ],
                'features': {
                    'brightness': float(brightness),
                    'energy': float(energy),
                    'rhythmic_complexity': float(rhythmic_complexity),
                    'tempo_factor': float(tempo_factor)
                }
            }
            logger.info(f"Audio mood analyzed: {results['top_mood']} ({results['confidence']:.2f})")
            return results
        except Exception as e:
            logger.error(f"Error analyzing audio mood: {e}")
            raise
    
    async def cluster_audio_segments(self, features_matrix: np.ndarray, 
                                   n_clusters: int = 8) -> Dict[str, Any]:
        """Cluster audio segments based on features."""
        try:
            if 'audio_clustering' not in self.models:
                raise ValueError("Clustering model not loaded")
            
            # Prepare features
            if len(features_matrix.shape) != 2:
                raise ValueError("Features matrix should be 2D")
            
            # Scale features
            scaler = self.models.get('feature_scaler', StandardScaler())
            if hasattr(scaler, 'transform'):
                scaled_features = scaler.transform(features_matrix)
            else:
                scaled_features = features_matrix
            
            # Apply clustering
            clustering_model = self.models['audio_clustering']
            cluster_labels = clustering_model.predict(scaled_features)
            
            # Calculate cluster statistics
            cluster_centers = clustering_model.cluster_centers_
            cluster_sizes = np.bincount(cluster_labels)
            
            # Analyze clusters
            cluster_analysis = []
            for i in range(n_clusters):
                cluster_mask = cluster_labels == i
                cluster_features = scaled_features[cluster_mask]
                
                analysis = {
                    'cluster_id': int(i),
                    'size': int(cluster_sizes[i]),
                    'percentage': float(cluster_sizes[i] / len(cluster_labels) * 100),
                    'center': cluster_centers[i].tolist(),
                    'variance': float(np.mean(np.var(cluster_features, axis=0))),
                    'segment_indices': np.where(cluster_mask)[0].tolist()
                }
                cluster_analysis.append(analysis)
            
            results = {
                'cluster_labels': cluster_labels.tolist(),
                'n_clusters': n_clusters,
                'cluster_analysis': cluster_analysis,
                'inertia': float(clustering_model.inertia_),
                'silhouette_info': {
                    'available': False,  # Would require sklearn.metrics.silhouette_score
                    'message': "Install sklearn for silhouette analysis"
                }
            }
            
            logger.info(f"Audio clustered into {n_clusters} segments")
            return results
            
        except Exception as e:
            logger.error(f"Error clustering audio segments: {e}")
            raise
    
    def _generate_visual_parameters_logic(self, tempo, energy, brightness, top_mood, mood_analysis):
        """Generate visual parameters based on audio analysis."""
        # Color palette generation
        color_palettes = {
            'energetic': [(255, 100, 100), (255, 200, 0), (255, 150, 50)],
            'calm': [(100, 150, 255), (150, 200, 255), (200, 220, 255)],
            'happy': [(255, 200, 100), (255, 150, 200), (255, 255, 100)],
            'sad': [(100, 100, 150), (150, 150, 200), (100, 150, 200)],
            'aggressive': [(255, 50, 50), (200, 0, 0), (255, 100, 0)],
            'relaxed': [(150, 255, 150), (200, 255, 200), (100, 200, 150)],
            'excited': [(255, 0, 255), (255, 100, 255), (200, 0, 200)],
            'melancholic': [(150, 100, 150), (100, 100, 100), (150, 150, 100)]
        }
        
        # Movement parameters
        movement_speed = max(0.1, min(2.0, tempo / 120.0))
        particle_count = int(50 + energy * 200)
        
        # Visual effects parameters
        blur_intensity = max(0, min(1.0, (1 - brightness) * 0.5))
        saturation = max(0.5, min(1.5, brightness + energy))
        contrast = max(0.5, min(1.5, energy * 1.2))
        
        # Animation parameters
        beat_responsiveness = max(0.1, min(1.0, energy * 2.0))
        smooth_transitions = 1 - energy * 0.5  # More energy = less smooth
        
        return {
            'color_palette': color_palettes.get(top_mood, color_palettes['calm']),
            'movement': {
                'speed': float(movement_speed),
                'chaos': float(energy),
                'fluidity': float(1 - mood_analysis['features']['rhythmic_complexity'])
            },
            'particles': {
                'count': int(particle_count),
                'size_range': [2, int(8 + energy * 10)],
                'life_span': float(2 + (1 - energy) * 3)
            },
            'effects': {
                'blur_intensity': float(blur_intensity),
                'glow': float(brightness)
            },
            'animation': {
                'beat_responsiveness': float(beat_responsiveness),
                'smooth_transitions': float(smooth_transitions),
                'tempo_sync': True if tempo > 80 else False
            },
            'camera': {
                'shake_intensity': float(energy * 0.3),
                'zoom_variance': float(0.1 + energy * 0.2),
                'rotation_speed': float(energy * 0.5)
            }
        }

    async def generate_visual_parameters(self, audio_features: Dict[str, Any],
                                       mood_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate visual parameters based on audio analysis."""
        try:
            # Extract key features
            tempo = audio_features.get('tempo', 120)
            energy = mood_analysis['features']['energy']
            brightness = mood_analysis['features']['brightness']
            top_mood = mood_analysis['top_mood']
            
            results = await asyncio.to_thread(self._generate_visual_parameters_logic, tempo, energy, brightness, top_mood, mood_analysis)
            
            logger.info(f"Generated visual parameters for mood: {top_mood}")
            return results
            
        except Exception as e:
            logger.error(f"Error generating visual parameters: {e}")
            raise
    
    def _evict_cache_if_needed(self):
        """Evict the least recently used model if cache size exceeds limit."""
        while len(self.models) > self.model_cache_size:
            evicted_model = self.models.popitem(last=False)
            logger.info(f"Evicted model from cache: {evicted_model[0]}")

    def _get_model_details(self) -> Dict[str, Any]:
        """Get details of all loaded models."""
        details = {}
        for model_name, model in self.models.items():
            if hasattr(model, 'parameters'):
                # PyTorch model
                param_count = sum(p.numel() for p in model.parameters() if p.requires_grad)
                details[f'{model_name}_params'] = param_count
                details[f'{model_name}_device'] = str(next(model.parameters()).device)
            else:
                # Sklearn or other model
                details[f'{model_name}_type'] = type(model).__name__
        return details

    async def get_status(self) -> Dict[str, Any]:
        """Get status of all loaded models."""
        status = {
            'ready': self._ready,
            'device': str(self.device),
            'models_loaded': list(self.models.keys()),
            'cache_size': len(self.models),
            'max_cache_size': self.model_cache_size
        }
        
        model_details = await asyncio.to_thread(self._get_model_details)
        status.update(model_details)
        
        return status
    
    async def cleanup(self):
        """Cleanup models and free memory."""
        await asyncio.to_thread(self._perform_cleanup)

    def _perform_cleanup(self):
        """Perform cleanup of models and memory."""
        self.models.clear()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("ML models cleanup completed")
