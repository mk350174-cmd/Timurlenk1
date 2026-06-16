import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for Timurlenk Satranç Online.
 * - React plugin with Fast Refresh (HMR) enabled.
 * - Dev server fixed to port 5173 (as required by the spec).
 * - Dependency pre-bundling for the heavier libraries to keep cold start fast.
 *
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // expose on LAN for mobile responsive testing
    strictPort: false,
  },
  preview: {
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    // Split vendor chunks so the initial bundle stays under the < 2s load budget.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', '@supabase/supabase-js'],
  },
});
