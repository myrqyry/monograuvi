import BaseNode from './BaseNode';

class VisualNode extends BaseNode {
    constructor(id, visualElement) {
        super(id);
        this.visualElement = visualElement; // The visual element associated with this node
    }

    render(context) {
        // Logic to render the visual element using the provided context
        if (this.visualElement) {
            this.visualElement.render(context);
        }
    }

    update(audioFeatures) {
        // Logic to update the visual element based on audio features
        if (this.visualElement) {
            this.visualElement.update(audioFeatures);
        }
    }
}

export default VisualNode;