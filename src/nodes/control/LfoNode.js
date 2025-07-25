import BaseControlNode from './BaseControlNode.js';

class LfoNode extends BaseControlNode {
    constructor(options = {}) {
        super('Control LFO', { size: [200, 160], ...options });

        this.setupLFO();
    }

    setupLFO() {
        this.addOutput('Output', 'number', { description: 'LFO output value' });
        this.addOutput('Inverted', 'number', { description: 'Inverted LFO output' });
        this.addOutput('Trigger', 'boolean', { description: 'Peak trigger' });

        this.addProperty('frequency', 1.0, {
            min: 0.01, max: 20, step: 0.01,
            description: 'LFO frequency in Hz',
            category: 'Oscillator'
        });
        this.addProperty('waveform', 'sine', {
            options: ['sine', 'triangle', 'square', 'sawtooth', 'random', 'noise'],
            type: 'enum',
            description: 'LFO waveform type',
            category: 'Oscillator'
        });
        this.addProperty('amplitude', 1.0, {
            min: 0, max: 2, step: 0.1,
            description: 'LFO amplitude',
            category: 'Oscillator'
        });
        this.addProperty('offset', 0.0, {
            min: -1, max: 1, step: 0.1,
            description: 'DC offset',
            category: 'Oscillator'
        });
        this.addProperty('phase', 0.0, {
            min: 0, max: 360, step: 1,
            description: 'Phase offset in degrees',
            category: 'Oscillator'
        });
        this.addProperty('sync', false, {
            type: 'boolean',
            description: 'Sync to global clock',
            category: 'Timing'
        });

        this.internalState.phase = 0;
    }

    async onProcess(inputs) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        return this.processLFO(deltaTime);
    }

    processLFO(deltaTime) {
        const freq = this.getProperty('frequency');
        const amplitude = this.getProperty('amplitude');
        const offset = this.getProperty('offset');
        const phaseOffset = this.getProperty('phase') * Math.PI / 180;

        this.internalState.phase += freq * deltaTime * 2 * Math.PI;

        let value;
        const phase = this.internalState.phase + phaseOffset;

        switch (this.getProperty('waveform')) {
            case 'sine':
                value = Math.sin(phase);
                break;
            case 'triangle':
                value = 2 * Math.asin(Math.sin(phase)) / Math.PI;
                break;
            case 'square':
                value = Math.sin(phase) > 0 ? 1 : -1;
                break;
            case 'sawtooth':
                value = 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
                break;
            case 'random':
                if (Math.floor(this.internalState.phase / (2 * Math.PI)) !==
                    Math.floor((this.internalState.phase - freq * deltaTime * 2 * Math.PI) / (2 * Math.PI))) {
                    this.internalState.randomValue = Math.random() * 2 - 1;
                }
                value = this.internalState.randomValue || 0;
                break;
            case 'noise':
                value = Math.random() * 2 - 1;
                break;
            default:
                value = 0;
        }

        const output = value * amplitude + offset;
        const trigger = value > 0.9 && this.internalState.lastValue <= 0.9;
        this.internalState.lastValue = value;

        return {
            Output: output,
            Inverted: -output,
            Trigger: trigger
        };
    }
}

export default LfoNode;
