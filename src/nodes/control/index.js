import LfoNode from './LfoNode.js';
import EnvelopeNode from './EnvelopeNode.js';
import SequencerNode from './SequencerNode.js';
import RandomNode from './RandomNode.js';
import ExpressionNode from './ExpressionNode.js';
import MidiNode from './MidiNode.js';
import ClockNode from './ClockNode.js';
import TriggerNode from './TriggerNode.js';

const controlNodeTypes = {
    lfo: LfoNode,
    envelope: EnvelopeNode,
    sequencer: SequencerNode,
    random: RandomNode,
    expression: ExpressionNode,
    midi: MidiNode,
    clock: ClockNode,
    trigger: TriggerNode,
};

export function createControlNode(type, options = {}) {
    const NodeClass = controlNodeTypes[type];
    if (NodeClass) {
        return new NodeClass(options);
    }
    throw new Error(`Unknown control node type: ${type}`);
}
