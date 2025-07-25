import BaseControlNode from './BaseControlNode.js';

class EnvelopeNode extends BaseControlNode {
    constructor(options = {}) {
        super('Control Envelope', { size: [200, 160], ...options });

        this.setupEnvelope();
    }

    setupEnvelope() {
        this.addInput('Trigger', 'boolean', { description: 'Envelope trigger' });
        this.addInput('Gate', 'boolean', { description: 'Envelope gate' });
        this.addOutput('Output', 'number', { description: 'Envelope value' });
        this.addOutput('Stage', 'string', { description: 'Current envelope stage' });

        this.addProperty('attack', 0.1, {
            min: 0.001, max: 10, step: 0.001,
            description: 'Attack time in seconds',
            category: 'Envelope'
        });
        this.addProperty('decay', 0.3, {
            min: 0.001, max: 10, step: 0.001,
            description: 'Decay time in seconds',
            category: 'Envelope'
        });
        this.addProperty('sustain', 0.7, {
            min: 0, max: 1, step: 0.01,
            description: 'Sustain level',
            category: 'Envelope'
        });
        this.addProperty('release', 0.5, {
            min: 0.001, max: 10, step: 0.001,
            description: 'Release time in seconds',
            category: 'Envelope'
        });
        this.addProperty('curve', 'exponential', {
            options: ['linear', 'exponential', 'logarithmic'],
            type: 'enum',
            description: 'Envelope curve type',
            category: 'Envelope'
        });

        this.internalState = {
            stage: 'idle',
            value: 0,
            stageStartTime: 0,
            triggered: false,
            gateOn: false
        };
    }

    async onProcess(inputs) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        return this.processEnvelope(inputs, deltaTime);
    }

    processEnvelope(inputs, deltaTime) {
        const curveType = this.getProperty('curve');
        const trigger = inputs.Trigger || false;
        const gate = inputs.Gate || false;
        const currentTime = performance.now() / 1000;

        // Handle trigger
        if (trigger && !this.internalState.triggered) {
            this.internalState.stage = 'attack';
            this.internalState.stageStartTime = currentTime;
            this.internalState.triggered = true;
        } else if (!trigger) {
            this.internalState.triggered = false;
        }

        // Handle gate
        if (gate && !this.internalState.gateOn) {
            this.internalState.gateOn = true;
        } else if (!gate && this.internalState.gateOn) {
            this.internalState.gateOn = false;
            if (this.internalState.stage === 'sustain') {
                this.internalState.stage = 'release';
                this.internalState.stageStartTime = currentTime;
            }
        }

        const stageTime = currentTime - this.internalState.stageStartTime;

        switch (this.internalState.stage) {
            case 'attack':
                const attackTime = this.getProperty('attack');
                if (stageTime >= attackTime) {
                    this.internalState.stage = 'decay';
                    this.internalState.stageStartTime = currentTime;
                    this.internalState.value = 1;
                } else {
                    this.internalState.value = this.applyCurve(stageTime / attackTime, curveType);
                }
                break;

            case 'decay':
                const decayTime = this.getProperty('decay');
                const sustainLevel = this.getProperty('sustain');
                if (stageTime >= decayTime) {
                    this.internalState.stage = 'sustain';
                    this.internalState.value = sustainLevel;
                } else {
                    this.internalState.value = 1 - (1 - sustainLevel) * this.applyCurve(stageTime / decayTime, curveType);
                }
                break;

            case 'sustain':
                this.internalState.value = this.getProperty('sustain');
                break;

            case 'release':
                const releaseTime = this.getProperty('release');
                if (stageTime >= releaseTime) {
                    this.internalState.stage = 'idle';
                    this.internalState.value = 0;
                } else {
                    const sustainLevel = this.getProperty('sustain');
                    this.internalState.value = sustainLevel * (1 - this.applyCurve(stageTime / releaseTime, curveType));
                }
                break;

            default:
                this.internalState.value = 0;
        }

        return {
            Output: this.internalState.value,
            Stage: this.internalState.stage
        };
    }

    applyCurve(value, curveType) {
        switch (curveType) {
            case 'linear':
                return value;
            case 'exponential':
                return Math.pow(value, 2);
            case 'logarithmic':
                return Math.log10(value * 9 + 1);
            default:
                return value;
        }
    }
}

export default EnvelopeNode;
