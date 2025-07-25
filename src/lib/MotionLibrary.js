import motionDefinitions from '../motions/dance_moves.json'; // Vite handles JSON imports

/**
 * Defines the structure for individual motion clips.
 * For the JSON schema definition, see `src/motions/schema.json`.
 * @typedef {object} MotionClip
 * @property {string} id - Unique identifier for the motion clip
 * @property {string} name - Display name of the motion clip
 * @property {string} url - URL path to the VMD motion file
 * @property {number} [duration] - Optional duration of the motion in seconds.
 * @property {string[]} [tags] - Tags for categorizing the motion
 */

class MotionLibrary {
  constructor() {
    /** @type {MotionClip[]} */
    this.motions = [];
    this._loadMotions();
  }

  async _loadMotions() {
    // In a real app, you might fetch this or use dynamic imports
    // For now, we directly import the JSON
    const defaultMotions = motionDefinitions;

    try {
      const response = await fetch('/api/user-motions');
      const userMotionsData = await response.json();
      const userMotions = userMotionsData.motions || [];
      this.motions = [...defaultMotions, ...userMotions];
    } catch (error) {
      console.error('Error fetching user motions:', error);
      this.motions = defaultMotions;
    }

    console.log('MotionLibrary: Motions loaded', this.motions);
  }

  /**
   * Get all loaded motions.
   * @returns {MotionClip[]}
   */
  getAllMotions() {
    return this.motions;
  }

  /**
   * Find a motion by its ID.
   * @param {string} id
   * @returns {MotionClip | undefined}
   */
  getMotionById(id) {
    return this.motions.find(motion => motion.id === id);
  }

  /**
   * Find motions by tag.
   * @param {string} tag
   * @returns {MotionClip[]}
   */
  getMotionsByTag(tag) {
    return this.motions.filter(motion => motion.tags && motion.tags.includes(tag));
  }
}

export default MotionLibrary;
