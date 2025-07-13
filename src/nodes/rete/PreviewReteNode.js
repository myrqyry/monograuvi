import { MyBaseReteNode } from './MyBaseReteNode';

export class PreviewReteNode extends MyBaseReteNode {
  constructor() {
    super('Preview', { color: '#FFC107', bgColor: '#2A2A2A' });
    this.addInputWithLabel('texture', 'Texture');
    this.addInputWithLabel('audio', 'Audio');
  }

  async execute(inputs, forward) {
    // This node would typically render the texture to a canvas on the UI
    // and play the audio through the browser's audio context.
    // For now, it will just pass the inputs through.
    forward(inputs);
  }
}
