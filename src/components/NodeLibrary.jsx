// src/components/NodeLibrary.jsx
import React, { useState } from 'react';
import useStore from '../store';
import { nodeCategories, nodeDescriptions, nodeTypeMapping } from '../nodes/registerNodes.js';

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

// Build a flat list of all nodes, including uncategorized
const getAllNodes = () => {
  const allNodes = [];
  const categorized = new Set();
  // Add categorized nodes
  Object.entries(nodeCategories).forEach(([categoryName, nodeIds]) => {
    const categoryInfo = categoryConfig[categoryName];
    if (!categoryInfo) return;
    nodeIds.forEach(nodeId => {
      categorized.add(nodeId);
      const description = nodeDescriptions[nodeId] || 'No description available';
      const icon = nodeIcons[nodeId] || 'ri-node-tree';
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
  // Add uncategorized nodes (from nodeTypeMapping)
  if (nodeTypeMapping) {
    Object.keys(nodeTypeMapping).forEach(nodeId => {
      if (!categorized.has(nodeId)) {
        const description = nodeDescriptions[nodeId] || 'No description available';
        const icon = nodeIcons[nodeId] || 'ri-node-tree';
        const displayName = nodeId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        allNodes.push({
          id: nodeId,
          name: displayName,
          category: 'uncategorized',
          categoryName: 'Uncategorized',
          icon,
          description,
          color: '#888'
        });
      }
    });
  }
  return allNodes;
};

function NodeItem({ node }) {
  // Use window.__addNodeFromSidebar if available for double click
  return (
    <div
      className="node-item group"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('nodeType', node.id);
      }}
      onDoubleClick={() => {
        if (window.__addNodeFromSidebar) window.__addNodeFromSidebar(node.id);
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
  );
}

function NodeLibrary() {
  const addNode = useStore(state => state.addNode);
  const editorType = useStore(state => state.editorType);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(categoryConfig).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );
  const [sidebarWidth, setSidebarWidth] = useState(300); // Default width
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseMove = (e) => {
    if (isResizing) {
      setSidebarWidth(Math.max(200, e.clientX)); // Minimum width of 200px
    }
  };
  const handleMouseUp = () => setIsResizing(false);

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const allNodes = React.useMemo(() => getAllNodes(), []);
  
  const filteredNodes = React.useMemo(() => 
  allNodes.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allNodes, searchTerm]);

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  return (
    <div
      className="node-library bg-bg-base border-r border-border-color overflow-y-auto"
      style={{
        width: `${sidebarWidth}px`,
        minWidth: '200px', // Ensure minimum width
        maxWidth: '100%', // Prevent overflow
      }}
    >
      <div
        className="resize-handle bg-border-color"
        onMouseDown={handleMouseDown}
        style={{
          width: '5px',
          cursor: 'ew-resize',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 10, // Ensure handle is above content
        }}
      ></div>
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
              <NodeItem key={node.id} node={node} />
            ))}
          </div>
        </div>
      ) : (
        // Show categorized nodes, plus uncategorized
        <>
          {Object.entries(categoryConfig).map(([categoryName, categoryInfo]) => {
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
                      <NodeItem key={node.id} node={node} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {/* Show uncategorized nodes if any */}
          {allNodes.some(n => n.categoryName === 'Uncategorized') && (
            <div className="category-section">
              <div className="category-header" style={{ borderLeftColor: '#888' }}>
                <div className="flex items-center flex-1">
                  <i className="ri-node-tree" style={{ color: '#888' }}></i>
                  <span className="ml-2">Uncategorized</span>
                  <span className="ml-2 text-xs text-text-secondary">({allNodes.filter(n => n.categoryName === 'Uncategorized').length})</span>
                </div>
              </div>
              <div className="node-list">
                {allNodes.filter(n => n.categoryName === 'Uncategorized').map(node => (
                  <NodeItem key={node.id} node={node} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {filteredNodes.length === 0 && searchTerm && (
        <div className="p-4 text-center text-text-secondary">
          <i className="ri-search-2-line text-2xl mb-2 block"></i>
          <p>No nodes found matching "{searchTerm}"</p>
          <p className="text-sm mt-1">Try searching for different keywords</p>
        </div>
      )}

      {editorType === 'rete' && (
        <div className="p-4 text-center text-text-secondary bg-bg-mantle border-t-2 border-accent-primary mt-4">
            <i className="ri-information-line text-2xl mb-2 block text-accent-primary"></i>
            <h4 className="font-semibold text-text-primary">Rete.js Editor Active</h4>
            <p className="text-xs mt-1">
                Node Library is currently disabled. Please add nodes by right-clicking on the graph canvas.
            </p>
        </div>
      )}
    </div>
  );
}

export default NodeLibrary;
