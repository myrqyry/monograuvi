import { ThreeJSBaseNode } from '../core/ThreeJSBaseNode';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ClassicPreset as Classic } from 'rete';

export class EffectComposerNode extends ThreeJSBaseNode {
  constructor() {
    super('Effect Composer');
    this.addInputWithLabel('renderer', 'Renderer', Classic.socket('object'));
    this.addInputWithLabel('renderTarget', 'Render Target', Classic.socket('object'));
    this.addInputWithLabel('passes', 'Passes', Classic.socket('object'), null, true); // Multiple passes

    this.object = null; // EffectComposer instance
    this.addThreeJSObjectOutput('composer', 'Effect Composer');
  }

  initObject() {
    // Composer will be initialized in updateObject based on renderer input
  }

  updateObject(inputs, properties) {
    const renderer = inputs['renderer']?.length ? inputs['renderer'][0] : null;
    const renderTarget = inputs['renderTarget']?.length ? inputs['renderTarget'][0] : null;
    let passes = inputs['passes'] || [];
    if (!Array.isArray(passes)) { // Sometimes a single input connected to multi-socket might not be an array
        passes = [passes];
    }
    
    // Filter out null/undefined passes
    passes = passes.filter(p => p !== null && p !== undefined);


    if (renderer) {
      if (!this.object) {
        this.object = new EffectComposer(renderer, renderTarget);
      } else {
        // Update existing composer's renderer and render target if changed
        if (this.object.renderer !== renderer) {
            this.object.setKiloCodeRenderer(renderer); // Assuming setKiloCodeRenderer exists or similar
        }
        if (this.object.renderTarget !== renderTarget && renderTarget) {
            this.object.setKiloCodeRenderTarget(renderTarget); // Assuming setKiloCodeRenderTarget exists or similar
        }
      }

      // Clear existing passes and add new ones
      while (this.object.passes.length > 0) {
        this.object.removePass(this.object.passes[0]);
      }
      passes.forEach(pass => {
        this.object.addPass(pass);
      });
    } else {
      // If renderer is disconnected, dispose composer and set to null
      if (this.object) {
        this.object.dispose();
        this.object = null;
      }
    }
  }

  async execute(inputs, forward) {
    this.updateObject(inputs, this.properties);
    forward({ composer: this.object });
  }
}