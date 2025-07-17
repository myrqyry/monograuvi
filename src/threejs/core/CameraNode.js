import { ThreeJSBaseNode } from './ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class PerspectiveCameraNode extends ThreeJSBaseNode {
  constructor() {
    super('Perspective Camera');
    this.addInputWithLabel('fov', 'FOV', Classic.socket('Number'), 75);
    this.addInputWithLabel('aspect', 'Aspect Ratio', Classic.socket('Number'), window.innerWidth / window.innerHeight);
    this.addInputWithLabel('near', 'Near', Classic.socket('Number'), 0.1);
    this.addInputWithLabel('far', 'Far', Classic.socket('Number'), 1000);
    this.addInputWithLabel('positionX', 'Position X', Classic.socket('Number'), 0);
    this.addInputWithLabel('positionY', 'Position Y', Classic.socket('Number'), 0);
    this.addInputWithLabel('positionZ', 'Position Z', Classic.socket('Number'), 5);
    this.addInputWithLabel('lookAtX', 'Look At X', Classic.socket('Number'), 0);
    this.addInputWithLabel('lookAtY', 'Look At Y', Classic.socket('Number'), 0);
    this.addInputWithLabel('lookAtZ', 'Look At Z', Classic.socket('Number'), 0);

    this.object = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.object.position.z = 5;
    this.addThreeJSObjectOutput('camera', 'Camera Out');
  }

  initObject() {
    // No need to instantiate here, done in constructor
  }

  updateObject(inputs, properties) {
    const fov = inputs['fov']?.length ? inputs['fov'][0] : properties['fov'];
    const aspect = inputs['aspect']?.length ? inputs['aspect'][0] : properties['aspect'];
    const near = inputs['near']?.length ? inputs['near'][0] : properties['near'];
    const far = inputs['far']?.length ? inputs['far'][0] : properties['far'];
    const positionX = inputs['positionX']?.length ? inputs['positionX'][0] : properties['positionX'];
    const positionY = inputs['positionY']?.length ? inputs['positionY'][0] : properties['positionY'];
    const positionZ = inputs['positionZ']?.length ? inputs['positionZ'][0] : properties['positionZ'];
    const lookAtX = inputs['lookAtX']?.length ? inputs['lookAtX'][0] : properties['lookAtX'];
    const lookAtY = inputs['lookAtY']?.length ? inputs['lookAtY'][0] : properties['lookAtY'];
    const lookAtZ = inputs['lookAtZ']?.length ? inputs['lookAtZ'][0] : properties['lookAtZ'];

    if (this.object) {
      if (this.object.fov !== fov) {
        this.object.fov = fov || 75;
      }
      if (this.object.aspect !== aspect) {
        this.object.aspect = aspect || (window.innerWidth / window.innerHeight);
      }
      if (this.object.near !== near) {
        this.object.near = near || 0.1;
      }
      if (this.object.far !== far) {
        this.object.far = far || 1000;
      }
      this.object.position.set(positionX || 0, positionY || 0, positionZ || 5);
      this.object.lookAt(lookAtX || 0, lookAtY || 0, lookAtZ || 0);

      this.object.updateProjectionMatrix();
    } else {
      this.object = new THREE.PerspectiveCamera(
        fov || 75,
        aspect || (window.innerWidth / window.innerHeight),
        near || 0.1,
        far || 1000
      );
      this.object.position.set(positionX || 0, positionY || 0, positionZ || 5);
      this.object.lookAt(lookAtX || 0, lookAtY || 0, lookAtZ || 0);
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ camera: this.object });
  }
}