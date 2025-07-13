import { MyBaseReteNode } from './MyBaseReteNode';

export class FileExportReteNode extends MyBaseReteNode {
  constructor() {
    super('File Export', { color: '#FFC107', bgColor: '#2A2A2A' });
    this.addInputWithLabel('data', 'Data');
    this.addControlWithLabel('filename', 'string', 'Filename', { initial: 'export.json' });
    this.addControlWithLabel('format', 'enum', 'Format', { initial: 'json', options: ['json', 'csv', 'xml'] });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
