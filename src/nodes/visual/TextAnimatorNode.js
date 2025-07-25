import BaseVisualNode from './BaseVisualNode.js';

class TextAnimatorNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Text Animator', { size: [240, 200], ...options });

        this.setupTextAnimator();
    }

    setupTextAnimator() {
        this.addInput('Text', 'string', { description: 'Text to display' });
        this.addInput('Audio Data', 'array', { description: 'Audio reactive data' });
        this.addOutput('Visual', 'visual', { description: 'Animated text' });

        this.addProperty('text', 'Monograuvi', {
            type: 'string',
            description: 'Default text content',
            category: 'Content'
        });
        this.addProperty('fontSize', 48, {
            min: 8, max: 200, step: 1,
            description: 'Font size in pixels',
            category: 'Typography'
        });
        this.addProperty('fontFamily', 'Arial', {
            options: ['Arial', 'Helvetica', 'Times', 'Courier', 'Georgia', 'Verdana', 'Impact'],
            type: 'enum',
            description: 'Font family',
            category: 'Typography'
        });
        this.addProperty('fontWeight', 'normal', {
            options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
            type: 'enum',
            description: 'Font weight',
            category: 'Typography'
        });
        this.addProperty('textColor', '#FFFFFF', {
            type: 'color',
            description: 'Text color',
            category: 'Appearance'
        });
        this.addProperty('strokeColor', '#000000', {
            type: 'color',
            description: 'Text stroke color',
            category: 'Appearance'
        });
        this.addProperty('strokeWidth', 0, {
            min: 0, max: 10, step: 0.5,
            description: 'Text stroke width',
            category: 'Appearance'
        });
        this.addProperty('animation', 'none', {
            options: ['none', 'bounce', 'wave', 'pulse', 'rotate', 'fade', 'typewriter', 'glitch'],
            type: 'enum',
            description: 'Text animation type',
            category: 'Animation'
        });
        this.addProperty('animationSpeed', 1.0, {
            min: 0.1, max: 5, step: 0.1,
            description: 'Animation speed multiplier',
            category: 'Animation'
        });
    }

    async onProcess(inputs) {
        return this.processTextAnimator(inputs);
    }

    processTextAnimator(inputs) {
        const text = inputs.Text || this.getProperty('text');
        const audioData = inputs['Audio Data'] || [];

        return {
            Visual: {
                type: 'text-animator',
                text,
                audioData,
                fontSize: this.getProperty('fontSize'),
                fontFamily: this.getProperty('fontFamily'),
                animation: this.getProperty('animation'),
                properties: this.getProperties()
            }
        };
    }
}

export default TextAnimatorNode;
