import { BaseVisualReteNode } from './BaseVisualReteNode';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import * as THREE from 'three';

export class UnrealBloomReteNode extends BaseVisualReteNode {
  constructor(initialCustomData = {}) {
    super('Unreal Bloom', { visualType: 'unreal-bloom', customData: initialCustomData });
    
    // Define Inputs using the helper methods from MyBaseReteNode
    this.addInputWithLabel('scene', 'Scene');
    this.addInputWithLabel('camera', 'Camera');
    this.addInputWithLabel('renderer', 'Renderer');

    // Define Outputs using the helper methods from MyBaseReteNode
    this.addOutputWithLabel('scene', 'Scene');

    // Define Controls using the helper methods from MyBaseReteNode
    this.addControlWithLabel('threshold', 'number', 'Threshold', {
      initial: initialCustomData.threshold || 0.21,
      min: 0,
      max: 1,
      step: 0.01
    });
    this.addControlWithLabel('strength', 'number', 'Strength', {
      initial: initialCustomData.strength || 1.5,
      min: 0,
      max: 5,
      step: 0.1
    });
    this.addControlWithLabel('radius', 'number', 'Radius', {
      initial: initialCustomData.radius || 0.55,
      min: 0,
      max: 1,
      step: 0.01
    });

    this.composer = null;
  }

  // Use the data method for Rete v2 dataflow pattern
  data(inputs) {
    // Get input values from the inputs object
    const scene = inputs.scene && inputs.scene.length > 0 ? inputs.scene[0] : null;
    const camera = inputs.camera && inputs.camera.length > 0 ? inputs.camera[0] : null;
    const renderer = inputs.renderer && inputs.renderer.length > 0 ? inputs.renderer[0] : null;

    if (!scene || !camera || !renderer) {
      return { scene: null };
    }

    if (!this.composer) {
      this.composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      this.composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
      this.composer.addPass(bloomPass);

      const outputPass = new OutputPass();
      this.composer.addPass(outputPass);
    }

    const bloomPass = this.composer.passes[1];
    bloomPass.threshold = this.getProperty('threshold');
    bloomPass.strength = this.getProperty('strength');
    bloomPass.radius = this.getProperty('radius');

    this.composer.render();

    return { scene: this.composer.readBuffer.texture };
  }
}
