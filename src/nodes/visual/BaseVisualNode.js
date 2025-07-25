import BaseNode from '../BaseNode.js';

class BaseVisualNode extends BaseNode {
    constructor(title, options = {}) {
        super(title, {
            color: '#9B59B6',
            ...options
        });

        this.canvas = null;
        this.context = null;
        this.animationId = null;
        this.lastFrameTime = 0;
        this.visualState = {};
    }

    async onProcess(inputs) {
        throw new Error("onProcess must be implemented by subclasses");
    }

    onPropertyChanged(name, value) {
        // Can be overridden by subclasses
    }

    reinitializeVisual() {
        // Clear current visual state and reinitialize
        this.visualState = {};
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        super.destroy();
        this.reinitializeVisual();
        if (this.canvas) {
            this.canvas = null;
            this.context = null;
        }
    }
}

export default BaseVisualNode;
