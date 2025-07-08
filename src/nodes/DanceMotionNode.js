import { LGraphNode } from 'litegraph.js';

class DanceMotionNode extends LGraphNode {
    constructor() {
        super();
        this.title = "Dance Motion";
        this.size = [240, 120]; // Adjusted size for new input and property

        // Inputs
        this.addInput("currentTime", "number"); // From PlayheadNode
        this.addInput("motionId", "string");
        this.addInput("intensity", "number");
        // Duration is now a property, startTime is a property
        // Outputs - can be added back if needed, e.g. "isActive" (boolean)

        this.properties = {
            startTime: 0.0, // Start time of this dance block on the timeline
            duration: 5.0,  // Duration of the dance motion
            motionId: "default_idle",
            intensity: 0.7,
            // internal state, not really a user property but useful for tracking
            _isPlaying: false
        };

        // Add widgets for properties so they can be edited on the node
        this.addWidget("number", "Start Time", this.properties.startTime, (v) => this.properties.startTime = parseFloat(v), { min: 0, step: 0.1 });
        this.addWidget("number", "Duration", this.properties.duration, (v) => this.properties.duration = parseFloat(v), { min: 0.1, step: 0.1 });
        this.addWidget("string", "Motion ID", this.properties.motionId, (v) => this.properties.motionId = v);
        this.addWidget("number", "Intensity", this.properties.intensity, (v) => this.properties.intensity = parseFloat(v), { min: 0, max: 1, step: 0.05 });
    }

    onPropertyChanged(name, value) {
        // Properties are directly updated by widgets or when graph loads.
        // Widgets already update this.properties directly.
        if (this.widgets_values) {
             if(name === "Start Time") this.properties.startTime = value;
             if(name === "Duration") this.properties.duration = value;
             if(name === "Motion ID") this.properties.motionId = value;
             if(name === "Intensity") this.properties.intensity = value;
        }
    }

    onExecute() {
        const currentTime = this.getInputData(0); // currentTime from PlayheadNode
        const motionId = this.getInputData(1, this.properties.motionId);
        const intensity = this.getInputData(2, this.properties.intensity);

        if (currentTime === undefined || currentTime === null) {
            // If no time input, do nothing or stop animation
            if (this.properties._isPlaying) {
                if (window.playVRMMotion) {
                    // Need a way to tell playVRMMotion to stop this specific motion
                    // For now, let's assume playVRMMotion(motionId, start, 0) means stop or duration 0
                    // This needs refinement in playVRMMotion API.
                    // window.playVRMMotion(motionId, this.properties.startTime, 0, true); // true for stop
                }
                this.properties._isPlaying = false;
                this.boxcolor = LGraphNode.DEFAULT_BOXCOLOR; // Reset color
            }
            return;
        }

        const nodeStartTime = this.properties.startTime;
        const nodeDuration = this.properties.duration;
        const nodeEndTime = nodeStartTime + nodeDuration;

        const shouldBePlaying = currentTime >= nodeStartTime && currentTime < nodeEndTime;

        if (shouldBePlaying && !this.properties._isPlaying) {
            // Start animation
            if (window.playVRMMotion) {
                console.log(`DanceMotionNode: Starting ${motionId} at ${currentTime} (node start: ${nodeStartTime}, duration: ${nodeDuration})`);
                // The `playMotion` API needs to handle starting an animation that might have a specific duration.
                // It also needs to handle being called multiple times (idempotency).
                // The `start` parameter for playMotion should perhaps be relative to the animation itself (usually 0).
                // The VRMViewer would handle the actual timing based on when it's told to play.
                window.playVRMMotion(motionId, 0, nodeDuration);
            }
            this.properties._isPlaying = true;
            this.boxcolor = "#AFA"; // Greenish when active
        } else if (!shouldBePlaying && this.properties._isPlaying) {
            // Stop animation
            if (window.playVRMMotion) {
                console.log(`DanceMotionNode: Stopping ${motionId} at ${currentTime} (node end: ${nodeEndTime})`);
                // This is where a specific "stop" command for a motionId would be useful.
                // For now, we rely on playVRMMotion to handle a new call for a different/no motion or duration 0.
                // window.playVRMMotion(motionId, 0, 0, true); // Example: stop this motion
            }
            this.properties._isPlaying = false;
            this.boxcolor = LGraphNode.DEFAULT_BOXCOLOR; // Reset color
        }
    }
}

// Register the node with LiteGraph
// LiteGraph.registerNodeType("path/in/graph/DanceMotionNode", DanceMotionNode);
// The registration path will be handled in registerNodes.js

export default DanceMotionNode;
