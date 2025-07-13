import { BaseVisualReteNode } from './BaseVisualReteNode';

export class VideoEffectReteNode extends BaseVisualReteNode {
  constructor() {
    super('Video Effect', { visualType: 'video-effect' });
    this.addInputTexture();
    this.addOutputTexture();
    this.addControlWithLabel('effect', 'enum', 'Effect', { initial: 'none', options: ['none', 'chromakey', 'blur'] });
    this.addControlWithLabel('amount', 'number', 'Amount', { initial: 0.5, min: 0, max: 1, step: 0.01 });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
