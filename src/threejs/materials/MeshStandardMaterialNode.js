import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class MeshStandardMaterialNode extends ThreeJSBaseNode {
  constructor() {
    super('Mesh Standard Material');
    this.addInputWithLabel('color', 'Color', Classic.socket('Color'), 0x00ff00);
    this.addInputWithLabel('roughness', 'Roughness', Classic.socket('Number'), 0.5);
    this.addInputWithLabel('metalness', 'Metalness', Classic.socket('Number'), 0.5);
    this.addInputWithLabel('transparent', 'Transparent', Classic.socket('Boolean'), false);
    this.addInputWithLabel('opacity', 'Opacity', Classic.socket('Number'), 1);

    this.object = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Initial default material
    this.addThreeJSObjectOutput('material', 'Standard Material'); // Output for the THREE.Material object
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const color = inputs['color']?.length ? inputs['color'][0] : properties['color'];
    const roughness = inputs['roughness']?.length ? inputs['roughness'][0] : properties['roughness'];
    const metalness = inputs['metalness']?.length ? inputs['metalness'][0] : properties['metalness'];
    const transparent = inputs['transparent']?.length ? inputs['transparent'][0] : properties['transparent'];
    const opacity = inputs['opacity']?.length ? inputs['opacity'][0] : properties['opacity'];

    // Dispose of the old material only if it's being replaced with a new instance
    // For materials, it's generally better to update properties directly if possible
    if (this.object) {
      if (
        this.object.color.getHex() !== (color || 0x00ff00) ||
        this.object.roughness !== (roughness || 0.5) ||
        this.object.metalness !== (metalness || 0.5) ||
        this.object.transparent !== (transparent || false) ||
        this.object.opacity !== (opacity || 1)
      ) {
        this.object.color.set(color || 0x00ff00);
        this.object.roughness = roughness || 0.5;
        this.object.metalness = metalness || 0.5;
        this.object.transparent = transparent || false;
        this.object.opacity = opacity || 1;
        this.object.needsUpdate = true; // Important for some material properties
      }
    } else {
      this.object = new THREE.MeshStandardMaterial({
        color: color || 0x00ff00,
        roughness: roughness || 0.5,
        metalness: metalness || 0.5,
        transparent: transparent || false,
        opacity: opacity || 1
      });
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ material: this.object });
  }
}