import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para /api/proxy/* - igual que logoAI
      // Las peticiones a /api/proxy/token/ se redirigen a https://startapp360.com/api/v1/token/
      // Las peticiones a /api/proxy/register/ se redirigen a https://startapp360.com/api/v1/register/
      '/api/proxy': {
        target: 'https://startapp360.com/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('❌ Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🚀 Sending Request:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Received Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})

