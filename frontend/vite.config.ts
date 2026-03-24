/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    css: false,
  },
  server: {
    port: 3000,
    proxy: {
      '/api/school/dashboard': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/school/experiences': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/school/courses': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/school/cohorts': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/school/enrolments': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
    },
  },
})
