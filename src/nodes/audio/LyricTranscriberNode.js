// src/nodes/audio/LyricTranscriberNode.js
import { LiteGraph } from 'litegraph.js';

// Helper to format time from seconds to MM:SS.ss
function formatTime(seconds) {
    const M = Math.floor(seconds / 60);
    const S = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${M.toString().padStart(2, '0')}:${S.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

class LyricTranscriberNode {
    constructor() {
        this.title = "Lyric Transcriber";
        this.description = "Transcribes lyrics from audio using a Whisper model.";
        this.name = "audio/lyric_transcriber";

        this.addInput("AudioBuffer", "LiteAudio.AudioBuffer");
        this.addInput("Trigger", LiteGraph.EVENT);

        this.addOutput("FullLyricsText", "string");
        this.addOutput("TimedSegments", "array");
        this.addOutput("OnProgress", LiteGraph.EVENT);
        this.addOutput("OnComplete", LiteGraph.EVENT);

        this.properties = {
            modelName: "Xenova/whisper-tiny.en",
            language: "english",
            task: "transcribe",
            status: "Idle",
            progress: 0,
        };

        this.transcriberPipeline = null;
        this.lastModelName = null;
        this.isBusy = false;
        this.editableSegments = [];
        this.segmentWidgetHeight = 0; // Calculated height for the segments area
        this.scrollOffset = 0; // For scrolling segments

        this.addWidget("button", "Transcribe", null, () => {
            if (!this.isBusy) this.onAction("Trigger");
        });
        this.statusWidget = this.addWidget("text", "Status", this.properties.status, null, { readOnly: true });
        this.progressWidget = this.addWidget("number", "Progress", this.properties.progress, null, { readOnly: true, precision: 0, min:0, max:100, step:1 });

        // Placeholder for custom widget area - actual drawing in onDrawForeground
        // We'll manage segment display and interaction there.
        this.size = [320, 280]; // Initial size, may need adjustment
    }

    onAdded() {
        this.updateWidgets();
        this.computeSize(); // Adjust size based on content
    }

    onRemoved() {
        if (this.transcriberPipeline?.dispose) this.transcriberPipeline.dispose();
        this.transcriberPipeline = null;
        this.removeHTMLInputs(); // Clean up any active HTML inputs
    }

    updateWidgets() {
        if (this.statusWidget) this.statusWidget.value = this.properties.status;
        if (this.progressWidget) this.progressWidget.value = this.properties.progress;
        this.setDirtyCanvas(true, true);
    }

    onPropertyChanged(name, value) {
        this.properties[name] = value;
        if (name === "status" || name === "progress") {
            this.updateWidgets();
        }
        if (name === "modelName" || name === "language" || name === "task") {
            this.transcriberPipeline = null;
            this.lastModelName = null; // Ensure the model is reloaded
            this.editableSegments = []; // Clear previous transcription results
            this.properties.status = "Idle - Model params changed";
            this.properties.progress = 0;
            this.updateOutputs(); // Reflect cleared segments in output
            this.updateWidgets(); // Update status/progress display
            this.computeSize();   // Adjust node size as segments are cleared
            console.log(`${this.title}: Model parameters changed to '${name}: ${value}'. Transcriber will reload on next run.`);
        }
    }

    async _preprocessAudio(audioBuffer) {
        // ... (same as before)
        const targetSampleRate = 16000;
        const inputSampleRate = audioBuffer.sampleRate;

        this.properties.status = "Preprocessing audio...";
        this.properties.progress = 2;
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
        // ... (same as before, but ensure computeSize() is called after getting segments)
        if (actionName !== "Trigger") return;

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
        this.editableSegments = []; // Clear previous segments
        this.updateOutputs();
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

            await this.performTranscription(processedAudio);

        } catch (error) {
            this.properties.status = `Error: ${error.message}`;
            this.properties.progress = 0;
            console.error(`${this.title}: Transcription process failed.`, error);
            this.triggerSlot(3, { error: error.message, status: this.properties.status });
        } finally {
            this.isBusy = false;
            this.updateWidgets();
            this.computeSize(); // Recompute size after segments might have been added
        }
    }

    async performTranscription(audioArray) {
        // ... (mostly same, but updates editableSegments and calls updateOutputs)
        try {
            this.properties.status = "Initializing model...";
            this.properties.progress = 10;
            this.updateWidgets();
            this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });

            const { pipeline } = await import('@xenova/transformers');

            if (!this.transcriberPipeline || this.lastModelName !== this.properties.modelName) {
                 this.transcriberPipeline = await pipeline('automatic-speech-recognition', this.properties.modelName, {
                    progress_callback: (p) => this.handleModelProgress(p)
                });
                this.lastModelName = this.properties.modelName;
            } else { // Model cached
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

            this.properties.progress = 95;
            this.updateWidgets();
            this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });

            this.editableSegments = output.chunks ? output.chunks.map(chunk => ({
                id: crypto.randomUUID(),
                text: chunk.text.trim(),
                start: chunk.timestamp[0],
                end: chunk.timestamp[1],
            })) : [];

            this.updateOutputs(); // Update outputs based on new segments

            this.properties.status = "Complete";
            this.properties.progress = 100;

            this.triggerSlot(2, { progress: 100, status: this.properties.status, final: true });
            this.triggerSlot(3, {
                lyrics: this.getOutputData(0),
                segments: this.editableSegments,
                status: this.properties.status
            });
            console.log(`${this.title}: Transcription complete.`);

        } catch (error) {
            this.properties.status = `Transcription Error: ${error.message}`;
            this.properties.progress = 0;
            console.error(`${this.title}: Error during performTranscription.`, error);
            this.triggerSlot(3, { error: error.message, status: this.properties.status });
        } finally {
            this.updateWidgets();
        }
    }

    handleModelProgress(progressInfo) {
        if (progressInfo.status === 'progress' && progressInfo.file?.includes('model')) {
            const modelLoadProgress = Math.round(progressInfo.progress || 0);
            this.properties.status = `Loading model: ${modelLoadProgress}%`;
            this.properties.progress = 10 + Math.round(modelLoadProgress * 0.40);
        } else if (progressInfo.status === 'ready' && progressInfo.loaded === progressInfo.total) {
            this.properties.status = "Model ready.";
            this.properties.progress = 50;
        } else if (progressInfo.status === 'download' && progressInfo.file) {
            this.properties.status = `Downloading: ${progressInfo.file.split('/').pop()}`;
        }
        this.updateWidgets();
        this.triggerSlot(2, { progress: this.properties.progress, status: this.properties.status });
    }

    updateOutputs() {
        const fullLyricsText = this.editableSegments.map(s => s.text).join("\n");
        this.setOutputData(0, fullLyricsText);
        this.setOutputData(1, this.editableSegments);
    }

    // ---- Custom Drawing & Interaction for Segments ----
    getSegmentWidgetsArea() {
        // Calculate area below existing widgets
        let y_offset = 0;
        this.widgets.forEach(w => y_offset += LiteGraph.NODE_WIDGET_HEIGHT + 4); // 4 for padding
        y_offset += 10; // Extra padding before segments list
        return { y: y_offset, height: this.size[1] - y_offset - LiteGraph.NODE_SLOT_HEIGHT }; // available height
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) return;

        const area = this.getSegmentWidgetsArea();
        if (area.height <= 20) return; // Not enough space

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, area.y, this.size[0], area.height);
        ctx.clip(); // Clip to the designated area

        ctx.font = "12px Arial";
        const lineHeight = 18;
        const padding = 5;

        this.segmentRects = []; // Store rects for click detection. Coords relative to segment area start (0,0).

        for (let i = 0; i < this.editableSegments.length; i++) {
            const segment = this.editableSegments[i];
            // y_in_list is the y position of the baseline of this segment within the full, unscrolled list
            const y_in_list_baseline = (i * lineHeight) + (lineHeight / 2) + padding;

            // draw_y is the actual y position on the canvas for this segment's baseline
            const draw_y_baseline = area.y + y_in_list_baseline - this.scrollOffset;

            // Culling: only draw if visible
            if (draw_y_baseline + lineHeight/2 < area.y || draw_y_baseline - lineHeight/2 > area.y + area.height) {
                continue;
            }

            const timeText = `[${formatTime(segment.start)}-${formatTime(segment.end)}]`;

            // Store rects relative to the start of the segment list's drawable area (unscrolled)
            // rect: [x, y_top_of_line, width, height_of_line]
            const timeTextWidth = ctx.measureText(timeText).width;
            this.segmentRects.push({
                id: segment.id, part: 'time',
                rect: [padding, y_in_list_baseline - lineHeight/2, timeTextWidth, lineHeight]
            });

            const segmentTextX = padding + timeTextWidth + 5;
            const segmentTextWidth = this.size[0] - segmentTextX - padding;
            this.segmentRects.push({
                id: segment.id, part: 'text',
                rect: [segmentTextX, y_in_list_baseline - lineHeight/2, segmentTextWidth, lineHeight]
            });

            // Drawing with highlighting for active editing (basic version)
            if (this.editingSegment?.id === segment.id) {
                 ctx.fillStyle = "rgba(255, 255, 100, 0.1)"; // Light yellow highlight for the whole line
                 ctx.fillRect(padding, draw_y_baseline - lineHeight/2, this.size[0] - padding*2, lineHeight);
            }

            ctx.fillStyle = (this.editingSegment?.id === segment.id && this.editingSegment.part === 'time') ? LiteGraph.NODE_TEXT_SELECTED_COLOR : "#AAA"; // Highlight time if editing time
            ctx.fillText(timeText, padding, draw_y_baseline);

            ctx.fillStyle = (this.editingSegment?.id === segment.id && this.editingSegment.part === 'text') ? LiteGraph.NODE_TEXT_SELECTED_COLOR : LiteGraph.NODE_TEXT_COLOR; // Highlight text if editing text
            ctx.fillText(segment.text, segmentTextX, draw_y_baseline, segmentTextWidth);
        }
        ctx.restore();
        this.segmentWidgetHeight = this.editableSegments.length * lineHeight + padding * 2;
    }

    onMouseDown(event, pos, graphcanvas) {
        if (this.flags.collapsed) return false;
        this.removeHTMLInputs();

        const area = this.getSegmentWidgetsArea();
        if (pos[0] < 0 || pos[0] > this.size[0] || pos[1] < area.y || pos[1] > area.y + area.height) {
            return false; // Click outside segments drawable area or node bounds
        }

        // Convert mouse Y from node-local to segment-list-local (scroll-aware)
        const clicked_y_in_list = pos[1] - area.y + this.scrollOffset;

        for (const item of this.segmentRects) {
            const r = item.rect; // r = [x_in_list, y_top_in_list, width, height]
            if (pos[0] >= r[0] && pos[0] <= r[0] + r[2] &&
                clicked_y_in_list >= r[1] && clicked_y_in_list <= r[1] + r[3]) {

                const segment = this.editableSegments.find(s => s.id === item.id);
                if (segment) {
                    console.log(`Clicked segment: ${item.id}, part: ${item.part}`);
                    this.editingSegment = {
                        id: segment.id,
                        part: item.part,
                        originalValue: item.part === 'time' ? {s:segment.start, e:segment.end} : segment.text
                    };
                    this.setDirtyCanvas(true, true); // Redraw for potential highlight
                    // Pass the item.rect (which is relative to segment area start) to createHTMLInput
                    this.createHTMLInput(event, segment, item.part, r, graphcanvas, area.y);
                    return true;
                }
            }
        }
        this.editingSegment = null; // Clicked in segment area but not on any item
        this.setDirtyCanvas(true,true);
        return false;
    }

    onMouseWheel(event, pos, graphcanvas) {
        const area = this.getSegmentWidgetsArea();
        if (pos[1] < area.y || pos[1] > area.y + area.height) return false;

        this.scrollOffset += event.deltaY * 0.2; // Adjust scroll speed as needed
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, Math.max(0, this.segmentWidgetHeight - area.height)));
        this.setDirtyCanvas(true, true);
        return true;
    }

    createHTMLInput(event, segment, part, rect, graphcanvas) {
        this.removeHTMLInputs(); // Ensure only one edit at a time

        const canvas_bounding = graphcanvas.canvas.getBoundingClientRect();
        let x = canvas_bounding.left + (this.pos[0] + rect[0]) * graphcanvas.scale + graphcanvas.offset[0];
        let y = canvas_bounding.top + (this.pos[1] + rect[1] - this.scrollOffset) * graphcanvas.scale + graphcanvas.offset[1]; // Adjust for scroll
        let width = rect[2] * graphcanvas.scale;
        let height = rect[3] * graphcanvas.scale;

        if (part === 'text') {
            const input = document.createElement("input");
            input.type = "text";
            input.value = segment.text;
            input.style.position = "absolute";
            input.style.left = `${x}px`;
            input.style.top = `${y}px`;
            input.style.width = `${width -2}px`; // Small adjustment for borders/padding
            input.style.height = `${height -2}px`;
            input.style.fontSize = `${12 * graphcanvas.scale}px`; // Scale font size
            input.style.border = "1px solid #888";
            input.style.background = "#333"; // Dark background
            input.style.color = "#FFF"; // Light text
            input.style.padding = "0px 2px";
            input.style.boxSizing = "border-box";
            input.onblur = () => this.saveAndRemoveInput(input, segment, 'text');
            input.onkeydown = (e) => { if (e.key === "Enter") input.blur(); else if (e.key === "Escape") { input.value = this.editingSegment.originalValue; input.blur();}};
            document.body.appendChild(input);
            input.focus();
            this.activeInputElement = input;
        } else if (part === 'time') {
            // Create two inputs for start and end time
            const inputStart = document.createElement("input");
            const inputEnd = document.createElement("input");
            const inputs = [inputStart, inputEnd];
            const values = [segment.start, segment.end];
            const originalValues = [this.editingSegment.originalValue.s, this.editingSegment.originalValue.e];

            inputs.forEach((input, index) => {
                input.type = "text"; // Use text for easier parsing/formatting, or number with step
                input.value = values[index].toFixed(2);
                input.style.position = "absolute";
                input.style.left = `${x + (index * (width/2 + 2))}px`;
                input.style.top = `${y}px`;
                input.style.width = `${width/2 - 4}px`;
                input.style.height = `${height - 2}px`;
                input.style.fontSize = `${12 * graphcanvas.scale}px`;
                input.style.border = "1px solid #888";
                input.style.background = "#333";
                input.style.color = "#FFF";
                input.style.padding = "0px 2px";
                input.style.textAlign = "center";
                input.style.boxSizing = "border-box";

                input.onblur = () => this.saveAndRemoveTimeInputs(inputStart, inputEnd, segment);
                input.onkeydown = (e) => {
                    if (e.key === "Enter") { input.blur(); }
                    else if (e.key === "Escape") {
                        inputStart.value = originalValues[0].toFixed(2);
                        inputEnd.value = originalValues[1].toFixed(2);
                        input.blur();
                    }
                };
                document.body.appendChild(input);
            });
            inputStart.focus();
            this.activeInputElement = [inputStart, inputEnd]; // Store as array
        }
        // Append to document.body for reliable overlay
        if (this.activeInputElement) {
            if (Array.isArray(this.activeInputElement)) {
                this.activeInputElement.forEach(inp => document.body.appendChild(inp));
            } else {
                document.body.appendChild(this.activeInputElement);
            }
        }
    }

    saveAndRemoveInput(input, segment, part) {
        if (!this.editingSegment || this.editingSegment.id !== segment.id) return; // Stale call
        segment[part] = input.value; // No validation yet
        this.updateOutputs();
        this.setDirtyCanvas(true, true);
        this.removeHTMLInputs();
        this.editingSegment = null;
    }

    saveAndRemoveTimeInputs(inputStart, inputEnd, segment) {
        if (!this.editingSegment || this.editingSegment.id !== segment.id) return;
        const newStart = parseFloat(inputStart.value);
        const newEnd = parseFloat(inputEnd.value);

        if (!isNaN(newStart) && !isNaN(newEnd) && newEnd >= newStart) {
            segment.start = newStart;
            segment.end = newEnd;
        } else {
            // Revert to original if invalid
            segment.start = this.editingSegment.originalValue.s;
            segment.end = this.editingSegment.originalValue.e;
        }
        this.updateOutputs();
        this.setDirtyCanvas(true, true);
        this.removeHTMLInputs();
        this.editingSegment = null;
    }

    removeHTMLInputs() {
        if (this.activeInputElement) {
            if (Array.isArray(this.activeInputElement)) {
                this.activeInputElement.forEach(inp => inp.parentNode?.removeChild(inp));
            } else {
                this.activeInputElement.parentNode?.removeChild(this.activeInputElement);
            }
            this.activeInputElement = null;
        }
    }

    computeSize(out) {
        const defaultSize = [this.constructor.size?.[0] || 320, this.constructor.size?.[1] || 280];
        let height = 0;
        this.widgets.forEach(w => height += LiteGraph.NODE_WIDGET_HEIGHT + 4);
        height += 10; // Padding

        const segmentLineHeight = 18;
        const minSegmentAreaHeight = segmentLineHeight * 3; // Min height for 3 segments
        const calculatedSegmentHeight = this.editableSegments.length * segmentLineHeight + 10; // + padding

        height += Math.max(minSegmentAreaHeight, calculatedSegmentHeight);
        height += LiteGraph.NODE_SLOT_HEIGHT + 10; // For output slots and padding

        this.size[0] = defaultSize[0];
        this.size[1] = Math.max(defaultSize[1], height);

        if (out) out[1] = this.size[1];
        return this.size;
    }
}

export { LyricTranscriberNode };
