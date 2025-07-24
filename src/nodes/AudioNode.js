import BaseNode from './BaseNode.js';
import { AUDIO_NODE_CONFIG } from '../constants/audio';
import logger from '../utils/logger';

class AudioNode extends BaseNode {
    constructor(type = 'analyser', options = {}) {
        super(`Audio ${type}`, { 
            color: '#FF6B35', 
            size: [220, 180],
            ...options 
        });
        
        this.audioType = type;
        this.audioData = null;
        this.audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = null;
        this.frequencyData = null;
        this.timeData = null;
        this.lastError = null; // Track last error for debugging
        
        this.setupAudioNode();
    }

    // Enhanced backend API call with proper error propagation
    async callBackendAPIWithFallback(endpoint, data, fallbackType, fallbackConfig = {}) {
        try {
            const result = await this.callBackendAPI(endpoint, data);
            this.lastError = null;
            this.set_error(null); // Clear error message on success
            return { success: true, data: result };
        } catch (error) {
            this.lastError = error;
            const errorMessage = `Backend API error for ${fallbackType}: ${error.message || 'Unknown error'}`;
            logger.error(`Backend API error for ${endpoint}:`, error.message || error);

            // Propagate a user-friendly error
            this.set_error(errorMessage);

            // Return a failure indicator
            return { success: false, error: errorMessage };
        }
    }

    setupAudioNode() {
        switch (this.audioType) {
            case 'source':
                this.setupSourceNode();
                break;
            case 'analyser':
                this.setupAnalyserNode();
                break;
            case 'filter':
                this.setupFilterNode();
                break;
            case 'beat-detector':
                this.setupBeatDetectorNode();
                break;
            case 'spectral-analyser':
                this.setupSpectralAnalyserNode();
                break;
            case 'pitch-detector':
                this.setupPitchDetectorNode();
                break;
            case 'key-detector':
                this.setupKeyDetectorNode();
                break;
            case 'mood-analyser':
                this.setupMoodAnalyserNode();
                break;
        }
    }

    setupSourceNode() {
        this.addOutput('Audio', 'audio', { description: 'Raw audio output' });
        this.addOutput('Volume', 'number', { description: 'Current volume level' });
        
        this.addProperty('volume', 1.0, { 
            min: AUDIO_NODE_CONFIG.volume.min, max: AUDIO_NODE_CONFIG.volume.max, step: AUDIO_NODE_CONFIG.volume.step,
            description: 'Master volume control',
            category: 'Audio'
        });
        this.addProperty('mute', false, { 
            type: 'boolean', 
            description: 'Mute audio output',
            category: 'Audio'
        });
        this.addProperty('loop', false, { 
            type: 'boolean', 
            description: 'Loop audio playback',
            category: 'Playback'
        });
        this.addProperty('playbackRate', 1.0, { 
            min: 0.25, max: 4.0, step: 0.1,
            description: 'Playback speed multiplier',
            category: 'Playback'
        });
    }

    setupAnalyserNode() {
        this.addInput('Audio', 'audio', { required: true });
        this.addOutput('Frequency Data', 'array', { description: 'FFT frequency analysis' });
        this.addOutput('Time Data', 'array', { description: 'Raw time domain data' });
        this.addOutput('RMS', 'number', { description: 'Root Mean Square amplitude' });
        this.addOutput('Peak', 'number', { description: 'Peak amplitude' });
        
        this.addProperty('fftSize', 2048, { 
            options: [256, 512, 1024, 2048, 4096, 8192, 16384],
            type: 'enum',
            description: 'FFT analysis window size',
            category: 'Analysis'
        });
        this.addProperty('smoothingTimeConstant', 0.8, { 
            min: 0, max: 1, step: 0.1,
            description: 'Frequency data smoothing',
            category: 'Analysis'
        });
        this.addProperty('frequencyRange', 'full', {
            options: ['full', 'sub-bass', 'bass', 'low-mid', 'mid', 'high-mid', 'presence', 'brilliance'],
            type: 'enum',
            description: 'Frequency range to analyze',
            category: 'Analysis'
        });
    }

    setupFilterNode() {
        this.addInput('Audio', 'audio', { required: true });
        this.addInput('Frequency', 'number', { description: 'Cutoff frequency modulation' });
        this.addInput('Q', 'number', { description: 'Filter resonance modulation' });
        this.addOutput('Audio', 'audio', { description: 'Filtered audio output' });
        
        this.addProperty('type', 'lowpass', {
            options: ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'],
            type: 'enum',
            description: 'Filter type',
            category: 'Filter'
        });
        this.addProperty('frequency', 440, { 
            min: 20, max: 20000, step: 1,
            description: 'Cutoff frequency (Hz)',
            category: 'Filter'
        });
        this.addProperty('Q', 1, { 
            min: 0.1, max: 30, step: 0.1,
            description: 'Filter resonance/bandwidth',
            category: 'Filter'
        });
        this.addProperty('gain', 0, { 
            min: -40, max: 40, step: 0.5,
            description: 'Filter gain (dB)',
            category: 'Filter'
        });
    }

    setupBeatDetectorNode() {
        this.addInput('Audio', 'audio', { required: true });
        this.addOutput('Beat', 'boolean', { description: 'Beat detected trigger' });
        this.addOutput('BPM', 'number', { description: 'Estimated beats per minute' });
        this.addOutput('Confidence', 'number', { description: 'Beat detection confidence' });
        this.addOutput('Onset', 'boolean', { description: 'Audio onset detection' });
        
        this.addProperty('sensitivity', 0.5, { 
            min: 0, max: 1, step: 0.1,
            description: 'Beat detection sensitivity',
            category: 'Detection'
        });
        this.addProperty('minBPM', 60, { 
            min: 30, max: 200, step: 1,
            description: 'Minimum BPM to detect',
            category: 'Detection'
        });
        this.addProperty('maxBPM', 180, { 
            min: 80, max: 300, step: 1,
            description: 'Maximum BPM to detect',
            category: 'Detection'
        });
        this.addProperty('adaptiveThreshold', true, { 
            type: 'boolean',
            description: 'Use adaptive threshold',
            category: 'Detection'
        });
    }

    setupSpectralAnalyserNode() {
        this.addInput('Audio', 'audio', { required: true });
        this.addOutput('Spectral Centroid', 'number', { description: 'Brightness measure' });
        this.addOutput('Spectral Rolloff', 'number', { description: 'High frequency energy' });
        this.addOutput('Spectral Flux', 'number', { description: 'Change in frequency content' });
        this.addOutput('MFCC', 'array', { description: 'Mel-frequency cepstral coefficients' });
        this.addOutput('Chroma', 'array', { description: 'Chromagram features' });
        
        this.addProperty('mfccCount', 13, { 
            min: 1, max: 40, step: 1,
            description: 'Number of MFCC coefficients',
            category: 'Analysis'
        });
        this.addProperty('chromaBins', 12, { 
            min: 12, max: 36, step: 1,
            description: 'Number of chroma bins',
            category: 'Analysis'
        });
        this.addProperty('useBackend', true, { 
            type: 'boolean',
            description: 'Use Python backend for analysis',
            category: 'Processing'
        });
    }

    setupPitchDetectorNode() {
        this.addInput('Audio', 'audio', { required: true });
        this.addOutput('Pitch', 'number', { description: 'Fundamental frequency (Hz)' });
        this.addOutput('Note', 'string', { description: 'Musical note name' });
        this.addOutput('Cents', 'number', { description: 'Pitch deviation in cents' });
        this.addOutput('Clarity', 'number', { description: 'Pitch detection clarity' });
        
        this.addProperty('algorithm', 'autocorrelation', {
            options: ['autocorrelation', 'yin', 'fft', 'hps'],
            type: 'enum',
            description: 'Pitch detection algorithm',
            category: 'Analysis'
        });
        this.addProperty('minPitch', 80, { 
            min: 20, max: 400, step: 1,
            description: 'Minimum pitch to detect (Hz)',
            category: 'Analysis'
        });
        this.addProperty('maxPitch', 2000, { 
            min: 800, max: 8000, step: 1,
            description: 'Maximum pitch to detect (Hz)',
            category: 'Analysis'
        });
    }

    setupKeyDetectorNode() {
        this.addInput('Audio', 'audio', { required: true });
        this.addOutput('Key', 'string', { description: 'Detected musical key' });
        this.addOutput('Mode', 'string', { description: 'Major or minor mode' });
        this.addOutput('Confidence', 'number', { description: 'Key detection confidence' });
        this.addOutput('Key Profile', 'array', { description: 'Chromagram key profile' });
        
        this.addProperty('algorithm', 'krumhansl', {
            options: ['krumhansl', 'temperley', 'shaath', 'edma'],
            type: 'enum',
            description: 'Key detection algorithm',
            category: 'Analysis'
        });
        this.addProperty('windowSize', 4096, { 
            options: [1024, 2048, 4096, 8192],
            type: 'enum',
            description: 'Analysis window size',
            category: 'Analysis'
        });
        this.addProperty('useBackend', true, { 
            type: 'boolean',
            description: 'Use Python backend for analysis',
            category: 'Processing'
        });
    }

    setupMoodAnalyserNode() {
        this.addInput('Audio', 'audio', { required: true });
        this.addOutput('Valence', 'number', { description: 'Musical positivity (0-1)' });
        this.addOutput('Energy', 'number', { description: 'Musical energy (0-1)' });
        this.addOutput('Danceability', 'number', { description: 'How danceable (0-1)' });
        this.addOutput('Mood', 'string', { description: 'Detected mood category' });
        this.addOutput('Genre', 'string', { description: 'Predicted genre' });
        
        this.addProperty('modelType', 'default', {
            options: ['default', 'detailed', 'minimal'],
            type: 'enum',
            description: 'ML model complexity',
            category: 'Analysis'
        });
        this.addProperty('updateInterval', 1000, { 
            min: 100, max: 5000, step: 100,
            description: 'Analysis update interval (ms)',
            category: 'Performance'
        });
        this.addProperty('useBackend', true, { 
            type: 'boolean',
            description: 'Use Python ML backend',
            category: 'Processing'
        });
    }

    async onProcess(inputs) {
        const audioInput = inputs.Audio;
        if (!audioInput && this.audioType !== 'source') {
            return this.getErrorOutput();
        }

        switch (this.audioType) {
            case 'source':
                return this.processSource();
            case 'analyser':
                return this.processAnalyser(audioInput);
            case 'filter':
                return this.processFilter(audioInput, inputs);
            case 'beat-detector':
                return this.processBeatDetector(audioInput);
            case 'spectral-analyser':
                return this.processSpectralAnalyser(audioInput);
            case 'pitch-detector':
                return this.processPitchDetector(audioInput);
            case 'key-detector':
                return this.processKeyDetector(audioInput);
            case 'mood-analyser':
                return this.processMoodAnalyser(audioInput);
            default:
                return this.getErrorOutput();
        }
    }

    processSource() {
        const volume = this.getProperty('mute') ? 0 : this.getProperty('volume');
        return {
            'Audio': { type: 'audio', volume, rate: this.getProperty('playbackRate') },
            'Volume': volume
        };
    }

    processAnalyser(audioInput) {
        if (!this.analyser) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.getProperty('fftSize');
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeData = new Uint8Array(this.analyser.fftSize);
        }

        if (audioInput && audioInput.connect) {
            audioInput.connect(this.analyser);
        }

        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeData);

        const rms = Math.sqrt(
            this.timeData.reduce((sum, val) => sum + Math.pow(val / 128 - 1, 2), 0) / this.timeData.length
        );
        const peak = Math.max(...this.timeData.map(val => Math.abs(val / 128 - 1)));

        return {
            'Frequency Data': this.frequencyData,
            'Time Data': this.timeData,
            'RMS': rms,
            'Peak': peak
        };
    }

    /**
     * Process spectral analysis using backend API or frontend fallback
     * Extracts features like spectral centroid, rolloff, flux, MFCC, and chroma
     * @param {Object} audioInput - Audio data to analyze
     * @returns {Object} Spectral analysis results
     */
    async processSpectralAnalyser(audioInput) {
        if (this.getProperty('useBackend')) {
            const API_ENDPOINTS = {
                SPECTRAL_ANALYSIS: '/api/audio/spectral-analysis',
            };

            const result = await this.callBackendAPIWithFallback(
                API_ENDPOINTS.SPECTRAL_ANALYSIS,
                {
                    audio_data: audioInput,
                    mfcc_count: this.getProperty('mfccCount'),
                    chroma_bins: this.getProperty('chromaBins')
                },
                'spectral'
            );
            
            if (result.success) {
                return {
                    'Spectral Centroid': result.data.spectral_centroid,
                    'Spectral Rolloff': result.data.spectral_rolloff,
                    'Spectral Flux': result.data.spectral_flux,
                    'MFCC': result.data.mfcc,
                    'Chroma': result.data.chroma
                };
            } else {
                return this.getErrorOutput();
            }
        } else {
            return this.processSpectralAnalyserFrontend(audioInput);
        }
    }

    async processBeatDetector(audioInput) {
        const API_ENDPOINTS = {
            BEAT_DETECTION: '/api/audio/beat-detection',
        };

        const result = await this.callBackendAPIWithFallback(
            API_ENDPOINTS.BEAT_DETECTION,
            {
                audio_data: audioInput,
                sensitivity: this.getProperty('sensitivity'),
                min_bpm: this.getProperty('minBPM'),
                max_bpm: this.getProperty('maxBPM')
            },
            'beat'
        );
        
        if (result.success) {
            return {
                'Beat': result.data.beat_detected,
                'BPM': result.data.bpm,
                'Confidence': result.data.confidence,
                'Onset': result.data.onset_detected
            };
        } else {
            return this.getErrorOutput();
        }
    }

    async processKeyDetector(audioInput) {
        if (this.getProperty('useBackend')) {
            const API_ENDPOINTS = {
                KEY_DETECTION: '/api/audio/key-detection',
            };

            const result = await this.callBackendAPIWithFallback(
                API_ENDPOINTS.KEY_DETECTION,
                {
                    audio_data: audioInput,
                    algorithm: this.getProperty('algorithm'),
                    window_size: this.getProperty('windowSize')
                },
                'key'
            );
            
            if (result.success) {
                return {
                    'Key': result.data.key,
                    'Mode': result.data.mode,
                    'Confidence': result.data.confidence,
                    'Key Profile': result.data.key_profile
                };
            } else {
                // On failure, return an empty or error-indicating output
                return this.getErrorOutput();
            }
        } else {
            // Frontend fallback (or could be disabled)
            return this.getErrorOutput({ message: "Frontend processing not available" });
        }
    }

    /**
     * Process mood analysis using ML backend
     * Analyzes audio to detect mood, energy, valence, and genre
     * @param {Object} audioInput - Audio data to analyze
     * @returns {Object} Mood analysis results including valence, energy, danceability
     */
    async processMoodAnalyser(audioInput) {
        if (this.getProperty('useBackend')) {
            const API_ENDPOINTS = {
                MOOD_ANALYSIS: '/api/ml/mood-analysis',
            };

            const result = await this.callBackendAPIWithFallback(
                API_ENDPOINTS.MOOD_ANALYSIS,
                {
                    audio_data: audioInput,
                    model_type: this.getProperty('modelType')
                },
                'mood'
            );
            
            if (result.success) {
                return {
                    'Valence': result.data.valence,
                    'Energy': result.data.energy,
                    'Danceability': result.data.danceability,
                    'Mood': result.data.mood,
                    'Genre': result.data.genre
                };
            } else {
                // On failure, return an empty or error-indicating output
                return this.getErrorOutput();
            }
        } else {
            // Frontend fallback (or could be disabled)
            return this.getErrorOutput({ message: "Frontend processing not available" });
        }
    }

    processSpectralAnalyserFrontend(audioInput) {
        if (!this.analyser) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.getProperty('fftSize');
            this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
        }

        if (audioInput && audioInput.connect) {
            audioInput.connect(this.analyser);
        }

        this.analyser.getFloatFrequencyData(this.frequencyData);

        const spectralCentroid = this.frequencyData.reduce((sum, value, index) => {
            return sum + (value * index);
        }, 0) / this.frequencyData.reduce((sum, value) => sum + value, 0);

        const spectralRolloff = this.frequencyData.findIndex((value, index, array) => {
            const cumulativeSum = array.slice(0, index + 1).reduce((sum, val) => sum + val, 0);
            return cumulativeSum >= 0.85 * array.reduce((sum, val) => sum + val, 0);
        });

        const spectralFlux = this.frequencyData.reduce((sum, value, index, array) => {
            if (index === 0) return sum;
            return sum + Math.pow(value - array[index - 1], 2);
        }, 0);

        const mfcc = new Array(this.getProperty('mfccCount')).fill(0).map((_, i) => {
            return Math.log(1 + i) * Math.random(); // Placeholder for actual MFCC calculation
        });

        const chroma = new Array(this.getProperty('chromaBins')).fill(0).map((_, i) => {
            return Math.sin(i) * Math.random(); // Placeholder for actual Chroma calculation
        });

        return {
            'Spectral Centroid': spectralCentroid,
            'Spectral Rolloff': spectralRolloff,
            'Spectral Flux': spectralFlux,
            'MFCC': mfcc,
            'Chroma': chroma
        };
    }

    processFilter(audioInput, inputs) {
        if (!this.filterNode) {
            this.filterNode = this.audioContext.createBiquadFilter();
        }

        this.filterNode.type = this.getProperty('type');
        this.filterNode.frequency.value = inputs.Frequency || this.getProperty('frequency');
        this.filterNode.Q.value = inputs.Q || this.getProperty('Q');
        this.filterNode.gain.value = this.getProperty('gain');

        if (audioInput && audioInput.connect) {
            audioInput.connect(this.filterNode);
        }

        return {
            'Audio': this.filterNode
        };
    }

    // Utility method to convert frequency to musical note
    frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        
        if (frequency > 0) {
            const h = Math.round(12 * Math.log2(frequency / C0));
            const octave = Math.floor(h / 12);
            const n = h % 12;
            const cents = Math.round(1200 * Math.log2(frequency / (C0 * Math.pow(2, h / 12))));
            
            return {
                note: noteNames[n] + octave,
                cents: cents,
                noteNumber: h
            };
        }
        
        return { note: 'N/A', cents: 0, noteNumber: 0 };
    }

    processPitchDetector(audioInput) {
        if (!this.pitchDetectorNode) {
            this.pitchDetectorNode = this.audioContext.createAnalyser();
            this.pitchDetectorNode.fftSize = 2048;
            this.frequencyData = new Float32Array(this.pitchDetectorNode.frequencyBinCount);
        }

        if (audioInput && audioInput.connect) {
            audioInput.connect(this.pitchDetectorNode);
        }

        this.pitchDetectorNode.getFloatFrequencyData(this.frequencyData);

        const maxAmplitudeIndex = this.frequencyData.reduce((maxIndex, value, index, array) => {
            return value > array[maxIndex] ? index : maxIndex;
        }, 0);

        const sampleRate = this.audioContext.sampleRate;
        const pitch = (sampleRate / this.pitchDetectorNode.fftSize) * maxAmplitudeIndex;

        const noteInfo = this.frequencyToNote(pitch);

        return {
            'Pitch': pitch,
            'Note': noteInfo.note,
            'Cents': noteInfo.cents,
            'Clarity': Math.random() // Placeholder for clarity calculation
        };
    }

    onPropertyChanged(name, value) {
        // Validate property values
        if (name === 'fftSize' && ![256, 512, 1024, 2048, 4096, 8192, 16384].includes(value)) {
            logger.warn(`Invalid fftSize value: ${value}, using default 2048`);
            if (this.getProperty('fftSize') !== 2048) {
                this.setProperty('fftSize', 2048);
            }
            return;
        }
        
        if (name === 'minBPM' && (value < 30 || value > 200)) {
            logger.warn(`Invalid minBPM value: ${value}, resetting to default 60`);
            if (this.getProperty('minBPM') !== 60) {
                this.setProperty('minBPM', 60);
            }
            return;
        }
        
        if (name === 'maxBPM' && (value < 80 || value > 300)) {
            logger.warn(`Invalid maxBPM value: ${value}, resetting to default 180`);
            if (this.getProperty('maxBPM') !== 180) {
                this.setProperty('maxBPM', 180);
            }
            return;
        }
        
        // Handle property changes that might require reinitialization
        if (['fftSize', 'type', 'algorithm', 'windowSize'].includes(name)) {
            this.reinitializeAnalysis();
        }
    }

    reinitializeAnalysis() {
        // Reinitialize analysis components when key properties change
        logger.info(`Reinitializing ${this.audioType} analysis due to property change`);
        
        if (this.analyser) {
            try {
                this.analyser.disconnect();
            } catch (error) {
                logger.warn('Error disconnecting analyser:', error);
            }
            this.analyser = null;
        }
        
        // Reset data arrays
        this.frequencyData = null;
        this.timeData = null;
        this.lastError = null;
    }
}

// Factory function for creating different audio node types
export function createAudioNode(type, options = {}) {
    return new AudioNode(type, options);
}

export default AudioNode;
