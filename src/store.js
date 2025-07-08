// src/store.js
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Node graph state
  audioContext: null,
  graph: null,
  nodes: [],
  lastAddedNode: null,
  
  // Audio and timeline state
  audioBuffer: null,
  currentTime: 0, // Existing: likely for audio playback
  duration: 0,    // Existing: likely for audio duration
  isPlaying: false, // Existing: likely for audio playback
  triggers: [],
  
  // Dance Timeline State
  danceBlocks: [], // Array of DanceBlock objects { id, motionId, motionUrl, startTime, duration }
  playheadTime: 0, // Current time of the dance playhead in seconds
  isDancePlaying: false, // Play/pause state for the dance timeline

  // Node graph actions
  setAudioContext: (context) => set({ audioContext: context }),
  setGraph: (graph) => set({ graph }),
  
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
    lastAddedNode: node
  })),
  
  updateNodePosition: (nodeId, position) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === nodeId ? { ...node, position } : node
    )
  })),
  
  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== nodeId)
  })),
  
  // Audio actions
  setAudioBuffer: (buffer) => set({ 
    audioBuffer: buffer,
    duration: buffer ? buffer.duration : 0
  }),
  
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setDuration: (duration) => set({ duration }),
  
  // Trigger actions
  addTrigger: (time) => set((state) => ({
    triggers: [...state.triggers, { 
      id: crypto.randomUUID(), 
      time, 
      type: 'generic',
      data: {} 
    }]
  })),
  
  removeTrigger: (id) => set((state) => ({
    triggers: state.triggers.filter(t => t.id !== id)
  })),
  
  updateTrigger: (id, updates) => set((state) => ({
    triggers: state.triggers.map(t => 
      t.id === id ? { ...t, ...updates } : t
    )
  })),
  
  clearTriggers: () => set({ triggers: [] }),

  // Dance Timeline Actions
  addDanceBlock: (block) => set((state) => ({
    danceBlocks: [...state.danceBlocks, block]
  })),

  removeDanceBlock: (blockId) => set((state) => ({
    danceBlocks: state.danceBlocks.filter(b => b.id !== blockId)
  })),

  updateDanceBlock: (blockId, updates) => set((state) => ({
    danceBlocks: state.danceBlocks.map(b =>
      b.id === blockId ? { ...b, ...updates } : b
    )
  })),

  setPlayheadTime: (time) => set({ playheadTime: time }),

  setIsDancePlaying: (playing) => set({ isDancePlaying: playing }),

  // Command stack for undo/redo
  undoStack: [],
  redoStack: [],

  executeCommand: (command) => {
    command.execute();
    set((state) => ({
      undoStack: [...state.undoStack, command],
      redoStack: [], // Clear redo stack when a new command is executed
    }));
  },

  undoCommand: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length > 0) {
      const command = undoStack[undoStack.length - 1];
      command.undo();
      set({
        undoStack: undoStack.slice(0, -1),
        redoStack: [command, ...redoStack],
      });
    }
  },

  redoCommand: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length > 0) {
      const command = redoStack[0];
      command.execute();
      set({
        undoStack: [...undoStack, command],
        redoStack: redoStack.slice(1),
      });
    }
  },
}));

export default useStore;
