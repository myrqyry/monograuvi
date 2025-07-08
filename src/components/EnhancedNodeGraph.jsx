// src/components/EnhancedNodeGraph.jsx
import React, { useEffect, useRef, useState } from 'react';
import 'litegraph.js/css/litegraph.css';
/* global LiteGraph */
import { registerAllNodes, nodeTypeMapping, nodeCategories, nodeDescriptions } from '../nodes/registerNodes';
import useStore from '../store';
import { QuickConnection } from '../utils/QuickConnection';
import { EnhancedWidgets } from '../utils/EnhancedWidgets';
import { ContextMenuExtensions } from '../utils/ContextMenuExtensions';
import { NodeGroupingHelpers } from '../utils/NodeGroupingHelpers';
import { ThemeManager } from '../utils/ThemeManager';
import { SearchEnhancements } from '../utils/SearchEnhancements';

function EnhancedNodeGraph({ audioRef }) {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const graphCanvasRef = useRef(null);
  
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [groupingMode, setGroupingMode] = useState(false);
  
  // Store state
  const addNode = useStore(state => state.addNode);
  const nodes = useStore(state => state.nodes);
  const setGraph = useStore(state => state.setGraph);
  const audioContext = useStore(state => state.audioContext);
  
  // Enhanced utilities
  const enhancedWidgets = useRef(null);
  const contextMenuExtensions = useRef(null);
  const nodeGroupingHelpers = useRef(null);
  const themeManager = useRef(null);
  const searchEnhancements = useRef(null);
  
  // Initialize enhanced node graph
  useEffect(() => {
    const initializeEnhancedGraph = () => {
      if (!canvasRef.current || !window.LiteGraph || !window.LGraphCanvas) {
        console.log('Waiting for LiteGraph to load...');
        return;
      }
      
      console.log('Initializing Enhanced LiteGraph...');
      
      const LiteGraph = window.LiteGraph;
      const LGraphCanvas = window.LGraphCanvas;
      
      // Initialize enhanced utilities first
      enhancedWidgets.current = new EnhancedWidgets();
      contextMenuExtensions.current = new ContextMenuExtensions();
      nodeGroupingHelpers.current = new NodeGroupingHelpers();
      themeManager.current = new ThemeManager();
      searchEnhancements.current = new SearchEnhancements();
      
      // Set canvas size properly
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Register all custom nodes with enhancements
      registerAllNodes();
      enhancedWidgets.current.registerWidgets();
      
      const graph = new LiteGraph.LGraph();
      const graphCanvas = new LGraphCanvas(canvas, graph);
      
      // Store references
      graphRef.current = graph;
      graphCanvasRef.current = graphCanvas;
      setGraph(graph);
      
      // Configure enhanced features
      setupEnhancedFeatures(graph, graphCanvas);
      
      // Apply theme
      themeManager.current.applyTheme(currentTheme, canvas);
      
      // Add existing nodes to the graph
      nodes.forEach(node => {
        const mappedType = nodeTypeMapping[node.type] || node.type;
        const liteNode = LiteGraph.createNode(mappedType);
        if (liteNode) {
          liteNode.id = node.id;
          liteNode.pos = node.position;
          graph.add(liteNode);
        }
      });

      // Dynamically synchronize LiteGraph nodes with Zustand state
      graph.onNodeAdded = (node) => {
        addNode({
          id: node.id,
          type: node.type,
          position: node.pos
        });
      };

      graph.onNodeRemoved = (node) => {
        console.log(`Node removed: ${node.id}`);
        // Add logic to remove node from Zustand state if needed
      };
      
      // Configure canvas settings
      graphCanvas.background_image = null;
      graphCanvas.render_shadows = false;
      graphCanvas.render_canvas_border = false;
      graphCanvas.allow_dragcanvas = true;
      graphCanvas.allow_dragnodes = true;
      graphCanvas.render_connections_shadows = false;
      
      // Enhanced touch/gesture support
      setupTouchGestures(graphCanvas);
      
      // Center the view
      graphCanvas.ds.scale = 1.0;
      graphCanvas.ds.offset = [0, 0];
      
      graph.start();
    };

    initializeEnhancedGraph();
    
    const checkInterval = setInterval(() => {
      if (window.LiteGraph && window.LGraphCanvas) {
        clearInterval(checkInterval);
        initializeEnhancedGraph();
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      if (graphRef.current) {
        graphRef.current.stop();
      }
    };
  }, []);

  // Setup enhanced features
  const setupEnhancedFeatures = (graph, graphCanvas) => {
    // Context menu extensions
    contextMenuExtensions.current.setupContextMenu(graphCanvas, {
      onAddAudioTrigger: (nodeId, position) => {
        console.log('Adding audio trigger at', position);
        // Add audio trigger logic here
      },
      onQuantizeToBeat: (nodeId) => {
        console.log('Quantizing node to beat', nodeId);
        // Beat quantization logic here
      },
      onGroupNodes: (selectedNodes) => {
        nodeGroupingHelpers.current.groupNodes(selectedNodes, graph);
      },
      onUnGroupNodes: (group) => {
        nodeGroupingHelpers.current.unGroupNodes(group, graph);
      }
    });
    
    // Node selection tracking
    graph.onNodeSelected = (node) => {
      setSelectedNodes(prev => {
        if (!prev.includes(node.id)) {
          return [...prev, node.id];
        }
        return prev;
      });
    };
    
    graph.onNodeDeselected = (node) => {
      setSelectedNodes(prev => prev.filter(id => id !== node.id));
    };
    
    // Enhanced search events
    searchEnhancements.current.setupSearchEvents(graphCanvas, {
      onSearchFiltered: (query, results) => {
        console.log('Search filtered:', query, results);
      },
      onSearchItemHighlight: (item) => {
        console.log('Search item highlighted:', item);
      }
    });
    
    // Batch link operations
    setupBatchLinkOperations(graphCanvas);
    
    // Lightweight event hooks
    setupEventHooks(graph, graphCanvas);
  };

  // Setup touch gestures for mobile/tablet support
  const setupTouchGestures = (graphCanvas) => {
    let lastTouchDistance = 0;
    let isPinching = false;
    
    const canvas = canvasRef.current;
    
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }
    });
    
    canvas.addEventListener('touchmove', (e) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const scaleChange = currentDistance / lastTouchDistance;
        graphCanvas.ds.scale *= scaleChange;
        graphCanvas.ds.scale = Math.max(0.1, Math.min(3.0, graphCanvas.ds.scale));
        
        lastTouchDistance = currentDistance;
        graphCanvas.setDirty(true, true);
      }
    });
    
    canvas.addEventListener('touchend', () => {
      isPinching = false;
    });
  };

  // Setup batch link operations
  const setupBatchLinkOperations = (graphCanvas) => {
    let selectedLinks = [];
    let isDraggingLinks = false;
    
    // Override link selection behavior
    const originalOnMouseDown = graphCanvas.onMouseDown;
    graphCanvas.onMouseDown = function(e) {
      const link = this.getLink(e.clientX, e.clientY);
      if (link && e.shiftKey) {
        // Multi-select links
        if (!selectedLinks.includes(link)) {
          selectedLinks.push(link);
        }
        return true;
      } else if (!e.shiftKey) {
        selectedLinks = [];
      }
      return originalOnMouseDown.call(this, e);
    };
    
    // Add batch operations to context menu
    const originalGetContextMenuOptions = graphCanvas.getContextMenuOptions;
    graphCanvas.getContextMenuOptions = function() {
      const options = originalGetContextMenuOptions.call(this);
      
      if (selectedLinks.length > 0) {
        options.push({
          content: `Delete ${selectedLinks.length} Links`,
          callback: () => {
            selectedLinks.forEach(link => {
              const outputNode = graphRef.current.getNodeById(link.origin_id);
              if (outputNode) {
                outputNode.disconnectOutput(link.origin_slot);
              }
            });
            selectedLinks = [];
          }
        });
        
        options.push({
          content: `Reroute ${selectedLinks.length} Links`,
          callback: () => {
            // Implement link rerouting logic
            console.log('Rerouting links:', selectedLinks);
          }
        });
      }
      
      return options;
    };
  };

  // Setup lightweight event hooks
  const setupEventHooks = (graph, graphCanvas) => {
    // Enhanced node rendered hook
    const originalDrawNode = graphCanvas.drawNode;
    graphCanvas.drawNode = function(node, ctx) {
      const result = originalDrawNode.call(this, node, ctx);
      
      // Trigger custom onNodeRendered event
      if (node.onNodeRendered) {
        node.onNodeRendered(ctx);
      }
      
      // Global node rendered event
      document.dispatchEvent(new CustomEvent('nodeRendered', {
        detail: { node, canvas: this, context: ctx }
      }));
      
      return result;
    };
    
    // Enhanced link added hook
    const originalConnect = graph.connect;
    graph.connect = function(output_node_id, output_slot, input_node_id, input_slot) {
      const result = originalConnect.call(this, output_node_id, output_slot, input_node_id, input_slot);
      
      if (result) {
        // Trigger custom onLinkAdded event
        document.dispatchEvent(new CustomEvent('linkAdded', {
          detail: { 
            outputNode: output_node_id,
            outputSlot: output_slot,
            inputNode: input_node_id,
            inputSlot: input_slot,
            graph: this
          }
        }));
      }
      
      return result;
    };
    
    // Enhanced parameter changed hook
    const originalOnPropertyChanged = LiteGraph.LGraphNode.prototype.onPropertyChanged;
    LiteGraph.LGraphNode.prototype.onPropertyChanged = function(name, value, prev_value) {
      const result = originalOnPropertyChanged.call(this, name, value, prev_value);
      
      // Trigger custom onParamChanged event
      document.dispatchEvent(new CustomEvent('paramChanged', {
        detail: {
          node: this,
          property: name,
          value: value,
          previousValue: prev_value
        }
      }));
      
      return result;
    };
  };

  // Theme switching
  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    if (themeManager.current && canvasRef.current) {
      themeManager.current.applyTheme(newTheme, canvasRef.current);
    }
  };

  // Node grouping operations
  const handleGroupNodes = (operation) => {
    if (!nodeGroupingHelpers.current || !graphRef.current) return;
    
    const selectedLiteNodes = graphRef.current._nodes.filter(node => 
      selectedNodes.includes(node.id)
    );
    
    switch (operation) {
      case 'group':
        nodeGroupingHelpers.current.groupNodes(selectedLiteNodes, graphRef.current);
        break;
      case 'align-grid':
        nodeGroupingHelpers.current.alignToGrid(selectedLiteNodes);
        break;
      case 'align-horizontal':
        nodeGroupingHelpers.current.alignHorizontal(selectedLiteNodes);
        break;
      case 'align-vertical':
        nodeGroupingHelpers.current.alignVertical(selectedLiteNodes);
        break;
      case 'organize-by-type':
        nodeGroupingHelpers.current.organizeByType(selectedLiteNodes);
        break;
    }
  };

  // Enhanced search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (searchEnhancements.current) {
      searchEnhancements.current.performSearch(query, graphRef.current);
    }
  };

  // Export graph with metadata
  const handleExportGraph = () => {
    if (!graphRef.current) return;
    
    const serializedGraph = graphRef.current.serialize();
    
    // Add monograuvi-specific metadata
    const enhancedExport = {
      ...serializedGraph,
      metadata: {
        version: "1.0.0",
        created: new Date().toISOString(),
        application: "monograuvi",
        theme: currentTheme,
        nodeCount: graphRef.current._nodes.length,
        linkCount: graphRef.current.links ? Object.keys(graphRef.current.links).length : 0,
        audioNodes: graphRef.current._nodes.filter(n => n.type?.startsWith('audio/')).length,
        visualNodes: graphRef.current._nodes.filter(n => n.type?.startsWith('visual/')).length,
        controlNodes: graphRef.current._nodes.filter(n => n.type?.startsWith('control/')).length
      }
    };
    
    // Create deterministic export (consistent ordering)
    const sortedExport = JSON.stringify(enhancedExport, Object.keys(enhancedExport).sort(), 2);
    
    const blob = new Blob([sortedExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monograuvi-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && graphCanvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        graphCanvasRef.current.setDirty(true, true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="enhanced-node-graph-container" data-theme={currentTheme}>
      {/* Enhanced Toolbar */}
      <div className="enhanced-graph-toolbar">
        <div className="toolbar-section">
          <button 
            className="toolbar-btn"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Search Nodes (Ctrl+F)"
          >
            <i className="ri-search-line"></i>
          </button>
          
          {isSearchOpen && (
            <div className="search-container">
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>
          )}
        </div>
        
        <div className="toolbar-section">
          <button 
            className="toolbar-btn"
            onClick={handleExportGraph}
            title="Export Graph"
          >
            <i className="ri-download-line"></i>
          </button>
          
          <button 
            className="toolbar-btn"
            onClick={() => setGroupingMode(!groupingMode)}
            title="Toggle Grouping Mode"
          >
            <i className="ri-group-line"></i>
          </button>
        </div>
        
        {/* Node Grouping Controls */}
        {groupingMode && selectedNodes.length > 1 && (
          <div className="toolbar-section grouping-controls">
            <button 
              className="toolbar-btn"
              onClick={() => handleGroupNodes('group')}
              title="Group Selected Nodes"
            >
              <i className="ri-group-2-line"></i>
            </button>
            
            <button 
              className="toolbar-btn"
              onClick={() => handleGroupNodes('align-grid')}
              title="Align to Grid"
            >
              <i className="ri-grid-line"></i>
            </button>
            
            <button 
              className="toolbar-btn"
              onClick={() => handleGroupNodes('align-horizontal')}
              title="Align Horizontally"
            >
              <i className="ri-align-center"></i>
            </button>
            
            <button 
              className="toolbar-btn"
              onClick={() => handleGroupNodes('align-vertical')}
              title="Align Vertically"
            >
              <i className="ri-align-vertically"></i>
            </button>
            
            <button 
              className="toolbar-btn"
              onClick={() => handleGroupNodes('organize-by-type')}
              title="Organize by Type"
            >
              <i className="ri-organization-chart"></i>
            </button>
          </div>
        )}
        
        <div className="flex-1"></div>
        
        {/* Theme Selector */}
        <div className="toolbar-section">
          <select 
            value={currentTheme} 
            onChange={(e) => handleThemeChange(e.target.value)}
            className="theme-selector"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="high-contrast">High Contrast</option>
            <option value="audio-reactive">Audio Reactive</option>
          </select>
        </div>
        
        <div className="toolbar-section">
          <button 
            className="toolbar-btn"
            onClick={() => graphCanvasRef.current?.centerOnGraph()}
            title="Center View"
          >
            <i className="ri-focus-3-line"></i>
          </button>
          
          <button 
            className="toolbar-btn"
            title="Fullscreen"
          >
            <i className="ri-fullscreen-line"></i>
          </button>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="graph-status-bar">
        <span>Nodes: {nodes.length}</span>
        <span>Selected: {selectedNodes.length}</span>
        <span>Theme: {currentTheme}</span>
        {audioContext && <span>Audio: Connected</span>}
      </div>
      
      <canvas ref={canvasRef} className="enhanced-litegraph"></canvas>
    </div>
  );
}

export default EnhancedNodeGraph;
