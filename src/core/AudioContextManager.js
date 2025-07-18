// AudioContextManager: Safe AudioContext creation and lifecycle management

import { initManager } from './InitializationManager';

// Assuming useStore is the Zustand store for global state
import useStore from '../store';

export class AudioContextManager {
  constructor() {
    this.context = null;
    this.initPromise = null;
    this.subscribers = new Set();
  }

  async initialize() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.createContext();
    return this.initPromise;
  }

  async createContext() {
    try {
      // Check if context already exists in store
      const existingContext = useStore.getState().audioContext;
      if (existingContext && existingContext.state !== 'closed') {
        this.context = existingContext;
        this.markReady();
        return this.context;
      }

      // Create new context
      this.context = new (window.AudioContext || window.webkitAudioContext)();

      // Handle context state changes
      this.context.addEventListener('statechange', () => {
        if (this.context.state === 'running') {
          this.notifySubscribers();
        }
      });

      // Resume context if suspended
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      // Set in store
      useStore.getState().setAudioContext(this.context);

      this.markReady();
      return this.context;
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      initManager.state.audioContext = 'ERROR';
      throw error;
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