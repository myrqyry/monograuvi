import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class DirectionalLightNode extends ThreeJSBaseNode {
  constructor() {
    super('Directional Light');
    this.addInputWithLabel('color', 'Color', Classic.socket('Color'), 0xffffff); // Default color white
    this.addInputWithLabel('intensity', 'Intensity', Classic.socket('Number'), 1); // Default intensity
    this.addInputWithLabel('positionX', 'Position X', Classic.socket('Number'), 0);
    this.addInputWithLabel('positionY', 'Position Y', Classic.socket('Number'), 1);
    this.addInputWithLabel('positionZ', 'Position Z', Classic.socket('Number'), 0);

    this.object = new THREE.DirectionalLight(0xffffff, 1); // Initial default light
    this.addThreeJSObjectOutput('light', 'Directional Light'); // Output for the THREE.Light object
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const color = inputs['color']?.length ? inputs['color'][0] : properties['color'];
    const intensity = inputs['intensity']?.length ? inputs['intensity'][0] : properties['intensity'];
    const positionX = inputs['positionX']?.length ? inputs['positionX'][0] : properties['positionX'];
    const positionY = inputs['positionY']?.length ? inputs['positionY'][0] : properties['positionY'];
    const positionZ = inputs['positionZ']?.length ? inputs['positionZ'][0] : properties['positionZ'];

    // Update properties of the existing light
    if (this.object) {
      if (
        this.object.color.getHex() !== (color || 0xffffff) ||
        this.object.intensity !== (intensity || 1) ||
        this.object.position.x !== (positionX || 0) ||
        this.object.position.y !== (positionY || 1) ||
        this.object.position.z !== (positionZ || 0)
      ) {
        this.object.color.set(color || 0xffffff);
        this.object.intensity = intensity || 1;
        this.object.position.set(positionX || 0, positionY || 1, positionZ || 0);
      }
    } else {
      this.object = new THREE.DirectionalLight(color || 0xffffff, intensity || 1);
      this.object.position.set(positionX || 0, positionY || 1, positionZ || 0);
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ light: this.object });
  }
}