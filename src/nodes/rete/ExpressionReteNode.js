import { MyBaseReteNode } from './MyBaseReteNode';

export class ExpressionReteNode extends MyBaseReteNode {
  constructor() {
    super('Expression', { color: '#4CAF50', bgColor: '#2A2A2A' });
    this.addInputWithLabel('a', 'A');
    this.addInputWithLabel('b', 'B');
    this.addInputWithLabel('c', 'C');
    this.addInputWithLabel('d', 'D');
    this.addOutputWithLabel('result', 'Result');
    this.addControlWithLabel('expression', 'string', 'Expression', { initial: 'a + b' });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
