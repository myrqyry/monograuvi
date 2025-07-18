import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode.js';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';
import { createLygiaShader } from '../../utils/LygiaUtils.js';

export class DistortionNode extends ThreeJSBaseNode {
  constructor() {
    super('LYGIA Distortion');
    
    // Inputs
    this.addInputWithLabel('time', 'Time', Classic.socket('number'));
    this.addInputWithLabel('resolution', 'Resolution', Classic.socket('vec2'));
    this.addInputWithLabel('inputTexture', 'Input Texture', Classic.socket('texture'));
    this.addInputWithLabel('strength', 'Strength', Classic.socket('number'));
    
    // Distortion controls
    this.addControl('distortionType', new Classic.SelectControl('barrel', [
      'barrel', 'pincushion', 'fisheye', 'spherize', 'twist', 'ripple', 'wave'
    ], {
      initial: 'barrel',
      description: 'Type of distortion to apply'
    }));
    
    this.addControl('amount', new Classic.NumberControl(0.1, {
      min: -1.0,
      max: 1.0,
      step: 0.01,
      description: 'Distortion amount'
    }));
    
    this.addControl('center', new Classic.InputControl('text', '0.5,0.5', {
      description: 'Distortion center (x,y)'
    }));
    
    this.addControl('frequency', new Classic.NumberControl(5.0, {
      min: 0.1,
      max: 20.0,
      step: 0.1,
      description: 'Frequency for wave distortions'
    }));
    
    this.addControl('amplitude', new Classic.NumberControl(0.05, {
      min: 0.0,
      max: 0.5,
      step: 0.01,
      description: 'Amplitude for wave distortions'
    }));
    
    this.addControl('speed', new Classic.NumberControl(1.0, {
      min: 0.0,
      max: 5.0,
      step: 0.1,
      description: 'Animation speed'
    }));

    // Initialize with default distortion shader
    this.createDistortionShader();
    
    this.addThreeJSObjectOutput('material', 'Distortion Material');
  }

  createDistortionShader() {
    const template = createLygiaShader('distortion');
    this.object = new THREE.ShaderMaterial({
      vertexShader: template.vertexShader,
      fragmentShader: template.fragmentShader,
      uniforms: {
        ...template.uniforms,
        amount: { value: 0.1 },
        center: { value: new THREE.Vector2(0.5, 0.5) },
        frequency: { value: 5.0 },
        amplitude: { value: 0.05 },
        speed: { value: 1.0 }
      }
    });
  }

  parseVec2(str) {
    const parts = str.split(',').map(p => parseFloat(p.trim()));
    return parts.length >= 2 ? [parts[0], parts[1]] : [0.5, 0.5];
  }

  updateObject(inputs, properties) {
    const time = inputs['time']?.length ? inputs['time'][0] : properties['time'] || 0.0;
    const resolution = inputs['resolution']?.length ? inputs['resolution'][0] : properties['resolution'] || [1.0, 1.0];
    const inputTexture = inputs['inputTexture']?.length ? inputs['inputTexture'][0] : properties['inputTexture'] || null;
    const strength = inputs['strength']?.length ? inputs['strength'][0] : properties['strength'] || 0.1;
    
    const distortionType = properties['distortionType'] || 'barrel';
    const amount = properties['amount'] || 0.1;
    const center = properties['center'] || '0.5,0.5';
    const frequency = properties['frequency'] || 5.0;
    const amplitude = properties['amplitude'] || 0.05;
    const speed = properties['speed'] || 1.0;

    let materialNeedsUpdate = false;

    // Generate appropriate shader based on distortion type
    const customFragmentShader = this.generateDistortionShader(distortionType);
    
    if (this.object) {
      if (this.object.fragmentShader !== customFragmentShader) {
        this.object.fragmentShader = customFragmentShader;
        materialNeedsUpdate = true;
      }
      
      // Update uniforms
      this.object.uniforms.time.value = time;
      this.object.uniforms.resolution.value = Array.isArray(resolution) ? 
        new THREE.Vector2(...resolution) : resolution;
      this.object.uniforms.strength.value = strength;
      this.object.uniforms.amount.value = amount;
      this.object.uniforms.center.value = new THREE.Vector2(...this.parseVec2(center));
      this.object.uniforms.frequency.value = frequency;
      this.object.uniforms.amplitude.value = amplitude;
      this.object.uniforms.speed.value = speed;
      
      if (inputTexture) {
        this.object.uniforms.inputTexture.value = inputTexture;
      }
      
      if (materialNeedsUpdate) {
        this.object.needsUpdate = true;
      }
    } else {
      this.createDistortionShader();
    }
  }

  generateDistortionShader(distortionType) {
    const baseShader = `
      #include "lygia/distort/${distortionType}.glsl"
      
      uniform float time;
      uniform vec2 resolution;
      uniform sampler2D inputTexture;
      uniform float strength;
      uniform float amount;
      uniform vec2 center;
      uniform float frequency;
      uniform float amplitude;
      uniform float speed;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 distortedUV = uv;
        
        ${this.getDistortionCall(distortionType)}
        
        // Sample texture with distorted coordinates
        vec4 color = texture2D(inputTexture, distortedUV);
        
        // If no input texture, create a test pattern
        if (inputTexture == 0) {
          color = vec4(vec3(0.5 + 0.5 * cos(distortedUV.x * 10.0), 
                           0.5 + 0.5 * cos(distortedUV.y * 10.0), 
                           0.5)), 1.0);
        }
        
        gl_FragColor = color;
      }
    `;
    
    return baseShader;
  }

  getDistortionCall(distortionType) {
    switch(distortionType) {
      case 'barrel':
        return 'distortedUV = barrel(uv, amount * strength);';
      case 'pincushion':
        return 'distortedUV = pincushion(uv, amount * strength);';
      case 'fisheye':
        return 'distortedUV = fisheye(uv, amount * strength);';
      case 'spherize':
        return 'distortedUV = spherize(uv, amount * strength, center);';
      case 'twist':
        return 'distortedUV = twist(uv, amount * strength * sin(time * speed), center);';
      case 'ripple':
        return 'distortedUV = ripple(uv, amplitude * strength, frequency, time * speed);';
      case 'wave':
        return 'distortedUV = wave(uv, amplitude * strength, frequency, time * speed);';
      default:
        return 'distortedUV = barrel(uv, amount * strength);';
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