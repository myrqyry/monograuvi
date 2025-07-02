// src/components/MusicPlayer.jsx
import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useStore } from '../store';


function MusicPlayer({ audioRef }) {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackTitle, setTrackTitle] = useState('No Track Loaded');
  const [trackArtist, setTrackArtist] = useState('');
  const audioContext = useStore(state => state.audioContext);

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'var(--ctp-mocha-surface2)',
      progressColor: 'var(--ctp-mocha-mauve)',
      cursorColor: 'var(--ctp-mocha-lavender)',
      cursorWidth: 2,
      barWidth: 2,
      barRadius: 3,
      barGap: 2,
      height: 80,
      backend: 'WebAudio',
      audioContext: audioContext || undefined,
    });

    wavesurfer.current.on('ready', () => {
      setDuration(wavesurfer.current.getDuration());
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current.getCurrentTime());
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('finish', () => setIsPlaying(false));

    audioRef.current = wavesurfer.current;

    return () => {
      wavesurfer.current.destroy();
    };
  }, [audioContext]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && wavesurfer.current) {
      const url = URL.createObjectURL(file);
      wavesurfer.current.load(url);
      setTrackTitle(file.name);
      setTrackArtist('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="music-player">
      <div className="player-controls">
        <button onClick={handlePlayPause} className="play-pause-btn">
          {isPlaying ? (
            <i className="ri-pause-fill"></i>
          ) : (
            <i className="ri-play-fill"></i>
          )}
        </button>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="audio-upload-input"
          style={{ marginLeft: '1rem' }}
        />
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span> / </span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="volume-control">
          <i className="ri-volume-down-line"></i>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            className="volume-slider"
            onChange={e => {
              if (wavesurfer.current) {
                wavesurfer.current.setVolume(parseFloat(e.target.value));
              }
            }}
          />
          <i className="ri-volume-up-line"></i>
        </div>
        <button className="btn-icon">
          <i className="ri-play-list-line"></i>
        </button>
      </div>
      <div ref={waveformRef} className="waveform-container"></div>
      <div className="audio-info">
        <div className="now-playing">
          <div className="track-title">{trackTitle}</div>
          <div className="track-artist">{trackArtist}</div>
        </div>
        <div className="audio-features">
          <div className="feature">
            <span>BPM:</span>
            <span>128</span>
          </div>
          <div className="feature">
            <span>Key:</span>
            <span>C Minor</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;