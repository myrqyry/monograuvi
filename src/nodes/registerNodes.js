// src/nodes/registerNodes.js
import { createAudioNode } from './AudioNode.js';
import { createVisualNode } from './VisualNode.js';
import { createControlNode } from './ControlNode.js';
import { createOutputNode } from './OutputNode.js';
import DanceMotionNode from './DanceMotionNode.js'; // Import DanceMotionNode
import PlayheadNode from './PlayheadNode.js'; // Import PlayheadNode
import { QuickConnection } from '../utils/QuickConnection';

// Register all nodes
export function registerAllNodes() {
  const LiteGraph = window.LiteGraph;
  if (!LiteGraph) {
    console.error('LiteGraph not found on window object');
    return;
  }

  // Enhanced Audio Nodes
  function AudioSourceNode() {
    const node = createAudioNode('source');
    this.addOutput("Audio", "audio");
    this.addOutput("Volume", "number");
    this.addProperty("volume", 1.0, { min: 0, max: 2, step: 0.1 });
    this.addProperty("mute", false);
    this.addProperty("loop", false);
    this.addProperty("playbackRate", 1.0, { min: 0.25, max: 4.0, step: 0.1 });
    this.size = [220, 180];
    this.nodeInstance = node;
  }
  AudioSourceNode.title = "Audio Source";
  AudioSourceNode.prototype.onExecute = function() {
    if (this.nodeInstance) {
      const result = this.nodeInstance.processSource();
      this.setOutputData(0, result.Audio);
      this.setOutputData(1, result.Volume);
    }
  };

  function AudioAnalyserNode() {
    this.addInput("Audio", "audio");
    this.addOutput("Frequency Data", "array");
    this.addOutput("Time Data", "array");
    this.addOutput("RMS", "number");
    this.addOutput("Peak", "number");
    this.addProperty("fftSize", 2048, { values: [256, 512, 1024, 2048, 4096, 8192, 16384] });
    this.addProperty("smoothingTimeConstant", 0.8, { min: 0, max: 1, step: 0.1 });
    this.addProperty("frequencyRange", "full");
    this.size = [220, 180];
    this.nodeInstance = createAudioNode('analyser');
  }
  AudioAnalyserNode.title = "Audio Analyser";
  AudioAnalyserNode.prototype.onExecute = function() {
    const audioData = this.getInputData(0);
    if (this.nodeInstance && audioData) {
      const result = this.nodeInstance.processAnalyser(audioData);
      this.setOutputData(0, result.frequencyData);
      this.setOutputData(1, result.timeData);
      this.setOutputData(2, result.RMS);
      this.setOutputData(3, result.Peak);
    }
  };

  function BeatDetectorNode() {
    this.addInput("Audio", "audio");
    this.addOutput("Beat", "boolean");
    this.addOutput("BPM", "number");
    this.addOutput("Confidence", "number");
    this.addOutput("Onset", "boolean");
    this.addProperty("sensitivity", 0.5, { min: 0, max: 1, step: 0.1 });
    this.addProperty("minBPM", 60, { min: 30, max: 200, step: 1 });
    this.addProperty("maxBPM", 180, { min: 80, max: 300, step: 1 });
    this.addProperty("adaptiveThreshold", true);
    this.size = [220, 180];
    this.nodeInstance = createAudioNode('beat-detector');
  }
  BeatDetectorNode.title = "Beat Detector";
  BeatDetectorNode.prototype.onExecute = function() {
    const audioData = this.getInputData(0);
    if (this.nodeInstance && audioData) {
      const result = this.nodeInstance.processBeatDetector(audioData);
      this.setOutputData(0, result.Beat);
      this.setOutputData(1, result.BPM);
      this.setOutputData(2, result.Confidence);
      this.setOutputData(3, result.Onset);
    }
  };

  function SpectralAnalyserNode() {
    this.addInput("Audio", "audio");
    this.addOutput("Spectral Centroid", "number");
    this.addOutput("Spectral Rolloff", "number");
    this.addOutput("Spectral Flux", "number");
    this.addOutput("MFCC", "array");
    this.addOutput("Chroma", "array");
    this.addProperty("mfccCount", 13, { min: 1, max: 40, step: 1 });
    this.addProperty("chromaBins", 12, { min: 12, max: 36, step: 1 });
    this.addProperty("useBackend", true);
    this.size = [220, 180];
    this.nodeInstance = createAudioNode('spectral-analyser');
  }
  SpectralAnalyserNode.title = "Spectral Analyser";
  SpectralAnalyserNode.prototype.onExecute = function() {
    const audioData = this.getInputData(0);
    if (this.nodeInstance && audioData) {
      const result = this.nodeInstance.processSpectralAnalyser(audioData);
      this.setOutputData(0, result.spectralCentroid);
      this.setOutputData(1, result.spectralRolloff);
      this.setOutputData(2, result.spectralFlux);
      this.setOutputData(3, result.MFCC);
      this.setOutputData(4, result.Chroma);
    }
  };

  function PitchDetectorNode() {
    this.addInput("Audio", "audio");
    this.addOutput("Pitch", "number");
    this.addOutput("Note", "string");
    this.addOutput("Cents", "number");
    this.addOutput("Clarity", "number");
    this.addProperty("algorithm", "autocorrelation");
    this.addProperty("minPitch", 80, { min: 20, max: 400, step: 1 });
    this.addProperty("maxPitch", 2000, { min: 800, max: 8000, step: 1 });
    this.size = [220, 180];
    this.nodeInstance = createAudioNode('pitch-detector');
  }
  PitchDetectorNode.title = "Pitch Detector";
  PitchDetectorNode.prototype.onExecute = function() {
    const audioData = this.getInputData(0);
    if (this.nodeInstance && audioData) {
      const result = this.nodeInstance.processPitchDetector(audioData);
      this.setOutputData(0, result.Pitch);
      this.setOutputData(1, result.Note);
      this.setOutputData(2, result.Cents);
      this.setOutputData(3, result.Clarity);
    }
  };

  function KeyDetectorNode() {
    this.addInput("Audio", "audio");
    this.addOutput("Key", "string");
    this.addOutput("Mode", "string");
    this.addOutput("Confidence", "number");
    this.addOutput("Key Profile", "array");
    this.addProperty("algorithm", "krumhansl");
    this.addProperty("windowSize", 4096, { values: [1024, 2048, 4096, 8192] });
    this.addProperty("useBackend", true);
    this.size = [220, 180];
    this.nodeInstance = createAudioNode('key-detector');
  }
  KeyDetectorNode.title = "Key Detector";
  KeyDetectorNode.prototype.onExecute = function() {
    const audioData = this.getInputData(0);
    if (this.nodeInstance && audioData) {
      const result = this.nodeInstance.processKeyDetector(audioData);
      this.setOutputData(0, result.Key);
      this.setOutputData(1, result.Mode);
      this.setOutputData(2, result.Confidence);
      this.setOutputData(3, result.keyProfile);
    }
  };

  function MoodAnalyserNode() {
    this.addInput("Audio", "audio");
    this.addOutput("Valence", "number");
    this.addOutput("Energy", "number");
    this.addOutput("Danceability", "number");
    this.addOutput("Mood", "string");
    this.addOutput("Genre", "string");
    this.addProperty("modelType", "default");
    this.addProperty("updateInterval", 1000, { min: 100, max: 5000, step: 100 });
    this.addProperty("useBackend", true);
    this.size = [220, 180];
    this.nodeInstance = createAudioNode('mood-analyser');
  }
  MoodAnalyserNode.title = "Mood Analyser";
  MoodAnalyserNode.prototype.onExecute = function() {
    const audioData = this.getInputData(0);
    if (this.nodeInstance && audioData) {
      const result = this.nodeInstance.processMoodAnalyser(audioData);
      this.setOutputData(0, result.Valence);
      this.setOutputData(1, result.Energy);
      this.setOutputData(2, result.Danceability);
      this.setOutputData(3, result.Mood);
      this.setOutputData(4, result.Genre);
    }
  };

  // Enhanced Visual Nodes
  function ParticleSystemNode() {
    this.addInput("Trigger", "boolean");
    this.addInput("Force", "number");
    this.addInput("Color", "color");
    this.addInput("Audio Data", "array");
    this.addOutput("Visual", "visual");
    this.addProperty("particleCount", 500, { min: 1, max: 5000, step: 1 });
    this.addProperty("emissionRate", 10, { min: 1, max: 100, step: 1 });
    this.addProperty("startSize", 2, { min: 0.1, max: 20, step: 0.1 });
    this.addProperty("audioReactive", true);
    this.addProperty("blendMode", "normal");
    this.size = [240, 200];
    this.nodeInstance = createVisualNode('particle-system');
  }
  ParticleSystemNode.title = "Particle System";
  ParticleSystemNode.prototype.onExecute = function() {
    const inputs = {
      Trigger: this.getInputData(0),
      Force: this.getInputData(1),
      Color: this.getInputData(2),
      'Audio Data': this.getInputData(3)
    };
    if (this.nodeInstance) {
      const result = this.nodeInstance.processParticleSystem(inputs);
      this.setOutputData(0, result.Visual);
    }
  };

  function WaveformNode() {
    this.addInput("Audio Data", "array");
    this.addInput("Amplitude", "number");
    this.addOutput("Visual", "visual");
    this.addProperty("strokeWidth", 2, { min: 0.5, max: 10, step: 0.5 });
    this.addProperty("strokeColor", "#00D9FF");
    this.addProperty("waveformStyle", "linear");
    this.addProperty("mirrorMode", "none");
    this.size = [240, 200];
    this.nodeInstance = createVisualNode('waveform');
  }
  WaveformNode.title = "Waveform";
  WaveformNode.prototype.onExecute = function() {
    const inputs = {
      'Audio Data': this.getInputData(0),
      Amplitude: this.getInputData(1)
    };
    if (this.nodeInstance) {
      const result = this.nodeInstance.processWaveform(inputs);
      this.setOutputData(0, result.Visual);
    }
  };

  function SpectrumVisualizerNode() {
    this.addInput("Frequency Data", "array");
    this.addInput("Peak Data", "array");
    this.addOutput("Visual", "visual");
    this.addProperty("barCount", 64, { min: 8, max: 512, step: 1 });
    this.addProperty("barWidth", 8, { min: 1, max: 50, step: 1 });
    this.addProperty("colorMode", "gradient");
    this.addProperty("renderStyle", "bars");
    this.size = [240, 200];
    this.nodeInstance = createVisualNode('spectrum-visualizer');
  }
  SpectrumVisualizerNode.title = "Spectrum Visualizer";
  SpectrumVisualizerNode.prototype.onExecute = function() {
    const inputs = {
      'Frequency Data': this.getInputData(0),
      'Peak Data': this.getInputData(1)
    };
    if (this.nodeInstance) {
      const result = this.nodeInstance.processSpectrumVisualizer(inputs);
      this.setOutputData(0, result.Visual);
    }
  };

  function ShaderEffectNode() {
    this.addInput("Input Texture", "texture");
    this.addInput("Time", "number");
    this.addInput("Audio Data", "array");
    this.addOutput("Visual", "visual");
    this.addProperty("shaderType", "fractal");
    this.addProperty("intensity", 1.0, { min: 0, max: 5, step: 0.1 });
    this.addProperty("speed", 1.0, { min: 0.1, max: 5, step: 0.1 });
    this.addProperty("useBackend", false);
    this.size = [240, 200];
    this.nodeInstance = createVisualNode('shader-effect');
  }
  ShaderEffectNode.title = "Shader Effect";
  ShaderEffectNode.prototype.onExecute = function() {
    const inputs = {
      'Input Texture': this.getInputData(0),
      Time: this.getInputData(1),
      'Audio Data': this.getInputData(2)
    };
    if (this.nodeInstance) {
      const result = this.nodeInstance.processShaderEffect(inputs);
      this.setOutputData(0, result.Visual);
    }
  };

  function TextAnimatorNode() {
    this.addInput("Text", "string");
    this.addInput("Audio Data", "array");
    this.addOutput("Visual", "visual");
    this.addProperty("text", "Monograuvi");
    this.addProperty("fontSize", 48, { min: 8, max: 200, step: 1 });
    this.addProperty("fontFamily", "Arial");
    this.addProperty("animation", "none");
    this.size = [240, 200];
    this.nodeInstance = createVisualNode('text-animator');
  }
  TextAnimatorNode.title = "Text Animator";
  TextAnimatorNode.prototype.onExecute = function() {
    const inputs = {
      Text: this.getInputData(0),
      'Audio Data': this.getInputData(1)
    };
    if (this.nodeInstance) {
      const result = this.nodeInstance.processTextAnimator(inputs);
      this.setOutputData(0, result.Visual);
    }
  };

  function KaleidoscopeNode() {
    this.addInput("Input", "visual");
    this.addInput("Segments", "number");
    this.addOutput("Visual", "visual");
    this.addProperty("segments", 6, { min: 2, max: 32, step: 1 });
    this.addProperty("rotation", 0.01, { min: -1, max: 1, step: 0.001 });
    this.addProperty("scale", 1.0, { min: 0.1, max: 5, step: 0.1 });
    this.size = [240, 200];
    this.nodeInstance = createVisualNode('kaleidoscope');
  }
  KaleidoscopeNode.title = "Kaleidoscope";
  KaleidoscopeNode.prototype.onExecute = function() {
    const inputs = {
      Input: this.getInputData(0),
      Segments: this.getInputData(1)
    };
    if (this.nodeInstance) {
      const result = this.nodeInstance.processKaleidoscope(inputs);
      this.setOutputData(0, result.Visual);
    }
  };

  // Control Nodes
  function LFONode() {
    this.addOutput("Output", "number");
    this.addOutput("Inverted", "number");
    this.addOutput("Trigger", "boolean");
    this.addProperty("frequency", 1.0, { min: 0.01, max: 20, step: 0.01 });
    this.addProperty("waveform", "sine");
    this.addProperty("amplitude", 1.0, { min: 0, max: 2, step: 0.1 });
    this.addProperty("offset", 0.0, { min: -1, max: 1, step: 0.1 });
    this.size = [200, 160];
    this.nodeInstance = createControlNode('lfo');
  }
  LFONode.title = "LFO";
  LFONode.prototype.onExecute = function() {
    if (this.nodeInstance) {
      const deltaTime = this.graph ? this.graph.elapsed_time : 0.016;
      const result = this.nodeInstance.processLFO(deltaTime);
      this.setOutputData(0, result.Output);
      this.setOutputData(1, result.Inverted);
      this.setOutputData(2, result.Trigger);
    }
  };

  function EnvelopeNode() {
    this.addInput("Trigger", "boolean");
    this.addInput("Gate", "boolean");
    this.addOutput("Output", "number");
    this.addOutput("Stage", "string");
    this.addProperty("attack", 0.1, { min: 0.001, max: 10, step: 0.001 });
    this.addProperty("decay", 0.3, { min: 0.001, max: 10, step: 0.001 });
    this.addProperty("sustain", 0.7, { min: 0, max: 1, step: 0.01 });
    this.addProperty("release", 0.5, { min: 0.001, max: 10, step: 0.001 });
    this.size = [200, 160];
    this.nodeInstance = createControlNode('envelope');
  }
  EnvelopeNode.title = "Envelope";
  EnvelopeNode.prototype.onExecute = function() {
    const inputs = {
      Trigger: this.getInputData(0),
      Gate: this.getInputData(1)
    };
    if (this.nodeInstance) {
      const deltaTime = this.graph ? this.graph.elapsed_time : 0.016;
      const result = this.nodeInstance.processEnvelope(inputs, deltaTime);
      this.setOutputData(0, result.Output);
      this.setOutputData(1, result.Stage);
    }
  };

  function SequencerNode() {
    this.addInput("Clock", "boolean");
    this.addInput("Reset", "boolean");
    this.addOutput("Value", "number");
    this.addOutput("Gate", "boolean");
    this.addOutput("Step", "number");
    this.addProperty("steps", 8, { min: 1, max: 32, step: 1 });
    this.addProperty("values", "0,0.5,1,0.3,0.8,0.1,0.9,0.2");
    this.addProperty("direction", "forward");
    this.size = [200, 160];
    this.nodeInstance = createControlNode('sequencer');
  }
  SequencerNode.title = "Sequencer";
  SequencerNode.prototype.onExecute = function() {
    const inputs = {
      Clock: this.getInputData(0),
      Reset: this.getInputData(1)
    };
    if (this.nodeInstance) {
      const result = this.nodeInstance.processSequencer(inputs);
      this.setOutputData(0, result.Value);
      this.setOutputData(1, result.Gate);
      this.setOutputData(2, result.Step);
    }
  };

  function RandomNode() {
    this.addInput("Trigger", "boolean");
    this.addInput("Rate", "number");
    this.addOutput("Output", "number");
    this.addOutput("Scaled", "number");
    this.addProperty("min", 0, { min: -10, max: 10, step: 0.1 });
    this.addProperty("max", 1, { min: -10, max: 10, step: 0.1 });
    this.addProperty("distribution", "uniform");
    this.addProperty("smooth", 0, { min: 0, max: 1, step: 0.01 });
    this.size = [200, 160];
    this.nodeInstance = createControlNode('random');
  }
  RandomNode.title = "Random";
  RandomNode.prototype.onExecute = function() {
    const inputs = {
      Trigger: this.getInputData(0),
      Rate: this.getInputData(1)
    };
    if (this.nodeInstance) {
      const deltaTime = this.graph ? this.graph.elapsed_time : 0.016;
      const result = this.nodeInstance.processRandom(inputs, deltaTime);
      this.setOutputData(0, result.Output);
      this.setOutputData(1, result.Scaled);
    }
  };

  // Output Nodes
  function VideoRenderNode() {
    this.addInput("Visual", "visual");
    this.addInput("Audio", "audio");
    this.addInput("Trigger", "boolean");
    this.addProperty("resolution", "1920x1080");
    this.addProperty("framerate", 30, { values: [24, 30, 60, 120] });
    this.addProperty("codec", "h264");
    this.addProperty("duration", 10, { min: 1, max: 300, step: 1 });
    this.addProperty("useBackend", true);
    this.size = [220, 180];
    this.nodeInstance = createOutputNode('video-render');
  }
  VideoRenderNode.title = "Video Render";
  VideoRenderNode.prototype.onExecute = function() {
    const inputs = {
      Visual: this.getInputData(0),
      Audio: this.getInputData(1),
      Trigger: this.getInputData(2)
    };
    if (this.nodeInstance) {
      this.nodeInstance.processVideoRender(inputs);
    }
  };

  function PreviewNode() {
    this.addInput("Visual", "visual");
    this.addInput("Audio", "audio");
    this.addProperty("previewSize", "medium");
    this.addProperty("showControls", true);
    this.addProperty("volume", 1.0, { min: 0, max: 2, step: 0.1 });
    this.size = [220, 180];
    this.nodeInstance = createOutputNode('preview');
  }
  PreviewNode.title = "Preview";
  PreviewNode.prototype.onExecute = function() {
    const inputs = {
      Visual: this.getInputData(0),
      Audio: this.getInputData(1)
    };
    if (this.nodeInstance) {
      this.nodeInstance.processPreview(inputs);
    }
  };

  // Basic Math Nodes (simplified versions)
  function MathAdd() {
    this.addInput("A", "number");
    this.addInput("B", "number");
    this.addOutput("Result", "number");
  }
  MathAdd.title = "Add";
  MathAdd.prototype.onExecute = function() {
    const a = this.getInputData(0) || 0;
    const b = this.getInputData(1) || 0;
    this.setOutputData(0, a + b);
  };

  function MathMultiply() {
    this.addInput("A", "number");
    this.addInput("B", "number");
    this.addOutput("Result", "number");
  }
  MathMultiply.title = "Multiply";
  MathMultiply.prototype.onExecute = function() {
    const a = this.getInputData(0) || 0;
    const b = this.getInputData(1) || 0;
    this.setOutputData(0, a * b);
  };

  function Threshold() {
    this.addInput("Value", "number");
    this.addOutput("Above", "boolean");
    this.addOutput("Below", "boolean");
    this.addProperty("threshold", 0.5);
    this.size = [200, 120];
  }
  Threshold.title = "Threshold";
  Threshold.prototype.onExecute = function() {
    const value = this.getInputData(0) || 0;
    const threshold = this.properties.threshold;
    this.setOutputData(0, value > threshold);
    this.setOutputData(1, value <= threshold);
  };

  // Register all nodes
  LiteGraph.registerNodeType("audio/source", AudioSourceNode);
  LiteGraph.registerNodeType("audio/analyser", AudioAnalyserNode);
  LiteGraph.registerNodeType("audio/beat-detector", BeatDetectorNode);
  LiteGraph.registerNodeType("audio/spectral-analyser", SpectralAnalyserNode);
  LiteGraph.registerNodeType("audio/pitch-detector", PitchDetectorNode);
  LiteGraph.registerNodeType("audio/key-detector", KeyDetectorNode);
  LiteGraph.registerNodeType("audio/mood-analyser", MoodAnalyserNode);
  
  LiteGraph.registerNodeType("visual/particle-system", ParticleSystemNode);
  LiteGraph.registerNodeType("visual/waveform", WaveformNode);
  LiteGraph.registerNodeType("visual/spectrum-visualizer", SpectrumVisualizerNode);
  LiteGraph.registerNodeType("visual/shader-effect", ShaderEffectNode);
  LiteGraph.registerNodeType("visual/text-animator", TextAnimatorNode);
  LiteGraph.registerNodeType("visual/kaleidoscope", KaleidoscopeNode);
  
  LiteGraph.registerNodeType("control/lfo", LFONode);
  LiteGraph.registerNodeType("control/envelope", EnvelopeNode);
  LiteGraph.registerNodeType("control/sequencer", SequencerNode);
  LiteGraph.registerNodeType("control/random", RandomNode);
  
  LiteGraph.registerNodeType("output/video-render", VideoRenderNode);
  LiteGraph.registerNodeType("output/preview", PreviewNode);
  
  LiteGraph.registerNodeType("math/add", MathAdd);
  LiteGraph.registerNodeType("math/multiply", MathMultiply);
  LiteGraph.registerNodeType("logic/threshold", Threshold);

  // Register DanceMotionNode
  LiteGraph.registerNodeType("animation/dancemotion", DanceMotionNode);

  // Register PlayheadNode
  LiteGraph.registerNodeType("global/playhead", PlayheadNode);
  
  LiteGraph.registerNodeType('quick-connection', QuickConnection);

  console.log("All enhanced LiteGraph nodes registered successfully!");
}

// Enhanced node type mapping for the library
export const nodeTypeMapping = {
  // Audio nodes
  "audio-source": "audio/source",
  "audio-analyser": "audio/analyser", 
  "beat-detector": "audio/beat-detector",
  "spectral-analyser": "audio/spectral-analyser",
  "pitch-detector": "audio/pitch-detector",
  "key-detector": "audio/key-detector",
  "mood-analyser": "audio/mood-analyser",
  
  // Visual nodes
  "particle-system": "visual/particle-system",
  "waveform": "visual/waveform",
  "spectrum-visualizer": "visual/spectrum-visualizer",
  "shader-effect": "visual/shader-effect",
  "text-animator": "visual/text-animator",
  "kaleidoscope": "visual/kaleidoscope",
  
  // Control nodes
  "lfo": "control/lfo",
  "envelope": "control/envelope",
  "sequencer": "control/sequencer",
  "random": "control/random",
  
  // Output nodes
  "video-render": "output/video-render",
  "preview": "output/preview",
  
  // Math nodes
  "math-add": "math/add",
  "math-multiply": "math/multiply",
  "threshold": "logic/threshold",

  // Animation nodes
  "dance-motion": "animation/dancemotion",

  // Global nodes
  "playhead": "global/playhead"
};

// Node categories for organized display
export const nodeCategories = {
  Audio: [
    "audio-source",
    "audio-analyser",
    "beat-detector",
    "spectral-analyser", 
    "pitch-detector",
    "key-detector",
    "mood-analyser"
  ],
  Visual: [
    "particle-system",
    "waveform",
    "spectrum-visualizer",
    "shader-effect",
    "text-animator",
    "kaleidoscope"
  ],
  Control: [
    "lfo",
    "envelope", 
    "sequencer",
    "random"
  ],
  Output: [
    "video-render",
    "preview"
  ],
  Math: [
    "math-add",
    "math-multiply",
    "threshold"
  ],
  Animation: [ // New category for Animation
    "dance-motion"
  ],
  Global: [ // New category for Global/Utility nodes
    "playhead"
  ]
};

// Node descriptions
export const nodeDescriptions = {
  "audio-source": "Audio input source with volume and playback controls",
  "audio-analyser": "Real-time FFT audio analysis with frequency and time domain data",
  "beat-detector": "Advanced beat detection with BPM estimation and onset detection",
  "spectral-analyser": "Advanced spectral analysis including MFCC and chroma features",
  "pitch-detector": "Fundamental frequency detection with musical note output",
  "key-detector": "Musical key detection using advanced algorithms",
  "mood-analyser": "AI-powered mood and genre classification",
  
  "particle-system": "Audio-reactive particle system with extensive customization",
  "waveform": "Audio waveform visualization with multiple rendering styles",
  "spectrum-visualizer": "Frequency spectrum visualizer with bars, lines, and curves",
  "shader-effect": "GPU-accelerated visual effects with audio reactivity",
  "text-animator": "Animated text with audio-reactive properties",
  "kaleidoscope": "Kaleidoscope effect with configurable segments and rotation",
  
  "lfo": "Low-frequency oscillator for parameter modulation",
  "envelope": "ADSR envelope generator for smooth parameter changes",
  "sequencer": "Step sequencer with configurable patterns and directions",
  "random": "Random value generator with multiple distributions",
  
  "video-render": "High-quality video rendering with backend processing",
  "preview": "Real-time preview with playback controls",
  
  "math-add": "Add two numbers together",
  "math-multiply": "Multiply two numbers",
  "threshold": "Compare value against threshold with hysteresis",

  "dance-motion": "Triggers a VRM dance animation with specified motion, intensity, and duration.",

  "playhead": "Outputs current timeline playhead position and beat events."
};
