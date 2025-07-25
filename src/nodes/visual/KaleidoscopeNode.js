import BaseVisualNode from './BaseVisualNode.js';

class KaleidoscopeNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Kaleidoscope', { size: [240, 200], ...options });

        this.setupKaleidoscope();
    }

    setupKaleidoscope() {
        this.addInput('Input', 'visual', { description: 'Input visual to kaleidoscope' });
        this.addInput('Segments', 'number', { description: 'Number of segments' });
        this.addOutput('Visual', 'visual', { description: 'Kaleidoscope effect' });

        this.addProperty('segments', 6, {
            min: 2, max: 32, step: 1,
            description: 'Number of mirror segments',
            category: 'Kaleidoscope'
        });
        this.addProperty('rotation', 0.01, {
            min: -1, max: 1, step: 0.001,
            description: 'Rotation speed',
            category: 'Animation'
        });
        this.addProperty('scale', 1.0, {
            min: 0.1, max: 5, step: 0.1,
            description: 'Scale factor',
            category: 'Transform'
        });
        this.addProperty('centerX', 0.5, {
            min: 0, max: 1, step: 0.01,
            description: 'Center X position (normalized)',
            category: 'Transform'
        });
        this.addProperty('centerY', 0.5, {
            min: 0, max: 1, step: 0.01,
            description: 'Center Y position (normalized)',
            category: 'Transform'
        });
    }

    async onProcess(inputs) {
        return this.processKaleidoscope(inputs);
    }

    processKaleidoscope(inputs) {
        const inputVisual = inputs.Input;
        const segments = inputs.Segments || this.getProperty('segments');

        return {
            Visual: {
                type: 'kaleidoscope',
                inputVisual,
                segments,
                rotation: this.getProperty('rotation'),
                scale: this.getProperty('scale'),
                properties: this.getProperties()
            }
        };
    }
}

export default KaleidoscopeNode;
