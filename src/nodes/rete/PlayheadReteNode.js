import { MyBaseReteNode } from './MyBaseReteNode';
import { ClassicPreset } from 'rete';
import useStore from '../../store'; // Import the Zustand store

export class PlayheadReteNode extends MyBaseReteNode {
    constructor(initialCustomData = {}) {
        super('Playhead', { customData: initialCustomData });

        this._lastStoreTime = -1;
        this._lastBeatTime = -1;

        // --- Outputs ---
        const onTickOutput = new ClassicPreset.Output(this.sockets.trigger, 'onTick');
        this.addOutput('onTick', onTickOutput);

        const timeOutput = new ClassicPreset.Output(this.sockets.number, 'Time (s)');
        this.addOutput('time', timeOutput);

        const onBeatOutput = new ClassicPreset.Output(this.sockets.trigger, 'onBeat');
        this.addOutput('onBeat', onBeatOutput);

        const bpmOutput = new ClassicPreset.Output(this.sockets.number, 'BPM');
        this.addOutput('bpm', bpmOutput);

        // --- Controls ---
        this.addControlWithLabel('currentBPM', 'number', 'BPM', { initial: 120, min: 20, max: 250, step: 1 });
        this.addControlWithLabel('beatsActive', 'boolean', 'Trigger Beats', { initial: true });
    }

    // data() is called by the Rete engine on each processing frame
    data(inputs) {
        const { playheadTime, isPlaying } = useStore.getState();
        const currentBPM = this.getProperty('currentBPM');

        let tickTriggered = false;
        if (isPlaying && playheadTime !== this._lastStoreTime) {
            tickTriggered = true;
            this._lastStoreTime = playheadTime;
        }

        let beatTriggered = false;
        if (isPlaying && this.getProperty('beatsActive')) {
            const beatInterval = 60.0 / currentBPM;
            if (this._lastBeatTime < 0) { // Initialize on first run
                 this._lastBeatTime = playheadTime;
            }
            if (playheadTime - this._lastBeatTime >= beatInterval) {
                beatTriggered = true;
                // Important: Update last beat time based on the *expected* beat, not current time, to avoid drift
                this._lastBeatTime += beatInterval;
                // If it's fallen far behind, reset to current time
                if (playheadTime - this._lastBeatTime > beatInterval) {
                    this._lastBeatTime = playheadTime;
                }
            }
        }

        // Rete's dataflow engine requires returning an object with keys matching the outputs.
        // For trigger sockets, we need a way to signal an event. A common pattern is to
        // pass a special object or just a boolean, but Rete's dataflow engine doesn't
        // have a built-in concept of "events" like LiteGraph.
        // A workaround is to not connect triggers to data inputs, but have nodes
        // that can be executed by other means (e.g. custom engine logic), or simply
        // output a value that can be interpreted as a trigger (e.g., a changed value, a boolean).
        // For this implementation, we will assume that the dataflow engine will propagate
        // the output values, and downstream nodes will react to them.
        // We will not implement a custom event system for now.
        // Outputs will just be the data.

        return {
            onTick: tickTriggered, // This will output true on a tick, false otherwise
            time: playheadTime,
            onBeat: beatTriggered, // This will output true on a beat, false otherwise
            bpm: currentBPM
        };
    }

    onPropertyChanged(propertyName, newValue) {
        super.onPropertyChanged(propertyName, newValue);
        if (propertyName === 'currentBPM') {
            // Reset beat tracking when BPM changes to avoid inconsistent timing
            this._lastBeatTime = -1;
        }
    }
}
