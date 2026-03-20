import path from 'node:path'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import zip from 'vite-plugin-zip-pack'
import tailwindcss from '@tailwindcss/vite'
import manifest from './manifest.config.js'
import { name, version } from './package.json'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Charge les variables .env selon le mode (development / production)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    resolve: {
      alias: {
        '@': `${path.resolve(__dirname, 'src')}`,
      },
    },

    // ── CRITIQUE pour les service workers Chrome (MV3) ────────────────────
    // @crxjs/vite-plugin ne remplace PAS import.meta.env dans le service worker.
    // `define` force Vite/Rollup à substituer ces expressions à la compilation,
    // ce qui les rend disponibles même dans le contexte du service worker.
    define: {
      'import.meta.env.VITE_SUPABASE_URL':
        JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY':
        JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
    },

    plugins: [
      react(),
      tailwindcss(),
      crx({ manifest }),
      zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
    ],

    server: {
      cors: {
        origin: [
          /chrome-extension:\/\//,
        ],
      },
    },

    build: {
      rollupOptions: {
        input: {
          dashboard: resolve(__dirname, 'src/dashboard/index.html'),
          blocked:   resolve(__dirname, 'src/blocked/index.html'),
          auth:      resolve(__dirname, 'src/auth/index.html'),
        },
        output: {
          // Évite les fichiers "vendor" séparés qui causent des erreurs
          // de chargement dans le contexte de l'extension
          manualChunks: undefined,
        },
      },
    },
  }
})