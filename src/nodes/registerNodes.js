// src/nodes/registerNodes.js
// Import Rete components
// import { ClassicPreset } from 'rete';

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

// Import Three.js Nodes
import { ThreeJSBaseNode } from '../threejs/core/ThreeJSBaseNode';
import { BoxGeometryNode } from '../threejs/geometry/BoxGeometryNode';
import { SphereGeometryNode } from '../threejs/geometry/SphereGeometryNode';
import { MeshStandardMaterialNode } from '../threejs/materials/MeshStandardMaterialNode';
import { MeshBasicMaterialNode } from '../threejs/materials/MeshBasicMaterialNode';
import { ShaderMaterialNode } from '../threejs/materials/ShaderMaterialNode';
import { AmbientLightNode } from '../threejs/lighting/AmbientLightNode';
import { DirectionalLightNode } from '../threejs/lighting/DirectionalLightNode';
import { PointLightNode } from '../threejs/lighting/PointLightNode';
import { SceneNode } from '../threejs/core/SceneNode';
import { PerspectiveCameraNode } from '../threejs/core/CameraNode';
import { MeshNode } from '../threejs/core/MeshNode';
import { AnimationNode } from '../threejs/core/AnimationNode';
import { UnrealBloomPassNode } from '../threejs/postprocessing/UnrealBloomPassNode';
import { EffectComposerNode } from '../threejs/postprocessing/EffectComposerNode';
import { SceneRendererNode } from '../threejs/core/SceneRendererNode';
import { RendererNode } from '../threejs/core/RendererNode';

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

  registerNodeType('visual/unreal-bloom', UnrealBloomReteNode, {
    category: 'Visual',
    description: 'Applies an Unreal Bloom effect to the scene.',
    icon: '✨'
  });

  // Three.js Core Nodes
  registerNodeType('threejs/core/renderer', RendererNode, {
    category: 'Three.js/Core',
    description: 'Creates a WebGLRenderer instance.',
    icon: '⚙️'
  });
  registerNodeType('threejs/core/scene', SceneNode, {
    category: 'Three.js/Core',
    description: 'Creates a Three.js Scene container.',
    icon: '🏞️'
  });
  registerNodeType('threejs/core/camera', PerspectiveCameraNode, {
    category: 'Three.js/Core',
    description: 'Creates a Perspective Camera.',
    icon: '📷'
  });
  registerNodeType('threejs/core/mesh', MeshNode, {
    category: 'Three.js/Core',
    description: 'Creates a 3D mesh from geometry and material.',
    icon: '📦'
  });
  registerNodeType('threejs/core/animation', AnimationNode, {
    category: 'Three.js/Core',
    description: 'Manages animation for a 3D object.',
    icon: '🎬'
  });
  registerNodeType('threejs/core/scenerenderer', SceneRendererNode, {
    category: 'Three.js/Core',
    description: 'Renders a Three.js scene to a canvas or render target.',
    icon: '🖼️'
  });

  // Three.js Geometry Nodes
  registerNodeType('threejs/geometry/box', BoxGeometryNode, {
    category: 'Three.js/Geometry',
    description: 'Creates a box geometry.',
    icon: '🧊'
  });
  registerNodeType('threejs/geometry/sphere', SphereGeometryNode, {
    category: 'Three.js/Geometry',
    description: 'Creates a sphere geometry.',
    icon: '🌐'
  });

  // Three.js Material Nodes
  registerNodeType('threejs/material/standard', MeshStandardMaterialNode, {
    category: 'Three.js/Material',
    description: 'Creates a physically based standard material.',
    icon: '⚪'
  });
  registerNodeType('threejs/material/basic', MeshBasicMaterialNode, {
    category: 'Three.js/Material',
    description: 'Creates a basic material (not affected by lights).',
    icon: '🎨'
  });
  registerNodeType('threejs/material/shader', ShaderMaterialNode, {
    category: 'Three.js/Material',
    description: 'Creates a custom shader material.',
    icon: '💻'
  });

  // Three.js Lighting Nodes
  registerNodeType('threejs/lighting/ambient', AmbientLightNode, {
    category: 'Three.js/Lighting',
    description: 'Creates an ambient light.',
    icon: '💡'
  });
  registerNodeType('threejs/lighting/directional', DirectionalLightNode, {
    category: 'Three.js/Lighting',
    description: 'Creates a directional light.',
    icon: '☀️'
  });
  registerNodeType('threejs/lighting/point', PointLightNode, {
    category: 'Three.js/Lighting',
    description: 'Creates a point light.',
    icon: '✨'
  });

  // Three.js Post-processing Nodes
  registerNodeType('threejs/postprocessing/unrealbloom', UnrealBloomPassNode, {
    category: 'Three.js/PostProcessing',
    description: 'Applies an Unreal Bloom post-processing effect.',
    icon: '🌟'
  });
  registerNodeType('threejs/postprocessing/composer', EffectComposerNode, {
    category: 'Three.js/PostProcessing',
    description: 'Manages post-processing effects.',
    icon: '🎛️'
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
  Visual: ['visual/particles', 'visual/waveform', 'visual/spectrum', 'visual/shader', 'visual/unreal-bloom'],
  Motion: ['motion/dance'],
  Control: ['control/lfo', 'control/envelope', 'control/playhead'],
  'Three.js/Core': [
    'threejs/core/renderer',
    'threejs/core/scene',
    'threejs/core/camera',
    'threejs/core/mesh',
    'threejs/core/animation',
    'threejs/core/scenerenderer'
  ],
  'Three.js/Geometry': [
    'threejs/geometry/box',
    'threejs/geometry/sphere'
  ],
  'Three.js/Material': [
    'threejs/material/standard',
    'threejs/material/basic',
    'threejs/material/shader'
  ],
  'Three.js/Lighting': [
    'threejs/lighting/ambient',
    'threejs/lighting/directional',
    'threejs/lighting/point'
  ],
  'Three.js/PostProcessing': [
    'threejs/postprocessing/unrealbloom',
    'threejs/postprocessing/composer'
  ]
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
  },
  'Three.js/Core': {
    id: 'threejs-core',
    name: 'Three.js Core',
    icon: 'ri-cube-fill',
    color: '#6A5ACD', // Purple for Three.js nodes
    description: 'Fundamental Three.js scene, camera, renderer, and mesh nodes.'
  },
  'Three.js/Geometry': {
    id: 'threejs-geometry',
    name: 'Three.js Geometry',
    icon: 'ri-shape-fill',
    color: '#FFA07A', // Light Salmon
    description: 'Nodes for creating various 3D geometries.'
  },
  'Three.js/Material': {
    id: 'threejs-material',
    name: 'Three.js Material',
    icon: 'ri-palette-fill',
    color: '#20B2AA', // Light Sea Green
    description: 'Nodes for defining surface properties of 3D objects.'
  },
  'Three.js/Lighting': {
    id: 'threejs-lighting',
    name: 'Three.js Lighting',
    icon: 'ri-lightbulb-fill',
    color: '#FFD700', // Gold
    description: 'Nodes for adding and controlling light sources in a 3D scene.'
  },
  'Three.js/PostProcessing': {
    id: 'threejs-postprocessing',
    name: 'Three.js Post-Processing',
    icon: 'ri-image-filter-fill',
    color: '#ADFF2F', // GreenYellow
    description: 'Nodes for applying post-processing effects to the rendered scene.'
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
  'visual/unreal-bloom': 'Visual',
  'motion/dance': 'Motion',
  'control/lfo': 'Control',
  'control/envelope': 'Control',
  'control/playhead': 'Control',
  'threejs/core/renderer': 'Three.js/Core',
  'threejs/core/scene': 'Three.js/Core',
  'threejs/core/camera': 'Three.js/Core',
  'threejs/core/mesh': 'Three.js/Core',
  'threejs/core/animation': 'Three.js/Core',
  'threejs/core/scenerenderer': 'Three.js/Core',
  'threejs/geometry/box': 'Three.js/Geometry',
  'threejs/geometry/sphere': 'Three.js/Geometry',
  'threejs/material/standard': 'Three.js/Material',
  'threejs/material/basic': 'Three.js/Material',
  'threejs/material/shader': 'Three.js/Material',
  'threejs/lighting/ambient': 'Three.js/Lighting',
  'threejs/lighting/directional': 'Three.js/Lighting',
  'threejs/lighting/point': 'Three.js/Lighting',
  'threejs/postprocessing/unrealbloom': 'Three.js/PostProcessing',
  'threejs/postprocessing/composer': 'Three.js/PostProcessing'
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
  'visual/unreal-bloom': 'Applies an Unreal Bloom effect to the scene.',
  'motion/dance': 'Controls dance motion animations',
  'control/lfo': 'Low Frequency Oscillator for modulation',
  'control/envelope': 'Envelope generator for modulation',
  'control/playhead': 'Controls playback position and timing',
  'threejs/core/renderer': 'Creates a WebGLRenderer instance.',
  'threejs/core/scene': 'Creates a Three.js Scene container.',
  'threejs/core/camera': 'Creates a Perspective Camera.',
  'threejs/core/mesh': 'Creates a 3D mesh from geometry and material.',
  'threejs/core/animation': 'Manages animation for a 3D object.',
  'threejs/core/scenerenderer': 'Renders a Three.js scene to a canvas or render target.',
  'threejs/geometry/box': 'Creates a box geometry.',
  'threejs/geometry/sphere': 'Creates a sphere geometry.',
  'threejs/material/standard': 'Creates a physically based standard material.',
  'threejs/material/basic': 'Creates a basic material (not affected by lights).',
  'threejs/material/shader': 'Creates a custom shader material.',
  'threejs/lighting/ambient': 'Creates an ambient light.',
  'threejs/lighting/directional': 'Creates a directional light.',
  'threejs/lighting/point': 'Creates a point light.',
  'threejs/postprocessing/unrealbloom': 'Applies an Unreal Bloom post-processing effect.',
  'threejs/postprocessing/composer': 'Manages post-processing effects.'
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