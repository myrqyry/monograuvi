import { LGraphNode } from 'litegraph.js';

class PlayheadNode extends LGraphNode {
    constructor() {
        super();
        this.title = "Playhead";
        this.size = [180, 80]; // Adjusted size

        // Outputs
        this.addOutput("onTick", LGraphNode.EVENT); // Event triggered on each time update
        this.addOutput("time", "number"); // Current playhead time in seconds
        this.addOutput("beat", LGraphNode.EVENT); // Event triggered on a detected beat (future enhancement)
        this.addOutput("bpm", "number"); // Current BPM (future enhancement)

        this.properties = {
            currentTime: 0,
            currentBPM: 120, // Default BPM
            beatsActive: false, // For future beat detection integration
        };

        // Internal state
        this._lastUpdateTime = 0;
    }

    // This method will be called externally to update the playhead's time
    updateTime(time) {
        if (time !== this.properties.currentTime) {
            this.properties.currentTime = time;
            this._lastUpdateTime = performance.now();
            this.triggerSlot(0, time); // Trigger onTick with current time as data
            this.setOutputData(1, time); // Set time output
        }
    }

    // This method could be called if we integrate beat detection directly or via an input
    triggerBeat() {
        if (this.properties.beatsActive) {
            this.triggerSlot(2, this.properties.currentTime); // Trigger beat event with current time
        }
    }

    setBPM(bpm) {
        this.properties.currentBPM = bpm;
        this.setOutputData(3, bpm);
    }

    // LiteGraph's onExecute is typically called when inputs change or periodically.
    // For a playhead, time updates will likely come from an external source (Timeline component).
    onExecute() {
        // Output current time if it has changed
        this.setOutputData(1, this.properties.currentTime);
        this.setOutputData(3, this.properties.currentBPM); // Output current BPM
    }

    // We can add a custom method to be called by the Timeline component
    // This is an alternative to directly manipulating properties or calling triggerSlot from outside
    onTimelineUpdate(newTime) {
        this.updateTime(newTime);
    }
}

// Registration will be handled in registerNodes.js
// LiteGraph.registerNodeType("global/playhead", PlayheadNode);

export default PlayheadNode;
