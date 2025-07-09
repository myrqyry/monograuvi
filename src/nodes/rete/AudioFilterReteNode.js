import { MyBaseReteNode } from './MyBaseReteNode';
// We might need ClassicPreset for specific socket types if we customize them later,
// but MyBaseReteNode currently uses a default shared socket.

export class AudioFilterReteNode extends MyBaseReteNode {
  constructor(initialCustomData = {}) {
    super('Audio Filter', { customData: initialCustomData }); // Node label

    // Define Inputs
    // addInputWithLabel(key, label, isMultiConnection = false)
    // For 'Audio' type inputs/outputs, we're using the default socket for now.
    // Later, we might define specific 'audio' sockets for type checking or custom appearance.
    this.addInputWithLabel('audioIn', 'Audio In'); // Assuming 'audio' type data
    this.addInputWithLabel('frequencyMod', 'Frequency Mod'); // Expects a number for modulation
    this.addInputWithLabel('qMod', 'Q Mod'); // Expects a number for modulation

    // Define Outputs
    this.addOutputWithLabel('audioOut', 'Audio Out'); // Outputs 'audio' type data

    // Define Controls (Properties)
    // addControlWithLabel(key, controlType, label, options)
    this.addControlWithLabel('filterType', 'enum', 'Type', {
      initial: initialCustomData.filterType !== undefined ? initialCustomData.filterType : 'lowpass',
      options: ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'],
      // category: 'Filter' // Categories can be used for organizing UI in a custom node component
    });
    this.addControlWithLabel('frequency', 'number', 'Frequency (Hz)', {
      initial: initialCustomData.frequency !== undefined ? initialCustomData.frequency : 440,
      min: 20, max: 20000, step: 1, // Logarithmic scale might be better for UI later
    });
    this.addControlWithLabel('q', 'number', 'Q / Resonance', {
      initial: initialCustomData.q !== undefined ? initialCustomData.q : 1,
      min: 0.001, max: 30, step: 0.01, // Max Q can be very high for some filters
    });
    this.addControlWithLabel('gain', 'number', 'Gain (dB)', {
      initial: initialCustomData.gain !== undefined ? initialCustomData.gain : 0,
      min: -40, max: 40, step: 0.5,
      // This is relevant for 'lowshelf', 'highshelf', 'peaking' filter types.
    });

    // Placeholder for Web Audio API BiquadFilterNode instance if doing client-side processing
    this.audioNode = null;
  }

  // data() method for rete-engine (dataflow)
  // inputs: { audioIn: [audioObject], frequencyMod: [number], qMod: [number] }
  data(inputs) {
    // For now, this node won't do actual audio processing in the dataflow engine directly.
    // Actual Web Audio API graph connections would happen elsewhere or be managed by a
    // dedicated audio graph processing system that the Rete graph might control or configure.

    // Placeholder: just pass through the audio input if it exists, or a dummy object.
    // The properties (filterType, frequency, Q, gain) would be used by an external
    // audio processing system to configure the actual Web Audio BiquadFilterNode.

    const audioInput = inputs.audioIn && inputs.audioIn.length > 0 ? inputs.audioIn[0] : { type: 'audio_signal', passthrough: true };

    // The values from frequencyMod and qMod inputs could be used to modulate the base property values.
    const baseFrequency = this.getProperty('frequency');
    const baseQ = this.getProperty('q');

    const freqModulation = inputs.frequencyMod && inputs.frequencyMod.length > 0 ? inputs.frequencyMod[0] : 0;
    const qModulation = inputs.qMod && inputs.qMod.length > 0 ? inputs.qMod[0] : 0;

    const effectiveFrequency = baseFrequency + freqModulation; // Simplified modulation
    const effectiveQ = baseQ + qModulation; // Simplified modulation

    // In a real scenario, this node might output its settings to be consumed by an audio manager,
    // or if it were directly part of a Web Audio graph, it would represent a BiquadFilterNode.
    // For now, we log what it would do and pass through a conceptual audio signal.

    // console.log(
    //   `AudioFilterNode (${this.id}): Type: ${this.getProperty('filterType')}, ` +
    //   `Freq: ${effectiveFrequency.toFixed(2)}, Q: ${effectiveQ.toFixed(2)}, Gain: ${this.getProperty('gain')}`
    // );

    return {
      audioOut: audioInput // conceptual passthrough or modified signal
    };
  }
}

export default AudioFilterReteNode;
