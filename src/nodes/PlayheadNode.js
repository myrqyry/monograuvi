import BaseNode from './BaseNode.js';
import useStore from '../store'; // To get global playheadTime

class PlayheadNode extends BaseNode {
    constructor(options = {}) {
        super("Playhead", {
            color: "#A0A0A0", // Distinct color for global nodes
            bgColor: "#333333",
            size: [180, 100], // Adjusted size for BaseNode properties
            ...options
        });

        // Outputs
        // LGraphNode.EVENT type might need specific handling in the generic wrapper if we keep it.
        // For BaseNode, we can define output types as 'event' or 'data'.
        this.addOutput("onTick", "event", { description: "Event triggered on each time update" });
        this.addOutput("time", "number", { description: "Current playhead time in seconds" });
        this.addOutput("beat", "event", { description: "Event triggered on a detected beat" });
        this.addOutput("bpm", "number", { description: "Current BPM" });

        // Properties managed by BaseNode
        // currentTime will be sourced from the global store, not a direct property for user editing.
        // currentBPM could be a property if it's globally set or an input if driven by another node.
        this.addProperty("currentBPM", 120, {
            type: "number",
            description: "Beats Per Minute (global or default)",
            category: "Timing"
        });
        this.addProperty("beatsActive", false, {
            type: "boolean",
            description: "Enable beat event triggering",
            category: "Timing"
        });

        // Internal state for this specific node, not necessarily part of this.properties
        this._lastStoreTime = -1;
        this._lastBPM = this.getProperty("currentBPM");
    }

    // onProcess is called by the LiteGraph wrapper's onExecute
    async onProcess(inputs) {
        const globalPlayheadTime = useStore.getState().playheadTime;
        const currentBPM = this.getProperty("currentBPM"); // Assuming BPM might be settable or from global state too

        let tickTriggered = false;
        if (globalPlayheadTime !== this._lastStoreTime) {
            this._lastStoreTime = globalPlayheadTime;
            tickTriggered = true;
            // The generic wrapper will need to know how to handle 'event' type outputs.
            // It might call `triggerSlot` on the LiteGraph instance.
        }

        // Beat detection logic (placeholder, would need actual implementation)
        let beatTriggered = false;
        if (this.getProperty("beatsActive")) {
            // Placeholder: trigger beat every second if BPM is 60
            // A real implementation would use a more sophisticated beat detection algorithm
            // or subscribe to beat events from an audio analyzer.
            const beatInterval = 60 / currentBPM;
            if (this._lastBeatTime === undefined) this._lastBeatTime = globalPlayheadTime;
            if (globalPlayheadTime - this._lastBeatTime >= beatInterval) {
                beatTriggered = true;
                this._lastBeatTime = globalPlayheadTime;
            }
        }

        // Outputs:
        // The generic LiteGraph wrapper will map these named outputs to slots.
        // For 'event' types, it would need a mechanism to call `triggerSlot`.
        // For data types, it uses `setOutputData`.
        return {
            onTick: tickTriggered ? globalPlayheadTime : undefined, // Pass time with the event
            time: globalPlayheadTime,
            beat: beatTriggered ? globalPlayheadTime : undefined, // Pass time with the event
            bpm: currentBPM
        };
    }

    // If BPM can be updated externally (e.g., via global store change or another node)
    // This method is illustrative; actual update mechanism depends on integration.
    setExternalBPM(newBPM) {
        if (this.getProperty("currentBPM") !== newBPM) {
            this.setProperty("currentBPM", newBPM);
            // The onPropertyChanged mechanism in BaseNode would be invoked.
        }
    }

    onPropertyChanged(name, value) {
        super.onPropertyChanged(name, value);
        if (name === "currentBPM") {
            this._lastBPM = value;
            // Potentially reset beat tracking if BPM changes
            this._lastBeatTime = useStore.getState().playheadTime;
        }
    }
}

export default PlayheadNode;
