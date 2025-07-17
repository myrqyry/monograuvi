import { ThreeJSBaseNode } from './ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class MeshNode extends ThreeJSBaseNode {
  constructor() {
    super('Mesh');
    this.addInputWithLabel('geometry', 'Geometry', Classic.socket('object'));
    this.addInputWithLabel('material', 'Material', Classic.socket('object'));
    this.addInputWithLabel('positionX', 'Position X', Classic.socket('Number'), 0);
    this.addInputWithLabel('positionY', 'Position Y', Classic.socket('Number'), 0);
    this.addInputWithLabel('positionZ', 'Position Z', Classic.socket('Number'), 0);
    this.addInputWithLabel('rotationX', 'Rotation X', Classic.socket('Number'), 0);
    this.addInputWithLabel('rotationY', 'Rotation Y', Classic.socket('Number'), 0);
    this.addInputWithLabel('rotationZ', 'Rotation Z', Classic.socket('Number'), 0);
    this.addInputWithLabel('scaleX', 'Scale X', Classic.socket('Number'), 1);
    this.addInputWithLabel('scaleY', 'Scale Y', Classic.socket('Number'), 1);
    this.addInputWithLabel('scaleZ', 'Scale Z', Classic.socket('Number'), 1);

    this.object = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xcccccc })
    ); // Initial default mesh
    this.addThreeJSObjectOutput('mesh', 'Mesh Out');
  }

  initObject() {
    // No need to instantiate here, done in constructor
  }

  updateObject(inputs, properties) {
    const geometry = inputs['geometry']?.length ? inputs['geometry'][0] : null;
    const material = inputs['material']?.length ? inputs['material'][0] : null;
    const positionX = inputs['positionX']?.length ? inputs['positionX'][0] : properties['positionX'];
    const positionY = inputs['positionY']?.length ? inputs['positionY'][0] : properties['positionY'];
    const positionZ = inputs['positionZ']?.length ? inputs['positionZ'][0] : properties['positionZ'];
    const rotationX = inputs['rotationX']?.length ? inputs['rotationX'][0] : properties['rotationX'];
    const rotationY = inputs['rotationY']?.length ? inputs['rotationY'][0] : properties['rotationY'];
    const rotationZ = inputs['rotationZ']?.length ? inputs['rotationZ'][0] : properties['rotationZ'];
    const scaleX = inputs['scaleX']?.length ? inputs['scaleX'][0] : properties['scaleX'];
    const scaleY = inputs['scaleY']?.length ? inputs['scaleY'][0] : properties['scaleY'];
    const scaleZ = inputs['scaleZ']?.length ? inputs['scaleZ'][0] : properties['scaleZ'];

    if (this.object) {
      if (geometry && this.object.geometry !== geometry) {
        this.object.geometry.dispose(); // Dispose old geometry
        this.object.geometry = geometry;
      }
      if (material && this.object.material !== material) {
        if (Array.isArray(this.object.material)) {
          this.object.material.forEach(m => m.dispose());
        } else {
          this.object.material.dispose(); // Dispose old material
        }
        this.object.material = material;
      }

      this.object.position.set(positionX || 0, positionY || 0, positionZ || 0);
      this.object.rotation.set(rotationX || 0, rotationY || 0, rotationZ || 0);
      this.object.scale.set(scaleX || 1, scaleY || 1, scaleZ || 1);
    } else {
      this.object = new THREE.Mesh(
        geometry || new THREE.BoxGeometry(1, 1, 1),
        material || new THREE.MeshStandardMaterial({ color: 0xcccccc })
      );
      this.object.position.set(positionX || 0, positionY || 0, positionZ || 0);
      this.object.rotation.set(rotationX || 0, rotationY || 0, rotationZ || 0);
      this.object.scale.set(scaleX || 1, scaleY || 1, scaleZ || 1);
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ mesh: this.object });
  }
}