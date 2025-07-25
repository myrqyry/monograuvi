import { BaseVisualReteNode } from './BaseVisualReteNode';

export class ShaderEffectReteNode extends BaseVisualReteNode {
  constructor(initialCustomData = {}) {
    super('Shader Effect', { visualType: 'shader-effect', customData: initialCustomData });
    this.addInputTexture();
    this.addOutputTexture();
    this.addControlWithLabel('shader', 'string', 'Shader Code', { initial: 'void main() { gl_FragColor = texture2D(texture, vUv) * vec4(u_color, 1.0); }' });
    this.addControlWithLabel('color', 'color', 'Color', { initial: '#ff0000' });
  }

  data(inputs) {
    const shader = this.getProperty('shader');
    const color = this.getProperty('color');

    // Convert hex color to a vec3 for the shader
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;

    return {
      ...super.data(inputs),
      shader,
      uniforms: {
        u_color: { value: [r, g, b] }
      }
    };
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
