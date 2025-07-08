import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Playhead from './Playhead'; // Adjust path as necessary
import * as THREE from 'three';

// Mock THREE.Clock
vi.mock('three', async (importOriginal) => {
  const originalThree = await importOriginal();
  return {
    ...originalThree,
    Clock: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      getDelta: vi.fn().mockReturnValue(0.016), // Mock delta time e.g., ~60fps
      elapsedTime: 0,
    })),
  };
});

describe('Playhead', () => {
  let playhead;
  let mockGetDanceBlocks;
  let mockSetPlayheadTime;
  let mockSetIsDancePlaying;
  let mockPlayVRMMotion;
  let mockGetIsDancePlaying;
  let mockGetPlayheadTime;

  const sampleBlocks = [
    { id: 'b1', motionId: 'm1', motionUrl: '/m1.vmd', startTime: 0, duration: 2 },
    { id: 'b2', motionId: 'm2', motionUrl: '/m2.vmd', startTime: 2.5, duration: 1.5 },
  ];

  beforeEach(() => {
    mockGetDanceBlocks = vi.fn().mockReturnValue(sampleBlocks);
    mockSetPlayheadTime = vi.fn();
    mockSetIsDancePlaying = vi.fn();
    mockPlayVRMMotion = vi.fn();

    // Default to not playing, time at 0
    let internalIsPlaying = false;
    let internalPlayheadTime = 0;

    mockGetIsDancePlaying = vi.fn(() => internalIsPlaying);
    mockGetPlayheadTime = vi.fn(() => internalPlayheadTime);

    // Allow mocks to update internal state for more realistic testing of setPlayheadTime
    mockSetPlayheadTime.mockImplementation((time) => {
      internalPlayheadTime = time;
    });
    mockSetIsDancePlaying.mockImplementation((playing) => {
      internalIsPlaying = playing;
    });


    playhead = new Playhead({
      getDanceBlocks: mockGetDanceBlocks,
      setPlayheadTime: mockSetPlayheadTime,
      setIsDancePlaying: mockSetIsDancePlaying,
      playVRMMotion: mockPlayVRMMotion,
      getIsDancePlaying: mockGetIsDancePlaying,
      getPlayheadTime: mockGetPlayheadTime,
    });

    // Reset mocks for THREE.Clock instances if needed (though vi.fn() does this per call)
    // playhead.clock.start.mockClear();
    // playhead.clock.stop.mockClear();
    // playhead.clock.getDelta.mockClear();
    vi.useFakeTimers(); // Use fake timers for requestAnimationFrame
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore any other mocks
    vi.clearAllTimers(); // Clear timers
    vi.useRealTimers(); // Restore real timers
  });

  it('should initialize correctly', () => {
    expect(playhead.clock).toBeDefined();
    expect(playhead.getIsDancePlaying()).toBe(false);
    expect(playhead.getPlayheadTime()).toBe(0);
  });

  it('start() should set playing state, start clock, and request animation frame', () => {
    playhead.start();
    expect(mockSetIsDancePlaying).toHaveBeenCalledWith(true);
    expect(playhead.clock.start).toHaveBeenCalled();
    expect(playhead.animationFrameId).not.toBeNull(); // Indirectly check if tick was called
    playhead.stop(); // clean up
  });

  it('start() should not do anything if already playing', () => {
    mockGetIsDancePlaying.mockReturnValue(true); // Simulate already playing
    playhead.start();
    expect(mockSetIsDancePlaying).not.toHaveBeenCalledWith(true); // Should not be called again
    expect(playhead.clock.start).not.toHaveBeenCalled();
  });

  it('stop() should set playing state, stop clock, and cancel animation frame', () => {
    playhead.start(); // Start first
    mockSetIsDancePlaying.mockClear(); // Clear previous calls from start()
    playhead.stop();

    expect(mockSetIsDancePlaying).toHaveBeenCalledWith(false);
    expect(playhead.clock.stop).toHaveBeenCalled();
    // Check if animationFrameId was cancelled (becomes null after cancelAnimationFrame)
    // This test is a bit indirect for cancelAnimationFrame. A more direct way is to spy on window.cancelAnimationFrame
    // For now, checking if tick stops is an alternative.
    expect(playhead.animationFrameId).toBeNull();
  });

  it('stop() should not do anything if not playing', () => {
    mockGetIsDancePlaying.mockReturnValue(false); // Simulate not playing
    playhead.stop();
    expect(mockSetIsDancePlaying).not.toHaveBeenCalledWith(false);
    expect(playhead.clock.stop).not.toHaveBeenCalled();
  });

  it('reset() should stop playback and reset playhead time to 0', () => {
    playhead.start(); // Start to set some state
    mockSetPlayheadTime(5); // Simulate some time has passed
    playhead.reset();

    expect(mockSetIsDancePlaying).toHaveBeenCalledWith(false); // Should have been called by stop() within reset()
    expect(mockSetPlayheadTime).toHaveBeenLastCalledWith(0);
    expect(playhead.currentlyPlayingBlockId).toBeNull();
  });

  describe('tick() functionality', () => {
    beforeEach(() => {
      // Ensure playhead is "started" for tick tests
      playhead.start();
      // Clear mocks from the initial start() call if necessary for cleaner assertions in tick tests
      mockSetPlayheadTime.mockClear();
      mockPlayVRMMotion.mockClear();
    });

    afterEach(() => {
      playhead.stop(); // Ensure playhead is stopped after each tick test
    });

    it('tick() should update playheadTime', () => {
      const initialTime = playhead.getPlayheadTime();
      playhead.clock.getDelta.mockReturnValue(0.1); // Set specific delta for predictability

      vi.advanceTimersByTime(100); // Advance rAF

      expect(mockSetPlayheadTime).toHaveBeenCalled();
      expect(playhead.getPlayheadTime()).toBeGreaterThan(initialTime); // Time should have advanced
    });

    it('tick() should call playVRMMotion when entering a block', () => {
      playhead.clock.getDelta.mockReturnValue(0.1);
      mockSetPlayheadTime(0); // Start at time 0

      // Simulate time advancing into the first block (startTime: 0, duration: 2)
      // Tick 1: time = 0 -> 0.1
      vi.advanceTimersByTime(100); // This triggers tick, which calls setPlayheadTime
      expect(mockPlayVRMMotion).toHaveBeenCalledWith(sampleBlocks[0].motionUrl, 0, sampleBlocks[0].duration);
      expect(playhead.currentlyPlayingBlockId).toBe(sampleBlocks[0].id);
    });

    it('tick() should not recall playVRMMotion if already in the same block', () => {
      playhead.clock.getDelta.mockReturnValue(0.1);
      mockSetPlayheadTime(0); // Start at time 0

      // Tick 1: Enter block b1
      vi.advanceTimersByTime(100);
      expect(mockPlayVRMMotion).toHaveBeenCalledTimes(1);
      expect(playhead.currentlyPlayingBlockId).toBe(sampleBlocks[0].id);

      mockPlayVRMMotion.mockClear(); // Clear for next assertion

      // Tick 2: Still in block b1 (time = 0.1 -> 0.2)
      vi.advanceTimersByTime(100);
      expect(mockPlayVRMMotion).not.toHaveBeenCalled(); // Should not be called again for the same block
      expect(playhead.currentlyPlayingBlockId).toBe(sampleBlocks[0].id);
    });

    it('tick() should switch to a new motion when entering a different block', () => {
      playhead.clock.getDelta.mockReturnValue(0.1);
      mockSetPlayheadTime(0); // Start at time 0

      // Tick 1: Enter block b1
      vi.advanceTimersByTime(100);
      expect(mockPlayVRMMotion).toHaveBeenCalledWith(sampleBlocks[0].motionUrl, 0, sampleBlocks[0].duration);
      mockPlayVRMMotion.mockClear();

      // Advance time past block b1 and into block b2 (startTime: 2.5)
      // Current time is ~0.1. Let's advance by 2.5 seconds.
      // Each getDelta is 0.1. We need 24 more ticks to reach 2.5.
      for(let i=0; i < 24; i++) {
        vi.advanceTimersByTime(100); // Advances by 0.1 each time due to mock getDelta
      }
      // Now playheadTime is ~2.5 after setPlayheadTime has been called by tick()

      expect(mockPlayVRMMotion).toHaveBeenCalledWith(sampleBlocks[1].motionUrl, 0, sampleBlocks[1].duration);
      expect(playhead.currentlyPlayingBlockId).toBe(sampleBlocks[1].id);
    });

    it('tick() should clear currentlyPlayingBlockId if playhead moves out of all blocks', () => {
      playhead.clock.getDelta.mockReturnValue(0.1);
      mockSetPlayheadTime(0);

      // Enter block b1
      vi.advanceTimersByTime(100);
      expect(playhead.currentlyPlayingBlockId).toBe(sampleBlocks[0].id);

      // Advance time past all blocks (e.g., to time 10.0)
      // Last block b2 ends at 2.5 + 1.5 = 4.0
      // Current time is ~0.1. Need to advance well past 4.0.
      // Let's advance by 5 seconds (50 ticks of 0.1s)
      for(let i=0; i < 50; i++) {
        vi.advanceTimersByTime(100);
      }
      // The tick that moves time past the end of b2 should clear currentlyPlayingBlockId
      expect(playhead.currentlyPlayingBlockId).toBeNull();
    });
  });
});
