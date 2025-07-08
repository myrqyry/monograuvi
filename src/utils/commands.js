// src/utils/commands.js

/**
 * Base Command class (or interface)
 * All specific commands should implement execute() and undo()
 */
export class Command {
  execute() {
    throw new Error("Execute method not implemented!");
  }
  undo() {
    throw new Error("Undo method not implemented!");
  }
}

/**
 * AddNodeCommand
 * Handles adding a node to the graph.
 */
export class AddNodeCommand extends Command {
  constructor(graph, zustandAddNode, zustandRemoveNode, nodeData) {
    super();
    this.graph = graph; // LiteGraph instance
    this.zustandAddNode = zustandAddNode; // Zustand's addNode action
    this.zustandRemoveNode = zustandRemoveNode; // Zustand's removeNode action
    this.nodeData = nodeData; // Data needed to create/re-create the node { type, pos, properties, id (optional for initial creation) }
    this.addedNodeId = null; // Store the ID of the node once added
  }

  execute() {
    const LiteGraphJS = window.LiteGraph;
    if (!LiteGraphJS) throw new Error("LiteGraph not available.");

    const node = LiteGraphJS.createNode(this.nodeData.type);
    if (!node) throw new Error(`Failed to create node of type ${this.nodeData.type}`);

    node.pos = this.nodeData.pos ? [...this.nodeData.pos] : [100, 100];
    if (this.nodeData.properties) {
      node.properties = JSON.parse(JSON.stringify(this.nodeData.properties));
    }
    if (this.nodeData.size) {
      node.size = [...this.nodeData.size];
    }

    // If an ID was provided (e.g., during redo of a previously added node), try to use it.
    // LiteGraph node IDs are typically numbers, ensure consistency if passing string IDs.
    // For simplicity, LiteGraph will usually assign its own ID. We capture it.
    if (this.nodeData.id) {
        // This is tricky with LiteGraph as it auto-assigns numeric IDs.
        // For a robust redo, we'd need to manage ID mapping or ensure LiteGraph can accept a specific ID.
        // For now, we'll let LiteGraph assign and store the ID it generates.
    }

    this.graph.add(node);
    this.addedNodeId = node.id; // Capture the ID assigned by LiteGraph

    // Update Zustand store
    // Ensure the data passed to zustandAddNode matches its expectations
    this.zustandAddNode({
      id: node.id,
      type: node.type, // Ensure this is the original type string
      position: [...node.pos],
      properties: node.properties ? { ...node.properties } : {},
      size: node.size ? [...node.size] : undefined,
    });
    console.log(`AddNodeCommand: Executed - Added node ${node.id}`);
  }

  undo() {
    if (this.addedNodeId === null) throw new Error("Cannot undo: Node was not added or ID not captured.");

    const nodeToRemove = this.graph.getNodeById(this.addedNodeId);
    if (nodeToRemove) {
      this.graph.remove(nodeToRemove);
      this.zustandRemoveNode(this.addedNodeId);
      console.log(`AddNodeCommand: Undone - Removed node ${this.addedNodeId}`);
    } else {
      console.warn(`AddNodeCommand: Undo failed - Node ${this.addedNodeId} not found in LiteGraph.`);
    }
  }
}


/**
 * RemoveNodeCommand
 * Handles removing one or more nodes from the graph.
 */
export class RemoveNodeCommand extends Command {
  // nodesData should be an array of objects, each containing all necessary info to recreate the node
  // e.g., [{ id, type, pos, properties, size, connections (later) }]
  constructor(graph, zustandAddNode, zustandRemoveNode, nodesData) {
    super();
    this.graph = graph;
    this.zustandAddNode = zustandAddNode;
    this.zustandRemoveNode = zustandRemoveNode;
    this.nodesData = nodesData; // Array of full data for nodes that were removed
  }

  execute() {
    this.nodesData.forEach(nodeData => {
      const nodeToRemove = this.graph.getNodeById(nodeData.id);
      if (nodeToRemove) {
        this.graph.remove(nodeToRemove);
        this.zustandRemoveNode(nodeData.id);
        console.log(`RemoveNodeCommand: Executed - Removed node ${nodeData.id}`);
      } else {
        console.warn(`RemoveNodeCommand: Execute failed - Node ${nodeData.id} not found in LiteGraph for removal.`);
      }
    });
  }

  undo() { // Re-add the nodes
    const LiteGraphJS = window.LiteGraph;
    if (!LiteGraphJS) throw new Error("LiteGraph not available for re-adding nodes.");

    this.nodesData.forEach(nodeData => {
      const node = LiteGraphJS.createNode(nodeData.type);
      if (!node) {
        console.warn(`RemoveNodeCommand: Undo failed - Could not create node of type ${nodeData.type}`);
        return;
      }

      node.id = nodeData.id; // Attempt to restore original ID
      node.pos = [...nodeData.pos];
      if (nodeData.properties) {
        node.properties = JSON.parse(JSON.stringify(nodeData.properties));
      }
      if (nodeData.size) {
        node.size = [...nodeData.size];
      }
      // Later: restore connections if they were part of nodeData

      this.graph.add(node); // Add back to LiteGraph
      this.zustandAddNode({ // Add back to Zustand
        id: node.id,
        type: node.type,
        position: [...node.pos],
        properties: node.properties ? { ...node.properties } : {},
        size: node.size ? [...node.size] : undefined,
      });
      console.log(`RemoveNodeCommand: Undone - Re-added node ${node.id}`);
    });
  }
}


/**
 * MoveNodeCommand
 * Handles moving one or more nodes.
 */
export class MoveNodeCommand extends Command {
  // movedNodesData: array of { nodeId, oldPos: [x,y], newPos: [x,y] }
  constructor(graph, zustandUpdateNodePosition, movedNodesData) {
    super();
    this.graph = graph;
    this.zustandUpdateNodePosition = zustandUpdateNodePosition; // Action to update node position in Zustand
    this.movedNodesData = movedNodesData;
  }

  execute() { // Move to new positions
    this.movedNodesData.forEach(data => {
      const node = this.graph.getNodeById(data.nodeId);
      if (node) {
        node.pos = [...data.newPos];
        this.zustandUpdateNodePosition(data.nodeId, [...data.newPos]);
        console.log(`MoveNodeCommand: Executed - Moved node ${data.nodeId} to ${data.newPos}`);
      } else {
        console.warn(`MoveNodeCommand: Execute failed - Node ${data.nodeId} not found.`);
      }
    });
  }

  undo() { // Move back to old positions
    this.movedNodesData.forEach(data => {
      const node = this.graph.getNodeById(data.nodeId);
      if (node) {
        node.pos = [...data.oldPos];
        this.zustandUpdateNodePosition(data.nodeId, [...data.oldPos]);
        console.log(`MoveNodeCommand: Undone - Moved node ${data.nodeId} to ${data.oldPos}`);
      } else {
        console.warn(`MoveNodeCommand: Undo failed - Node ${data.nodeId} not found.`);
      }
    });
  }
}

// Future commands:
// - ChangePropertyCommand
// - ConnectNodesCommand
// - DisconnectNodesCommand
// - GroupNodesCommand
// etc.
