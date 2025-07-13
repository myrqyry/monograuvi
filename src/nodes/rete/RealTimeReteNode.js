import { MyBaseReteNode } from './MyBaseReteNode';

export class RealTimeReteNode extends MyBaseReteNode {
  constructor() {
    super('Real-time Output', { color: '#FFC107', bgColor: '#2A2A2A' });
    this.addInputWithLabel('texture', 'Texture');
    this.addInputWithLabel('audio', 'Audio');
    this.addControlWithLabel('output', 'enum', 'Output', { initial: 'virtual-camera', options: ['virtual-camera', 'syphon', 'spout'] });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
