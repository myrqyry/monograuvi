import { BaseVisualReteNode } from './BaseVisualReteNode';

export class TextAnimatorReteNode extends BaseVisualReteNode {
  constructor() {
    super('Text Animator', { visualType: 'text-animator' });
    this.addInputWithLabel('text', 'Text');
    this.addOutputTexture();
    this.addControlWithLabel('font', 'string', 'Font', { initial: 'Arial' });
    this.addControlWithLabel('size', 'number', 'Size', { initial: 32, min: 8, max: 128, step: 1});
    this.addControlWithLabel('color', 'string', 'Color', { initial: '#FFFFFF' });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
