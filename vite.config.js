import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ghPages } from 'vite-plugin-gh-pages'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ghPages()],
  base: process.env.NODE_ENV === 'production' ? '/EMU-website/' : '/',
  define: {
    // Ensure the Railway API URL is used in production builds
    'import.meta.env.VITE_API_URL': process.env.NODE_ENV === 'production'
      ? '"https://emu-website-production.up.railway.app/api"'
      : 'undefined'
  }
})
