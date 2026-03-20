import { Profile, ProfileConfig, State } from "@/lib/types";
import { getState, setState } from "./storage";
import { LIMITS } from "@/lib/constants";
import { computeProfileUsage, normalizeDomain } from "@/lib/utils";
import { todayKey } from "./time";
import { clearProfileRules } from "./blocking";

function isProfileExists(state: State, profile: Profile) {
    return (
        state.activeProfiles.includes(profile) ||
        state.frozenProfiles.includes(profile)
    );
}

export async function addProfile(profile: Profile) {
    const state = await getState();

    if (isProfileExists(state, profile)) return;

    const sanitizedProfile: Profile = {
        ...profile,
        sites: profile.sites.map(s => normalizeDomain(s)),
    };

    if (state.isPremium) {
        state.activeProfiles.push(sanitizedProfile);
    } else {
        if (
            state.activeProfiles.length < LIMITS.FREE.profiles &&
            sanitizedProfile.sites.length <= LIMITS.FREE.sitesPerProfile
        ) {
            state.activeProfiles.push(sanitizedProfile);
        } else {
            console.log("Limite atteinte — passez en Premium pour activer plus de profils");
            return;
        }
    }

    await setState(state);
}

export async function removeProfile(id: string) {
    const state = await getState();
    state.activeProfiles = state.activeProfiles.filter(p => p.id !== id);
    await setState(state);
}

export async function toggleProfile(id: string) {
    const state = await getState();
    const today = todayKey();

    const profile =
        state.activeProfiles.find(p => p.id === id) ??
        state.frozenProfiles.find(p => p.id === id);

    if (!profile) return;

    if (profile.isActive) {
        /* ── DÉSACTIVATION — figer le temps ── */
        profile.frozenSiteMs = {};
        for (const domain of profile.sites) {
            const usage    = state.siteUsage[domain];
            const baseline = profile.baselineUsage[domain];
            if (!usage || !baseline) { profile.frozenSiteMs[domain] = 0; continue; }
            const live = usage.lastDay === today
                ? usage.todayTimeMs + (usage.lastStart ? Date.now() - usage.lastStart : 0)
                : 0;
            profile.frozenSiteMs[domain] = Math.max(0, live - baseline.todayTimeMs);
        }
        profile.isActive = false;

    } else {
        /* ── RÉACTIVATION — reconstruire la baseline ── */
        const newBaseline: Profile["baselineUsage"] = {};
        for (const domain of profile.sites) {
            const usage = state.siteUsage[domain];
            const currentLive = usage?.lastDay === today
                ? usage.todayTimeMs + (usage.lastStart ? Date.now() - usage.lastStart : 0)
                : 0;
            const frozen = profile.frozenSiteMs?.[domain] ?? 0;
            newBaseline[domain] = {
                todayTimeMs: Math.max(0, currentLive - frozen),
                totalTimeMs: usage?.totalTimeMs ?? 0,
                day: today,
            };
        }
        profile.baselineUsage = newBaseline;
        profile.isActive      = true;
        profile.activatedAt   = Date.now();
    }

    await setState(state);
    return profile.isActive;
}

export async function editProfile(
    id:   string,
    data: { name: string; config: ProfileConfig; sites: string[] }
) {
    const state = await getState();
    const today = todayKey();

    const profile =
        state.activeProfiles.find(p => p.id === id) ??
        state.frozenProfiles.find(p => p.id === id);

    if (!profile) throw new Error("Profile not found");

    const newSites = data.sites.filter(site => !profile.sites.includes(site));

    profile.name   = data.name;
    profile.config = data.config;
    profile.sites  = data.sites;

    // Initialiser la baseline des nouveaux sites
    for (const domain of newSites) {
        const normalized = normalizeDomain(domain);
        const usage      = state.siteUsage[normalized];
        profile.baselineUsage[domain] = {
            todayTimeMs: usage?.lastDay === today ? usage.todayTimeMs : 0,
            totalTimeMs: usage?.totalTimeMs ?? 0,
            day: today,
        };
        if (!profile.isActive) {
            profile.frozenSiteMs[domain] = 0;
        }
    }

    await setState(state);
}

export async function getProfileDetails(id: string) {
    const state = await getState();
    return state.activeProfiles.find(p => p.id === id);
}

export async function clearExpiredProfileBlocks() {
    const state = await getState();

    for (const profile of state.activeProfiles) {
        if (!profile.isActive) continue;
        if (profile.config.type === 'interval') continue; // géré par isIntervalActive

        const { usedMs, limitMs } = computeProfileUsage(profile, state.siteUsage);
        if (usedMs < limitMs) {
            await clearProfileRules();
            break;
        }
    }
}