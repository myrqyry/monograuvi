import { BaseVisualReteNode } from './BaseVisualReteNode';

export class KaleidoscopeReteNode extends BaseVisualReteNode {
  constructor(initialCustomData = {}) {
    super('Kaleidoscope', { visualType: 'kaleidoscope', customData: initialCustomData });
    this.addInputTexture();
    this.addOutputTexture();
    this.addControlWithLabel('segments', 'number', 'Segments', { initial: 6, min: 2, max: 24, step: 1 });
  }

  data(inputs) {
    const segments = this.getProperty('segments');
    return {
      ...super.data(inputs),
      segments,
    };
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
