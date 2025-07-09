import { MyBaseReteNode } from '../MyBaseReteNode'; // Adjust path as necessary
import { ClassicPreset as Classic } from 'rete'; // For socket if needed, though MyBaseReteNode handles it

// Define a default socket type if not already available globally or in MyBaseReteNode
const socket = new Classic.Socket('socket');

export class LfoReteNode extends MyBaseReteNode {
  constructor(initialCustomData = {}) {
    super('LFO Control', { customData: initialCustomData }); // Node label

    // Define outputs using MyBaseReteNode's helper
    this.addOutputWithLabel('output', 'Output'); // Key, Label
    this.addOutputWithLabel('inverted', 'Inverted');
    this.addOutputWithLabel('trigger', 'Trigger');

    // Define controls (properties) using MyBaseReteNode's helper
    // addControlWithLabel(key, controlType, label, options)
    // `controlType` is your internal type, `options.initial` is the value.
    // The actual Rete control created by MyBaseReteNode is basic for now.
    // We'll need custom React components for these later to match LiteGraph's widgets.

    this.addControlWithLabel('frequency', 'number', 'Frequency', {
      initial: initialCustomData.frequency || 1.0,
      min: 0.01, max: 20, step: 0.01,
      // description: 'LFO frequency in Hz', // Descriptions can be stored in controlStore via options
      // category: 'Oscillator'
    });
    this.addControlWithLabel('waveform', 'enum', 'Waveform', {
      initial: initialCustomData.waveform || 'sine',
      options: ['sine', 'triangle', 'square', 'sawtooth', 'random', 'noise'],
      // description: 'LFO waveform type',
      // category: 'Oscillator'
    });
    this.addControlWithLabel('amplitude', 'number', 'Amplitude', {
      initial: initialCustomData.amplitude || 1.0,
      min: 0, max: 2, step: 0.1,
    });
    this.addControlWithLabel('offset', 'number', 'Offset', {
      initial: initialCustomData.offset || 0.0,
      min: -1, max: 1, step: 0.1,
    });
    this.addControlWithLabel('phase', 'number', 'Phase', {
      initial: initialCustomData.phase || 0.0,
      min: 0, max: 360, step: 1,
    });
    this.addControlWithLabel('sync', 'boolean', 'Sync', {
      initial: initialCustomData.sync || false,
    });

    // Initialize internal LFO state if needed for processing
    this.internalLfoState = {
      phase: 0, // Current phase for oscillation
      randomValue: 0, // For 'random' waveform type
      lastValue: 0, // For trigger detection
      // ... any other state needed from your original LFO process method
    };
  }

  // This is where the node's processing logic will go for the Rete engine.
  // `inputs` is an object of incoming data. LFO has no data inputs.
  // `outputs` is an object where you set the data for each output key.
  // This is a simplified `data` method for `rete-engine` dataflow.
  async data(inputs) {
    const freq = this.getProperty('frequency');
    const amplitude = this.getProperty('amplitude');
    const offsetVal = this.getProperty('offset'); // Renamed to avoid conflict with JS offset
    const phaseOffset = (this.getProperty('phase') * Math.PI) / 180;
    const waveform = this.getProperty('waveform');

    // Assuming a constant deltaTime for simulation for now.
    // In a real scenario, deltaTime would come from the engine or a global timer.
    const deltaTime = 1 / 60; // Simulate 60 FPS

    this.internalLfoState.phase += freq * deltaTime * 2 * Math.PI;
    if (this.internalLfoState.phase > 2 * Math.PI) {
        this.internalLfoState.phase -= 2 * Math.PI;
    }

    let value;
    const currentPhase = this.internalLfoState.phase + phaseOffset;

    switch (waveform) {
      case 'sine':
        value = Math.sin(currentPhase);
        break;
      case 'triangle':
        value = 2 * Math.abs(2 * (currentPhase / (2 * Math.PI) - Math.floor(currentPhase / (2 * Math.PI) + 0.5))) -1 ; // Corrected triangle
        break;
      case 'square':
        value = Math.sin(currentPhase) >= 0 ? 1 : -1;
        break;
      case 'sawtooth':
        // value = 2 * (currentPhase / (2 * Math.PI) - Math.floor(currentPhase / (2 * Math.PI) + 0.5)); // Original Saw
        value = 1 - 2 * (currentPhase / (2 * Math.PI)); // More common 1 to -1 saw
        if (value < -1) value = -1 + (value - Math.floor(value)) ; // Wrap around
         break;
      case 'random':
        // Generate new random value once per cycle (simplification)
        if (Math.floor(this.internalLfoState.phase / (2 * Math.PI)) !== Math.floor((this.internalLfoState.phase - freq * deltaTime * 2 * Math.PI) / (2 * Math.PI))) {
            this.internalLfoState.randomValue = Math.random() * 2 - 1;
        }
        value = this.internalLfoState.randomValue || 0;
        break;
      case 'noise':
        value = Math.random() * 2 - 1;
        break;
      default:
        value = 0;
    }

    const outputValue = value * amplitude + offsetVal;
    const triggerSignal = value > 0.9 && this.internalLfoState.lastValue <= 0.9;
    this.internalLfoState.lastValue = value;

    return {
      output: outputValue,
      inverted: -outputValue,
      trigger: triggerSignal,
    };
  }
}
