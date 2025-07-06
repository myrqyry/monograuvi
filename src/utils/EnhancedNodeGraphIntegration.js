// src/utils/EnhancedNodeGraphIntegration.js
// Central integration point for all ComfyAnonymous-fork features

import { EnhancedWidgets } from './EnhancedWidgets.js';
import { ContextMenuExtensions } from './ContextMenuExtensions.js';
import { NodeGroupingHelpers } from './NodeGroupingHelpers.js';
import { ThemeManager } from './ThemeManager.js';
import { SearchEnhancements } from './SearchEnhancements.js';

export class EnhancedNodeGraphIntegration {
  constructor() {
    this.enhancedWidgets = null;
    this.contextMenuExtensions = null;
    this.nodeGroupingHelpers = null;
    this.themeManager = null;
    this.searchEnhancements = null;
    this.isInitialized = false;
    this.callbacks = new Map();
  }

  async initialize(graphCanvas, options = {}) {
    if (this.isInitialized) {
      console.warn('Enhanced node graph already initialized');
      return;
    }

    console.log('Initializing Enhanced Node Graph Integration...');

    try {
      // Initialize all enhancement systems
      this.enhancedWidgets = new EnhancedWidgets();
      this.contextMenuExtensions = new ContextMenuExtensions();
      this.nodeGroupingHelpers = new NodeGroupingHelpers();
      this.themeManager = new ThemeManager();
      this.searchEnhancements = new SearchEnhancements();

      // Set up integrations
      await this.setupEnhancedWidgets(options.widgets);
      await this.setupContextMenus(graphCanvas, options.contextMenus);
      await this.setupNodeGrouping(options.grouping);
      await this.setupThemeManager(options.theming);
      await this.setupSearchEnhancements(graphCanvas, options.search);

      // Set up cross-system integrations
      this.setupSystemIntegrations();

      // Load CSS if needed
      this.loadEnhancedStyles();

      this.isInitialized = true;
      console.log('Enhanced Node Graph Integration initialized successfully');

      // Dispatch initialization event
      document.dispatchEvent(new CustomEvent('enhancedNodeGraphReady', {
        detail: { integration: this }
      }));

    } catch (error) {
      console.error('Failed to initialize Enhanced Node Graph:', error);
      throw error;
    }
  }

  async setupEnhancedWidgets(options = {}) {
    if (!this.enhancedWidgets) return;

    // Register all enhanced widgets
    this.enhancedWidgets.registerWidgets();

    // Apply custom widget configurations
    if (options.customWidgets) {
      for (const [type, config] of Object.entries(options.customWidgets)) {
        this.enhancedWidgets.registerCustomWidget(type, config);
      }
    }

    console.log('Enhanced widgets initialized');
  }

  async setupContextMenus(graphCanvas, options = {}) {
    if (!this.contextMenuExtensions || !graphCanvas) return;

    const callbacks = {
      onAddAudioTrigger: (nodeId, position) => {
        this.handleAudioTrigger(nodeId, position);
      },
      onQuantizeToBeat: (nodeId) => {
        this.handleBeatQuantization(nodeId);
      },
      onGroupNodes: (selectedNodes) => {
        if (this.nodeGroupingHelpers) {
          this.nodeGroupingHelpers.groupNodes(selectedNodes, graphCanvas.graph);
        }
      },
      onUnGroupNodes: (group) => {
        if (this.nodeGroupingHelpers) {
          this.nodeGroupingHelpers.unGroupNodes(group, graphCanvas.graph);
        }
      },
      ...options.callbacks
    };

    this.contextMenuExtensions.setupContextMenu(graphCanvas, callbacks);

    console.log('Context menu extensions initialized');
  }

  async setupNodeGrouping(options = {}) {
    if (!this.nodeGroupingHelpers) return;

    // Configure grouping options
    if (options.gridSize) {
      this.nodeGroupingHelpers.gridSize = options.gridSize;
    }

    if (options.nodeSpacing) {
      this.nodeGroupingHelpers.nodeSpacing = options.nodeSpacing;
    }

    // Load saved macros
    const savedMacros = this.nodeGroupingHelpers.loadMacros();
    console.log(`Loaded ${savedMacros.length} saved macros`);

    console.log('Node grouping helpers initialized');
  }

  async setupThemeManager(options = {}) {
    if (!this.themeManager) return;

    // Load saved theme preference
    const savedTheme = this.themeManager.loadThemePreference();
    
    // Apply initial theme
    const initialTheme = options.initialTheme || savedTheme || 'dark';
    this.themeManager.applyTheme(initialTheme);

    // Set up auto theme switching if requested
    if (options.autoThemeSwitch) {
      this.themeManager.enableAutoThemeSwitch();
    }

    // Load custom themes
    if (options.customThemes) {
      for (const [name, themeData] of Object.entries(options.customThemes)) {
        this.themeManager.importTheme(JSON.stringify(themeData));
      }
    }

    console.log('Theme manager initialized with theme:', initialTheme);
  }

  async setupSearchEnhancements(graphCanvas, options = {}) {
    if (!this.searchEnhancements || !graphCanvas) return;

    const callbacks = {
      onSearchFiltered: (data) => {
        console.log(`Search found ${data.results.length} results`);
        this.triggerCallback('searchFiltered', data);
      },
      onSearchItemHighlight: (data) => {
        this.triggerCallback('searchItemHighlight', data);
      },
      ...options.callbacks
    };

    this.searchEnhancements.setupSearchEvents(graphCanvas, callbacks);

    // Load search history
    this.searchEnhancements.loadSearchHistory();

    // Set custom search threshold if provided
    if (options.fuzzySearchThreshold) {
      this.searchEnhancements.fuzzySearchThreshold = options.fuzzySearchThreshold;
    }

    console.log('Search enhancements initialized');
  }

  setupSystemIntegrations() {
    // Audio reactive theme integration
    if (this.themeManager && this.searchEnhancements) {
      document.addEventListener('audioAnalysis', (event) => {
        if (this.themeManager.currentTheme === 'audio-reactive') {
          this.themeManager.handleAudioAnalysis(event);
        }
      });
    }

    // Search integration with grouping
    if (this.searchEnhancements && this.nodeGroupingHelpers) {
      document.addEventListener('search:filtered', (event) => {
        const { results } = event.detail;
        if (results.length > 0) {
          // Auto-highlight search results
          this.searchEnhancements.highlightSearchResults(results);
        }
      });
    }

    // Theme integration with context menus
    if (this.themeManager && this.contextMenuExtensions) {
      document.addEventListener('themeChanged', (event) => {
        const { theme } = event.detail;
        // Update context menu styling if needed
        this.contextMenuExtensions.updateTheme(theme);
      });
    }

    // Widget integration with themes
    if (this.enhancedWidgets && this.themeManager) {
      document.addEventListener('themeChanged', (event) => {
        const { colors } = event.detail;
        this.enhancedWidgets.updateWidgetColors(colors);
      });
    }

    console.log('System integrations configured');
  }

  loadEnhancedStyles() {
    // Check if styles are already loaded
    if (document.querySelector('#enhanced-node-graph-styles')) {
      return;
    }

    // Create link to CSS file
    const link = document.createElement('link');
    link.id = 'enhanced-node-graph-styles';
    link.rel = 'stylesheet';
    link.href = '/src/styles/enhanced-node-graph.css';
    document.head.appendChild(link);

    console.log('Enhanced node graph styles loaded');
  }

  // Audio trigger handling
  handleAudioTrigger(nodeId, position) {
    console.log(`Adding audio trigger for node ${nodeId} at`, position);
    
    // Create trigger data
    const trigger = {
      id: crypto.randomUUID(),
      nodeId: nodeId,
      position: position,
      timestamp: Date.now(),
      type: 'audio-reactive'
    };

    // Store in global triggers if store is available
    if (window.useStore) {
      const store = window.useStore.getState();
      if (store.addTrigger) {
        store.addTrigger(trigger.timestamp / 1000); // Convert to seconds
      }
    }

    this.triggerCallback('audioTriggerAdded', { trigger });
  }

  // Beat quantization handling
  handleBeatQuantization(nodeId) {
    console.log(`Quantizing node ${nodeId} to beat`);
    
    // Get current BPM from audio analysis
    const bpm = this.getCurrentBPM();
    if (bpm) {
      const beatInterval = 60 / bpm;
      this.triggerCallback('beatQuantized', { nodeId, bpm, beatInterval });
    }
  }

  getCurrentBPM() {
    // Try to get BPM from audio analysis
    if (window.audioAnalysis && window.audioAnalysis.bpm) {
      return window.audioAnalysis.bpm;
    }
    return 120; // Default BPM
  }

  // Callback system
  registerCallback(eventType, callback) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType).push(callback);
  }

  triggerCallback(eventType, data) {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} callback:`, error);
        }
      });
    }
  }

  // Public API methods
  getThemeManager() {
    return this.themeManager;
  }

  getSearchEnhancements() {
    return this.searchEnhancements;
  }

  getNodeGroupingHelpers() {
    return this.nodeGroupingHelpers;
  }

  getContextMenuExtensions() {
    return this.contextMenuExtensions;
  }

  getEnhancedWidgets() {
    return this.enhancedWidgets;
  }

  // Quick actions API
  async performSearch(query, options = {}) {
    if (!this.searchEnhancements) return [];
    return this.searchEnhancements.quickSearch(query, options);
  }

  applyTheme(themeName) {
    if (!this.themeManager) return false;
    return this.themeManager.applyTheme(themeName);
  }

  groupSelectedNodes(nodes, layoutType = 'group') {
    if (!this.nodeGroupingHelpers || !nodes || nodes.length === 0) return null;
    
    switch (layoutType) {
      case 'group':
        return this.nodeGroupingHelpers.groupNodes(nodes);
      case 'audio-chain':
        this.nodeGroupingHelpers.arrangeAudioChain(nodes);
        break;
      case 'visual-mixer':
        this.nodeGroupingHelpers.arrangeVisualMixer(nodes);
        break;
      case 'control-panel':
        this.nodeGroupingHelpers.arrangeControlPanel(nodes);
        break;
      case 'circle':
        this.nodeGroupingHelpers.arrangeInCircle(nodes);
        break;
      default:
        this.nodeGroupingHelpers.organizeByType(nodes);
    }
    return true;
  }

  addEnhancedWidget(node, type, property, value, callback, options) {
    if (!this.enhancedWidgets) return null;
    return this.enhancedWidgets.addEnhancedWidget(node, type, property, value, callback, options);
  }

  // Cleanup
  destroy() {
    if (!this.isInitialized) return;

    // Clean up all systems
    if (this.themeManager) {
      this.themeManager.disableAudioReactivity();
    }

    if (this.searchEnhancements) {
      this.searchEnhancements.closeSearch();
    }

    // Clear callbacks
    this.callbacks.clear();

    // Reset state
    this.isInitialized = false;

    console.log('Enhanced Node Graph Integration destroyed');
  }

  // Status check
  getStatus() {
    return {
      initialized: this.isInitialized,
      systems: {
        enhancedWidgets: !!this.enhancedWidgets,
        contextMenuExtensions: !!this.contextMenuExtensions,
        nodeGroupingHelpers: !!this.nodeGroupingHelpers,
        themeManager: !!this.themeManager,
        searchEnhancements: !!this.searchEnhancements
      },
      currentTheme: this.themeManager?.getCurrentTheme(),
      availableThemes: this.themeManager?.getAvailableThemes(),
      searchActive: this.searchEnhancements?.isSearchActive
    };
  }
}

// Create global instance
export const enhancedNodeGraphIntegration = new EnhancedNodeGraphIntegration();

// Convenience function for easy initialization
export async function initializeEnhancedNodeGraph(graphCanvas, options = {}) {
  return await enhancedNodeGraphIntegration.initialize(graphCanvas, options);
}

export default EnhancedNodeGraphIntegration;
