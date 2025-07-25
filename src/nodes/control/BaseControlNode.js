import BaseNode from '../BaseNode.js';

class BaseControlNode extends BaseNode {
    constructor(title, options = {}) {
        super(title, {
            color: '#E74C3C',
            ...options
        });

        this.internalState = {};
        this.lastUpdateTime = performance.now();
    }

    async onProcess(inputs) {
        throw new Error("onProcess must be implemented by subclasses");
    }

    onPropertyChanged(name, value) {
        // Can be overridden by subclasses
    }
}

export default BaseControlNode;
