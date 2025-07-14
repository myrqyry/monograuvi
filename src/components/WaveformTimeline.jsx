import React, { useRef, useEffect, useCallback } from 'react';
import useStore from '../store';

const WaveformTimeline = ({ 
  height = 60,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  
  // Get state from store
  const { audioBuffer, currentTime, duration, isPlaying } = useStore(state => ({
    audioBuffer: state.audioBuffer,
    currentTime: state.currentTime,
    duration: state.duration || 1, // Ensure duration is never 0 to avoid division by zero
    isPlaying: state.isPlaying
  }));

  // Draw waveform on canvas
  const drawWaveform = useCallback((canvas, ctx) => {
    if (!audioBuffer) return;
    
    const { width, height } = canvas;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set waveform style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    
    // Draw waveform bars
    for (let x = 0; x < width; x++) {
      const start = x * step;
      const end = Math.min(start + step, data.length);
      let min = 1, max = -1;
      
      for (let i = start; i < end; i++) {
        const sample = data[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      const minY = (1 + min) * amp;
      const maxY = (1 + max) * amp;
      const barHeight = maxY - minY;
      
      if (barHeight > 0) {
        ctx.fillRect(x, minY, 1, barHeight);
      }
    }
  }, [audioBuffer]);

  // Draw playhead
  const drawPlayhead = useCallback((canvas, ctx) => {
    if (!duration) return;
    
    const { width, height } = canvas;
    const x = (currentTime / duration) * width;
    
    // Playhead line
    ctx.strokeStyle = isPlaying ? 'rgba(166, 227, 161, 1)' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    
    // Playhead indicator
    ctx.fillStyle = isPlaying ? 'rgba(166, 227, 161, 1)' : 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x - 4, 0);
    ctx.lineTo(x + 4, 0);
    ctx.lineTo(x, 8);
    ctx.closePath();
    ctx.fill();
  }, [currentTime, duration, isPlaying]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw components
    drawWaveform(canvas, ctx);
    drawPlayhead(canvas, ctx);
    
    // Continue animation if playing
    if (isPlaying) {
      animationFrameId.current = requestAnimationFrame(render);
    }
  }, [drawPlayhead, drawWaveform, isPlaying]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (canvasRef.current) {
      render();
    }
  }, [render]);

  // Set up resize observer and initial render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Initial render
    render();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    
    // Clean up
    return () => {
      resizeObserver.disconnect();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [render, handleResize]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      animationFrameId.current = requestAnimationFrame(render);
    } else if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, render]);

  // Handle case when no audio is loaded
  if (!audioBuffer) {
    return (
      <div 
        className={`relative w-full bg-gray-900 rounded-md overflow-hidden flex items-center justify-center ${className}`}
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500 text-sm">No audio loaded</p>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full bg-gray-900 rounded-md overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
};

export default WaveformTimeline;
