import BaseNode from './BaseNode';

class AudioNode extends BaseNode {
    constructor(audioFeatureExtractor) {
        super();
        this.audioFeatureExtractor = audioFeatureExtractor;
        this.audioData = null;
    }

    processAudio(audioBuffer) {
        this.audioData = this.audioFeatureExtractor.extractFeatures(audioBuffer);
        this.updateConnections();
    }

    updateConnections() {
        // Logic to update connected visual nodes based on the extracted audio data
        this.connections.forEach(connection => {
            connection.update(this.audioData);
        });
    }
}

export default AudioNode;