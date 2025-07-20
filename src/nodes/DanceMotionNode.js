import BaseNode from './BaseNode.js';
import MotionLibrary from '../lib/MotionLibrary';
import useStore from '../store';
import { DANCE_MOTION_SNAP_INTERVAL } from '../constants/audio';
import logger from '../utils/logger';

let motionLibraryInstance = null;
try {
    motionLibraryInstance = new MotionLibrary();
} catch (e) {
    logger.error("Failed to initialize MotionLibrary for DanceMotionNode:", e);
}

class DanceMotionNode extends BaseNode {
    constructor(options = {}) {
        super("Dance Motion Block", {
            color: "#4A90E2",
            bgColor: "#2A2A2A",
            size: [280, 140], // Increased size for better widget display
            ...options
        });

        const defaultMotion = motionLibraryInstance?.getAllMotions()[0];
        const motionOptions = motionLibraryInstance
            ? motionLibraryInstance.getAllMotions().map(m => ({ content: m.name, value: m.id }))
            : [{ content: "N/A", value: "default_idle"}];

        this.addProperty("motionId", defaultMotion ? defaultMotion.id : "default_idle", {
            type: "enum",
            options: motionOptions,
            description: "Selected motion",
            category: "Motion",
            widget: "combo" // Hint for LiteGraph wrapper to use combo
        });
        this.addProperty("startTime", 0.0, {
            min: 0,
            step: 0.1, // LiteGraph widget might use this, BaseNode uses it for validation
            description: "Start time in seconds",
            category: "Timing",
            widget: "number" // Hint for LiteGraph wrapper
        });
        this.addProperty("duration", defaultMotion ? (defaultMotion.duration || 5.0) : 5.0, {
            min: 0.1,
            step: 0.1,
            description: "Duration in seconds",
            category: "Timing",
            widget: "number" // Hint for LiteGraph wrapper
        });
        // this.addProperty("intensity", 0.7, { min: 0, max: 1, step: 0.05, description: "Motion intensity", category: "Motion" });

        // Initialize properties if a motionId is set
        this._updateMotionDependentProperties(this.getProperty("motionId"), false);
    }

    // Helper to update properties when motionId changes (e.g., set default duration)
    _updateMotionDependentProperties(motionId, updateStore = true) {
        if (motionLibraryInstance) {
            const selectedMotion = motionLibraryInstance.getMotionById(motionId);
            if (selectedMotion) {
                // Ensure motionId property is updated (it should be if called from onPropertyChanged)
                // this.setProperty("motionId", selectedMotion.id); // This might cause recursion if not handled carefully

                if (selectedMotion.duration) {
                    // Update internal duration property directly
                    this.properties.duration.value = selectedMotion.duration;
                    // If a LiteGraph widget is directly tied to this.properties.duration.value, it should update.
                    // The generic registration will need to handle updating widgets.
                }
            }
        }
        if (updateStore) {
            this.updateDanceBlockInStore();
        }
    }

    // Called when the node is added to the graph (or equivalent in BaseNode context)
    onAdded() { // Assuming BaseNode will have onAdded/onRemoved hooks called by the LiteGraph wrapper
        super.onAdded && super.onAdded(); // Call parent if it exists
        logger.info(`DanceMotionNode ${this.id}: Added to graph.`);
        this.addDanceBlockToStore();
    }

    // Called when the node is removed from the graph
    onRemoved() {
        super.onRemoved && super.onRemoved();
        logger.info(`DanceMotionNode ${this.id}: Removed from graph.`);
        const { removeDanceBlock } = useStore.getState();
        removeDanceBlock(this.id.toString());
    }

    // Called when a property changes
    onPropertyChanged(name, value) {
        super.onPropertyChanged(name, value); // Call parent
        logger.info(`DanceMotionNode ${this.id}: Property Changed - ${name}: ${value}`);

        if (name === "motionId") {
            this._updateMotionDependentProperties(value, true);
        } else if (name === "startTime") {
            const snappedValue = Math.round(parseFloat(value) / DANCE_MOTION_SNAP_INTERVAL) * DANCE_MOTION_SNAP_INTERVAL;
            if (this.getProperty("startTime") !== snappedValue) { // Avoid infinite loop if setter calls onPropertyChanged
                 this.properties.startTime.value = Math.max(0, snappedValue); // Update internal value directly
            }
            this.updateDanceBlockInStore();
        } else if (name === "duration") {
             if (this.getProperty("duration") !== Math.max(0.1, parseFloat(value))) {
                this.properties.duration.value = Math.max(0.1, parseFloat(value));
            }
            this.updateDanceBlockInStore();
        }
    }

    addDanceBlockToStore() {
        const { addDanceBlock } = useStore.getState();
        const motion = motionLibraryInstance?.getMotionById(this.getProperty("motionId"));

        const blockData = {
            id: this.id.toString(),
            motionId: this.getProperty("motionId"),
            motionUrl: motion ? motion.url : '',
            startTime: this.getProperty("startTime"),
            duration: this.getProperty("duration"),
        };
        addDanceBlock(blockData);
        logger.info(`DanceMotionNode ${this.id}: Added block to store`, blockData);

        if (blockData.motionUrl && typeof window.preloadVRMMotionData === 'function') {
            window.preloadVRMMotionData(blockData.motionUrl);
        }
    }

    updateDanceBlockInStore() {
        const { updateDanceBlock } = useStore.getState();
        const motion = motionLibraryInstance?.getMotionById(this.getProperty("motionId"));

        const updatedBlockData = {
            motionId: this.getProperty("motionId"),
            motionUrl: motion ? motion.url : '',
            startTime: this.getProperty("startTime"),
            duration: this.getProperty("duration"),
        };
        updateDanceBlock(this.id.toString(), updatedBlockData);
        logger.info(`DanceMotionNode ${this.id}: Updated block in store`, updatedBlockData);

        if (updatedBlockData.motionUrl && typeof window.preloadVRMMotionData === 'function') {
            window.preloadVRMMotionData(updatedBlockData.motionUrl);
        }
    }

    // onProcess will be called by the LiteGraph wrapper's onExecute
    async onProcess(inputs) {
        // This node primarily manages data in the store based on its properties.
        // It doesn't have typical inputs/outputs that transform data in real-time in the graph.
        // Its "execution" is more about reacting to property changes and ensuring the store is synced.
        // The visual feedback (box color) can be handled by the LiteGraph wrapper if needed.

        // const globalPlayheadTime = useStore.getState().playheadTime;
        // const isActive = globalPlayheadTime >= this.getProperty("startTime") &&
        //                  globalPlayheadTime < (this.getProperty("startTime") + this.getProperty("duration"));

        // This could return an object indicating its state if other nodes need to react to it.
        // For now, its main job is done via store updates.
        return {
            // active: isActive // Example output
        };
    }

    // BaseNode's serialize/deserialize should handle properties.
    // Custom logic for store syncing upon deserialization might be needed.
    deserialize(data) {
        super.deserialize(data);
        // After properties are set by super.deserialize, ensure store is updated.
        // This logic is similar to what was in `configure` for LGraphNode.

        // It's crucial that this.id is correctly set by super.deserialize(data) before using it.
        const existingBlock = useStore.getState().danceBlocks.find(b => b.id === this.id.toString());
        if (existingBlock) {
            this.updateDanceBlockInStore();
        } else {
            // If the node is being created from scratch (e.g. loading a graph where this node didn't exist in store)
            this.addDanceBlockToStore();
        }
    }
}

export default DanceMotionNode;
