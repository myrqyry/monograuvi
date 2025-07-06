import FeatureExtractor from './FeatureExtractor.js';

class PitchDetector extends FeatureExtractor {
    constructor(audioContext) {
        super(audioContext);
        this.audioContext = audioContext;
        this.pitch = null;
    }

    analyze(audioBuffer) {
        if (!(audioBuffer instanceof AudioBuffer)) {
            throw new Error("Invalid input: audioBuffer must be an instance of AudioBuffer.");
        }
        this.pitch = this.detectPitch(audioBuffer);
    }

    detectPitch(audioBuffer) {
        if (!(audioBuffer instanceof AudioBuffer)) {
            throw new Error("Invalid input: audioBuffer must be an instance of AudioBuffer.");
        }
        const sampleRate = audioBuffer.sampleRate;
        const audioData = audioBuffer.getChannelData(0); // Use the first channel
        const size = audioData.length;

        // Apply a windowing function (Hann window)
        const windowedData = audioData.map((sample, index) => 
            sample * 0.5 * (1 - Math.cos((2 * Math.PI * index) / (size - 1)))
        );

        // Perform autocorrelation
        const autocorrelation = new Array(size).fill(0);
        for (let lag = 0; lag < size; lag++) {
            for (let i = 0; i < size - lag; i++) {
                autocorrelation[lag] += windowedData[i] * windowedData[i + lag];
            }
        }

        // Find the lag with the highest peak after the first zero crossing
        let peakLag = -1;
        let maxCorrelation = 0;
        for (let lag = 1; lag < size; lag++) {
            if (autocorrelation[lag] > maxCorrelation) {
                maxCorrelation = autocorrelation[lag];
                peakLag = lag;
            }
        }

        // Calculate pitch
        if (peakLag > 0) {
            return sampleRate / peakLag;
        } else {
            return null; // No pitch detected
        }
    }

    getPitch() {
        return this.pitch;
    }
}

export default PitchDetector;
