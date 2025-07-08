import React from 'react';
import MotionLibrary from '../lib/MotionLibrary'; // Adjust path as necessary

// Initialize the motion library once
const motionLibrary = new MotionLibrary();

const MotionLibraryDisplay = () => {
  const motions = motionLibrary.getAllMotions();

  const handleDragStart = (e, motion) => {
    const nodeData = {
      type: 'animation/dancemotion', // This is the LiteGraph type for DanceMotionNode
      motionId: motion.id,
      // title: motion.name // Optional: pass title for new node
    };
    e.dataTransfer.setData('application/monograuvi-node', JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = 'copy';
    console.log('Dragging motion:', motion.name, nodeData);
  };

  if (!motions || motions.length === 0) {
    return <div className="motion-library-display"><p>No motions loaded.</p></div>;
  }

  return (
    <div className="motion-library-display" style={{ padding: '10px', userSelect: 'none' }}>
      <h3 style={{ marginTop: 0, marginBottom: '10px', color: 'var(--text-primary)' }}>Motion Library</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {motions.map((motion) => (
          <div
            key={motion.id}
            draggable
            onDragStart={(e) => handleDragStart(e, motion)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'grab',
              fontSize: '13px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
          >
            {motion.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MotionLibraryDisplay;
