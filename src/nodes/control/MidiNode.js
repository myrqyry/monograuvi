import BaseControlNode from './BaseControlNode.js';

class MidiNode extends BaseControlNode {
    constructor(options = {}) {
        super('Control MIDI', { size: [200, 160], ...options });

        this.setupMIDI();
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

    async onProcess(inputs) {
        return this.processMIDI();
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
}

export default MidiNode;
