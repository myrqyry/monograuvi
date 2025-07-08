import { describe, it, expect, beforeEach } from 'vitest';
import useStore from './store'; // Assuming this is the path to your Zustand store

describe('Zustand Store - Dance Timeline Slice', () => {
  // Helper to get a clean state before each test
  const getInitialState = () => useStore.getState();

  beforeEach(() => {
    // Reset the store to its initial state before each test
    useStore.setState(getInitialState(), true);
    // Clear any existing dance blocks specifically for these tests
    useStore.setState({ danceBlocks: [], playheadTime: 0, isDancePlaying: false });
  });

  it('should have initial dance timeline state', () => {
    const { danceBlocks, playheadTime, isDancePlaying } = useStore.getState();
    expect(danceBlocks).toEqual([]);
    expect(playheadTime).toBe(0);
    expect(isDancePlaying).toBe(false);
  });

  describe('addDanceBlock', () => {
    it('should add a new dance block to the danceBlocks array', () => {
      const newBlock = { id: 'b1', motionId: 'm1', motionUrl: '/m1.vmd', startTime: 0, duration: 5 };
      useStore.getState().addDanceBlock(newBlock);

      const { danceBlocks } = useStore.getState();
      expect(danceBlocks).toHaveLength(1);
      expect(danceBlocks[0]).toEqual(newBlock);
    });

    it('should add multiple dance blocks correctly', () => {
      const block1 = { id: 'b1', motionId: 'm1', motionUrl: '/m1.vmd', startTime: 0, duration: 5 };
      const block2 = { id: 'b2', motionId: 'm2', motionUrl: '/m2.vmd', startTime: 5, duration: 3 };

      useStore.getState().addDanceBlock(block1);
      useStore.getState().addDanceBlock(block2);

      const { danceBlocks } = useStore.getState();
      expect(danceBlocks).toHaveLength(2);
      expect(danceBlocks[0]).toEqual(block1);
      expect(danceBlocks[1]).toEqual(block2);
    });
  });

  describe('removeDanceBlock', () => {
    it('should remove an existing dance block by its ID', () => {
      const block1 = { id: 'b1', motionId: 'm1', motionUrl: '/m1.vmd', startTime: 0, duration: 5 };
      const block2 = { id: 'b2', motionId: 'm2', motionUrl: '/m2.vmd', startTime: 5, duration: 3 };
      useStore.getState().addDanceBlock(block1);
      useStore.getState().addDanceBlock(block2);

      useStore.getState().removeDanceBlock('b1');

      const { danceBlocks } = useStore.getState();
      expect(danceBlocks).toHaveLength(1);
      expect(danceBlocks[0].id).toBe('b2');
    });

    it('should not change state if removing a non-existent block ID', () => {
      const block1 = { id: 'b1', motionId: 'm1', motionUrl: '/m1.vmd', startTime: 0, duration: 5 };
      useStore.getState().addDanceBlock(block1);

      useStore.getState().removeDanceBlock('non-existent-id');

      const { danceBlocks } = useStore.getState();
      expect(danceBlocks).toHaveLength(1);
      expect(danceBlocks[0].id).toBe('b1');
    });
  });

  describe('updateDanceBlock', () => {
    it('should update properties of an existing dance block', () => {
      const initialBlock = { id: 'b1', motionId: 'm1', motionUrl: '/m1.vmd', startTime: 0, duration: 5 };
      useStore.getState().addDanceBlock(initialBlock);

      const updates = { startTime: 1.5, duration: 4.0, motionId: 'm1-updated', motionUrl: '/m1-updated.vmd' };
      useStore.getState().updateDanceBlock('b1', updates);

      const { danceBlocks } = useStore.getState();
      expect(danceBlocks).toHaveLength(1);
      expect(danceBlocks[0]).toEqual({ ...initialBlock, ...updates });
    });

    it('should not change state if updating a non-existent block ID', () => {
      const initialBlock = { id: 'b1', motionId: 'm1', motionUrl: '/m1.vmd', startTime: 0, duration: 5 };
      useStore.getState().addDanceBlock(initialBlock);

      const updates = { startTime: 1.0 };
      useStore.getState().updateDanceBlock('non-existent-id', updates);

      const { danceBlocks } = useStore.getState();
      expect(danceBlocks[0]).toEqual(initialBlock); // State should be unchanged
    });
  });

  describe('setPlayheadTime', () => {
    it('should update the playheadTime state', () => {
      useStore.getState().setPlayheadTime(10.75);
      expect(useStore.getState().playheadTime).toBe(10.75);

      useStore.getState().setPlayheadTime(0);
      expect(useStore.getState().playheadTime).toBe(0);
    });
  });

  describe('setIsDancePlaying', () => {
    it('should update the isDancePlaying state', () => {
      useStore.getState().setIsDancePlaying(true);
      expect(useStore.getState().isDancePlaying).toBe(true);

      useStore.getState().setIsDancePlaying(false);
      expect(useStore.getState().isDancePlaying).toBe(false);
    });
  });
});
