import { ThreeJSBaseNode } from './ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

export class SceneNode extends ThreeJSBaseNode {
  constructor() {
    super('Three.js Scene');
    this.addInputWithLabel('objects', 'Objects', Classic.socket('object'), null, true); // Accepts multiple objects
    this.addThreeJSObjectOutput('scene', 'Scene Out'); // Output for the THREE.Scene object

    this.object = new THREE.Scene(); // Initial default scene
  }

  initObject() {
    // No need to instantiate here, it's done in the constructor
  }

  updateObject(inputs, properties) {
    const objects = inputs['objects'] ? inputs['objects'].filter(o => o instanceof THREE.Object3D || o instanceof THREE.Light) : [];

    // Clear existing objects from the scene, except lights which might be added separately
    // A more robust solution might involve tracking objects added by this node.
    this.object.children.forEach(child => {
      // Only remove objects that would be managed by this node's input.
      // This is a simplified approach, a proper resource manager would track ownership.
      const isInputManaged = objects.includes(child); // Check if the child is one of the current inputs
      if (!isInputManaged) {
          // If it's not a current input, remove if it was previously added by this node (requires tracking)
          // For now, removing all that are not in current inputs to simplify.
          // This will dispose of objects not connected anymore. A proper system would dispose only if no other node uses it.
          // For simplicity in this initial implementation, assume inputs are what should be in the scene.
          if (!(child instanceof THREE.Light) && !(child instanceof THREE.Camera)) { // Keep lights and cameras if they're not explicitly handled as inputs
            this.object.remove(child);
          }
      }
    });

    // Add new objects
    objects.forEach(obj => {
      if (!this.object.children.includes(obj)) { // Add only if not already in scene
        this.object.add(obj);
      }
    });

    // Handle background color/image or environment based on other properties if needed
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ scene: this.object });
  }
}