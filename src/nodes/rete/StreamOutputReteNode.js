import { MyBaseReteNode } from './MyBaseReteNode';

export class StreamOutputReteNode extends MyBaseReteNode {
  constructor() {
    super('Stream Output', { color: '#FFC107', bgColor: '#2A2A2A' });
    this.addInputWithLabel('texture', 'Texture');
    this.addInputWithLabel('audio', 'Audio');
    this.addControlWithLabel('url', 'string', 'URL', { initial: 'rtmp://localhost/live' });
    this.addControlWithLabel('key', 'string', 'Stream Key', { initial: '' });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
