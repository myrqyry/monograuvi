// src/components/EnhancedNodeGraph.jsx
import React, { useEffect, useRef, useState } from 'react';
import 'litegraph.js/css/litegraph.css';
/* global LiteGraph */
import { registerAllNodes, nodeTypeMapping, nodeCategories, nodeDescriptions } from '../nodes/registerNodes';
import useStore from '../store';
import { QuickConnection } from '../utils/QuickConnection';
import { EnhancedWidgets } from '../utils/EnhancedWidgets';
import { AddNodeCommand, RemoveNodeCommand, MoveNodeCommand } from '../utils/commands';
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
  const removeNode = useStore(state => state.removeNode);
  const updateNodePositionInStore = useStore(state => state.updateNodePosition); // For MoveNodeCommand

  // Undo/Redo stacks
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  
  // Enhanced utilities
  const enhancedWidgets = useRef(null);
  const contextMenuExtensions = useRef(null);
  const nodeGroupingHelpers = useRef(null);
  const themeManager = useRef(null);
  const searchEnhancements = useRef(null);
  const internalClipboardRef = useRef([]); // For copy-paste
  
  // Command execution and Undo/Redo logic
  const executeCommand = (command) => {
    command.execute();
    undoStack.current.push(command);
    redoStack.current = []; // Clear redo stack whenever a new command is executed
    // TODO: Update UI to enable/disable undo/redo buttons if they exist
    console.log("Command executed, undoStack:", undoStack.current.length, "redoStack:", redoStack.current.length);
  };

  const handleUndo = () => {
    if (undoStack.current.length > 0) {
      const command = undoStack.current.pop();
      command.undo();
      redoStack.current.push(command);
      // TODO: Update UI
      console.log("Undo performed, undoStack:", undoStack.current.length, "redoStack:", redoStack.current.length);
      graphCanvasRef.current.setDirty(true, true); // Redraw graph
    } else {
      console.log("Undo stack empty.");
    }
  };

  const handleRedo = () => {
    if (redoStack.current.length > 0) {
      const command = redoStack.current.pop();
      command.execute(); // Or command.redo() if defined separately
      undoStack.current.push(command);
      // TODO: Update UI
      console.log("Redo performed, undoStack:", undoStack.current.length, "redoStack:", redoStack.current.length);
      graphCanvasRef.current.setDirty(true, true); // Redraw graph
    } else {
      console.log("Redo stack empty.");
    }
  };

  // Node operation handlers for context menu
  const handleDeleteNodes = (nodesToDelete) => {
    if (!graphRef.current || !nodesToDelete || nodesToDelete.length === 0) return;

    const nodesDataToSave = nodesToDelete.map(node => {
      const liteGraphNode = graphRef.current.getNodeById(node.id);
      if (!liteGraphNode) return null; // Should not happen if node.id is from a valid node
      return {
        id: liteGraphNode.id,
        type: liteGraphNode.type,
        pos: [...liteGraphNode.pos],
        properties: liteGraphNode.properties ? JSON.parse(JSON.stringify(liteGraphNode.properties)) : {},
        size: liteGraphNode.size ? [...liteGraphNode.size] : undefined,
        // Later: capture connections if they are to be restored
      };
    }).filter(Boolean); // Filter out any nulls if a node wasn't found

    if (nodesDataToSave.length === 0) return;

    const command = new RemoveNodeCommand(graphRef.current, addNode, removeNode, nodesDataToSave);
    executeCommand(command);

    setSelectedNodes([]); // Clear local selection state after command execution
    graphCanvasRef.current.setDirty(true, true); // Redraw
    console.log('DeleteNode command created for:', nodesToDelete.map(n => n.id));
  };

  const handleDuplicateNodes = (nodesToDuplicate) => {
    if (!graphRef.current || !nodesToDuplicate || nodesToDuplicate.length === 0) return;
    if (!graphRef.current || !nodesToDuplicate || nodesToDuplicate.length === 0) return;

    const duplicateCommands = nodesToDuplicate.map(nodeToDuplicate => {
      const originalNode = graphRef.current.getNodeById(nodeToDuplicate.id);
      if (!originalNode) {
        console.warn(`Original node with id ${nodeToDuplicate.id} not found for duplication command.`);
        return null;
      }

      const nodeDataForCommand = {
        type: originalNode.type,
        pos: [originalNode.pos[0] + 30, originalNode.pos[1] + 30], // Offset
        properties: originalNode.properties ? JSON.parse(JSON.stringify(originalNode.properties)) : {},
        size: originalNode.size ? [...originalNode.size] : undefined,
      };
      return new AddNodeCommand(graphRef.current, addNode, removeNode, nodeDataForCommand);
    }).filter(Boolean);

    if (duplicateCommands.length > 0) {
      // If we want one undo for all duplicated nodes, we'd need a BatchCommand.
      // For now, each duplicated node will be a separate undo step.
      duplicateCommands.forEach(cmd => executeCommand(cmd));
      graphCanvasRef.current.setDirty(true, true); // Redraw
      console.log('Duplicated nodes using AddNodeCommand via context menu:', nodesToDuplicate.map(n => n.id));
    }
  };

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
      // graph.onNodeAdded is already handled by AddNodeCommand's execute method
      // graph.onNodeRemoved is already handled by RemoveNodeCommand's execute method

      // Store initial positions of nodes for move tracking
      const nodeInitialPositionsOnDrag = new Map();

      // Override or hook into mouse down processing to capture initial positions
      // This is a bit intrusive but necessary for accurate oldPos for MoveCommand.
      const originalProcessMouseDown = graphCanvas.processMouseDown;
      graphCanvas.processMouseDown = function(e) {
        const result = originalProcessMouseDown.apply(this, arguments);
        if (this.dragging_node) {
          nodeInitialPositionsOnDrag.clear(); // Clear previous drag data
          if (this.selected_nodes && Object.keys(this.selected_nodes).length > 0) {
            for (const nodeId in this.selected_nodes) {
              const node = this.selected_nodes[nodeId];
              nodeInitialPositionsOnDrag.set(node.id, [...node.pos]);
            }
          } else if (this.dragging_node) { // Single node drag
            nodeInitialPositionsOnDrag.set(this.dragging_node.id, [...this.dragging_node.pos]);
          }
        }
        return result;
      };

      graphCanvas.onNodeMoved = function(movedNodeInstance) { // 'this' is LGraphCanvas
        // Note: 'movedNodeInstance' is the single node that LiteGraph reports as moved.
        // If multiple nodes were selected and moved, they all moved by the same delta.
        const movedNodesData = [];

        if (nodeInitialPositionsOnDrag.size > 0) {
          // Iterate over the nodes whose positions were captured at drag start
          nodeInitialPositionsOnDrag.forEach((oldPos, nodeId) => {
            const node = this.graph.getNodeById(nodeId); // 'this.graph' is LGraph instance
            if (node && (node.pos[0] !== oldPos[0] || node.pos[1] !== oldPos[1])) {
              movedNodesData.push({
                nodeId: node.id,
                oldPos: oldPos,
                newPos: [...node.pos],
              });
            }
          });

          if (movedNodesData.length > 0) {
            // 'executeCommand', 'graphRef', 'updateNodePositionInStore' are from the outer scope of EnhancedNodeGraph
            // This closure should work as this function is defined within useEffect.
            const command = new MoveNodeCommand(graphRef.current, updateNodePositionInStore, movedNodesData);
            executeCommand(command);
          }
          nodeInitialPositionsOnDrag.clear(); // Important to clear after processing a move
        }
      };
      
      // Configure canvas settings
      graphCanvas.background_image = null;
      graphCanvas.render_shadows = false;
      graphCanvas.render_canvas_border = false;
      graphCanvas.allow_dragcanvas = true;
      graphCanvas.allow_dragnodes = true;
      graphCanvas.render_connections_shadows = false;
      graphCanvas.render_grid = true; // Show visual grid
      
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
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keyboard shortcuts handler
  const handleKeyDown = (event) => {
    if (!graphRef.current || !graphCanvasRef.current) return;

    // Don't interfere if an input field is focused
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
      return;
    }

    const isCtrlOrMeta = event.ctrlKey || event.metaKey;

    if (isCtrlOrMeta && event.key === 'z') { // Undo
      event.preventDefault();
      handleUndo();
    } else if (isCtrlOrMeta && event.key === 'y') { // Redo (Ctrl+Y)
      event.preventDefault();
      handleRedo();
    } else if (isCtrlOrMeta && event.shiftKey && event.key === 'Z') { // Redo (Ctrl+Shift+Z)
      event.preventDefault();
      handleRedo();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedLiteGraphNodes = Object.values(graphRef.current.selected_nodes || {});
      if (selectedLiteGraphNodes.length > 0) {
        const nodesDataToSave = selectedLiteGraphNodes.map(node => ({
          id: node.id,
          type: node.type,
          pos: [...node.pos],
          properties: node.properties ? JSON.parse(JSON.stringify(node.properties)) : {},
          size: node.size ? [...node.size] : undefined,
        })).filter(Boolean);

        if (nodesDataToSave.length > 0) {
          const command = new RemoveNodeCommand(graphRef.current, addNode, removeNode, nodesDataToSave);
          executeCommand(command);
          setSelectedNodes([]);
          graphCanvasRef.current.setDirty(true,true);
          console.log('DeleteNode command created via keyboard for:', nodesDataToSave.map(n => n.id));
        }
      }
    } else if (isCtrlOrMeta && event.key === 'c') { // Copy
      const selectedLiteGraphNodes = Object.values(graphRef.current.selected_nodes || {});
      if (selectedLiteGraphNodes.length > 0) {
        internalClipboardRef.current = selectedLiteGraphNodes.map(node => {
          // Basic serialization - properties might need deep cloning if they are objects/arrays
          const serializedProperties = node.properties ? JSON.parse(JSON.stringify(node.properties)) : {};
          return {
            type: node.type,
            pos: [node.pos[0] + 20, node.pos[1] + 20], // Offset for pasted node
            properties: serializedProperties,
            size: node.size ? [...node.size] : undefined, // Clone size array
            inputs: node.inputs ? JSON.parse(JSON.stringify(node.inputs)) : undefined,
            outputs: node.outputs ? JSON.parse(JSON.stringify(node.outputs)) : undefined,
            // Note: Connections are not copied in this basic implementation
          };
        });
        console.log('Nodes copied to internal clipboard:', internalClipboardRef.current);
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') { // Paste
      if (internalClipboardRef.current && internalClipboardRef.current.length > 0) {
        if (internalClipboardRef.current && internalClipboardRef.current.length > 0) {
          // Create a list of commands for all nodes to be pasted
          const pasteCommands = internalClipboardRef.current.map(serializedNode => {
            // Data for AddNodeCommand: { type, pos, properties, size }
            // ID will be generated by LiteGraph and captured by the command.
            const nodeDataForCommand = {
              type: serializedNode.type,
              pos: [...serializedNode.pos], // Use the pre-offsetted position
              properties: serializedNode.properties ? JSON.parse(JSON.stringify(serializedNode.properties)) : {},
              size: serializedNode.size ? [...serializedNode.size] : undefined,
            };
            // Offset for the next potential pasted node in the same batch for the clipboard data
            serializedNode.pos[0] += 20;
            serializedNode.pos[1] += 20;
            return new AddNodeCommand(graphRef.current, addNode, removeNode, nodeDataForCommand);
          });

          // Execute all paste commands
          // If we want one undo for all pasted nodes, we'd need a BatchCommand.
          // For now, each pasted node will be a separate undo step.
          pasteCommands.forEach(cmd => executeCommand(cmd));

          graphCanvasRef.current.setDirty(true,true); // Redraw
          console.log('Pasted nodes using AddNodeCommand from internal clipboard');
        }
      }
    }
  };

  // Add and remove keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [removeNode, addNode]); // Ensure handleKeyDown has the latest store actions

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
      },
      onDeleteNodes: handleDeleteNodes, // Added callback
      onDuplicateNodes: handleDuplicateNodes // Added callback
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
    graphCanvas.onMouseDown = function(event) { // Changed e to event for clarity with .call
      // 'this' inside this function will be the LGraphCanvas instance (graphCanvas)
      // because it's called as graphCanvas.onMouseDown by LiteGraph's internal processMouseDown.
      // So, 'this.getLink' should be correct if 'getLink' is a valid method of LGraphCanvas.
      // However, to be absolutely certain and avoid any potential 'this' context issues
      // if LiteGraph's internal calling pattern changes or is misremembered,
      // we can use the 'graphCanvas' variable from the closure, which is guaranteed
      // to be the LGraphCanvas instance we're operating on.
      const link = graphCanvas.getLink(event.clientX, event.clientY); // Use graphCanvas from closure

      if (link && event.shiftKey) {
        // Multi-select links
        if (!selectedLinks.includes(link)) {
          selectedLinks.push(link);
        }
        // It's important to let LiteGraph know if we handled the event
        // Returning true might stop further processing in some LiteGraph versions.
        // For link selection, usually, we don't want to stop the event if it's just for selection.
        // Let's see LiteGraph's default behavior. If it causes issues, we can return true.
      } else if (!event.shiftKey && !link) { // Only clear selection if not clicking a link or shift-clicking
        selectedLinks = [];
      }
      // Always call the original onMouseDown to ensure default behaviors are maintained.
      // Pass the correct 'this' context (the LGraphCanvas instance).
      return originalOnMouseDown.call(graphCanvas, event);
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
