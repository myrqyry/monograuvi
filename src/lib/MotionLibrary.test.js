import { describe, it, expect, beforeEach, vi } from 'vitest';
import MotionLibrary from './MotionLibrary'; // Adjust path as necessary
import mockMotionDefinitions from '../motions/dance_moves.json';

// Mock the direct import of dance_moves.json
vi.mock('../motions/dance_moves.json', () => {
  return {
    default: [
      {
        "id": "dance-001",
        "name": "Basic Groove",
        "url": "/motions/basic_groove.vmd",
        "duration": 5.0,
        "tags": ["beginner", "groove"]
      },
      {
        "id": "dance-002",
        "name": "Hip Hop Swag",
        "url": "/motions/hip_hop_swag.vmd",
        "duration": 8.2,
        "tags": ["intermediate", "hiphop"]
      },
      {
        "id": "dance-003",
        "name": "Smooth Wave",
        "url": "/motions/smooth_wave.vmd",
        "duration": 6.5,
        "tags": ["advanced", "wave", "fluid"]
      },
      {
        "id": "dance-004",
        "name": "Test Motion No Tags",
        "url": "/motions/test_motion_no_tags.vmd",
        "duration": 3.0
      }
    ]
  };
});

describe('MotionLibrary', () => {
  let motionLibrary;

  beforeEach(() => {
    // Create a new instance before each test to ensure isolation
    motionLibrary = new MotionLibrary();
  });

  it('should load motions on initialization', () => {
    const motions = motionLibrary.getAllMotions();
    expect(motions).toBeInstanceOf(Array);
    expect(motions.length).toBeGreaterThan(0);
    expect(motions.length).toEqual(mockMotionDefinitions.length);
  });

  it('should return all loaded motions with getAllMotions()', () => {
    const motions = motionLibrary.getAllMotions();
    expect(motions).toEqual(mockMotionDefinitions);
  });

  it('should find a motion by its ID using getMotionById()', () => {
    const motion = motionLibrary.getMotionById('dance-001');
    expect(motion).toBeDefined();
    expect(motion?.id).toBe('dance-001');
    expect(motion?.name).toBe('Basic Groove');
  });

  it('should return undefined if motion ID does not exist in getMotionById()', () => {
    const motion = motionLibrary.getMotionById('non-existent-id');
    expect(motion).toBeUndefined();
  });

  it('should find motions by tag using getMotionsByTag()', () => {
    const grooveMotions = motionLibrary.getMotionsByTag('groove');
    expect(grooveMotions).toBeInstanceOf(Array);
    expect(grooveMotions.length).toBe(1);
    expect(grooveMotions[0].id).toBe('dance-001');

    const hiphopMotions = motionLibrary.getMotionsByTag('hiphop');
    expect(hiphopMotions.length).toBe(1);
    expect(hiphopMotions[0].id).toBe('dance-002');
  });

  it('should return an empty array if no motions match the tag in getMotionsByTag()', () => {
    const nonExistentTagMotions = motionLibrary.getMotionsByTag('non-existent-tag');
    expect(nonExistentTagMotions).toBeInstanceOf(Array);
    expect(nonExistentTagMotions.length).toBe(0);
  });

  it('should handle motions without tags gracefully in getMotionsByTag()', () => {
    // Add a motion without tags to the library for this test case or ensure one exists
    // The mock already includes "dance-004" without tags
    const motionsWithNoTags = motionLibrary.getMotionById('dance-004');
    expect(motionsWithNoTags).toBeDefined();
    expect(motionsWithNoTags?.tags).toBeUndefined();

    // Searching for a tag on a motion that has no tags array should not error
    const tagSearchOnNoTagMotion = motionLibrary.getMotionsByTag('beginner'); // This will only find dance-001
    expect(tagSearchOnNoTagMotion.length).toBe(1);
  });
});
