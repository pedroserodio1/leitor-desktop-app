import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // PDF.js worker must not be pre-bundled — it's loaded as a separate script
    exclude: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        splashscreen: 'splashscreen.html',
      },
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
        },
      },
    },
  },
})
