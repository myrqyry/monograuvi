class BaseNode {
    constructor(name, options = {}) {
        this.name = name;
        this.id = options.id || this.generateId();
        this.inputs = [];
        this.outputs = [];
        this.properties = {};
        this.widgets = [];
        this.connections = new Map();
        this.enabled = true;
        this.bypass = false;
        this.lastProcessTime = 0;
        this.errorState = null;
        
        // Visual properties
        this.color = options.color || '#4A90E2';
        this.bgColor = options.bgColor || '#2A2A2A';
        this.size = options.size || [200, 100];
        
        // Performance monitoring
        this.processingTime = 0;
        this.processCount = 0;
        
        // Backend integration
        this.apiEndpoint = options.apiEndpoint || 'http://localhost:8000';
        this.websocketConnected = false;
    }

    generateId() {
        return 'node_' + Math.random().toString(36).substr(2, 9);
    }

    addInput(name, type, options = {}) {
        const input = {
            name,
            type,
            required: options.required || false,
            defaultValue: options.defaultValue,
            min: options.min,
            max: options.max,
            step: options.step,
            ...options
        };
        this.inputs.push(input);
        return input;
    }

    addOutput(name, type, options = {}) {
        const output = {
            name,
            type,
            description: options.description,
            ...options
        };
        this.outputs.push(output);
        return output;
    }

    addProperty(name, value, options = {}) {
        this.properties[name] = {
            value,
            type: options.type || typeof value,
            min: options.min,
            max: options.max,
            step: options.step,
            options: options.options, // for enum/select types
            description: options.description,
            category: options.category || 'General',
            widget: options.widget || 'default'
        };
    }

    getProperty(name) {
        return this.properties[name]?.value;
    }

    setProperty(name, value) {
        if (this.properties[name]) {
            const prop = this.properties[name];
            
            // Validate value based on type and constraints
if (prop.min !== undefined && value < prop.min) value = prop.min;
if (prop.max !== undefined && value > prop.max) value = prop.max;

// Validate value against type
if (prop.type === 'number' && typeof value !== 'number') {
    console.error(`Invalid type for property '${name}'. Expected 'number', got '${typeof value}'.`);
    return false;
}
if (prop.type === 'string' && typeof value !== 'string') {
    console.error(`Invalid type for property '${name}'. Expected 'string', got '${typeof value}'.`);
    return false;
}
if (prop.type === 'boolean' && typeof value !== 'boolean') {
    console.error(`Invalid type for property '${name}'. Expected 'boolean', got '${typeof value}'.`);
    return false;
}
if (prop.type === 'object' && typeof value !== 'object') {
    console.error(`Invalid type for property '${name}'. Expected 'object', got '${typeof value}'.`);
    return false;
}
if (prop.options && !prop.options.includes(value)) {
    console.error(`Invalid value for property '${name}'. Allowed values are: ${prop.options.join(', ')}.`);
    return false;
}

this.properties[name].value = value;
this.onPropertyChanged(name, value);
return true;
        }
        return false;
    }

    onPropertyChanged(name, value) {
        // Override in subclasses for property change handling
    }

    async process(inputs = {}) {
        if (!this.enabled || this.bypass) {
            return this.passthroughProcess(inputs);
        }

        const startTime = performance.now();
        
        try {
            this.errorState = null;
            const result = await this.onProcess(inputs);
            
            const endTime = performance.now();
            this.processingTime = Math.min(this.processingTime + (endTime - startTime), 1000); // Cap processing time
            this.processCount++;
            this.lastProcessTime = Date.now();
            
            return result;
        } catch (error) {
            this.errorState = error.message;
            console.error(`Node ${this.name} (${this.id}) error:`, error);
            return this.getErrorOutput();
        }
    }

    async onProcess(inputs) {
        // To be implemented by subclasses
        throw new Error("onProcess method must be implemented in subclasses");
    }

    passthroughProcess(inputs) {
        // Default passthrough for bypassed nodes
        return inputs;
    }

    getErrorOutput() {
        // Return safe default output when error occurs
        const output = {};
        this.outputs.forEach(out => {
            output[out.name] = null;
        });
        return output;
    }

    // Backend integration methods
    async callBackendAPI(endpoint, data = {}, method = 'POST') {
        try {
            const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: method !== 'GET' ? JSON.stringify(data) : undefined
            });
            
            if (!response.ok) {
                throw new Error(`Backend API error: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Backend API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    connectWebSocket(path) {
        if (this.websocketConnected) return;
        
        try {
            const ws = new WebSocket(`ws://localhost:8000${path}`);
            
            ws.onopen = () => {
                this.websocketConnected = true;
                this.onWebSocketConnected(ws);
            };
            
ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        this.onWebSocketMessage(data);
    } catch (error) {
        console.error(`Failed to parse WebSocket message for node ${this.id}:`, error);
    }
};
            
            ws.onclose = () => {
                this.websocketConnected = false;
                this.onWebSocketDisconnected();
            };
            
            ws.onerror = (error) => {
                console.error(`WebSocket error for node ${this.id}:`, error);
            };
            
            this.websocket = ws;
        } catch (error) {
            console.error(`Failed to connect WebSocket for node ${this.id}:`, error);
        }
    }

    onWebSocketConnected(ws) {
        // Override in subclasses
    }

    onWebSocketMessage(data) {
        // Override in subclasses
    }

    onWebSocketDisconnected() {
        // Override in subclasses
    }

    // Validation methods
    validateInputs(inputs) {
        const errors = [];
        
        this.inputs.forEach(input => {
            if (input.required && (inputs[input.name] === undefined || inputs[input.name] === null)) {
                errors.push(`Required input '${input.name}' is missing`);
            }
            
            if (inputs[input.name] !== undefined) {
                const value = inputs[input.name];
                
if (input.type === 'number') {
    if (isNaN(value)) errors.push(`Input '${input.name}' must be a number`);
    if (input.min !== undefined && value < input.min) {
        errors.push(`Input '${input.name}' must be >= ${input.min}`);
    }
    if (input.max !== undefined && value > input.max) {
        errors.push(`Input '${input.name}' must be <= ${input.max}`);
    }
} else if (input.type === 'string') {
    if (typeof value !== 'string') {
        errors.push(`Input '${input.name}' must be a string`);
    }
    if (input.pattern && !new RegExp(input.pattern).test(value)) {
        errors.push(`Input '${input.name}' must match the pattern: ${input.pattern}`);
    }
} else if (input.type === 'boolean') {
    if (typeof value !== 'boolean') {
        errors.push(`Input '${input.name}' must be a boolean`);
    }
} else if (input.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`Input '${input.name}' must be an object`);
    }
} else if (input.type === 'array') {
    if (!Array.isArray(value)) {
        errors.push(`Input '${input.name}' must be an array`);
    }
    if (input.itemType) {
        value.forEach((item, index) => {
            if (typeof item !== input.itemType) {
                errors.push(`Item at index ${index} in input '${input.name}' must be of type '${input.itemType}'`);
            }
        });
    }
} else if (input.options) {
    if (!input.options.includes(value)) {
        errors.push(`Input '${input.name}' must be one of: ${input.options.join(', ')}`);
    }
}
            }
        });
        
        return errors;
    }

    // Utility methods
    getInputs() {
        return this.inputs;
    }

    getOutputs() {
        return this.outputs;
    }

    getProperties() {
        return this.properties;
    }

    getInfo() {
        return {
            id: this.id,
            name: this.name,
            enabled: this.enabled,
            bypass: this.bypass,
            errorState: this.errorState,
            processingTime: this.processingTime,
            processCount: this.processCount,
            lastProcessTime: this.lastProcessTime,
            websocketConnected: this.websocketConnected
        };
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.constructor.name,
            properties: Object.fromEntries(
                Object.entries(this.properties).map(([key, prop]) => [key, prop.value])
            ),
            enabled: this.enabled,
            bypass: this.bypass,
            size: this.size,
            color: this.color
        };
    }

    deserialize(data) {
        this.id = data.id !== undefined ? data.id : this.id;
        this.name = data.name !== undefined ? data.name : this.name;
        this.enabled = data.enabled !== undefined ? data.enabled : this.enabled;
        this.bypass = data.bypass !== undefined ? data.bypass : this.bypass;
        this.size = data.size !== undefined ? data.size : this.size;
        this.color = data.color !== undefined ? data.color : this.color;
        
        if (data.properties) {
            Object.entries(data.properties).forEach(([key, value]) => {
                this.setProperty(key, value);
            });
        }
    }

    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }
        this.connections.clear();
    }
}

export default BaseNode;
