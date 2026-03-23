import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

/* ─────────────────────────────────────────────────────────────────────────────
   GOOGLE OAUTH — CONFIGURATION
   ─────────────────────────────────────────────────────────────────────────────
   DEV  : utilise VITE_GOOGLE_CLIENT_ID_DEV  dans .env.development
   PROD : utilise VITE_GOOGLE_CLIENT_ID_PROD dans .env.production

   Comment obtenir ces IDs :
   1. Aller sur https://console.developers.google.com/auth/clients
   2. Créer un client OAuth → type : "Extension Chrome"
   3. Entrer l'ID de l'extension (chrome://extensions en dev, Web Store en prod)
   4. Coller le client_id généré dans la variable correspondante

   STABILISER L'ID EN DEV :
   Pour éviter que l'ID change à chaque rechargement en dev, ajouter le champ "key"
   dans ce manifest (voir commentaire KEY ci-dessous).
   Récupérer la clé : uploader le .zip de l'extension dans le Chrome Web Store
   Developer Dashboard (sans publier) → onglet Package → "Afficher la clé publique".
───────────────────────────────────────────────────────────────────────────── */
// Un seul client OAuth suffit — la key RSA fixe l'ID en dev ET en prod
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID ?? ''

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  description: "Reduce your exposure to adult content on the web. Powered by AI and customizable filters.",
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

  /* OAuth2 — lu par chrome.identity.getAuthToken automatiquement.
     Le client_id change entre dev et prod (deux apps Google Cloud distinctes). */
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