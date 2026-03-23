import { Profile, State, SubscriptionState } from "@/lib/types"
import type { SubscriptionPlan } from "@/lib/database.types"
import { getState, setState } from "./storage"
import { syncAuth, isSubActive } from "./auth"
import { startTracking, stopTracking, isTrackableUrl } from "./tracking"
import { syncDnrRules, syncProfileRules } from "./blocking"
import { addBlockedDomain, getDomain, removeBlockedDomain } from "./domains"
import { addBlockedKeyword, removeBlockedKeyword } from "./keywords"
import { addProfile, clearExpiredProfileBlocks, editProfile, removeProfile, toggleProfile } from "./profiles"
import { LIMITS, PREDEFINED_ADULT_DOMAINS } from "@/lib/constants"
import { normalizeDomain, matchingProfileSite } from "@/lib/utils"
import { hourKey, isProfileLimitReached, todayKey } from "./time"
import { supabase, supabaseWithToken } from "@/lib/supabase"

/* =========================================================
   STRICT MODE
========================================================= */

function isStrictModeActive(state: State): boolean {
    return state.strictModeUntil !== null && Date.now() < state.strictModeUntil
}

/* =========================================================
   DOWNGRADE / UPGRADE
========================================================= */

export function downgradeToFree(state: State): void {
    const allowedDomains = LIMITS.FREE.domains
    const allowedKeywords = LIMITS.FREE.keywords
    const allowedProfiles = LIMITS.FREE.profiles

    const overflowDomains = state.activeBlockedDomains.slice(allowedDomains)
    const overflowKeywords = state.activeBlockedKeywords.slice(allowedKeywords)
    const overflowProfiles = state.activeProfiles.slice(allowedProfiles)

    state.activeBlockedDomains = state.activeBlockedDomains.slice(0, allowedDomains)
    state.activeBlockedKeywords = state.activeBlockedKeywords.slice(0, allowedKeywords)
    state.activeProfiles = state.activeProfiles.slice(0, allowedProfiles)

    // Fusionner dans frozen sans créer de doublons
    const frozenDomainSet = new Set(state.frozenBlockedDomains)
    const frozenKeywordSet = new Set(state.frozenBlockedKeywords)
    const frozenProfileIds = new Set(state.frozenProfiles.map(p => p.id))

    for (const d of overflowDomains) if (!frozenDomainSet.has(d)) state.frozenBlockedDomains.push(d)
    for (const k of overflowKeywords) if (!frozenKeywordSet.has(k)) state.frozenBlockedKeywords.push(k)
    for (const p of overflowProfiles) if (!frozenProfileIds.has(p.id)) state.frozenProfiles.push(p)

    state.isPremium = false

    // Désactiver le blocage adulte (fonctionnalité Premium)
    state.adultContentBlocked = false

    // Plafonne le mode strict à 24h en Free
    if (state.strictDefaultTime > 86_400_000) state.strictDefaultTime = 86_400_000
    if (state.strictModeUntil && state.strictModeUntil > Date.now() + 86_400_000) {
        state.strictModeUntil = Date.now() + 86_400_000
    }
}

export function upgradeToPremium(state: State): void {
    // Réintègre tous les éléments frozen dans les listes actives
    state.activeBlockedDomains.push(...state.frozenBlockedDomains)
    state.frozenBlockedDomains = []

    state.activeBlockedKeywords.push(...state.frozenBlockedKeywords)
    state.frozenBlockedKeywords = []

    state.activeProfiles.push(...state.frozenProfiles)
    state.frozenProfiles = []

    state.isPremium = true
}

/* =========================================================
   SUBSCRIPTION HELPERS
========================================================= */

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export function getRemainingMs(expiresAt: number): number {
    return expiresAt - Date.now()
}

function checkSubscriptionExpiry(state: State): void {
    if (!state.subscription.expiresAt) return
    const remaining = getRemainingMs(state.subscription.expiresAt)
    state.subscription.expiresSoon = remaining > 0 && remaining <= SEVEN_DAYS
}

function shouldNotify(state: State): boolean {
    const last = state.subscription.lastExpiryNoticeAt
    if (!last) return true
    return Date.now() - last > 24 * 60 * 60 * 1000
}

// Réexporte isSubActive sous le nom utilisé par l'ancienne API interne
function isSubscriptionActive(sub: SubscriptionState): boolean {
    return isSubActive({
        plan: sub.plan as SubscriptionPlan,
        expiresAt: sub.expiresAt,
        graceUntil: sub.graceUntil,
    })
}

/* ─────────────────────────────────────────────────────────
   Helper interne : lit la subscription depuis Supabase et
   retourne les champs normalisés pour le state local.
   Utilisé par SIGN_IN et par tout code qui a besoin de
   reconstruire SubscriptionState depuis la DB.
───────────────────────────────────────────────────────── */
async function fetchSubFromDB(userId: string, accessToken?: string | null): Promise<{
    plan: SubscriptionPlan
    expiresAt: number | null
    graceUntil: number | null
    isValid: boolean
    isPremium: boolean
}> {
    // La RLS exige auth.uid() = user_id → il faut envoyer le JWT de l'utilisateur.
    // Sans token le client anon ne peut pas lire la subscription (sub = null → plan FREE).
    const client = accessToken ? supabaseWithToken(accessToken) : supabase
    const { data: sub } = await client
        .from('subscriptions')
        .select('plan, is_valid, expires_at, grace_until')
        .eq('user_id', userId)
        .maybeSingle()

    // @ts-ignore
    const plan: SubscriptionPlan = sub?.plan ?? 'FREE'
    // @ts-ignore
    const isValid: boolean = sub?.is_valid ?? true
    // @ts-ignore
    const expiresAt = sub?.expires_at ? new Date(sub.expires_at).getTime() : null
    // @ts-ignore
    const graceUntil = sub?.grace_until ? new Date(sub.grace_until).getTime() : null
    const isPremium = isSubActive({ plan, expiresAt, graceUntil })

    return { plan, expiresAt, graceUntil, isValid, isPremium }
}

/* =========================================================
   TRACKING STATE
========================================================= */

let activeTabId: number | null = null
let activeDomain: string | null = null
let activeStartTime: number | null = null

/* =========================================================
   ON INSTALLED
========================================================= */

chrome.runtime.onInstalled.addListener(async () => {
    const initialState: State = {
        auth: {
            isAuthenticated: false,
            userId: null,
            userName: null,
            email: null,
            accessToken: null,
            refreshToken: null,
            lastSyncAt: null,
        },
        subscription: {
            plan: 'FREE',
            expiresAt: null,
            graceUntil: null,
            isValid: true,
            expiresSoon: false,
            lastExpiryNoticeAt: null,
        },
        isPremium: false,
        activeBlockedDomains: [],
        frozenBlockedDomains: [],
        activeBlockedKeywords: [],
        frozenBlockedKeywords: [],
        activeProfiles: [],
        frozenProfiles: [],
        whitelist: [],
        customRedirectUrl: '',   // ← nom correct du champ State
        adultContentBlocked: false,
        strictModeUntil: null,
        strictDefaultTime: 86_400_000,
        siteUsage: {},
        usageHistory: {},
        detectedAdultDomains: [],
    }

    const existing = await chrome.storage.local.get('blockweb_master_state')
    if (!existing.blockweb_master_state) {
        await setState(initialState)
    }

    // Page affichée si l'extension est désinstallée en mode strict.
    // Chrome ne permet pas de bloquer la désinstallation — on peut seulement
    // ouvrir cette URL après coup pour rappeler à l'utilisateur son engagement.
    chrome.runtime.setUninstallURL('https://blockwebmaster.com/uninstall-strict')

    // Effacer les alarms avant de les recréer — évite les doublons lors des MAJ
    await chrome.alarms.clearAll()

    chrome.alarms.create('subscription-check', { periodInMinutes: 60 }) // 1h
    chrome.alarms.create('tracking-safety-flush', { periodInMinutes: 0.1667 }) // 10s
    chrome.alarms.create('clear-expired-profile-blocks', { periodInMinutes: 5 }) // 5min
    chrome.alarms.create('hourly-profile-reset', { periodInMinutes: 1 }) // 1min
    chrome.alarms.create('weekly-profile-reset', { periodInMinutes: 1 }) // 1min
    chrome.alarms.create('auth-sync', { periodInMinutes: 50 }) // 50min — refresh avant expiration du JWT (1h)

    // Alarm quotidienne à minuit pile — reset des baselines daily + nettoyage siteUsage
    const now      = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0) // prochain minuit
    const msUntilMidnight = midnight.getTime() - now.getTime()
    chrome.alarms.create('daily-reset', {
        when:           Date.now() + msUntilMidnight,
        periodInMinutes: 24 * 60, // se répète toutes les 24h
    })
})

/* =========================================================
   ON STARTUP
========================================================= */

chrome.runtime.onStartup.addListener(async () => {
    const state = await getState()

    // Les alarms ne tournent pas navigateur fermé.
    // Au démarrage, on vérifie manuellement si la sub a expiré pendant la fermeture.
    checkSubscriptionExpiry(state)
    if (!isSubscriptionActive(state.subscription) && state.isPremium) {
        downgradeToFree(state)
    }
    await setState(state)

    await clearExpiredProfileBlocks()

    if (state.auth.isAuthenticated && state.auth.refreshToken) {
        syncAuth()
    }
})

/* =========================================================
   ALARMS
========================================================= */

chrome.alarms.onAlarm.addListener(async (alarm) => {
    const state = await getState()

    switch (alarm.name) {

        /* ── Vérifie expiry, notifie, downgrade si expiré ── */
        case 'subscription-check': {
            checkSubscriptionExpiry(state)

            if (state.subscription.expiresSoon && shouldNotify(state)) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: '⏰ Abonnement bientôt expiré',
                    message: 'Votre abonnement expire dans moins de 7 jours.',
                })
                state.subscription.lastExpiryNoticeAt = Date.now()
            }

            if (!isSubscriptionActive(state.subscription) && state.isPremium) {
                downgradeToFree(state)
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: '🔒 Abonnement expiré',
                    message: 'Votre abonnement Premium est terminé. Vos paramètres ont été ajustés au plan Free.',
                })
            }

            await setState(state)
            break
        }

        /* ── Flush du temps tracké + redémarre + vérifie la limite en temps réel ──
           Cette alarm tourne toutes les 30s. Après le flush, on vérifie si
           l'onglet ACTIF a atteint la limite d'un profil. Sans ce check, la
           redirection vers /blocked n'a lieu que lors d'un changement d'onglet,
           ce qui laisse l'utilisateur naviguer librement tant qu'il ne bouge pas.
        ──────────────────────────────────────────────────────────────────────── */
        case 'tracking-safety-flush': {
            // 1. Flush le temps accumulé depuis le dernier flush (30s)
            const stopRes = await stopTracking(activeDomain, activeStartTime)
            activeDomain    = stopRes.activeDomain    // null
            activeStartTime = stopRes.activeStartTime // null

            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
            if (!tab?.id || !tab.url) break

            const freshState = await getState()
            const domain     = getDomain(tab.url)

            if (domain) {
                const normalizedDomain = normalizeDomain(domain)
                const now              = Date.now()

                // Après stopTracking, le temps a été flushé dans siteUsage.
                // isProfileLimitReached lit getProfileTotalTime qui appelle
                // getLiveTodayTime — maintenant that getLiveTodayTime inclut
                // toujours lastStart, mais lastStart vient d'être mis à null
                // par stopTracking. On relit le state frais (post-flush).
                for (const profile of freshState.activeProfiles) {
                    if (!profile.isActive) continue
                    if (!matchingProfileSite(normalizedDomain, profile.sites)) continue

                    if (isProfileLimitReached(profile, freshState.siteUsage, now)) {
                        chrome.tabs.update(tab.id, {
                            url: chrome.runtime.getURL(
                                `/src/blocked/index.html?profile=${encodeURIComponent(profile.id)}`
                            ),
                        })
                        activeTabId     = null
                        activeDomain    = null
                        activeStartTime = null
                        break
                    }
                }
            }

            // 2. Relancer le tracking — startTracking retourne le même timestamp
            //    que celui écrit dans lastStart (un seul Date.now())
            if (tab.url && isTrackableUrl(tab.url)) {
                const res   = await startTracking(tab.id, tab.url)
                activeTabId     = res.activeTabId ?? null
                activeDomain    = res.activeDomain
                activeStartTime = res.activeStartTime
            }
            break
        }

        /* ── Lève les blocages profil dont la limite est passée ── */
        case 'clear-expired-profile-blocks': {
            await syncProfileRules(state.activeProfiles, state.siteUsage, Date.now())
            break
        }

        /* ── Reset baseline des profils horaires si l'heure a changé ── */
        case 'hourly-profile-reset': {
            const currentHourKey = hourKey()
            let changed = false

            for (const profile of state.activeProfiles) {
                if (!profile.isActive) continue
                if (profile.config.type !== 'hourly') continue
                if (profile.baselineHourKey === currentHourKey) continue

                const newBaseline: Profile['baselineUsage'] = {}
                const today = todayKey()

                for (const domain of profile.sites) {
                    const usage = state.siteUsage[domain]
                    newBaseline[domain] = {
                        todayTimeMs: usage?.lastDay === today ? usage.todayTimeMs : 0,
                        totalTimeMs: usage?.totalTimeMs ?? 0,
                        day: today,
                    }
                }

                profile.baselineUsage = newBaseline
                profile.baselineHourKey = currentHourKey
                changed = true
            }

            if (changed) {
                await setState(state)
                await syncProfileRules(state.activeProfiles, state.siteUsage, Date.now())
            }
            break
        }

        /* ── Reset hebdo — stopTracking déclenche l'étape 3b de la baseline ── */
        case 'weekly-profile-reset': {
            await stopTracking(null, null)
            break
        }

        /* ── Reset quotidien à minuit ─────────────────────────────────────────
           À minuit pile :
           1. Flush le temps en cours (stopTracking)
           2. Reset les baselines de tous les profils daily actifs
              → le delta de la nouvelle journée repart de 0
           3. Relance le tracking sur l'onglet actif
        ──────────────────────────────────────────────────────────────────── */
        case 'daily-reset': {
            // 1. Flush le temps accumulé sur l'onglet actif
            const stopRes = await stopTracking(activeDomain, activeStartTime)
            activeDomain    = stopRes.activeDomain
            activeStartTime = stopRes.activeStartTime

            // Purger l'historique > 30 jours pour limiter la taille du storage
            // Garder 14 jours d'historique (clés 'YYYY-MM-DD' et 'YYYY-MM-DD:HH')
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - 14)
            const cutoffKey = cutoff.toISOString().slice(0, 10)

            const stateForPurge = await getState()
            for (const usage of Object.values(stateForPurge.siteUsage)) {
                if (usage.history) {
                    for (const day of Object.keys(usage.history)) {
                        if (day < cutoffKey) delete usage.history[day]
                    }
                }
            }
            if (stateForPurge.usageHistory) {
                for (const day of Object.keys(stateForPurge.usageHistory)) {
                    if (day < cutoffKey) delete stateForPurge.usageHistory[day]
                }
            }
            await setState(stateForPurge)

            const freshState = await getState()
            const today      = todayKey()
            let changed      = false

            for (const profile of freshState.activeProfiles) {
                if (!profile.isActive) continue

                if (profile.config.type === 'daily' || profile.config.type === 'hourly') {
                    // Reconstruire la baseline pour que le delta reparte de 0 demain
                    const newBaseline: Profile['baselineUsage'] = {}
                    for (const domain of profile.sites) {
                        const usage = freshState.siteUsage[domain]
                        // Le siteUsage.todayTimeMs sera reset par le prochain stopTracking
                        // On prend la valeur courante comme nouvelle baseline
                        newBaseline[domain] = {
                            todayTimeMs: usage?.lastDay === today ? usage.todayTimeMs : 0,
                            totalTimeMs: usage?.totalTimeMs ?? 0,
                            day:         today,
                        }
                    }
                    profile.baselineUsage = newBaseline
                    changed = true
                }

                if (profile.config.type === 'daily') {
                    // Remettre la baseline à "aujourd'hui" pour que le profil reparte de 0
                    profile.baselineHourKey = null
                }
            }

            if (changed) {
                await setState(freshState)
                await syncProfileRules(freshState.activeProfiles, freshState.siteUsage, Date.now())
            }

            // 3. Relancer le tracking sur l'onglet actif
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
            if (tab?.id && tab.url) {
                const startRes  = await startTracking(tab.id, tab.url)
                activeTabId     = startRes.activeTabId ?? null
                activeDomain    = startRes.activeDomain
                activeStartTime = startRes.activeStartTime
            }
            break
        }

        /* ── Refresh JWT silencieux toutes les 50min ── */
        case 'auth-sync': {
            if (state.auth.isAuthenticated && state.auth.refreshToken) {
                await syncAuth()
            }
            break
        }
    }
})

/* =========================================================
   MESSAGE API
========================================================= */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    ; (async () => {
        const state = await getState()
        const strictActive = isStrictModeActive(state)

        /* 🔐 Actions bloquées en mode strict */
        if (strictActive) {
            const BLOCKED_IN_STRICT = [
                'REMOVE_DOMAIN', 'REMOVE_PROFILE', 'ADD_WHITE', 'REMOVE_KEYWORD',
            ]
            if (BLOCKED_IN_STRICT.includes(request.type)) {
                sendResponse({ success: false, reason: 'STRICT_MODE_ACTIVE', strictModeUntil: state.strictModeUntil })
                return
            }

            // TOGGLE_PROFILE : autorisé uniquement pour ACTIVER un profil inactif
            // Désactiver un profil en mode strict est interdit
            if (request.type === 'TOGGLE_PROFILE') {
                const profileId = request.id as string
                const profile   = state.activeProfiles.find(p => p.id === profileId)
                    ?? state.frozenProfiles.find(p => p.id === profileId)
                if (profile?.isActive) {
                    // Profil déjà actif → désactivation interdite en mode strict
                    sendResponse({ success: false, reason: 'STRICT_MODE_ACTIVE', strictModeUntil: state.strictModeUntil })
                    return
                }
            }

            // TOGGLE_ADULT_CONTENT : autorisé uniquement pour ACTIVER (pas désactiver)
            if (request.type === 'TOGGLE_ADULT_CONTENT' && state.adultContentBlocked) {
                sendResponse({ success: false, reason: 'STRICT_MODE_ACTIVE', strictModeUntil: state.strictModeUntil })
                return
            }

            // REMOVE_WHITE : autorisé (retirer de la whitelist = renforcer le blocage)
            // ADD_WHITE est déjà dans BLOCKED_IN_STRICT
        }

        switch (request.type) {

            /* ── Tracking ── */
            case 'GET_ACTIVE_DOMAIN': {
                sendResponse({ activeDomain })
                return
            }

            /* ── Domaines ── */
            case 'ADD_DOMAIN': {
                await addBlockedDomain(request.domain as string)
                sendResponse({ success: true })
                return
            }
            case 'REMOVE_DOMAIN': {
                await removeBlockedDomain(request.domain as string)
                sendResponse({ success: true })
                return
            }

            /* ── Mots-clés ── */
            case 'ADD_KEYWORD': {
                await addBlockedKeyword(request.keyword as string)
                sendResponse({ success: true })
                return
            }
            case 'REMOVE_KEYWORD': {
                await removeBlockedKeyword(request.keyword as string)
                sendResponse({ success: true })
                return
            }

            /* ── Whitelist ── */
            case 'ADD_WHITE': {
                if (!state.isPremium) {
                    sendResponse({ success: false, reason: 'Cette fonctionnalité est premium' })
                    return
                }
                if (!state.whitelist.includes(request.white as string)) {
                    await setState({ ...state, whitelist: [...state.whitelist, request.white as string] })
                }
                sendResponse({ success: true })
                return
            }
            case 'REMOVE_WHITE': {
                if (!state.isPremium) {
                    sendResponse({ success: false, reason: 'Cette fonctionnalité est premium' })
                    return
                }
                await setState({ ...state, whitelist: state.whitelist.filter((_, i) => i !== request.index) })
                sendResponse({ success: true })
                return
            }

            /* ── Profils ── */
            case 'ADD_PROFILE': {
                try {
                    await addProfile(request.data as Profile)
                    sendResponse({ success: true })
                } catch {
                    sendResponse({ success: false })
                }
                return
            }
            case 'REMOVE_PROFILE': {
                try {
                    await removeProfile(request.id as string)
                    sendResponse({ success: true })
                } catch {
                    sendResponse({ success: false })
                }
                return
            }
            case 'TOGGLE_PROFILE': {
                try {
                    const isEnabled = await toggleProfile(request.id as string)
                    sendResponse({ success: true, isEnabled })
                } catch {
                    sendResponse({ success: false })
                }
                return
            }
            case 'EDIT_PROFILE': {
                try {
                    await editProfile(
                        request.id as string,
                        request.data as { name: string; config: Profile['config']; sites: string[] }
                    )
                    sendResponse({ success: true })
                } catch {
                    sendResponse({ success: false })
                }
                return
            }

            /* ── Adulte / Strict / URL ── */
            case 'TOGGLE_ADULT_CONTENT': {
                if (!state.isPremium) {
                    sendResponse({ success: false, reason: 'Cette fonctionnalité est premium' })
                    return
                }
                await setState({ ...state, adultContentBlocked: !state.adultContentBlocked })
                sendResponse({ success: true })
                return
            }
            case 'ACTIVATE_STRICT_MODE': {
                // On sauvegarde la durée (defaultTime) en même temps que l'activation
                // pour éviter la race condition entre SAVE_STRICT_TIME et ACTIVATE_STRICT_MODE
                // (SAVE_STRICT_TIME était bloqué si le mode strict était déjà actif)
                await setState({
                    ...state,
                    strictModeUntil:   request.time as number,
                    strictDefaultTime: request.duration as number ?? state.strictDefaultTime,
                })
                sendResponse({ success: true })
                return
            }
            case 'CHECK_STRICT_EXPIRATION': {
                if (state.strictModeUntil && Date.now() > state.strictModeUntil) {
                    await setState({ ...state, strictModeUntil: null })
                }
                sendResponse({ success: true })
                return
            }
            case 'SAVE_STRICT_TIME': {
                await setState({ ...state, strictDefaultTime: request.time as number })
                sendResponse({ success: true })
                return
            }
            case 'SET_CUSTOM_URL': {
                // ✅ customRedirectUrl — nom correct du champ dans State
                await setState({ ...state, customRedirectUrl: request.customRedirectUrl as string })
                sendResponse({ success: true })
                return
            }
            case 'UPGRADE_PREMIUM': {
                // Débloquer les frozen + marquer isPremium = true
                upgradeToPremium(state)
                await setState(state)
                sendResponse({ success: true })
                return
            }

            /* ── State / Adultes ── */
            case 'GET_STATE': {
                sendResponse(state)
                return
            }
            case 'GET_ADULT_DOMAINS': {
                sendResponse({ domains: PREDEFINED_ADULT_DOMAINS })
                return
            }

            /* ── Visibilité de page (content script) ── */
            case 'PAGE_VISIBILITY': {
                if (request.visibility === 'hidden') {
                    const res = await stopTracking(activeDomain, activeStartTime)
                    activeDomain = res.activeDomain
                    activeStartTime = res.activeStartTime
                    activeTabId = null
                }
                if (request.visibility === 'visible') {
                    if (!sender.tab?.id || !sender.tab?.url) return
                    const res = await startTracking(sender.tab.id, sender.tab.url)
                    activeTabId = res.activeTabId
                    activeDomain = res.activeDomain
                    activeStartTime = res.activeStartTime
                }
                return
            }

            /* ── AUTH ── */

            /* ── Marque un domaine comme adulte détecté par le content script ──
               Appelé toujours, que adultContentBlocked soit activé ou non.
               Permet de classifier ce domaine dans Analytics → catégorie "Adulte".
            ── */
            case 'MARK_ADULT_DOMAIN': {
                const domain = (request.domain as string)?.toLowerCase().replace(/^www\./, '').trim()
                if (!domain) { sendResponse({ success: false }); return }

                if (!state.detectedAdultDomains) state.detectedAdultDomains = []

                // Ne pas marquer un domaine déjà dans une catégorie connue non-adulte.
                // Le content script a une SAFE_DOMAINS list, mais le background est la
                // dernière ligne de défense contre les faux positifs.
                // const allKnownSafe = [
                //     ...LIMITS ? [] : [], // placeholder — les catégories sont côté client
                //     // On vérifie via les listes de blocage utilisateur : si le domaine
                //     // est dans activeBlockedDomains il peut être adulte (l'user l'a bloqué).
                //     // En revanche si il est dans la whitelist, il est sûr.
                // ]
                const isWhitelisted = (state.whitelist ?? []).some(w =>
                    domain === w.toLowerCase().replace(/^www\./, '') ||
                    domain.endsWith('.' + w.toLowerCase().replace(/^www\./, ''))
                )
                if (isWhitelisted) {
                    sendResponse({ success: false, reason: 'whitelisted' })
                    return
                }

                if (!state.detectedAdultDomains.includes(domain)) {
                    state.detectedAdultDomains.push(domain)
                    await setState(state)
                }
                sendResponse({ success: true })
                return
            }

            /* ── Vérifie le mot de passe sans le changer ──
               Utilisé pour protéger la déconnexion : un visiteur
               qui ne connaît pas le mot de passe ne peut pas
               déconnecter le compte principal.
            ── */
            case 'VERIFY_PASSWORD': {
                if (!state.auth.isAuthenticated || !state.auth.email) {
                    sendResponse({ error: 'Non authentifié.' })
                    return
                }
                const { password: verifyPwd } = request as { password: string }
                const { error: verifyError } = await supabase.auth.signInWithPassword({
                    email:    state.auth.email,
                    password: verifyPwd,
                })
                if (verifyError) {
                    sendResponse({ error: 'Mot de passe incorrect.' })
                } else {
                    sendResponse({ success: true })
                }
                return
            }

            case 'UPDATE_PASSWORD': {
                if (!state.auth.isAuthenticated || !state.auth.email) {
                    sendResponse({ error: 'Non authentifié.' })
                    return
                }
                const { currentPwd, newPwd } = request as { currentPwd: string; newPwd: string }

                // 1. Vérifier le mot de passe actuel
                const { error: checkError } = await supabase.auth.signInWithPassword({
                    email:    state.auth.email,
                    password: currentPwd,
                })
                if (checkError) {
                    sendResponse({ error: 'Mot de passe actuel incorrect.' })
                    return
                }

                // 2. Mettre à jour via l'API REST Supabase (fetch direct — plus fiable en service worker)
                const SUPABASE_URL_PWD = import.meta.env.VITE_SUPABASE_URL as string
                const updateRes = await fetch(`${SUPABASE_URL_PWD}/auth/v1/user`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type':  'application/json',
                        'apikey':        import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string,
                        'Authorization': `Bearer ${state.auth.accessToken}`,
                    },
                    body: JSON.stringify({ password: newPwd }),
                })

                if (!updateRes.ok) {
                    const body = await updateRes.json().catch(() => ({}))
                    sendResponse({ error: body?.msg ?? body?.message ?? 'Impossible de mettre à jour le mot de passe.' })
                    return
                }

                sendResponse({ success: true })
                return
            }

            case 'UPDATE_USERNAME': {
                const username = request.username as string
                if (!state.auth.isAuthenticated || !state.auth.userId) {
                    sendResponse({ error: 'Non authentifié.' })
                    return
                }
                // Mise à jour dans Supabase
                const { error: sbError } = await supabase
                    .from('profiles')
                    // @ts-ignore
                    .update({ username })
                    .eq('id', state.auth.userId)
                if (sbError) {
                    sendResponse({ error: sbError.message })
                    return
                }
                // Mise à jour dans le state local
                await setState({ ...state, auth: { ...state.auth, userName: username } })
                sendResponse({ success: true })
                return
            }

            case 'DELETE_ACCOUNT': {
                if (!state.auth.isAuthenticated || !state.auth.userId || !state.auth.accessToken || !state.auth.email) {
                    sendResponse({ error: 'Non authentifié.' })
                    return
                }

                const password = request.password as string
                if (!password) {
                    sendResponse({ error: 'Mot de passe requis pour supprimer le compte.' })
                    return
                }

                // 1. Vérifier le mot de passe avant toute suppression
                const { error: checkError } = await supabase.auth.signInWithPassword({
                    email:    state.auth.email,
                    password,
                })
                if (checkError) {
                    sendResponse({ error: 'Mot de passe incorrect.' })
                    return
                }

                // 2. Appeler l'Edge Function delete-account (service_role requis)
                const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
                let deleteResponse: Response
                try {
                    deleteResponse = await fetch(
                        `${SUPABASE_URL}/functions/v1/delete-account`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type':  'application/json',
                                'Authorization': `Bearer ${state.auth.accessToken}`,
                            },
                        }
                    )
                } catch (networkErr) {
                    console.error('[DELETE_ACCOUNT] Erreur réseau:', networkErr)
                    sendResponse({ error: 'Erreur réseau. Vérifie ta connexion.' })
                    return
                }

                if (!deleteResponse.ok) {
                    const body = await deleteResponse.json().catch(() => ({}))
                    console.error('[DELETE_ACCOUNT] Erreur Edge Function:', deleteResponse.status, body)
                    sendResponse({ error: body?.error ?? 'Impossible de supprimer le compte.' })
                    return
                }

                // 3. Nettoyage du storage local
                const avatarKey = `bwm_avatar_${state.auth.userId}`
                await chrome.storage.local.remove(['blockweb_master_state', avatarKey])
                sendResponse({ success: true })
                return
            }

            case 'RESET_PASSWORD': {
                const { error } = await supabase.auth.resetPasswordForEmail(
                    request.email as string
                )
                if (error) {
                    sendResponse({ error: error.message })
                } else {
                    sendResponse({ error: null })
                }
                return
            }

            case 'RESEND_CONFIRMATION': {
                // Renvoie l'email de confirmation à un utilisateur qui ne l'a pas reçu
                const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: request.email as string,
                })
                sendResponse({ error: error?.message ?? null })
                return
            }

            case 'SIGN_IN': {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: request.email as string,
                    password: request.password as string,
                })

                if (error) {
                    // "Email not confirmed" → cas spécial géré côté UI (bannière ambre + renvoi)
                    if (error.message === 'Email not confirmed') {
                        sendResponse({ error: null, notConfirmed: true })
                        return
                    }
                    // Tous les autres cas : on renvoie le message brut Supabase
                    // La traduction est faite dans auth-App.tsx via resolveError()
                    sendResponse({ error: error.message })
                    return
                }
                if (!data.session) {
                    sendResponse({ error: 'Connexion échouée.' })
                    return
                }

                const session = data.session
                const sub = await fetchSubFromDB(session.user.id, session.access_token)
                const wasAlreadyPremium = state.isPremium

                const newState: State = {
                    ...state,
                    auth: {
                        isAuthenticated: true,
                        userId: session.user.id,
                        userName: (session.user.user_metadata?.username as string) ?? null,
                        email: session.user.email ?? null,
                        accessToken: session.access_token,
                        refreshToken: session.refresh_token,
                        lastSyncAt: Date.now(),
                    },
                    subscription: {
                        ...state.subscription,
                        plan: sub.plan,
                        expiresAt: sub.expiresAt,
                        graceUntil: sub.graceUntil,
                        isValid: sub.isValid,
                    },
                    isPremium: sub.isPremium,
                }

                // Réintègre les frozen si l'utilisateur était déjà Premium avant connexion
                if (sub.isPremium && !wasAlreadyPremium) upgradeToPremium(newState)

                await setState(newState)
                sendResponse({ error: null })
                return
            }

            case 'SIGN_UP': {
                const { data, error } = await supabase.auth.signUp({
                    email: request.email as string,
                    password: request.password as string,
                    options: { data: { username: request.username } },
                })

                if (error) {
                    // On renvoie le message brut Supabase — la traduction est dans auth-App.tsx
                    sendResponse({ error: error.message })
                    return
                }

                // Supabase signUp sur un email non confirmé existant :
                // pas d'erreur mais data.user.identities est un tableau vide
                if (data.user && data.user.identities?.length === 0) {
                    sendResponse({ error: 'User already registered' })
                    return
                }

                if (!data.session) {
                    // Nouveau compte créé — confirmation email en attente
                    sendResponse({ error: null, needsConfirmation: true })
                    return
                }

                // Upsert profiles (le trigger SQL le fait aussi — double sécurité)
                // @ts-ignore
                await supabase.from('profiles').upsert({
                    id: data.user!.id,
                    username: request.username as string | undefined,
                })

                const newState: State = {
                    ...state,
                    auth: {
                        isAuthenticated: true,
                        userId: data.user!.id,
                        userName: (request.username as string) ?? null,
                        email: (request.email as string) ?? null,
                        accessToken: data.session.access_token,
                        refreshToken: data.session.refresh_token,
                        lastSyncAt: Date.now(),
                    },
                    subscription: {
                        plan: 'FREE',
                        expiresAt: null,
                        graceUntil: null,
                        isValid: true,
                        expiresSoon: false,
                        lastExpiryNoticeAt: null,
                    },
                    isPremium: false,
                }

                await setState(newState)
                sendResponse({ error: null })
                return
            }

            case 'SIGN_OUT': {
                const newState: State = {
                    ...state,
                    auth: {
                        isAuthenticated: false,
                        userId: null,
                        userName: null,
                        email: null,
                        accessToken: null,
                        refreshToken: null,
                        lastSyncAt: null,
                    },
                    subscription: {
                        plan: 'FREE',
                        expiresAt: null,
                        graceUntil: null,
                        isValid: true,
                        expiresSoon: false,
                        lastExpiryNoticeAt: null,
                    },
                    isPremium: false,
                }
                // Downgrade seulement si l'utilisateur était Premium
                if (state.isPremium) downgradeToFree(newState)
                await setState(newState)
                sendResponse({ success: true })
                return
            }

            default:
                sendResponse({ success: false })
        }
    })()

    return true // canal async ouvert
})

/* =========================================================
   STORAGE CHANGED → resync DNR
========================================================= */

chrome.storage.onChanged.addListener(async (changes) => {
    if (!changes.blockweb_master_state) return

    const newState = changes.blockweb_master_state.newValue as State
    const oldState = changes.blockweb_master_state.oldValue as State | undefined

    // 1. Resync toujours les règles DNR
    syncDnrRules(newState)

    // 2. Détecter si un nouveau domaine vient d'être ajouté aux bloqués
    //    Si l'onglet actif est sur ce domaine → rediriger immédiatement
    //    (les règles DNR ne redirigent que les nouvelles navigations,
    //     pas les onglets déjà chargés)
    if (!activeDomain) return

    const normalizedActive = normalizeDomain(activeDomain)
    const oldDomains  = oldState?.activeBlockedDomains ?? []
    const newDomains  = newState.activeBlockedDomains ?? []

    // Domaines nouvellement ajoutés dans cette mise à jour
    const addedDomains = newDomains.filter(d => !oldDomains.includes(d))

    // Vérifier aussi les domaines adultes si le blocage adulte vient d'être activé
    const adultJustEnabled = !oldState?.adultContentBlocked && newState.adultContentBlocked
    const adultDomains = adultJustEnabled ? (PREDEFINED_ADULT_DOMAINS ?? []) : []

    const allNewlyBlocked = [...addedDomains, ...adultDomains]

    const isActiveTabNowBlocked = allNewlyBlocked.some(d =>
        normalizeDomain(d) === normalizedActive ||
        normalizedActive.endsWith('.' + normalizeDomain(d))
    )

    if (isActiveTabNowBlocked && activeTabId) {
        chrome.tabs.update(activeTabId, {
            url: chrome.runtime.getURL(
                `/src/blocked/index.html?url=${encodeURIComponent(normalizedActive)}`
            ),
        })
        activeDomain    = null
        activeStartTime = null
    }
})

/* =========================================================
   TAB EVENTS
========================================================= */

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const stop = await stopTracking(activeDomain, activeStartTime)
    activeDomain = stop.activeDomain
    activeStartTime = stop.activeStartTime

    const tab = await chrome.tabs.get(tabId)
    if (!tab.url) return

    const domain = getDomain(tab.url)
    if (domain) {
        const state = await getState()
        for (const profile of state.activeProfiles) {
            if (!profile.isActive) continue
            if (!matchingProfileSite(normalizeDomain(domain), profile.sites)) continue
            if (isProfileLimitReached(profile, state.siteUsage)) {
                chrome.tabs.update(tabId, {
                    url: chrome.runtime.getURL(
                        `/src/blocked/index.html?profile=${encodeURIComponent(profile.id)}`
                    ),
                })
                activeTabId = null
                return
            }
        }
    }

    const start = await startTracking(tabId, tab.url)
    activeTabId = start.activeTabId ?? null
    activeDomain = start.activeDomain
    activeStartTime = start.activeStartTime
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (!changeInfo.url) return
    if (tabId !== activeTabId) return

    const domain = getDomain(changeInfo.url)
    if (!domain) return

    const state = await getState()
    const now = Date.now()

    for (const profile of state.activeProfiles) {
        if (!profile.isActive) continue
        if (!matchingProfileSite(normalizeDomain(domain), profile.sites)) continue
        if (isProfileLimitReached(profile, state.siteUsage, now)) {
            chrome.tabs.update(tabId, {
                url: chrome.runtime.getURL(`/src/blocked/index.html?profile=${profile.id}`),
            })
            return
        }
    }

    const stop = await stopTracking(activeDomain, activeStartTime)
    activeDomain = stop.activeDomain
    activeStartTime = stop.activeStartTime

    const start = await startTracking(tabId, changeInfo.url)
    activeDomain = start.activeDomain
    activeStartTime = start.activeStartTime
})

chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (tabId !== activeTabId) return

    const stop = await stopTracking(activeDomain, activeStartTime)
    activeDomain = stop.activeDomain
    activeStartTime = stop.activeStartTime
    activeTabId = null
})

/* =========================================================
   IDLE + WINDOW FOCUS
========================================================= */

chrome.idle.setDetectionInterval(15)

chrome.idle.onStateChanged.addListener(async (idleState) => {
    if (idleState === 'idle' || idleState === 'locked') {
        const res = await stopTracking(activeDomain, activeStartTime)
        activeDomain = res.activeDomain
        activeStartTime = res.activeStartTime
        activeTabId = null
    }
    if (idleState === 'active') {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
        if (tab?.id && tab.url) {
            const res = await startTracking(tab.id, tab.url)
            activeTabId = res.activeTabId
            activeDomain = res.activeDomain
            activeStartTime = res.activeStartTime
        }
    }
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        const res = await stopTracking(activeDomain, activeStartTime)
        activeDomain = res.activeDomain
        activeStartTime = res.activeStartTime
        activeTabId = null
        return
    }

    const [tab] = await chrome.tabs.query({ active: true, windowId })
    if (tab?.id && tab.url) {
        const res = await startTracking(tab.id, tab.url)
        activeTabId = res.activeTabId
        activeDomain = res.activeDomain
        activeStartTime = res.activeStartTime
    }
})