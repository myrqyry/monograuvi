import { MyBaseReteNode } from './MyBaseReteNode'; // Corrected import path
import { ClassicPreset as Classic } from 'rete';

// Classic.Socket is already available via Classic from 'rete' in MyBaseReteNode
// const socket = new Classic.Socket('socket'); // Not needed here if MyBaseReteNode defines/uses it

export class LfoReteNode extends MyBaseReteNode {
  constructor(initialCustomData = {}) {
    super('LFO Control', { customData: initialCustomData });

    this.addOutputWithLabel('output', 'Output');
    this.addOutputWithLabel('inverted', 'Inverted');
    this.addOutputWithLabel('trigger', 'Trigger');

    this.addControlWithLabel('frequency', 'number', 'Frequency', {
      initial: initialCustomData.frequency !== undefined ? initialCustomData.frequency : 1.0,
      min: 0.01, max: 20, step: 0.01,
    });
    this.addControlWithLabel('waveform', 'enum', 'Waveform', {
      initial: initialCustomData.waveform !== undefined ? initialCustomData.waveform : 'sine',
      options: ['sine', 'triangle', 'square', 'sawtooth', 'random', 'noise'],
    });
    this.addControlWithLabel('amplitude', 'number', 'Amplitude', {
      initial: initialCustomData.amplitude !== undefined ? initialCustomData.amplitude : 1.0,
      min: 0, max: 2, step: 0.1,
    });
    this.addControlWithLabel('offset', 'number', 'Offset', {
      initial: initialCustomData.offset !== undefined ? initialCustomData.offset : 0.0,
      min: -1, max: 1, step: 0.1,
    });
    this.addControlWithLabel('phase', 'number', 'Phase', {
      initial: initialCustomData.phase !== undefined ? initialCustomData.phase : 0.0,
      min: 0, max: 360, step: 1,
    });
    this.addControlWithLabel('sync', 'boolean', 'Sync', {
      initial: initialCustomData.sync !== undefined ? initialCustomData.sync : false,
    });

    this.internalLfoState = {
      phase: 0,
      randomValue: 0,
      lastValue: 0,
    };
  }

  // data() method for rete-engine (dataflow)
  // This method is called by the engine to get the output values of the node.
  // It should be synchronous if possible for the dataflow engine.
  // If async operations are needed, they should typically be handled outside the main dataflow path
  // or by using specific async nodes/patterns in Rete.
  data(inputs) { // Changed to be synchronous for standard dataflow
    const freq = this.getProperty('frequency');
    const amplitude = this.getProperty('amplitude');
    const offsetVal = this.getProperty('offset');
    const phaseOffset = (this.getProperty('phase') * Math.PI) / 180;
    const waveform = this.getProperty('waveform');

    // This calculation assumes it's called repeatedly by an engine.
    // For a standalone LFO, you might need a timer or requestAnimationFrame loop.
    // Here, we assume `data()` is called each "tick" of the graph processing.
    // The concept of `deltaTime` needs to be provided by the execution environment.
    // Rete-engine itself doesn't inherently provide a global deltaTime for all nodes.
    // For now, let's make it a fixed step for conceptual processing.
    const deltaTime = 1 / 60; // Placeholder for actual delta time from engine

    this.internalLfoState.phase += freq * deltaTime * 2 * Math.PI;
    if (this.internalLfoState.phase >= 2 * Math.PI) {
      this.internalLfoState.phase -= 2 * Math.PI;
    }

    let value;
    const currentPhase = this.internalLfoState.phase + phaseOffset;

    switch (waveform) {
      case 'sine':
        value = Math.sin(currentPhase);
        break;
      case 'triangle':
        value = 1 - 2 * Math.acos((1 - 0.00001) * Math.sin(currentPhase)) / Math.PI; // More standard triangle -1 to 1
        break;
      case 'square':
        value = Math.sin(currentPhase) >= 0 ? 1 : -1;
        break;
      case 'sawtooth': // Descending sawtooth
        value = 1 - 2 * (currentPhase / (2 * Math.PI));
        break;
      case 'random':
        // This logic makes 'random' act like a sample-and-hold that changes once per cycle.
        if (Math.floor(this.internalLfoState.phase / (2 * Math.PI)) !==
            Math.floor((this.internalLfoState.phase - (freq * deltaTime * 2 * Math.PI)) / (2 * Math.PI))) {
          this.internalLfoState.randomValue = Math.random() * 2 - 1;
        }
        value = this.internalLfoState.randomValue;
        break;
      case 'noise': // White noise
        value = Math.random() * 2 - 1;
        break;
      default:
        value = 0;
    }

    const outputValue = value * amplitude + offsetVal;
    const triggerSignal = value > 0.9 && this.internalLfoState.lastValue <= 0.9; // Rising edge trigger
    this.internalLfoState.lastValue = value;

    return {
      output: outputValue,
      inverted: -outputValue,
      trigger: triggerSignal,
    };
  }
}
