import * as THREE from 'three'; // For THREE.Clock

/**
 * @typedef {import('../store').default} ZustandStoreType
 * @typedef {import('../types/timeline').DanceBlock} DanceBlock
 */

class Playhead {
  /**
   * @param {object} options
   * @param {() => DanceBlock[]} options.getDanceBlocks - Function to get current dance blocks.
   * @param {(time: number) => void} options.setPlayheadTime - Function to update playhead time in store.
   * @param {(playing: boolean) => void} options.setIsDancePlaying - Function to update playing state in store.
   * @param {(motionUrl: string, startOffset: number, duration: number) => void} options.playVRMMotion - Function to play a VRM motion.
   * @param {() => boolean} options.getIsDancePlaying - Function to get current playing state.
   * @param {() => number} options.getPlayheadTime - Function to get current playhead time.
   */
  constructor({ getDanceBlocks, setPlayheadTime, setIsDancePlaying, playVRMMotion, getIsDancePlaying, getPlayheadTime }) {
    this.getDanceBlocks = getDanceBlocks;
    this.setPlayheadTime = setPlayheadTime;
    this.setIsDancePlaying = setIsDancePlaying;
    this.playVRMMotion = playVRMMotion;
    this.getIsDancePlaying = getIsDancePlaying;
    this.getPlayheadTime = getPlayheadTime;

    this.clock = new THREE.Clock();
    this.animationFrameId = null;
    this.lastTimestamp = 0;

    /** @type {string | null} */
    this.currentlyPlayingBlockId = null;
    /** @type {DanceBlock | null} */
    this.currentlyPlayingBlockData = null; // Store the full block data for event emission

    this._eventHandlers = {
      motionStart: [],
      motionEnd: [],
    };
  }

  /**
   * Register an event handler.
   * @param {'motionStart' | 'motionEnd'} eventName
   * @param {(payload: any) => void} callback
   */
  on(eventName, callback) {
    if (this._eventHandlers[eventName]) {
      this._eventHandlers[eventName].push(callback);
    } else {
      console.warn(`Playhead: Attempted to subscribe to unknown event "${eventName}"`);
    }
  }

  /**
   * Unregister an event handler.
   * @param {'motionStart' | 'motionEnd'} eventName
   * @param {(payload: any) => void} callback
   */
  off(eventName, callback) {
    if (this._eventHandlers[eventName]) {
      this._eventHandlers[eventName] = this._eventHandlers[eventName].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit an event to all registered handlers.
   * @private
   * @param {'motionStart' | 'motionEnd'} eventName
   * @param {any} payload
   */
  _emit(eventName, payload) {
    (this._eventHandlers[eventName] || []).forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Playhead: Error in '${eventName}' event handler:`, error);
      }
    });
  }

  start() {
    if (this.getIsDancePlaying()) return;

    this.setIsDancePlaying(true);
    this.clock.start();
    this.lastTimestamp = performance.now();
    this.tick();
    console.log("Playhead started");
  }

  stop() {
    if (!this.getIsDancePlaying()) return;

    this.setIsDancePlaying(false);
    this.clock.stop();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Optionally, tell VRMViewer to stop current motion explicitly
    // this.playVRMMotion('default_idle', 0, 0);
    if (this.currentlyPlayingBlockData) {
        this._emit('motionEnd', { block: this.currentlyPlayingBlockData, playheadTime: this.getPlayheadTime() });
    }
    this.currentlyPlayingBlockId = null;
    this.currentlyPlayingBlockData = null;
    console.log("Playhead stopped");
  }

  reset() {
    const wasPlaying = this.getIsDancePlaying();
    this.stop(); // This will emit motionEnd if a motion was playing
    this.setPlayheadTime(0);
    // currentlyPlayingBlockId and Data are already nullified by stop()
    console.log("Playhead reset");
    if (wasPlaying) { // If it was playing, start it again from 0 (typical reset behavior for some sequencers)
        // This behavior might be optional. For now, reset means stop and go to 0.
        // To make it play from 0: this.start();
    }
  }

  tick() {
    if (!this.getIsDancePlaying()) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.tick());

    const delta = this.clock.getDelta(); // Time since last tick call (affected by clock.start/stop)
    // Note: clock.elapsedTime could also be used if we want absolute time since start.
    // For now, let's manage playheadTime by accumulating delta.

    const newPlayheadTime = this.getPlayheadTime() + delta;
    this.setPlayheadTime(newPlayheadTime);

    const blocks = this.getDanceBlocks();
    let activeBlockFoundThisTick = false;

    for (const block of blocks) {
      const blockStartTime = block.startTime;
      const blockEndTime = block.startTime + block.duration;

      if (newPlayheadTime >= blockStartTime && newPlayheadTime < blockEndTime) {
        activeBlockFoundThisTick = true;
        if (this.currentlyPlayingBlockId !== block.id) {
          // Emit motionEnd for the previous block if there was one
          if (this.currentlyPlayingBlockData) {
            this._emit('motionEnd', { block: this.currentlyPlayingBlockData, playheadTime: newPlayheadTime });
          }

          console.log(`Playhead: Starting block ${block.id} (${block.motionId}) at ${newPlayheadTime.toFixed(2)}s`);
          this.playVRMMotion(block.motionUrl, 0, block.duration);
          this.currentlyPlayingBlockId = block.id;
          this.currentlyPlayingBlockData = block;
          this._emit('motionStart', { block: this.currentlyPlayingBlockData, playheadTime: newPlayheadTime });
        }
        break;
      }
    }

    // If no block is active at the current time, but a motion was previously playing
    if (!activeBlockFoundThisTick && this.currentlyPlayingBlockId !== null) {
      console.log(`Playhead: Exited active block region for ${this.currentlyPlayingBlockId}. Current time: ${newPlayheadTime.toFixed(2)}s`);
      if (this.currentlyPlayingBlockData) {
        this._emit('motionEnd', { block: this.currentlyPlayingBlockData, playheadTime: newPlayheadTime });
      }
      // Optionally tell VRMViewer to play idle, but playVRMMotion handles transitions.
      // this.playVRMMotion('default_idle', 0, 0);
      this.currentlyPlayingBlockId = null;
      this.currentlyPlayingBlockData = null;
    }

    // Loop behavior (optional, for now stops at end of content)
    // const totalTimelineDuration = blocks.length > 0 ? Math.max(...blocks.map(b => b.startTime + b.duration)) : 0;
    // if (newPlayheadTime >= totalTimelineDuration && totalTimelineDuration > 0) {
    //   this.stop(); // Or loop: this.setPlayheadTime(0); this.currentlyPlayingBlockId = null;
    // }
  }
}

export default Playhead;
