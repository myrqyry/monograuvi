import { BaseVisualReteNode } from './BaseVisualReteNode';

export class SpectrumVisualizerReteNode extends BaseVisualReteNode {
  constructor() {
    super('Spectrum Visualizer', { visualType: 'spectrum-visualizer' });
    this.addInputWithLabel('audioData', 'Audio Data');
    this.addOutputTexture();
    this.addControlWithLabel('barCount', 'number', 'Bars', { initial: 64, min: 8, max: 256, step: 8 });
    this.addControlWithLabel('color', 'string', 'Color', { initial: '#FFFFFF' });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
