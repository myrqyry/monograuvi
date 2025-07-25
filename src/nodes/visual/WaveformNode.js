import BaseVisualNode from './BaseVisualNode.js';

class WaveformNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Waveform', { size: [240, 200], ...options });

        this.setupWaveform();
    }

    setupWaveform() {
        this.addInput('Audio Data', 'array', { required: true, description: 'Time domain audio data' });
        this.addInput('Amplitude', 'number', { description: 'Waveform amplitude multiplier' });
        this.addOutput('Visual', 'visual', { description: 'Rendered waveform' });

        this.addProperty('strokeWidth', 2, {
            min: 0.5, max: 10, step: 0.5,
            description: 'Waveform line thickness',
            category: 'Appearance'
        });
        this.addProperty('strokeColor', '#00D9FF', {
            type: 'color',
            description: 'Waveform color',
            category: 'Appearance'
        });
        this.addProperty('fillWaveform', false, {
            type: 'boolean',
            description: 'Fill waveform area',
            category: 'Appearance'
        });
        this.addProperty('waveformStyle', 'linear', {
            options: ['linear', 'curved', 'stepped', 'circular'],
            type: 'enum',
            description: 'Waveform rendering style',
            category: 'Style'
        });
        this.addProperty('mirrorMode', 'none', {
            options: ['none', 'horizontal', 'vertical', 'both'],
            type: 'enum',
            description: 'Waveform mirroring',
            category: 'Style'
        });
        this.addProperty('smoothing', 0.1, {
            min: 0, max: 1, step: 0.1,
            description: 'Waveform smoothing factor',
            category: 'Processing'
        });
    }

    async onProcess(inputs) {
        return this.processWaveform(inputs);
    }

    processWaveform(inputs) {
        const audioData = inputs['Audio Data'] || [];
        const amplitude = inputs.Amplitude || 1.0;

        return {
            Visual: {
                type: 'waveform',
                audioData,
                amplitude,
                style: this.getProperty('waveformStyle'),
                strokeWidth: this.getProperty('strokeWidth'),
                strokeColor: this.getProperty('strokeColor'),
                properties: this.getProperties()
            }
        };
    }
}

export default WaveformNode;
