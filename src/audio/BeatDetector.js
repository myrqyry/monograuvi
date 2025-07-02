import FeatureExtractor from './FeatureExtractor.js';

class BeatDetector extends FeatureExtractor {
    constructor(audioContext) {
        super(audioContext);
        this.audioContext = audioContext;
        this.threshold = 0.1; // Sensitivity threshold for beat detection
        this.lastBeatTime = 0;
    }

    processAudioData(audioData) {
        const currentTime = this.audioContext.currentTime;
        const amplitude = this.calculateAmplitude(audioData);

        if (amplitude > this.threshold && (currentTime - this.lastBeatTime) > 0.5) {
            this.lastBeatTime = currentTime;
            this.onBeatDetected();
        }
    }

    calculateAmplitude(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += Math.abs(audioData[i]);
        }
        return sum / audioData.length;
    }

    onBeatDetected() {
        // Trigger any visual or audio response to the beat detection
        console.log('Beat detected!');
    }
}

export default BeatDetector;