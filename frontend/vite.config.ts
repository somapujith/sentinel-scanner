import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

const api = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
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
