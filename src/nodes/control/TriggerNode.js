import BaseControlNode from './BaseControlNode.js';

class TriggerNode extends BaseControlNode {
    constructor(options = {}) {
        super('Control Trigger', { size: [200, 160], ...options });

        this.setupTrigger();
    }

    setupTrigger() {
        this.addInput('Input', 'number', { description: 'Input value to monitor' });
        this.addOutput('Trigger', 'boolean', { description: 'Trigger output' });
        this.addOutput('Value', 'number', { description: 'Triggered value' });

        this.addProperty('threshold', 0.5, {
            min: -10, max: 10, step: 0.01,
            description: 'Trigger threshold',
            category: 'Trigger'
        });
        this.addProperty('mode', 'rising', {
            options: ['rising', 'falling', 'both', 'level'],
            type: 'enum',
            description: 'Trigger mode',
            category: 'Trigger'
        });
        this.addProperty('hysteresis', 0.01, {
            min: 0, max: 1, step: 0.001,
            description: 'Trigger hysteresis',
            category: 'Trigger'
        });
        this.addProperty('holdTime', 0.01, {
            min: 0, max: 1, step: 0.001,
            description: 'Trigger hold time',
            category: 'Timing'
        });

        this.internalState = {
            lastValue: 0,
            triggered: false,
            triggerTime: 0,
            state: false
        };
    }

    async onProcess(inputs) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        return this.processTrigger(inputs, currentTime);
    }

    processTrigger(inputs, currentTime) {
        const input = inputs.Input || 0;
        const threshold = this.getProperty('threshold');
        const mode = this.getProperty('mode');
        const hysteresis = this.getProperty('hysteresis');
        const holdTime = this.getProperty('holdTime');

        let triggered = false;

        switch (mode) {
            case 'rising':
                triggered = input > threshold && this.internalState.lastValue <= threshold - hysteresis;
                break;
            case 'falling':
                triggered = input < threshold && this.internalState.lastValue >= threshold + hysteresis;
                break;
            case 'both':
                triggered = (input > threshold && this.internalState.lastValue <= threshold - hysteresis) ||
                          (input < threshold && this.internalState.lastValue >= threshold + hysteresis);
                break;
            case 'level':
                triggered = input > threshold;
                break;
        }

        if (triggered) {
            this.internalState.triggered = true;
            this.internalState.triggerTime = currentTime;
        }

        // Handle hold time
        const output = this.internalState.triggered &&
                      (currentTime - this.internalState.triggerTime < holdTime);

        if (currentTime - this.internalState.triggerTime >= holdTime) {
            this.internalState.triggered = false;
        }

        this.internalState.lastValue = input;

        return {
            Trigger: output,
            Value: input
        };
    }
}

export default TriggerNode;
