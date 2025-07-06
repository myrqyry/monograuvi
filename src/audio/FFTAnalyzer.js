import FeatureExtractor from './FeatureExtractor.js';

class FFTAnalyzer extends FeatureExtractor {
    constructor(audioContext) {
        super(audioContext);
        this.audioContext = audioContext;
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
this.timeDomainData = new Uint8Array(this.analyser.fftSize);
    }

    connect(source) {
        source.connect(this.analyser);
    }

    getFrequencyData() {
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    }

    getTimeDomainData() {
this.analyser.getByteTimeDomainData(this.timeDomainData);
return this.timeDomainData;
    }
}

export default FFTAnalyzer;
