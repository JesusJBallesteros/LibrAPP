import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The interface is served by tools/librapp/serve.py in normal use, so the build
// lands in web/dist where that server looks for it. During development Vite
// serves the page itself and forwards /api to the Python server.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    // The prompts are version-controlled text at the repository root and are
    // imported as raw strings, so the dev server has to be allowed to read
    // above web/.
    fs: { allow: ['..'] },
  },
})
