import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

/**
 * Which commit this build came from.
 *
 * Stamped in rather than fetched, because the built app has no server to ask.
 * A build from a tarball or a shallow checkout has no git at all, and that is
 * not a build failure — it just means the commit is unknown.
 */
function commit() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

// The interface is served by tools/librapp/serve.py in normal use, so the build
// lands in web/dist where that server looks for it. During development Vite
// serves the page itself and forwards /api to the Python server.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  define: {
    // A running app should be able to say which version it is. It is the first
    // question in any bug report, and a cached app can be older than it looks.
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit()),
    __APP_BUILT__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 5173,
    // The prompts are version-controlled text at the repository root and are
    // imported as raw strings, so the dev server has to be allowed to read
    // above web/.
    fs: { allow: ['..'] },
  },
})
