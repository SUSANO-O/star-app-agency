import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const agencyTarget = env.VITE_AGENCY_API_PORT
    ? `http://127.0.0.1:${env.VITE_AGENCY_API_PORT}`
    : 'http://127.0.0.1:8001'
  const djangoTarget = env.VITE_DJANGO_API_URL || 'https://startapp360.com'

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    server: {
      proxy: {
        '/api/v1/agency': {
          target: agencyTarget,
          changeOrigin: true,
        },
        '/api/agency': {
          target: agencyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/agency/, '/api/v1/agency'),
        },
        '/uploads': {
          target: agencyTarget,
          changeOrigin: true,
        },
        '/api/proxy': {
          target: `${djangoTarget}/api/v1`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
          secure: true,
        },
      },
    },
  }
})
