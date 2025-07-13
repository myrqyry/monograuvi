import { MyBaseReteNode } from './MyBaseReteNode';

export class RandomReteNode extends MyBaseReteNode {
  constructor() {
    super('Random', { color: '#4CAF50', bgColor: '#2A2A2A' });
    this.addOutputWithLabel('value', 'Value');
    this.addControlWithLabel('min', 'number', 'Min', { initial: 0 });
    this.addControlWithLabel('max', 'number', 'Max', { initial: 1 });
    this.addControlWithLabel('distribution', 'enum', 'Distribution', { initial: 'uniform', options: ['uniform', 'gaussian'] });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
