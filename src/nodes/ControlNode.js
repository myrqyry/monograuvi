import BaseNode from './BaseNode.js';

class ControlNode extends BaseNode {
    constructor(type = 'lfo', options = {}) {
        super(`Control ${type}`, { 
            color: '#E74C3C', 
            size: [200, 160],
            ...options 
        });
        
        this.controlType = type;
        this.internalState = null;
        this.lastUpdateTime = performance.now();
        
        this.setupControlNode();
    }

    setupControlNode() {
        switch (this.controlType) {
            case 'lfo':
                this.setupLFO();
                break;
            case 'envelope':
                this.setupEnvelope();
                break;
            case 'sequencer':
                this.setupSequencer();
                break;
            case 'random':
                this.setupRandom();
                break;
            case 'expression':
                this.setupExpression();
                break;
            case 'midi':
                this.setupMIDI();
                break;
            case 'clock':
                this.setupClock();
                break;
            case 'trigger':
                this.setupTrigger();
                break;
        default:
            console.error(`Unknown control type: ${this.controlType}`);
            throw new Error(`ControlNode setup failed: Unsupported control type "${this.controlType}"`);
        }
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

    setupExpression() {
        this.addInput('A', 'number', { description: 'Input A' });
        this.addInput('B', 'number', { description: 'Input B' });
        this.addInput('C', 'number', { description: 'Input C' });
        this.addInput('D', 'number', { description: 'Input D' });
        this.addOutput('Result', 'number', { description: 'Expression result' });
        
        this.addProperty('expression', 'A * B + C', { 
            type: 'string',
            description: 'Mathematical expression',
            category: 'Expression'
        });
        this.addProperty('clampMin', -100, { 
            min: -100, max: 100, step: 0.1,
            description: 'Minimum output value',
            category: 'Output'
        });
        this.addProperty('clampMax', 100, { 
            min: -100, max: 100, step: 0.1,
            description: 'Maximum output value',
            category: 'Output'
        });
        this.addProperty('time', false, { 
            type: 'boolean',
            description: 'Include time variable (t)',
            category: 'Variables'
        });
    }

    setupMIDI() {
        this.addOutput('Note', 'number', { description: 'MIDI note number' });
        this.addOutput('Velocity', 'number', { description: 'Note velocity' });
        this.addOutput('CC', 'array', { description: 'Control change values' });
        this.addOutput('Gate', 'boolean', { description: 'Note gate' });
        
        this.addProperty('channel', 1, { 
            min: 1, max: 16, step: 1,
            description: 'MIDI channel',
            category: 'MIDI'
        });
        this.addProperty('velocityCurve', 'linear', {
            options: ['linear', 'exponential', 'logarithmic'],
            type: 'enum',
            description: 'Velocity response curve',
            category: 'Response'
        });
        this.addProperty('transpose', 0, { 
            min: -48, max: 48, step: 1,
            description: 'Note transpose (semitones)',
            category: 'Transform'
        });
        
        this.setupMIDIListeners();
    }

    setupClock() {
        this.addOutput('Clock', 'boolean', { description: 'Clock pulse' });
        this.addOutput('Beat', 'number', { description: 'Current beat' });
        this.addOutput('Bar', 'number', { description: 'Current bar' });
        this.addOutput('BPM', 'number', { description: 'Current BPM' });
        
        this.addProperty('bpm', 120, { 
            min: 60, max: 200, step: 1,
            description: 'Beats per minute',
            category: 'Timing'
        });
        this.addProperty('timeSignature', '4/4', {
            options: ['4/4', '3/4', '2/4', '6/8', '5/4', '7/8'],
            type: 'enum',
            description: 'Time signature',
            category: 'Timing'
        });
        this.addProperty('subdivision', 16, {
            options: [1, 2, 4, 8, 16, 32],
            type: 'enum',
            description: 'Clock subdivision',
            category: 'Timing'
        });
        this.addProperty('sync', true, { 
            type: 'boolean',
            description: 'Sync to global transport',
            category: 'Sync'
        });
        
        this.internalState = {
            lastPulse: 0,
            beat: 0,
            bar: 0,
            pulseCount: 0
        };
    }

    setupTrigger() {
        this.addInput('Input', 'number', { description: 'Input value to monitor' });
        this.addOutput('Trigger', 'boolean', { description: 'Trigger output' });
        this.addOutput('Value', 'number', { description: 'Triggered value' });
        
        this.addProperty('threshold', 0.5, { 
            min: -10, max: 10, step: 0.01,
            description: 'Trigger threshold',
            category: 'Trigger'
        });
        this.addProperty('mode', 'rising', {
            options: ['rising', 'falling', 'both', 'level'],
            type: 'enum',
            description: 'Trigger mode',
            category: 'Trigger'
        });
        this.addProperty('hysteresis', 0.01, { 
            min: 0, max: 1, step: 0.001,
            description: 'Trigger hysteresis',
            category: 'Trigger'
        });
        this.addProperty('holdTime', 0.01, { 
            min: 0, max: 1, step: 0.001,
            description: 'Trigger hold time',
            category: 'Timing'
        });
        
        this.internalState = {
            lastValue: 0,
            triggered: false,
            triggerTime: 0,
            state: false
        };
    }

    async onProcess(inputs) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        switch (this.controlType) {
            case 'lfo':
                return this.processLFO(deltaTime);
            case 'envelope':
                return this.processEnvelope(inputs, deltaTime);
            case 'sequencer':
                return this.processSequencer(inputs);
            case 'random':
                return this.processRandom(inputs, deltaTime);
            case 'expression':
                return this.processExpression(inputs);
            case 'midi':
                return this.processMIDI();
            case 'clock':
                return this.processClock(deltaTime);
            case 'trigger':
                return this.processTrigger(inputs, currentTime);
            default:
                return this.getErrorOutput();
        }
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

    processExpression(inputs) {
        const A = inputs.A || 0;
        const B = inputs.B || 0;
        const C = inputs.C || 0;
        const D = inputs.D || 0;
        const t = this.getProperty('time') ? performance.now() / 1000 : 0;
        
        try {
            let expression = this.getProperty('expression');
            
            // Replace variables
            expression = expression.replace(/\bA\b/g, A);
            expression = expression.replace(/\bB\b/g, B);
            expression = expression.replace(/\bC\b/g, C);
            expression = expression.replace(/\bD\b/g, D);
            expression = expression.replace(/\bt\b/g, t);
            
            // Add Math functions
            expression = expression.replace(/\bsin\b/g, 'Math.sin');
            expression = expression.replace(/\bcos\b/g, 'Math.cos');
            expression = expression.replace(/\btan\b/g, 'Math.tan');
            expression = expression.replace(/\babs\b/g, 'Math.abs');
            expression = expression.replace(/\bfloor\b/g, 'Math.floor');
            expression = expression.replace(/\bceil\b/g, 'Math.ceil');
            expression = expression.replace(/\bround\b/g, 'Math.round');
            expression = expression.replace(/\bpi\b/g, 'Math.PI');
            
            const allowedVariables = { A, B, C, D, t, Math };
            const safeFunction = new Function(...Object.keys(allowedVariables), `return (${expression});`);
            let result = safeFunction(...Object.values(allowedVariables));
            
            // Apply clamping
            const min = this.getProperty('clampMin');
            const max = this.getProperty('clampMax');
            if (min !== -Infinity) result = Math.max(result, min);
            if (max !== Infinity) result = Math.min(result, max);
            
            return { Result: result };
        } catch (error) {
            return { Result: 0 };
        }
    }

    processMIDI() {
        // This would integrate with actual MIDI input
        // For now, return mock data
        return {
            Note: 60,
            Velocity: 100,
            CC: new Array(128).fill(0),
            Gate: false
        };
    }

    processClock(deltaTime) {
        const bpm = this.getProperty('bpm');
        const subdivision = this.getProperty('subdivision');
        const pulsesPerSecond = (bpm / 60) * (subdivision / 4);
        const pulseInterval = 1 / pulsesPerSecond;
        
        const currentTime = performance.now() / 1000;
        let clockPulse = false;
        
        if (currentTime - this.internalState.lastPulse >= pulseInterval) {
            clockPulse = true;
            this.internalState.lastPulse = currentTime;
            this.internalState.pulseCount++;
            
            // Calculate beat and bar
            const [beatsPerBar, beatUnit] = this.getProperty('timeSignature').split('/').map(Number);
            const pulsesPerBeat = subdivision / (4 / beatUnit);
            this.internalState.beat = Math.floor(this.internalState.pulseCount / pulsesPerBeat) % beatsPerBar;
            this.internalState.bar = Math.floor(this.internalState.pulseCount / (pulsesPerBeat * beatsPerBar));
        }
        
        return {
            Clock: clockPulse,
            Beat: this.internalState.beat + 1,
            Bar: this.internalState.bar + 1,
            BPM: bpm
        };
    }

    processTrigger(inputs, currentTime) {
        const input = inputs.Input || 0;
        const threshold = this.getProperty('threshold');
        const mode = this.getProperty('mode');
        const hysteresis = this.getProperty('hysteresis');
        const holdTime = this.getProperty('holdTime');
        
        let triggered = false;
        
        switch (mode) {
            case 'rising':
                triggered = input > threshold && this.internalState.lastValue <= threshold - hysteresis;
                break;
            case 'falling':
                triggered = input < threshold && this.internalState.lastValue >= threshold + hysteresis;
                break;
            case 'both':
                triggered = (input > threshold && this.internalState.lastValue <= threshold - hysteresis) ||
                          (input < threshold && this.internalState.lastValue >= threshold + hysteresis);
                break;
            case 'level':
                triggered = input > threshold;
                break;
        }
        
        if (triggered) {
            this.internalState.triggered = true;
            this.internalState.triggerTime = currentTime;
        }
        
        // Handle hold time
        const output = this.internalState.triggered && 
                      (currentTime - this.internalState.triggerTime < holdTime);

        if (currentTime - this.internalState.triggerTime >= holdTime) {
            this.internalState.triggered = false;
        }
        
        this.internalState.lastValue = input;
        
        return {
            Trigger: output,
            Value: input
        };
    }

    // Helper methods
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

    setupMIDIListeners() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess()
                .then(access => {
                    for (let input of access.inputs.values()) {
                        input.onmidimessage = this.handleMIDIMessage.bind(this);
                    }
                })
                .catch(err => console.warn('MIDI access denied:', err));
        }
    }

    handleMIDIMessage(message) {
        const [status, data1, data2] = message.data;
        const channel = (status & 0x0F) + 1;
        
        if (channel === this.getProperty('channel')) {
            // Handle MIDI message based on type
            // This would update internal state for MIDI output
        }
    }

    onPropertyChanged(name, value) {
        if (name === 'values' || name === 'gates') {
            this.parseSequenceData();
        }
    }
}

// Factory function for creating different control node types
export function createControlNode(type, options = {}) {
    return new ControlNode(type, options);
}

export default ControlNode;
