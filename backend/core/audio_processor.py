"""
Advanced audio processing module using librosa and other Python audio libraries.
Provides features that complement the frontend JavaScript audio processing.
"""

import numpy as np
import librosa
import librosa.display
import soundfile as sf
from typing import Dict, List, Tuple, Optional, Any
import logging
from pathlib import Path
import matplotlib.pyplot as plt
import io
import base64
from scipy import signal
from sklearn.preprocessing import StandardScaler
from .config import settings

logger = logging.getLogger(__name__)

class AudioProcessor:
    """Advanced audio processing using Python's powerful audio libraries."""
    
    def __init__(self):
        self.sample_rate = settings.SAMPLE_RATE
        self.hop_length = settings.HOP_LENGTH
        self.fft_size = settings.FFT_SIZE
        self._ready = True
        
    def is_ready(self) -> bool:
        """Check if the audio processor is ready."""
        return self._ready
    
    async def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """Load audio file and return audio data and sample rate."""
        try:
            audio_data, sr = librosa.load(file_path, sr=self.sample_rate)
            logger.info(f"Loaded audio: {len(audio_data)} samples at {sr} Hz")
            return audio_data, sr
        except Exception as e:
            logger.error(f"Error loading audio: {e}")
            raise
    
    async def extract_advanced_features(self, audio_data: np.ndarray) -> Dict[str, Any]:
        """Extract comprehensive audio features using librosa."""
        features = {}
        
        try:
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )[0]
            spectral_bandwidth = librosa.feature.spectral_bandwidth(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )[0]
            zero_crossing_rate = librosa.feature.zero_crossing_rate(
                audio_data, hop_length=self.hop_length
            )[0]
            
            # MFCC features
            mfccs = librosa.feature.mfcc(
                y=audio_data, sr=self.sample_rate, n_mfcc=13, hop_length=self.hop_length
            )
            
            # Chroma features
            chroma = librosa.feature.chroma_stft(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )
            
            # Tempo and beat tracking
            tempo, beats = librosa.beat.beat_track(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )
            
            # Onset detection
            onsets = librosa.onset.onset_detect(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )
            
            # Harmonic and percussive separation
            harmonic, percussive = librosa.effects.hpss(audio_data)
            
            features = {
                'spectral_centroid': spectral_centroids.tolist(),
                'spectral_rolloff': spectral_rolloff.tolist(),
                'spectral_bandwidth': spectral_bandwidth.tolist(),
                'zero_crossing_rate': zero_crossing_rate.tolist(),
                'mfcc': mfccs.tolist(),
                'chroma': chroma.tolist(),
                'tempo': float(tempo),
                'beats': beats.tolist(),
                'onsets': onsets.tolist(),
                'harmonic_strength': float(np.mean(np.abs(harmonic))),
                'percussive_strength': float(np.mean(np.abs(percussive))),
                'duration': len(audio_data) / self.sample_rate,
                'sample_rate': self.sample_rate
            }
            
            logger.info(f"Extracted {len(features)} audio features")
            return features
            
        except Exception as e:
            logger.error(f"Error extracting audio features: {e}")
            raise
    
    async def generate_spectrogram(self, audio_data: np.ndarray, 
                                 spec_type: str = 'mel') -> str:
        """Generate spectrogram visualization as base64 encoded image."""
        try:
            plt.figure(figsize=(12, 6))
            
            if spec_type == 'mel':
                # Mel spectrogram
                mel_spec = librosa.feature.melspectrogram(
                    y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
                )
                mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
                librosa.display.specshow(
                    mel_spec_db, sr=self.sample_rate, hop_length=self.hop_length,
                    x_axis='time', y_axis='mel', fmax=8000
                )
                plt.colorbar(format='%+2.0f dB')
                plt.title('Mel Spectrogram')
                
            elif spec_type == 'chroma':
                # Chromagram
                chroma = librosa.feature.chroma_stft(
                    y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
                )
                librosa.display.specshow(
                    chroma, sr=self.sample_rate, hop_length=self.hop_length,
                    x_axis='time', y_axis='chroma'
                )
                plt.colorbar()
                plt.title('Chromagram')
                
            elif spec_type == 'stft':
                # STFT spectrogram
                stft = librosa.stft(audio_data, hop_length=self.hop_length)
                stft_db = librosa.amplitude_to_db(np.abs(stft), ref=np.max)
                librosa.display.specshow(
                    stft_db, sr=self.sample_rate, hop_length=self.hop_length,
                    x_axis='time', y_axis='hz'
                )
                plt.colorbar(format='%+2.0f dB')
                plt.title('STFT Spectrogram')
            
            plt.tight_layout()
            
            # Convert to base64
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return f"data:image/png;base64,{image_base64}"
            
        except Exception as e:
            logger.error(f"Error generating spectrogram: {e}")
            raise
    
    async def detect_key_and_scale(self, audio_data: np.ndarray) -> Dict[str, Any]:
        """Detect musical key and scale of the audio."""
        try:
            # Extract chroma features
            chroma = librosa.feature.chroma_stft(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )
            
            # Average chroma across time
            chroma_mean = np.mean(chroma, axis=1)
            
            # Key detection using chroma profile correlation
            key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            
            # Major and minor scale templates
            major_template = np.array([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1])
            minor_template = np.array([1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0])
            
            correlations_major = []
            correlations_minor = []
            
            for shift in range(12):
                major_shifted = np.roll(major_template, shift)
                minor_shifted = np.roll(minor_template, shift)
                
                corr_major = np.corrcoef(chroma_mean, major_shifted)[0, 1]
                corr_minor = np.corrcoef(chroma_mean, minor_shifted)[0, 1]
                
                correlations_major.append(corr_major)
                correlations_minor.append(corr_minor)
            
            best_major_idx = np.argmax(correlations_major)
            best_minor_idx = np.argmax(correlations_minor)
            
            best_major_corr = correlations_major[best_major_idx]
            best_minor_corr = correlations_minor[best_minor_idx]
            
            if best_major_corr > best_minor_corr:
                detected_key = key_names[best_major_idx]
                detected_scale = 'major'
                confidence = best_major_corr
            else:
                detected_key = key_names[best_minor_idx]
                detected_scale = 'minor'
                confidence = best_minor_corr
            
            return {
                'key': detected_key,
                'scale': detected_scale,
                'confidence': float(confidence),
                'chroma_profile': chroma_mean.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error detecting key and scale: {e}")
            raise
    
    async def segment_audio(self, audio_data: np.ndarray) -> Dict[str, Any]:
        """Segment audio into structural parts (verse, chorus, etc.)."""
        try:
            # Use recurrence matrix for structural segmentation
            chroma = librosa.feature.chroma_stft(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )
            
            # Compute recurrence matrix
            R = librosa.segment.recurrence_matrix(
                chroma, mode='affinity', metric='cosine'
            )
            
            # Detect boundaries
            boundaries = librosa.segment.agglomerative(
                R, k=8  # Number of segments
            )
            
            # Convert frame indices to time
            boundary_times = librosa.frames_to_time(
                boundaries, sr=self.sample_rate, hop_length=self.hop_length
            )
            
            # Create segments
            segments = []
            for i in range(len(boundary_times) - 1):
                start_time = boundary_times[i]
                end_time = boundary_times[i + 1]
                duration = end_time - start_time
                
                segments.append({
                    'start': float(start_time),
                    'end': float(end_time),
                    'duration': float(duration),
                    'segment_id': i
                })
            
            return {
                'segments': segments,
                'num_segments': len(segments),
                'total_duration': len(audio_data) / self.sample_rate
            }
            
        except Exception as e:
            logger.error(f"Error segmenting audio: {e}")
            raise
    
    async def extract_rhythm_features(self, audio_data: np.ndarray) -> Dict[str, Any]:
        """Extract detailed rhythm and timing features."""
        try:
            # Tempo and beat tracking
            tempo, beats = librosa.beat.beat_track(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )
            
            # Beat synchronous features
            beat_chroma = librosa.util.sync(
                librosa.feature.chroma_stft(y=audio_data, sr=self.sample_rate),
                beats
            )
            
            # Onset detection with different methods
            onsets_energy = librosa.onset.onset_detect(
                y=audio_data, sr=self.sample_rate, units='time'
            )
            onsets_spectral = librosa.onset.onset_detect(
                y=audio_data, sr=self.sample_rate, onset_envelope=librosa.onset.onset_strength(
                    y=audio_data, sr=self.sample_rate, feature=librosa.feature.melspectrogram
                ), units='time'
            )
            
            # Rhythm patterns
            tempogram = librosa.feature.tempogram(
                y=audio_data, sr=self.sample_rate, hop_length=self.hop_length
            )
            
            return {
                'tempo': float(tempo),
                'beats': librosa.frames_to_time(beats, sr=self.sample_rate).tolist(),
                'beat_chroma': beat_chroma.tolist(),
                'onsets_energy': onsets_energy.tolist(),
                'onsets_spectral': onsets_spectral.tolist(),
                'tempogram': tempogram.tolist(),
                'rhythm_strength': float(np.std(tempogram))
            }
            
        except Exception as e:
            logger.error(f"Error extracting rhythm features: {e}")
            raise
