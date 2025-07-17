import * as THREE from 'three';

/**
 * Manages the Three.js rendering pipeline, orchestrating rendering passes
 * and handling multiple scenes/cameras if necessary.
 */
export class ThreeJSRenderPipeline {
  constructor(renderer, options = {}) {
    if (!renderer) {
      throw new Error("ThreeJSRenderPipeline requires a Three.js WebGLRenderer instance.");
    }
    this.renderer = renderer;
    this.outputTarget = options.outputTarget || null; // Can be a WebGLRenderTarget or null for screen
    this.clearColor = options.clearColor !== undefined ? options.clearColor : 0x000000;
    this.clearAlpha = options.clearAlpha !== undefined ? options.clearAlpha : 0;

    // Default scene and camera, can be overridden per render call
    this.defaultScene = new THREE.Scene();
    this.defaultCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.defaultCamera.position.z = 5;

    // Post-processing setup (can be extended with an EffectComposer)
    this.effectComposer = null; // Will initialize if post-processing is needed
  }

  /**
   * Sets the default scene for rendering.
   * @param {THREE.Scene} scene - The Three.js Scene to use as default.
   */
  setDefaultScene(scene) {
    this.defaultScene = scene;
  }

  /**
   * Sets the default camera for rendering.
   * @param {THREE.Camera} camera - The Three.js Camera to use as default.
   */
  setDefaultCamera(camera) {
    this.defaultCamera = camera;
  }

  /**
   * Performs a single render pass.
   * @param {Object} [options] - Options for the render pass.
   * @param {THREE.Scene} [options.scene] - The scene to render. Defaults to `this.defaultScene`.
   * @param {THREE.Camera} [options.camera] - The camera to use for rendering. Defaults to `this.defaultCamera`.
   * @param {THREE.WebGLRenderTarget} [options.renderTarget] - The render target to render to. Defaults to `this.outputTarget` (screen if null).
   * @param {boolean} [options.clear] - Whether to clear the renderer before rendering. Defaults to `true`.
   */
  render(options = {}) {
    const scene = options.scene || this.defaultScene;
    const camera = options.camera || this.defaultCamera;
    const renderTarget = options.renderTarget || this.outputTarget;
    const clear = options.clear !== undefined ? options.clear : true;

    if (!scene || !camera) {
      console.warn("Cannot render: scene or camera not set.");
      return;
    }

    this.renderer.setRenderTarget(renderTarget);
    if (clear) {
      this.renderer.setClearColor(this.clearColor, this.clearAlpha);
      this.renderer.clear();
    }
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null); // Reset to screen
  }

  /**
   * Renders the scene with post-processing effects using an EffectComposer.
   * Requires EffectComposer and necessary passes to be set up elsewhere.
   * @param {EffectComposer} composer - The EffectComposer instance.
   */
  renderWithComposer(composer) {
    if (!composer) {
      console.warn("EffectComposer not provided for renderWithComposer.");
      return;
    }
    composer.render();
  }

  /**
   * Resizes the renderer and updates the default camera's aspect ratio.
   * @param {number} width - New width for the renderer.
   * @param {number} height - New height for the renderer.
   */
  setSize(width, height) {
    this.renderer.setSize(width, height);
    if (this.defaultCamera instanceof THREE.PerspectiveCamera) {
      this.defaultCamera.aspect = width / height;
      this.defaultCamera.updateProjectionMatrix();
    }
    if (this.effectComposer) {
      this.effectComposer.setSize(width, height);
    }
  }

  /**
   * Disposes of owned Three.js resources (default scene and camera).
   * Note: The renderer itself should be disposed externally.
   */
  dispose() {
    this.defaultScene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          m.dispose();
        }
      }
    });
    // For now, no explicit dispose for camera needed, but handle if it contains render targets or other disposables
    // if (this.effectComposer) {
    //   this.effectComposer.dispose(); // If EffectComposer has a dispose method
    // }
    this.defaultScene = null;
    this.defaultCamera = null;
    this.renderer = null;
    this.outputTarget = null;
    this.effectComposer = null;
  }
}