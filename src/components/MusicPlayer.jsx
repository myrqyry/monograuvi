// src/components/MusicPlayer.jsx
import React, { useRef, useEffect, useState } from 'react';
import useStore from '../store';
import WaveformTimeline from './WaveformTimeline';

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
  
  // Get state and actions from store
  const {
    audioContext,
    isPlaying,
    currentTime,
    duration,
    setAudioBuffer,
    setCurrentTime,
    setIsPlaying,
    setDuration
  } = useStore();

  // Setup HTML5 audio element
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    const handleLoadedData = async () => {
      if (audioContext && audio.src) {
        try {
          const response = await fetch(audio.src);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          setAudioBuffer(audioBuffer);
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

    // Set volume
    audio.volume = volume;

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
  }, [audioContext, setAudioBuffer, setCurrentTime, setIsPlaying, setDuration, volume, audioRef]);

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
    const timeoutId = setTimeout(checkTextOverflow, 100);
    return () => clearTimeout(timeoutId);
  }, [trackTitle, trackArtist]);

  const handlePlayPause = () => {
    const audio = audioElementRef.current;
    if (audio) {
      if (isPlaying) {
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
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    const audio = audioElementRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
  };

  // Volume knob component with vertical controls
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
              strokeDashoffset={strokeDashoffset}
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
            {isPlaying ? (
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
              {formatTime(currentTime)} / {formatTime(duration)}
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
            <div className="feature" style={{ marginBottom: '4px' }}>
              <span>BPM</span>
              <span>128</span>
            </div>
            <div className="feature">
              <span>KEY</span>
              <span>Cm</span>
            </div>
          </div>
          <VolumeKnob volume={volume} onChange={handleVolumeChange} />
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
          </div>
        </div>
      )}
    </>
  );
}

// Export both the component and handleSeek for use in App
export default MusicPlayer;
export { MusicPlayer };
