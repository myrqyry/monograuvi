class FeatureExtractor {
    constructor() {
        this.audioData = null;
    }

    processAudioData(audioBuffer) {
        this.audioData = audioBuffer;
        // Override this method in subclasses to implement specific audio processing
    }

    getAudioFeatures() {
        // Override this method in subclasses to return specific audio features
        return {};
    }
}

export default FeatureExtractor;