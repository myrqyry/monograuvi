import BaseVisualNode from './BaseVisualNode.js';

class SpectrumVisualizerNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Spectrum Visualizer', { size: [240, 200], ...options });

        this.setupSpectrumVisualizer();
    }

    setupSpectrumVisualizer() {
        this.addInput('Frequency Data', 'array', { required: true, description: 'FFT frequency data' });
        this.addInput('Peak Data', 'array', { description: 'Peak frequency data' });
        this.addOutput('Visual', 'visual', { description: 'Rendered spectrum' });

        this.addProperty('barCount', 64, {
            min: 8, max: 512, step: 1,
            description: 'Number of frequency bars',
            category: 'Display'
        });
        this.addProperty('barWidth', 8, {
            min: 1, max: 50, step: 1,
            description: 'Width of each bar',
            category: 'Display'
        });
        this.addProperty('barSpacing', 2, {
            min: 0, max: 20, step: 1,
            description: 'Space between bars',
            category: 'Display'
        });
        this.addProperty('amplification', 1.5, {
            min: 0.1, max: 10, step: 0.1,
            description: 'Amplitude multiplier',
            category: 'Processing'
        });
        this.addProperty('smoothingFactor', 0.7, {
            min: 0, max: 1, step: 0.1,
            description: 'Bar height smoothing',
            category: 'Processing'
        });
        this.addProperty('logScale', true, {
            type: 'boolean',
            description: 'Use logarithmic frequency scale',
            category: 'Processing'
        });
        this.addProperty('colorMode', 'gradient', {
            options: ['solid', 'gradient', 'frequency-based', 'amplitude-based'],
            type: 'enum',
            description: 'Coloring method',
            category: 'Appearance'
        });
        this.addProperty('gradientStart', '#FF0080', {
            type: 'color',
            description: 'Gradient start color',
            category: 'Appearance'
        });
        this.addProperty('gradientEnd', '#00FFFF', {
            type: 'color',
            description: 'Gradient end color',
            category: 'Appearance'
        });
        this.addProperty('renderStyle', 'bars', {
            options: ['bars', 'lines', 'dots', 'filled-curve', 'mountain'],
            type: 'enum',
            description: 'Visualization style',
            category: 'Style'
        });
    }

    async onProcess(inputs) {
        return this.processSpectrumVisualizer(inputs);
    }

    processSpectrumVisualizer(inputs) {
        const frequencyData = inputs['Frequency Data'] || [];
        const peakData = inputs['Peak Data'] || [];

        return {
            Visual: {
                type: 'spectrum-visualizer',
                frequencyData,
                peakData,
                barCount: this.getProperty('barCount'),
                colorMode: this.getProperty('colorMode'),
                renderStyle: this.getProperty('renderStyle'),
                properties: this.getProperties()
            }
        };
    }
}

export default SpectrumVisualizerNode;
