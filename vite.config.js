import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/valhalla': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/valhalla/, '')
      }
    }
  }
});
