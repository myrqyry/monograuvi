import { MyBaseReteNode } from './MyBaseReteNode';

export class VideoRenderReteNode extends MyBaseReteNode {
  constructor() {
    super('Video Render', { color: '#FFC107', bgColor: '#2A2A2A' });
    this.addInputWithLabel('texture', 'Texture');
    this.addInputWithLabel('audio', 'Audio');
    this.addControlWithLabel('filename', 'string', 'Filename', { initial: 'output.mp4' });
    // Note: These are container formats. The actual codecs are handled by the backend.
    this.addControlWithLabel('format', 'enum', 'Format', { initial: 'mp4', options: ['mp4', 'webm', 'gif'] });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
