// src/utils/ContextMenuExtensions.js
/* global LiteGraph */

export class ContextMenuExtensions {
  constructor() {
    this.providers = new Map();
    this.audioTriggerCallbacks = new Map();
    this.beatQuantizeCallbacks = new Map();
  }

  setupContextMenu(graphCanvas, callbacks) {
    if (!graphCanvas || !window.LiteGraph) {
      console.warn('Cannot setup context menu extensions - missing dependencies');
      return;
    }

    this.callbacks = callbacks || {};
    this.graphCanvas = graphCanvas;

    // Store original context menu function
    this.originalGetContextMenuOptions = graphCanvas.getContextMenuOptions;
    
    // Override context menu to add custom options
    graphCanvas.getContextMenuOptions = this.getEnhancedContextMenuOptions.bind(this);

    // Register default context menu providers
    this.registerDefaultProviders();
  }

  registerDefaultProviders() {
    // Audio-specific context menu provider
    this.registerContextMenuProvider('audio', (context) => {
      const { node, graphCanvas, pos } = context;
      const options = [];

      if (node && node.type?.startsWith('audio/')) {
        options.push({
          content: "🎵 Add Audio Trigger",
          callback: () => {
            if (this.callbacks.onAddAudioTrigger) {
              this.callbacks.onAddAudioTrigger(node.id, pos);
            }
            this.addAudioTrigger(node, pos);
          }
        });

        options.push({
          content: "🎯 Quantize to Beat",
          callback: () => {
            if (this.callbacks.onQuantizeToBeat) {
              this.callbacks.onQuantizeToBeat(node.id);
            }
            this.quantizeToBeat(node);
          }
        });

        if (node.type === 'audio/beat-detector') {
          options.push({
            content: "📊 Show Beat Analysis",
            callback: () => this.showBeatAnalysis(node)
          });
        }

        if (node.type === 'audio/spectral-analyser') {
          options.push({
            content: "🔊 View Spectrum",
            callback: () => this.showSpectrumView(node)
          });
        }
      }

      return options;
    });

    // Visual-specific context menu provider
    this.registerContextMenuProvider('visual', (context) => {
      const { node, graphCanvas, pos } = context;
      const options = [];

      if (node && node.type?.startsWith('visual/')) {
        options.push({
          content: "🎨 Copy Visual Style",
          callback: () => this.copyVisualStyle(node)
        });

        options.push({
          content: "📸 Capture Preview",
          callback: () => this.capturePreview(node)
        });

        if (node.type === 'visual/shader-effect') {
          options.push({
            content: "✨ Edit Shader",
            callback: () => this.openShaderEditor(node)
          });
        }

        if (node.type === 'visual/particle-system') {
          options.push({
            content: "💫 Reset Particles",
            callback: () => this.resetParticles(node)
          });
        }
      }

      return options;
    });

    // Control-specific context menu provider
    this.registerContextMenuProvider('control', (context) => {
      const { node, graphCanvas, pos } = context;
      const options = [];

      if (node && node.type?.startsWith('control/')) {
        options.push({
          content: "🎚️ MIDI Learn",
          callback: () => this.setupMidiLearn(node)
        });

        if (node.type === 'control/sequencer') {
          options.push({
            content: "🔄 Randomize Pattern",
            callback: () => this.randomizeSequencer(node)
          });
          
          options.push({
            content: "📝 Edit Pattern",
            callback: () => this.openPatternEditor(node)
          });
        }

        if (node.type === 'control/envelope') {
          options.push({
            content: "📈 Preset Shapes",
            submenu: [
              { content: "Linear", callback: () => this.setEnvelopePreset(node, 'linear') },
              { content: "Exponential", callback: () => this.setEnvelopePreset(node, 'exponential') },
              { content: "Logarithmic", callback: () => this.setEnvelopePreset(node, 'logarithmic') }
            ]
          });
        }
      }

      return options;
    });

    // Node grouping context menu provider
    this.registerContextMenuProvider('grouping', (context) => {
      const { selectedNodes, graphCanvas } = context;
      const options = [];

      if (selectedNodes && selectedNodes.length > 1) {
        options.push({
          content: `📦 Group ${selectedNodes.length} Nodes`,
          callback: () => {
            if (this.callbacks.onGroupNodes) {
              this.callbacks.onGroupNodes(selectedNodes);
            }
          }
        });

        options.push({
          content: "⚡ Create Macro",
          callback: () => this.createMacro(selectedNodes)
        });

        // Alignment options
        options.push({
          content: "📐 Align",
          submenu: [
            { content: "🔲 To Grid", callback: () => this.alignToGrid(selectedNodes) },
            { content: "↔️ Horizontally", callback: () => this.alignHorizontal(selectedNodes) },
            { content: "↕️ Vertically", callback: () => this.alignVertical(selectedNodes) },
            { content: "📊 Distribute Evenly", callback: () => this.distributeEvenly(selectedNodes) }
          ]
        });

        // Organization by type
        const nodeTypes = [...new Set(selectedNodes.map(n => n.type?.split('/')[0]))];
        if (nodeTypes.length > 1) {
          options.push({
            content: "🏷️ Organize by Type",
            callback: () => this.organizeByType(selectedNodes)
          });
        }
      }

      return options;
    });

    // General utility context menu provider
    this.registerContextMenuProvider('utility', (context) => {
      const { node, graphCanvas, pos, selectedNodes } = context; // Added selectedNodes
      const options = [];

      // Determine target nodes: right-clicked node or selected nodes
      let targetNodes = [];
      if (node && selectedNodes && selectedNodes.some(n => n.id === node.id)) {
        // If right-clicked node is part of current selection, target all selected nodes
        targetNodes = selectedNodes;
      } else if (node) {
        // Otherwise, target only the right-clicked node
        targetNodes = [node];
      }


      if (targetNodes.length > 0) {
        const multiNode = targetNodes.length > 1;
        options.push({
          content: `❌ Delete Node${multiNode ? 's' : ''}`,
          callback: () => {
            if (this.callbacks.onDeleteNodes) {
              this.callbacks.onDeleteNodes(targetNodes);
            }
          }
        });

        options.push({
          content: `🐑 Duplicate Node${multiNode ? 's' : ''}`,
          callback: () => {
            if (this.callbacks.onDuplicateNodes) {
              this.callbacks.onDuplicateNodes(targetNodes);
            }
          }
        });
        options.push(null); // Separator
      }

      if (node) { // Options specific to a single right-clicked node
        options.push({
          content: "📋 Copy Settings",
          callback: () => this.copyNodeSettings(node)
        });

        options.push({
          content: "📄 Paste Settings",
          callback: () => this.pasteNodeSettings(node),
          disabled: !this.hasClipboardSettings()
        });

        options.push({
          content: "🔄 Reset to Default",
          callback: () => this.resetNodeToDefault(node)
        });

        options.push({
          content: "💾 Save as Preset",
          callback: () => this.saveAsPreset(node)
        });

        options.push({
          content: "📖 Show Documentation",
          callback: () => this.showNodeDocumentation(node)
        });
      }

      return options;
    });

    // Live/Studio mode context menu provider
    this.registerContextMenuProvider('mode', (context) => {
      const { node, graphCanvas } = context;
      const options = [];

      if (node) {
        const isLiveMode = this.isLiveMode();
        
        options.push({
          content: isLiveMode ? "🎹 Switch to Studio" : "🎤 Switch to Live",
          callback: () => this.toggleMode()
        });

        if (isLiveMode) {
          options.push({
            content: "⚡ Performance Mode",
            callback: () => this.enablePerformanceMode(node)
          });
        } else {
          options.push({
            content: "🎬 Recording Mode",
            callback: () => this.enableRecordingMode(node)
          });
        }
      }

      return options;
    });
  }

  registerContextMenuProvider(name, provider) {
    this.providers.set(name, provider);
  }

  getEnhancedContextMenuOptions() {
    // Get original options
    const originalOptions = this.originalGetContextMenuOptions ? 
      this.originalGetContextMenuOptions.call(this.graphCanvas) : [];

    const selectedNodes = this.getSelectedNodes();
    const clickedNode = this.getNodeAtPosition();
    
    const context = {
      node: clickedNode,
      selectedNodes: selectedNodes,
      graphCanvas: this.graphCanvas,
      pos: this.graphCanvas.graph_mouse
    };

    // Collect options from all providers
    const enhancedOptions = [];
    
    for (const [name, provider] of this.providers) {
      try {
        const providerOptions = provider(context);
        if (Array.isArray(providerOptions) && providerOptions.length > 0) {
          if (enhancedOptions.length > 0) {
            enhancedOptions.push(null); // Separator
          }
          enhancedOptions.push(...providerOptions);
        }
      } catch (error) {
        console.warn(`Context menu provider '${name}' failed:`, error);
      }
    }

    // Combine with original options
    if (originalOptions.length > 0 && enhancedOptions.length > 0) {
      return [...originalOptions, null, ...enhancedOptions];
    }
    
    return originalOptions.length > 0 ? originalOptions : enhancedOptions;
  }

  // Audio-specific methods
  addAudioTrigger(node, position) {
    const trigger = {
      id: crypto.randomUUID(),
      nodeId: node.id,
      position: position,
      type: 'audio-trigger',
      timestamp: Date.now()
    };
    
    // Add trigger visualization
    this.visualizeTrigger(trigger);
    
    // Store trigger data
    if (!node.triggers) node.triggers = [];
    node.triggers.push(trigger);
    
    console.log('Added audio trigger:', trigger);
  }

  quantizeToBeat(node) {
    if (!node || !node.type?.startsWith('audio/')) return;
    
    // Get BPM from connected beat detector or global tempo
    const bpm = this.getBPMForNode(node) || 120;
    const beatInterval = 60 / bpm; // seconds per beat
    
    // Quantize node timing to nearest beat
    if (node.triggerTime) {
      const quantizedTime = Math.round(node.triggerTime / beatInterval) * beatInterval;
      node.triggerTime = quantizedTime;
      node.setDirtyCanvas(true);
      console.log(`Quantized node ${node.id} to beat: ${quantizedTime}s`);
    }
  }

  showBeatAnalysis(node) {
    // Create floating analysis window
    const analysisWindow = this.createFloatingWindow('Beat Analysis', {
      width: 300,
      height: 200,
      content: this.createBeatAnalysisContent(node)
    });
  }

  showSpectrumView(node) {
    const spectrumWindow = this.createFloatingWindow('Spectrum View', {
      width: 400,
      height: 300,
      content: this.createSpectrumViewContent(node)
    });
  }

  // Visual-specific methods
  copyVisualStyle(node) {
    const style = this.extractVisualStyle(node);
    this.clipboard = { type: 'visual-style', data: style };
    console.log('Copied visual style from node:', node.id);
  }

  capturePreview(node) {
    // Capture current visual output as image
    if (node.nodeInstance && node.nodeInstance.captureFrame) {
      const imageData = node.nodeInstance.captureFrame();
      this.downloadImage(imageData, `preview-${node.id}-${Date.now()}.png`);
    }
  }

  openShaderEditor(node) {
    const editorWindow = this.createFloatingWindow('Shader Editor', {
      width: 600,
      height: 400,
      content: this.createShaderEditorContent(node)
    });
  }

  resetParticles(node) {
    if (node.nodeInstance && node.nodeInstance.resetParticles) {
      node.nodeInstance.resetParticles();
      console.log('Reset particles for node:', node.id);
    }
  }

  // Control-specific methods
  setupMidiLearn(node) {
    console.log('Setting up MIDI learn for node:', node.id);
    // Enable MIDI learning mode
    node.midiLearning = true;
    node.setDirtyCanvas(true);
    
    // Listen for next MIDI message
    this.enableMidiLearning(node);
  }

  randomizeSequencer(node) {
    if (node.type !== 'control/sequencer') return;
    
    const steps = node.properties.steps || 8;
    const randomValues = Array.from({ length: steps }, () => Math.random());
    node.setProperty('values', randomValues.join(','));
    console.log('Randomized sequencer pattern for node:', node.id);
  }

  openPatternEditor(node) {
    const editorWindow = this.createFloatingWindow('Pattern Editor', {
      width: 500,
      height: 300,
      content: this.createPatternEditorContent(node)
    });
  }

  setEnvelopePreset(node, presetType) {
    const presets = {
      linear: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.5 },
      exponential: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 1.2 },
      logarithmic: { attack: 0.3, decay: 0.1, sustain: 0.9, release: 0.2 }
    };
    
    const preset = presets[presetType];
    if (preset) {
      Object.entries(preset).forEach(([key, value]) => {
        node.setProperty(key, value);
      });
      console.log(`Applied ${presetType} envelope preset to node:`, node.id);
    }
  }

  // Utility methods
  getSelectedNodes() {
    if (!this.graphCanvas || !this.graphCanvas.selected_nodes) return [];
    return Object.values(this.graphCanvas.selected_nodes);
  }

  getNodeAtPosition() {
    if (!this.graphCanvas || !this.graphCanvas.graph_mouse) return null;
    return this.graphCanvas.graph.getNodeOnPos(
      this.graphCanvas.graph_mouse[0],
      this.graphCanvas.graph_mouse[1]
    );
  }

  getBPMForNode(node) {
    // Look for connected beat detector or global BPM
    if (!this.graphCanvas || !this.graphCanvas.graph) return null;
    
    // Check for connected beat detector
    for (const link of this.graphCanvas.graph.links) {
      if (link && link.target_id === node.id) {
        const sourceNode = this.graphCanvas.graph.getNodeById(link.origin_id);
        if (sourceNode && sourceNode.type === 'audio/beat-detector') {
          return sourceNode.properties?.bpm || sourceNode.lastBPM;
        }
      }
    }
    
    return null;
  }

  visualizeTrigger(trigger) {
    // Add visual indicator at trigger position
    const indicator = document.createElement('div');
    indicator.className = 'trigger-indicator';
    indicator.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: #ff4444;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      animation: pulse 0.5s ease-out;
    `;
    
    // Position relative to canvas
    const rect = this.graphCanvas.canvas.getBoundingClientRect();
    indicator.style.left = (rect.left + trigger.position[0]) + 'px';
    indicator.style.top = (rect.top + trigger.position[1]) + 'px';
    
    document.body.appendChild(indicator);
    
    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(indicator);
    }, 500);
  }

  createFloatingWindow(title, options) {
    const window = document.createElement('div');
    window.className = 'floating-window';
    window.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${options.width}px;
      height: ${options.height}px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      flex-direction: column;
    `;
    
    // Title bar
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      padding: 8px 12px;
      background: #333;
      border-radius: 7px 7px 0 0;
      font-weight: bold;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    titleBar.textContent = title;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
    `;
    closeBtn.onclick = () => document.body.removeChild(window);
    titleBar.appendChild(closeBtn);
    
    // Content area
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      padding: 12px;
      overflow: auto;
      color: white;
    `;
    content.appendChild(options.content);
    
    window.appendChild(titleBar);
    window.appendChild(content);
    document.body.appendChild(window);
    
    return window;
  }

  createBeatAnalysisContent(node) {
    const container = document.createElement('div');
    container.innerHTML = `
      <h3>Beat Analysis - ${node.title}</h3>
      <div>BPM: <span id="bpm-value">--</span></div>
      <div>Confidence: <span id="confidence-value">--</span></div>
      <div>Time Signature: <span id="time-sig-value">4/4</span></div>
      <canvas id="beat-visualization" width="260" height="100" style="border: 1px solid #444; margin-top: 10px;"></canvas>
    `;
    return container;
  }

  createSpectrumViewContent(node) {
    const container = document.createElement('div');
    container.innerHTML = `
      <h3>Spectrum View - ${node.title}</h3>
      <canvas id="spectrum-canvas" width="360" height="200" style="border: 1px solid #444;"></canvas>
      <div style="margin-top: 10px;">
        <label>Range: <select id="freq-range">
          <option value="full">Full (20Hz - 20kHz)</option>
          <option value="low">Low (20Hz - 250Hz)</option>
          <option value="mid">Mid (250Hz - 4kHz)</option>
          <option value="high">High (4kHz - 20kHz)</option>
        </select></label>
      </div>
    `;
    return container;
  }

  isLiveMode() {
    // Check current application mode
    return window.monograuvi?.mode === 'live' || false;
  }

  toggleMode() {
    const currentMode = this.isLiveMode() ? 'studio' : 'live';
    if (window.monograuvi) {
      window.monograuvi.mode = currentMode;
    }
    console.log('Switched to', currentMode, 'mode');
  }

  hasClipboardSettings() {
    return this.clipboard && this.clipboard.type === 'node-settings';
  }

  copyNodeSettings(node) {
    this.clipboard = {
      type: 'node-settings',
      data: { ...node.properties }
    };
    console.log('Copied node settings:', node.id);
  }

  pasteNodeSettings(node) {
    if (this.hasClipboardSettings()) {
      Object.entries(this.clipboard.data).forEach(([key, value]) => {
        if (node.properties.hasOwnProperty(key)) {
          node.setProperty(key, value);
        }
      });
      console.log('Pasted settings to node:', node.id);
    }
  }

  resetNodeToDefault(node) {
    // Reset all properties to their default values
    if (node.constructor.defaultProperties) {
      Object.entries(node.constructor.defaultProperties).forEach(([key, value]) => {
        node.setProperty(key, value);
      });
    }
    console.log('Reset node to defaults:', node.id);
  }

  saveAsPreset(node) {
    const presetName = prompt('Enter preset name:');
    if (presetName) {
      const preset = {
        name: presetName,
        nodeType: node.type,
        properties: { ...node.properties },
        created: new Date().toISOString()
      };
      
      // Save to local storage
      const presets = JSON.parse(localStorage.getItem('monograuvi-presets') || '[]');
      presets.push(preset);
      localStorage.setItem('monograuvi-presets', JSON.stringify(presets));
      
      console.log('Saved preset:', presetName);
    }
  }

  showNodeDocumentation(node) {
    // Open documentation for node type
    const nodeType = node.type;
    const docsUrl = `https://docs.monograuvi.com/nodes/${nodeType.replace('/', '-')}`;
    window.open(docsUrl, '_blank');
  }
}

export default ContextMenuExtensions;
