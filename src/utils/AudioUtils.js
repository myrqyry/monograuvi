const sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();

export function loadAudioFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            sharedAudioContext.decodeAudioData(event.target.result, (buffer) => {
                resolve(buffer);
            }, (error) => {
                reject(error);
            });
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
}

export function getSharedAudioContext() {
    return sharedAudioContext;
}


export function createGainNode(audioContext) {
    return audioContext.createGain();
}

export function connectNodes(sourceNode, destinationNode) {
    sourceNode.connect(destinationNode);
}

export function disconnectNodes(sourceNode, destinationNode) {
    sourceNode.disconnect(destinationNode);
}

export function createAnalyserNode(audioContext) {
    return audioContext.createAnalyser();
}

export function getFrequencyData(analyserNode, dataArray) {
    analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
}

export function createFrequencyDataArray(analyserNode) {
    return new Uint8Array(analyserNode.frequencyBinCount);
}

export function getTimeDomainData(analyserNode, dataArray) {
    analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
}

export function createTimeDomainDataArray(analyserNode) {
    return new Uint8Array(analyserNode.fftSize);
}
