import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode.js';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';
import { LygiaProcessor, LYGIA_TEMPLATES, createLygiaShader, getLygiaCategories, getLygiaFunctions } from '../../utils/LygiaUtils.js';

export class ShaderMaterialNode extends ThreeJSBaseNode {
  constructor() {
    super('Shader Material');
    
    // Initialize LYGIA processor
    this.lygiaProcessor = new LygiaProcessor();
    
    // Existing inputs
    this.addInputWithLabel('vertexShader', 'Vertex Shader', Classic.socket('string'));
    this.addInputWithLabel('fragmentShader', 'Fragment Shader', Classic.socket('string'));
    this.addInputWithLabel('uniforms', 'Uniforms', Classic.socket('object'));
    
    // LYGIA-specific inputs
    this.addInputWithLabel('time', 'Time', Classic.socket('number'));
    this.addInputWithLabel('resolution', 'Resolution', Classic.socket('vec2'));
    this.addInputWithLabel('audioLevel', 'Audio Level', Classic.socket('number'));
    this.addInputWithLabel('bass', 'Bass', Classic.socket('number'));
    this.addInputWithLabel('mid', 'Mid', Classic.socket('number'));
    this.addInputWithLabel('treble', 'Treble', Classic.socket('number'));
    
    // Add controls for LYGIA templates and functions
    this.addControl('lygiaTemplate', new Classic.SelectControl('custom', Object.keys(LYGIA_TEMPLATES), {
      initial: 'custom',
      description: 'Select LYGIA template'
    }));
    
    this.addControl('enableLygia', new Classic.InputControl('checkbox', false, {
      description: 'Enable LYGIA functions'
    }));
    
    this.addControl('lygiaFunctions', new Classic.InputControl('text', '', {
      description: 'LYGIA functions to include (comma-separated)'
    }));

    this.object = new THREE.ShaderMaterial({
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red default
        }
      `,
      uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(1.0, 1.0) },
        audioLevel: { value: 0.0 },
        bass: { value: 0.0 },
        mid: { value: 0.0 },
        treble: { value: 0.0 }
      }
    });
    
    this.addThreeJSObjectOutput('material', 'Shader Material');
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const vertexShader = inputs['vertexShader']?.length ? inputs['vertexShader'][0] : properties['vertexShader'];
    const fragmentShader = inputs['fragmentShader']?.length ? inputs['fragmentShader'][0] : properties['fragmentShader'];
    const uniforms = inputs['uniforms']?.length ? inputs['uniforms'][0] : properties['uniforms'];
    
    // LYGIA-specific inputs
    const time = inputs['time']?.length ? inputs['time'][0] : properties['time'] || 0.0;
    const resolution = inputs['resolution']?.length ? inputs['resolution'][0] : properties['resolution'] || [1.0, 1.0];
    const audioLevel = inputs['audioLevel']?.length ? inputs['audioLevel'][0] : properties['audioLevel'] || 0.0;
    const bass = inputs['bass']?.length ? inputs['bass'][0] : properties['bass'] || 0.0;
    const mid = inputs['mid']?.length ? inputs['mid'][0] : properties['mid'] || 0.0;
    const treble = inputs['treble']?.length ? inputs['treble'][0] : properties['treble'] || 0.0;
    
    // LYGIA controls
    const lygiaTemplate = properties['lygiaTemplate'] || 'custom';
    const enableLygia = properties['enableLygia'] || false;
    const lygiaFunctions = properties['lygiaFunctions'] || '';

    let materialNeedsUpdate = false;
    let processedVertexShader = vertexShader;
    let processedFragmentShader = fragmentShader;
    let processedUniforms = {
      time: { value: time },
      resolution: { value: Array.isArray(resolution) ? new THREE.Vector2(...resolution) : resolution },
      audioLevel: { value: audioLevel },
      bass: { value: bass },
      mid: { value: mid },
      treble: { value: treble },
      ...(uniforms || {})
    };

    // Process LYGIA integration
    if (enableLygia) {
      if (lygiaTemplate !== 'custom' && LYGIA_TEMPLATES[lygiaTemplate]) {
        // Use predefined LYGIA template
        const template = createLygiaShader(lygiaTemplate, processedUniforms);
        processedVertexShader = template.vertexShader;
        processedFragmentShader = template.fragmentShader;
        processedUniforms = template.uniforms;
      } else if (lygiaFunctions) {
        // Process custom LYGIA functions
        this.lygiaProcessor.clear();
        const functions = lygiaFunctions.split(',').map(f => f.trim());
        
        // Parse function format: "category/function" or just "function"
        for (const func of functions) {
          const parts = func.split('/');
          if (parts.length === 2) {
            this.lygiaProcessor.addFunction(parts[0], parts[1]);
          } else {
            // Try to find the function in available categories
            const categories = getLygiaCategories();
            for (const category of categories) {
              const categoryFunctions = getLygiaFunctions(category);
              if (categoryFunctions.includes(func)) {
                this.lygiaProcessor.addFunction(category, func);
                break;
              }
            }
          }
        }
        
        // Process shaders with LYGIA includes
        if (processedVertexShader) {
          processedVertexShader = this.lygiaProcessor.processShader(processedVertexShader);
        }
        if (processedFragmentShader) {
          processedFragmentShader = this.lygiaProcessor.processShader(processedFragmentShader);
        }
      }
    }

    if (this.object) {
      if (processedVertexShader && this.object.vertexShader !== processedVertexShader) {
        this.object.vertexShader = processedVertexShader;
        materialNeedsUpdate = true;
      }
      if (processedFragmentShader && this.object.fragmentShader !== processedFragmentShader) {
        this.object.fragmentShader = processedFragmentShader;
        materialNeedsUpdate = true;
      }
      
      // Update uniforms
      if (processedUniforms) {
        Object.keys(processedUniforms).forEach(key => {
          if (!this.object.uniforms[key]) {
            this.object.uniforms[key] = processedUniforms[key];
          } else {
            this.object.uniforms[key].value = processedUniforms[key].value;
          }
        });
        materialNeedsUpdate = true;
      }

      if (materialNeedsUpdate) {
        this.object.needsUpdate = true;
      }
    } else {
      this.object = new THREE.ShaderMaterial({
        vertexShader: processedVertexShader || `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: processedFragmentShader || `void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }`,
        uniforms: processedUniforms
      });
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ material: this.object });
  }
  
  /**
   * Get available LYGIA template names
   * @returns {string[]} Array of template names
   */
  getLygiaTemplates() {
    return Object.keys(LYGIA_TEMPLATES);
  }
  
  /**
   * Get LYGIA template by name
   * @param {string} templateName - Template name
   * @returns {Object|null} Template object or null if not found
   */
  getLygiaTemplate(templateName) {
    return LYGIA_TEMPLATES[templateName] || null;
  }
  
  /**
   * Set LYGIA template
   * @param {string} templateName - Template name
   */
  setLygiaTemplate(templateName) {
    if (LYGIA_TEMPLATES[templateName]) {
      this.properties.lygiaTemplate = templateName;
      this.updateObject({}, this.properties);
    }
  }
}