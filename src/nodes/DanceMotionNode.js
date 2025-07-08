import { LGraphNode, LiteGraph } from 'litegraph.js';
import MotionLibrary from '../lib/MotionLibrary'; // Assuming MotionLibrary is accessible like this
import useStore from '../store'; // Access Zustand store

// Initialize motion library (singleton or shared instance)
// This is a simple way; ideally, this might be provided by the graph editor context
let motionLibraryInstance = null;
try {
    motionLibraryInstance = new MotionLibrary();
} catch (e) {
    console.error("Failed to initialize MotionLibrary for DanceMotionNode:", e);
}

class DanceMotionNode extends LGraphNode {
    constructor() {
        super();
        this.title = "Dance Motion Block";
        this.size = [280, 140]; // Increased size for better widget display

        // Remove old inputs if they are not used for driving the timeline block data
        // this.removeInput(this.inputs.findIndex(i => i.name === "currentTime"));
        // this.removeInput(this.inputs.findIndex(i => i.name === "motionId")); // motionId is now a property
        // this.removeInput(this.inputs.findIndex(i => i.name === "intensity"));
        // Inputs can be added back if this node needs to react to other graph events for its properties

        const defaultMotion = motionLibraryInstance?.getAllMotions()[0];

        this.properties = {
            // blockId will be this.id (from LiteGraph)
            motionId: defaultMotion ? defaultMotion.id : "default_idle", // Store the ID of the motion
            startTime: 0.0,
            duration: defaultMotion ? (defaultMotion.duration || 5.0) : 5.0,
            // intensity: 0.7, // If intensity is still needed, keep it
        };

        this._updateMotionProperties(this.properties.motionId, false); // Initialize potentially dependent properties

        const SNAP_INTERVAL = 0.5; // Define snap interval in seconds

        this.addWidget("number", "Start Time (s)", this.properties.startTime, (v) => {
            const snappedValue = Math.round(parseFloat(v) / SNAP_INTERVAL) * SNAP_INTERVAL;
            this.properties.startTime = Math.max(0, snappedValue);
            // Update the widget's displayed value to the snapped value
            if (this.widgets && this.widgets[0]) this.widgets[0].value = this.properties.startTime;
            this.updateDanceBlockInStore();
        }, { min: 0, step: 0.1 }); // Step might become less relevant with snapping but good for fine-tuning if needed

        this.addWidget("number", "Duration (s)", this.properties.duration, (v) => {
            this.properties.duration = Math.max(0.1, parseFloat(v));
            this.updateDanceBlockInStore();
        }, { min: 0.1, step: 0.1 });

        const motionOptions = motionLibraryInstance ? motionLibraryInstance.getAllMotions().map(m => ({ content: m.name, value: m.id })) : [{ content: "N/A", value: "default_idle"}];
        this.addWidget("combo", "Motion", this.properties.motionId, (v) => {
            this.properties.motionId = v;
            this._updateMotionProperties(v, true); // Update dependent props and then update store
        }, { values: motionOptions });

        // this.addWidget("number", "Intensity", this.properties.intensity, (v) => {
        //     this.properties.intensity = parseFloat(v);
        //     this.updateDanceBlockInStore();
        // }, { min: 0, max: 1, step: 0.05 });

        this.color = "#4A90E2";
        this.bgcolor = "#2A2A2A";
    }

    // Helper to update properties when motionId changes (e.g., set default duration)
    _updateMotionProperties(motionId, updateStore = true) {
        if (motionLibraryInstance) {
            const selectedMotion = motionLibraryInstance.getMotionById(motionId);
            if (selectedMotion) {
                this.properties.motionId = selectedMotion.id; // Ensure it's the ID
                // Update node's duration property if the motion has one, and perhaps other defaults
                if (selectedMotion.duration) {
                     // Only update if the widget isn't focused, to avoid overriding user input mid-edit.
                     // This check is tricky with LiteGraph's widget system. For now, we'll update.
                    this.properties.duration = selectedMotion.duration;
                    // Update the widget value directly if possible, otherwise LiteGraph might not show it
                    const durationWidget = this.widgets.find(w => w.name === "Duration (s)");
                    if (durationWidget) durationWidget.value = selectedMotion.duration;
                }
            }
        }
        if (updateStore) {
            this.updateDanceBlockInStore();
        }
    }

    // Called when the node is added to the graph
    onAdded(graph) {
        console.log(`DanceMotionNode ${this.id}: Added to graph.`);
        this.addDanceBlockToStore();
    }

    // Called when the node is removed from the graph
    onRemoved() {
        console.log(`DanceMotionNode ${this.id}: Removed from graph.`);
        const { removeDanceBlock } = useStore.getState();
        // TODO: Wrap in RemoveDanceBlockForNodeCommand
        removeDanceBlock(this.id.toString()); // Use node's ID as block ID
    }

    // Called when a property changes (e.g., from the properties panel)
    // LiteGraph's onPropertyChanged is a bit inconsistent with widgets.
    // Widget callbacks are more reliable for immediate changes.
    onPropertyChanged(name, value) {
        console.log(`DanceMotionNode ${this.id}: Property Changed - ${name}: ${value}`);
        // Ensure internal properties are synced if changed from panel
        if (name === "motionId") {
            this._updateMotionProperties(value, true);
        } else if (name === "startTime" || name === "duration") {
            this.properties[name] = value; // Ensure property is set before updating store
            this.updateDanceBlockInStore();
        }
        // Update widget values if changed from properties panel
        const widget = this.widgets.find(w => w.name === name || w.name.startsWith(name.split(" ")[0])); // basic match for widget name
        if(widget && widget.value !== value) {
            widget.value = value;
        }
    }

    addDanceBlockToStore() {
        const { addDanceBlock } = useStore.getState();
        const motion = motionLibraryInstance?.getMotionById(this.properties.motionId);

        const blockData = {
            id: this.id.toString(), // Use LiteGraph node ID as block ID
            motionId: this.properties.motionId,
            motionUrl: motion ? motion.url : '',
            startTime: this.properties.startTime,
            duration: this.properties.duration,
        };
        // TODO: Wrap in AddDanceBlockForNodeCommand
        addDanceBlock(blockData);
        console.log(`DanceMotionNode ${this.id}: Added block to store`, blockData);

        // Trigger preload
        if (blockData.motionUrl && typeof window.preloadVRMMotionData === 'function') {
            console.log(`DanceMotionNode ${this.id}: Triggering preload for ${blockData.motionUrl}`);
            window.preloadVRMMotionData(blockData.motionUrl);
        }
    }

    updateDanceBlockInStore() {
        const { updateDanceBlock } = useStore.getState();
        const motion = motionLibraryInstance?.getMotionById(this.properties.motionId);

        const updatedBlockData = {
            // id is this.id.toString()
            motionId: this.properties.motionId,
            motionUrl: motion ? motion.url : '',
            startTime: this.properties.startTime,
            duration: this.properties.duration,
        };
        // TODO: Wrap in UpdateDanceBlockForNodeCommand
        updateDanceBlock(this.id.toString(), updatedBlockData);
        console.log(`DanceMotionNode ${this.id}: Updated block in store`, updatedBlockData);

        // Trigger preload if motion URL changed
        if (updatedBlockData.motionUrl && typeof window.preloadVRMMotionData === 'function') {
             // Only preload if this is a meaningful update, e.g. motionId actually changed.
             // This check might be more complex if just duration/startTime changes.
             // For now, let's assume an update implies potential need to preload.
            console.log(`DanceMotionNode ${this.id}: Triggering preload for updated motion ${updatedBlockData.motionUrl}`);
            window.preloadVRMMotionData(updatedBlockData.motionUrl);
        }
    }

    // onExecute is no longer needed to drive playback.
    // It could be used to visually update the node based on global playhead time if desired.
    onExecute() {
        // Example: Change color if this block is active based on global playhead time
        const globalPlayheadTime = useStore.getState().playheadTime;
        const isActive = globalPlayheadTime >= this.properties.startTime &&
                         globalPlayheadTime < (this.properties.startTime + this.properties.duration);

        if (isActive && (this.boxcolor !== "#AFA" && this.boxcolor !== "#6F6")) { // Active color
            this.boxcolor = "#6F6";
        } else if (!isActive && (this.boxcolor === "#AFA" || this.boxcolor === "#6F6")) {
            this.boxcolor = LGraphNode.DEFAULT_BOXCOLOR;
        }
    }

    // Optional: If graph is saved/loaded, ensure dance block is synced.
    // LiteGraph calls configure after properties are set from graph data.
    configure(info) {
        super.configure(info); // This applies properties from info.properties
        // After properties are configured from a loaded graph, ensure the store is synced.
        // This might lead to double-adding if onAdded also runs.
        // A flag or check in store might be needed, or onAdded is sufficient if it's always called.
        // For now, let's assume onAdded handles initial sync.
        // However, if properties are loaded, we need to update the store with those loaded values.

        // Update combo widget values after load
        const motionWidget = this.widgets.find(w => w.type === "combo" && w.name === "Motion");
        if(motionWidget) motionWidget.value = this.properties.motionId;

        const durationWidget = this.widgets.find(w => w.name === "Duration (s)");
        if (durationWidget) durationWidget.value = this.properties.duration;

        const startTimeWidget = this.widgets.find(w => w.name === "Start Time (s)");
        if (startTimeWidget) startTimeWidget.value = this.properties.startTime;

        // Crucially, after configuring from saved data, re-sync with the store.
        // This ensures that loading a graph correctly populates the timeline.
        // Need to check if a block with this.id already exists.
        const existingBlock = useStore.getState().danceBlocks.find(b => b.id === this.id.toString());
        if (existingBlock) {
            this.updateDanceBlockInStore();
        } else {
            this.addDanceBlockToStore();
        }
    }

    // When cloning a node, LiteGraph typically calls constructor then configure.
    // onAdded is called when it's actually added to a graph.
    // We need to ensure cloned nodes get new unique IDs for their dance blocks.
    // LiteGraph handles assigning new IDs to cloned nodes automatically.
    // So, the this.id in onAdded for a cloned node will be fresh.
}

// Registration happens in registerNodes.js
// LiteGraph.registerNodeType("timeline/DanceMotionBlock", DanceMotionNode);

export default DanceMotionNode;
