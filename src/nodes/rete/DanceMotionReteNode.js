import { MyBaseReteNode } from './MyBaseReteNode';
import useStore from '../../store';
import MotionLibrary from '../../lib/MotionLibrary';

let motionLibraryInstance = null;
try {
    motionLibraryInstance = new MotionLibrary();
} catch (e) {
    console.error("Failed to initialize MotionLibrary for DanceMotionReteNode:", e);
}

export class DanceMotionReteNode extends MyBaseReteNode {
    constructor(initialCustomData = {}) {
        super('Dance Motion', { customData: initialCustomData });

        const motionOptions = motionLibraryInstance
            ? motionLibraryInstance.getAllMotions().map(m => ({ content: m.name, value: m.id }))
            : [{ content: "N/A", value: "default_idle"}];

        const defaultMotionId = motionLibraryInstance?.getAllMotions()[0]?.id || 'default_idle';
        const defaultDuration = motionLibraryInstance?.getMotionById(defaultMotionId)?.duration || 5.0;

        // --- Controls ---
        this.addControlWithLabel('motionId', 'enum', 'Motion', {
            initial: initialCustomData.motionId || defaultMotionId,
            options: motionOptions
        });
        this.addControlWithLabel('startTime', 'number', 'Start Time (s)', {
            initial: initialCustomData.startTime || 0.0,
            min: 0,
            step: 0.1
        });
        this.addControlWithLabel('duration', 'number', 'Duration (s)', {
            initial: initialCustomData.duration || defaultDuration,
            min: 0.1,
            step: 0.1
        });

        // --- Outputs (for potential chaining or status) ---
        // this.addOutputWithLabel('isActive', 'Active'); // boolean

        // Initial sync to the store when the node is created programmatically
        // Note: this.id is not available yet in constructor. Syncing is best done in onNodeAdded.
    }

    // `onNodeAdded` is a custom hook we can call from the editor's nodecreated pipe
    onNodeAdded() {
        super.onNodeAdded(); // Call base class method
        this.syncToStore('add');
    }

    // Override from MyBaseReteNode
    onPropertyChanged(propertyName, newValue) {
        super.onPropertyChanged(propertyName, newValue);

        if (propertyName === 'motionId') {
            const selectedMotion = motionLibraryInstance?.getMotionById(newValue);
            if (selectedMotion?.duration) {
                // Also update the duration property when motion changes
                this.setPropertyAndRecord('duration', selectedMotion.duration, this.historyRef);
            }
        }
        this.syncToStore('update');
    }

    // Override from MyBaseReteNode
    destroy() {
        this.syncToStore('remove');
        super.destroy();
    }

    syncToStore(action) {
        if (!this.id) {
            console.warn("DanceMotionReteNode: Cannot sync to store without an ID.");
            return;
        }

        const { addDanceBlock, updateDanceBlock, removeDanceBlock } = useStore.getState();
        const motion = motionLibraryInstance?.getMotionById(this.getProperty("motionId"));

        const blockData = {
            motionId: this.getProperty("motionId"),
            motionUrl: motion ? motion.url : '',
            startTime: this.getProperty("startTime"),
            duration: this.getProperty("duration"),
        };

        switch(action) {
            case 'add':
                addDanceBlock({ id: this.id.toString(), ...blockData });
                console.log(`DanceMotionReteNode ${this.id}: Added block to store`, blockData);
                break;
            case 'update':
                updateDanceBlock(this.id.toString(), blockData);
                console.log(`DanceMotionReteNode ${this.id}: Updated block in store`, blockData);
                break;
            case 'remove':
                removeDanceBlock(this.id.toString());
                console.log(`DanceMotionReteNode ${this.id}: Removed block from store`);
                break;
            default:
                break;
        }

        // Preload motion data if applicable
        if (blockData.motionUrl && typeof window.preloadVRMMotionData === 'function') {
            window.preloadVRMMotionData(blockData.motionUrl);
        }
    }

    // This node doesn't process data in the traditional sense, it manages state.
    // The data method can be used to output its active state if needed.
    data(inputs) {
        const { playheadTime } = useStore.getState();
        const startTime = this.getProperty('startTime');
        const duration = this.getProperty('duration');

        const isActive = playheadTime >= startTime && playheadTime < (startTime + duration);

        if (this.areaPlugin) {
            // Example of how to visually update the node when active
            // This would require a custom React component for the node.
            if (this.getProperty('isActive') !== isActive) {
                this.setPropertyAndRecord('isActive', isActive, this.historyRef);
            }
        }

        return {
            // isActive: isActive // Example output
        };
    }
}
