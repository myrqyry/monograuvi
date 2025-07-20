import { MyBaseReteNode } from './MyBaseReteNode';
import { ClassicPreset } from 'rete';

// Helper to format time from seconds to MM:SS.ss
function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00.00';
    const M = Math.floor(seconds / 60);
    const S = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${M.toString().padStart(2, '0')}:${S.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export class LyricTranscriberReteNode extends MyBaseReteNode {
    constructor(initialCustomData = {}) {
        super('Lyric Transcriber', { customData: initialCustomData });

        this.isBusy = false;
        this.transcriberPipeline = null;
        this.lastModelName = null;
        this.editableSegments = [];

        // --- Inputs ---
        const audioBufferInput = new ClassicPreset.Input(this.sockets.audioBuffer, 'AudioBuffer');
        this.addInput('audioBuffer', audioBufferInput);

        const triggerInput = new ClassicPreset.Input(this.sockets.trigger, 'Trigger');
        this.addInput('trigger', triggerInput);

        // --- Outputs ---
        const fullLyricsOutput = new ClassicPreset.Output(this.sockets.string, 'FullLyricsText');
        this.addOutput('fullLyricsText', fullLyricsOutput);

        const segmentsOutput = new ClassicPreset.Output(this.sockets.array, 'TimedSegments');
        this.addOutput('timedSegments', segmentsOutput);

        const onProgressOutput = new ClassicPreset.Output(this.sockets.trigger, 'OnProgress');
        this.addOutput('onProgress', onProgressOutput);

        const onCompleteOutput = new ClassicPreset.Output(this.sockets.trigger, 'OnComplete');
        this.addOutput('onComplete', onCompleteOutput);

        // --- Controls ---
        this.addControlWithLabel('modelName', 'string', 'Model', { initial: 'Xenova/whisper-tiny.en' });
        this.addControlWithLabel('language', 'string', 'Language', { initial: 'english' });
        this.addControlWithLabel('task', 'enum', 'Task', { initial: 'transcribe', options: ['transcribe', 'translate'] });
        this.addControlWithLabel('status', 'string', 'Status', { initial: 'Idle', readonly: true });
        this.addControlWithLabel('progress', 'number', 'Progress', { initial: 0, readonly: true, min: 0, max: 100 });

        // Custom data for React component to render segments
        this.customData.segments = [];
        this.customData.onSegmentChange = this.handleSegmentChange.bind(this);
    }

    handleSegmentChange(updatedSegment) {
        const index = this.editableSegments.findIndex(s => s.id === updatedSegment.id);
        if (index !== -1) {
            this.editableSegments[index] = { ...this.editableSegments[index], ...updatedSegment };
            this.setPropertyAndRecord('segments', [...this.editableSegments], this.historyRef);
            this.updateOutputs();
        }
    }

    updateOutputs() {
        const fullLyricsText = this.editableSegments.map(s => s.text).join("\\n");
        // This method is for Rete engine, it doesn't directly set output values on sockets
        // The `data` method will return the values for the engine.
        // We just need to ensure the source data (editableSegments) is correct.
    }

    async _preprocessAudio(audioBuffer) {
        // ... (Ported from LiteGraph version)
        this.setPropertyAndRecord('status', 'Preprocessing...', this.historyRef);
        this.setPropertyAndRecord('progress', 2, this.historyRef);
        const targetSampleRate = 16000;
        if (audioBuffer.sampleRate === targetSampleRate && audioBuffer.numberOfChannels === 1) {
            return audioBuffer.getChannelData(0).slice();
        }
        const offlineCtx = new OfflineAudioContext(1, audioBuffer.duration * targetSampleRate, targetSampleRate);
        const bufferSource = offlineCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(offlineCtx.destination);
        const resampled = await offlineCtx.startRendering();
        return resampled.getChannelData(0).slice();
    }

    handleModelProgress(progressInfo) {
        // ... (Ported from LiteGraph version)
        if (progressInfo.status === 'progress' && progressInfo.file?.includes('model')) {
            const modelLoadProgress = Math.round(progressInfo.progress || 0);
            this.setPropertyAndRecord('status', `Loading: ${modelLoadProgress}%`, this.historyRef);
            this.setPropertyAndRecord('progress', 10 + Math.round(modelLoadProgress * 0.40), this.historyRef);
        } else if (progressInfo.status === 'ready') {
            this.setPropertyAndRecord('status', 'Model ready.', this.historyRef);
            this.setPropertyAndRecord('progress', 50, this.historyRef);
        } else if (progressInfo.status === 'download') {
            this.setPropertyAndRecord('status', `Downloading: ${progressInfo.file.split('/').pop()}`, this.historyRef);
        }
    }

    async performTranscription(audioArray) {
        // ... (Ported logic)
        try {
            const { pipeline } = await import('@xenova/transformers');
            const modelName = this.getProperty('modelName');

            if (!this.transcriberPipeline || this.lastModelName !== modelName) {
                this.setPropertyAndRecord('status', 'Initializing model...', this.historyRef);
                this.setPropertyAndRecord('progress', 10, this.historyRef);

                // Only download the model if it hasn't been downloaded before
                if (!window.monograuvi_models) {
                    window.monograuvi_models = {};
                }
                if (!window.monograuvi_models[modelName]) {
                    this.transcriberPipeline = await pipeline('automatic-speech-recognition', modelName, {
                        progress_callback: (p) => this.handleModelProgress(p)
                    });
                    window.monograuvi_models[modelName] = this.transcriberPipeline;
                } else {
                    this.transcriberPipeline = window.monograuvi_models[modelName];
                }

                this.lastModelName = modelName;
            }

            this.setPropertyAndRecord('status', 'Transcribing...', this.historyRef);
            this.setPropertyAndRecord('progress', 55, this.historyRef);

            const output = await this.transcriberPipeline(audioArray, {
                language: this.getProperty('language'),
                task: this.getProperty('task'),
                return_timestamps: "chunks",
            });

            this.editableSegments = output.chunks.map(c => ({ id: crypto.randomUUID(), text: c.text.trim(), start: c.timestamp[0], end: c.timestamp[1] }));
            this.setPropertyAndRecord('segments', [...this.editableSegments], this.historyRef);
            this.updateOutputs();

            this.setPropertyAndRecord('status', 'Complete', this.historyRef);
            this.setPropertyAndRecord('progress', 100, this.historyRef);

        } catch (e) {
            this.setPropertyAndRecord('status', `Error: ${e.message}`, this.historyRef);
            this.setPropertyAndRecord('progress', 0, this.historyRef);
            console.error('Transcription failed', e);
        } finally {
            this.isBusy = false;
            if (this.areaPlugin) this.areaPlugin.update('node', this.id);
        }
    }

    async data(inputs) {
        // This is the dataflow method for Rete
        if (this.isBusy) { // Prevent execution while busy
             return {
                fullLyricsText: this.editableSegments.map(s => s.text).join("\\n"),
                timedSegments: this.editableSegments
             };
        }

        // Trigger execution if trigger input is connected and has a signal
        if (inputs.trigger && inputs.trigger.length > 0) {
            const audioBuffer = inputs.audioBuffer ? inputs.audioBuffer[0] : null;
            if (audioBuffer && !this.isBusy) {
                this.isBusy = true;
                const processedAudio = await this._preprocessAudio(audioBuffer);
                this.performTranscription(processedAudio); // This runs async, data method will return before it's done
            }
        }

        // Always provide the current state of the lyrics on the outputs
        return {
            fullLyricsText: this.editableSegments.map(s => s.text).join("\\n"),
            timedSegments: this.editableSegments
        };
    }
}
