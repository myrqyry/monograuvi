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

      wavesurfer.current.on('click', (e) => {
        const time = e.detail.cursorTime;
        wavesurfer.current.plugins.regions.addRegion({
          start: time,
          end: time + 0.1, // a small region
          content: 'Trigger',
          color: 'rgba(0, 255, 0, 0.5)',
        });
      });

      if (audioUrl) {
        wavesurfer.current.load(audioUrl);
      }

      return () => wavesurfer.current.destroy();
    }
  }, [audioUrl]);

  return (
    <div className="timeline-container">
      <div ref={waveformRef}></div>
    </div>
  );
};

export default Timeline;
