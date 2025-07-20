// src/constants/audio.js
export const DEFAULT_BEAT_THRESHOLD = 0.1;
export const DEFAULT_MIN_TIME_BETWEEN_BEATS = 0.5;
export const DANCE_MOTION_SNAP_INTERVAL = 0.5;
export const SUPPORTED_AUDIO_FILE_TYPES = "audio/*"; // For input accept attribute
export const SUPPORTED_AUDIO_FORMAT_NAMES = ["MP3", "WAV", "M4A", "FLAC"]; // For display in UI

// For spectrogram DPI
export const SPECTROGRAM_DPI = 150;

export const AUDIO_NODE_CONFIG = {
    volume: {
        min: 0,
        max: 2,
        step: 0.1,
    }
};
