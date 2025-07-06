// src/utils/ThemeManager.js
/* global LiteGraph */

export class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.currentTheme = 'dark';
    this.audioReactiveEnabled = false;
    this.initializeThemes();
  }

  initializeThemes() {
    // Dark theme (default)
    this.themes.set('dark', {
      name: 'Dark',
      colors: {
        background: '#1e1e1e',
        canvasBackground: '#2a2a2a',
        nodeBackground: '#3a3a3a',
        nodeBackgroundSelected: '#4a4a4a',
        nodeBorder: '#555555',
        nodeBorderSelected: '#00d9ff',
        nodeText: '#ffffff',
        nodeTextSecondary: '#cccccc',
        linkColor: '#888888',
        linkColorSelected: '#00d9ff',
        linkColorActive: '#ff6b6b',
        gridColor: '#404040',
        selectionColor: '#00d9ff',
        errorColor: '#ff4444',
        warningColor: '#ffaa00',
        successColor: '#44ff44'
      },
      canvas: {
        background_image: null,
        clear_background: true,
        clear_background_color: '#2a2a2a',
        render_shadows: false,
        render_canvas_border: false,
        render_connections_shadows: false,
        render_link_tooltip: true
      },
      node: {
        text_color: '#ffffff',
        text_color_selected: '#ffffff',
        text_size: 14,
        subtext_size: 12,
        title_height: 24,
        border_radius: 4,
        shadow_offset: [2, 2],
        shadow_color: 'rgba(0,0,0,0.5)'
      }
    });

    // Light theme
    this.themes.set('light', {
      name: 'Light',
      colors: {
        background: '#f5f5f5',
        canvasBackground: '#ffffff',
        nodeBackground: '#f9f9f9',
        nodeBackgroundSelected: '#e9e9e9',
        nodeBorder: '#d0d0d0',
        nodeBorderSelected: '#007acc',
        nodeText: '#333333',
        nodeTextSecondary: '#666666',
        linkColor: '#666666',
        linkColorSelected: '#007acc',
        linkColorActive: '#ff6b6b',
        gridColor: '#e0e0e0',
        selectionColor: '#007acc',
        errorColor: '#cc4444',
        warningColor: '#cc8800',
        successColor: '#44cc44'
      },
      canvas: {
        background_image: null,
        clear_background: true,
        clear_background_color: '#ffffff',
        render_shadows: true,
        render_canvas_border: true,
        render_connections_shadows: true,
        render_link_tooltip: true
      },
      node: {
        text_color: '#333333',
        text_color_selected: '#333333',
        text_size: 14,
        subtext_size: 12,
        title_height: 24,
        border_radius: 4,
        shadow_offset: [1, 1],
        shadow_color: 'rgba(0,0,0,0.2)'
      }
    });

    // High contrast theme
    this.themes.set('high-contrast', {
      name: 'High Contrast',
      colors: {
        background: '#000000',
        canvasBackground: '#000000',
        nodeBackground: '#1a1a1a',
        nodeBackgroundSelected: '#333333',
        nodeBorder: '#ffffff',
        nodeBorderSelected: '#ffff00',
        nodeText: '#ffffff',
        nodeTextSecondary: '#ffffff',
        linkColor: '#ffffff',
        linkColorSelected: '#ffff00',
        linkColorActive: '#ff0000',
        gridColor: '#444444',
        selectionColor: '#ffff00',
        errorColor: '#ff0000',
        warningColor: '#ffff00',
        successColor: '#00ff00'
      },
      canvas: {
        background_image: null,
        clear_background: true,
        clear_background_color: '#000000',
        render_shadows: false,
        render_canvas_border: true,
        render_connections_shadows: false,
        render_link_tooltip: true
      },
      node: {
        text_color: '#ffffff',
        text_color_selected: '#ffff00',
        text_size: 16,
        subtext_size: 14,
        title_height: 26,
        border_radius: 2,
        shadow_offset: [0, 0],
        shadow_color: 'transparent'
      }
    });

    // Audio reactive theme
    this.themes.set('audio-reactive', {
      name: 'Audio Reactive',
      colors: {
        background: '#0a0a0a',
        canvasBackground: '#1a1a1a',
        nodeBackground: '#2a2a2a',
        nodeBackgroundSelected: '#3a3a3a',
        nodeBorder: '#00d9ff',
        nodeBorderSelected: '#ff6b6b',
        nodeText: '#ffffff',
        nodeTextSecondary: '#00d9ff',
        linkColor: '#00d9ff',
        linkColorSelected: '#ff6b6b',
        linkColorActive: '#ffaa00',
        gridColor: '#333333',
        selectionColor: '#ff6b6b',
        errorColor: '#ff4444',
        warningColor: '#ffaa00',
        successColor: '#44ff44'
      },
      canvas: {
        background_image: null,
        clear_background: true,
        clear_background_color: '#1a1a1a',
        render_shadows: true,
        render_canvas_border: false,
        render_connections_shadows: true,
        render_link_tooltip: true
      },
      node: {
        text_color: '#ffffff',
        text_color_selected: '#ff6b6b',
        text_size: 14,
        subtext_size: 12,
        title_height: 24,
        border_radius: 6,
        shadow_offset: [2, 2],
        shadow_color: 'rgba(0,217,255,0.3)'
      },
      audioReactive: true
    });
  }

  applyTheme(themeName, canvas) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn('Theme not found:', themeName);
      return false;
    }

    this.currentTheme = themeName;
    
    // Apply theme to DOM
    this.applyDOMTheme(theme);
    
    // Apply theme to LiteGraph if available
    if (window.LiteGraph && canvas) {
      this.applyLiteGraphTheme(theme, canvas);
    }

    // Set up audio reactivity if enabled
    if (theme.audioReactive) {
      this.setupAudioReactivity();
    } else {
      this.disableAudioReactivity();
    }

    // Dispatch theme change event
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: themeName, colors: theme.colors }
    }));

    console.log('Applied theme:', themeName);
    return true;
  }

  applyDOMTheme(theme) {
    const root = document.documentElement;
    
    // Set CSS custom properties for the theme
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', this.currentTheme);

    // Apply theme-specific styles
    this.updateThemeStyles(theme);
  }

  applyLiteGraphTheme(theme, canvas) {
    if (!window.LiteGraph) return;

    const LiteGraph = window.LiteGraph;
    
    // Apply canvas settings
    if (canvas && canvas.graphCanvas) {
      const graphCanvas = canvas.graphCanvas;
      Object.assign(graphCanvas, theme.canvas);
    }

    // Override LiteGraph color constants
    if (LiteGraph.NODE_DEFAULT_COLOR) {
      LiteGraph.NODE_DEFAULT_COLOR = theme.colors.nodeBackground;
    }
    if (LiteGraph.NODE_SELECTED_COLOR) {
      LiteGraph.NODE_SELECTED_COLOR = theme.colors.nodeBackgroundSelected;
    }
    if (LiteGraph.NODE_TEXT_COLOR) {
      LiteGraph.NODE_TEXT_COLOR = theme.colors.nodeText;
    }
    if (LiteGraph.LINK_COLOR) {
      LiteGraph.LINK_COLOR = theme.colors.linkColor;
    }

    // Apply node styling
    const originalDrawNode = LiteGraph.LGraphCanvas.prototype.drawNode;
    LiteGraph.LGraphCanvas.prototype.drawNode = function(node, ctx) {
      // Temporarily override colors
      const oldFillStyle = ctx.fillStyle;
      const oldStrokeStyle = ctx.strokeStyle;
      
      // Apply theme colors
      if (node.selected) {
        ctx.fillStyle = theme.colors.nodeBackgroundSelected;
        ctx.strokeStyle = theme.colors.nodeBorderSelected;
      } else {
        ctx.fillStyle = theme.colors.nodeBackground;
        ctx.strokeStyle = theme.colors.nodeBorder;
      }
      
      const result = originalDrawNode.call(this, node, ctx);
      
      // Restore original colors
      ctx.fillStyle = oldFillStyle;
      ctx.strokeStyle = oldStrokeStyle;
      
      return result;
    };

    // Apply link styling
    const originalDrawLink = LiteGraph.LGraphCanvas.prototype.drawConnections;
    LiteGraph.LGraphCanvas.prototype.drawConnections = function(ctx) {
      const oldStrokeStyle = ctx.strokeStyle;
      ctx.strokeStyle = theme.colors.linkColor;
      
      const result = originalDrawLink.call(this, ctx);
      
      ctx.strokeStyle = oldStrokeStyle;
      return result;
    };
  }

  updateThemeStyles(theme) {
    // Create or update theme-specific CSS
    let themeStyleSheet = document.getElementById('theme-styles');
    if (!themeStyleSheet) {
      themeStyleSheet = document.createElement('style');
      themeStyleSheet.id = 'theme-styles';
      document.head.appendChild(themeStyleSheet);
    }

    const css = this.generateThemeCSS(theme);
    themeStyleSheet.textContent = css;
  }

  generateThemeCSS(theme) {
    return `
      /* Enhanced Node Graph Theme: ${theme.name} */
      .enhanced-node-graph-container[data-theme="${this.currentTheme}"] {
        background-color: ${theme.colors.background};
        color: ${theme.colors.nodeText};
      }
      
      .enhanced-node-graph-container[data-theme="${this.currentTheme}"] .enhanced-graph-toolbar {
        background-color: ${theme.colors.nodeBackground};
        border-bottom: 1px solid ${theme.colors.nodeBorder};
      }
      
      .enhanced-node-graph-container[data-theme="${this.currentTheme}"] .toolbar-btn {
        background-color: transparent;
        color: ${theme.colors.nodeText};
        border: 1px solid ${theme.colors.nodeBorder};
      }
      
      .enhanced-node-graph-container[data-theme="${this.currentTheme}"] .toolbar-btn:hover {
        background-color: ${theme.colors.nodeBackgroundSelected};
        border-color: ${theme.colors.nodeBorderSelected};
      }
      
      .enhanced-node-graph-container[data-theme="${this.currentTheme}"] .search-input {
        background-color: ${theme.colors.nodeBackground};
        color: ${theme.colors.nodeText};
        border: 1px solid ${theme.colors.nodeBorder};
      }
      
      .enhanced-node-graph-container[data-theme="${this.currentTheme}"] .theme-selector {
        background-color: ${theme.colors.nodeBackground};
        color: ${theme.colors.nodeText};
        border: 1px solid ${theme.colors.nodeBorder};
      }
      
      .enhanced-node-graph-container[data-theme="${this.currentTheme}"] .graph-status-bar {
        background-color: ${theme.colors.nodeBackground};
        color: ${theme.colors.nodeTextSecondary};
        border-top: 1px solid ${theme.colors.nodeBorder};
      }
      
      .enhanced-node-graph-container[data-theme="${this.currentTheme}"] .enhanced-litegraph {
        background-color: ${theme.colors.canvasBackground};
      }
      
      /* Floating windows */
      [data-theme="${this.currentTheme}"] .floating-window {
        background-color: ${theme.colors.nodeBackground};
        border-color: ${theme.colors.nodeBorder};
        color: ${theme.colors.nodeText};
      }
      
      /* Trigger indicators */
      [data-theme="${this.currentTheme}"] .trigger-indicator {
        background-color: ${theme.colors.linkColorActive};
        box-shadow: 0 0 10px ${theme.colors.linkColorActive};
      }
      
      /* Audio reactive effects */
      ${theme.audioReactive ? this.generateAudioReactiveCSS(theme) : ''}
    `;
  }

  generateAudioReactiveCSS(theme) {
    return `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes glow {
        0% { box-shadow: 0 0 5px ${theme.colors.nodeBorderSelected}; }
        50% { box-shadow: 0 0 20px ${theme.colors.nodeBorderSelected}; }
        100% { box-shadow: 0 0 5px ${theme.colors.nodeBorderSelected}; }
      }
      
      .enhanced-node-graph-container[data-theme="audio-reactive"] .toolbar-btn.active {
        animation: glow 2s ease-in-out infinite;
      }
      
      .enhanced-node-graph-container[data-theme="audio-reactive"] .audio-reactive-node {
        animation: pulse 0.5s ease-in-out infinite;
      }
    `;
  }

  setupAudioReactivity() {
    if (this.audioReactiveEnabled) return;
    
    this.audioReactiveEnabled = true;
    console.log('Setting up audio reactive theme');
    
    // Listen for audio events
    document.addEventListener('audioAnalysis', this.handleAudioAnalysis.bind(this));
    document.addEventListener('beatDetected', this.handleBeatDetected.bind(this));
    document.addEventListener('audioLevel', this.handleAudioLevel.bind(this));
  }

  disableAudioReactivity() {
    if (!this.audioReactiveEnabled) return;
    
    this.audioReactiveEnabled = false;
    console.log('Disabling audio reactive theme');
    
    // Remove audio event listeners
    document.removeEventListener('audioAnalysis', this.handleAudioAnalysis.bind(this));
    document.removeEventListener('beatDetected', this.handleBeatDetected.bind(this));
    document.removeEventListener('audioLevel', this.handleAudioLevel.bind(this));
    
    // Reset any reactive styles
    this.resetAudioReactiveStyles();
  }

  handleAudioAnalysis(event) {
    if (!this.audioReactiveEnabled) return;
    
    const { frequencyData, timeData } = event.detail;
    
    // Update colors based on frequency data
    if (frequencyData && frequencyData.length > 0) {
      const bassLevel = this.getFrequencyRange(frequencyData, 20, 250);
      const midLevel = this.getFrequencyRange(frequencyData, 250, 4000);
      const trebleLevel = this.getFrequencyRange(frequencyData, 4000, 20000);
      
      this.updateReactiveColors(bassLevel, midLevel, trebleLevel);
    }
  }

  handleBeatDetected(event) {
    if (!this.audioReactiveEnabled) return;
    
    // Flash effect on beat
    this.triggerBeatFlash();
  }

  handleAudioLevel(event) {
    if (!this.audioReactiveEnabled) return;
    
    const { level } = event.detail;
    this.updateCanvasGlow(level);
  }

  getFrequencyRange(frequencyData, minFreq, maxFreq) {
    // Convert frequency range to array indices and calculate average
    const nyquist = 22050; // Assuming 44.1kHz sample rate
    const minIndex = Math.floor((minFreq / nyquist) * frequencyData.length);
    const maxIndex = Math.floor((maxFreq / nyquist) * frequencyData.length);
    
    let sum = 0;
    let count = 0;
    
    for (let i = minIndex; i < maxIndex && i < frequencyData.length; i++) {
      sum += frequencyData[i];
      count++;
    }
    
    return count > 0 ? sum / count / 255 : 0; // Normalize to 0-1
  }

  updateReactiveColors(bass, mid, treble) {
    const root = document.documentElement;
    
    // Create dynamic colors based on frequency content
    const bassColor = this.interpolateColor('#ff0000', '#ff6b6b', bass);
    const midColor = this.interpolateColor('#00ff00', '#00d9ff', mid);
    const trebleColor = this.interpolateColor('#0000ff', '#9b59b6', treble);
    
    // Update CSS variables
    root.style.setProperty('--audio-bass-color', bassColor);
    root.style.setProperty('--audio-mid-color', midColor);
    root.style.setProperty('--audio-treble-color', trebleColor);
    
    // Update node border colors for audio nodes
    const audioNodes = document.querySelectorAll('.audio-node');
    audioNodes.forEach((node, index) => {
      const color = [bassColor, midColor, trebleColor][index % 3];
      node.style.borderColor = color;
      node.style.boxShadow = `0 0 ${10 + bass * 20}px ${color}`;
    });
  }

  triggerBeatFlash() {
    const canvas = document.querySelector('.enhanced-litegraph');
    if (canvas) {
      canvas.style.filter = 'brightness(1.3)';
      setTimeout(() => {
        canvas.style.filter = 'brightness(1.0)';
      }, 100);
    }
  }

  updateCanvasGlow(level) {
    const canvas = document.querySelector('.enhanced-litegraph');
    if (canvas) {
      const glowIntensity = Math.floor(level * 20);
      canvas.style.filter = `drop-shadow(0 0 ${glowIntensity}px rgba(0, 217, 255, 0.5))`;
    }
  }

  interpolateColor(color1, color2, factor) {
    // Simple linear interpolation between two hex colors
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  resetAudioReactiveStyles() {
    const root = document.documentElement;
    root.style.removeProperty('--audio-bass-color');
    root.style.removeProperty('--audio-mid-color');
    root.style.removeProperty('--audio-treble-color');
    
    const canvas = document.querySelector('.enhanced-litegraph');
    if (canvas) {
      canvas.style.filter = '';
    }
    
    const audioNodes = document.querySelectorAll('.audio-node');
    audioNodes.forEach(node => {
      node.style.borderColor = '';
      node.style.boxShadow = '';
    });
  }

  // Theme management methods
  createCustomTheme(name, baseTheme, overrides) {
    const base = this.themes.get(baseTheme) || this.themes.get('dark');
    const customTheme = {
      name: name,
      colors: { ...base.colors, ...overrides.colors },
      canvas: { ...base.canvas, ...overrides.canvas },
      node: { ...base.node, ...overrides.node }
    };
    
    this.themes.set(name, customTheme);
    console.log('Created custom theme:', name);
    return customTheme;
  }

  exportTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) return null;
    
    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeData) {
    try {
      const theme = JSON.parse(themeData);
      const name = theme.name || 'imported-theme';
      this.themes.set(name, theme);
      console.log('Imported theme:', name);
      return name;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }

  getAvailableThemes() {
    return Array.from(this.themes.keys());
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getThemeColors(themeName = this.currentTheme) {
    const theme = this.themes.get(themeName);
    return theme ? theme.colors : null;
  }

  // Auto theme switching based on time
  enableAutoThemeSwitch() {
    const updateTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) {
        this.applyTheme('light');
      } else {
        this.applyTheme('dark');
      }
    };
    
    updateTheme();
    setInterval(updateTheme, 60000); // Check every minute
    console.log('Enabled auto theme switching');
  }

  // Theme persistence
  saveThemePreference(themeName) {
    localStorage.setItem('monograuvi-theme', themeName);
  }

  loadThemePreference() {
    return localStorage.getItem('monograuvi-theme') || 'dark';
  }
}

export default ThemeManager;
