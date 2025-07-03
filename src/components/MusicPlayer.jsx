// src/components/MusicPlayer.jsx
import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import useStore from '../store';


function MusicPlayer({ audioRef, onAudioLoad }) {
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
      waveColor: 'rgba(255, 255, 255, 0.3)',
      progressColor: 'var(--accent-primary)',
      cursorColor: 'var(--accent-secondary)',
      cursorWidth: 2,
      barWidth: 2,
      barRadius: 2,
      barGap: 1,
      height: 50,
      backend: 'WebAudio',
      audioContext: audioContext || undefined,
      interact: true,
      responsive: true,
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

  return (
    <div className="music-player">
      <div className="player-left">
        <button onClick={handlePlayPause} className="play-pause-btn">
          {isPlaying ? (
            <i className="ri-pause-fill"></i>
          ) : (
            <i className="ri-play-fill"></i>
          )}
        </button>
        <div className="now-playing">
          <div className="track-title">{trackTitle}</div>
          <div className="track-artist">{trackArtist || 'Unknown Artist'}</div>
        </div>
      </div>

      <div className="player-center">
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span> / </span>
          <span>{formatTime(duration)}</span>
        </div>
        <div ref={waveformRef} className="waveform-container"></div>
        <label className="audio-upload-btn">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <i className="ri-upload-line"></i> Load Track
        </label>
      </div>

      <div className="player-right">
        <div className="audio-features">
          <div className="feature">
            <span>BPM</span>
            <span>128</span>
          </div>
          <div className="feature">
            <span>KEY</span>
            <span>Cm</span>
          </div>
        </div>
        <div className="volume-control">
          <i className="ri-volume-down-line"></i>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            defaultValue="1"
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
          <i className="ri-settings-3-line"></i>
        </button>
      </div>
    </div>
  );
}

export default MusicPlayer;
