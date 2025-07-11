// src/nodes/registerNodes.js
// import { LGraphNode } from 'litegraph.js'; // Removed this line
import BaseNode from './BaseNode.js'; // Ensure BaseNode is imported if not already
import AudioNode, { createAudioNode } from './AudioNode.js'; // Corrected import
import VisualNode, { createVisualNode, VisualTypes } from './VisualNode.js'; // Corrected import
import ControlNode, { createControlNode } from './ControlNode.js'; // Corrected import
import OutputNode, { createOutputNode } from './OutputNode.js'; // Corrected import
import DanceMotionNode from './DanceMotionNode.js';
import PlayheadNode from './PlayheadNode.js';
import { LyricTranscriberNode } from './audio/LyricTranscriberNode.js'; // Import the new node
import { QuickConnection } from '../utils/QuickConnection';

// Generic function to register BaseNode instances with LiteGraph
function registerBaseNodeAsLiteGraphNode(NodeTypeClass, liteGraphTypeName, liteGraphTitle, options = {}) {
  const LiteGraph = window.LiteGraph;
  if (!LiteGraph) {
    console.error('LiteGraph not found on window object');
    return;
  }

  function LiteGraphWrapper() {
    // Instantiate the BaseNode subclass
    // For factory-created nodes (AudioNode, VisualNode, etc.), we need the type argument.
    if (options.factoryFn) {
        this.nodeInstance = options.factoryFn(options.nodeSubType);
    } else {
        this.nodeInstance = new NodeTypeClass();
    }

    this.title = liteGraphTitle || this.nodeInstance.name;
    this.size = this.nodeInstance.size || [200, 100];
    this.color = this.nodeInstance.color;
    this.bgcolor = this.nodeInstance.bgColor;

    // Add inputs from BaseNode instance
    this.nodeInstance.getInputs().forEach(input => {
      this.addInput(input.name, input.type, input.options);
    });

    // Add outputs from BaseNode instance
    this.nodeInstance.getOutputs().forEach(output => {
      this.addOutput(output.name, output.type === 'event' ? LiteGraph.EVENT : output.type, output.options);
    });

    // Add properties from BaseNode instance and create widgets
    Object.entries(this.nodeInstance.getProperties()).forEach(([name, prop]) => {
      const widgetOptions = {
        min: prop.min,
        max: prop.max,
        step: prop.step,
        precision: prop.step && prop.step < 1 ? String(prop.step).split('.')[1]?.length || 2 : 0
      };
      if (prop.options) widgetOptions.values = prop.options; // For combo/enum

      this.addProperty(name, prop.value, prop.type, widgetOptions);

      // Determine widget type based on BaseNode property definition
      let widgetType = prop.widget || 'default';
      if (widgetType === 'default') {
          if (prop.type === 'boolean') widgetType = 'toggle';
          else if (prop.type === 'number') widgetType = 'number';
          else if (prop.type === 'string') widgetType = 'text';
          else if (prop.options) widgetType = 'combo';
      }

      if (widgetType !== 'text' && widgetType !== 'default') { // Default text usually doesn't need a widget unless specified
        this.addWidget(
          widgetType,
          name,
          prop.value,
          (value) => {
            this.nodeInstance.setProperty(name, value);
            // Optional: markDirty to re-render node if visual changes occur due to property
            // this.setDirtyCanvas(true, true);
          },
          widgetOptions
        );
      }
    });
     // Ensure the BaseNode has an ID consistent with LiteGraph if possible
    this.nodeInstance.id = this.id;
  }

  LiteGraphWrapper.title = liteGraphTitle;
  LiteGraphWrapper.type = liteGraphTypeName;

  // Lifecycle methods
  LiteGraphWrapper.prototype.onAdded = function(graph) {
    this.nodeInstance.id = this.id; // Sync ID
    if (this.nodeInstance.onAdded) {
      this.nodeInstance.onAdded(graph);
    }
  };

  LiteGraphWrapper.prototype.onRemoved = function() {
    if (this.nodeInstance.onRemoved) {
      this.nodeInstance.onRemoved();
    }
    if (this.nodeInstance.destroy) {
        this.nodeInstance.destroy();
    }
  };

  LiteGraphWrapper.prototype.configure = function(info) {
    // LiteGraph's default configure handles properties.
    // We need to ensure these are passed to the BaseNode instance.
    window.LGraphNode.prototype.configure.apply(this, [info]); // Changed to window.LGraphNode
    if (this.nodeInstance.deserialize) {
        // Pass relevant parts of info to deserialize.
        // BaseNode's deserialize expects an object like { properties: {...}, id: ..., etc. }
        const serializedData = {
            id: this.id,
            name: this.title, // Or info.title
            properties: {},
            // Include other relevant fields from BaseNode.serialize if needed
        };
        // Populate properties from LiteGraph's properties
        Object.keys(this.nodeInstance.getProperties()).forEach(propName => {
            if (this.properties[propName] !== undefined) {
                 serializedData.properties[propName] = this.properties[propName];
            }
        });
        this.nodeInstance.deserialize(serializedData);
    }
    // After deserializing, update widgets to reflect loaded property values
    this.widgets?.forEach(widget => {
        if (this.nodeInstance.properties[widget.name]) {
            widget.value = this.nodeInstance.getProperty(widget.name);
        }
    });
  };

  LiteGraphWrapper.prototype.serialize = function() {
      // Start with LiteGraph's default serialization
      const data = window.LGraphNode.prototype.serialize.call(this); // Changed to window.LGraphNode
      // Override/extend with BaseNode's serialization for relevant parts if necessary
      // BaseNode's properties are already part of LiteGraph's `this.properties` which gets serialized.
      // If BaseNode has other important state not covered, merge it here.
      // For example, ensure the type is correctly set for our system
      data.type = liteGraphTypeName;
      // If BaseNode has custom serialized data beyond properties:
      // const baseNodeSerialized = this.nodeInstance.serialize();
      // data.baseNodeData = baseNodeSerialized; // Example
      return data;
  };


  LiteGraphWrapper.prototype.onPropertyChanged = function(name, value) {
    if (this.nodeInstance.setProperty(name, value)) {
        // Optional: Update corresponding widget if it exists and isn't the source of the change.
        // This is tricky due to LiteGraph's internal widget handling.
        // Often, widget callbacks directly call setProperty, so this might be redundant or cause loops.
        const widget = this.widgets && this.widgets.find(w => w.name === name);
        if (widget && widget.value !== value) {
             // widget.value = value; // Be cautious with this, LiteGraph might handle it.
        }
    }
    if (this.nodeInstance.onPropertyChanged) {
        this.nodeInstance.onPropertyChanged(name, value); // Call BaseNode's hook
    }
  };

  LiteGraphWrapper.prototype.onExecute = async function() {
    if (!this.nodeInstance) return;

    const inputs = {};
    this.nodeInstance.getInputs().forEach((input, index) => {
      inputs[input.name] = this.getInputData(index);
    });

    // Pass deltaTime if the node's process method expects it (e.g. LFO, Envelope)
    let processArgs = [inputs];
    if (this.nodeInstance.controlType === 'lfo' || this.nodeInstance.controlType === 'envelope' || this.nodeInstance.controlType === 'random') {
        const deltaTime = this.graph ? this.graph.elapsed_time / 1000 : 0.016; // Convert ms to s
        processArgs.push(deltaTime);
    }


    try {
        const result = await this.nodeInstance.process(...processArgs);
        if (result) {
            this.nodeInstance.getOutputs().forEach((output, index) => {
                if (result[output.name] !== undefined) {
                    if (output.type === 'event') {
                        if (result[output.name]) { // If event data is truthy (e.g., contains payload or is just true)
                            this.triggerSlot(index, result[output.name] === true ? null : result[output.name]);
                        }
                    } else {
                        this.setOutputData(index, result[output.name]);
                    }
                }
            });
        }
    } catch (error) {
        console.error(`Error executing node ${this.title} (${this.id}):`, error);
        // Optionally set an error state on the node in LiteGraph
        this.boxcolor = "#F00"; // Example: turn node red on error
    }
  };

  LiteGraph.registerNodeType(liteGraphTypeName, LiteGraphWrapper);
}


// Register all nodes
export function registerAllNodes() {
  const LiteGraph = window.LiteGraph;
  if (!LiteGraph) {
    console.error('LiteGraph not found on window object');
    return;
  }

  // Audio Nodes
  registerBaseNodeAsLiteGraphNode(AudioNode, "audio/source", "Audio Source", { factoryFn: createAudioNode, nodeSubType: 'source' });
  registerBaseNodeAsLiteGraphNode(AudioNode, "audio/analyser", "Audio Analyser", { factoryFn: createAudioNode, nodeSubType: 'analyser' });
  registerBaseNodeAsLiteGraphNode(AudioNode, "audio/beat-detector", "Beat Detector", { factoryFn: createAudioNode, nodeSubType: 'beat-detector' });
  registerBaseNodeAsLiteGraphNode(AudioNode, "audio/spectral-analyser", "Spectral Analyser", { factoryFn: createAudioNode, nodeSubType: 'spectral-analyser' });
  registerBaseNodeAsLiteGraphNode(AudioNode, "audio/pitch-detector", "Pitch Detector", { factoryFn: createAudioNode, nodeSubType: 'pitch-detector' });
  registerBaseNodeAsLiteGraphNode(AudioNode, "audio/key-detector", "Key Detector", { factoryFn: createAudioNode, nodeSubType: 'key-detector' });
  registerBaseNodeAsLiteGraphNode(AudioNode, "audio/mood-analyser", "Mood Analyser", { factoryFn: createAudioNode, nodeSubType: 'mood-analyser' });
  registerBaseNodeAsLiteGraphNode(AudioNode, "audio/filter", "Audio Filter", { factoryFn: createAudioNode, nodeSubType: 'filter' });


  // Visual Nodes
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/particle-system", "Particle System", { factoryFn: createVisualNode, nodeSubType: VisualTypes.PARTICLE_SYSTEM });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/waveform", "Waveform", { factoryFn: createVisualNode, nodeSubType: VisualTypes.WAVEFORM });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/spectrum-visualizer", "Spectrum Visualizer", { factoryFn: createVisualNode, nodeSubType: VisualTypes.SPECTRUM_VISUALIZER });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/shader-effect", "Shader Effect", { factoryFn: createVisualNode, nodeSubType: VisualTypes.SHADER_EFFECT });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/geometry-renderer", "3D Geometry", { factoryFn: createVisualNode, nodeSubType: VisualTypes.GEOMETRY_RENDERER });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/text-animator", "Text Animator", { factoryFn: createVisualNode, nodeSubType: VisualTypes.TEXT_ANIMATOR });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/video-effect", "Video Effect", { factoryFn: createVisualNode, nodeSubType: VisualTypes.VIDEO_EFFECT });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/kaleidoscope", "Kaleidoscope", { factoryFn: createVisualNode, nodeSubType: VisualTypes.KALEIDOSCOPE });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/mandala", "Mandala", { factoryFn: createVisualNode, nodeSubType: VisualTypes.MANDALA });
  registerBaseNodeAsLiteGraphNode(VisualNode, "visual/flow-field", "Flow Field", { factoryFn: createVisualNode, nodeSubType: VisualTypes.FLOW_FIELD });

  // Control Nodes
  registerBaseNodeAsLiteGraphNode(ControlNode, "control/lfo", "LFO", { factoryFn: createControlNode, nodeSubType: 'lfo' });
  registerBaseNodeAsLiteGraphNode(ControlNode, "control/envelope", "Envelope", { factoryFn: createControlNode, nodeSubType: 'envelope' });
  registerBaseNodeAsLiteGraphNode(ControlNode, "control/sequencer", "Sequencer", { factoryFn: createControlNode, nodeSubType: 'sequencer' });
  registerBaseNodeAsLiteGraphNode(ControlNode, "control/random", "Random", { factoryFn: createControlNode, nodeSubType: 'random' });
  registerBaseNodeAsLiteGraphNode(ControlNode, "control/expression", "Expression", { factoryFn: createControlNode, nodeSubType: 'expression' });
  registerBaseNodeAsLiteGraphNode(ControlNode, "control/midi", "MIDI Input", { factoryFn: createControlNode, nodeSubType: 'midi' });
  registerBaseNodeAsLiteGraphNode(ControlNode, "control/clock", "Clock", { factoryFn: createControlNode, nodeSubType: 'clock' });
  registerBaseNodeAsLiteGraphNode(ControlNode, "control/trigger", "Trigger", { factoryFn: createControlNode, nodeSubType: 'trigger' });

  // Output Nodes
  registerBaseNodeAsLiteGraphNode(OutputNode, "output/video-render", "Video Render", { factoryFn: createOutputNode, nodeSubType: 'video-render' });
  registerBaseNodeAsLiteGraphNode(OutputNode, "output/audio-render", "Audio Render", { factoryFn: createOutputNode, nodeSubType: 'audio-render' });
  registerBaseNodeAsLiteGraphNode(OutputNode, "output/stream-output", "Stream Output", { factoryFn: createOutputNode, nodeSubType: 'stream-output' });
  registerBaseNodeAsLiteGraphNode(OutputNode, "output/file-export", "File Export", { factoryFn: createOutputNode, nodeSubType: 'file-export' });
  registerBaseNodeAsLiteGraphNode(OutputNode, "output/preview", "Preview", { factoryFn: createOutputNode, nodeSubType: 'preview' });
  registerBaseNodeAsLiteGraphNode(OutputNode, "output/social-export", "Social Export", { factoryFn: createOutputNode, nodeSubType: 'social-export' });
  registerBaseNodeAsLiteGraphNode(OutputNode, "output/real-time", "Real-time Output", { factoryFn: createOutputNode, nodeSubType: 'real-time' });

  // Refactored Nodes (now extending BaseNode)
  registerBaseNodeAsLiteGraphNode(DanceMotionNode, "animation/dancemotion", "Dance Motion");
  registerBaseNodeAsLiteGraphNode(PlayheadNode, "global/playhead", "Playhead");

  // Register LyricTranscriberNode - it's not a BaseNode subclass, so direct registration
  const LiteGraph = window.LiteGraph;
  if (LiteGraph && LyricTranscriberNode) {
    LiteGraph.registerNodeType("audio/lyric_transcriber", LyricTranscriberNode);
  }


  // Basic Math Nodes (Simplified - assuming they might become BaseNode subclasses or use a simple registration)
  // For now, keeping them as they were if they don't fit BaseNode structure easily
  function MathAddSimple() {
    this.addInput("A", "number"); this.addInput("B", "number"); this.addOutput("Result", "number");
  }
  MathAddSimple.title = "Add";
  MathAddSimple.prototype.onExecute = function() { this.setOutputData(0, (this.getInputData(0) || 0) + (this.getInputData(1) || 0)); };
  LiteGraph.registerNodeType("math/add", MathAddSimple);

  function MathMultiplySimple() {
    this.addInput("A", "number"); this.addInput("B", "number"); this.addOutput("Result", "number");
  }
  MathMultiplySimple.title = "Multiply";
  MathMultiplySimple.prototype.onExecute = function() { this.setOutputData(0, (this.getInputData(0) || 0) * (this.getInputData(1) || 0)); };
  LiteGraph.registerNodeType("math/multiply", MathMultiplySimple);

  function ThresholdSimple() {
    this.addInput("Value", "number"); this.addOutput("Above", "boolean"); this.addOutput("Below", "boolean");
    this.addProperty("threshold", 0.5); this.size = [200,120];
  }
  ThresholdSimple.title = "Threshold";
  ThresholdSimple.prototype.onExecute = function() {
    const v = this.getInputData(0) || 0; const t = this.properties.threshold;
    this.setOutputData(0, v > t); this.setOutputData(1, v <= t);
  };
  LiteGraph.registerNodeType("logic/threshold", ThresholdSimple);
  
  LiteGraph.registerNodeType('quick-connection', QuickConnection);

  console.log("All LiteGraph nodes registered using generic BaseNode wrapper!");
}

// Enhanced node type mapping for the library
export const nodeTypeMapping = {
  // Audio nodes
  "audio-source": "audio/source",
  "audio-analyser": "audio/analyser",
  "audio-filter": "audio/filter",
  "lyric-transcriber": "audio/lyric_transcriber", // Added mapping
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
  "geometry-renderer": "visual/geometry-renderer",
  "text-animator": "visual/text-animator",
  "video-effect": "visual/video-effect",
  "kaleidoscope": "visual/kaleidoscope",
  "mandala": "visual/mandala",
  "flow-field": "visual/flow-field",
  
  // Control nodes
  "lfo": "control/lfo",
  "envelope": "control/envelope",
  "sequencer": "control/sequencer",
  "random": "control/random",
  "expression": "control/expression",
  "midi": "control/midi",
  "clock": "control/clock",
  "trigger": "control/trigger",
  
  // Output nodes
  "video-render": "output/video-render",
  "audio-render": "output/audio-render",
  "stream-output": "output/stream-output",
  "file-export": "output/file-export",
  "preview": "output/preview",
  "social-export": "output/social-export",
  "real-time": "output/real-time",
  
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
    "audio-source", "audio-analyser", "audio-filter", "lyric-transcriber", "beat-detector",
    "spectral-analyser", "pitch-detector", "key-detector", "mood-analyser"
  ],
  Visual: [
    "particle-system", "waveform", "spectrum-visualizer", "shader-effect", "geometry-renderer",
    "text-animator", "video-effect", "kaleidoscope", "mandala", "flow-field"
  ],
  Control: [
    "lfo", "envelope", "sequencer", "random", "expression", "midi", "clock", "trigger"
  ],
  Output: [
    "video-render", "audio-render", "stream-output", "file-export",
    "preview", "social-export", "real-time"
  ],
  Math: [
    "math-add", "math-multiply", "threshold"
  ],
  Animation: [
    "dance-motion"
  ],
  Global: [
    "playhead"
  ]
};

// Node descriptions - ensure these match the expanded list of nodes
export const nodeDescriptions = {
  "audio-source": "Outputs raw audio and volume level.",
  "audio-analyser": "Analyzes audio for frequency, time data, RMS, and peak.",
  "audio-filter": "Applies various filter types to audio.",
  "lyric-transcriber": "Transcribes lyrics from audio using a Whisper model.",
  "beat-detector": "Detects beats, BPM, and onsets in audio.",
  "spectral-analyser": "Extracts spectral features like centroid, rolloff, MFCC, chroma.",
  "pitch-detector": "Detects pitch, note, and clarity of audio.",
  "key-detector": "Determines the musical key of audio.",
  "mood-analyser": "Analyzes audio for mood, valence, energy, and genre.",
  
  "particle-system": "Generates audio-reactive particle visuals.",
  "waveform": "Visualizes audio data as a waveform.",
  "spectrum-visualizer": "Displays audio frequency spectrum.",
  "shader-effect": "Applies shader-based visual effects.",
  "geometry-renderer": "Renders 3D geometric shapes, optionally audio-reactive.",
  "text-animator": "Displays and animates text.",
  "video-effect": "Applies effects to video input (e.g., chromakey).",
  "kaleidoscope": "Creates a kaleidoscope effect from visual input.",
  "mandala": "Generates mandala-like patterns, audio-reactive.",
  "flow-field": "Visualizes a particle flow field based on noise.",
  
  "lfo": "Low-Frequency Oscillator for control signals.",
  "envelope": "ADSR envelope generator.",
  "sequencer": "Step sequencer for values and gates.",
  "random": "Generates random values with various distributions.",
  "expression": "Evaluates mathematical expressions with inputs A,B,C,D and time (t).",
  "midi": "Receives and outputs MIDI data.",
  "clock": "Generates clock pulses, beat and bar information.",
  "trigger": "Outputs a trigger signal based on input value and threshold.",
  
  "video-render": "Renders visual and audio input to a video file.",
  "audio-render": "Renders audio input to an audio file.",
  "stream-output": "Streams visual and audio to a specified server.",
  "file-export": "Exports various data types to a file.",
  "preview": "Previews visual and audio content.",
  "social-export": "Exports content formatted for social media platforms.",
  "real-time": "Outputs visual and audio to a real-time device (e.g., virtual camera).",
  
  "math-add": "Adds two numbers.",
  "math-multiply": "Multiplies two numbers.",
  "threshold": "Outputs boolean based on input value vs. threshold.",

  "dance-motion": "Manages dance motion blocks for timeline animation.",
  "playhead": "Provides global playhead time and BPM."
};
