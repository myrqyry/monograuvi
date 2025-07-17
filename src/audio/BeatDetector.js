// Filename: src/audio/BeatDetector.js
import FeatureExtractor from './FeatureExtractor.js';

class BeatDetector extends FeatureExtractor {
    constructor(audioContext, onBeatCallback = null) {
        super(audioContext);
        this.audioContext = audioContext;
        this.onBeatCallback = onBeatCallback;
        this.workletNode = null;

        // Bind methods
        this.handleWorkletMessage = this.handleWorkletMessage.bind(this);
    }

    static async create(audioContext, onBeatCallback = null) {
        const detector = new BeatDetector(audioContext, onBeatCallback);
        try {
            // Path must be relative to the root of the web server
            await audioContext.audioWorklet.addModule('/beat-detector.worklet.js');
            detector.workletNode = new AudioWorkletNode(audioContext, 'beat-detector-processor');
            detector.workletNode.port.onmessage = detector.handleWorkletMessage;
            console.log('BeatDetector AudioWorklet created and registered successfully.');
            return detector;
        } catch (error) {
            console.error('Error creating BeatDetector worklet:', error);
            throw error; // re-throw to allow caller to handle it
        }
    }

    connect(sourceNode) {
        if (this.workletNode) {
            sourceNode.connect(this.workletNode);
        } else {
            console.error('BeatDetector worklet node not initialized. Cannot connect.');
        }
    }

    disconnect(sourceNode) {
        if (this.workletNode) {
            sourceNode.disconnect(this.workletNode);
        }
    }

    handleWorkletMessage(event) {
        if (event.data.beat) {
            this.onBeatDetected(event.data.timestamp);
        }
    }

    onBeatDetected(timestamp) {
        if (this.onBeatCallback) {
            this.onBeatCallback(timestamp);
        } else {
            console.log(`Beat detected at: ${timestamp}`);
        }
    }

    setThreshold(threshold) {
        if (this.workletNode) {
            const thresholdParam = this.workletNode.parameters.get('threshold');
            if (thresholdParam) {
                // Use setValueAtTime for sample-accurate changes
                thresholdParam.setValueAtTime(threshold, this.audioContext.currentTime);
            } else {
                 // Fallback for direct message passing if parameter is not found
                this.workletNode.port.postMessage({ threshold });
            }
        }
    }

    // This class no longer processes audio directly.
    // The processAudioData, calculateAmplitude methods are now in the worklet.
    // The FeatureExtractor base class might need to be re-evaluated if it's no longer a fit.
}

export default BeatDetector;
