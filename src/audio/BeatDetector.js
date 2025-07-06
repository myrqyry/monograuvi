import FeatureExtractor from './FeatureExtractor.js';

class BeatDetector extends FeatureExtractor {
    constructor(audioContext, onBeatCallback = null) {
        super(audioContext);
        this.audioContext = audioContext;
        this.threshold = DEFAULT_SENSITIVITY_THRESHOLD; // Sensitivity threshold for beat detection
        this.lastBeatTime = 0;
        this.onBeatCallback = onBeatCallback;
    }

    static DEFAULT_SENSITIVITY_THRESHOLD = 0.1;

    processAudioData(audioData) {
        const currentTime = this.audioContext.currentTime;
        const amplitude = this.calculateAmplitude(audioData);

        if (amplitude > this.threshold && (currentTime - this.lastBeatTime) > BeatDetector.MIN_TIME_BETWEEN_BEATS) {
            this.lastBeatTime = currentTime;
            this.onBeatDetected();
        }
    }

    static MIN_TIME_BETWEEN_BEATS = 0.5;

    calculateAmplitude(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += Math.abs(audioData[i]);
        }
        return sum / audioData.length;
    }

    onBeatDetected() {
        // Trigger any visual or audio response to the beat detection
        if (this.onBeatCallback) {
            this.onBeatCallback();
        } else {
            console.log('Beat detected!');
        }
    }
}

export default BeatDetector;
