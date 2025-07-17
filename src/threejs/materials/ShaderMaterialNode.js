import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class ShaderMaterialNode extends ThreeJSBaseNode {
  constructor() {
    super('Shader Material');
    this.addInputWithLabel('vertexShader', 'Vertex Shader', Classic.socket('string'));
    this.addInputWithLabel('fragmentShader', 'Fragment Shader', Classic.socket('string'));
    this.addInputWithLabel('uniforms', 'Uniforms', Classic.socket('object')); // For custom uniforms

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
      `
    }); // Initial default shader material
    this.addThreeJSObjectOutput('material', 'Shader Material');
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const vertexShader = inputs['vertexShader']?.length ? inputs['vertexShader'][0] : properties['vertexShader'];
    const fragmentShader = inputs['fragmentShader']?.length ? inputs['fragmentShader'][0] : properties['fragmentShader'];
    const uniforms = inputs['uniforms']?.length ? inputs['uniforms'][0] : properties['uniforms'];

    let materialNeedsUpdate = false;

    if (this.object) {
      if (vertexShader && this.object.vertexShader !== vertexShader) {
        this.object.vertexShader = vertexShader;
        materialNeedsUpdate = true;
      }
      if (fragmentShader && this.object.fragmentShader !== fragmentShader) {
        this.object.fragmentShader = fragmentShader;
        materialNeedsUpdate = true;
      }
      if (uniforms) {
        // Deep merge or replace uniforms as needed
        this.object.uniforms = { ...this.object.uniforms, ...uniforms };
        materialNeedsUpdate = true;
      }

      if (materialNeedsUpdate) {
        this.object.needsUpdate = true;
      }
    } else {
      this.object = new THREE.ShaderMaterial({
        vertexShader: vertexShader || `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: fragmentShader || `void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }`,
        uniforms: uniforms || {}
      });
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ material: this.object });
  }
}