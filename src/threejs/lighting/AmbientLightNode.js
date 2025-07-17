import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class AmbientLightNode extends ThreeJSBaseNode {
  constructor() {
    super('Ambient Light');
    this.addInputWithLabel('color', 'Color', Classic.socket('Color'), 0xffffff); // Default color white
    this.addInputWithLabel('intensity', 'Intensity', Classic.socket('Number'), 1); // Default intensity

    this.object = new THREE.AmbientLight(0xffffff, 1); // Initial default light
    this.addThreeJSObjectOutput('light', 'Ambient Light'); // Output for the THREE.Light object
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const color = inputs['color']?.length ? inputs['color'][0] : properties['color'];
    const intensity = inputs['intensity']?.length ? inputs['intensity'][0] : properties['intensity'];

    // Update properties of the existing light
    if (this.object) {
      if (
        this.object.color.getHex() !== (color || 0xffffff) ||
        this.object.intensity !== (intensity || 1)
      ) {
        this.object.color.set(color || 0xffffff);
        this.object.intensity = intensity || 1;
      }
    } else {
      this.object = new THREE.AmbientLight(color || 0xffffff, intensity || 1);
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ light: this.object });
  }
}