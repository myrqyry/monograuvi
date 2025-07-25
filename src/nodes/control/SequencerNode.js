import BaseControlNode from './BaseControlNode.js';

class SequencerNode extends BaseControlNode {
    constructor(options = {}) {
        super('Control Sequencer', { size: [200, 160], ...options });

        this.setupSequencer();
    }

    setupSequencer() {
        this.addInput('Clock', 'boolean', { description: 'Step clock input' });
        this.addInput('Reset', 'boolean', { description: 'Reset to step 1' });
        this.addOutput('Value', 'number', { description: 'Current step value' });
        this.addOutput('Gate', 'boolean', { description: 'Current step gate' });
        this.addOutput('Step', 'number', { description: 'Current step number' });

        this.addProperty('steps', 8, {
            min: 1, max: 32, step: 1,
            description: 'Number of steps',
            category: 'Sequencer'
        });
        this.addProperty('values', '0,0.5,1,0.3,0.8,0.1,0.9,0.2', {
            type: 'string',
            description: 'Step values (comma separated)',
            category: 'Sequencer'
        });
        this.addProperty('gates', '1,1,1,0,1,0,1,1', {
            type: 'string',
            description: 'Step gates (comma separated, 1=on, 0=off)',
            category: 'Sequencer'
        });
        this.addProperty('direction', 'forward', {
            options: ['forward', 'backward', 'pingpong', 'random'],
            type: 'enum',
            description: 'Playback direction',
            category: 'Sequencer'
        });

        this.internalState = {
            currentStep: 0,
            lastClock: false,
            direction: 1,
            stepValues: [],
            stepGates: []
        };

        this.parseSequenceData();
    }

    async onProcess(inputs) {
        return this.processSequencer(inputs);
    }

    processSequencer(inputs) {
        const clock = inputs.Clock || false;
        const reset = inputs.Reset || false;

        if (reset) {
            this.internalState.currentStep = 0;
        }

        if (clock && !this.internalState.lastClock) {
            this.advanceStep();
        }
        this.internalState.lastClock = clock;

        const stepValues = this.internalState.stepValues;
        const stepGates = this.internalState.stepGates;
        const currentStep = this.internalState.currentStep;

        return {
            Value: stepValues[currentStep] || 0,
            Gate: stepGates[currentStep] || false,
            Step: currentStep + 1
        };
    }

    parseSequenceData() {
        const values = this.getProperty('values').split(',').map(v => parseFloat(v.trim()) || 0);
        const gates = this.getProperty('gates').split(',').map(g => parseInt(g.trim()) === 1);

        this.internalState.stepValues = values;
        this.internalState.stepGates = gates;
    }

    advanceStep() {
        const steps = this.getProperty('steps');
        const direction = this.getProperty('direction');

        switch (direction) {
            case 'forward':
                this.internalState.currentStep = (this.internalState.currentStep + 1) % steps;
                break;
            case 'backward':
                this.internalState.currentStep = this.internalState.currentStep === 0 ?
                    steps - 1 : this.internalState.currentStep - 1;
                break;
            case 'pingpong':
                this.internalState.currentStep += this.internalState.direction;
                if (this.internalState.currentStep >= steps - 1 || this.internalState.currentStep <= 0) {
                    this.internalState.direction *= -1;
                }
                break;
            case 'random':
                this.internalState.currentStep = Math.floor(Math.random() * steps);
                break;
        }
    }

    onPropertyChanged(name, value) {
        if (name === 'values' || name === 'gates') {
            this.parseSequenceData();
        }
    }
}

export default SequencerNode;
