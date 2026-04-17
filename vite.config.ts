import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': '{}',
    'process.version': '"v18.0.0"',
    'process.browser': 'true',
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Browser polyfills for Node built-ins used by @ethereumjs/util and ethers
      buffer: 'buffer',
      events: 'events',
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'events', 'stream-browserify'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    proxy: {
      '/gamma-api': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gamma-api/, ''),
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
