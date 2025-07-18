import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import useStore from '../store';

const WaveformTimeline = ({ height = 60, className = '', onSeek }) => {
  const canvasRef = useRef(null);
  const waveformCacheCanvas = useMemo(() => document.createElement('canvas'), []);

  const { audioBuffer, currentTime, duration, isPlaying } = useStore(state => ({
    audioBuffer: state.audioBuffer,
    currentTime: state.currentTime,
    duration: state.duration || 1,
    isPlaying: state.isPlaying,
  }));

  // 1. Draw the static waveform to an offscreen canvas (cache)
  const drawWaveformToCache = useCallback((width, height) => {
    if (!audioBuffer) return;

    waveformCacheCanvas.width = width;
    waveformCacheCanvas.height = height;
    const ctx = waveformCacheCanvas.getContext('2d');
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(200, 200, 220, 0.5)';
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();
  }, [audioBuffer, waveformCacheCanvas]);

  // 2. Draw the playhead on the main canvas
  const drawPlayhead = useCallback((ctx, width, height) => {
    if (duration > 0) {
      const x = (currentTime / duration) * width;
      ctx.strokeStyle = '#f5c2e7'; // Catppuccin Pink
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [currentTime, duration]);

  // 3. Main drawing function to combine cache and playhead
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear and draw the cached waveform
    ctx.clearRect(0, 0, width, height);
    if (waveformCacheCanvas.width > 0) {
      ctx.drawImage(waveformCacheCanvas, 0, 0);
    }

    // Draw the playhead on top
    drawPlayhead(ctx, width, height);
  }, [waveformCacheCanvas, drawPlayhead]);

  // Effect for resizing and initial waveform draw
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    if (!canvas) return;
const rect = canvas.getBoundingClientRect();
    const newWidth = rect.width * dpr;
    const newHeight = rect.height * dpr;

    // Update cache and main canvas only if dimensions change
    if (waveformCacheCanvas.width !== newWidth || waveformCacheCanvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        drawWaveformToCache(newWidth, newHeight);
    }
    draw(); // Initial draw

    const resizeObserver = new ResizeObserver(() => {
        const dpr = window.devicePixelRatio || 1;
        if (!canvas) return;
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        drawWaveformToCache(canvas.width, canvas.height);
        draw();
    });
    if (canvas) resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [draw, drawWaveformToCache, audioBuffer, waveformCacheCanvas]);


  // Effect for animation loop
  useEffect(() => {
      if (isPlaying) {
          let animationFrameId;
          const renderLoop = () => {
              draw();
              animationFrameId = requestAnimationFrame(renderLoop);
          };
          renderLoop();
          return () => cancelAnimationFrame(animationFrameId);
      } else {
          draw(); // Draw once when paused or currentTime changes
      }
  }, [isPlaying, draw, currentTime]);


  const handleCanvasClick = (e) => {
    if (!duration || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = (clickX / rect.width) * duration;
    onSeek(seekTime);
  };

  if (!audioBuffer) {
    return (
      <div className={`relative w-full bg-bg-crust rounded-md flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-text-secondary text-sm">Load an audio file to see the timeline</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-bg-crust rounded-md overflow-hidden cursor-pointer ${className}`} style={{ height: `${height}px` }} onClick={handleCanvasClick}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default React.memo(WaveformTimeline);
