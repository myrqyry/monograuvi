// src/utils/EnhancedWidgets.js
/* global LiteGraph */

export class EnhancedWidgets {
  constructor() {
    this.widgets = new Map();
    this.colorPickers = new Map();
    this.filePickers = new Map();
    this.fontPickers = new Map();
  }

  registerWidgets() {
    if (!window.LiteGraph) {
      console.warn('LiteGraph not available for enhanced widgets');
      return;
    }

    this.registerColorPicker();
    this.registerFileSelector();
    this.registerFontPicker();
    this.registerSliderWidget();
    this.registerComboWidget();
    this.registerToggleWidget();
    this.registerKnobWidget();
    this.registerTextAreaWidget();
  }

  registerColorPicker() {
    const self = this;
    
    LiteGraph.ColorPickerWidget = function(node, property, value, callback) {
      this.node = node;
      this.property = property;
      this.value = value || "#ffffff";
      this.callback = callback;
      this.type = "colorpicker";
      this.y = 0;
      this.options = {};
      this.size = [150, 20];
      
      // Create color input element
      this.element = document.createElement('input');
      this.element.type = 'color';
      this.element.value = this.value;
      this.element.style.width = '100%';
      this.element.style.height = '20px';
      this.element.style.border = 'none';
      this.element.style.borderRadius = '3px';
      
      this.element.addEventListener('change', (e) => {
        this.value = e.target.value;
        if (this.property) {
          this.node.setProperty(this.property, this.value);
        }
        if (this.callback) {
          this.callback(this.value, this);
        }
        this.node.setDirtyCanvas(true);
      });
    };

    LiteGraph.ColorPickerWidget.prototype.draw = function(ctx, node, widget_width, y, H) {
      ctx.fillStyle = "#222";
      ctx.fillRect(0, y, widget_width, H);
      
      ctx.fillStyle = this.value;
      ctx.fillRect(2, y + 2, widget_width - 4, H - 4);
      
      ctx.fillStyle = "#FFF";
      ctx.font = "10px Arial";
      ctx.fillText(this.value.toUpperCase(), 5, y + H - 5);
    };

    LiteGraph.ColorPickerWidget.prototype.mouse = function(event, pos, node) {
      if (event.type === "mousedown") {
        // Trigger color picker
        this.element.click();
        return true;
      }
      return false;
    };
  }

  registerFileSelector() {
    LiteGraph.FileSelectorWidget = function(node, property, value, callback, options) {
      this.node = node;
      this.property = property;
      this.value = value || "";
      this.callback = callback;
      this.options = options || {};
      this.type = "file";
      this.y = 0;
      this.size = [180, 20];
      
      // File types filter
      this.accept = this.options.accept || "*";
      this.multiple = this.options.multiple || false;
      
      // Create file input
      this.element = document.createElement('input');
      this.element.type = 'file';
      this.element.accept = this.accept;
      this.element.multiple = this.multiple;
      this.element.style.display = 'none';
      
      this.element.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (this.multiple) {
          this.value = files;
        } else {
          this.value = files[0] || null;
        }
        
        if (this.property) {
          this.node.setProperty(this.property, this.value);
        }
        if (this.callback) {
          this.callback(this.value, this);
        }
        this.node.setDirtyCanvas(true);
      });
      
      document.body.appendChild(this.element);

      this.onRemoved = () => {
        if (this.element.parentElement) {
          this.element.parentElement.removeChild(this.element);
        }
      };
    };

    LiteGraph.FileSelectorWidget.prototype.draw = function(ctx, node, widget_width, y, H) {
      ctx.fillStyle = "#444";
      ctx.fillRect(0, y, widget_width, H);
      
      const fileName = this.value ? 
        (this.value.name || `${this.value.length} files`) : 
        "Select file...";
      
      ctx.fillStyle = "#FFF";
      ctx.font = "11px Arial";
      ctx.fillText(fileName, 5, y + H - 5);
      
      // Browse button
      ctx.fillStyle = "#666";
      ctx.fillRect(widget_width - 50, y + 1, 48, H - 2);
      ctx.fillStyle = "#FFF";
      ctx.fillText("Browse", widget_width - 45, y + H - 5);
    };

    LiteGraph.FileSelectorWidget.prototype.mouse = function(event, pos, node) {
      if (event.type === "mousedown") {
        this.element.click();
        return true;
      }
      return false;
    };
  }

  registerFontPicker() {
    const commonFonts = [
      "Arial", "Helvetica", "Times New Roman", "Courier New", 
      "Verdana", "Georgia", "Comic Sans MS", "Trebuchet MS",
      "Arial Black", "Impact", "Lucida Console", "Tahoma"
    ];

    LiteGraph.FontPickerWidget = function(node, property, value, callback) {
      this.node = node;
      this.property = property;
      this.value = value || "Arial";
      this.callback = callback;
      this.type = "font";
      this.y = 0;
      this.size = [150, 20];
      this.fonts = commonFonts;
      this.isOpen = false;
    };

    LiteGraph.FontPickerWidget.prototype.draw = function(ctx, node, widget_width, y, H) {
      ctx.fillStyle = "#444";
      ctx.fillRect(0, y, widget_width, H);
      
      ctx.fillStyle = "#FFF";
      ctx.font = `11px ${this.value}`;
      ctx.fillText(this.value, 5, y + H - 5);
      
      // Dropdown arrow
      ctx.fillStyle = "#888";
      ctx.fillText("▼", widget_width - 15, y + H - 5);
      
      // Draw dropdown if open
      if (this.isOpen) {
        const dropdownHeight = Math.min(this.fonts.length * 20, 200);
        ctx.fillStyle = "#333";
        ctx.fillRect(0, y + H, widget_width, dropdownHeight);
        
        this.fonts.forEach((font, index) => {
          const itemY = y + H + (index * 20);
          if (itemY > y + H + dropdownHeight) return;
          
          if (font === this.value) {
            ctx.fillStyle = "#555";
            ctx.fillRect(0, itemY, widget_width, 20);
          }
          
          ctx.fillStyle = "#FFF";
          ctx.font = `11px ${font}`;
          ctx.fillText(font, 5, itemY + 15);
        });
      }
    };

    LiteGraph.FontPickerWidget.prototype.mouse = function(event, pos, node) {
      if (event.type === "mousedown") {
        if (this.isOpen) {
          // Handle font selection
          const itemIndex = Math.floor((pos[1] - (this.y + this.size[1])) / 20);
          if (itemIndex >= 0 && itemIndex < this.fonts.length) {
            this.value = this.fonts[itemIndex];
            if (this.property) {
              this.node.setProperty(this.property, this.value);
            }
            if (this.callback) {
              this.callback(this.value, this);
            }
          }
          this.isOpen = false;
        } else {
          this.isOpen = true;
        }
        this.node.setDirtyCanvas(true);
        return true;
      }
      return false;
    };
  }

  registerSliderWidget() {
    LiteGraph.SliderWidget = function(node, property, value, callback, options) {
      this.node = node;
      this.property = property;
      this.value = value || 0;
      this.callback = callback;
      this.options = options || {};
      this.type = "slider";
      this.y = 0;
      this.size = [150, 20];
      
      this.min = this.options.min || 0;
      this.max = this.options.max || 1;
      this.step = this.options.step || 0.01;
      this.precision = this.options.precision || 2;
    };

    LiteGraph.SliderWidget.prototype.draw = function(ctx, node, widget_width, y, H) {
      // Background
      ctx.fillStyle = "#444";
      ctx.fillRect(0, y, widget_width, H);
      
      // Slider track
      const trackY = y + H/2 - 2;
      ctx.fillStyle = "#222";
      ctx.fillRect(5, trackY, widget_width - 10, 4);
      
      // Slider fill
      const normalizedValue = (this.value - this.min) / (this.max - this.min);
      const fillWidth = (widget_width - 10) * normalizedValue;
      ctx.fillStyle = "#4A9EFF";
      ctx.fillRect(5, trackY, fillWidth, 4);
      
      // Slider handle
      const handleX = 5 + fillWidth - 5;
      ctx.fillStyle = "#FFF";
      ctx.fillRect(handleX, y + 2, 10, H - 4);
      
      // Value text
      ctx.fillStyle = "#FFF";
      ctx.font = "10px Arial";
      const valueText = this.value.toFixed(this.precision);
      ctx.fillText(valueText, widget_width - 30, y + H - 5);
    };

    LiteGraph.SliderWidget.prototype.mouse = function(event, pos, node) {
      if (event.type === "mousedown" || (event.type === "mousemove" && event.dragging)) {
        const normalizedX = Math.max(0, Math.min(1, (pos[0] - 5) / (this.size[0] - 10)));
        this.value = this.min + (this.max - this.min) * normalizedX;
        
        // Apply step
        if (this.step > 0) {
          this.value = Math.round(this.value / this.step) * this.step;
        }
        
        // Clamp value
        this.value = Math.max(this.min, Math.min(this.max, this.value));
        
        if (this.property) {
          this.node.setProperty(this.property, this.value);
        }
        if (this.callback) {
          this.callback(this.value, this);
        }
        this.node.setDirtyCanvas(true);
        return true;
      }
      return false;
    };
  }

  registerComboWidget() {
    LiteGraph.ComboWidget = function(node, property, value, callback, options) {
      this.node = node;
      this.property = property;
      this.value = value || "";
      this.callback = callback;
      this.options = options || {};
      this.type = "combo";
      this.y = 0;
      this.size = [150, 20];
      
      this.values = this.options.values || [];
      this.isOpen = false;
    };

    LiteGraph.ComboWidget.prototype.draw = function(ctx, node, widget_width, y, H) {
      ctx.fillStyle = "#444";
      ctx.fillRect(0, y, widget_width, H);
      
      ctx.fillStyle = "#FFF";
      ctx.font = "11px Arial";
      ctx.fillText(this.value, 5, y + H - 5);
      
      // Dropdown arrow
      ctx.fillStyle = "#888";
      ctx.fillText("▼", widget_width - 15, y + H - 5);
      
      // Draw dropdown if open
      if (this.isOpen) {
        const dropdownHeight = Math.min(this.values.length * 20, 200);
        ctx.fillStyle = "#333";
        ctx.fillRect(0, y + H, widget_width, dropdownHeight);
        
        this.values.forEach((value, index) => {
          const itemY = y + H + (index * 20);
          if (itemY > y + H + dropdownHeight) return;
          
          if (value === this.value) {
            ctx.fillStyle = "#555";
            ctx.fillRect(0, itemY, widget_width, 20);
          }
          
          ctx.fillStyle = "#FFF";
          ctx.font = "11px Arial";
          ctx.fillText(value, 5, itemY + 15);
        });
      }
    };

    LiteGraph.ComboWidget.prototype.mouse = function(event, pos, node) {
      if (event.type === "mousedown") {
        if (this.isOpen) {
          const itemIndex = Math.floor((pos[1] - (this.y + this.size[1])) / 20);
          if (itemIndex >= 0 && itemIndex < this.values.length) {
            this.value = this.values[itemIndex];
            if (this.property) {
              this.node.setProperty(this.property, this.value);
            }
            if (this.callback) {
              this.callback(this.value, this);
            }
          }
          this.isOpen = false;
        } else {
          this.isOpen = true;
        }
        this.node.setDirtyCanvas(true);
        return true;
      }
      return false;
    };
  }

  registerToggleWidget() {
    LiteGraph.ToggleWidget = function(node, property, value, callback, options) {
      this.node = node;
      this.property = property;
      this.value = value || false;
      this.callback = callback;
      this.options = options || {};
      this.type = "toggle";
      this.y = 0;
      this.size = [60, 20];
      
      this.onText = this.options.onText || "ON";
      this.offText = this.options.offText || "OFF";
    };

    LiteGraph.ToggleWidget.prototype.draw = function(ctx, node, widget_width, y, H) {
      // Background
      ctx.fillStyle = this.value ? "#4A9EFF" : "#444";
      ctx.fillRect(0, y, widget_width, H);
      
      // Border
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, widget_width, H);
      
      // Text
      ctx.fillStyle = "#FFF";
      ctx.font = "11px Arial";
      const text = this.value ? this.onText : this.offText;
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, (widget_width - textWidth) / 2, y + H - 5);
    };

    LiteGraph.ToggleWidget.prototype.mouse = function(event, pos, node) {
      if (event.type === "mousedown") {
        this.value = !this.value;
        if (this.property) {
          this.node.setProperty(this.property, this.value);
        }
        if (this.callback) {
          this.callback(this.value, this);
        }
        this.node.setDirtyCanvas(true);
        return true;
      }
      return false;
    };
  }

  registerKnobWidget() {
    LiteGraph.KnobWidget = function(node, property, value, callback, options) {
      this.node = node;
      this.property = property;
      this.value = value || 0;
      this.callback = callback;
      this.options = options || {};
      this.type = "knob";
      this.y = 0;
      this.size = [40, 40];
      
      this.min = this.options.min || 0;
      this.max = this.options.max || 1;
      this.step = this.options.step || 0.01;
      this.precision = this.options.precision || 2;
    };

    LiteGraph.KnobWidget.prototype.draw = function(ctx, node, widget_width, y, H) {
      const centerX = widget_width / 2;
      const centerY = y + H / 2;
      const radius = Math.min(widget_width, H) / 2 - 4;
      
      // Outer circle
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Value arc
      const normalizedValue = (this.value - this.min) / (this.max - this.min);
      const angle = -Math.PI/2 + (normalizedValue * Math.PI * 1.5);
      
      ctx.strokeStyle = "#4A9EFF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 2, -Math.PI/2, angle);
      ctx.stroke();
      
      // Knob indicator
      const indicatorX = centerX + Math.cos(angle) * (radius - 8);
      const indicatorY = centerY + Math.sin(angle) * (radius - 8);
      
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    LiteGraph.KnobWidget.prototype.mouse = function(event, pos, node) {
      if (event.type === "mousedown" || (event.type === "mousemove" && event.dragging)) {
        const centerX = this.size[0] / 2;
        const centerY = this.size[1] / 2;
        
        const deltaY = event.movementY || 0;
        const sensitivity = 0.01;
        const change = -deltaY * sensitivity * (this.max - this.min);
        
        this.value += change;
        this.value = Math.max(this.min, Math.min(this.max, this.value));
        
        // Apply step
        if (this.step > 0) {
          this.value = Math.round(this.value / this.step) * this.step;
        }
        
        if (this.property) {
          this.node.setProperty(this.property, this.value);
        }
        if (this.callback) {
          this.callback(this.value, this);
        }
        this.node.setDirtyCanvas(true);
        return true;
      }
      return false;
    };
  }

  registerTextAreaWidget() {
    LiteGraph.TextAreaWidget = function(node, property, value, callback, options) {
      this.node = node;
      this.property = property;
      this.value = value || "";
      this.callback = callback;
      this.options = options || {};
      this.type = "textarea";
      this.y = 0;
      this.size = [200, 60];
      
      this.isEditing = false;
      this.multiline = this.options.multiline !== false;
      this.cursorPos = 0;
    };

    LiteGraph.TextAreaWidget.prototype.draw = function(ctx, node, widget_width, y, H) {
      ctx.fillStyle = "#444";
      ctx.fillRect(0, y, widget_width, H);
      
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, widget_width, H);
      
      ctx.fillStyle = "#FFF";
      ctx.font = "11px Arial";
      
      if (this.multiline) {
        const lines = this.value.split('\n');
        const lineHeight = 14;
        lines.forEach((line, index) => {
          if (y + (index + 1) * lineHeight < y + H) {
            ctx.fillText(line, 5, y + (index + 1) * lineHeight);
          }
        });
      } else {
        ctx.fillText(this.value, 5, y + H - 5);
      }
      
      // Cursor
      if (this.isEditing) {
        ctx.fillStyle = "#FFF";
        const textBeforeCursor = this.value.substring(0, this.cursorPos);
        const cursorX = 5 + ctx.measureText(textBeforeCursor).width;
        ctx.fillRect(cursorX, y + 5, 1, H - 10);
      }
    };

    LiteGraph.TextAreaWidget.prototype.mouse = function(event, pos, node) {
      if (event.type === "mousedown") {
        this.isEditing = true;
        this.node.setDirtyCanvas(true);
        return true;
      }
      return false;
    };

    LiteGraph.TextAreaWidget.prototype.key = function(e) {
        if (this.isEditing) {
            if (e.key === 'Enter' && !this.multiline) {
                this.isEditing = false;
                return;
            }
            if (e.key === 'Backspace') {
                this.value = this.value.slice(0, -1);
            } else if (e.key.length === 1) {
                this.value += e.key;
            }
            if (this.property) {
                this.node.setProperty(this.property, this.value);
            }
            if (this.callback) {
                this.callback(this.value, this);
            }
            this.node.setDirtyCanvas(true);
        }
    }
  }

  // Helper method to add enhanced widgets to nodes
  addEnhancedWidget(node, type, property, value, callback, options) {
    let widget;
    
    switch (type) {
      case "colorpicker":
        widget = new LiteGraph.ColorPickerWidget(node, property, value, callback);
        break;
      case "file":
        widget = new LiteGraph.FileSelectorWidget(node, property, value, callback, options);
        break;
      case "font":
        widget = new LiteGraph.FontPickerWidget(node, property, value, callback);
        break;
      case "slider":
        widget = new LiteGraph.SliderWidget(node, property, value, callback, options);
        break;
      case "combo":
        widget = new LiteGraph.ComboWidget(node, property, value, callback, options);
        break;
      case "toggle":
        widget = new LiteGraph.ToggleWidget(node, property, value, callback, options);
        break;
      case "knob":
        widget = new LiteGraph.KnobWidget(node, property, value, callback, options);
        break;
      case "textarea":
        widget = new LiteGraph.TextAreaWidget(node, property, value, callback, options);
        break;
      default:
        console.warn('Unknown enhanced widget type:', type);
        return null;
    }
    
    if (widget && node.widgets) {
      node.widgets.push(widget);
      node.setSize([Math.max(node.size[0], widget.size[0] + 20), node.size[1] + widget.size[1] + 5]);
      return widget;
    }
    
    return null;
  }
}

export default EnhancedWidgets;
