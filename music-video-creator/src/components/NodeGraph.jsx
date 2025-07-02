// src/components/NodeGraph.jsx
import React, { useEffect, useRef } from 'react';
import LiteGraph from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import { useStore } from '../store';

function NodeGraph({ audioRef }) {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const addNode = useStore(state => state.addNode);
  const nodes = useStore(state => state.nodes);
  const setGraph = useStore(state => state.setGraph);
  
  // Initialize graph
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const graph = new LiteGraph.LGraph();
    const canvas = new LiteGraph.LGraphCanvas(canvasRef.current, graph);
    
    graphRef.current = graph;
    canvasRef.current = canvas;
    setGraph(graph);
    
    // Add existing nodes to the graph
    nodes.forEach(node => {
      const liteNode = LiteGraph.createNode(node.type);
      liteNode.id = node.id;
      liteNode.pos = node.position;
      graph.add(liteNode);
    });
    
    graph.start();
    
    return () => {
      graph.stop();
    };
  }, []);
  
  // Handle adding nodes from the library
  useEffect(() => {
    if (!graphRef.current) return;
    
    const handleAddNode = (nodeType) => {
      const node = LiteGraph.createNode(nodeType);
      const canvas = canvasRef.current;
      
      // Position new node near the center
      const centerX = canvas.canvas.width / (2 * canvas.ds.scale) - canvas.ds.offset[0];
      const centerY = canvas.canvas.height / (2 * canvas.ds.scale) - canvas.ds.offset[1];
      
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
    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;
    
    const handleDrop = (e) => {
      const nodeType = e.dataTransfer.getData('nodeType');
      if (!nodeType) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / graphRef.current.ds.scale - graphRef.current.ds.offset[0];
      const y = (e.clientY - rect.top) / graphRef.current.ds.scale - graphRef.current.ds.offset[1];
      
      const node = LiteGraph.createNode(nodeType);
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