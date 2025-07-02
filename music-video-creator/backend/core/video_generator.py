"""
Video generation module using moviepy and OpenCV.
Handles video creation, effects, and audio synchronization.
"""

import numpy as np
import cv2
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip, ColorClip
from moviepy.video.fx import resize, fadeout, fadein
from moviepy.audio.fx import audio_fadeout, audio_fadein
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from typing import Dict, List, Tuple, Optional, Any
import logging
from pathlib import Path
import tempfile
import os
from .config import settings

logger = logging.getLogger(__name__)

class VideoGenerator:
    """Advanced video generation and effects processing."""
    
    def __init__(self):
        self._ready = True
        self.temp_dir = settings.VIDEO_DIR
        
    def is_ready(self) -> bool:
        """Check if the video generator is ready."""
        return self._ready
    
    async def create_audio_reactive_video(self, 
                                        audio_features: Dict[str, Any],
                                        video_config: Dict[str, Any]) -> str:
        """Create an audio-reactive video based on extracted features."""
        try:
            duration = audio_features.get('duration', 30)
            fps = video_config.get('fps', 30)
            width = video_config.get('width', 1920)
            height = video_config.get('height', 1080)
            
            # Extract relevant features
            beats = audio_features.get('beats', [])
            spectral_centroid = audio_features.get('spectral_centroid', [])
            tempo = audio_features.get('tempo', 120)
            
            # Create frames
            frames = []
            total_frames = int(duration * fps)
            
            for frame_idx in range(total_frames):
                current_time = frame_idx / fps
                frame = self._generate_reactive_frame(
                    current_time, beats, spectral_centroid, tempo, width, height
                )
                frames.append(frame)
            
            # Save as video
            output_path = self.temp_dir / f"reactive_video_{int(current_time)}.mp4"
            self._save_frames_as_video(frames, str(output_path), fps)
            
            logger.info(f"Generated audio-reactive video: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error creating audio-reactive video: {e}")
            raise
    
    def _generate_reactive_frame(self, time: float, beats: List[float], 
                               spectral_centroid: List[float], tempo: float,
                               width: int, height: int) -> np.ndarray:
        """Generate a single frame based on audio features."""
        # Create base frame
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Calculate beat intensity
        beat_intensity = 0
        for beat_time in beats:
            if abs(time - beat_time) < 0.1:  # Beat detection window
                beat_intensity = max(beat_intensity, 1.0 - abs(time - beat_time) * 10)
        
        # Calculate spectral intensity
        frame_idx = int(time * 30)  # Assuming ~30 fps for features
        if frame_idx < len(spectral_centroid):
            spectral_intensity = spectral_centroid[frame_idx] / 4000.0  # Normalize
        else:
            spectral_intensity = 0.5
        
        # Create visual elements
        center_x, center_y = width // 2, height // 2
        
        # Pulsing circle based on beats
        circle_radius = int(50 + beat_intensity * 100)
        circle_color = (
            int(255 * beat_intensity),
            int(255 * spectral_intensity),
            int(255 * (1 - spectral_intensity))
        )
        cv2.circle(frame, (center_x, center_y), circle_radius, circle_color, -1)
        
        # Waveform visualization
        wave_y = center_y + int(100 * np.sin(time * tempo / 60 * 2 * np.pi))
        for x in range(0, width, 10):
            wave_intensity = spectral_intensity * np.sin(x * 0.01 + time * 5)
            wave_height = int(20 * wave_intensity)
            cv2.line(frame, (x, wave_y), (x, wave_y + wave_height), (100, 200, 255), 2)
        
        # Frequency bars
        num_bars = 32
        bar_width = width // num_bars
        for i in range(num_bars):
            if i < len(spectral_centroid):
                bar_height = int(spectral_intensity * height * 0.3)
                x = i * bar_width
                y = height - bar_height
                color_intensity = int(255 * (i / num_bars))
                cv2.rectangle(frame, (x, y), (x + bar_width - 2, height), 
                            (color_intensity, 255 - color_intensity, 128), -1)
        
        return frame
    
    def _save_frames_as_video(self, frames: List[np.ndarray], 
                            output_path: str, fps: int):
        """Save frames as MP4 video using OpenCV."""
        if not frames:
            raise ValueError("No frames to save")
        
        height, width = frames[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        for frame in frames:
            # Convert RGB to BGR for OpenCV
            frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            out.write(frame_bgr)
        
        out.release()
    
    async def create_spectrogram_video(self, audio_file: str, 
                                     spectrogram_type: str = 'mel') -> str:
        """Create a video showing animated spectrogram."""
        try:
            # This would integrate with the audio processor
            # For now, create a placeholder
            output_path = self.temp_dir / f"spectrogram_{spectrogram_type}.mp4"
            
            # Create a simple animated spectrogram
            fig, ax = plt.subplots(figsize=(12, 8))
            
            def animate(frame):
                ax.clear()
                # Simulate spectrogram data
                freq_data = np.random.random((128, 100)) * frame / 100
                ax.imshow(freq_data, aspect='auto', origin='lower')
                ax.set_title(f'{spectrogram_type.title()} Spectrogram')
                ax.set_xlabel('Time')
                ax.set_ylabel('Frequency')
            
            # Create animation
            ani = animation.FuncAnimation(fig, animate, frames=300, interval=50)
            ani.save(str(output_path), writer='ffmpeg', fps=20)
            plt.close()
            
            logger.info(f"Generated spectrogram video: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error creating spectrogram video: {e}")
            raise
    
    async def add_audio_to_video(self, video_path: str, audio_path: str) -> str:
        """Combine video with audio track."""
        try:
            video_clip = VideoFileClip(video_path)
            audio_clip = AudioFileClip(audio_path)
            
            # Adjust video duration to match audio
            if video_clip.duration != audio_clip.duration:
                video_clip = video_clip.loop(duration=audio_clip.duration)
            
            # Combine video and audio
            final_clip = video_clip.set_audio(audio_clip)
            
            output_path = self.temp_dir / f"final_video_{int(audio_clip.duration)}.mp4"
            final_clip.write_videofile(
                str(output_path),
                codec='libx264',
                audio_codec='aac',
                fps=30
            )
            
            # Cleanup
            video_clip.close()
            audio_clip.close()
            final_clip.close()
            
            logger.info(f"Combined video and audio: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error adding audio to video: {e}")
            raise
    
    async def apply_video_effects(self, video_path: str, 
                                effects: List[Dict[str, Any]]) -> str:
        """Apply various effects to a video."""
        try:
            clip = VideoFileClip(video_path)
            
            for effect in effects:
                effect_type = effect.get('type')
                
                if effect_type == 'fade_in':
                    duration = effect.get('duration', 1.0)
                    clip = fadein(clip, duration)
                    
                elif effect_type == 'fade_out':
                    duration = effect.get('duration', 1.0)
                    clip = fadeout(clip, duration)
                    
                elif effect_type == 'resize':
                    scale = effect.get('scale', 1.0)
                    clip = resize(clip, scale)
                    
                elif effect_type == 'speed':
                    factor = effect.get('factor', 1.0)
                    clip = clip.fx(lambda c: c.speedx(factor))
            
            output_path = self.temp_dir / f"effects_video_{len(effects)}.mp4"
            clip.write_videofile(str(output_path), codec='libx264', fps=30)
            
            clip.close()
            
            logger.info(f"Applied effects to video: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error applying video effects: {e}")
            raise
    
    async def create_particle_system_video(self, audio_features: Dict[str, Any],
                                         particle_config: Dict[str, Any]) -> str:
        """Create a particle system video synchronized to audio."""
        try:
            duration = audio_features.get('duration', 30)
            fps = particle_config.get('fps', 30)
            width = particle_config.get('width', 1920)
            height = particle_config.get('height', 1080)
            
            beats = audio_features.get('beats', [])
            spectral_centroid = audio_features.get('spectral_centroid', [])
            
            # Initialize particles
            num_particles = particle_config.get('num_particles', 100)
            particles = self._initialize_particles(num_particles, width, height)
            
            frames = []
            total_frames = int(duration * fps)
            
            for frame_idx in range(total_frames):
                current_time = frame_idx / fps
                
                # Update particles based on audio
                self._update_particles(particles, current_time, beats, spectral_centroid)
                
                # Render frame
                frame = self._render_particles(particles, width, height)
                frames.append(frame)
            
            # Save video
            output_path = self.temp_dir / f"particles_{num_particles}.mp4"
            self._save_frames_as_video(frames, str(output_path), fps)
            
            logger.info(f"Generated particle system video: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error creating particle system video: {e}")
            raise
    
    def _initialize_particles(self, num_particles: int, width: int, height: int) -> List[Dict]:
        """Initialize particle system."""
        particles = []
        for _ in range(num_particles):
            particle = {
                'x': np.random.uniform(0, width),
                'y': np.random.uniform(0, height),
                'vx': np.random.uniform(-2, 2),
                'vy': np.random.uniform(-2, 2),
                'size': np.random.uniform(2, 8),
                'color': (
                    np.random.randint(100, 255),
                    np.random.randint(100, 255),
                    np.random.randint(100, 255)
                ),
                'life': 1.0
            }
            particles.append(particle)
        return particles
    
    def _update_particles(self, particles: List[Dict], time: float,
                        beats: List[float], spectral_centroid: List[float]):
        """Update particle positions and properties."""
        # Check for beat events
        beat_intensity = 0
        for beat_time in beats:
            if abs(time - beat_time) < 0.1:
                beat_intensity = 1.0 - abs(time - beat_time) * 10
        
        for particle in particles:
            # Update position
            particle['x'] += particle['vx']
            particle['y'] += particle['vy']
            
            # Apply beat effects
            if beat_intensity > 0:
                particle['vx'] *= (1 + beat_intensity * 0.5)
                particle['vy'] *= (1 + beat_intensity * 0.5)
                particle['size'] *= (1 + beat_intensity * 0.3)
            
            # Boundary conditions
            if particle['x'] < 0 or particle['x'] > 1920:
                particle['vx'] *= -0.8
            if particle['y'] < 0 or particle['y'] > 1080:
                particle['vy'] *= -0.8
            
            # Update life
            particle['life'] *= 0.998
            if particle['life'] < 0.1:
                particle['life'] = 1.0
                particle['x'] = np.random.uniform(0, 1920)
                particle['y'] = np.random.uniform(0, 1080)
    
    def _render_particles(self, particles: List[Dict], width: int, height: int) -> np.ndarray:
        """Render particles to frame."""
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        for particle in particles:
            x, y = int(particle['x']), int(particle['y'])
            size = int(particle['size'] * particle['life'])
            color = tuple(int(c * particle['life']) for c in particle['color'])
            
            if 0 <= x < width and 0 <= y < height and size > 0:
                cv2.circle(frame, (x, y), size, color, -1)
        
        return frame
