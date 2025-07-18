import { BaseVisualReteNode } from '../../nodes/rete/BaseVisualReteNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class ThreeJSBaseNode extends BaseVisualReteNode {
  constructor(label, options = {}) {
    super(label, { ...options, visualType: 'threejs', color: '#6A5ACD', bgColor: '#3A3A3A' }); // Purple color for Three.js nodes
    this.name = label; // Assign label to name for easier identification if needed
    this.object = null; // To hold the main Three.js object associated with this node (e.g., Mesh, Light, Camera)
    this.outputPort = null; // Common output port for Three.js objects
  }

  /**
   * Initializes the Three.js object for this node.
   * This method should be overridden by subclasses to create their specific Three.js objects.
   */
  initObject() {
    // Placeholder for object initialization in subclasses
  }

  /**
   * Updates the Three.js object based on input parameters or node properties.
   * This method should be overridden by subclasses.
   * @param {Object} inputs - The input data from connected nodes.
   * @param {Object} properties - The properties configured on the node.
   */
  updateObject(inputs, properties) {
    // Placeholder for object updates in subclasses
  }

  /**
   * Adds an output port for a generic Three.js object.
   * @param {string} key - The key for the output port.
   * @param {string} label - The label for the output port.
   * @returns {ClassicPreset.Output} - The created output port.
   */
  addThreeJSObjectOutput(key = 'threejsObject', label = 'Object Out') {
    // A generic socket type for any Three.js object
    const threejsObjectSocket = new MyCustomSocket('ThreeJSObject');
    this.outputPort = this.addOutputWithLabel(key, label, threejsObjectSocket);
    return this.outputPort;
  }

  // Override execute to manage Three.js object lifecycle and pass it forward
  async execute(inputs, forward) {
    // Initialize or update the Three.js object if it's the primary output
    if (!this.object) {
      this.initObject();
    }
    this.updateObject(inputs, this.properties);

    // Pass the Three.js object (or a reference) to the next node
    if (this.outputPort && this.object) {
      forward({ [this.outputPort.key]: this.object });
    } else {
      // If no specific object is produced, just forward the node itself
      super.execute(inputs, forward);
    }
  }
}

// Define a custom socket for Three.js objects
// This ensures type checking in Rete.js connections
class MyCustomSocket extends Classic.Socket {
  constructor(name) {
    super(name);
    this.name = name;
  }
  // You might add a custom `combine` method if needed for type compatibility
  // combine(anotherSocket) { /* ... */ }
}

export default ThreeJSBaseNode;