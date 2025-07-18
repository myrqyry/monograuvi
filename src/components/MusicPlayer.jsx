// src/components/MusicPlayer.jsx
import React, { useRef, useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '../store';
import WaveformTimeline from './WaveformTimeline';
import axiosInstance from '../api/axiosInstance';

// storeSelector defined outside the component for stability
const storeSelector = state => ({
  audioContext: state.audioContext,
  isPlaying: state.isPlaying,
  // Remove currentTime from global store selector
  duration: state.duration,
  setAudioBuffer: state.setAudioBuffer,
  setCurrentTime: state.setCurrentTime,
  setIsPlaying: state.setIsPlaying,
  setDuration: state.setDuration,
  setAudioMetadata: state.setAudioMetadata,
  audioMetadata: state.audioMetadata,
  setAudioContext: state.setAudioContext
});

function MusicPlayer({ audioRef, onAudioLoad }) {
  const audioElementRef = useRef(null);
  const titleRef = useRef(null);
  const artistRef = useRef(null);
  const [trackTitle, setTrackTitle] = useState('No Track Loaded');
  const [trackArtist, setTrackArtist] = useState('');
  const [volume, setVolume] = useState(1);
  const [titleNeedsScroll, setTitleNeedsScroll] = useState(false);
  const [artistNeedsScroll, setArtistNeedsScroll] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(true);
  const [audioUrl, setAudioUrl] = useState(null);
  const [localCurrentTime, setLocalCurrentTime] = useState(0); // Local playback position
  const timeoutRef = useRef(null);

  // Get stable store object
  const store = useStore(storeSelector, shallow);

  // Extract bpm and key for display, handling potential null values
  let displayBpm = 'N/A';
  if (typeof audioMetadata?.tempo === 'number' && !isNaN(audioMetadata.tempo)) {
    displayBpm = Math.round(audioMetadata.tempo);
  } else if (audioMetadata?.tempo) {
    displayBpm = String(audioMetadata.tempo);
  }

  const displayKey = audioMetadata?.key || 'N/A';
  const analysisError = audioMetadata?.error;


  // Setup HTML5 audio element
  // Memoize handleTimeUpdate to prevent unstable event handler
  const handleTimeUpdate = React.useCallback(() => {
    const audio = audioElementRef.current;
    if (audio) {
      setLocalCurrentTime(audio.currentTime); // Only update local state
    }
  }, []);

  useEffect(() => {
    // Destructure store actions and state inside the effect for stability
    const {
      audioContext,
      isPlaying,
      duration,
      setAudioBuffer,
      setCurrentTime,
      setIsPlaying,
      setDuration,
      setAudioMetadata,
      setAudioContext,
      audioMetadata
    } = store;

    const audio = audioElementRef.current;
    if (!audio) return;

    // Memoized event handlers
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    const handleLoadedData = async () => {
      if (audioContext && audio.src) {
        try {
          const arrayBuffer = await fetch(audio.src).then(res => res.arrayBuffer());
          const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          setAudioBuffer(decodedAudioBuffer);
          console.log('MusicPlayer: AudioBuffer set in store.', {
            duration: decodedAudioBuffer.duration,
            length: decodedAudioBuffer.length,
            numberOfChannels: decodedAudioBuffer.numberOfChannels
          });
        } catch (error) {
          console.error('Error loading audio buffer:', error);
        }
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadeddata', handleLoadedData);

    // Set volume explicitly on mount, ensuring it's finite
    if (isFinite(volume)) {
      audio.volume = volume;
    } else {
      console.warn(`Initial volume state was non-finite: ${volume}. Setting audio element volume to 1.`);
      audio.volume = 1; // Fallback to a safe default
    }
    // Expose audio element
    if (audioRef) {
      audioRef.current = audio;
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [store, audioRef, handleTimeUpdate, volume]);

  // Check if text needs scrolling when title or artist changes
  useEffect(() => {
    const checkTextOverflow = () => {
      if (titleRef.current) {
        const titleNeedsScrolling = titleRef.current.scrollWidth > titleRef.current.clientWidth;
        setTitleNeedsScroll(titleNeedsScrolling);
      }
      
      if (artistRef.current) {
        const artistNeedsScrolling = artistRef.current.scrollWidth > artistRef.current.clientWidth;
        setArtistNeedsScroll(artistNeedsScrolling);
      }
    };

    // Small delay to ensure DOM has updated
    timeoutRef.current = setTimeout(checkTextOverflow, 100);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [trackTitle, trackArtist]);

  const handlePlayPause = () => {
    const audio = audioElementRef.current;
    if (audio) {
      if (isPlaying) { // Use destructured isPlaying
        audio.pause();
      } else {
        audio.play();
      }
    }
  };

  const handleSeek = (time) => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.currentTime = time;
      setLocalCurrentTime(time); // Update local state
      setCurrentTime(time); // Sync global store only on seek
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clean up previous audio URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Ensure AudioContext is initialized or resumed
      if (!audioContext) { // Use destructured audioContext
        const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(newAudioContext); // Use destructured setAudioContext
        console.log("AudioContext initialized from MusicPlayer file change.");
      } else if (audioContext.state === 'suspended') { // Use destructured audioContext
        audioContext.resume().then(() => { // Use destructured audioContext
          console.log("AudioContext resumed from MusicPlayer file change.");
        }).catch(err => console.error("Error resuming AudioContext:", err));
      }

      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setTrackTitle(file.name);
      setTrackArtist('');
      setShowLoadModal(false);
      
      // Load audio into the audio element
      const audio = audioElementRef.current;
      if (audio) {
        audio.src = url;
      }
      
      if (onAudioLoad) {
        onAudioLoad(url);
      }

      // Analyze audio features
      analyzeAudioFile(file);
    }
  };

  const analyzeAudioFile = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    // Get current global duration from store for fallback
    const currentGlobalDuration = useStore.getState().duration;
    // We need to import axiosInstance
    // import axiosInstance from '../../api/axiosInstance'; // Path might need adjustment

    try {
      // Use the new axiosInstance
      const response = await axiosInstance.post('/audio/analyze?analysis_type=full', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Axios automatically throws for non-2xx responses, so error handling is primarily in the interceptor.
      // Successful response handling:
      const result = response.data; // Axios puts response data directly in `data`

      if (result.status === 'success' && result.results) {
        const { key_analysis, features, mood_analysis } = result.results; // Now includes mood
        const metadata = {
          key: key_analysis?.key || 'N/A', // Correctly access nested property
          tempo: features?.tempo ? Math.round(features.tempo) : null,
          duration: features?.duration || currentGlobalDuration,
          mood: mood_analysis?.top_mood || 'N/A', // Add mood to metadata
          error: null
        };

        if (setAudioMetadata) { // Use destructured setAudioMetadata
          setAudioMetadata(metadata);
        }

        if (features?.duration && features.duration !== currentGlobalDuration) {
          setDuration(features.duration); // Use destructured setDuration
        }
        console.log('Audio analysis successful (axios):', metadata);
      } else {
        // This case might be less common if backend consistently returns error statuses for failures
        console.error('Audio analysis returned success status but missing results (axios):', result);
        if (setAudioMetadata) { // Use destructured setAudioMetadata
          setAudioMetadata({
            key: 'N/A',
            tempo: 'N/A',
            duration: currentGlobalDuration,
            error: 'Analysis response incomplete'
          });
        }
      }
    } catch (error) {
      // The axios interceptor will have already handled showing a toast and logging.
      // This catch block is for any additional component-specific error handling, if needed.
      console.error('Component-level error after audio analysis attempt (axios):', error.message);

      // Ensure audioMetadata in store reflects an error state if not already set by interceptor
      // This is a bit defensive, as the interceptor should handle it.
      const currentStoreError = useStore.getState().audioMetadata.error; // Can still use useStore.getState() here
      if (setAudioMetadata && !currentStoreError) { // Use destructured setAudioMetadata
         setAudioMetadata({ // Use destructured setAudioMetadata
            key: 'Error', // Or N/A
            tempo: 'N/A',
            duration: currentGlobalDuration,
            error: error.message || 'Failed to analyze audio.',
        });
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVolumeChange = (newVolume) => {
    // Ensure newVolume is a finite number before calculations
    if (!isFinite(newVolume)) {
      console.warn(`handleVolumeChange received non-finite newVolume: ${newVolume}`);
      return; // Or set to a safe default if appropriate
    }

    const clampedVolume = Math.max(0, Math.min(1, newVolume));

    // Only set state and audio element volume if clampedVolume is finite
    if (isFinite(clampedVolume)) {
      setVolume(clampedVolume);
      const audio = audioElementRef.current;
      if (audio) {
        audio.volume = clampedVolume;
      }
    } else {
      console.warn(`clampedVolume became non-finite: ${clampedVolume} from newVolume: ${newVolume}`);
    }
  };

  // Volume knob component with vertical controls
  // Clean up object URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [audioUrl]);

  const VolumeKnob = ({ volume, onChange }) => {
    const handleMouseDown = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const startY = rect.top + rect.height / 2;

      const handleMouseMove = (e) => {
        const deltaY = startY - e.clientY;
        const sensitivity = 0.01;
        const newVolume = Math.max(0, Math.min(1, volume + (deltaY * sensitivity)));
        onChange(newVolume);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const circumference = 2 * Math.PI * 12; // radius of 12px
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - volume);

    return (
      <div className="volume-knob-container">
        <div className="volume-knob" onMouseDown={handleMouseDown}>
          <svg width="32" height="32" className="volume-knob-svg">
            {/* Background circle */}
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={isNaN(strokeDashoffset) ? "0" : strokeDashoffset}
              transform="rotate(-90 16 16)"
              className="volume-progress"
            />
            {/* Center dot */}
            <circle
              cx="16"
              cy="16"
              r="3"
              fill="var(--accent-primary)"
              className="volume-knob-center"
            />
          </svg>
          <i className="ri-volume-up-line volume-icon"></i>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`music-player ${showLoadModal ? 'disabled' : ''}`}>
        <div className="player-left">
          <button onClick={handlePlayPause} className="play-pause-btn">
            {isPlaying ? ( // Use destructured isPlaying
              <i className="ri-pause-fill"></i>
            ) : (
              <i className="ri-play-fill"></i>
            )}
          </button>
          <div className="track-info-stacked">
            <div 
              ref={titleRef}
              className={`track-title ${titleNeedsScroll ? 'scrolling' : ''}`}
            >
              {trackTitle}
            </div>
            <div 
              ref={artistRef}
              className={`track-artist ${artistNeedsScroll ? 'scrolling' : ''}`}
            >
              {trackArtist || 'Unknown Artist'}
            </div>
            <div className="time-display">
              {formatTime(localCurrentTime)} / {formatTime(duration)} {/* Use localCurrentTime for playback position */}
            </div>
          </div>
        </div>

        <div className="player-center" style={{ flexGrow: 1 }}>
          <WaveformTimeline 
            height="60" 
            className="waveform-container-full"
            style={{ width: '100%' }}
            onSeek={handleSeek} 
          />
        </div>
        
        {/* Hidden HTML5 Audio Element */}
        <audio 
          ref={audioElementRef}
          style={{ display: 'none' }}
          preload="metadata"
        />

        <div className="player-right">
          <div className="audio-features">
            {analysisError && (
              <div className="feature-error" style={{ color: 'var(--color-error)', fontSize: '10px', marginBottom: '4px' }}>
                Analysis: {analysisError}
              </div>
            )}
            <div className="feature" style={{ marginBottom: '4px' }}>
              <span>BPM</span>
              <span>{displayBpm}</span>
            </div>
            <div className="feature">
              <span>KEY</span>
              <span>{displayKey}</span>
            </div>
          </div>
            <VolumeKnob value={volume} onChange={handleVolumeChange} />
        </div>
      </div>

      {/* Load Track Modal */}
      {showLoadModal && (
        <div className="load-track-modal">
          <div className="modal-backdrop" />
          <div className="modal-content">
            <div className="modal-icon">
              <i className="ri-music-line"></i>
            </div>
            <h2>Load Your Track</h2>
            <p>Select an audio file to start creating your music visualization</p>
            <label className="modal-upload-btn">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <i className="ri-upload-line"></i>
              Choose Audio File
            </label>
            <div className="supported-formats">
              <span>Supported formats: MP3, WAV, M4A, FLAC</span>
            </div>
            {audioMetadata?.error && !analysisError && ( // Use destructured audioMetadata
              <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '10px' }}>
                Previous analysis attempt failed: {audioMetadata.error} {/* Use destructured audioMetadata */}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default MusicPlayer;
