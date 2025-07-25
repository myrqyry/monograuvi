import BaseControlNode from './BaseControlNode.js';

class RandomNode extends BaseControlNode {
    constructor(options = {}) {
        super('Control Random', { size: [200, 160], ...options });

        this.setupRandom();
    }

    setupRandom() {
        this.addInput('Trigger', 'boolean', { description: 'Generate new random value' });
        this.addInput('Rate', 'number', { description: 'Auto-generation rate' });
        this.addOutput('Output', 'number', { description: 'Random value' });
        this.addOutput('Scaled', 'number', { description: 'Scaled random value' });

        this.addProperty('min', 0, {
            min: -10, max: 10, step: 0.1,
            description: 'Minimum value',
            category: 'Range'
        });
        this.addProperty('max', 1, {
            min: -10, max: 10, step: 0.1,
            description: 'Maximum value',
            category: 'Range'
        });
        this.addProperty('distribution', 'uniform', {
            options: ['uniform', 'gaussian', 'exponential'],
            type: 'enum',
            description: 'Random distribution',
            category: 'Random'
        });
        this.addProperty('rate', 0, {
            min: 0, max: 20, step: 0.1,
            description: 'Auto rate in Hz (0 = manual)',
            category: 'Timing'
        });
        this.addProperty('smooth', 0, {
            min: 0, max: 1, step: 0.01,
            description: 'Value smoothing',
            category: 'Processing'
        });

        this.internalState = {
            value: 0,
            lastTrigger: false,
            lastAutoTime: 0,
            targetValue: 0
        };
    }

    async onProcess(inputs) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        return this.processRandom(inputs, deltaTime);
    }

    processRandom(inputs, deltaTime) {
        const trigger = inputs.Trigger || false;
        const rate = inputs.Rate || this.getProperty('rate');
        const currentTime = performance.now() / 1000;

        let shouldGenerate = false;

        // Manual trigger
        if (trigger && !this.internalState.lastTrigger) {
            shouldGenerate = true;
        }
        this.internalState.lastTrigger = trigger;

        // Auto rate
        if (rate > 0 && currentTime - this.internalState.lastAutoTime >= 1 / rate) {
            shouldGenerate = true;
            this.internalState.lastAutoTime = currentTime;
        }

        if (shouldGenerate) {
            this.internalState.targetValue = this.generateRandomValue();
        }

        // Smooth to target
        const smooth = this.getProperty('smooth');
        if (smooth > 0) {
            const smoothingFactor = Math.exp(-deltaTime / (1 / smooth));
            this.internalState.value += (this.internalState.targetValue - this.internalState.value) * (1 - smoothingFactor);
        } else {
            this.internalState.value = this.internalState.targetValue;
        }

        const min = this.getProperty('min');
        const max = this.getProperty('max');
        const scaled = min + this.internalState.value * (max - min);

        return {
            Output: this.internalState.value,
            Scaled: scaled
        };
    }

    generateRandomValue() {
        const distribution = this.getProperty('distribution');

        switch (distribution) {
            case 'uniform':
                return Math.random();
            case 'gaussian':
                // Box-Muller transform for normal distribution
                const u1 = Math.random();
                const u2 = Math.random();
                const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                return Math.max(0, Math.min(1, (z0 + 3) / 6)); // Normalize to 0-1
            case 'exponential':
                return 1 - Math.exp(-Math.random() * 3);
            default:
                return Math.random();
        }
    }
}

export default RandomNode;
