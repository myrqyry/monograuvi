import BaseVisualNode from './BaseVisualNode.js';

class MandalaNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Mandala', { size: [240, 200], ...options });

        this.setupMandala();
    }

    setupMandala() {
        this.addInput('Audio Data', 'array', { description: 'Audio reactive data' });
        this.addInput('Complexity', 'number', { description: 'Pattern complexity' });
        this.addOutput('Visual', 'visual', { description: 'Mandala pattern' });

        this.addProperty('complexity', 8, {
            min: 2, max: 64, step: 1,
            description: 'Pattern complexity',
            category: 'Pattern'
        });
        this.addProperty('layers', 3, {
            min: 1, max: 10, step: 1,
            description: 'Number of layers',
            category: 'Pattern'
        });
        this.addProperty('symmetry', 8, {
            min: 2, max: 32, step: 1,
            description: 'Radial symmetry',
            category: 'Pattern'
        });
        this.addProperty('rotation', 0.005, {
            min: -0.1, max: 0.1, step: 0.001,
            description: 'Rotation speed',
            category: 'Animation'
        });
        this.addProperty('colorPalette', 'warm', {
            options: ['warm', 'cool', 'rainbow', 'monochrome', 'custom'],
            type: 'enum',
            description: 'Color palette',
            category: 'Appearance'
        });
        this.addProperty('audioReactive', true, {
            type: 'boolean',
            description: 'React to audio',
            category: 'Audio'
        });
    }

    async onProcess(inputs) {
        return this.processMandala(inputs);
    }

    processMandala(inputs) {
        const audioData = inputs['Audio Data'] || [];
        const complexity = inputs.Complexity || this.getProperty('complexity');

        return {
            Visual: {
                type: 'mandala',
                audioData,
                complexity,
                layers: this.getProperty('layers'),
                symmetry: this.getProperty('symmetry'),
                properties: this.getProperties()
            }
        };
    }
}

export default MandalaNode;
