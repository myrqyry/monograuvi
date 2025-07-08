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
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  triggers: [],
  
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
