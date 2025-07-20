// src/constants/api.js
export const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || 8000;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://localhost:${BACKEND_PORT}/api`;
export const WEBSOCKET_BASE_URL = `ws://localhost:${BACKEND_PORT}/ws`;

// Define specific API endpoints
export const API_ENDPOINTS = {
  AUDIO_ANALYZE: '/audio/analyze',
  VIDEO_DOWNLOAD: '/video/download',
  // ... add other endpoints as needed
};
