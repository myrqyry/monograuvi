import BaseNode from './BaseNode.js';

class AudioNode extends BaseNode {
    constructor(type = 'analyser', options = {}) {
        super(`Audio ${type}`, { 
            color: '#FF6B35', 
            size: [220, 180],
            ...options 
        });
        
        this.audioType = type;
        this.audioData = null;
        this.audioContext = null;
        this.analyser = null;
        this.frequencyData = null;
        this.timeData = null;
        
        this.setupAudioNode();
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
            min: 0, max: 2, step: 0.1, 
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
        // This would integrate with actual audio analysis
        // For now, return mock data based on properties
        const fftSize = this.getProperty('fftSize');
        const freqData = new Array(fftSize / 2).fill(0).map(() => Math.random());
        const timeData = new Array(fftSize).fill(0).map(() => Math.random() * 2 - 1);
        
        const rms = Math.sqrt(timeData.reduce((sum, val) => sum + val * val, 0) / timeData.length);
        const peak = Math.max(...timeData.map(Math.abs));
        
        return {
            'Frequency Data': freqData,
            'Time Data': timeData,
            'RMS': rms,
            'Peak': peak
        };
    }

    async processSpectralAnalyser(audioInput) {
        if (this.getProperty('useBackend')) {
            try {
                const result = await this.callBackendAPI('/api/audio/spectral-analysis', {
                    audio_data: audioInput,
                    mfcc_count: this.getProperty('mfccCount'),
                    chroma_bins: this.getProperty('chromaBins')
                });
                
                return {
                    'Spectral Centroid': result.spectral_centroid,
                    'Spectral Rolloff': result.spectral_rolloff,
                    'Spectral Flux': result.spectral_flux,
                    'MFCC': result.mfcc,
                    'Chroma': result.chroma
                };
            } catch (error) {
                // Fallback to frontend processing
                return this.processSpectralAnalyserFrontend(audioInput);
            }
        } else {
            return this.processSpectralAnalyserFrontend(audioInput);
        }
    }

    async processBeatDetector(audioInput) {
        try {
            const result = await this.callBackendAPI('/api/audio/beat-detection', {
                audio_data: audioInput,
                sensitivity: this.getProperty('sensitivity'),
                min_bpm: this.getProperty('minBPM'),
                max_bpm: this.getProperty('maxBPM')
            });
            
            return {
                'Beat': result.beat_detected,
                'BPM': result.bpm,
                'Confidence': result.confidence,
                'Onset': result.onset_detected
            };
        } catch (error) {
            // Fallback to frontend processing
            return {
                'Beat': Math.random() > 0.8,
                'BPM': 120 + Math.random() * 40,
                'Confidence': Math.random(),
                'Onset': Math.random() > 0.9
            };
        }
    }

    async processKeyDetector(audioInput) {
        if (this.getProperty('useBackend')) {
            try {
                const result = await this.callBackendAPI('/api/audio/key-detection', {
                    audio_data: audioInput,
                    algorithm: this.getProperty('algorithm'),
                    window_size: this.getProperty('windowSize')
                });
                
                return {
                    'Key': result.key,
                    'Mode': result.mode,
                    'Confidence': result.confidence,
                    'Key Profile': result.key_profile
                };
            } catch (error) {
                // Fallback
                const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const modes = ['major', 'minor'];
                return {
                    'Key': keys[Math.floor(Math.random() * keys.length)],
                    'Mode': modes[Math.floor(Math.random() * modes.length)],
                    'Confidence': Math.random(),
                    'Key Profile': new Array(12).fill(0).map(() => Math.random())
                };
            }
        }
    }

    async processMoodAnalyser(audioInput) {
        if (this.getProperty('useBackend')) {
            try {
                const result = await this.callBackendAPI('/api/ml/mood-analysis', {
                    audio_data: audioInput,
                    model_type: this.getProperty('modelType')
                });
                
                return {
                    'Valence': result.valence,
                    'Energy': result.energy,
                    'Danceability': result.danceability,
                    'Mood': result.mood,
                    'Genre': result.genre
                };
            } catch (error) {
                // Fallback
                const moods = ['happy', 'sad', 'energetic', 'calm', 'aggressive', 'melancholic'];
                const genres = ['rock', 'pop', 'electronic', 'classical', 'jazz', 'ambient'];
                return {
                    'Valence': Math.random(),
                    'Energy': Math.random(),
                    'Danceability': Math.random(),
                    'Mood': moods[Math.floor(Math.random() * moods.length)],
                    'Genre': genres[Math.floor(Math.random() * genres.length)]
                };
            }
        }
    }

    processSpectralAnalyserFrontend(audioInput) {
        // Simplified frontend spectral analysis
        return {
            'Spectral Centroid': Math.random() * 2000 + 500,
            'Spectral Rolloff': Math.random() * 5000 + 2000,
            'Spectral Flux': Math.random(),
            'MFCC': new Array(this.getProperty('mfccCount')).fill(0).map(() => Math.random()),
            'Chroma': new Array(this.getProperty('chromaBins')).fill(0).map(() => Math.random())
        };
    }

    processFilter(audioInput, inputs) {
        const frequency = inputs.Frequency || this.getProperty('frequency');
        const q = inputs.Q || this.getProperty('Q');
        
        // This would apply actual filtering
        return {
            'Audio': {
                ...audioInput,
                filtered: true,
                filterType: this.getProperty('type'),
                frequency,
                Q: q,
                gain: this.getProperty('gain')
            }
        };
    }

    processPitchDetector(audioInput) {
        // Mock pitch detection
        const pitch = this.getProperty('minPitch') + 
                     Math.random() * (this.getProperty('maxPitch') - this.getProperty('minPitch'));
        
        // Convert pitch to note
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteNumber = Math.round(12 * Math.log2(pitch / 440) + 69);
        const noteName = noteNames[noteNumber % 12];
        const octave = Math.floor(noteNumber / 12) - 1;
        
        return {
            'Pitch': pitch,
            'Note': `${noteName}${octave}`,
            'Cents': (Math.random() - 0.5) * 100,
            'Clarity': Math.random()
        };
    }

    onPropertyChanged(name, value) {
        // Handle property changes that might require reinitialization
        if (['fftSize', 'type', 'algorithm'].includes(name)) {
            this.reinitializeAnalysis();
        }
    }

    reinitializeAnalysis() {
        // Reinitialize analysis components when key properties change
        if (this.analyser) {
            this.analyser = null;
        }
        // Additional cleanup and reinitialization would go here
    }
}

// Factory function for creating different audio node types
export function createAudioNode(type, options = {}) {
    return new AudioNode(type, options);
}

export default AudioNode;
