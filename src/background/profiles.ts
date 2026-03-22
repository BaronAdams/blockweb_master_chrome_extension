import { Profile, ProfileConfig, State } from "@/lib/types";
import { getState, setState } from "./storage";
import { LIMITS } from "@/lib/constants";
import { computeProfileUsage, normalizeDomain, domainMatchesSite } from "@/lib/utils";
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
        /* ── DÉSACTIVATION — figer le temps (sous-domaines inclus) ── */
        profile.frozenSiteMs = {};
        for (const domain of profile.sites) {
            // Agréger tous les sous-domaines trackés pour ce site
            const matchingKeys = Object.keys(state.siteUsage).filter(d => domainMatchesSite(d, domain));
            let totalFrozen = 0;
            for (const key of matchingKeys) {
                const usage    = state.siteUsage[key];
                const baseline = profile.baselineUsage[key] ?? profile.baselineUsage[domain];
                if (!usage || !baseline) continue;
                const live = usage.lastDay === today
                    ? usage.todayTimeMs + (usage.lastStart ? Date.now() - usage.lastStart : 0)
                    : 0;
                totalFrozen += Math.max(0, live - baseline.todayTimeMs);
            }
            profile.frozenSiteMs[domain] = totalFrozen;
        }
        profile.isActive = false;

    } else {
        /* ── RÉACTIVATION — reconstruire la baseline (sous-domaines inclus) ── */
        const newBaseline: Profile["baselineUsage"] = {};
        for (const domain of profile.sites) {
            const frozen       = profile.frozenSiteMs?.[domain] ?? 0;
            const matchingKeys = Object.keys(state.siteUsage).filter(d => domainMatchesSite(d, domain));

            if (matchingKeys.length === 0) {
                newBaseline[domain] = { todayTimeMs: 0, totalTimeMs: 0, day: today };
                continue;
            }

            // Calculer le live total de tous les sous-domaines
            const totalLive = matchingKeys.reduce((sum, key) => {
                const u = state.siteUsage[key];
                if (u?.lastDay !== today) return sum;
                return sum + u.todayTimeMs + (u.lastStart ? Date.now() - u.lastStart : 0);
            }, 0);

            // Distribuer le frozen proportionnellement
            for (const key of matchingKeys) {
                const usage       = state.siteUsage[key];
                const currentLive = usage?.lastDay === today
                    ? usage.todayTimeMs + (usage.lastStart ? Date.now() - usage.lastStart : 0)
                    : 0;
                const ratio       = totalLive > 0 ? currentLive / totalLive : 1 / matchingKeys.length;
                const frozenShare = Math.round(frozen * ratio);
                newBaseline[key]  = {
                    todayTimeMs: Math.max(0, currentLive - frozenShare),
                    totalTimeMs: usage?.totalTimeMs ?? 0,
                    day: today,
                };
            }
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