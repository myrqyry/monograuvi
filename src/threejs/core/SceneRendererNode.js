import { ThreeJSBaseNode } from './ThreeJSBaseNode';
import { ThreeJSRenderPipeline } from './ThreeJSRenderPipeline';
import * as THREE from 'three';
import { ClassicPreset as Classic } from 'rete';

// Assuming we have a global renderer instance available or passed in context
// For now, let's assume `renderer` will be passed as an input or provided via a global context/hook.
// For the purpose of this node, we'll primarily interact with the pipeline.

export class SceneRendererNode extends ThreeJSBaseNode {
  constructor() {
    super('Scene Renderer');
    this.addInputWithLabel('renderer', 'Renderer', Classic.socket('object'));
    this.addInputWithLabel('scene', 'Scene', Classic.socket('object'));
    this.addInputWithLabel('camera', 'Camera', Classic.socket('object'));
    this.addInputWithLabel('composer', 'Composer', Classic.socket('object'));

    this.object = null; // This node doesn't output a Three.js object, but orchestrates rendering
  }

  initObject() {
    // No Three.js object to initialize for this node itself
  }

  updateObject(inputs) {
    const renderer = inputs['renderer']?.length ? inputs['renderer'][0] : null;
    const scene = inputs['scene']?.length ? inputs['scene'][0] : null;
    const camera = inputs['camera']?.length ? inputs['camera'][0] : null;
    const composer = inputs['composer']?.length ? inputs['composer'][0] : null;

    if (!renderer || !scene || !camera) {
      // Not enough inputs to render
      if (this.pipeline) {
        this.pipeline.dispose();
        this.pipeline = null;
      }
      return;
    }

    if (!this.pipeline || this.pipeline.renderer !== renderer) {
      if (this.pipeline) {
        this.pipeline.dispose();
      }
      this.pipeline = new ThreeJSRenderPipeline(renderer);
    }

    this.pipeline.setDefaultScene(scene);
    this.pipeline.setDefaultCamera(camera);

    if (composer) {
      this.pipeline.renderWithComposer(composer);
    } else {
      this.pipeline.render();
    }
  }

  async execute(inputs, forward) {
    // This node does not output a Three.js object; its purpose is to trigger rendering.
    // It might output a "rendered" signal or texture in more complex scenarios.
    // For now, its side effect is rendering to the canvas.
    this.updateObject(inputs);
    forward({}); // No explicit output
  }

  // Override dispose to clean up the pipeline instance
  dispose() {
    if (this.pipeline) {
      this.pipeline.dispose();
      this.pipeline = null;
    }
    super.dispose();
  }
}