import { MyBaseReteNode } from './MyBaseReteNode';

export class TriggerReteNode extends MyBaseReteNode {
  constructor() {
    super('Trigger', { color: '#4CAF50', bgColor: '#2A2A2A' });
    this.addInputWithLabel('value', 'Value');
    this.addOutputWithLabel('trigger', 'Trigger');
    this.addControlWithLabel('threshold', 'number', 'Threshold', { initial: 0.5, min: 0, max: 1, step: 0.01 });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
