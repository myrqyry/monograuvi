// src/nodes/registerNodes.js
// Import Rete components
import { ClassicPreset } from 'rete';

// Import Rete node implementations
import { AudioSourceReteNode } from './rete/AudioSourceReteNode';
import { AudioFilterReteNode } from './rete/AudioFilterReteNode';
import { LyricTranscriberReteNode } from './rete/LyricTranscriberReteNode';
import { PlayheadReteNode } from './rete/PlayheadReteNode';
import { DanceMotionReteNode } from './rete/DanceMotionReteNode';
import { LfoReteNode } from './rete/LfoReteNode';
import { EnvelopeReteNode } from './rete/EnvelopeReteNode';
import { ParticleSystemReteNode } from './rete/ParticleSystemReteNode';
import { WaveformReteNode } from './rete/WaveformReteNode';
import { SpectrumVisualizerReteNode } from './rete/SpectrumVisualizerReteNode';
import { ShaderEffectReteNode } from './rete/ShaderEffectReteNode';
import { GeometryRendererReteNode } from './rete/GeometryRendererReteNode';
import { TextAnimatorReteNode } from './rete/TextAnimatorReteNode';
import { VideoEffectReteNode } from './rete/VideoEffectReteNode';
import { KaleidoscopeReteNode } from './rete/KaleidoscopeReteNode';
import { MandalaReteNode } from './rete/MandalaReteNode';
import { FlowFieldReteNode } from './rete/FlowFieldReteNode';
import { SequencerReteNode } from './rete/SequencerReteNode';
import { RandomReteNode } from './rete/RandomReteNode';
import { ExpressionReteNode } from './rete/ExpressionReteNode';
import { MidiReteNode } from './rete/MidiReteNode';
import { ClockReteNode } from './rete/ClockReteNode';
import { TriggerReteNode } from './rete/TriggerReteNode';
import { VideoRenderReteNode } from './rete/VideoRenderReteNode';
import { AudioRenderReteNode } from './rete/AudioRenderReteNode';
import { StreamOutputReteNode } from './rete/StreamOutputReteNode';
import { FileExportReteNode } from './rete/FileExportReteNode';
import { PreviewReteNode } from './rete/PreviewReteNode';
import { SocialExportReteNode } from './rete/SocialExportReteNode';
import { RealTimeReteNode } from './rete/RealTimeReteNode';

// Node registry to keep track of all registered node types
const nodeRegistry = new Map();

/**
 * Register a node type with the Rete editor
 * @param {string} type - The type identifier for the node
 * @param {Class} NodeClass - The Rete node class to register
 * @param {Object} options - Additional options for the node
 */
function registerNodeType(type, NodeClass, options = {}) {
  nodeRegistry.set(type, { NodeClass, ...options });
  console.log(`Registered node type: ${type}`);
}

/**
 * Get a registered node type
 * @param {string} type - The type identifier for the node
 * @returns {Object} The registered node class and options
 */
function getNodeType(type) {
  return nodeRegistry.get(type);
}

/**
 * Get all registered node types
 * @returns {Array} Array of registered node types with their metadata
 */
function getAllNodeTypes() {
  return Array.from(nodeRegistry.entries()).map(([type, data]) => ({
    type,
    ...data
  }));
}

/**
 * Create a new instance of a registered node
 * @param {string} type - The type identifier for the node
 * @param {Object} data - Initial data for the node
 * @returns {ReteNode} A new instance of the node
 */
function createNode(type, data = {}) {
  const nodeInfo = getNodeType(type);
  if (!nodeInfo) {
    console.error(`Node type ${type} not found in registry`);
    return null;
  }
  
  const { NodeClass } = nodeInfo;
  try {
    return new NodeClass(data);
  } catch (error) {
    console.error(`Error creating node of type ${type}:`, error);
    return null;
  }
}

// Register all node types
function registerAllNodeTypes() {
  // Audio Nodes
  registerNodeType('audio/source', AudioSourceReteNode, {
    category: 'Audio',
    description: 'Outputs raw audio and volume level.',
    icon: '🎵'
  });
  
  registerNodeType('audio/filter', AudioFilterReteNode, {
    category: 'Audio',
    description: 'Applies various filter types to audio.',
    icon: '🔊'
  });

  registerNodeType('audio/lyric-transcriber', LyricTranscriberReteNode, {
    category: 'Audio',
    description: 'Transcribes lyrics from audio using a Whisper model.',
    icon: '🎤'
  });

  // Visual Nodes
  registerNodeType('visual/particles', ParticleSystemReteNode, {
    category: 'Visual',
    description: 'Particle system for visual effects.',
    icon: '✨'
  });

  registerNodeType('visual/waveform', WaveformReteNode, {
    category: 'Visual',
    description: 'Displays audio waveform visualization.',
    icon: '📊'
  });

  registerNodeType('visual/spectrum', SpectrumVisualizerReteNode, {
    category: 'Visual',
    description: 'Displays audio spectrum visualization.',
    icon: '📈'
  });

  registerNodeType('visual/shader', ShaderEffectReteNode, {
    category: 'Visual',
    description: 'Applies custom shader effects.',
    icon: '🎨'
  });

  // Motion Nodes
  registerNodeType('motion/dance', DanceMotionReteNode, {
    category: 'Motion',
    description: 'Controls dance motion animations.',
    icon: '🕺'
  });

  // Control Nodes
  registerNodeType('control/lfo', LfoReteNode, {
    category: 'Control',
    description: 'Low Frequency Oscillator for modulation.',
    icon: '🔄'
  });

  registerNodeType('control/envelope', EnvelopeReteNode, {
    category: 'Control',
    description: 'Envelope generator for modulation.',
    icon: '📈'
  });

  registerNodeType('control/playhead', PlayheadReteNode, {
    category: 'Control',
    description: 'Controls playback position and timing.',
    icon: '⏱️'
  });

  // Add more node registrations as needed...
  
  console.log('All node types registered');
}

// Initialize the node registry when this module is loaded
registerAllNodeTypes();

// Define node categories for the UI
const nodeCategories = {
  Audio: ['audio/source', 'audio/filter', 'audio/lyric-transcriber'],
  Visual: ['visual/particles', 'visual/waveform', 'visual/spectrum', 'visual/shader'],
  Motion: ['motion/dance'],
  Control: ['control/lfo', 'control/envelope', 'control/playhead']
};

// Category configuration for the UI
const categoryConfig = {
  Audio: { 
    id: 'audio', 
    name: 'Audio', 
    icon: 'ri-music-2-line',
    color: '#FF6B35',
    description: 'Audio processing and analysis nodes'
  },
  Visual: { 
    id: 'visual', 
    name: 'Visual', 
    icon: 'ri-slideshow-line',
    color: '#9B59B6',
    description: 'Visual effects and rendering nodes'
  },
  Motion: { 
    id: 'motion', 
    name: 'Motion', 
    icon: 'ri-run-line',
    color: '#2ECC71',
    description: 'Motion and animation control nodes'
  },
  Control: { 
    id: 'control', 
    name: 'Control', 
    icon: 'ri-timer-line',
    color: '#3498DB',
    description: 'Control and utility nodes'
  }
};

// Map node types to their categories
const nodeTypeMapping = {
  'audio/source': 'Audio',
  'audio/filter': 'Audio',
  'audio/lyric-transcriber': 'Audio',
  'visual/particles': 'Visual',
  'visual/waveform': 'Visual',
  'visual/spectrum': 'Visual',
  'visual/shader': 'Visual',
  'motion/dance': 'Motion',
  'control/lfo': 'Control',
  'control/envelope': 'Control',
  'control/playhead': 'Control'
};

// Node descriptions for tooltips
const nodeDescriptions = {
  'audio/source': 'Outputs raw audio and volume level',
  'audio/filter': 'Applies various filter types to audio',
  'audio/lyric-transcriber': 'Transcribes lyrics from audio using a Whisper model',
  'visual/particles': 'Particle system for visual effects',
  'visual/waveform': 'Displays audio waveform visualization',
  'visual/spectrum': 'Displays audio spectrum visualization',
  'visual/shader': 'Applies custom shader effects',
  'motion/dance': 'Controls dance motion animations',
  'control/lfo': 'Low Frequency Oscillator for modulation',
  'control/envelope': 'Envelope generator for modulation',
  'control/playhead': 'Controls playback position and timing'
};

// Export the public API
export {
  registerNodeType,
  getNodeType,
  getAllNodeTypes,
  createNode,
  registerAllNodeTypes,
  nodeCategories,
  nodeTypeMapping,
  nodeDescriptions,
  categoryConfig
};