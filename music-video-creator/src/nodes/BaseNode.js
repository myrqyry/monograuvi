class BaseNode {
    constructor(name) {
        this.name = name;
        this.inputs = [];
        this.outputs = [];
    }

    addInput(input) {
        this.inputs.push(input);
    }

    addOutput(output) {
        this.outputs.push(output);
    }

    process() {
        // To be implemented by subclasses
        throw new Error("Process method must be implemented in subclasses");
    }

    getInputs() {
        return this.inputs;
    }

    getOutputs() {
        return this.outputs;
    }
}

export default BaseNode;