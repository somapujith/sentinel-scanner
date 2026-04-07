import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Local dev should default to the local backend. Docker/CI can override via VITE_API_PROXY_TARGET.
  const api = (env.VITE_API_PROXY_TARGET || '').trim() || 'http://127.0.0.1:8000';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    server: {
      host: '127.0.0.1',
      port: 5178,
      strictPort: false,
      proxy: {
        '/api': {
          target: api,
          changeOrigin: true,
        },
      },
      hmr: {
        protocol: 'ws',
        host: '127.0.0.1',
        port: 5178,
      },
    },
  };
});
