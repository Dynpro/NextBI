import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // 👈 REQUIRED for Docker to expose the server
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://host.docker.internal:3001', // 👈 use this to reach backend on host
        changeOrigin: true,
      },
    },
  },
})
