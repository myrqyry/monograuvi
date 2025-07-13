import { BaseVisualReteNode } from './BaseVisualReteNode';

export class FlowFieldReteNode extends BaseVisualReteNode {
  constructor() {
    super('Flow Field', { visualType: 'flow-field' });
    this.addInputWithLabel('noise', 'Noise');
    this.addOutputTexture();
    this.addControlWithLabel('speed', 'number', 'Speed', { initial: 1, min: 0.1, max: 10, step: 0.1 });
    this.addControlWithLabel('scale', 'number', 'Scale', { initial: 0.1, min: 0.01, max: 1, step: 0.01 });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
