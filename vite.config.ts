import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
 build: {
    rollupOptions: {
      input: {
        main: path.join(__dirname, 'index.html'),
      }
    },
    chunkSizeWarningLimit: 10000,
  },
  optimizeDeps: {
    include: [],
  },
  assetsInclude: ['**/*.json'],
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: {
          index: path.join(__dirname, 'electron/preload.ts'),
        },
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
})