import { getState, setState } from "./storage";
import { supabase, supabaseWithToken } from "@/lib/supabase";
import { upgradeToPremium, downgradeToFree } from "./main";
import type { SubscriptionPlan } from "@/lib/database.types";

/* =========================================================
   syncAuth
   Appelé au démarrage (onStartup) et toutes les 50 min (alarm auth-sync).
   - Rafraîchit le JWT via Supabase (tokens durent 1h)
   - Relit la subscription depuis la table subscriptions
   - Met à jour le state local (accessToken, refreshToken, plan, isPremium…)
   - Déconnecte silencieusement si le refresh token est expiré (> 7 jours sans usage)
========================================================= */
/* ── Vérifie si une erreur est due à un problème réseau ──────────────────
   navigator.onLine est peu fiable dans les service workers Chrome (retourne
   souvent true même sans connexion). On détecte l'absence de réseau via le
   type d'erreur : TypeError avec "fetch" ou "network" dans le message.
─────────────────────────────────────────────────────────────────────── */
function isNetworkError(err: unknown): boolean {
    if (!(err instanceof Error)) return false
    const msg = err.message.toLowerCase()
    return (
        err instanceof TypeError && (
            msg.includes('fetch') ||
            msg.includes('network') ||
            msg.includes('failed') ||
            msg.includes('load') ||
            msg.includes('offline')
        )
    )
}

export const syncAuth = async (): Promise<void> => {
    const state = await getState()

    // navigator.onLine est peu fiable dans les service workers — on le garde
    // comme premier filtre rapide, mais on ne s'y fie pas exclusivement
    if (!state.auth.refreshToken) return

    try {
        /* ── 1. Refresh du JWT ── */
        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession({
            refresh_token: state.auth.refreshToken,
        })

        if (sessionError || !sessionData.session) {
            // Distinguer une erreur réseau d'un token vraiment expiré
            // Les erreurs réseau ont souvent un message contenant "fetch" ou arrivent
            // comme des erreurs avec status 0 ou sans response
            const errMsg = sessionError?.message?.toLowerCase() ?? ''
            const isOffline =
                errMsg.includes('fetch') ||
                errMsg.includes('network') ||
                errMsg.includes('failed to') ||
                errMsg.includes('networkerror') ||
                sessionError?.status === 0 ||
                sessionError?.status === undefined && errMsg === ''

            if (isOffline) {
                // Pas de réseau — on ne déconnecte pas, on réessaiera à la prochaine alarm
                console.warn('[syncAuth] Pas de connexion réseau — sync ignorée, session conservée')
                return
            }

            console.warn('[syncAuth] Refresh token invalide ou expiré — déconnexion silencieuse')
            // Downgrade les listes si l'utilisateur était Premium
            if (state.isPremium) downgradeToFree(state)
            // Reset complet de auth — pas seulement les tokens
            state.auth = {
                isAuthenticated: false,
                userId:          null,
                userName:        null,
                email:           null,
                accessToken:     null,
                refreshToken:    null,
                lastSyncAt:      Date.now(),
            }
            // Reset de la subscription au plan FREE
            state.subscription = {
                plan:               'FREE',
                expiresAt:          null,
                graceUntil:         null,
                isValid:            true,
                expiresSoon:        false,
                lastExpiryNoticeAt: null,
            }
            state.isPremium = false
            await setState(state)
            return
        }

        const session = sessionData.session

        /* ── 2. Nouveaux tokens dans le state ── */
        state.auth.accessToken  = session.access_token
        state.auth.refreshToken = session.refresh_token
        state.auth.lastSyncAt   = Date.now()

        /* ── 3. Lecture de la subscription ── */
        // On utilise le nouveau token (access_token) pour satisfaire la RLS
        // (auth.uid() = user_id — le client anon ne passerait pas cette vérification)
        const { data: sub, error: subError } = await supabaseWithToken(session.access_token)
            .from('subscriptions')
            .select('plan, is_valid, expires_at, grace_until')
            .eq('user_id', session.user.id)
            .maybeSingle()

        if (subError || !sub) {
            // Aucune subscription trouvée → on sauvegarde au moins les nouveaux tokens
            await setState(state)
            return
        }
        // @ts-ignore
        const expiresAt  = sub.expires_at  ? new Date(sub.expires_at).getTime()  : null
        // @ts-ignore
        const graceUntil = sub.grace_until ? new Date(sub.grace_until).getTime() : null
        // sub.plan est typé SubscriptionPlan grâce à Database — pas besoin de cast
        // @ts-ignore
        const plan: SubscriptionPlan = sub.plan

        const wasAlreadyPremium = state.isPremium

        /* ── 4. Mise à jour de la subscription dans le state ── */
        state.subscription = {
            ...state.subscription,
            plan,
            expiresAt,
            graceUntil,
            // @ts-ignore
            isValid: sub.is_valid,
            // expiresSoon est recalculé par checkSubscriptionExpiry() dans main.ts
        }

        /* ── 5. Dériver isPremium ── */
        const isNowPremium    = isSubActive({ plan, expiresAt, graceUntil })
        state.isPremium       = isNowPremium

        /* ── 6. Upgrade ou downgrade selon l'évolution du statut ── */
        if (isNowPremium && !wasAlreadyPremium) {
            // Était FREE, devient Premium → réintégrer les éléments frozen
            upgradeToPremium(state)
        } else if (!isNowPremium && wasAlreadyPremium) {
            // Était Premium, ne l'est plus (abonnement expiré côté Supabase)
            // → déplacer les éléments qui dépassent les limites FREE dans frozen
            downgradeToFree(state)
        }

        await setState(state)

    } catch (err) {
        // TypeError "Failed to fetch" = pas de réseau — on ignore silencieusement
        // On ne déconnecte JAMAIS sur une erreur réseau
        if (isNetworkError(err)) {
            console.warn('[syncAuth] Erreur réseau (catch) — sync ignorée, session conservée')
            return
        }
        console.warn('[syncAuth] Erreur inattendue :', err)
    }
}

/* =========================================================
   isSubActive — helper interne
   Dupliqué ici pour éviter l'import circulaire avec main.ts
   (main.ts importe syncAuth depuis auth.ts,
    auth.ts ne peut donc pas importer depuis main.ts pour cette fonction)
========================================================= */
export function isSubActive(sub: {
    plan: SubscriptionPlan
    expiresAt:  number | null
    graceUntil: number | null
}): boolean {
    if (sub.plan === 'LIFETIME') return true

    const now = Date.now()
    if (sub.expiresAt  != null && now <= sub.expiresAt)  return true
    if (sub.graceUntil != null && now <= sub.graceUntil) return true

    return false
}