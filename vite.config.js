import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3000,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/venv/**'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['litegraph.js', 'wavesurfer.js']
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
