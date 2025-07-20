import { BaseVisualReteNode } from './BaseVisualReteNode';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import * as THREE from 'three';

export class PostprocessingReteNode extends BaseVisualReteNode {
  constructor(initialCustomData = {}) {
    super('Postprocessing', { visualType: 'postprocessing', customData: initialCustomData });

    this.addInputWithLabel('scene', 'Scene');
    this.addInputWithLabel('camera', 'Camera');
    this.addInputWithLabel('renderer', 'Renderer');
    this.addOutputWithLabel('scene', 'Scene');

    this.addControlWithLabel('addEffect', 'select', 'Add Effect', {
      initial: 'bloom',
      options: ['bloom', 'glitch', 'afterimage']
    });
    this.addControlWithLabel('add', 'button', 'Add', { onClick: this.addEffect.bind(this) });
    this.addControlWithLabel('remove', 'button', 'Remove Last', { onClick: this.removeEffect.bind(this) });

    this.composer = null;
    this.effects = [];
  }

  addEffect() {
    const effectType = this.getProperty('addEffect');
    this.effects.push(effectType);
    this.updatePasses();
  }

  removeEffect() {
    this.effects.pop();
    this.updatePasses();
  }

  updatePasses() {
    if (!this.composer) return;

    // Clear existing passes except the render pass
    this.composer.passes = [this.composer.passes[0]];

    this.effects.forEach(effectType => {
      let pass;
      switch (effectType) {
        case 'bloom':
          pass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
          break;
        case 'glitch':
          pass = new GlitchPass();
          break;
        case 'afterimage':
          pass = new AfterimagePass();
          break;
        default:
          return;
      }
      this.composer.addPass(pass);
    });

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  data(inputs) {
    const scene = inputs.scene?.[0];
    const camera = inputs.camera?.[0];
    const renderer = inputs.renderer?.[0];

    if (!scene || !camera || !renderer) {
      return { scene: null };
    }

    if (!this.composer) {
      this.composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      this.composer.addPass(renderPass);
      this.updatePasses();
    }

    this.composer.render();

    return { scene: this.composer.readBuffer.texture };
  }
}
