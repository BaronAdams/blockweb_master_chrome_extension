import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// import.meta.env ne fonctionne pas dans les service workers Chrome (background.ts)
// Vite remplace les VITE_* à la compilation via define — compatible partout
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
        '[Supabase] Variables manquantes dans .env.local :\n' +
        '  VITE_SUPABASE_URL\n' +
        '  VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
    )
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        // Dans une extension Chrome, on ne peut pas utiliser localStorage.
        // Les tokens (accessToken, refreshToken) sont stockés manuellement
        // dans chrome.storage.local via blockweb_master_state.auth
        // et passés explicitement à chaque appel supabase.auth.*
        persistSession:     false,
        autoRefreshToken:   false,
        detectSessionInUrl: false,
    },
})

// supabase.auth.admin.
// ── Helper : crée un client authentifié avec le token d'un utilisateur ──
// À utiliser si tu as besoin de faire des requêtes au nom de l'utilisateur
// connecté (RLS sur les tables profiles/subscriptions).
export function supabaseWithToken(accessToken: string) {
    return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession:     false,
            autoRefreshToken:   false,
            detectSessionInUrl: false,
        },
        global: {
            headers: { Authorization: `Bearer ${accessToken}` },
        },
    })
}