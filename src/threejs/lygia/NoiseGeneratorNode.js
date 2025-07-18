import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode.js';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';
import { createLygiaShader } from '../../utils/LygiaUtils.js';

export class NoiseGeneratorNode extends ThreeJSBaseNode {
  constructor() {
    super('LYGIA Noise Generator');
    
    // Inputs
    this.addInputWithLabel('time', 'Time', Classic.socket('number'));
    this.addInputWithLabel('resolution', 'Resolution', Classic.socket('vec2'));
    this.addInputWithLabel('scale', 'Scale', Classic.socket('number'));
    this.addInputWithLabel('speed', 'Speed', Classic.socket('number'));
    this.addInputWithLabel('octaves', 'Octaves', Classic.socket('number'));
    
    // Controls
    this.addControl('noiseType', new Classic.SelectControl('noise', ['noise', 'fbm', 'ridge', 'turbulence'], {
      initial: 'noise',
      description: 'Type of noise to generate'
    }));
    
    this.addControl('amplitude', new Classic.NumberControl(1.0, {
      min: 0.0,
      max: 2.0,
      step: 0.1,
      description: 'Noise amplitude'
    }));
    
    this.addControl('frequency', new Classic.NumberControl(5.0, {
      min: 0.1,
      max: 20.0,
      step: 0.1,
      description: 'Noise frequency'
    }));
    
    this.addControl('lacunarity', new Classic.NumberControl(2.0, {
      min: 1.0,
      max: 4.0,
      step: 0.1,
      description: 'Lacunarity for fbm noise'
    }));
    
    this.addControl('gain', new Classic.NumberControl(0.5, {
      min: 0.0,
      max: 1.0,
      step: 0.1,
      description: 'Gain for fbm noise'
    }));

    // Initialize with default noise shader
    this.createNoiseShader();
    
    this.addThreeJSObjectOutput('material', 'Noise Material');
  }

  createNoiseShader() {
    const template = createLygiaShader('noise');
    this.object = new THREE.ShaderMaterial({
      vertexShader: template.vertexShader,
      fragmentShader: template.fragmentShader,
      uniforms: {
        ...template.uniforms,
        amplitude: { value: 1.0 },
        frequency: { value: 5.0 },
        lacunarity: { value: 2.0 },
        gain: { value: 0.5 },
        speed: { value: 0.5 },
        scale: { value: 1.0 },
        octaves: { value: 4 }
      }
    });
  }

  updateObject(inputs, properties) {
    const time = inputs['time']?.length ? inputs['time'][0] : properties['time'] || 0.0;
    const resolution = inputs['resolution']?.length ? inputs['resolution'][0] : properties['resolution'] || [1.0, 1.0];
    const scale = inputs['scale']?.length ? inputs['scale'][0] : properties['scale'] || 1.0;
    const speed = inputs['speed']?.length ? inputs['speed'][0] : properties['speed'] || 0.5;
    const octaves = inputs['octaves']?.length ? inputs['octaves'][0] : properties['octaves'] || 4;
    
    const noiseType = properties['noiseType'] || 'noise';
    const amplitude = properties['amplitude'] || 1.0;
    const frequency = properties['frequency'] || 5.0;
    const lacunarity = properties['lacunarity'] || 2.0;
    const gain = properties['gain'] || 0.5;

    let materialNeedsUpdate = false;

    // Generate appropriate shader based on noise type
    const customFragmentShader = this.generateNoiseShader(noiseType);
    
    if (this.object) {
      if (this.object.fragmentShader !== customFragmentShader) {
        this.object.fragmentShader = customFragmentShader;
        materialNeedsUpdate = true;
      }
      
      // Update uniforms
      this.object.uniforms.time.value = time;
      this.object.uniforms.resolution.value = Array.isArray(resolution) ? 
        new THREE.Vector2(...resolution) : resolution;
      this.object.uniforms.amplitude.value = amplitude;
      this.object.uniforms.frequency.value = frequency;
      this.object.uniforms.lacunarity.value = lacunarity;
      this.object.uniforms.gain.value = gain;
      this.object.uniforms.speed.value = speed;
      this.object.uniforms.scale.value = scale;
      this.object.uniforms.octaves.value = octaves;
      
      if (materialNeedsUpdate) {
        this.object.needsUpdate = true;
      }
    } else {
      this.createNoiseShader();
    }
  }

  generateNoiseShader(noiseType) {
    const baseShader = `
      #include "lygia/generative/${noiseType}.glsl"
      
      uniform float time;
      uniform vec2 resolution;
      uniform float amplitude;
      uniform float frequency;
      uniform float lacunarity;
      uniform float gain;
      uniform float speed;
      uniform float scale;
      uniform int octaves;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 pos = uv * frequency * scale + time * speed;
        
        float n;
        ${this.getNoiseCall(noiseType)}
        
        n = n * amplitude;
        n = clamp(n, 0.0, 1.0);
        
        gl_FragColor = vec4(vec3(n), 1.0);
      }
    `;
    
    return baseShader;
  }

  getNoiseCall(noiseType) {
    switch(noiseType) {
      case 'fbm':
        return 'n = fbm(pos, octaves, lacunarity, gain);';
      case 'ridge':
        return 'n = ridge(pos, octaves, lacunarity, gain);';
      case 'turbulence':
        return 'n = turbulence(pos, octaves, lacunarity, gain);';
      default:
        return 'n = noise(pos);';
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