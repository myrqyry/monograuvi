import BaseNode from './BaseNode.js';

class VisualNode extends BaseNode {
    constructor(type = VisualTypes.PARTICLE_SYSTEM, options = {}) {
        super(`Visual ${type}`, { 
            color: '#9B59B6', 
            size: [240, 200],
            ...options 
        });
        
        this.visualType = type;
        this.canvas = null;
        this.context = null;
        this.animationId = null;
        this.lastFrameTime = 0;
        this.visualState = {};
        
        this.setupVisualNode();
    }

    setupVisualNode() {
        const setupFunction = visualRegistry[this.visualType]?.setup;
        if (setupFunction) {
            setupFunction.call(this);
        } else {
            console.warn(`No setup function found for visual type: ${this.visualType}`);
        }
    }

    setupParticleSystem() {
        this.addInput('Trigger', 'boolean', { description: 'Particle emission trigger' });
        this.addInput('Force', 'number', { description: 'Particle force multiplier' });
        this.addInput('Color', 'color', { description: 'Particle color override' });
        this.addInput('Audio Data', 'array', { description: 'Audio frequency data' });
        this.addOutput('Visual', 'visual', { description: 'Rendered particle system' });
        
        this.addProperty('particleCount', 500, { 
            min: 1, max: 5000, step: 1,
            description: 'Maximum number of particles',
            category: 'Particles'
        });
        this.addProperty('emissionRate', 10, { 
            min: 1, max: 100, step: 1,
            description: 'Particles emitted per frame',
            category: 'Particles'
        });
        this.addProperty('particleLife', 60, { 
            min: 1, max: 300, step: 1,
            description: 'Particle lifetime in frames',
            category: 'Particles'
        });
        this.addProperty('startSize', 2, { 
            min: 0.1, max: 20, step: 0.1,
            description: 'Initial particle size',
            category: 'Appearance'
        });
        this.addProperty('endSize', 0, { 
            min: 0, max: 20, step: 0.1,
            description: 'Final particle size',
            category: 'Appearance'
        });
        this.addProperty('velocityRange', 5, { 
            min: 0.1, max: 50, step: 0.1,
            description: 'Random velocity range',
            category: 'Motion'
        });
        this.addProperty('gravity', 0.1, { 
            min: -2, max: 2, step: 0.01,
            description: 'Gravity force',
            category: 'Physics'
        });
        this.addProperty('audioReactive', true, { 
            type: 'boolean',
            description: 'React to audio input',
            category: 'Audio'
        });
        this.addProperty('blendMode', 'normal', {
            options: ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'color-dodge', 'color-burn'],
            type: 'enum',
            description: 'Particle blend mode',
            category: 'Appearance'
        });
        this.addProperty('colorStart', '#FF6B35', { 
            type: 'color',
            description: 'Starting particle color',
            category: 'Appearance'
        });
        this.addProperty('colorEnd', '#F7931E', { 
            type: 'color',
            description: 'Ending particle color',
            category: 'Appearance'
        });
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

    setupGeometryRenderer() {
        this.addInput('Audio Data', 'array', { description: 'Audio reactive data' });
        this.addInput('Scale', 'number', { description: 'Geometry scale modifier' });
        this.addInput('Rotation', 'number', { description: 'Rotation speed modifier' });
        this.addOutput('Visual', 'visual', { description: 'Rendered geometry' });
        
        this.addProperty('geometryType', 'cube', {
            options: ['cube', 'sphere', 'torus', 'cylinder', 'icosahedron', 'dodecahedron', 'custom'],
            type: 'enum',
            description: '3D geometry type',
            category: 'Geometry'
        });
        this.addProperty('wireframe', false, { 
            type: 'boolean',
            description: 'Render as wireframe',
            category: 'Rendering'
        });
        this.addProperty('material', 'standard', {
            options: ['standard', 'phong', 'lambert', 'basic', 'toon', 'physical'],
            type: 'enum',
            description: 'Material type',
            category: 'Rendering'
        });
        this.addProperty('rotationX', 0.01, { 
            min: -1, max: 1, step: 0.001,
            description: 'X-axis rotation speed',
            category: 'Animation'
        });
        this.addProperty('rotationY', 0.01, { 
            min: -1, max: 1, step: 0.001,
            description: 'Y-axis rotation speed',
            category: 'Animation'
        });
        this.addProperty('rotationZ', 0.01, { 
            min: -1, max: 1, step: 0.001,
            description: 'Z-axis rotation speed',
            category: 'Animation'
        });
        this.addProperty('audioReactiveScale', true, { 
            type: 'boolean',
            description: 'Scale with audio amplitude',
            category: 'Audio'
        });
        this.addProperty('audioReactiveColor', true, { 
            type: 'boolean',
            description: 'Color changes with audio',
            category: 'Audio'
        });
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

    setupKaleidoscope() {
        this.addInput('Input', 'visual', { description: 'Input visual to kaleidoscope' });
        this.addInput('Segments', 'number', { description: 'Number of segments' });
        this.addOutput('Visual', 'visual', { description: 'Kaleidoscope effect' });
        
        this.addProperty('segments', 6, { 
            min: 2, max: 32, step: 1,
            description: 'Number of mirror segments',
            category: 'Kaleidoscope'
        });
        this.addProperty('rotation', 0.01, { 
            min: -1, max: 1, step: 0.001,
            description: 'Rotation speed',
            category: 'Animation'
        });
        this.addProperty('scale', 1.0, { 
            min: 0.1, max: 5, step: 0.1,
            description: 'Scale factor',
            category: 'Transform'
        });
        this.addProperty('centerX', 0.5, { 
            min: 0, max: 1, step: 0.01,
            description: 'Center X position (normalized)',
            category: 'Transform'
        });
        this.addProperty('centerY', 0.5, { 
            min: 0, max: 1, step: 0.01,
            description: 'Center Y position (normalized)',
            category: 'Transform'
        });
    }

    setupMandala() {
        this.addInput('Audio Data', 'array', { description: 'Audio reactive data' });
        this.addInput('Complexity', 'number', { description: 'Pattern complexity' });
        this.addOutput('Visual', 'visual', { description: 'Mandala pattern' });
        
        this.addProperty('complexity', 8, { 
            min: 2, max: 64, step: 1,
            description: 'Pattern complexity',
            category: 'Pattern'
        });
        this.addProperty('layers', 3, { 
            min: 1, max: 10, step: 1,
            description: 'Number of layers',
            category: 'Pattern'
        });
        this.addProperty('symmetry', 8, { 
            min: 2, max: 32, step: 1,
            description: 'Radial symmetry',
            category: 'Pattern'
        });
        this.addProperty('rotation', 0.005, { 
            min: -0.1, max: 0.1, step: 0.001,
            description: 'Rotation speed',
            category: 'Animation'
        });
        this.addProperty('colorPalette', 'warm', {
            options: ['warm', 'cool', 'rainbow', 'monochrome', 'custom'],
            type: 'enum',
            description: 'Color palette',
            category: 'Appearance'
        });
        this.addProperty('audioReactive', true, { 
            type: 'boolean',
            description: 'React to audio',
            category: 'Audio'
        });
    }

    setupFlowField() {
        this.addInput('Audio Data', 'array', { description: 'Audio reactive data' });
        this.addInput('Flow Force', 'number', { description: 'Flow field strength' });
        this.addOutput('Visual', 'visual', { description: 'Flow field visualization' });
        
        this.addProperty('particleCount', 1000, { 
            min: 100, max: 10000, step: 100,
            description: 'Number of flow particles',
            category: 'Particles'
        });
        this.addProperty('noiseScale', 0.01, { 
            min: 0.001, max: 0.1, step: 0.001,
            description: 'Noise field scale',
            category: 'Flow'
        });
        this.addProperty('flowStrength', 0.5, { 
            min: 0.1, max: 5, step: 0.1,
            description: 'Flow field strength',
            category: 'Flow'
        });
        this.addProperty('trailLength', 50, { 
            min: 1, max: 200, step: 1,
            description: 'Particle trail length',
            category: 'Appearance'
        });
        this.addProperty('colorMode', 'velocity', {
            options: ['velocity', 'direction', 'lifetime', 'audio-reactive'],
            type: 'enum',
            description: 'Particle coloring method',
            category: 'Appearance'
        });
    }

    async onProcess(inputs) {
        const processFunction = visualRegistry[this.visualType]?.process;
        if (processFunction) {
            return processFunction.call(this, inputs);
        } else {
            console.warn(`No process function found for visual type: ${this.visualType}`);
            return this.getErrorOutput();
        }
    }

    processParticleSystem(inputs) {
        const trigger = inputs.Trigger || false;
        const force = inputs.Force || 1.0;
        const audioData = inputs['Audio Data'] || [];
        
        // Update particle system state
        if (!this.visualState.particles) {
            this.visualState.particles = [];
        }
        
        // Audio reactive parameters
        const audioAmplitude = audioData.length > 0 ? 
            audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length : 0;
        
        const dynamicEmissionRate = this.getProperty('audioReactive') ? 
            this.getProperty('emissionRate') * (1 + audioAmplitude * 2) : 
            this.getProperty('emissionRate');
        
        return {
            Visual: {
                type: 'particle-system',
                particleCount: this.getProperty('particleCount'),
                emissionRate: dynamicEmissionRate,
                audioReactive: this.getProperty('audioReactive'),
                audioAmplitude,
                force,
                trigger,
                properties: this.getProperties()
            }
        };
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

    async processShaderEffect(inputs) {
        const inputTexture = inputs['Input Texture'];
        const time = inputs.Time || performance.now() * 0.001;
        const audioData = inputs['Audio Data'] || [];
        
        if (this.getProperty('useBackend')) {
            try {
                const result = await this.callBackendAPI('/api/video/shader-effect', {
                    input_texture: inputTexture,
                    shader_type: this.getProperty('shaderType'),
                    time,
                    audio_data: audioData,
                    intensity: this.getProperty('intensity'),
                    speed: this.getProperty('speed'),
                    scale: this.getProperty('scale')
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

    processGeometryRenderer(inputs) {
        const audioData = inputs['Audio Data'] || [];
        const scale = inputs.Scale || 1.0;
        const rotation = inputs.Rotation || 0.0;
        
        return {
            Visual: {
                type: 'geometry-renderer',
                geometryType: this.getProperty('geometryType'),
                audioData,
                scale,
                rotation,
                wireframe: this.getProperty('wireframe'),
                material: this.getProperty('material'),
                properties: this.getProperties()
            }
        };
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

    processKaleidoscope(inputs) {
        const inputVisual = inputs.Input;
        const segments = inputs.Segments || this.getProperty('segments');
        
        return {
            Visual: {
                type: 'kaleidoscope',
                inputVisual,
                segments,
                rotation: this.getProperty('rotation'),
                scale: this.getProperty('scale'),
                properties: this.getProperties()
            }
        };
    }

    processMandala(inputs) {
        const audioData = inputs['Audio Data'] || [];
        const complexity = inputs.Complexity || this.getProperty('complexity');
        
        return {
            Visual: {
                type: 'mandala',
                audioData,
                complexity,
                layers: this.getProperty('layers'),
                symmetry: this.getProperty('symmetry'),
                properties: this.getProperties()
            }
        };
    }

    processFlowField(inputs) {
        const audioData = inputs['Audio Data'] || [];
        const flowForce = inputs['Flow Force'] || 1.0;
        
        return {
            Visual: {
                type: 'flow-field',
                audioData,
                flowForce,
                particleCount: this.getProperty('particleCount'),
                noiseScale: this.getProperty('noiseScale'),
                properties: this.getProperties()
            }
        };
    }

    onPropertyChanged(name, value) {
        // Handle property changes that might require reinitialization
        if (['shaderType', 'geometryType', 'effectType'].includes(name)) {
            this.reinitializeVisual();
        }
    }

    reinitializeVisual() {
        // Clear current visual state and reinitialize
        this.visualState = {};
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        super.destroy();
        this.reinitializeVisual();
        if (this.canvas) {
            this.canvas = null;
            this.context = null;
        }
    }
}

export const VisualTypes = {
    PARTICLE_SYSTEM: 'particle-system',
    WAVEFORM: 'waveform',
    SPECTRUM_VISUALIZER: 'spectrum-visualizer',
    SHADER_EFFECT: 'shader-effect',
    GEOMETRY_RENDERER: 'geometry-renderer',
    TEXT_ANIMATOR: 'text-animator',
    VIDEO_EFFECT: 'video-effect',
    KALEIDOSCOPE: 'kaleidoscope',
    MANDALA: 'mandala',
    FLOW_FIELD: 'flow-field',
};

const visualRegistry = {
    [VisualTypes.PARTICLE_SYSTEM]: {
        setup: VisualNode.prototype.setupParticleSystem,
        process: VisualNode.prototype.processParticleSystem,
    },
    [VisualTypes.WAVEFORM]: {
        setup: VisualNode.prototype.setupWaveform,
        process: VisualNode.prototype.processWaveform,
    },
    [VisualTypes.SPECTRUM_VISUALIZER]: {
        setup: VisualNode.prototype.setupSpectrumVisualizer,
        process: VisualNode.prototype.processSpectrumVisualizer,
    },
    [VisualTypes.SHADER_EFFECT]: {
        setup: VisualNode.prototype.setupShaderEffect,
        process: VisualNode.prototype.processShaderEffect,
    },
    [VisualTypes.GEOMETRY_RENDERER]: {
        setup: VisualNode.prototype.setupGeometryRenderer,
        process: VisualNode.prototype.processGeometryRenderer,
    },
    [VisualTypes.TEXT_ANIMATOR]: {
        setup: VisualNode.prototype.setupTextAnimator,
        process: VisualNode.prototype.processTextAnimator,
    },
    [VisualTypes.VIDEO_EFFECT]: {
        setup: VisualNode.prototype.setupVideoEffect,
        process: VisualNode.prototype.processVideoEffect,
    },
    [VisualTypes.KALEIDOSCOPE]: {
        setup: VisualNode.prototype.setupKaleidoscope,
        process: VisualNode.prototype.processKaleidoscope,
    },
    [VisualTypes.MANDALA]: {
        setup: VisualNode.prototype.setupMandala,
        process: VisualNode.prototype.processMandala,
    },
    [VisualTypes.FLOW_FIELD]: {
        setup: VisualNode.prototype.setupFlowField,
        process: VisualNode.prototype.processFlowField,
    },
};

// Factory function for creating different visual node types
export function createVisualNode(type, options = {}) {
    return new VisualNode(type, options);
}

export default VisualNode;
