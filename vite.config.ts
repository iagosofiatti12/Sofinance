import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Sem isso, porta 3000 ocupada faz o Vite subir em outra silenciosamente, e o
    // redirectTo de recuperação de senha (window.location.origin) só bate com a
    // Redirect URL cadastrada no Supabase para a porta 3000. Preferimos falhar alto.
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts')) return 'recharts'
          if (id.includes('@supabase/supabase-js')) return 'supabase'
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
