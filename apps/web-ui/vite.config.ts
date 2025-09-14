import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
  },
  define: {
    'import.meta.env.VITE_RUN_API_PORT': JSON.stringify(process.env.RUN_API_PORT || '3003'),
  },
})
