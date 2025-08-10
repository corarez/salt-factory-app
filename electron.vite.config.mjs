import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(),tailwindcss(),]
  },
  // Global build configuration for Electron-Vite
  build: {
    assets: [
      {
        // IMPORTANT: Adjust this 'from' path based on your *actual* project structure.
        // If 'backend' is directly in the project root: 'backend'
        // If 'backend' is inside the 'src' folder: 'src/backend'
        from: 'backend', // Current setting for your server.js
        to: 'backend'
      },
      // --- NEW ASSET RULE FOR SPLASH.HTML ---
      {
        // This assumes splash.html is located at `src/renderer/splash.html` in your source.
        from: 'src/renderer/splash.html',
        // This ensures it's copied to `out/renderer/splash.html` in your build output.
        to: 'renderer/splash.html'
      }
      // --- END NEW ASSET RULE ---
    ]
  }
})
