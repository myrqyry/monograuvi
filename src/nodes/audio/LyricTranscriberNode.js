// src/nodes/audio/LyricTranscriberNode.js
import { LiteGraph } from 'litegraph.js';

class LyricTranscriberNode {
    constructor() {
        this.title = "Lyric Transcriber";
        this.description = "Transcribes lyrics from audio using a Whisper model.";
        this.name = "audio/lyric_transcriber"; // Matches the registration in nodeTypeMapping

        // Inputs
        this.addInput("AudioBuffer", "LiteAudio.AudioBuffer");
        this.addInput("Trigger", LiteGraph.EVENT);

        // Outputs
        this.addOutput("Lyrics", "string");
        this.addOutput("Segments", "array"); // Array of {text, start, end}
        this.addOutput("OnProgress", LiteGraph.EVENT); // Outputs { progress_percentage, status }
        this.addOutput("OnComplete", LiteGraph.EVENT); // Outputs { lyrics, segments, status, error? }

        // Properties
        this.properties = {
            modelName: "Xenova/whisper-tiny.en", // Default model
            language: "english",
            task: "transcribe", // 'transcribe' or 'translate'
            status: "Idle",
            progress: 0,
        };

        // Internal state
        this.transcriberPipeline = null; // To cache the pipeline instance
        this.lastModelName = null; // To track if modelName changed
        this.isBusy = false;

        // Widget for manual trigger
        this.addWidget("button", "Transcribe", null, () => {
            if (!this.isBusy) {
                this.onAction("Trigger"); // LiteGraph convention for triggering action
            }
        });

        // Read-only widgets for status and progress
        this.statusWidget = this.addWidget("text", "Status", this.properties.status, null, { readOnly: true });
        this.progressWidget = this.addWidget("number", "Progress", this.properties.progress, null, { readOnly: true, precision: 0, min:0, max:100, step:1 });

        this.size = [300, 220];
    }

    onAdded() {
        console.log(`${this.title}: Node added.`);
        this.updateWidgets();
    }

    onRemoved() {
        console.log(`${this.title}: Node removed.`);
        if (this.transcriberPipeline && typeof this.transcriberPipeline.dispose === 'function') {
            this.transcriberPipeline.dispose();
        }
        this.transcriberPipeline = null;
    }

    updateWidgets() {
        if (this.statusWidget) this.statusWidget.value = this.properties.status;
        if (this.progressWidget) this.progressWidget.value = this.properties.progress;
        // Force LiteGraph to redraw this node's canvas if properties changed
        if (this.graph && this.graph.canvas) {
            this.setDirtyCanvas(true, true);
        }
    }

    onPropertyChanged(name, value) {
        this.properties[name] = value;
        if (name === "status" || name === "progress") {
            this.updateWidgets();
        }
        if (name === "modelName" || name === "language" || name === "task") {
            this.transcriberPipeline = null; // Invalidate cached pipeline
            this.lastModelName = null;
            this.properties.status = "Idle - Model params changed";
            this.properties.progress = 0;
            this.updateWidgets();
            console.log(`${this.title}: Model parameters changed. Transcriber will reload on next run.`);
        }
    }

    async _preprocessAudio(audioBuffer) {
        const targetSampleRate = 16000;
        const inputSampleRate = audioBuffer.sampleRate;

        this.properties.status = "Preprocessing audio...";
        this.properties.progress = 2; // Small initial progress
        this.updateWidgets();
        this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });


        if (inputSampleRate === targetSampleRate && audioBuffer.numberOfChannels === 1) {
            this.properties.status = "Audio format OK.";
            this.updateWidgets();
            return audioBuffer.getChannelData(0).slice();
        }

        this.properties.status = "Resampling audio...";
        this.updateWidgets();

        const offlineCtx = new OfflineAudioContext(1, audioBuffer.duration * targetSampleRate, targetSampleRate);
        const bufferSource = offlineCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(offlineCtx.destination);
        bufferSource.start();

        const resampledBuffer = await offlineCtx.startRendering();
        return resampledBuffer.getChannelData(0).slice();
    }

    async onAction(actionName, param, options) {
        if (actionName !== "Trigger") return; // Only respond to "Trigger" action

        if (this.isBusy) {
            console.warn(`${this.title}: Already processing.`);
            this.triggerSlot(3, { error: "Busy", status: "Busy" });
            return;
        }

        const audioBufferInput = this.getInputData(0);
        if (!audioBufferInput || !(audioBufferInput instanceof AudioBuffer)) {
            this.properties.status = "Error: AudioBuffer missing or invalid.";
            this.updateWidgets();
            console.error(this.properties.status);
            this.triggerSlot(3, { error: this.properties.status, status: this.properties.status });
            return;
        }

        this.isBusy = true;
        this.properties.status = "Starting...";
        this.properties.progress = 0;
        this.updateWidgets();
        this.triggerSlot(2, { progress: 0, status: this.properties.status });

        try {
            const processedAudio = await this._preprocessAudio(audioBufferInput);

            this.properties.status = "Audio preprocessed.";
            this.properties.progress = 5;
            this.updateWidgets();
            this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });

            console.log(`${this.title}: Starting transcription with audio length ${processedAudio.length}...`);
            await this.performTranscription(processedAudio);

        } catch (error) {
            this.properties.status = `Error: ${error.message}`;
            this.properties.progress = 0;
            console.error(`${this.title}: Transcription process failed.`, error);
            this.triggerSlot(3, { error: error.message, status: this.properties.status });
        } finally {
            this.isBusy = false;
            // Final status (Complete or Error) is set within performTranscription or catch block
            this.updateWidgets();
        }
    }

    async performTranscription(audioArray) {
        try {
            this.properties.status = "Initializing model...";
            this.properties.progress = 10;
            this.updateWidgets();
            this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });

            const { pipeline } = await import('@xenova/transformers');

            if (!this.transcriberPipeline || this.lastModelName !== this.properties.modelName) {
                 console.log(`${this.title}: Creating ASR pipeline: ${this.properties.modelName}`);
                 this.transcriberPipeline = await pipeline('automatic-speech-recognition', this.properties.modelName, {
                    progress_callback: (progressInfo) => {
                        if (progressInfo.status === 'progress' && progressInfo.file && progressInfo.file.includes('model')) {
                            const modelLoadProgress = Math.round(progressInfo.progress || 0);
                            this.properties.status = `Loading model: ${modelLoadProgress}%`;
                            this.properties.progress = 10 + Math.round(modelLoadProgress * 0.40); // Scale: 10% to 50%
                            this.updateWidgets();
                            this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });
                        } else if (progressInfo.status === 'ready' && progressInfo.loaded === progressInfo.total) {
                            this.properties.status = "Model ready.";
                            this.properties.progress = 50;
                            this.updateWidgets();
                            this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });
                        } else if (progressInfo.status === 'download' && progressInfo.file) {
                             this.properties.status = `Downloading: ${progressInfo.file.split('/').pop()}`;
                             this.updateWidgets();
                             this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });
                        }
                    }
                });
                this.lastModelName = this.properties.modelName;
            } else {
                this.properties.status = "Using cached model.";
                this.properties.progress = 50;
                this.updateWidgets();
                this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });
            }

            this.properties.status = "Transcribing...";
            this.properties.progress = 55;
            this.updateWidgets();
            this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });

            const output = await this.transcriberPipeline(audioArray, {
                language: this.properties.language,
                task: this.properties.task,
                return_timestamps: "chunks",
            });

            this.properties.progress = 95; // Nearing completion
            this.updateWidgets();
            this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });

            const lyrics = output.text;
            const segments = output.chunks ? output.chunks.map(chunk => ({
                text: chunk.text.trim(),
                start: chunk.timestamp[0],
                end: chunk.timestamp[1],
            })) : [];

            this.setOutputData(0, lyrics);
            this.setOutputData(1, segments);

            this.properties.status = "Complete";
            this.properties.progress = 100;

            this.triggerSlot(2, { progress: 100, status: this.properties.status, final: true });
            this.triggerSlot(3, { lyrics: lyrics, segments: segments, status: this.properties.status });
            console.log(`${this.title}: Transcription complete. Output:`, output);

        } catch (error) {
            this.properties.status = `Transcription Error: ${error.message}`;
            this.properties.progress = 0;
            console.error(`${this.title}: Error during performTranscription.`, error);
            this.triggerSlot(3, { error: error.message, status: this.properties.status });
        } finally {
            this.updateWidgets();
        }
    }
}

export { LyricTranscriberNode };
