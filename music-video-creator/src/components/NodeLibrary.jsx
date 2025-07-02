// src/components/NodeLibrary.jsx
import React from 'react';
import useStore from '../store';

const categories = [
  { id: 'audio', name: 'Audio', icon: 'ri-music-2-line' },
  { id: 'visual', name: 'Visual', icon: 'ri-slideshow-line' },
  { id: 'text', name: 'Text', icon: 'ri-text' },
  { id: 'math', name: 'Math', icon: 'ri-calculator-line' },
  { id: 'logic', name: 'Logic', icon: 'ri-node-tree' },
];

const nodeTypes = [
  { id: 'audio-source', name: 'Audio Source', category: 'audio', icon: 'ri-file-music-line' },
  { id: 'audio-analyser', name: 'Audio Analyser', category: 'audio', icon: 'ri-sound-module-line' },
  { id: 'beat-detector', name: 'Beat Detector', category: 'audio', icon: 'ri-timer-flash-line' },
  { id: 'visual-canvas', name: 'Canvas', category: 'visual', icon: 'ri-artboard-line' },
  { id: 'particle-system', name: 'Particle System', category: 'visual', icon: 'ri-fire-line' },
  { id: 'shader-effect', name: 'Shader Effect', category: 'visual', icon: 'ri-gradienter-line' },
  { id: 'text-display', name: 'Text Display', category: 'text', icon: 'ri-text' },
  { id: 'kinetic-text', name: 'Kinetic Text', category: 'text', icon: 'ri-text-wrap' },
  { id: 'lyrics-player', name: 'Lyrics Player', category: 'text', icon: 'ri-subtitles-line' },
  { id: 'math-add', name: 'Add', category: 'math', icon: 'ri-add-line' },
  { id: 'math-multiply', name: 'Multiply', category: 'math', icon: 'ri-close-line' },
  { id: 'smoothing', name: 'Smoothing', category: 'math', icon: 'ri-pulse-line' },
  { id: 'threshold', name: 'Threshold', category: 'logic', icon: 'ri-drag-move-2-line' },
  { id: 'trigger', name: 'Trigger', category: 'logic', icon: 'ri-switch-line' },
];

function NodeLibrary() {
  const addNode = useStore(state => state.addNode);

  return (
    <div className="node-library">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <i className="ri-node-tree mr-2"></i> Node Library
        </h2>
        <div className="search-box mb-4">
          <input
            type="text"
            placeholder="Search nodes..."
            className="w-full p-2 rounded-lg bg-bg-base border border-border-color text-text-primary"
          />
        </div>
      </div>
      
      {categories.map(category => (
        <div key={category.id} className="category-section">
          <div className="category-header">
            <i className={category.icon}></i>
            <span>{category.name}</span>
          </div>
          <div className="node-list">
            {nodeTypes
              .filter(node => node.category === category.id)
              .map(node => (
                <div
                  key={node.id}
                  className="node-item"
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('nodeType', node.id);
                  }}
                  onClick={() => {
                    // Trigger node addition through store
                    useStore.setState({ lastAddedNode: node.id });
                  }}
                >
                  <div className="node-icon">
                    <i className={node.icon}></i>
                  </div>
                  <div className="node-info">
                    <div className="node-name">{node.name}</div>
                    <div className="node-category">{category.name}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default NodeLibrary;