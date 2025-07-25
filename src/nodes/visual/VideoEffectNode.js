import BaseVisualNode from './BaseVisualNode.js';

class VideoEffectNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Video Effect', { size: [240, 200], ...options });

        this.setupVideoEffect();
    }

    setupVideoEffect() {
        this.addInput('Video Input', 'video', { description: 'Input video stream' });
        this.addInput('Audio Data', 'array', { description: 'Audio reactive data' });
        this.addOutput('Video Output', 'video', { description: 'Processed video' });

        this.addProperty('effectType', 'chromakey', {
            options: ['chromakey', 'blur', 'pixelate', 'color-replace', 'edge-detect', 'emboss', 'posterize'],
            type: 'enum',
            description: 'Video effect type',
            category: 'Effect'
        });
        this.addProperty('intensity', 1.0, {
            min: 0, max: 2, step: 0.1,
            description: 'Effect intensity',
            category: 'Parameters'
        });
        this.addProperty('keyColor', '#00FF00', {
            type: 'color',
            description: 'Chroma key color',
            category: 'Chroma Key'
        });
        this.addProperty('tolerance', 0.1, {
            min: 0, max: 1, step: 0.01,
            description: 'Color tolerance',
            category: 'Chroma Key'
        });
        this.addProperty('useBackend', true, {
            type: 'boolean',
            description: 'Use Python backend for processing',
            category: 'Processing'
        });
    }

    async onProcess(inputs) {
        return this.processVideoEffect(inputs);
    }

    async processVideoEffect(inputs) {
        const videoInput = inputs['Video Input'];
        const audioData = inputs['Audio Data'] || [];

        if (this.getProperty('useBackend') && videoInput) {
            try {
                const result = await this.callBackendAPI('/api/video/process-effect', {
                    video_input: videoInput,
                    effect_type: this.getProperty('effectType'),
                    intensity: this.getProperty('intensity'),
                    key_color: this.getProperty('keyColor'),
                    tolerance: this.getProperty('tolerance'),
                    audio_data: audioData
                });

                return {
                    'Video Output': result
                };
            } catch (error) {
                console.error(`Error in backend video effect processing: ${error.message}`, error);
                // Fallback to passthrough
                return {
                    'Video Output': videoInput
                };
            }
        } else {
            return {
                'Video Output': videoInput || null
            };
        }
    }

    onPropertyChanged(name, value) {
        if (name === 'effectType') {
            this.reinitializeVisual();
        }
    }
}

export default VideoEffectNode;
