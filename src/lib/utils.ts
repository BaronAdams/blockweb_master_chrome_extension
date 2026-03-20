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
  activeDomain: string | null = null
) {
  if (!usage) return 0;
  if (usage.lastDay !== todayKey()) return 0;
  if (usage.lastStart && activeDomain === usage.domain) {
    return usage.todayTimeMs + (now - usage.lastStart);
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
    return profile.frozenSiteMs?.[domain] ?? 0;
  }
  const usage    = siteUsage[domain];
  const baseline = profile.baselineUsage[domain];
  if (!usage || !baseline) return 0;

  const today = todayKey();
  const live  = getLiveTodayTime(usage, now);

  // Si la baseline vient d'un jour précédent, le delta repart de 0 aujourd'hui.
  // Cela évite d'afficher le temps accumulé hier au début d'une nouvelle journée
  // si l'alarm daily-reset n'a pas encore tourné (navigateur fermé à minuit etc.)
  if (baseline.day !== today) {
    return live; // toute la session d'aujourd'hui compte depuis 0
  }

  return Math.max(0, live - baseline.todayTimeMs);
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