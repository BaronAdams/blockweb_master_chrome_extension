import { normalizeDomain } from "@/lib/utils";
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
========================================================= */

export const stopTracking = async (
    activeDomain:    string | null,
    activeStartTime: number | null
) => {
    if (!activeDomain || !activeStartTime) {
        return { activeDomain: null, activeStartTime: null };
    }

    const elapsed = Date.now() - activeStartTime;
    if (elapsed <= 0) {
        return { activeDomain: null, activeStartTime: null };
    }

    const state = await getState();
    const today = todayKey();
    const now   = Date.now();

    const normalizedDomain = normalizeDomain(activeDomain);
    const usage =
        state.siteUsage[normalizedDomain] ??
        (state.siteUsage[normalizedDomain] = {
            domain:      normalizedDomain,
            totalTimeMs: 0,
            todayTimeMs: 0,
            lastStart:   null,
            lastDay:     today,
        });

    // Reset journalier
    if (usage.lastDay !== today) {
        usage.todayTimeMs = 0;
        usage.lastDay     = today;
    }

    usage.todayTimeMs += elapsed;
    usage.totalTimeMs += elapsed;
    usage.lastStart    = null;

    state.siteUsage[normalizedDomain] = usage;

    /* ── Vérifier les profils ── */
    await clearProfileRules();
    let shouldBlock = false;

    for (const profile of state.activeProfiles) {
        if (!profile.isActive) continue;
        if (!profile.sites.includes(normalizedDomain)) continue;

        const cfg = profile.config;

        // Profil interval → vérifier les plages, pas le temps
        if (cfg.type === "interval") {
            if (isIntervalActive(profile)) {
                shouldBlock = true;
                await applyProfileBlocking(profile);
            }
            continue;
        }

        // Profil daily/hourly/weekly → vérifier jours + plages horaires
        if (!isProfileActiveToday(profile)) continue;
        if (cfg.type === "hourly" && !isInTimeRange(profile)) continue;

        // Vérifier la limite de temps
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
========================================================= */

export const startTracking = async (tabId: number, url?: string) => {
    if (!isTrackableUrl(url)) {
        return { activeTabId: null, activeDomain: null, activeStartTime: null };
    }

    const domain = getDomain(url);
    if (!domain) {
        return { activeTabId: null, activeDomain: null, activeStartTime: null };
    }

    const state           = await getState();
    const today           = todayKey();
    const normalizedDomain = normalizeDomain(domain);

    const usage =
        state.siteUsage[normalizedDomain] ??
        (state.siteUsage[normalizedDomain] = {
            domain:      normalizedDomain,
            totalTimeMs: 0,
            todayTimeMs: 0,
            lastStart:   null,
            lastDay:     today,
        });

    if (usage.lastDay !== today) {
        usage.todayTimeMs = 0;
        usage.lastDay     = today;
    }

    usage.lastStart = Date.now();
    state.siteUsage[normalizedDomain] = usage;

    await setState(state);

    return {
        activeTabId:     tabId,
        activeDomain:    domain,
        activeStartTime: Date.now(),
    };
};