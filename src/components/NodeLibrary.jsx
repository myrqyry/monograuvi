// src/components/NodeLibrary.jsx
import React, { useState } from 'react';
import useStore from '../store';
import { nodeCategories, nodeDescriptions } from '../nodes/registerNodes.js';

const categoryConfig = {
  Audio: { 
    id: 'audio', 
    name: 'Audio', 
    icon: 'ri-music-2-line',
    color: '#FF6B35',
    description: 'Audio processing and analysis nodes'
  },
  Visual: { 
    id: 'visual', 
    name: 'Visual', 
    icon: 'ri-slideshow-line',
    color: '#9B59B6',
    description: 'Visual effects and rendering nodes'
  },
  Control: { 
    id: 'control', 
    name: 'Control', 
    icon: 'ri-settings-4-line',
    color: '#E74C3C',
    description: 'Parameter control and modulation nodes'
  },
  Output: { 
    id: 'output', 
    name: 'Output', 
    icon: 'ri-broadcast-line',
    color: '#27AE60',
    description: 'Output and export nodes'
  },
  Math: { 
    id: 'math', 
    name: 'Math', 
    icon: 'ri-calculator-line',
    color: '#3498DB',
    description: 'Mathematical operations and logic'
  }
};

const nodeIcons = {
  // Audio nodes
  'audio-source': 'ri-file-music-line',
  'audio-analyser': 'ri-sound-module-line',
  'beat-detector': 'ri-timer-flash-line',
  'spectral-analyser': 'ri-spectrum-line',
  'pitch-detector': 'ri-music-2-line',
  'key-detector': 'ri-key-2-line',
  'mood-analyser': 'ri-emotion-happy-line',
  
  // Visual nodes
  'particle-system': 'ri-fire-line',
  'waveform': 'ri-soundwave-line',
  'spectrum-visualizer': 'ri-bar-chart-line',
  'shader-effect': 'ri-gradienter-line',
  'text-animator': 'ri-text-wrap',
  'kaleidoscope': 'ri-aspect-ratio-line',
  
  // Control nodes
  'lfo': 'ri-pulse-line',
  'envelope': 'ri-arrow-up-down-line',
  'sequencer': 'ri-step-line',
  'random': 'ri-shuffle-line',
  
  // Output nodes
  'video-render': 'ri-video-line',
  'preview': 'ri-eye-line',
  
  // Math nodes
  'math-add': 'ri-add-line',
  'math-multiply': 'ri-close-line',
  'threshold': 'ri-drag-move-2-line'
};

// Convert node categories to flat list with proper metadata
const getAllNodes = () => {
  const allNodes = [];
  
  Object.entries(nodeCategories).forEach(([categoryName, nodeIds]) => {
    const categoryInfo = categoryConfig[categoryName];
    if (!categoryInfo) return;
    
    nodeIds.forEach(nodeId => {
      const description = nodeDescriptions[nodeId] || 'No description available';
      const icon = nodeIcons[nodeId] || 'ri-node-tree';
      
      // Convert node ID to display name
      const displayName = nodeId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      allNodes.push({
        id: nodeId,
        name: displayName,
        category: categoryInfo.id,
        categoryName,
        icon,
        description,
        color: categoryInfo.color
      });
    });
  });
  
  return allNodes;
};

function NodeLibrary() {
  const addNode = useStore(state => state.addNode);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(categoryConfig).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const allNodes = getAllNodes();
  
  const filteredNodes = allNodes.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  return (
    <div className="node-library">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <i className="ri-node-tree mr-2"></i> Node Library
        </h2>
        <div className="search-box mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 rounded-lg bg-bg-base border border-border-color text-text-primary focus:border-accent-primary focus:outline-none"
            />
            <i className="ri-search-line absolute left-2 top-2.5 text-text-secondary"></i>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-text-secondary">
              Found {filteredNodes.length} node(s)
            </div>
          )}
        </div>
      </div>
      
      {searchTerm ? (
        // Show search results
        <div className="search-results">
          <div className="px-4 pb-2">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Search Results</h3>
          </div>
          <div className="node-list">
            {filteredNodes.map(node => (
              <div
                key={node.id}
                className="node-item group"
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('nodeType', node.id);
                }}
                onClick={() => {
                  useStore.setState({ lastAddedNode: node.id });
                }}
                title={node.description}
              >
                <div className="node-icon" style={{ color: node.color }}>
                  <i className={node.icon}></i>
                </div>
                <div className="node-info flex-1">
                  <div className="node-name">{node.name}</div>
                  <div className="node-category text-xs" style={{ color: node.color }}>
                    {node.categoryName}
                  </div>
                  <div className="node-description text-xs text-text-secondary mt-1 line-clamp-2">
                    {node.description}
                  </div>
                </div>
                <div className="node-actions opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="ri-add-line text-accent-primary cursor-pointer"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Show categorized nodes
        Object.entries(categoryConfig).map(([categoryName, categoryInfo]) => {
          const categoryNodes = allNodes.filter(node => node.categoryName === categoryName);
          const isExpanded = expandedCategories[categoryName];
          
          return (
            <div key={categoryName} className="category-section">
              <div 
                className="category-header cursor-pointer"
                onClick={() => toggleCategory(categoryName)}
                style={{ borderLeftColor: categoryInfo.color }}
              >
                <div className="flex items-center flex-1">
                  <i className={categoryInfo.icon} style={{ color: categoryInfo.color }}></i>
                  <span className="ml-2">{categoryInfo.name}</span>
                  <span className="ml-2 text-xs text-text-secondary">({categoryNodes.length})</span>
                </div>
                <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-text-secondary`}></i>
              </div>
              
              {isExpanded && (
                <div className="node-list">
                  {categoryNodes.map(node => (
                    <div
                      key={node.id}
                      className="node-item group"
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('nodeType', node.id);
                      }}
                      onClick={() => {
                        useStore.setState({ lastAddedNode: node.id });
                      }}
                      title={node.description}
                    >
                      <div className="node-icon" style={{ color: node.color }}>
                        <i className={node.icon}></i>
                      </div>
                      <div className="node-info flex-1">
                        <div className="node-name">{node.name}</div>
                        <div className="node-description text-xs text-text-secondary mt-1 line-clamp-2">
                          {node.description}
                        </div>
                      </div>
                      <div className="node-actions opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="ri-add-line text-accent-primary cursor-pointer"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
      
      {filteredNodes.length === 0 && searchTerm && (
        <div className="p-4 text-center text-text-secondary">
          <i className="ri-search-2-line text-2xl mb-2 block"></i>
          <p>No nodes found matching "{searchTerm}"</p>
          <p className="text-sm mt-1">Try searching for different keywords</p>
        </div>
      )}
    </div>
  );
}

export default NodeLibrary;
