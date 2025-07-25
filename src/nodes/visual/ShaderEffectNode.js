import BaseVisualNode from './BaseVisualNode.js';

class ShaderEffectNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Shader Effect', { size: [240, 200], ...options });

        this.setupShaderEffect();
    }

    setupShaderEffect() {
        this.addInput('Input Texture', 'texture', { description: 'Input texture/image' });
        this.addInput('Time', 'number', { description: 'Animation time parameter' });
        this.addInput('Audio Data', 'array', { description: 'Audio reactive parameters' });
        this.addOutput('Visual', 'visual', { description: 'Shader output' });

        this.addProperty('shaderType', 'fractal', {
            options: ['fractal', 'plasma', 'noise', 'distortion', 'color-shift', 'kaleidoscope', 'tunnel', 'ripple'],
            type: 'enum',
            description: 'Shader effect type',
            category: 'Shader'
        });
        this.addProperty('intensity', 1.0, {
            min: 0, max: 5, step: 0.1,
            description: 'Effect intensity',
            category: 'Parameters'
        });
        this.addProperty('speed', 1.0, {
            min: 0.1, max: 5, step: 0.1,
            description: 'Animation speed',
            category: 'Parameters'
        });
        this.addProperty('scale', 1.0, {
            min: 0.1, max: 10, step: 0.1,
            description: 'Effect scale',
            category: 'Parameters'
        });
        this.addProperty('colorIntensity', 1.0, {
            min: 0, max: 2, step: 0.1,
            description: 'Color saturation',
            category: 'Color'
        });
        this.addProperty('customUniforms', {}, {
            type: 'object',
            description: 'Custom shader uniforms',
            category: 'Advanced'
        });
        this.addProperty('useBackend', false, {
            type: 'boolean',
            description: 'Use backend video processing',
            category: 'Processing'
        });
    }

    async onProcess(inputs) {
        return this.processShaderEffect(inputs);
    }

    async processShaderEffect(inputs) {
        const inputTexture = inputs['Input Texture'];
        const time = inputs.Time || performance.now() * 0.001;
        const audioData = inputs['Audio Data'] || [];

        if (this.getProperty('useBackend')) {
            try {
                const result = await this.callBackendAPI('/api/video/apply-effects', {
                    video_file: inputTexture,
                    effects: [{
                        type: this.getProperty('shaderType'),
                        scale: this.getProperty('scale'),
                        factor: this.getProperty('intensity')
                    }]
                });

                return {
                    Visual: result
                };
            } catch (error) {
                console.error(`Error in backend shader effect processing: ${error.message}`, error);
                // Fallback to frontend processing
                return this.processShaderEffectFrontend(inputs);
            }
        } else {
            return this.processShaderEffectFrontend(inputs);
        }
    }

    processShaderEffectFrontend(inputs) {
        const time = inputs.Time || performance.now() * 0.001;
        const audioData = inputs['Audio Data'] || [];

        return {
            Visual: {
                type: 'shader-effect',
                shaderType: this.getProperty('shaderType'),
                time: time * this.getProperty('speed'),
                audioData,
                intensity: this.getProperty('intensity'),
                scale: this.getProperty('scale'),
                properties: this.getProperties()
            }
        };
    }

    onPropertyChanged(name, value) {
        if (name === 'shaderType') {
            this.reinitializeVisual();
        }
    }
}

export default ShaderEffectNode;
