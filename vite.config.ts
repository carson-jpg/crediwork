import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: mode === 'development' ? 'http://localhost:5000' : 'https://crediwork.onrender.com',
        changeOrigin: true,
        secure: mode !== 'development',
      },
    },
  },
}));
