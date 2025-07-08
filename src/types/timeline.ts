/**
 * Represents a single block of motion on the timeline.
 */
export interface DanceBlock {
  /** Unique identifier for this block instance */
  id: string;
  /** Identifier of the motion clip (from MotionLibrary) */
  motionId: string;
  /** Start time of this block in seconds, relative to the beginning of the timeline */
  startTime: number;
  /** Duration of this block in seconds */
  duration: number;
  /** URL of the motion file, denormalized for easier access by player */
  motionUrl: string;
}

/**
 * Represents the overall timeline state.
 */
export interface TimelineState {
  blocks: DanceBlock[];
  isPlaying: boolean;
  currentTime: number; // Current position of the playhead in seconds
  // Potentially other states like zoom level, selected block ID, etc.
}
