export function loadAudioFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(event.target.result, (buffer) => {
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

export function getAudioContext() {
    return new (window.AudioContext || window.webkitAudioContext)();
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

export function getFrequencyData(analyserNode) {
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
}

export function getTimeDomainData(analyserNode) {
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
}