import { MyBaseReteNode } from './MyBaseReteNode';

export class SequencerReteNode extends MyBaseReteNode {
  constructor() {
    super('Sequencer', { color: '#4CAF50', bgColor: '#2A2A2A' });
    this.addInputWithLabel('clock', 'Clock');
    this.addOutputWithLabel('value', 'Value');
    this.addOutputWithLabel('gate', 'Gate');
    this.addControlWithLabel('steps', 'number', 'Steps', { initial: 8, min: 1, max: 16, step: 1 });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
