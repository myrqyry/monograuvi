import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode.js';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';
import { createLygiaShader } from '../../utils/LygiaUtils.js';

export class ColorPaletteNode extends ThreeJSBaseNode {
  constructor() {
    super('LYGIA Color Palette');
    
    // Inputs
    this.addInputWithLabel('time', 'Time', Classic.socket('number'));
    this.addInputWithLabel('resolution', 'Resolution', Classic.socket('vec2'));
    this.addInputWithLabel('input', 'Input Value', Classic.socket('number'));
    
    // Color palette controls
    this.addControl('colorA', new Classic.InputControl('text', '#808080', {
      description: 'Base color (A)'
    }));
    
    this.addControl('colorB', new Classic.InputControl('text', '#808080', {
      description: 'Amplitude color (B)'
    }));
    
    this.addControl('colorC', new Classic.InputControl('text', '#ffffff', {
      description: 'Frequency color (C)'
    }));
    
    this.addControl('colorD', new Classic.InputControl('text', '#002255', {
      description: 'Phase color (D)'
    }));
    
    this.addControl('paletteType', new Classic.SelectControl('cosine', ['cosine', 'linear', 'smooth'], {
      initial: 'cosine',
      description: 'Palette interpolation type'
    }));
    
    this.addControl('speed', new Classic.NumberControl(0.1, {
      min: 0.0,
      max: 2.0,
      step: 0.05,
      description: 'Animation speed'
    }));
    
    this.addControl('scale', new Classic.NumberControl(1.0, {
      min: 0.1,
      max: 5.0,
      step: 0.1,
      description: 'Pattern scale'
    }));

    // Initialize with default palette shader
    this.createPaletteShader();
    
    this.addThreeJSObjectOutput('material', 'Palette Material');
  }

  createPaletteShader() {
    const template = createLygiaShader('palette');
    this.object = new THREE.ShaderMaterial({
      vertexShader: template.vertexShader,
      fragmentShader: template.fragmentShader,
      uniforms: {
        ...template.uniforms,
        speed: { value: 0.1 },
        scale: { value: 1.0 },
        inputValue: { value: 0.0 }
      }
    });
  }

  hexToVec3(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  updateObject(inputs, properties) {
    const time = inputs['time']?.length ? inputs['time'][0] : properties['time'] || 0.0;
    const resolution = inputs['resolution']?.length ? inputs['resolution'][0] : properties['resolution'] || [1.0, 1.0];
    const inputValue = inputs['input']?.length ? inputs['input'][0] : properties['input'] || 0.0;
    
    const colorA = properties['colorA'] || '#808080';
    const colorB = properties['colorB'] || '#808080';
    const colorC = properties['colorC'] || '#ffffff';
    const colorD = properties['colorD'] || '#002255';
    const paletteType = properties['paletteType'] || 'cosine';
    const speed = properties['speed'] || 0.1;
    const scale = properties['scale'] || 1.0;

    let materialNeedsUpdate = false;

    // Generate appropriate shader based on palette type
    const customFragmentShader = this.generatePaletteShader(paletteType);
    
    if (this.object) {
      if (this.object.fragmentShader !== customFragmentShader) {
        this.object.fragmentShader = customFragmentShader;
        materialNeedsUpdate = true;
      }
      
      // Update uniforms
      this.object.uniforms.time.value = time;
      this.object.uniforms.resolution.value = Array.isArray(resolution) ? 
        new THREE.Vector2(...resolution) : resolution;
      this.object.uniforms.colorA.value = this.hexToVec3(colorA);
      this.object.uniforms.colorB.value = this.hexToVec3(colorB);
      this.object.uniforms.colorC.value = this.hexToVec3(colorC);
      this.object.uniforms.colorD.value = this.hexToVec3(colorD);
      this.object.uniforms.speed.value = speed;
      this.object.uniforms.scale.value = scale;
      this.object.uniforms.inputValue.value = inputValue;
      
      if (materialNeedsUpdate) {
        this.object.needsUpdate = true;
      }
    } else {
      this.createPaletteShader();
    }
  }

  generatePaletteShader(paletteType) {
    const baseShader = `
      #include "lygia/color/palette.glsl"
      
      uniform float time;
      uniform vec2 resolution;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      uniform vec3 colorD;
      uniform float speed;
      uniform float scale;
      uniform float inputValue;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        // Create input value from UV coordinates or use provided input
        float t = inputValue > 0.0 ? inputValue : 
                  (length(uv - 0.5) * scale + time * speed);
        
        // Generate color using LYGIA palette function
        vec3 color = palette(t, colorA, colorB, colorC, colorD);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    return baseShader;
  }

  initObject() {
    // Object is created in constructor
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ material: this.object });
  }
}