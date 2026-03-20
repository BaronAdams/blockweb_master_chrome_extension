import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  description: "Restez concentrés et augmentez votre productivité avec le meilleur bloqueur de sites",
  icons: {
    48: 'public/icon48.png',
  },
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
  ],
  host_permissions: ["<all_urls>"],
  content_scripts: [
    {
      // Injecté sur tous les sites dès le début — tracking de visibilité
      js: ['src/content/visibility.ts'],
      matches: ['https://*/*'],
      run_at: 'document_start',
    },
    {
      // Injecté sur TOUS les sites — deux rôles :
      //   1. Bloquer les sites adultes inconnus par analyse du contenu (titre, metas, body)
      //   2. Masquer les résultats adultes dans les moteurs de recherche
      // document_start : nécessaire pour intercepter avant le rendu (Phase 1 HEAD).
      //   Le script gère lui-même la Phase 2 BODY via DOMContentLoaded.
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