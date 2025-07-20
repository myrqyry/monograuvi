import { ClassicPreset } from 'rete'; 

// Minimal socket identifier
const socket = 'default-socket';

// Minimal input/output/control classes
class MinimalInput {
  constructor(socket, label, multiConnection = false) {
    this.socket = socket;
    this.label = label;
    this.multiConnection = multiConnection;
  }
}
class MinimalOutput {
  constructor(socket, label, multiConnection = false) {
    this.socket = socket;
    this.label = label;
    this.multiConnection = multiConnection;
  }
}
class MinimalControl {
  constructor(initial, options = {}) {
    this.initial = initial;
    this.options = options;
  }
}

export class MyBaseReteNode extends ClassicPreset.Node {
  areaPlugin = null;
  // Callback to inform ReteEditorComponent about property changes for Zustand sync
  onPropertyChangeForSync = null;

  constructor(label, options = {}) {
    super(label);
    this.customData = options.customData || {};
    this.nodeName = label;
    this.color = options.color || '#4A90E2';
    this.bgColor = options.bgColor || '#2A2A2A';
    this.processingTime = 0;
    this.processCount = 0;
    this.lastProcessTime = 0;
    this.errorState = null;
    this.apiEndpoint = options.apiEndpoint || 'http://localhost:8000';
    this.websocketConnected = false;
    this.websocket = null;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.bypass = options.bypass !== undefined ? options.bypass : false;
    this.controlStore = {};
  }

  setAreaPlugin(areaPluginInstance) {
    this.areaPlugin = areaPluginInstance;
  }

  setHistoryRef(historyPlugin) {
    this.historyRef = historyPlugin;
  }

  setOnPropertyChangeForSync(callback) {
    this.onPropertyChangeForSync = callback;
  }

  addInputWithLabel(key, label, isMultiConnection = false) {
    const input = new MinimalInput(socket, label, isMultiConnection);
    this.addInput(key, input);
    return input;
  }

  addOutputWithLabel(key, label, isMultiConnection = false) {
    const output = new MinimalOutput(socket, label, isMultiConnection);
    this.addOutput(key, output);
    return output;
  }

  addControlWithLabel(key, controlType, label, options = {}) {
    const controlInstance = new MinimalControl(options.initial, options);
    this.addControl(key, controlInstance);

    this.controlStore[key] = {
      label: label,
      type: controlType,
      options: options,
    };

    if (options.initial !== undefined) {
      this.customData[key] = options.initial;
    } else {
      if (controlType === 'number') this.customData[key] = 0;
      else if (controlType === 'boolean') this.customData[key] = false;
      else if (controlType === 'string') this.customData[key] = '';
      else if (controlType === 'enum' && options.options && options.options.length > 0) this.customData[key] = options.options[0];
      else this.customData[key] = null;
    }
    return controlInstance;
  }

  data() {
    const nodeData = super.data ? super.data() : {};
    return {
      ...nodeData,
      customData: { ...this.customData },
      enabled: this.enabled,
      bypass: this.bypass,
    };
  }

  setData(data) {
    if (super.setData) super.setData(data);
    this.customData = data.customData || {};
    this.enabled = data.enabled !== undefined ? data.enabled : this.enabled;
    this.bypass = data.bypass !== undefined ? data.bypass : this.bypass;

    // When data is set (e.g. on load, undo/redo), update UI
    if (this.areaPlugin) {
        this.areaPlugin.update('node', this.id);
    }
  }

  getProperty(key) {
    return this.customData[key];
  }

  setPropertyAndRecord(key, value, historyPlugin) {
    const oldValue = this.customData[key];

    const controlConfig = this.controlStore[key];
    if (controlConfig) {
      const opts = controlConfig.options;
      if (opts.min !== undefined && typeof value === 'number' && value < opts.min) value = opts.min;
      if (opts.max !== undefined && typeof value === 'number' && value > opts.max) value = opts.max;
    }

    if (oldValue === value && typeof oldValue === typeof value) return false;

    this.customData[key] = value;
    this.onPropertyChanged(key, value);

    if (this.areaPlugin) {
      this.areaPlugin.update('node', this.id);
    } else {
      console.warn('MyBaseReteNode: AreaPlugin not set on node', this.id);
    }

    // Inform ReteEditorComponent to sync this specific property change to Zustand
    if (this.onPropertyChangeForSync) {
      this.onPropertyChangeForSync(this.id, key, value);
    }

    // Record history: History plugin compares node.data() snapshots.
    // So, simply calling record() after customData (part of node.data()) is updated should work.
    if (historyPlugin && typeof historyPlugin.record === 'function') {
      historyPlugin.record();
    }
    return true;
  }

  onPropertyChanged(propertyName, newValue) {
    // console.log(`Node ${this.id} property '${propertyName}' changed to:`, newValue);
  }

  async execute(inputs, forward) {
    throw new Error("Execute method must be implemented in subclasses for dataflow processing.");
  }

  async onProcess(inputsData) {
    throw new Error("onProcess method must be implemented in subclasses.");
  }

  async callBackendAPI(endpoint, data = {}, method = 'POST') {
    try {
      let headers = { };
      let body = undefined;

      if (method !== 'GET') {
        if (data.video_file instanceof File || data.video_file instanceof Blob) {
          const formData = new FormData();
          formData.append('video_file', data.video_file);
          // Append other data properties to FormData as JSON string or individual fields
          // For complex objects, it's often easier to stringify them
          const { video_file, ...otherData } = data;
          formData.append('effects', JSON.stringify(otherData.effects)); // Assuming 'effects' is the only other complex object

          body = formData;
          // When using FormData, the browser automatically sets the Content-Type header to multipart/form-data
          // Do not set Content-Type header manually, as it will be incorrect.
        } else {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(data);
        }
      }

      const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
        method,
        headers,
        body,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Backend API error: ${response.statusText} (${response.status}) - ${errorBody}`);
      }
      return await response.json();
    } catch (error) {
      this.errorState = error.message;
      console.error(`Backend API call failed for ${this.nodeName} (${this.id}) on ${endpoint}:`, error);
      throw error;
    }
  }

  connectWebSocket(path) {
    if (this.websocketConnected && this.websocket) return;
    // Use shared utility for WebSocket connection
    const { createWebSocket } = require('../../utils/WebSocketUtils.js');
    this.websocket = createWebSocket({
      apiEndpoint: this.apiEndpoint,
      path,
      onOpen: (ws) => {
        this.websocketConnected = true;
        this.onWebSocketConnected(ws);
      },
      onMessage: (data) => {
        this.onWebSocketMessage(data);
      },
      onClose: () => {
        this.websocketConnected = false;
        this.onWebSocketDisconnected();
        this.websocket = null;
      },
      onError: (error) => {
        this.errorState = 'WebSocket error';
        console.error('WS error', error);
      }
    });
  }

  onWebSocketConnected(ws) { /* For subclasses */ }
  onWebSocketMessage(data) { /* For subclasses */ }
  onWebSocketDisconnected() { /* For subclasses */ }

  destroy() {
    if (this.websocket) this.websocket.close();
  }
}

export default MyBaseReteNode;
