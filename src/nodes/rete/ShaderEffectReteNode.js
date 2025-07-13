import { BaseVisualReteNode } from './BaseVisualReteNode';

export class ShaderEffectReteNode extends BaseVisualReteNode {
  constructor() {
    super('Shader Effect', { visualType: 'shader-effect' });
    this.addInputTexture();
    this.addOutputTexture();
    this.addControlWithLabel('shader', 'string', 'Shader Code', { initial: 'void main() { gl_FragColor = texture2D(texture, vUv); }' });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
