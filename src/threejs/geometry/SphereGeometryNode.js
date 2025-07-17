import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class SphereGeometryNode extends ThreeJSBaseNode {
  constructor() {
    super('Sphere Geometry');
    this.addInputWithLabel('radius', 'Radius', Classic.socket('Number'), 1); // Default radius
    this.addInputWithLabel('widthSegments', 'Width Segments', Classic.socket('Number'), 32); // Default width segments
    this.addInputWithLabel('heightSegments', 'Height Segments', Classic.socket('Number'), 16); // Default height segments
    this.addInputWithLabel('phiStart', 'Phi Start', Classic.socket('Number'), 0);
    this.addInputWithLabel('phiLength', 'Phi Length', Classic.socket('Number'), Math.PI * 2);
    this.addInputWithLabel('thetaStart', 'Theta Start', Classic.socket('Number'), 0);
    this.addInputWithLabel('thetaLength', 'Theta Length', Classic.socket('Number'), Math.PI);

    this.object = new THREE.SphereGeometry(1, 32, 16); // Initial default geometry
    this.addThreeJSObjectOutput('geometry', 'Sphere Geometry'); // Output for the THREE.BufferGeometry object
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const radius = inputs['radius']?.length ? inputs['radius'][0] : properties['radius'];
    const widthSegments = inputs['widthSegments']?.length ? inputs['widthSegments'][0] : properties['widthSegments'];
    const heightSegments = inputs['heightSegments']?.length ? inputs['heightSegments'][0] : properties['heightSegments'];
    const phiStart = inputs['phiStart']?.length ? inputs['phiStart'][0] : properties['phiStart'];
    const phiLength = inputs['phiLength']?.length ? inputs['phiLength'][0] : properties['phiLength'];
    const thetaStart = inputs['thetaStart']?.length ? inputs['thetaStart'][0] : properties['thetaStart'];
    const thetaLength = inputs['thetaLength']?.length ? inputs['thetaLength'][0] : properties['thetaLength'];

    // Dispose of the old geometry to prevent memory leaks
    if (this.object) {
      this.object.dispose();
    }

    this.object = new THREE.SphereGeometry(
      radius || 1,
      widthSegments || 32,
      heightSegments || 16,
      phiStart || 0,
      phiLength || Math.PI * 2,
      thetaStart || 0,
      thetaLength || Math.PI
    );
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ geometry: this.object });
  }
}