// src/store.js
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // --- Editor State ---
  editorType: 'rete', // Can be 'litegraph' or 'rete'
  setEditorType: (type) => set({ editorType: type }),

  // --- Existing LiteGraph Node graph state ---
  audioContext: null,
  audioContextStatus: 'uninitialized', // 'uninitialized', 'pending', 'running', 'suspended', 'closed', 'error'
  setAudioContext: (audioContext) => set({ audioContext }),
  setAudioContextStatus: (status) => set({ audioContextStatus: status }),
  
  // --- Rete.js Graph State ---
  reteGraph: {
    nodes: {}, // Store as an object: { [nodeId]: { id, label, type, position, customData } }
    connections: [], // Store as an array: { id, source, sourceOutput, target, targetInput }
  },

  // --- Audio and timeline state ---
  audioBuffer: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  triggers: [],
  
  // --- Dance Timeline State ---
  danceBlocks: [],
  playheadTime: 0,
  isDancePlaying: false,

  // --- Audio Analysis Metadata ---
  audioMetadata: {
    key: null,
    tempo: null,
    duration: null,
    error: null,
  },

  // --- Rete.js Graph Actions ---
  // Node data typically: { id: string, label: string, type: string, position: {x:number, y:number}, customData: object }
  addReteNode: (nodeData) => set((state) => ({
    reteGraph: {
      ...state.reteGraph,
      nodes: {
        ...state.reteGraph.nodes,
        [nodeData.id]: nodeData,
      }
    }
  })),
  removeReteNode: (nodeId) => set((state) => {
    const newNodes = { ...state.reteGraph.nodes };
    delete newNodes[nodeId];
    return {
      reteGraph: {
        ...state.reteGraph,
        nodes: newNodes,
        // Also remove connections associated with this node
        connections: state.reteGraph.connections.filter(conn => conn.source !== nodeId && conn.target !== nodeId),
      }
    };
  }),
  updateReteNodePosition: (nodeId, position) => set((state) => {
    if (!state.reteGraph.nodes[nodeId]) return state; // Node not found
    return {
      reteGraph: {
        ...state.reteGraph,
        nodes: {
          ...state.reteGraph.nodes,
          [nodeId]: {
            ...state.reteGraph.nodes[nodeId],
            position,
          }
        }
      }
    };
  }),
  updateReteNodeData: (nodeId, dataChanges) => set((state) => { // For customData or other properties
    if (!state.reteGraph.nodes[nodeId]) return state;
    return {
      reteGraph: {
        ...state.reteGraph,
        nodes: {
          ...state.reteGraph.nodes,
          [nodeId]: {
            ...state.reteGraph.nodes[nodeId],
            customData: {
              ...state.reteGraph.nodes[nodeId].customData,
              ...dataChanges,
            }
          }
        }
      }
    }
  }),
  // Connection data typically: { id: string, source: string, sourceOutput: string, target: string, targetInput: string }
  addReteConnection: (connectionData) => set((state) => ({
    reteGraph: {
      ...state.reteGraph,
      connections: [...state.reteGraph.connections, connectionData],
    }
  })),
  removeReteConnection: (connectionId) => set((state) => ({
    reteGraph: {
      ...state.reteGraph,
      connections: state.reteGraph.connections.filter(conn => conn.id !== connectionId),
    }
  })),
  // Action to set the entire Rete graph, useful for loading or major state changes (e.g. after undo/redo)
  setReteGraphState: (newReteGraphState) => set({
    reteGraph: newReteGraphState,
  }),
  
  getReteGraphState: () => get().reteGraph,

  // --- Audio actions ---
  setAudioBuffer: (buffer) => set({ 
    audioBuffer: buffer,
    duration: buffer ? buffer.duration : 0
  }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setDuration: (duration) => set({ duration }),
  
  // --- Trigger actions ---
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

  // --- Dance Timeline Actions ---
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

  // --- Audio Analysis Metadata Actions ---
  setAudioMetadata: (metadata) => set((state) => ({
    audioMetadata: { ...state.audioMetadata, ...metadata, error: metadata.error || null }
  })),

}));

export default useStore;
