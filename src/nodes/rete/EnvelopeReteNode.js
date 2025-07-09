import { MyBaseReteNode } from './MyBaseReteNode';
import { ClassicPreset as Classic } from 'rete'; // For Sockets if needed, though MyBaseReteNode handles default

// Assuming MyBaseReteNode's addInputWithLabel and addOutputWithLabel use a default socket.
// If specific socket types are needed, they can be defined here or passed.

export class EnvelopeReteNode extends MyBaseReteNode {
  constructor(initialCustomData = {}) {
    super('Envelope Control', { customData: initialCustomData }); // Node label

    // Define Inputs
    // addInputWithLabel(key, label, isMultiConnection = false)
    this.addInputWithLabel('trigger', 'Trigger'); // Expects a boolean signal
    this.addInputWithLabel('gate', 'Gate');       // Expects a boolean signal

    // Define Outputs
    this.addOutputWithLabel('output', 'Output'); // Outputs a number (envelope value)
    this.addOutputWithLabel('stage', 'Stage');   // Outputs a string (current stage: attack, decay, etc.)

    // Define Controls (Properties)
    this.addControlWithLabel('attack', 'number', 'Attack (s)', {
      initial: initialCustomData.attack !== undefined ? initialCustomData.attack : 0.1,
      min: 0.001, max: 10, step: 0.001,
    });
    this.addControlWithLabel('decay', 'number', 'Decay (s)', {
      initial: initialCustomData.decay !== undefined ? initialCustomData.decay : 0.3,
      min: 0.001, max: 10, step: 0.001,
    });
    this.addControlWithLabel('sustain', 'number', 'Sustain (0-1)', {
      initial: initialCustomData.sustain !== undefined ? initialCustomData.sustain : 0.7,
      min: 0, max: 1, step: 0.01,
    });
    this.addControlWithLabel('release', 'number', 'Release (s)', {
      initial: initialCustomData.release !== undefined ? initialCustomData.release : 0.5,
      min: 0.001, max: 10, step: 0.001,
    });
    this.addControlWithLabel('curve', 'enum', 'Curve', {
      initial: initialCustomData.curve !== undefined ? initialCustomData.curve : 'exponential',
      options: ['linear', 'exponential', 'logarithmic'],
    });

    // Internal state for envelope processing
    this.internalEnvelopeState = {
      stage: 'idle', // idle, attack, decay, sustain, release
      value: 0,
      stageStartTime: 0,
      gateOn: false,
      // Previous trigger state to detect rising edge
      // Note: Rete's dataflow typically provides input values per execution,
      // so state like 'previous trigger' might be handled differently or by the input signal itself.
      // For simplicity in this conversion, we might adapt the logic closely first.
      previousTrigger: false,
    };
  }

  // data() method for rete-engine (dataflow)
  // inputs: { trigger: [boolean], gate: [boolean] } (arrays of values from connected nodes)
  // This method will calculate the current envelope value based on inputs and internal state.
  data(inputs) {
    const triggerSignal = inputs.trigger && inputs.trigger.length > 0 ? inputs.trigger[0] : false;
    const gateSignal = inputs.gate && inputs.gate.length > 0 ? inputs.gate[0] : false;

    const attackTime = this.getProperty('attack');
    const decayTime = this.getProperty('decay');
    const sustainLevel = this.getProperty('sustain');
    const releaseTime = this.getProperty('release');
    const curveType = this.getProperty('curve');

    // Simplified time progression for each call to data()
    // In a real engine, deltaTime would be provided.
    const deltaTime = 1 / 60; // Assuming 60 FPS processing rate for simulation
    const currentTime = (this.internalEnvelopeState.stageStartTime || 0) + deltaTime; // Simulate time advance

    let { stage, value, stageStartTime, gateOn, previousTrigger } = this.internalEnvelopeState;

    // Trigger detection (rising edge)
    if (triggerSignal && !previousTrigger) {
      stage = 'attack';
      stageStartTime = 0; // Reset stage time for this simulation tick
      value = 0; // Start from 0 on new attack
    }
    this.internalEnvelopeState.previousTrigger = triggerSignal;

    // Gate logic
    if (gateSignal && !gateOn) { // Gate just turned on
      gateOn = true;
      if (stage === 'idle' || stage === 'release') { // Re-trigger attack if gate comes on during idle/release
        stage = 'attack';
        stageStartTime = 0;
        value = 0;
      }
    } else if (!gateSignal && gateOn) { // Gate just turned off
      gateOn = false;
      if (stage === 'attack' || stage === 'decay' || stage === 'sustain') {
        stage = 'release';
        stageStartTime = 0; // Reset stage time for release phase relative to current value
      }
    }

    let currentStageTime = stageStartTime; // Represents time elapsed in current stage

    switch (stage) {
      case 'attack':
        if (currentStageTime < attackTime) {
          value = this.applyCurve(currentStageTime / attackTime, curveType);
          currentStageTime += deltaTime;
        } else {
          value = 1.0;
          stage = 'decay';
          currentStageTime = 0; // Reset for decay stage
        }
        break;
      case 'decay':
        if (currentStageTime < decayTime) {
          value = 1.0 - (1.0 - sustainLevel) * this.applyCurve(currentStageTime / decayTime, curveType);
          currentStageTime += deltaTime;
        } else {
          value = sustainLevel;
          stage = 'sustain';
          currentStageTime = 0; // Sustain doesn't have a "time", but reset for consistency
        }
        break;
      case 'sustain':
        value = sustainLevel;
        // Sustain stage continues as long as gate is on. If gate turns off, logic above moves to 'release'.
        // If gate is still on, it just stays in sustain.
        break;
      case 'release':
        if (currentStageTime < releaseTime) {
          // Release from the value it had when release started.
          // This needs `valueAtReleaseStart` if we want accurate decay from current point.
          // For simplicity, assume it was at sustainLevel or 1.0 when release began from gate logic.
          // Let's refine this: release should decay from the *current* value when gate turned off.
          // This simplified model will decay from sustainLevel.
          value = this.internalEnvelopeState.valueAtReleaseStart * (1.0 - this.applyCurve(currentStageTime / releaseTime, curveType));
          currentStageTime += deltaTime;
        } else {
          value = 0.0;
          stage = 'idle';
        }
        break;
      case 'idle':
      default:
        value = 0.0;
        break;
    }

    // Update internal state
    this.internalEnvelopeState = { ...this.internalEnvelopeState, stage, value, stageStartTime: currentStageTime, gateOn };
    if (stage === 'release' && !this.internalEnvelopeState.valueAtReleaseStart) { // Capture value when release starts
        this.internalEnvelopeState.valueAtReleaseStart = value; // This needs to be set when gate turns off
    }
    if (stage !== 'release') delete this.internalEnvelopeState.valueAtReleaseStart;


    return {
      output: value,
      stage: stage,
    };
  }

  applyCurve(t, curveType) {
    // Ensure t is between 0 and 1
    const time = Math.max(0, Math.min(1, t));
    switch (curveType) {
      case 'linear':
        return time;
      case 'exponential':
        return time * time; // Simple exponential
      case 'logarithmic':
        // (log(time * (base - 1) + 1)) / log(base)
        // For base e: Math.log(time * (Math.E - 1) + 1)
        // Simplified: return Math.pow(time, 0.5); // Concave curve
        return Math.log10(time * 9 + 1); // common log curve
      default:
        return time;
    }
  }
}

export default EnvelopeReteNode;
