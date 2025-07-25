import { MyBaseReteNode } from './MyBaseReteNode';

export class AudioSourceReteNode extends MyBaseReteNode {
  audioContext = null; // Will be set by ReteEditorComponent
  audioBuffer = null;
  sourceNode = null; // AudioBufferSourceNode
  gainNode = null;
  analyserNode = null;
  timeDomainData = null; // Uint8Array for volume analysis

  constructor(initialCustomData = {}) {
    super('Audio Source', { customData: initialCustomData });

    this.addOutputWithLabel('audioData', 'Level'); // Outputting a single number (average volume)
    this.addOutputWithLabel('onPlayback', 'Playing'); // Boolean reflecting playback state

    this.addControlWithLabel('audioUrl', 'file', 'Audio File', {
      initial: initialCustomData.audioUrl || './assets/presets/FPreview.mp3', // Default for testing
    });
    this.addControlWithLabel('isPlaying', 'boolean', 'Play', {
      initial: initialCustomData.isPlaying || false,
    });
    this.addControlWithLabel('volume', 'number', 'Volume', {
      initial: initialCustomData.volume !== undefined ? initialCustomData.volume : 0.7,
      min: 0, max: 1, step: 0.01,
    });
    this.addControlWithLabel('loop', 'boolean', 'Loop', {
      initial: initialCustomData.loop || false,
    });

    // Initialize after properties are set up by super and addControlWithLabel
    if (this.getProperty('audioUrl')) {
        // Defer loading until audioContext is available
        // this.loadAudio(this.getProperty('audioUrl')); // This will be handled by onPropertyChange or setAudioContext
    }
  }

  setAudioContext(audioContextInstance) {
    this.audioContext = audioContextInstance;
    // If URL already set, try loading now that context is available
    const initialUrl = this.getProperty('audioUrl');
    if (initialUrl && !this.audioBuffer) {
      this.loadAudio(initialUrl);
    }
  }

  async loadAudio(url) {
    if (!this.audioContext) {
      console.warn('AudioSourceNode: AudioContext not available for loading', url);
      this.errorState = 'AudioContext not ready.';
      if (this.areaPlugin) this.areaPlugin.update('node', this.id);
      return;
    }
    if (!url) {
        this.errorState = 'No audio URL provided.';
        if (this.areaPlugin) this.areaPlugin.update('node', this.id);
        return;
    }

    console.log(`AudioSourceNode (${this.id}): Loading audio from ${url}`);
    this.errorState = null; // Clear previous errors
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log(`AudioSourceNode (${this.id}): Audio loaded and decoded successfully from ${url}`);
      if (this.getProperty('isPlaying')) { // If was set to play before loaded
        this._stop(); // Stop any previous instance
        this._play();
      }
    } catch (e) {
      console.error(`AudioSourceNode (${this.id}): Error loading audio from ${url}:`, e);
      this.errorState = `Failed to load: ${e.message}`;
      this.audioBuffer = null;
    }
    if (this.areaPlugin) this.areaPlugin.update('node', this.id); // Update UI for error state
  }

  _play() {
    if (!this.audioContext || !this.audioBuffer || this.sourceNode) return; // Not ready or already playing

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = this.getProperty('loop');

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(this.getProperty('volume'), this.audioContext.currentTime);

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048; // Default, can be made a property
    this.timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount); // For volume

    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination); // Or a main app gain node

    this.sourceNode.onended = () => {
      // If it wasn't stopped by explicitly setting isPlaying to false
      if (this.getProperty('isPlaying') && !this.sourceNode.loop) {
        this.setPropertyAndRecord('isPlaying', false, this.historyRef); // historyRef needs to be passed
      }
      this._stopAudioInternal(); // Clean up nodes
    };

    this.sourceNode.start(0);
    console.log(`AudioSourceNode (${this.id}): Playback started.`);
  }

  _stopAudioInternal() { // Internal cleanup without property change
    if (this.sourceNode) {
      try {
        this.sourceNode.stop(0);
      } catch (e) { /* Already stopped or not started */ }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.timeDomainData = null;
    console.log(`AudioSourceNode (${this.id}): Playback stopped and resources released.`);
  }

  _stop() {
    this._stopAudioInternal();
  }

  // Override from MyBaseReteNode to handle property changes
  onPropertyChanged(propertyName, newValue) {
    super.onPropertyChanged(propertyName, newValue); // Call base class method if it does anything

    if (propertyName === 'audioUrl') {
      this._stop(); // Stop current playback before loading new URL
      this.loadAudio(newValue);
    } else if (propertyName === 'isPlaying') {
      if (newValue) {
        this._play();
      } else {
        this._stop();
      }
    } else if (propertyName === 'volume' && this.gainNode) {
      this.gainNode.gain.setValueAtTime(newValue, this.audioContext ? this.audioContext.currentTime : 0);
    } else if (propertyName === 'loop' && this.sourceNode) {
      this.sourceNode.loop = newValue;
    }
  }

  data(inputs) {
    const isPlaying = this.getProperty('isPlaying');
    let averageVolume = 0;

    if (isPlaying && this.analyserNode && this.timeDomainData) {
      this.analyserNode.getByteTimeDomainData(this.timeDomainData);
      let sum = 0;
      for (let i = 0; i < this.timeDomainData.length; i++) {
        sum += Math.abs(this.timeDomainData[i] / 128.0 - 1.0); // Normalize and sum absolute values
      }
      averageVolume = sum / this.timeDomainData.length;
      // Scale it up a bit for better visual response, clamp to 0-1
      averageVolume = Math.min(1, averageVolume * 5);
    }

    return {
      audioData: averageVolume,
      onPlayback: isPlaying, // True if playing, false otherwise
    };
  }

  // Ensure cleanup on node removal from editor
  destroy() {
    this._stop();
    super.destroy(); // Call base class destroy if any
  }
}

export default AudioSourceReteNode;
