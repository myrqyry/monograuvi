// InitializationManager: Centralized dependency and readiness management for initialization sequence

export class InitializationManager {
  constructor() {
    this.state = {
      audioContext: 'PENDING',
      reteEditor: 'PENDING',
      plugins: 'PENDING',
      nodeFactory: 'PENDING'
    };

    this.dependencies = {
      audioContext: [],
      reteEditor: ['audioContext'],
      plugins: ['reteEditor'],
      nodeFactory: ['audioContext', 'reteEditor', 'plugins']
    };

    this.subscribers = new Map();
    this.readyPromises = new Map();
    this.eventBus = new EventTarget();
  }

  // Register component readiness
  setComponentReady(component, instance = null) {
    if (this.state[component] === 'READY') return;

    this.state[component] = 'READY';
    this.emit(`${component}:ready`, instance);
    this.checkDependentComponents(component);
  }

  // Wait for component to be ready
  waitForComponent(component) {
    if (this.state[component] === 'READY') {
      return Promise.resolve();
    }

    if (!this.readyPromises.has(component)) {
      this.readyPromises.set(component, new Promise(resolve => {
        this.once(`${component}:ready`, resolve);
      }));
    }

    return this.readyPromises.get(component);
  }

  // Wait for multiple components
  waitForComponents(components) {
    return Promise.all(components.map(c => this.waitForComponent(c)));
  }

  // Check if all dependencies are ready
  areDependenciesReady(component) {
    const deps = this.dependencies[component] || [];
    return deps.every(dep => this.state[dep] === 'READY');
  }

  // Check and notify dependent components
  checkDependentComponents(readyComponent) {
    Object.entries(this.dependencies).forEach(([component, deps]) => {
      if (deps.includes(readyComponent) && this.areDependenciesReady(component)) {
        this.emit(`${component}:dependencies-ready`);
      }
    });
  }

  // Event system
  on(event, callback) {
    this.eventBus.addEventListener(event, callback);
  }

  once(event, callback) {
    this.eventBus.addEventListener(event, callback, { once: true });
  }

  emit(event, data) {
    this.eventBus.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Reset component state
  resetComponent(component) {
    this.state[component] = 'PENDING';
    this.readyPromises.delete(component);
  }
}

// Singleton instance
export const initManager = new InitializationManager();