import BaseVisualNode from './BaseVisualNode.js';

class ParticleSystemNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Particle System', { size: [240, 200], ...options });

        this.setupParticleSystem();
    }

    setupParticleSystem() {
        this.addInput('Trigger', 'boolean', { description: 'Particle emission trigger' });
        this.addInput('Force', 'number', { description: 'Particle force multiplier' });
        this.addInput('Color', 'color', { description: 'Particle color override' });
        this.addInput('Audio Data', 'array', { description: 'Audio frequency data' });
        this.addOutput('Visual', 'visual', { description: 'Rendered particle system' });

        this.addProperty('particleCount', 500, {
            min: 1, max: 5000, step: 1,
            description: 'Maximum number of particles',
            category: 'Particles'
        });
        this.addProperty('emissionRate', 10, {
            min: 1, max: 100, step: 1,
            description: 'Particles emitted per frame',
            category: 'Particles'
        });
        this.addProperty('particleLife', 60, {
            min: 1, max: 300, step: 1,
            description: 'Particle lifetime in frames',
            category: 'Particles'
        });
        this.addProperty('startSize', 2, {
            min: 0.1, max: 20, step: 0.1,
            description: 'Initial particle size',
            category: 'Appearance'
        });
        this.addProperty('endSize', 0, {
            min: 0, max: 20, step: 0.1,
            description: 'Final particle size',
            category: 'Appearance'
        });
        this.addProperty('velocityRange', 5, {
            min: 0.1, max: 50, step: 0.1,
            description: 'Random velocity range',
            category: 'Motion'
        });
        this.addProperty('gravity', 0.1, {
            min: -2, max: 2, step: 0.01,
            description: 'Gravity force',
            category: 'Physics'
        });
        this.addProperty('audioReactive', true, {
            type: 'boolean',
            description: 'React to audio input',
            category: 'Audio'
        });
        this.addProperty('blendMode', 'normal', {
            options: ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'color-dodge', 'color-burn'],
            type: 'enum',
            description: 'Particle blend mode',
            category: 'Appearance'
        });
        this.addProperty('colorStart', '#FF6B35', {
            type: 'color',
            description: 'Starting particle color',
            category: 'Appearance'
        });
        this.addProperty('colorEnd', '#F7931E', {
            type: 'color',
            description: 'Ending particle color',
            category: 'Appearance'
        });
    }

    async onProcess(inputs) {
        return this.processParticleSystem(inputs);
    }

    processParticleSystem(inputs) {
        const trigger = inputs.Trigger || false;
        const force = inputs.Force || 1.0;
        const audioData = inputs['Audio Data'] || [];

        // Update particle system state
        if (!this.visualState.particles) {
            this.visualState.particles = [];
        }

        // Audio reactive parameters
        const audioAmplitude = audioData.length > 0 ?
            audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length : 0;

        const dynamicEmissionRate = this.getProperty('audioReactive') ?
            this.getProperty('emissionRate') * (1 + audioAmplitude * 2) :
            this.getProperty('emissionRate');

        return {
            Visual: {
                type: 'particle-system',
                particleCount: this.getProperty('particleCount'),
                emissionRate: dynamicEmissionRate,
                audioReactive: this.getProperty('audioReactive'),
                audioAmplitude,
                force,
                trigger,
                properties: this.getProperties()
            }
        };
    }
}

export default ParticleSystemNode;
