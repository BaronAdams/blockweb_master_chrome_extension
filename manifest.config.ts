import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

/* ─────────────────────────────────────────────────────────────────────────────
   GOOGLE OAUTH — CONFIGURATION
   ─────────────────────────────────────────────────────────────────────────────
   Le manifest est évalué par @crxjs/vite-plugin AVANT l'injection Vite,
   donc process.env.VITE_* est vide à ce stade.

   Solution : exporter une FONCTION qui reçoit l'env depuis vite.config.ts,
   où loadEnv() a déjà chargé les variables .env.

   Dans vite.config.ts :
     import { createManifest } from './manifest.config'
     // puis dans defineConfig :
     crx({ manifest: createManifest(env) })
───────────────────────────────────────────────────────────────────────────── */

export function createManifest(env: Record<string, string>) {
    const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID ?? ''

    return defineManifest({
        manifest_version: 3,
        name: pkg.name,
        version: pkg.version,
        description: "Block distracting websites, set time limits on social media, and stay focused with an unbreakable Strict Mode.",
        default_locale: "en",
        icons: {
            48: 'public/icon48.png',
        },

        /* KEY — non nécessaire en dev si tu recharges toujours depuis le même dossier.
           Chrome conserve l'ID dhdkoaggccklldmlllfmhpifbgcfllkb tant que le chemin
           du dossier dist ne change pas.
           En prod : le Web Store assigne son propre ID stable, pas besoin de key non plus.
           Ne décommente ce champ que si tu constates que ton ID change entre les reloads.

        key: "...",
        */

        background: {
            service_worker: "src/background/main.ts",
            type: "module"
        },
        action: {
            default_icon: {
                48: 'public/icon48.png',
            },
            default_popup: 'src/popup/index.html',
        },
        permissions: [
            'idle',
            'sidePanel',
            'storage',
            'webNavigation',
            'declarativeNetRequest',
            'declarativeNetRequestFeedback',
            'declarativeNetRequestWithHostAccess',
            'alarms',
            'tabs',
            'notifications',
            'identity',  // requis pour chrome.identity.getAuthToken (Google OAuth)
        ],
        host_permissions: ["<all_urls>"],

        // oauth2 injecté seulement si VITE_GOOGLE_CLIENT_ID est défini dans .env
        ...(GOOGLE_CLIENT_ID ? {
            oauth2: {
                client_id: GOOGLE_CLIENT_ID,
                scopes: [
                    'openid',
                    'email',
                    'profile',
                ],
            },
        } : {}),

        content_scripts: [
            {
                js: ['src/content/visibility.ts'],
                matches: ['https://*/*'],
                run_at: 'document_start',
            },
            {
                js: ['src/content/adultcontentscript.ts'],
                matches: ['https://*/*'],
                run_at: 'document_start',
            },
        ],
        side_panel: {
            default_path: 'src/sidepanel/index.html',
        },
        web_accessible_resources: [
            {
                resources: ["src/dashboard/index.html", "src/auth/index.html", "src/blocked/index.html"],
                matches: ["<all_urls>"]
            }
        ]
    })
}

// Export par défaut sans Google OAuth (utilisé si vite.config.ts n'importe pas createManifest)
export default createManifest({})