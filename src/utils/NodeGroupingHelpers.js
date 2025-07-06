// src/utils/NodeGroupingHelpers.js
/* global LiteGraph */

export class NodeGroupingHelpers {
  constructor() {
    this.groups = new Map();
    this.groupCounter = 0;
    this.gridSize = 20;
    this.nodeSpacing = { x: 200, y: 150 };
  }

  // Group nodes into a visual group
  groupNodes(nodes, graph) {
    if (!nodes || nodes.length < 2) {
      console.warn('Need at least 2 nodes to create a group');
      return null;
    }

    const groupId = `group_${++this.groupCounter}`;
    const bounds = this.calculateBounds(nodes);
    
    // Create group visual representation
    const group = {
      id: groupId,
      nodes: nodes.map(n => n.id),
      bounds: bounds,
      color: this.generateGroupColor(),
      title: `Group ${this.groupCounter}`,
      collapsed: false,
      created: Date.now()
    };

    // Add group to LiteGraph if available
    if (graph && graph.extra) {
      if (!graph.extra.groups) graph.extra.groups = [];
      graph.extra.groups.push({
        title: group.title,
        bounding: [bounds.x - 10, bounds.y - 30, bounds.width + 20, bounds.height + 40],
        color: group.color,
        font_size: 24
      });
    }

    // Mark nodes as grouped
    nodes.forEach(node => {
      node.groupId = groupId;
      if (node.color) node.originalColor = node.color;
      node.color = group.color;
    });

    this.groups.set(groupId, group);
    console.log(`Created group ${groupId} with ${nodes.length} nodes`);
    
    return group;
  }

  // Ungroup nodes
  unGroupNodes(groupId, graph) {
    const group = this.groups.get(groupId);
    if (!group) {
      console.warn('Group not found:', groupId);
      return false;
    }

    // Remove from LiteGraph groups
    if (graph && graph.extra && graph.extra.groups) {
      const groupIndex = graph.extra.groups.findIndex(g => g.title === group.title);
      if (groupIndex >= 0) {
        graph.extra.groups.splice(groupIndex, 1);
      }
    }

    // Restore node properties
    group.nodes.forEach(nodeId => {
      const node = graph ? graph.getNodeById(nodeId) : null;
      if (node) {
        delete node.groupId;
        if (node.originalColor) {
          node.color = node.originalColor;
          delete node.originalColor;
        } else {
          delete node.color;
        }
      }
    });

    this.groups.delete(groupId);
    console.log(`Ungrouped ${group.title}`);
    return true;
  }

  // Align nodes to grid
  alignToGrid(nodes) {
    if (!nodes || nodes.length === 0) return;

    nodes.forEach(node => {
      if (node.pos) {
        node.pos[0] = Math.round(node.pos[0] / this.gridSize) * this.gridSize;
        node.pos[1] = Math.round(node.pos[1] / this.gridSize) * this.gridSize;
      }
    });

    console.log(`Aligned ${nodes.length} nodes to grid`);
  }

  // Align nodes horizontally
  alignHorizontal(nodes) {
    if (!nodes || nodes.length < 2) return;

    // Find the topmost node's Y position
    const targetY = Math.min(...nodes.map(n => n.pos ? n.pos[1] : 0));

    nodes.forEach(node => {
      if (node.pos) {
        node.pos[1] = targetY;
      }
    });

    console.log(`Aligned ${nodes.length} nodes horizontally`);
  }

  // Align nodes vertically
  alignVertical(nodes) {
    if (!nodes || nodes.length < 2) return;

    // Find the leftmost node's X position
    const targetX = Math.min(...nodes.map(n => n.pos ? n.pos[0] : 0));

    nodes.forEach(node => {
      if (node.pos) {
        node.pos[0] = targetX;
      }
    });

    console.log(`Aligned ${nodes.length} nodes vertically`);
  }

  // Distribute nodes evenly
  distributeEvenly(nodes, direction = 'horizontal') {
    if (!nodes || nodes.length < 3) return;

    // Sort nodes by position
    const sortedNodes = [...nodes].sort((a, b) => {
      if (direction === 'horizontal') {
        return (a.pos ? a.pos[0] : 0) - (b.pos ? b.pos[0] : 0);
      } else {
        return (a.pos ? a.pos[1] : 0) - (b.pos ? b.pos[1] : 0);
      }
    });

    const first = sortedNodes[0];
    const last = sortedNodes[sortedNodes.length - 1];
    
    if (!first.pos || !last.pos) return;

    const totalDistance = direction === 'horizontal' ? 
      last.pos[0] - first.pos[0] : 
      last.pos[1] - first.pos[1];
    
    const step = totalDistance / (sortedNodes.length - 1);

    sortedNodes.forEach((node, index) => {
      if (index === 0 || index === sortedNodes.length - 1) return; // Keep first and last in place
      
      if (direction === 'horizontal') {
        node.pos[0] = first.pos[0] + (step * index);
      } else {
        node.pos[1] = first.pos[1] + (step * index);
      }
    });

    console.log(`Distributed ${nodes.length} nodes evenly ${direction}`);
  }

  // Organize nodes by type
  organizeByType(nodes) {
    if (!nodes || nodes.length === 0) return;

    // Group nodes by type
    const nodesByType = new Map();
    nodes.forEach(node => {
      const type = node.type ? node.type.split('/')[0] : 'unknown';
      if (!nodesByType.has(type)) {
        nodesByType.set(type, []);
      }
      nodesByType.get(type).push(node);
    });

    // Calculate starting position
    const bounds = this.calculateBounds(nodes);
    let currentX = bounds.x;
    let currentY = bounds.y;
    const columnWidth = 250;
    const rowHeight = 180;

    // Arrange each type in columns
    for (const [type, typeNodes] of nodesByType) {
      console.log(`Organizing ${typeNodes.length} ${type} nodes`);
      
      typeNodes.forEach((node, index) => {
        if (node.pos) {
          node.pos[0] = currentX;
          node.pos[1] = currentY + (index * rowHeight);
        }
      });

      currentX += columnWidth;
    }

    console.log(`Organized ${nodes.length} nodes by type`);
  }

  // Auto-layout nodes in a flow pattern
  autoLayoutFlow(nodes, direction = 'left-to-right') {
    if (!nodes || nodes.length === 0) return;

    // Analyze connections to determine flow
    const connectionMap = this.analyzeConnections(nodes);
    const layers = this.calculateLayers(nodes, connectionMap);
    
    this.arrangeInLayers(layers, direction);
    console.log(`Auto-layouted ${nodes.length} nodes in ${direction} flow`);
  }

  // Circular layout
  arrangeInCircle(nodes, centerX = 400, centerY = 300, radius = 200) {
    if (!nodes || nodes.length === 0) return;

    const angleStep = (2 * Math.PI) / nodes.length;
    
    nodes.forEach((node, index) => {
      const angle = index * angleStep;
      if (node.pos) {
        node.pos[0] = centerX + Math.cos(angle) * radius;
        node.pos[1] = centerY + Math.sin(angle) * radius;
      }
    });

    console.log(`Arranged ${nodes.length} nodes in circle`);
  }

  // Tree layout for hierarchical structures
  arrangeAsTree(nodes, rootNode = null) {
    if (!nodes || nodes.length === 0) return;

    // Find root node if not specified
    if (!rootNode) {
      rootNode = this.findRootNode(nodes);
    }

    if (!rootNode) {
      console.warn('No root node found for tree layout');
      return;
    }

    const tree = this.buildTree(nodes, rootNode);
    this.layoutTree(tree, 400, 100, 200, 150);
    
    console.log(`Arranged ${nodes.length} nodes as tree`);
  }

  // Create a macro from selected nodes
  createMacro(nodes) {
    if (!nodes || nodes.length < 2) {
      console.warn('Need at least 2 nodes to create a macro');
      return null;
    }

    const macroId = `macro_${Date.now()}`;
    const bounds = this.calculateBounds(nodes);
    
    // Analyze inputs and outputs
    const { inputs, outputs } = this.analyzeMacroIO(nodes);
    
    const macro = {
      id: macroId,
      name: `Macro ${this.groupCounter}`,
      nodes: nodes.map(n => ({ 
        id: n.id, 
        type: n.type, 
        pos: [...n.pos], 
        properties: { ...n.properties }
      })),
      inputs: inputs,
      outputs: outputs,
      bounds: bounds,
      created: Date.now()
    };

    // Save macro to local storage
    this.saveMacro(macro);
    
    console.log(`Created macro ${macroId} with ${nodes.length} nodes`);
    return macro;
  }

  // Utility methods
  calculateBounds(nodes) {
    if (!nodes || nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      if (node.pos) {
        const nodeWidth = node.size ? node.size[0] : 200;
        const nodeHeight = node.size ? node.size[1] : 100;
        
        minX = Math.min(minX, node.pos[0]);
        minY = Math.min(minY, node.pos[1]);
        maxX = Math.max(maxX, node.pos[0] + nodeWidth);
        maxY = Math.max(maxY, node.pos[1] + nodeHeight);
      }
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  generateGroupColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    return colors[this.groupCounter % colors.length];
  }

  analyzeConnections(nodes) {
    const connections = new Map();
    
    nodes.forEach(node => {
      connections.set(node.id, { inputs: [], outputs: [] });
    });

    // This would need access to the actual graph to analyze connections
    // For now, return empty connections
    return connections;
  }

  calculateLayers(nodes, connectionMap) {
    // Implement topological sorting to create layers
    const layers = [];
    const visited = new Set();
    const nodeIds = nodes.map(n => n.id);

    // Simple layer calculation - in practice this would be more sophisticated
    let currentLayer = 0;
    const nodesPerLayer = Math.ceil(Math.sqrt(nodes.length));
    
    for (let i = 0; i < nodes.length; i += nodesPerLayer) {
      layers[currentLayer] = nodes.slice(i, i + nodesPerLayer);
      currentLayer++;
    }

    return layers;
  }

  arrangeInLayers(layers, direction) {
    const startX = 100;
    const startY = 100;
    const layerSpacing = direction === 'left-to-right' ? 300 : 200;
    const nodeSpacing = direction === 'left-to-right' ? 150 : 200;

    layers.forEach((layer, layerIndex) => {
      layer.forEach((node, nodeIndex) => {
        if (node.pos) {
          if (direction === 'left-to-right') {
            node.pos[0] = startX + (layerIndex * layerSpacing);
            node.pos[1] = startY + (nodeIndex * nodeSpacing);
          } else { // top-to-bottom
            node.pos[0] = startX + (nodeIndex * nodeSpacing);
            node.pos[1] = startY + (layerIndex * layerSpacing);
          }
        }
      });
    });
  }

  findRootNode(nodes) {
    // Look for nodes with no inputs (potential root nodes)
    // This is simplified - in practice would analyze actual connections
    return nodes[0];
  }

  buildTree(nodes, rootNode) {
    // Build tree structure from nodes
    // Simplified implementation
    return {
      node: rootNode,
      children: []
    };
  }

  layoutTree(tree, x, y, xSpacing, ySpacing) {
    // Recursive tree layout
    if (tree.node && tree.node.pos) {
      tree.node.pos[0] = x;
      tree.node.pos[1] = y;
    }

    if (tree.children && tree.children.length > 0) {
      const childSpacing = xSpacing / tree.children.length;
      tree.children.forEach((child, index) => {
        const childX = x - (xSpacing / 2) + (index * childSpacing);
        const childY = y + ySpacing;
        this.layoutTree(child, childX, childY, childSpacing, ySpacing);
      });
    }
  }

  analyzeMacroIO(nodes) {
    // Analyze which inputs/outputs should be exposed for the macro
    const inputs = [];
    const outputs = [];

    // This would analyze actual node connections to determine macro interface
    // Simplified for now
    return { inputs, outputs };
  }

  saveMacro(macro) {
    const macros = JSON.parse(localStorage.getItem('monograuvi-macros') || '[]');
    macros.push(macro);
    localStorage.setItem('monograuvi-macros', JSON.stringify(macros));
  }

  loadMacros() {
    return JSON.parse(localStorage.getItem('monograuvi-macros') || '[]');
  }

  // Preset layouts
  applyPresetLayout(nodes, preset) {
    switch (preset) {
      case 'audio-chain':
        this.arrangeAudioChain(nodes);
        break;
      case 'visual-mixer':
        this.arrangeVisualMixer(nodes);
        break;
      case 'control-panel':
        this.arrangeControlPanel(nodes);
        break;
      case 'signal-flow':
        this.autoLayoutFlow(nodes, 'left-to-right');
        break;
      case 'radial':
        this.arrangeInCircle(nodes);
        break;
      default:
        console.warn('Unknown preset layout:', preset);
    }
  }

  arrangeAudioChain(nodes) {
    // Arrange audio nodes in a typical signal chain order
    const audioNodes = nodes.filter(n => n.type?.startsWith('audio/'));
    const otherNodes = nodes.filter(n => !n.type?.startsWith('audio/'));

    // Audio chain order: source -> effects -> analysis -> output
    const order = ['source', 'analyser', 'beat-detector', 'pitch-detector', 'spectral-analyser'];
    const orderedNodes = [];

    order.forEach(type => {
      const matching = audioNodes.filter(n => n.type?.includes(type));
      orderedNodes.push(...matching);
    });

    // Add any remaining audio nodes
    audioNodes.forEach(node => {
      if (!orderedNodes.includes(node)) {
        orderedNodes.push(node);
      }
    });

    // Position audio nodes horizontally
    orderedNodes.forEach((node, index) => {
      if (node.pos) {
        node.pos[0] = 100 + (index * 250);
        node.pos[1] = 100;
      }
    });

    // Position other nodes below
    otherNodes.forEach((node, index) => {
      if (node.pos) {
        node.pos[0] = 100 + (index * 200);
        node.pos[1] = 300;
      }
    });
  }

  arrangeVisualMixer(nodes) {
    // Arrange visual nodes in a mixer-like layout
    const visualNodes = nodes.filter(n => n.type?.startsWith('visual/'));
    const controlNodes = nodes.filter(n => n.type?.startsWith('control/'));
    const outputNodes = nodes.filter(n => n.type?.startsWith('output/'));

    // Visual sources on the left
    visualNodes.forEach((node, index) => {
      if (node.pos) {
        node.pos[0] = 100;
        node.pos[1] = 100 + (index * 180);
      }
    });

    // Controls in the middle
    controlNodes.forEach((node, index) => {
      if (node.pos) {
        node.pos[0] = 350;
        node.pos[1] = 100 + (index * 150);
      }
    });

    // Outputs on the right
    outputNodes.forEach((node, index) => {
      if (node.pos) {
        node.pos[0] = 600;
        node.pos[1] = 100 + (index * 200);
      }
    });
  }

  arrangeControlPanel(nodes) {
    // Arrange control nodes in a panel-like grid
    const controlNodes = nodes.filter(n => n.type?.startsWith('control/'));
    const otherNodes = nodes.filter(n => !n.type?.startsWith('control/'));

    const cols = Math.ceil(Math.sqrt(controlNodes.length));
    
    controlNodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      if (node.pos) {
        node.pos[0] = 100 + (col * 180);
        node.pos[1] = 100 + (row * 120);
      }
    });

    // Place other nodes to the right
    otherNodes.forEach((node, index) => {
      if (node.pos) {
        node.pos[0] = 100 + (cols * 180) + 50;
        node.pos[1] = 100 + (index * 150);
      }
    });
  }

  // Animation helpers for smooth transitions
  animateToPosition(node, targetPos, duration = 500) {
    if (!node.pos) return;

    const startPos = [...node.pos];
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = this.easeInOutCubic(progress);
      
      node.pos[0] = startPos[0] + (targetPos[0] - startPos[0]) * eased;
      node.pos[1] = startPos[1] + (targetPos[1] - startPos[1]) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }
}

export default NodeGroupingHelpers;
