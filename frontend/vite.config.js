import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Ports are fixed (strictPort) so this project never collides with other local projects
// (5173/8000 are used by another app on this machine). Change them here if needed.
const API_TARGET = process.env.API_TARGET ?? 'http://localhost:8010'

// In development the browser talks only to Vite; /api is forwarded to the FastAPI backend.
// Same origin → the httpOnly session cookie just works, no CORS needed locally.
const proxy = { '/api': { target: API_TARGET, changeOrigin: false } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5180, strictPort: true, proxy },
  preview: { port: 4180, strictPort: true, proxy },
})
