import { MyBaseReteNode } from './MyBaseReteNode';

export class SocialExportReteNode extends MyBaseReteNode {
  constructor() {
    super('Social Export', { color: '#FFC107', bgColor: '#2A2A2A' });
    this.addInputWithLabel('texture', 'Texture');
    this.addInputWithLabel('audio', 'Audio');
    this.addControlWithLabel('platform', 'enum', 'Platform', { initial: 'youtube', options: ['youtube', 'tiktok', 'instagram'] });
    this.addControlWithLabel('title', 'string', 'Title', { initial: '' });
    this.addControlWithLabel('description', 'string', 'Description', { initial: '' });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
