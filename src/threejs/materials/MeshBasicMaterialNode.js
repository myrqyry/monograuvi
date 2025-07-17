import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class MeshBasicMaterialNode extends ThreeJSBaseNode {
  constructor() {
    super('Mesh Basic Material');
    this.addInputWithLabel('color', 'Color', Classic.socket('Color'), 0x00ff00);
    this.addInputWithLabel('transparent', 'Transparent', Classic.socket('Boolean'), false);
    this.addInputWithLabel('opacity', 'Opacity', Classic.socket('Number'), 1);
    this.addInputWithLabel('wireframe', 'Wireframe', Classic.socket('Boolean'), false);

    this.object = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Initial default material
    this.addThreeJSObjectOutput('material', 'Basic Material'); // Output for the THREE.Material object
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const color = inputs['color']?.length ? inputs['color'][0] : properties['color'];
    const transparent = inputs['transparent']?.length ? inputs['transparent'][0] : properties['transparent'];
    const opacity = inputs['opacity']?.length ? inputs['opacity'][0] : properties['opacity'];
    const wireframe = inputs['wireframe']?.length ? inputs['wireframe'][0] : properties['wireframe'];

    // Update properties of the existing material
    if (this.object) {
      if (
        this.object.color.getHex() !== (color || 0x00ff00) ||
        this.object.transparent !== (transparent || false) ||
        this.object.opacity !== (opacity || 1) ||
        this.object.wireframe !== (wireframe || false)
      ) {
        this.object.color.set(color || 0x00ff00);
        this.object.transparent = transparent || false;
        this.object.opacity = opacity || 1;
        this.object.wireframe = wireframe || false;
        this.object.needsUpdate = true; // Important for some material properties
      }
    } else {
      this.object = new THREE.MeshBasicMaterial({
        color: color || 0x00ff00,
        transparent: transparent || false,
        opacity: opacity || 1,
        wireframe: wireframe || false
      });
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ material: this.object });
  }
}