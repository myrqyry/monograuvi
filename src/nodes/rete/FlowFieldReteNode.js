import { BaseVisualReteNode } from './BaseVisualReteNode';

export class FlowFieldReteNode extends BaseVisualReteNode {
  constructor(initialCustomData = {}) {
    super('Flow Field', { visualType: 'flow-field', customData: initialCustomData });
    this.addInputWithLabel('noise', 'Noise');
    this.addOutputTexture();
    this.addControlWithLabel('speed', 'number', 'Speed', { initial: 1, min: 0.1, max: 10, step: 0.1 });
    this.addControlWithLabel('scale', 'number', 'Scale', { initial: 0.1, min: 0.01, max: 1, step: 0.01 });
  }

  data(inputs) {
    const speed = this.getProperty('speed');
    const scale = this.getProperty('scale');
    return {
      ...super.data(inputs),
      speed,
      scale,
    };
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
