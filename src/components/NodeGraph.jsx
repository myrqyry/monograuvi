// src/components/NodeGraph.jsx
import React, { useEffect, useRef, useState } from 'react';
import 'litegraph.js/css/litegraph.css';
/* global LiteGraph */
import { registerAllNodes, nodeTypeMapping, nodeCategories, nodeDescriptions } from '../nodes/registerNodes';

import useStore from '../store';

import { QuickConnection } from '../utils/QuickConnection';

function NodeGraph() {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const graphCanvasRef = useRef(null);
  const addNode = useStore(state => state.addNode);
  const nodes = useStore(state => state.nodes);
  const setGraph = useStore(state => state.setGraph);
  // Enhancement: theme state
  const [currentTheme, setCurrentTheme] = useState('dark');


  // Initialize graph
  useEffect(() => {
    const initializeGraph = () => {
      if (!canvasRef.current || !window.LiteGraph || !window.LGraphCanvas) {
        console.log('Waiting for LiteGraph to load...');
        return;
      }
      console.log('Initializing LiteGraph...');
      const LiteGraph = window.LiteGraph;
      const LGraphCanvas = window.LGraphCanvas;
      // Set canvas size properly
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      // Register all custom nodes first
      registerAllNodes();
      const graph = new LiteGraph.LGraph();
      try {
        graphCanvasRef.current = new LGraphCanvas(canvas, graph);
      } catch (error) {
        console.error("Error initializing graphCanvas:", error);
        graphCanvasRef.current = null;
        return;
      }
      // Configure the graph canvas
      graphCanvasRef.current.background_image = null;
      graphCanvasRef.current.render_shadows = false;
      graphCanvasRef.current.render_canvas_border = false;
      graphRef.current = graph;
      setGraph(graph);
      // Add existing nodes and connections to the graph
      const liteNodes = {};
      nodes.forEach(node => {
        const mappedType = nodeTypeMapping[node.type] || node.type;
        const liteNode = LiteGraph.createNode(mappedType);
        if (liteNode) {
          liteNode.id = node.id;
          liteNode.pos = node.position;
          // --- Enhancement: Show properties as widgets on the node ---
          if (liteNode.properties) {
            Object.entries(liteNode.properties).forEach(([key, value]) => {
              // Only add widget if not already present
              if (!liteNode.widgets || !liteNode.widgets.some(w => w.name === key)) {
                liteNode.addWidget("text", key, value, (v) => {
                  liteNode.setProperty(key, v);
                });
              }
            });
          }
          graph.add(liteNode);
          liteNodes[node.id] = liteNode;
        }
      });
      // Add connections between nodes
      nodes.forEach(node => {
        if (node.connections) {
          node.connections.forEach(connection => {
            const sourceNode = liteNodes[connection.sourceNodeId];
            const targetNode = liteNodes[connection.targetNodeId];
            if (sourceNode && targetNode) {
              sourceNode.connect(connection.sourceSlot, targetNode, connection.targetSlot);
            }
          });
        }
      });
      // Center the view
      graphCanvasRef.current.ds.scale = 1.0;
      graphCanvasRef.current.ds.offset = [0, 0];
      graph.start();
    };
    // Try to initialize immediately
    initializeGraph();
    // If LiteGraph isn't loaded yet, wait for it
    const checkInterval = setInterval(() => {
      if (window.LiteGraph && window.LGraphCanvas) {
        clearInterval(checkInterval);
        initializeGraph();
      }
    }, 100);
    return () => {
      clearInterval(checkInterval);
      if (graphRef.current) {
        graphRef.current.stop();
      }
    };
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Trigger a redraw if graph canvas exists
        if (graphCanvasRef.current) {
          graphCanvasRef.current.setDirty(true, true);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle adding nodes from the library (sidebar or drag)
  useEffect(() => {
    if (!graphRef.current || !window.LiteGraph) return;
    const LiteGraph = window.LiteGraph;

    // Add node at center
    const handleAddNode = (nodeType) => {
      const mappedType = nodeTypeMapping[nodeType] || nodeType;
      const node = LiteGraph.createNode(mappedType);
      if (!node) {
        console.warn(`Could not create node of type: ${mappedType} (original: ${nodeType})`);
        return;
      }
      // Add property widgets
      if (node.properties) {
        Object.entries(node.properties).forEach(([key, value]) => {
          if (!node.widgets || !node.widgets.some(w => w.name === key)) {
            node.addWidget("text", key, value, (v) => {
              node.setProperty(key, v);
            });
          }
        });
      }
      // Position new node near the center of the current view
      const { offset, scale } = graphCanvasRef.current.ds;
      const centerX = (graphCanvasRef.current.canvas.width / 2 - offset[0]) / scale;
      const centerY = (graphCanvasRef.current.canvas.height / 2 - offset[1]) / scale;
      node.pos = [centerX, centerY];
      addNode({
        id: node.id,
        type: nodeType,
        position: [centerX, centerY]
      });
      graphRef.current.add(node);
    };

    // Listen for sidebar node add
    window.__addNodeFromSidebar = handleAddNode;

    // Still support lastAddedNode from store
    const unsubscribe = useStore.subscribe(
      state => state.lastAddedNode,
      (nodeType) => {
        if (nodeType) handleAddNode(nodeType);
      }
    );
    return unsubscribe;
  }, []);
  
  // Handle node drag from sidebar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !window.LiteGraph) return;
    const LiteGraph = window.LiteGraph;

    const handleDrop = (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('nodeType');
      if (!nodeType || !graphRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const mappedType = nodeTypeMapping[nodeType] || nodeType;
      const node = LiteGraph.createNode(mappedType);
      if (!node) {
        console.warn(`Could not create node of type: ${mappedType} (original: ${nodeType})`);
        return;
      }
      // Add property widgets
      if (node.properties) {
        Object.entries(node.properties).forEach(([key, value]) => {
          if (!node.widgets || !node.widgets.some(w => w.name === key)) {
            node.addWidget("text", key, value, (v) => {
              node.setProperty(key, v);
            });
          }
        });
      }
      node.pos = [x, y];
      graphRef.current.add(node);
      addNode({
        id: node.id,
        type: nodeType,
        position: [x, y]
      });
    };
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    canvas.addEventListener('drop', handleDrop);
    canvas.addEventListener('dragover', handleDragOver);
    return () => {
      canvas.removeEventListener('drop', handleDrop);
      canvas.removeEventListener('dragover', handleDragOver);
    };
  }, []);

  useEffect(() => {
    if (!graphCanvasRef.current) return;

    const quickConnection = new QuickConnection();
    quickConnection.initListeners(graphCanvasRef.current);

    return () => {
      quickConnection.enabled = false;
    };
  }, []);

  // Enhancement: theme switching (minimal, just data-theme attr for now)
  const handleThemeChange = (e) => {
    setCurrentTheme(e.target.value);
    // If you have a ThemeManager utility, you could call it here
    // For now, just set a data-theme attribute
    if (canvasRef.current) {
      canvasRef.current.setAttribute('data-theme', e.target.value);
    }
  };

  // Enhancement: export graph with metadata
  const handleExportGraph = () => {
    if (!graphRef.current) return;
    const serializedGraph = graphRef.current.serialize();
    const enhancedExport = {
      ...serializedGraph,
      metadata: {
        version: "1.0.0",
        created: new Date().toISOString(),
        application: "monograuvi",
        theme: currentTheme,
        nodeCount: graphRef.current._nodes?.length || 0,
        linkCount: graphRef.current.links ? Object.keys(graphRef.current.links).length : 0,
        audioNodes: graphRef.current._nodes?.filter(n => n.type?.startsWith('audio/')).length || 0,
        visualNodes: graphRef.current._nodes?.filter(n => n.type?.startsWith('visual/')).length || 0,
        controlNodes: graphRef.current._nodes?.filter(n => n.type?.startsWith('control/')).length || 0
      }
    };
    const sortedExport = JSON.stringify(enhancedExport, Object.keys(enhancedExport).sort(), 2);
    const blob = new Blob([sortedExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monograuvi-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Enhancement: center view
  const handleCenterView = () => {
    if (graphCanvasRef.current && graphCanvasRef.current.centerOnGraph) {
      graphCanvasRef.current.centerOnGraph();
    }
  };

  return (
    <div className="node-graph-container" data-theme={currentTheme} style={{ display: 'flex', height: '100%' }}>
      {/* Main Graph Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="graph-toolbar">
          <button className="toolbar-btn" onClick={() => {}} title="Node Library">
            <i className="ri-menu-line"></i>
          </button>
          <button className="toolbar-btn" onClick={() => console.log('Save button clicked')}>
            <i className="ri-save-line"></i>
          </button>
          <button className="toolbar-btn" onClick={handleExportGraph} title="Export Graph">
            <i className="ri-download-line"></i>
          </button>
          <button className="toolbar-btn" onClick={() => console.log('Settings button clicked')}>
            <i className="ri-settings-3-line"></i>
          </button>
          <div className="flex-1"></div>
          {/* Theme Selector */}
          <select 
            value={currentTheme} 
            onChange={handleThemeChange}
            className="theme-selector"
            style={{ marginRight: 8 }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="high-contrast">High Contrast</option>
            <option value="audio-reactive">Audio Reactive</option>
          </select>
          <button className="toolbar-btn" onClick={handleCenterView} title="Center View">
            <i className="ri-focus-3-line"></i>
          </button>
          <button className="toolbar-btn" onClick={() => console.log('Fullscreen button clicked')}>
            <i className="ri-fullscreen-line"></i>
          </button>
        </div>
        <canvas ref={canvasRef} className="litegraph" style={{ flex: 1, width: '100%', height: '100%' }}></canvas>
      </div>
    </div>
  );
}

export default NodeGraph;
