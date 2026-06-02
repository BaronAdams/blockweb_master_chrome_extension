import path from 'node:path'
import fs from 'node:fs'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import zip from 'vite-plugin-zip-pack'
import tailwindcss from '@tailwindcss/vite'
import { createManifest } from './manifest.config'
import { name, version } from './package.json'
import { resolve } from 'path'

/**
 * Converts _locales/{lang}/messages.json (react-i18next namespace format) to
 * Chrome's required format { "ns__key": { "message": "value" } } in dist.
 * The source files stay in namespace format for static imports by i18n.ts.
 */
function chromeI18nPlugin(): Plugin {
  return {
    name: 'chrome-i18n',
    apply: 'build',
    closeBundle() {
      const srcDir = resolve(__dirname, '_locales')
      const outDir = resolve(__dirname, 'dist/_locales')
      const langs = fs.readdirSync(srcDir).filter(f =>
        fs.statSync(path.join(srcDir, f)).isDirectory()
      )
      for (const lang of langs) {
        const src = path.join(srcDir, lang, 'messages.json')
        const namespaced: Record<string, Record<string, string>> = JSON.parse(fs.readFileSync(src, 'utf8'))
        const chrome: Record<string, { message: string }> = {}
        for (const [ns, keys] of Object.entries(namespaced)) {
          for (const [key, value] of Object.entries(keys)) {
            if (typeof value !== 'string') continue
            // Chrome keys: [A-Za-z0-9_] only, max 75 chars
            const chromeKey = `${ns}__${key}`.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 75)
            chrome[chromeKey] = { message: value }
          }
        }
        const dest = path.join(outDir, lang)
        fs.mkdirSync(dest, { recursive: true })
        fs.writeFileSync(path.join(dest, 'messages.json'), JSON.stringify(chrome, null, 2))
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    resolve: {
      alias: {
        '@': `${path.resolve(__dirname, 'src')}`,
      },
    },

    define: {
      'import.meta.env.VITE_SUPABASE_URL':
        JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY':
        JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID':
        JSON.stringify(env.VITE_GOOGLE_CLIENT_ID ?? ''),
      'import.meta.env.RESET_PASSWORD_URL':
        JSON.stringify(env.RESET_PASSWORD_URL ?? ''),
      'import.meta.env.CONFIRM_EMAIL_URL':
        JSON.stringify(env.CONFIRM_EMAIL_URL ?? ''),
    },

    plugins: [
      react(),
      tailwindcss(),
      crx({ manifest: createManifest(env) }),
      chromeI18nPlugin(),
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
          manualChunks: undefined,
        },
      },
    },
  }
})
