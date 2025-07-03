// src/components/NodeGraph.jsx
import React, { useEffect, useRef } from 'react';
import 'litegraph.js/css/litegraph.css';
/* global LiteGraph */
import { registerAllNodes, nodeTypeMapping, nodeCategories, nodeDescriptions } from '../nodes/registerNodes';
import useStore from '../store';
import { QuickConnection } from '../utils/QuickConnection';

function NodeGraph({ audioRef }) {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const addNode = useStore(state => state.addNode);
  const nodes = useStore(state => state.nodes);
  const setGraph = useStore(state => state.setGraph);
  
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
      const graphCanvas = new LGraphCanvas(canvas, graph);
      
      // Configure the graph canvas
      graphCanvas.background_image = null;
      graphCanvas.render_shadows = false;
      graphCanvas.render_canvas_border = false;
      
      graphRef.current = graph;
      setGraph(graph);
      
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
      
      // Center the view
      graphCanvas.ds.scale = 1.0;
      graphCanvas.ds.offset = [0, 0];
      
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
        if (window.LGraphCanvas && graphRef.current) {
          const graphCanvas = canvasRef.current.graphCanvas;
          if (graphCanvas) {
            graphCanvas.setDirty(true, true);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle adding nodes from the library
  useEffect(() => {
    if (!graphRef.current || !window.LiteGraph) return;
    
    const LiteGraph = window.LiteGraph;
    
    const handleAddNode = (nodeType) => {
      const mappedType = nodeTypeMapping[nodeType] || nodeType;
      const node = LiteGraph.createNode(mappedType);
      if (!node) {
        console.warn(`Could not create node of type: ${mappedType} (original: ${nodeType})`);
        return;
      }
      
      // Position new node near the center
      const centerX = 400;
      const centerY = 300;
      
      node.pos = [centerX, centerY];
      graphRef.current.add(node);
      
      // Add to global store
      addNode({
        id: node.id,
        type: nodeType,
        position: [centerX, centerY]
      });
    };
    
    const unsubscribe = useStore.subscribe(
      state => state.lastAddedNode,
      (nodeType) => {
        if (nodeType) handleAddNode(nodeType);
      }
    );
    
    return unsubscribe;
  }, [addNode]);
  
  // Handle node drag from library
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
      
      node.pos = [x, y];
      graphRef.current.add(node);
      
      // Add to global store
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
  }, [addNode]);

  useEffect(() => {
    if (!graphRef.current || !window.LiteGraph || !canvasRef.current) return;

    const LiteGraph = window.LiteGraph;
    const graphCanvas = new LiteGraph.LGraphCanvas(canvasRef.current, graphRef.current);
    canvasRef.current.graphCanvas = graphCanvas;

    const quickConnection = new QuickConnection();
    quickConnection.initListeners(graphCanvas);

    return () => {
      quickConnection.enabled = false;
    };
  }, []);

  return (
    <div className="node-graph-container">
      <div className="graph-toolbar">
        <button className="toolbar-btn">
          <i className="ri-save-line"></i>
        </button>
        <button className="toolbar-btn">
          <i className="ri-download-line"></i>
        </button>
        <button className="toolbar-btn">
          <i className="ri-settings-3-line"></i>
        </button>
        <div className="flex-1"></div>
        <button className="toolbar-btn">
          <i className="ri-fullscreen-line"></i>
        </button>
      </div>
      <canvas ref={canvasRef} className="litegraph"></canvas>
    </div>
  );
}

export default NodeGraph;
