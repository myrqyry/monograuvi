import * as THREE from 'three';

/**
 * Manages Three.js resources (geometries, materials, textures, render targets)
 * including pooling and disposal for performance optimization.
 */
export class ThreeJSResourceManager {
  constructor() {
    this.geometries = new Map();
    this.materials = new Map();
    this.textures = new Map();
    this.renderTargets = new Map();
  }

  /**
   * Registers or retrieves a geometry.
   * @param {string} id - Unique identifier for the geometry.
   * @param {THREE.BufferGeometry} geometry - The geometry to register.
   * @returns {THREE.BufferGeometry} The registered or retrieved geometry.
   */
  getOrRegisterGeometry(id, geometry) {
    if (!this.geometries.has(id)) {
      this.geometries.set(id, geometry);
    }
    return this.geometries.get(id);
  }

  /**
   * Registers or retrieves a material.
   * @param {string} id - Unique identifier for the material.
   * @param {THREE.Material} material - The material to register.
   * @returns {THREE.Material} The registered or retrieved material.
   */
  getOrRegisterMaterial(id, material) {
    if (!this.materials.has(id)) {
      this.materials.set(id, material);
    }
    return this.materials.get(id);
  }

  /**
   * Registers or retrieves a texture.
   * @param {string} id - Unique identifier for the texture.
   * @param {THREE.Texture} texture - The texture to register.
   * @returns {THREE.Texture} The registered or retrieved texture.
   */
  getOrRegisterTexture(id, texture) {
    if (!this.textures.has(id)) {
      this.textures.set(id, texture);
    }
    return this.textures.get(id);
  }

  /**
   * Registers or retrieves a render target.
   * @param {string} id - Unique identifier for the render target.
   * @param {THREE.WebGLRenderTarget} renderTarget - The render target to register.
   * @returns {THREE.WebGLRenderTarget} The registered or retrieved render target.
   */
  getOrRegisterRenderTarget(id, renderTarget) {
    if (!this.renderTargets.has(id)) {
      this.renderTargets.set(id, renderTarget);
    }
    return this.renderTargets.get(id);
  }

  /**
   * Disposes of a specific resource.
   * @param {string} type - Type of resource ('geometry', 'material', 'texture', 'renderTarget').
   * @param {string} id - ID of the resource to dispose.
   */
  disposeResource(type, id) {
    switch (type) {
      case 'geometry':
        if (this.geometries.has(id)) {
          this.geometries.get(id).dispose();
          this.geometries.delete(id);
        }
        break;
      case 'material':
        if (this.materials.has(id)) {
          this.materials.get(id).dispose();
          this.materials.delete(id);
        }
        break;
      case 'texture':
        if (this.textures.has(id)) {
          this.textures.get(id).dispose();
          this.textures.delete(id);
        }
        break;
      case 'renderTarget':
        if (this.renderTargets.has(id)) {
          this.renderTargets.get(id).dispose();
          this.renderTargets.delete(id);
        }
        break;
      default:
        console.warn(`Unknown resource type for disposal: ${type}`);
    }
  }

  /**
   * Disposes all managed resources.
   */
  disposeAll() {
    this.geometries.forEach(geo => geo.dispose());
    this.materials.forEach(mat => mat.dispose());
    this.textures.forEach(tex => tex.dispose());
    this.renderTargets.forEach(rt => rt.dispose());

    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
    this.renderTargets.clear();
    console.log('All Three.js resources disposed.');
  }

  /**
   * Cleans up unused resources based on some criteria (e.g., LRU, reference count).
   * This is a placeholder for more advanced resource management.
   */
  cleanupUnusedResources() {
    // Implement more sophisticated cleanup logic here (e.g., reference counting, LRU caches)
    // For now, this just logs a message.
    console.log('Performing cleanup of Three.js resources...');
  }
}

export default new ThreeJSResourceManager(); // Export a singleton instance