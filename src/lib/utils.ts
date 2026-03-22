import { Profile, SiteUsage } from "./types";
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRemainingTime = (strictModeUntilMs: number) => {
    const nowMs = Date.now();
    const diffMs = Math.max(0, strictModeUntilMs - nowMs);
    const totalSeconds = Math.floor(diffMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);
    return { diffMs, days, hours, minutes, seconds };
}

export const getDetailsTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);
    return { days, hours, minutes, seconds };
}

export function sendToBackground<T = any>(message: any): Promise<T> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}

export const formatDuration = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export function getLiveTodayTime(
  usage?: SiteUsage,
  now: number = Date.now(),
) {
  if (!usage) return 0;
  if (usage.lastDay !== todayKey()) return 0;
  // Inclure toujours le temps en cours (lastStart) si présent.
  // Avant, on exigeait activeDomain === usage.domain, ce qui faisait
  // que le temps live entre deux flushes était ignoré dans getProfileSiteTime
  // et dans isProfileLimitReached → la limite n'était jamais atteinte en temps réel.
  if (usage.lastStart && usage.lastStart > 0) {
    const live = now - usage.lastStart;
    // Ignorer les valeurs aberrantes (> 8h = SW probablement tué)
    if (live > 0 && live < 8 * 60 * 60 * 1000) {
      return usage.todayTimeMs + live;
    }
  }
  return usage.todayTimeMs;
}

export const getProfileSiteTime = (
  profile: Profile,
  domain: string,
  siteUsage: Record<string, SiteUsage>,
  now = Date.now()
): number => {
  if (!profile.isActive) {
    // Profil inactif : sommer tous les sous-domaines figés qui correspondent
    return Object.entries(profile.frozenSiteMs ?? {})
      .filter(([d]) => domainMatchesSite(d, domain))
      .reduce((sum, [, ms]) => sum + ms, 0);
  }

  const today = todayKey();

  // Sommer tous les sous-domaines trackés qui correspondent au domaine du profil
  // Ex: profile.sites = ['youtube.com'] → additionne youtube.com + music.youtube.com + ...
  const matchingKeys = Object.keys(siteUsage).filter(d => domainMatchesSite(d, domain));

  let total = 0;
  for (const key of matchingKeys) {
    const usage    = siteUsage[key];
    const baseline = profile.baselineUsage[key] ?? profile.baselineUsage[domain];
    if (!usage) continue;

    const live = getLiveTodayTime(usage, now);

    if (!baseline || baseline.day !== today) {
      // Pas de baseline ou baseline obsolète → tout le temps d'aujourd'hui compte
      total += live;
    } else {
      total += Math.max(0, live - baseline.todayTimeMs);
    }
  }
  return total;
};

export const getProfileTotalTime = (
  profile: Profile,
  siteUsage: Record<string, SiteUsage>,
  now = Date.now()
): number => {
  if (!profile.isActive) {
    return Object.values(profile.frozenSiteMs ?? {}).reduce((a, b) => a + b, 0);
  }
  if (!profile.activatedAt) return 0;
  let total = 0;
  for (const domain of profile.sites) {
    total += getProfileSiteTime(profile, domain, siteUsage, now);
  }
  return total;
};

/* ── Retourne la limite en ms depuis profile.config ── */
export function getProfileLimitMs(profile: Profile): number {
  const cfg = profile.config;
  switch (cfg.type) {
    case 'daily':    return cfg.dailyLimit  * 60_000;
    case 'hourly':   return cfg.hourlyLimit * 60_000;
    case 'weekly':   return cfg.weeklyLimit * 60_000;
    case 'interval': return Infinity;
  }
}

export const computeProfileUsage = (
  profile: Profile,
  siteUsage: Record<string, SiteUsage>,
  now = Date.now()
) => {
  const limitMs = getProfileLimitMs(profile);

  if (!profile.isActive) {
    return { usedMs: 0, limitMs };
  }

  let total = 0;
  for (const site of profile.sites) {
    total += getProfileSiteTime(profile, site, siteUsage, now);
  }
  return { usedMs: total, limitMs };
};

export function normalizeDomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
}

/**
 * Vérifie si un domaine visité correspond à un site configuré dans un profil,
 * en tenant compte des sous-domaines.
 *
 * Exemples :
 *   domainMatchesSite('music.youtube.com', 'youtube.com') → true
 *   domainMatchesSite('youtube.com',       'youtube.com') → true
 *   domainMatchesSite('notoutube.com',     'youtube.com') → false
 *   domainMatchesSite('www.youtube.com',   'youtube.com') → true  (www déjà retiré par normalizeDomain)
 */
export function domainMatchesSite(visitedDomain: string, profileSite: string): boolean {
  const v = normalizeDomain(visitedDomain);
  const s = normalizeDomain(profileSite);
  return v === s || v.endsWith('.' + s);
}

/**
 * Retourne le site configuré dans le profil qui correspond au domaine visité,
 * ou null si aucun ne correspond.
 */
export function matchingProfileSite(
  visitedDomain: string,
  profileSites:  string[]
): string | null {
  return profileSites.find(site => domainMatchesSite(visitedDomain, site)) ?? null;
}

export function isValidUrl(input: string): boolean {
  try {
    const url = input.startsWith("http://") || input.startsWith("https://")
      ? input
      : `https://${input}`;
    const parsed = new URL(url);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}