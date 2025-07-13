import { MyBaseReteNode } from './MyBaseReteNode';

export class AudioRenderReteNode extends MyBaseReteNode {
  constructor() {
    super('Audio Render', { color: '#FFC107', bgColor: '#2A2A2A' });
    this.addInputWithLabel('audio', 'Audio');
    this.addControlWithLabel('filename', 'string', 'Filename', { initial: 'output.wav' });
    this.addControlWithLabel('format', 'enum', 'Format', { initial: 'wav', options: ['wav', 'mp3', 'ogg'] });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
