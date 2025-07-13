import { MyBaseReteNode } from './MyBaseReteNode';

export class MidiReteNode extends MyBaseReteNode {
  constructor() {
    super('MIDI Input', { color: '#4CAF50', bgColor: '#2A2A2A' });
    this.addOutputWithLabel('note', 'Note');
    this.addOutputWithLabel('velocity', 'Velocity');
    this.addOutputWithLabel('gate', 'Gate');
  }

  async execute(inputs, forward) {
    forward(inputs);
  }
}
