import { BaseVisualReteNode } from './BaseVisualReteNode';

export class ParticleSystemReteNode extends BaseVisualReteNode {
  constructor() {
    super('Particle System', { visualType: 'particle-system' });
    this.addInputTexture();
    this.addOutputTexture();
    this.addControlWithLabel('particleCount', 'number', 'Count', { initial: 1000, min: 100, max: 10000, step: 100 });
    this.addControlWithLabel('particleSize', 'number', 'Size', { initial: 2, min: 1, max: 20, step: 1 });
    this.addControlWithLabel('particleSpeed', 'number', 'Speed', { initial: 1, min: 0.1, max: 10, step: 0.1 });
  }

  // The actual particle system logic will be implemented here.
  // For now, it will just pass the input texture through to the output.
  async execute(inputs, forward) {
    forward(inputs);
  }
}
