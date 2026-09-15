import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const frontendDir = fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = path.resolve(frontendDir, '..');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      leaflet: path.resolve(workspaceRoot, 'node_modules/leaflet'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'leaflet', test: /node_modules[\\/]leaflet[\\/]/ },
            { name: 'qrcode', test: /node_modules[\\/]qrcode[\\/]/ },
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router(?:-dom)?)[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' ws: wss: http://localhost:5000 http://127.0.0.1:5000 https:",
        "worker-src 'self' blob:",
      ].join('; '),
    },
    fs: {
      allow: [workspaceRoot],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
