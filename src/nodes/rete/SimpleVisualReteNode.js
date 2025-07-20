import { MyBaseReteNode } from './MyBaseReteNode';
// No ClassicPreset needed here unless we add sockets/controls directly without helpers

export class SimpleVisualReteNode extends MyBaseReteNode {
  constructor(initialCustomData = {}) {
    super('Simple Visual', { customData: initialCustomData }); // Node label

    // Define Inputs
    this.addInputWithLabel('inputValue', 'Value'); // Expects a number

    // No outputs for this simple visualizer initially

    // Initialize customData for the visual aspect
    if (this.customData.color === undefined) {
      this.customData.color = 'blue'; // Default color
    }
    if (this.customData.intensity === undefined) {
      this.customData.intensity = 0; // This will be driven by inputValue
    }
    // Add a simple color control for testing
    this.addControlWithLabel('baseColor', 'enum', 'Base Color', {
        initial: initialCustomData.baseColor || 'blue',
        options: ['blue', 'red', 'green', 'yellow', 'purple']
    });
  }

  // data() method for rete-engine (dataflow)
  // inputs: { inputValue: [number] }
  data(inputs) {
    const inputValue = inputs.inputValue && inputs.inputValue.length > 0 ? inputs.inputValue[0] : 0;

    // Store the processed input value in customData so the React component can use it
    // We scale it to be between 0 and 1 for simplicity if it's an LFO (-1 to 1)
    const normalizedIntensity = (inputValue + 1) / 2; // Assuming input LFO range -1 to 1

    // Check if value actually changed to avoid unnecessary updates
    const newIntensity = Math.max(0, Math.min(1, normalizedIntensity)); // Clamp between 0 and 1
    this.setPropertyAndRecord('intensity', newIntensity, this.historyRef);

    // This node doesn't produce data outputs for other nodes in this simple form
    return {};
  }
}

export default SimpleVisualReteNode;
