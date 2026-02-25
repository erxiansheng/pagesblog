import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router'],
          markdown: ['marked', 'highlight.js']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://testblog.188np.cn',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'https://testblog.188np.cn',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
