import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://54.227.140.191',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react({ include: "**/*.{jsx,tsx,js,ts}" }),
    tailwindcss(),
  ],
  esbuild: {
    include: /\.(jsx?|tsx?)$/,
    exclude: [],
    loader: 'jsx',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
    },
  },
})
