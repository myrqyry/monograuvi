import { ThreeJSBaseNode } from './ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

// This node creates and manages a Three.js WebGLRenderer instance.
// It can potentially expose properties for renderer configuration (e.g., antialiasing, alpha).

export class RendererNode extends ThreeJSBaseNode {
  constructor() {
    super('WebGL Renderer');
    this.addInputWithLabel('width', 'Width', Classic.socket('Number'), window.innerWidth);
    this.addInputWithLabel('height', 'Height', Classic.socket('Number'), window.innerHeight);
    this.addInputWithLabel('canvas', 'Canvas Element', Classic.socket('object')); // HTMLCanvasElement input

    this.object = null; // THREE.WebGLRenderer instance
    this.addThreeJSObjectOutput('renderer', 'Renderer Out');
  }

  initObject() {
    // Renderer needs to be created with a canvas element, so it's
    // conditionally created/updated in updateObject.
  }

  updateObject(inputs, properties) {
    const width = inputs['width']?.length ? inputs['width'][0] : properties['width'];
    const height = inputs['height']?.length ? inputs['height'][0] : properties['height'];
    const canvas = inputs['canvas']?.length ? inputs['canvas'][0] : null;

    if (canvas && !this.object) {
      // Create renderer if canvas is provided and renderer doesn't exist
      this.object = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      this.object.setPixelRatio(window.devicePixelRatio);
      this.object.setSize(width || window.innerWidth, height || window.innerHeight);
    } else if (this.object) {
      // Update renderer size if it already exists
      this.object.setSize(width || window.innerWidth, height || window.innerHeight);
    } else if (!canvas && this.object) {
        // Dispose if canvas is disconnected
        this.object.dispose();
        this.object = null;
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ renderer: this.object });
  }

  // Override dispose to ensure the renderer is properly disposed of
  dispose() {
    if (this.object) {
      this.object.dispose();
      this.object = null;
    }
    super.dispose();
  }
}