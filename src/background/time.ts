/* =========================================================
   PROFILE TIME LOGIC
========================================================= */

import { Profile, SiteUsage } from "@/lib/types";
import { getProfileTotalTime } from "@/lib/utils";

export const todayKey  = () => new Date().toISOString().slice(0, 10);
export const hourKey   = () => {
    const d = new Date();
    return `${d.toISOString().slice(0, 10)}:${String(d.getHours()).padStart(2, '0')}`;
};

/* ── Retourne la limite en ms selon le type de profil ── */
export function getProfileLimitMs(profile: Profile): number {
    const cfg = profile.config;
    switch (cfg.type) {
        case 'daily':   return cfg.dailyLimit  * 60_000;
        case 'hourly':  return cfg.hourlyLimit * 60_000;
        case 'weekly':  return cfg.weeklyLimit * 60_000;
        case 'interval': return Infinity; // blocage horaire — pas de limite de temps
    }
}

/* ── Vérifie si le profil est actif aujourd'hui (selon les jours configurés) ── */
export function isProfileActiveToday(profile: Profile): boolean {
    const cfg = profile.config;
    if (cfg.type === 'weekly' || cfg.type === 'interval') return true;
    if (!cfg.days || cfg.days.length === 0) return true;
    const today = new Date().getDay() as 0|1|2|3|4|5|6;
    return cfg.days.includes(today);
}

/* ── Vérifie si on est dans une plage horaire configurée (profil horaire) ── */
export function isInTimeRange(profile: Profile): boolean {
    const cfg = profile.config;
    if (cfg.type !== 'hourly') return true;
    if (!cfg.timeRanges || cfg.timeRanges.length === 0) return true;

    const now  = new Date();
    const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    return cfg.timeRanges.some(range => hhmm >= range.start && hhmm <= range.end);
}

/* ── Vérifie si un profil interval est actif maintenant ── */
export function isIntervalActive(profile: Profile): boolean {
    const cfg = profile.config;
    if (cfg.type !== 'interval') return false;

    const now     = new Date();
    const today   = now.getDay() as 0|1|2|3|4|5|6;
    const hhmm    = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    return cfg.rules.some(rule => {
        if (!rule.days.includes(today)) return false;
        if (rule.allDay) return true;
        return hhmm >= rule.startTime && hhmm <= rule.endTime;
    });
}

export const isProfileLimitReached = (
    profile: Profile,
    siteUsage: Record<string, SiteUsage>,
    now = Date.now()
): boolean => {
    if (!profile.isActive || !profile.activatedAt) return false;

    // Profil interval — vérifier les plages, pas le temps
    if (profile.config.type === 'interval') {
        return isIntervalActive(profile);
    }

    // Vérifier si le profil s'applique aujourd'hui
    if (!isProfileActiveToday(profile)) return false;

    // Pour les profils horaires, vérifier la plage horaire
    if (profile.config.type === 'hourly' && !isInTimeRange(profile)) return false;

    const usedMs  = getProfileTotalTime(profile, siteUsage, now);
    const limitMs = getProfileLimitMs(profile);

    return usedMs >= limitMs;
};