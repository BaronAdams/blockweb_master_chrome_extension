import { normalizeDomain, matchingProfileSite } from "@/lib/utils";
import { applyProfileBlocking, clearProfileRules } from "./blocking";
import { getState, setState } from "./storage";
import {
    isProfileLimitReached,
    isProfileActiveToday,
    isInTimeRange,
    isIntervalActive,
    todayKey,
} from "./time";
import { getDomain } from "./domains";

export const isTrackableUrl = (url?: string) => {
    if (!url) return false;
    return url.startsWith("http://") || url.startsWith("https://");
};

/* =========================================================
   stopTracking
   ─────────────────────────────────────────────────────────
   Source de vérité pour le temps écoulé :
   - Si activeStartTime (mémoire) est fourni → on l'utilise
   - Sinon on fall back sur usage.lastStart du storage
     (cas : service worker redémarré entre deux événements)
   Cela évite la perte de temps quand le SW est tué par Chrome.
========================================================= */

/* =========================================================
   splitElapsedByHour
   ─────────────────────────────────────────────────────────
   Répartit une session (startMs → endMs) sur les tranches
   horaires qu'elle couvre.
   Retourne une liste de { dayKey, hourKey, ms }.

   Ex: session 23:50 → 00:10 (lendemain)
     → [{ day: '...', hour: '...:23', ms: 10min },
        { day: '...+1', hour: '...:00', ms: 10min }]
========================================================= */
function splitElapsedByHour(
    startMs: number,
    endMs:   number,
): { dayKey: string; hourKey: string; ms: number }[] {
    const segments: { dayKey: string; hourKey: string; ms: number }[] = [];
    let cursor = startMs;

    while (cursor < endMs) {
        const d    = new Date(cursor);
        const year = d.getFullYear();
        const mon  = String(d.getMonth() + 1).padStart(2, '0');
        const day  = String(d.getDate()).padStart(2, '0');
        const hr   = d.getHours();

        // Fin de l'heure courante
        const hourEnd  = new Date(year, d.getMonth(), d.getDate(), hr + 1, 0, 0, 0).getTime();
        const segEnd   = Math.min(hourEnd, endMs);
        const segMs    = segEnd - cursor;

        const dayKey  = `${year}-${mon}-${day}`;
        const hourKey = `${dayKey}:${String(hr).padStart(2, '0')}`;

        if (segMs > 0) {
            segments.push({ dayKey, hourKey, ms: segMs });
        }
        cursor = segEnd;
    }
    return segments;
}

export const stopTracking = async (
    activeDomain:    string | null,
    activeStartTime: number | null
) => {
    const state = await getState();
    const today = todayKey();
    const now   = Date.now();

    // Déterminer quel domaine flusher
    let domainToFlush = activeDomain ? normalizeDomain(activeDomain) : null;

    if (!domainToFlush) {
        // SW redémarré — chercher un domaine avec lastStart actif dans le storage
        const activeEntry = Object.values(state.siteUsage).find(u => u.lastStart !== null);
        if (!activeEntry) {
            return { activeDomain: null, activeStartTime: null };
        }
        domainToFlush = activeEntry.domain;
    }

    const usage = state.siteUsage[domainToFlush];
    if (!usage) {
        return { activeDomain: null, activeStartTime: null };
    }

    // Priorité : activeStartTime mémoire → fallback lastStart storage
    const startRef = activeStartTime ?? usage.lastStart;

    if (!startRef || startRef <= 0) {
        usage.lastStart = null;
        state.siteUsage[domainToFlush] = usage;
        await setState(state);
        return { activeDomain: null, activeStartTime: null };
    }

    const elapsed = now - startRef;

    // Ignorer les valeurs aberrantes (négatif ou > 5min)
    // La safety-flush alarm tourne toutes les 10s → toute session > 5min
    // sans flush = veille / redémarrage PC → on ne comptabilise pas.
    const MAX_SESSION_MS = 5 * 60 * 1000 // 5 minutes
    if (elapsed <= 0 || elapsed > MAX_SESSION_MS) {
        usage.lastStart = null;
        state.siteUsage[domainToFlush] = usage;
        await setState(state);
        return { activeDomain: null, activeStartTime: null };
    }

    // Reset journalier si nécessaire
    if (usage.lastDay !== today) {
        usage.todayTimeMs = 0;
        usage.lastDay     = today;
    }

    usage.todayTimeMs += elapsed;
    usage.totalTimeMs += elapsed;
    usage.lastStart    = null;

    // ── Historique horaire ──────────────────────────────────────────────────
    // Clés utilisées :
    //   'YYYY-MM-DD'     → total du jour (pour heatmap + ligne 7j)
    //   'YYYY-MM-DD:HH'  → total de l'heure (pour bar chart heure/heure)
    // Si la session chevauche plusieurs heures (ex: 23h45 → 00h15),
    // on répartit l'elapsed proportionnellement sur chaque heure couverte.
    if (!usage.history) usage.history = {};
    if (!state.usageHistory) state.usageHistory = {};

    // Répartir elapsed sur les heures couvertes
    const segments = splitElapsedByHour(startRef, now);
    for (const { dayKey, hourKey, ms: segMs } of segments) {
        usage.history[dayKey]  = (usage.history[dayKey]  ?? 0) + segMs;
        usage.history[hourKey] = (usage.history[hourKey] ?? 0) + segMs;
        state.usageHistory[dayKey]  = (state.usageHistory[dayKey]  ?? 0) + segMs;
        state.usageHistory[hourKey] = (state.usageHistory[hourKey] ?? 0) + segMs;
    }

    state.siteUsage[domainToFlush] = usage;

    /* ── Vérifier les profils ── */
    await clearProfileRules();
    let shouldBlock = false;

    for (const profile of state.activeProfiles) {
        if (!profile.isActive) continue;
        if (!matchingProfileSite(domainToFlush, profile.sites)) continue;

        const cfg = profile.config;

        if (cfg.type === "interval") {
            if (isIntervalActive(profile)) {
                shouldBlock = true;
                await applyProfileBlocking(profile);
            }
            continue;
        }

        if (!isProfileActiveToday(profile)) continue;
        if (cfg.type === "hourly" && !isInTimeRange(profile)) continue;

        if (isProfileLimitReached(profile, state.siteUsage, now)) {
            shouldBlock = true;
            await applyProfileBlocking(profile);
        }
    }

    if (!shouldBlock) {
        await clearProfileRules();
    }

    await setState(state);

    return { activeDomain: null, activeStartTime: null };
};

/* =========================================================
   startTracking
   ─────────────────────────────────────────────────────────
   Un seul Date.now() utilisé pour lastStart (storage) ET
   activeStartTime (mémoire retournée) → pas de drift.
   Si un lastStart existait sans flush préalable, on le flush
   avant d'en démarrer un nouveau.
========================================================= */

export const startTracking = async (tabId: number, url?: string) => {
    if (!isTrackableUrl(url)) {
        return { activeTabId: null, activeDomain: null, activeStartTime: null };
    }

    const domain = getDomain(url);
    if (!domain) {
        return { activeTabId: null, activeDomain: null, activeStartTime: null };
    }

    const state            = await getState();
    const today            = todayKey();
    const normalizedDomain = normalizeDomain(domain);
    const startTime        = Date.now(); // un seul appel — partagé storage + retour

    const usage =
        state.siteUsage[normalizedDomain] ??
        (state.siteUsage[normalizedDomain] = {
            domain:      normalizedDomain,
            totalTimeMs: 0,
            todayTimeMs: 0,
            lastStart:   null,
            lastDay:     today,
            history:     {},
        });

    if (usage.lastDay !== today) {
        usage.todayTimeMs = 0;
        usage.lastDay     = today;
    }

    // Flush implicite si un tracking était en cours sans avoir été stoppé
    // (double startTracking, ou SW redémarré avant un stopTracking)
    // Garde : 5min max — au-delà c'est une veille/redémarrage, on ignore.
    if (usage.lastStart !== null) {
        const implicitElapsed = startTime - usage.lastStart;
        const MAX_IMPLICIT_MS = 5 * 60 * 1000 // 5 minutes
        if (implicitElapsed > 0 && implicitElapsed < MAX_IMPLICIT_MS) {
            usage.todayTimeMs += implicitElapsed;
            usage.totalTimeMs += implicitElapsed;
        }
        // Toujours reset lastStart même si on n'a pas comptabilisé
        usage.lastStart = null;
    }

    usage.lastStart = startTime;
    state.siteUsage[normalizedDomain] = usage;

    await setState(state);

    return {
        activeTabId:     tabId,
        activeDomain:    domain,
        activeStartTime: startTime, // identique à lastStart → pas de drift
    };
};