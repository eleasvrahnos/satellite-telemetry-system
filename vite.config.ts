import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/telemetry': {
        target: 'http://localhost:3000',  // Base URL for the backend
        changeOrigin: true,
      },
    },
  },
});
