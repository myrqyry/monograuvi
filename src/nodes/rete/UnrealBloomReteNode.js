import { BaseVisualReteNode } from './BaseVisualReteNode';
import { classic } from 'rete';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import * as THREE from 'three';

export class UnrealBloomReteNode extends BaseVisualReteNode {
  constructor(initialData = {}) {
    super('Unreal Bloom', { visualType: 'unreal-bloom', ...initialData });
    
    this.addInput('scene', new classic.Input(this.sockets.scene, 'Scene'));
    this.addInput('camera', new classic.Input(this.sockets.camera, 'Camera'));
    this.addInput('renderer', new classic.Input(this.sockets.renderer, 'Renderer'));

    this.addOutput('scene', new classic.Output(this.sockets.scene, 'Scene'));

    this.addControl('threshold', new classic.Control('number', { label: 'Threshold', initial: 0.21 }));
    this.addControl('strength', new classic.Control('number', { label: 'Strength', initial: 1.5 }));
    this.addControl('radius', new classic.Control('number', { label: 'Radius', initial: 0.55 }));

    this.composer = null;
  }

  async execute(inputs, forward) {
    const { scene, camera, renderer } = inputs;

    if (!scene || !camera || !renderer) {
      return;
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
    bloomPass.threshold = this.controls.threshold.value;
    bloomPass.strength = this.controls.strength.value;
    bloomPass.radius = this.controls.radius.value;

    this.composer.render();

    forward({ scene: this.composer.readBuffer.texture });
  }
}
