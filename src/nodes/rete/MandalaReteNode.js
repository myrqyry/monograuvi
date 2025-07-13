import { BaseVisualReteNode } from './BaseVisualReteNode';

export class MandalaReteNode extends BaseVisualReteNode {
  constructor() {
    super('Mandala', { visualType: 'mandala' });
    this.addInputTexture();
    this.addOutputTexture();
    this.addControlWithLabel('frequency', 'number', 'Frequency', { initial: 4, min: 1, max: 16, step: 1 });
    this.addControlWithLabel('amplitude', 'number', 'Amplitude', { initial: 0.5, min: 0, max: 1, step: 0.01 });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
