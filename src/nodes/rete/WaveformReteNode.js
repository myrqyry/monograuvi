import { BaseVisualReteNode } from './BaseVisualReteNode';

export class WaveformReteNode extends BaseVisualReteNode {
  constructor() {
    super('Waveform', { visualType: 'waveform' });
    this.addInputWithLabel('audioData', 'Audio Data');
    this.addOutputTexture();
    this.addControlWithLabel('color', 'string', 'Color', { initial: '#FFFFFF' });
    this.addControlWithLabel('lineWidth', 'number', 'Line Width', { initial: 2, min: 1, max: 10, step: 1 });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
