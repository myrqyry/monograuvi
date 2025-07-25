import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: Number(process.env.VITE_PORT || process.env.FRONTEND_PORT) || 5173,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/venv/**'
      ]
    }
  },
  resolve: {
    alias: {
      'three': path.resolve(__dirname, 'node_modules/three')
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
