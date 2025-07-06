import React, { useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';

const Timeline = ({ audioUrl }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 100,
        responsive: true,
        plugins: [
          RegionsPlugin.create({
            dragSelection: {
              slop: 5,
            },
          }),
        ],
      });

const addRegion = (time) => {
  wavesurfer.current.plugins.regions.addRegion({
    start: time,
    end: time + 0.1, // a small region
    content: 'Trigger',
    color: 'rgba(0, 255, 0, 0.5)',
  });
};

// Example: Add a button for explicit region creation
const handleAddRegion = () => {
  const currentTime = wavesurfer.current.getCurrentTime();
  addRegion(currentTime);
};

      if (audioUrl) {
        wavesurfer.current.load(audioUrl);

        wavesurfer.current.on('error', (error) => {
          console.error('Error loading audio:', error);
          alert('Failed to load audio. Please check the URL or your network connection.');
        });
      }

      return () => wavesurfer.current.destroy();
    }
  }, [audioUrl]);

  return (
    <div className="timeline-container">
      <div ref={waveformRef}></div>
      <button onClick={handleAddRegion} className="add-region-button">
        Add Region
      </button>
    </div>
  );
};

export default Timeline;
