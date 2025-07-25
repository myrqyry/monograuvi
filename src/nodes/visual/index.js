import ParticleSystemNode from './ParticleSystemNode.js';
import WaveformNode from './WaveformNode.js';
import SpectrumVisualizerNode from './SpectrumVisualizerNode.js';
import ShaderEffectNode from './ShaderEffectNode.js';
import GeometryRendererNode from './GeometryRendererNode.js';
import TextAnimatorNode from './TextAnimatorNode.js';
import VideoEffectNode from './VideoEffectNode.js';
import KaleidoscopeNode from './KaleidoscopeNode.js';
import MandalaNode from './MandalaNode.js';
import FlowFieldNode from './FlowFieldNode.js';

const visualNodeTypes = {
    'particle-system': ParticleSystemNode,
    waveform: WaveformNode,
    'spectrum-visualizer': SpectrumVisualizerNode,
    'shader-effect': ShaderEffectNode,
    'geometry-renderer': GeometryRendererNode,
    'text-animator': TextAnimatorNode,
    'video-effect': VideoEffectNode,
    kaleidoscope: KaleidoscopeNode,
    mandala: MandalaNode,
    'flow-field': FlowFieldNode,
};

export function createVisualNode(type, options = {}) {
    const NodeClass = visualNodeTypes[type];
    if (NodeClass) {
        return new NodeClass(options);
    }
    throw new Error(`Unknown visual node type: ${type}`);
}
