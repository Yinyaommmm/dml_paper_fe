import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Strip the /api prefix before forwarding to backend
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            const target = `http://localhost:8000${req.url?.replace(/^\/api/, '')}`;
            console.log(`[proxy] ${req.method} ${req.url}  →  ${target}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[proxy] ${proxyRes.statusCode} ${req.url}`);
          });
          proxy.on('error', (err, req) => {
            console.error(`[proxy] ERROR ${req.url}: ${err.message}`);
          });
        },
      },
    },
  },
})
