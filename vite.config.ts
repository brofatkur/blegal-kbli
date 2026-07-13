import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path relatif agar bisa di-deploy di subpath manapun
// (mis. GitHub Pages project page /repo/). Saat di root, './' tetap valid.
const base = process.env.VITE_BASE_PATH || './'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
  },
})
