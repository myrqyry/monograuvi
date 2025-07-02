// src/store.js
import create from 'zustand';

const useStore = create((set, get) => ({
  audioContext: null,
  graph: null,
  nodes: [],
  lastAddedNode: null,
  
  setAudioContext: (context) => set({ audioContext: context }),
  setGraph: (graph) => set({ graph }),
  
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
    lastAddedNode: node.type
  })),
  
  updateNodePosition: (nodeId, position) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === nodeId ? { ...node, position } : node
    )
  })),
  
  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== nodeId)
  })),
}));

export default useStore;