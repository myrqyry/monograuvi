import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/venv/**'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['wavesurfer.js']
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
