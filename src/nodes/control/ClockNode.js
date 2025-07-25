import BaseControlNode from './BaseControlNode.js';

class ClockNode extends BaseControlNode {
    constructor(options = {}) {
        super('Control Clock', { size: [200, 160], ...options });

        this.setupClock();
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

    async onProcess(inputs) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        return this.processClock(deltaTime);
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
}

export default ClockNode;
