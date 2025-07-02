import BaseNode from './BaseNode';

class OutputNode extends BaseNode {
    constructor() {
        super();
        this.type = 'OutputNode';
        this.visualOutput = null;
    }

    setVisualOutput(output) {
        this.visualOutput = output;
    }

    render() {
        if (this.visualOutput) {
            // Logic to render the visual output
            this.visualOutput.draw();
        }
    }
}

export default OutputNode;