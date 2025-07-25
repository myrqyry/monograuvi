import BaseVisualNode from './BaseVisualNode.js';

class FlowFieldNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Flow Field', { size: [240, 200], ...options });

        this.setupFlowField();
    }

    setupFlowField() {
        this.addInput('Audio Data', 'array', { description: 'Audio reactive data' });
        this.addInput('Flow Force', 'number', { description: 'Flow field strength' });
        this.addOutput('Visual', 'visual', { description: 'Flow field visualization' });

        this.addProperty('particleCount', 1000, {
            min: 100, max: 10000, step: 100,
            description: 'Number of flow particles',
            category: 'Particles'
        });
        this.addProperty('noiseScale', 0.01, {
            min: 0.001, max: 0.1, step: 0.001,
            description: 'Noise field scale',
            category: 'Flow'
        });
        this.addProperty('flowStrength', 0.5, {
            min: 0.1, max: 5, step: 0.1,
            description: 'Flow field strength',
            category: 'Flow'
        });
        this.addProperty('trailLength', 50, {
            min: 1, max: 200, step: 1,
            description: 'Particle trail length',
            category: 'Appearance'
        });
        this.addProperty('colorMode', 'velocity', {
            options: ['velocity', 'direction', 'lifetime', 'audio-reactive'],
            type: 'enum',
            description: 'Particle coloring method',
            category: 'Appearance'
        });
    }

    async onProcess(inputs) {
        return this.processFlowField(inputs);
    }

    processFlowField(inputs) {
        const audioData = inputs['Audio Data'] || [];
        const flowForce = inputs['Flow Force'] || 1.0;

        return {
            Visual: {
                type: 'flow-field',
                audioData,
                flowForce,
                particleCount: this.getProperty('particleCount'),
                noiseScale: this.getProperty('noiseScale'),
                properties: this.getProperties()
            }
        };
    }
}

export default FlowFieldNode;
