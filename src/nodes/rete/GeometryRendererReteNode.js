import { BaseVisualReteNode } from './BaseVisualReteNode';

export class GeometryRendererReteNode extends BaseVisualReteNode {
  constructor() {
    super('3D Geometry', { visualType: 'geometry-renderer' });
    this.addInputWithLabel('transform', 'Transform');
    this.addOutputTexture();
    this.addControlWithLabel('shape', 'enum', 'Shape', { initial: 'cube', options: ['cube', 'sphere', 'torus'] });
    this.addControlWithLabel('color', 'string', 'Color', { initial: '#FFFFFF' });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
