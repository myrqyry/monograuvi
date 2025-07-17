import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ClassicPreset as Classic } from 'rete';

export class UnrealBloomPassNode extends ThreeJSBaseNode {
  constructor() {
    super('Unreal Bloom Pass');
    this.addInputWithLabel('resolutionX', 'Res X', Classic.socket('Number'), window.innerWidth);
    this.addInputWithLabel('resolutionY', 'Res Y', Classic.socket('Number'), window.innerHeight);
    this.addInputWithLabel('strength', 'Strength', Classic.socket('Number'), 1);
    this.addInputWithLabel('radius', 'Radius', Classic.socket('Number'), 0);
    this.addInputWithLabel('threshold', 'Threshold', Classic.socket('Number'), 0);

    this.object = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1, 0, 0
    ); // Initial default pass

    this.addThreeJSObjectOutput('pass', 'Effect Pass'); // Output for the THREE.Pass object
  }

  initObject() {
    // No need to instantiate here, done in constructor
  }

  updateObject(inputs, properties) {
    const resolutionX = inputs['resolutionX']?.length ? inputs['resolutionX'][0] : properties['resolutionX'];
    const resolutionY = inputs['resolutionY']?.length ? inputs['resolutionY'][0] : properties['resolutionY'];
    const strength = inputs['strength']?.length ? inputs['strength'][0] : properties['strength'];
    const radius = inputs['radius']?.length ? inputs['radius'][0] : properties['radius'];
    const threshold = inputs['threshold']?.length ? inputs['threshold'][0] : properties['threshold'];

    if (this.object) {
      this.object.resolution.set(resolutionX || window.innerWidth, resolutionY || window.innerHeight);
      this.object.strength = strength || 1;
      this.object.radius = radius || 0;
      this.object.threshold = threshold || 0;
    } else {
      this.object = new UnrealBloomPass(
        new THREE.Vector2(resolutionX || window.innerWidth, resolutionY || window.innerHeight),
        strength || 1,
        radius || 0,
        threshold || 0
      );
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ pass: this.object });
  }
}