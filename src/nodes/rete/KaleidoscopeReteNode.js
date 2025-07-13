import { BaseVisualReteNode } from './BaseVisualReteNode';

export class KaleidoscopeReteNode extends BaseVisualReteNode {
  constructor() {
    super('Kaleidoscope', { visualType: 'kaleidoscope' });
    this.addInputTexture();
    this.addOutputTexture();
    this.addControlWithLabel('segments', 'number', 'Segments', { initial: 6, min: 2, max: 24, step: 1 });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
