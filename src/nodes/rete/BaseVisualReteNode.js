import { MyBaseReteNode } from './MyBaseReteNode';
// import { ClassicPreset as Classic } from 'rete';

// Use a plain object or a simple string as a socket identifier for now
const socket = 'texture-socket';

export class BaseVisualReteNode extends MyBaseReteNode {
  constructor(label, options = {}) {
    super(label, { ...options, color: '#D4AEEA', bgColor: '#2A2A2A' });
    this.visualType = options.visualType || 'none';
  }

  addInputTexture(key = 'texture', label = 'Texture In') {
    // Use addInputWithLabel for consistency, or define a custom socket if needed
    return this.addInputWithLabel(key, label, false);
  }

  addOutputTexture(key = 'texture', label = 'Texture Out') {
    // Use addOutputWithLabel for consistency, or define a custom socket if needed
    return this.addOutputWithLabel(key, label, false);
  }

  // Placeholder for a method to render the visual effect
  render(canvas, context, inputs) {
    // Subclasses will implement their specific rendering logic here
  }

  async execute(inputs, forward) {
    // For visual nodes, the primary "data" is often a rendered image or texture.
    // The actual rendering might happen in a separate rendering engine,
    // and this `execute` method would pass along the data needed for that.

    // For now, let's assume we'll pass the node itself to the next node.
    forward({ 'texture': this });
  }
}

export default BaseVisualReteNode;
