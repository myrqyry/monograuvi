import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode.js';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';
import { createLygiaShader } from '../../utils/LygiaUtils.js';

export class AudioReactiveNode extends ThreeJSBaseNode {
  constructor() {
    super('LYGIA Audio Reactive');
    
    // Audio inputs
    this.addInputWithLabel('audioLevel', 'Audio Level', Classic.socket('number'));
    this.addInputWithLabel('bass', 'Bass', Classic.socket('number'));
    this.addInputWithLabel('mid', 'Mid', Classic.socket('number'));
    this.addInputWithLabel('treble', 'Treble', Classic.socket('number'));
    this.addInputWithLabel('spectrum', 'Spectrum', Classic.socket('array'));
    
    // Standard inputs
    this.addInputWithLabel('time', 'Time', Classic.socket('number'));
    this.addInputWithLabel('resolution', 'Resolution', Classic.socket('vec2'));
    
    // Audio reactive controls
    this.addControl('visualType', new Classic.SelectControl('noise', [
      'noise', 'waves', 'circles', 'spiral', 'kaleidoscope', 'fractal'
    ], {
      initial: 'noise',
      description: 'Type of audio-reactive visual'
    }));
    
    this.addControl('sensitivity', new Classic.NumberControl(2.0, {
      min: 0.1,
      max: 10.0,
      step: 0.1,
      description: 'Audio sensitivity multiplier'
    }));
    
    this.addControl('colorMode', new Classic.SelectControl('frequency', [
      'frequency', 'amplitude', 'spectrum', 'rainbow'
    ], {
      initial: 'frequency',
      description: 'Color mapping mode'
    }));
    
    this.addControl('reactivity', new Classic.NumberControl(1.0, {
      min: 0.0,
      max: 3.0,
      step: 0.1,
      description: 'Overall reactivity to audio'
    }));
    
    this.addControl('smoothing', new Classic.NumberControl(0.1, {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Audio smoothing factor'
    }));
    
    this.addControl('baseScale', new Classic.NumberControl(5.0, {
      min: 0.1,
      max: 20.0,
      step: 0.1,
      description: 'Base pattern scale'
    }));

    // Initialize with default audio reactive shader
    this.createAudioReactiveShader();
    
    this.addThreeJSObjectOutput('material', 'Audio Reactive Material');
  }

  createAudioReactiveShader() {
    const template = createLygiaShader('audioReactive');
    this.object = new THREE.ShaderMaterial({
      vertexShader: template.vertexShader,
      fragmentShader: template.fragmentShader,
      uniforms: {
        ...template.uniforms,
        sensitivity: { value: 2.0 },
        reactivity: { value: 1.0 },
        smoothing: { value: 0.1 },
        baseScale: { value: 5.0 },
        spectrum: { value: new Float32Array(128) }
      }
    });
  }

  updateObject(inputs, properties) {
    const audioLevel = inputs['audioLevel']?.length ? inputs['audioLevel'][0] : properties['audioLevel'] || 0.0;
    const bass = inputs['bass']?.length ? inputs['bass'][0] : properties['bass'] || 0.0;
    const mid = inputs['mid']?.length ? inputs['mid'][0] : properties['mid'] || 0.0;
    const treble = inputs['treble']?.length ? inputs['treble'][0] : properties['treble'] || 0.0;
    const spectrum = inputs['spectrum']?.length ? inputs['spectrum'][0] : properties['spectrum'] || new Float32Array(128);
    const time = inputs['time']?.length ? inputs['time'][0] : properties['time'] || 0.0;
    const resolution = inputs['resolution']?.length ? inputs['resolution'][0] : properties['resolution'] || [1.0, 1.0];
    
    const visualType = properties['visualType'] || 'noise';
    const sensitivity = properties['sensitivity'] || 2.0;
    const colorMode = properties['colorMode'] || 'frequency';
    const reactivity = properties['reactivity'] || 1.0;
    const smoothing = properties['smoothing'] || 0.1;
    const baseScale = properties['baseScale'] || 5.0;

    let materialNeedsUpdate = false;

    // Generate appropriate shader based on visual type
    const customFragmentShader = this.generateAudioReactiveShader(visualType, colorMode);
    
    if (this.object) {
      if (this.object.fragmentShader !== customFragmentShader) {
        this.object.fragmentShader = customFragmentShader;
        materialNeedsUpdate = true;
      }
      
      // Update uniforms
      this.object.uniforms.time.value = time;
      this.object.uniforms.resolution.value = Array.isArray(resolution) ? 
        new THREE.Vector2(...resolution) : resolution;
      this.object.uniforms.audioLevel.value = audioLevel * sensitivity * reactivity;
      this.object.uniforms.bass.value = bass * sensitivity * reactivity;
      this.object.uniforms.mid.value = mid * sensitivity * reactivity;
      this.object.uniforms.treble.value = treble * sensitivity * reactivity;
      this.object.uniforms.sensitivity.value = sensitivity;
      this.object.uniforms.reactivity.value = reactivity;
      this.object.uniforms.smoothing.value = smoothing;
      this.object.uniforms.baseScale.value = baseScale;
      
      if (spectrum && spectrum.length > 0) {
        this.object.uniforms.spectrum.value = new Float32Array(spectrum);
      }
      
      if (materialNeedsUpdate) {
        this.object.needsUpdate = true;
      }
    } else {
      this.createAudioReactiveShader();
    }
  }

  generateAudioReactiveShader(visualType, colorMode) {
    const baseShader = `
      #include "lygia/generative/noise.glsl"
      #include "lygia/generative/fbm.glsl"
      #include "lygia/color/palette.glsl"
      #include "lygia/sdf/circleSDF.glsl"
      #include "lygia/space/rotate.glsl"
      #include "lygia/math/map.glsl"
      
      uniform float time;
      uniform vec2 resolution;
      uniform float audioLevel;
      uniform float bass;
      uniform float mid;
      uniform float treble;
      uniform float sensitivity;
      uniform float reactivity;
      uniform float smoothing;
      uniform float baseScale;
      uniform float spectrum[128];
      
      vec3 getAudioColor(float t) {
        ${this.getColorModeFunction(colorMode)}
      }
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 centered = uv - 0.5;
        
        ${this.getVisualFunction(visualType)}
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    return baseShader;
  }

  getColorModeFunction(colorMode) {
    switch(colorMode) {
      case 'frequency':
        return `
          vec3 bassColor = vec3(1.0, 0.2, 0.0);
          vec3 midColor = vec3(0.0, 1.0, 0.4);
          vec3 trebleColor = vec3(0.0, 0.4, 1.0);
          return mix(mix(bassColor, midColor, mid), trebleColor, treble);
        `;
      case 'amplitude':
        return `
          float intensity = audioLevel;
          return palette(intensity, 
            vec3(0.5, 0.5, 0.5), 
            vec3(0.5, 0.5, 0.5), 
            vec3(1.0, 1.0, 1.0), 
            vec3(0.0, 0.33, 0.67));
        `;
      case 'spectrum':
        return `
          float specIndex = clamp(t * 128.0, 0.0, 127.0);
          float specValue = spectrum[int(specIndex)];
          return palette(specValue, 
            vec3(0.5, 0.5, 0.5), 
            vec3(0.5, 0.5, 0.5), 
            vec3(1.0, 1.0, 1.0), 
            vec3(0.0, 0.33, 0.67));
        `;
      case 'rainbow':
      default:
        return `
          return palette(t + time * 0.1, 
            vec3(0.5, 0.5, 0.5), 
            vec3(0.5, 0.5, 0.5), 
            vec3(1.0, 1.0, 1.0), 
            vec3(0.0, 0.33, 0.67));
        `;
    }
  }

  getVisualFunction(visualType) {
    switch(visualType) {
      case 'waves':
        return `
          float wave = sin(uv.x * baseScale + time + audioLevel * 10.0) * 
                      sin(uv.y * baseScale + time + bass * 5.0) * 
                      (0.5 + audioLevel);
          vec3 finalColor = getAudioColor(wave + 0.5);
        `;
      case 'circles':
        return `
          float dist = length(centered);
          float circle = abs(sin(dist * baseScale - time - audioLevel * 5.0)) * 
                        (1.0 + bass * 2.0);
          vec3 finalColor = getAudioColor(circle);
        `;
      case 'spiral':
        return `
          float angle = atan(centered.y, centered.x);
          float dist = length(centered);
          float spiral = sin(angle * 3.0 + dist * baseScale - time - audioLevel * 10.0) * 
                        (1.0 + treble * 2.0);
          vec3 finalColor = getAudioColor(spiral + 0.5);
        `;
      case 'kaleidoscope':
        return `
          vec2 rotated = rotate(centered, time * 0.1 + audioLevel);
          float pattern = fbm(rotated * baseScale + time * 0.5);
          pattern *= (1.0 + bass * 3.0);
          vec3 finalColor = getAudioColor(pattern);
        `;
      case 'fractal':
        return `
          float n = fbm(centered * baseScale + time * 0.2);
          n += audioLevel * 2.0;
          n *= (1.0 + bass + mid + treble);
          vec3 finalColor = getAudioColor(n);
        `;
      case 'noise':
      default:
        return `
          float n = noise(centered * baseScale + time * 0.5 + audioLevel * 2.0);
          n *= (1.0 + bass * 2.0 + mid * 1.5 + treble * 1.0);
          vec3 finalColor = getAudioColor(n + 0.5);
        `;
    }
  }

  initObject() {
    // Object is created in constructor
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ material: this.object });
  }
}