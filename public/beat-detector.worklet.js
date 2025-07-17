// beat-detector.worklet.js

class BeatDetectorProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.threshold = 0.1; // Default sensitivity
        this.lastBeatTime = 0;
        this.minTimeBetweenBeats = 0.5;

        this.port.onmessage = (event) => {
            if (event.data.threshold) {
                this.threshold = event.data.threshold;
            }
        };
    }

    static get parameterDescriptors() {
        return [{ name: 'threshold', defaultValue: 0.1, minValue: 0, maxValue: 1 }];
    }

    calculateAmplitude(inputChannelData) {
        let sum = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
            sum += Math.abs(inputChannelData[i]);
        }
        return sum / inputChannelData.length;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length === 0) {
            return true;
        }

        const inputChannelData = input[0];
        const amplitude = this.calculateAmplitude(inputChannelData);
        const threshold = parameters.threshold[0];

        if (amplitude > threshold && (currentTime - this.lastBeatTime) > this.minTimeBetweenBeats) {
            this.lastBeatTime = currentTime;
            this.port.postMessage({ beat: true, timestamp: currentTime });
        }

        return true;
    }
}

registerProcessor('beat-detector-processor', BeatDetectorProcessor);
