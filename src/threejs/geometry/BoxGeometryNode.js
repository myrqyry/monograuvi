import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class BoxGeometryNode extends ThreeJSBaseNode {
  constructor() {
    super('Box Geometry');
    this.addInputWithLabel('width', 'Width', Classic.socket('Number'), 1);
    this.addInputWithLabel('height', 'Height', Classic.socket('Number'), 1);
    this.addInputWithLabel('depth', 'Depth', Classic.socket('Number'), 1);
    this.addInputWithLabel('widthSegments', 'Width Segments', Classic.socket('Number'), 1);
    this.addInputWithLabel('heightSegments', 'Height Segments', Classic.socket('Number'), 1);
    this.addInputWithLabel('depthSegments', 'Depth Segments', Classic.socket('Number'), 1);

    this.object = new THREE.BoxGeometry(1, 1, 1); // Initial default geometry
    this.addThreeJSObjectOutput('geometry', 'Box Geometry'); // Output for the THREE.BufferGeometry object
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const width = inputs['width']?.length ? inputs['width'][0] : properties['width'];
    const height = inputs['height']?.length ? inputs['height'][0] : properties['height'];
    const depth = inputs['depth']?.length ? inputs['depth'][0] : properties['depth'];
    const widthSegments = inputs['widthSegments']?.length ? inputs['widthSegments'][0] : properties['widthSegments'];
    const heightSegments = inputs['heightSegments']?.length ? inputs['heightSegments'][0] : properties['heightSegments'];
    const depthSegments = inputs['depthSegments']?.length ? inputs['depthSegments'][0] : properties['depthSegments'];

    // Dispose of the old geometry to prevent memory leaks
    if (this.object) {
      this.object.dispose();
    }

    this.object = new THREE.BoxGeometry(
      width || 1,
      height || 1,
      depth || 1,
      widthSegments || 1,
      heightSegments || 1,
      depthSegments || 1
    );
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ geometry: this.object });
  }
}