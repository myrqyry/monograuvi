import { MyBaseReteNode } from './MyBaseReteNode';

export class ClockReteNode extends MyBaseReteNode {
  constructor() {
    super('Clock', { color: '#4CAF50', bgColor: '#2A2A2A' });
    this.addOutputWithLabel('tick', 'Tick');
    this.addOutputWithLabel('beat', 'Beat');
    this.addOutputWithLabel('bar', 'Bar');
    this.addControlWithLabel('bpm', 'number', 'BPM', { initial: 120, min: 20, max: 240, step: 1 });
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
