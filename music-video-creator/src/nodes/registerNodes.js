// src/nodes/registerNodes.js

// Register all nodes
export function registerAllNodes() {
  const LiteGraph = window.LiteGraph;
  if (!LiteGraph) {
    console.error('LiteGraph not found on window object');
    return;
  }

  // Basic Math Nodes
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

  // Audio Source Node
  function AudioSource() {
    this.addOutput("Audio", "audio");
    this.addProperty("volume", 1.0);
    this.size = [200, 100];
  }

  AudioSource.title = "Audio Source";
  AudioSource.prototype.onExecute = function() {
    // This would connect to the actual audio system
    this.setOutputData(0, { type: "audio", volume: this.properties.volume });
  };

  // Audio Analyser Node
  function AudioAnalyser() {
    this.addInput("Audio", "audio");
    this.addOutput("Frequency", "array");
    this.addOutput("Amplitude", "number");
    this.size = [200, 120];
  }

  AudioAnalyser.title = "Audio Analyser";
  AudioAnalyser.prototype.onExecute = function() {
    const audioData = this.getInputData(0);
    if (audioData) {
      // Mock frequency analysis data
      const frequencies = new Array(128).fill(0).map(() => Math.random());
      const amplitude = Math.random();
      this.setOutputData(0, frequencies);
      this.setOutputData(1, amplitude);
    }
  };

  // Visual Canvas Node
  function VisualCanvas() {
    this.addInput("Input", "");
    this.addProperty("width", 800);
    this.addProperty("height", 600);
    this.size = [200, 100];
  }

  VisualCanvas.title = "Canvas";
  VisualCanvas.prototype.onExecute = function() {
    // This would render to a canvas
    // Removed console.log to prevent spam
  };

  // Particle System Node
  function ParticleSystem() {
    this.addInput("Trigger", "boolean");
    this.addInput("Force", "number");
    this.addOutput("Particles", "particles");
    this.addProperty("count", 100);
    this.size = [200, 120];
  }

  ParticleSystem.title = "Particle System";
  ParticleSystem.prototype.onExecute = function() {
    const trigger = this.getInputData(0);
    const force = this.getInputData(1) || 1.0;
    
    if (trigger) {
      this.setOutputData(0, {
        type: "particles",
        count: this.properties.count,
        force: force
      });
    }
  };

  // Beat Detector Node
  function BeatDetector() {
    this.addInput("Audio", "audio");
    this.addOutput("Beat", "boolean");
    this.addOutput("BPM", "number");
    this.addProperty("sensitivity", 0.5);
    this.size = [200, 120];
  }

  BeatDetector.title = "Beat Detector";
  BeatDetector.prototype.onExecute = function() {
    const audioData = this.getInputData(0);
    if (audioData) {
      // Mock beat detection
      const beat = Math.random() > 0.8;
      const bpm = 120 + Math.random() * 40;
      this.setOutputData(0, beat);
      this.setOutputData(1, bpm);
    }
  };

  // Text Display Node
  function TextDisplay() {
    this.addInput("Text", "string");
    this.addInput("Size", "number");
    this.addProperty("text", "Hello World");
    this.addProperty("color", "#ffffff");
    this.size = [200, 100];
  }

  TextDisplay.title = "Text Display";
  TextDisplay.prototype.onExecute = function() {
    const text = this.getInputData(0) || this.properties.text;
    const size = this.getInputData(1) || 16;
    // Removed console.log to prevent spam
  };

  // Threshold Node
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

  // Smoothing Node
  function Smoothing() {
    this.addInput("Input", "number");
    this.addOutput("Output", "number");
    this.addProperty("factor", 0.1);
    this.lastValue = 0;
    this.size = [200, 100];
  }

  Smoothing.title = "Smoothing";
  Smoothing.prototype.onExecute = function() {
    const input = this.getInputData(0) || 0;
    const factor = this.properties.factor;
    this.lastValue = this.lastValue * (1 - factor) + input * factor;
    this.setOutputData(0, this.lastValue);
  };

  // Register all nodes
  LiteGraph.registerNodeType("math/add", MathAdd);
  LiteGraph.registerNodeType("math/multiply", MathMultiply);
  LiteGraph.registerNodeType("audio/source", AudioSource);
  LiteGraph.registerNodeType("audio/analyser", AudioAnalyser);
  LiteGraph.registerNodeType("visual/canvas", VisualCanvas);
  LiteGraph.registerNodeType("visual/particles", ParticleSystem);
  LiteGraph.registerNodeType("audio/beat-detector", BeatDetector);
  LiteGraph.registerNodeType("text/display", TextDisplay);
  LiteGraph.registerNodeType("logic/threshold", Threshold);
  LiteGraph.registerNodeType("math/smoothing", Smoothing);
  
  console.log("All LiteGraph nodes registered successfully!");
}

// Node type mapping for the library
export const nodeTypeMapping = {
  "math-add": "math/add",
  "math-multiply": "math/multiply",
  "audio-source": "audio/source",
  "audio-analyser": "audio/analyser",
  "visual-canvas": "visual/canvas",
  "particle-system": "visual/particles",
  "beat-detector": "audio/beat-detector",
  "text-display": "text/display",
  "threshold": "logic/threshold",
  "smoothing": "math/smoothing"
};
