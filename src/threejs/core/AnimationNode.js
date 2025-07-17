import { ThreeJSBaseNode } from './ThreeJSBaseNode';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

// This node will manage animations for a given object,
// potentially integrating with a global animation loop or a timeline.

export class AnimationNode extends ThreeJSBaseNode {
  constructor() {
    super('Animation');
    this.addInputWithLabel('object', 'Object to Animate', Classic.socket('object'));
    this.addInputWithLabel('clip', 'Animation Clip', Classic.socket('object'), null, true); // Accepts multiple clips
    this.addInputWithLabel('play', 'Play', Classic.socket('boolean'), false);
    this.addInputWithLabel('speed', 'Speed', Classic.socket('number'), 1);

    this.mixer = null; // THREE.AnimationMixer instance
    this.actions = new Map(); // Map to store animation actions by clip name/uuid
  }

  initObject() {
    // No specific Three.js object for this node itself, it operates on other objects.
  }

  updateObject(inputs, properties) {
    const targetObject = inputs['object']?.length ? inputs['object'][0] : null;
    const clips = inputs['clip'] || [];
    const play = inputs['play']?.length ? inputs['play'][0] : properties['play'];
    const speed = inputs['speed']?.length ? inputs['speed'][0] : properties['speed'];

    if (!targetObject) {
      if (this.mixer) {
        this.mixer.stopAllAction();
        // this.mixer.uncacheRoot(targetObject); // To completely clean up
        this.mixer = null;
        this.actions.clear();
      }
      return;
    }

    if (!this.mixer || this.mixer.getRoot() !== targetObject) {
      if (this.mixer) {
        this.mixer.stopAllAction();
      }
      this.mixer = new THREE.AnimationMixer(targetObject);
      this.actions.clear();
    }

    clips.forEach(clip => {
      // Ensure clip is a valid AnimationClip
      if (clip instanceof THREE.AnimationClip) {
        if (!this.actions.has(clip.uuid)) {
          const action = this.mixer.clipAction(clip);
          this.actions.set(clip.uuid, action);
        }
        const action = this.actions.get(clip.uuid);
        if (play) {
          action.play();
        } else {
          action.stop();
        }
        action.setEffectiveTimeScale(speed || 1);
      }
    });

    // Stop actions for any clips that are no longer connected
    this.actions.forEach((action, uuid) => {
      if (!clips.some(clip => clip.uuid === uuid)) {
        action.stop();
        this.mixer.uncacheClip(action.getClip()); // Uncache clip if not used
        this.actions.delete(uuid);
      }
    });
  }

  // This node won't output a Three.js object, but it will affect the input object.
  // We need to provide a way to tick the mixer, likely externally.
  // For now, `execute` will ensure the mixer and actions are set up.
  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    // The animation mixer needs to be updated with delta time in the main loop.
    // This node's output might be the same object, or a signal that it's animated.
    forward({ animatedObject: inputs['object']?.length ? inputs['object'][0] : null });
  }

  // Delta time provided by the main animation loop is crucial for the mixer.
  // This method would be called externally, e.g., from the main render loop.
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
      this.mixer = null;
      this.actions.clear();
    }
    super.dispose();
  }
}