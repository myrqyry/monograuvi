// AudioContextManager: Safe AudioContext creation and lifecycle management

import { initManager } from './InitializationManager';

// Assuming useStore is the Zustand store for global state
import useStore from '../store';

export class AudioContextManager {
  constructor() {
    this.context = null;
    this.status = 'uninitialized'; // 'uninitialized', 'pending', 'running', 'suspended', 'closed', 'error'
    this.initPromise = null;
    this.subscribers = new Set();
    this._handleStateChange = this._handleStateChange.bind(this);
  }

  // Simplified initialize, does not create context
  async initialize() {
    // This can be used for any setup that doesn't require a user gesture
    return Promise.resolve();
  }

  // This method should be called by a user gesture (e.g., button click)
  async requestAndCreateContext() {
    if (this.context && this.context.state === 'running') {
      return this.context;
    }
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this._createContext();
    return this.initPromise;
  }

  async _createContext() {
    try {
      this.setStatus('pending');
      const existingContext = useStore.getState().audioContext;
      if (existingContext && existingContext.state !== 'closed') {
        this.context = existingContext;
      } else {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        useStore.getState().setAudioContext(this.context);
      }

      this.context.removeEventListener('statechange', this._handleStateChange);
      this.context.addEventListener('statechange', this._handleStateChange);

      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      this._handleStateChange(); // Initial state check
      this.markReady();
      return this.context;
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      this.setStatus('error');
      initManager.state.audioContext = 'ERROR';
      throw error;
    } finally {
      this.initPromise = null; // Allow retrying if it fails
    }
  }

  _handleStateChange() {
    this.setStatus(this.context.state);
  }

  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    useStore.getState().setAudioContextStatus(status); // Assuming you add this to your store
    if (status === 'running') {
      this.notifySubscribers();
    }
  }

  markReady() {
    initManager.setComponentReady('audioContext', this.context);
    this.notifySubscribers();
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.context);
      } catch (error) {
        console.error('Error notifying AudioContext subscriber:', error);
      }
    });
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    if (this.context && this.context.state === 'running') {
      callback(this.context);
    }
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  getContext() {
    return this.context;
  }
}

// Singleton instance
export const audioContextManager = new AudioContextManager();