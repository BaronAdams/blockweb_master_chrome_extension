// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthState = {
  isAuthenticated: boolean;
  userId: string | null;
  userName: string | null;
  email: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastSyncAt: number | null;
};

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionPlan = "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME";

export type SubscriptionState = {
  plan: SubscriptionPlan;
  expiresAt: number | null;
  graceUntil: number | null;
  isValid: boolean;
  expiresSoon: boolean;
  lastExpiryNoticeAt: number | null;
};

// ─── Usage ────────────────────────────────────────────────────────────────────

export type SiteUsage = {
  domain:      string;
  totalTimeMs: number;
  todayTimeMs: number;
  lastStart:   number | null;
  lastDay:     string; // YYYY-MM-DD
  /** Historique des 30 derniers jours : { 'YYYY-MM-DD': timeMs } */
  history:     Record<string, number>;
};

// ─── Profile configs ──────────────────────────────────────────────────────────

export type ProfileType = "daily" | "hourly" | "weekly" | "interval";

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dim, 1=Lun … 6=Sam

/** Plage horaire HH:MM–HH:MM */
export type TimeRange = {
  start: string; // "HH:MM"
  end:   string; // "HH:MM"
};

/** Limite le temps total par jour */
export type DailyProfile = {
  type:       "daily";
  dailyLimit: number;      // minutes
  days?:      WeekDay[];   // jours d'application (vide = tous les jours)
};

/** Limite le temps par heure (reset à chaque heure pile) */
export type HourlyProfile = {
  type:         "hourly";
  hourlyLimit:  number;        // minutes par heure (1–59)
  days?:        WeekDay[];     // jours d'application (vide = tous les jours)
  timeRanges?:  TimeRange[];   // plages horaires d'application (vide = toute la journée)
};

/** Limite le temps total par semaine (reset chaque lundi à minuit) */
export type WeeklyProfile = {
  type:         "weekly";
  weeklyLimit:  number; // minutes par semaine (max 10079 = 167h59)
};

/** Bloque complètement les sites sur des plages horaires définies */
export type IntervalRule = {
  days:      WeekDay[]; // 0=Dim, 1=Lun … 6=Sam
  startTime: string;    // "HH:MM"
  endTime:   string;    // "HH:MM"
  allDay?:   boolean;   // true = 00:00–23:59 (raccourci UI)
};

export type IntervalProfile = {
  type:  "interval";
  rules: IntervalRule[];
};

export type ProfileConfig =
  | DailyProfile
  | HourlyProfile
  | WeeklyProfile
  | IntervalProfile;

// ─── Profile ──────────────────────────────────────────────────────────────────

export type Profile = {
  id:          string;
  name:        string;
  sites:       string[];
  isActive:    boolean;
  activatedAt: number | null;
  config:      ProfileConfig;

  // Snapshot du tracking global au moment de l'activation
  baselineUsage: Record<string, {
    todayTimeMs: number;
    totalTimeMs: number;
    day: string;
  }>;

  // Snapshot figé au moment de la désactivation
  frozenSiteMs: Record<string, number>;

  // "YYYY-MM-DD:HH" — uniquement pour les profils "hourly"
  baselineHourKey: string | null;

  // "YYYY:WNN" — uniquement pour les profils "weekly"
  baselineWeekKey: string | null;
};

// ─── Extension State ──────────────────────────────────────────────────────────

export type State = {
  auth:         AuthState;
  subscription: SubscriptionState;

  isPremium: boolean;

  activeBlockedDomains:  string[];
  frozenBlockedDomains:  string[];
  activeBlockedKeywords: string[];
  frozenBlockedKeywords: string[];

  activeProfiles: Profile[];
  frozenProfiles: Profile[];
  whitelist:      string[];
  customRedirectUrl: string;

  adultContentBlocked: boolean;
  strictModeUntil:     number | null;
  strictDefaultTime:   number;
  // strictPinHash:       string | null;  // SHA-256 du PIN en hex — jamais le PIN en clair

  siteUsage: Record<string, SiteUsage>;
  /** Temps total de navigation par jour (tous sites) : { 'YYYY-MM-DD': totalMs } */
  usageHistory: Record<string, number>;
  /**
   * Domaines détectés comme adultes par le content script (analyse de contenu),
   * indépendamment de l'activation du blocage adulte.
   * Permet de classifier ces sites dans Analytics même si l'utilisateur n'a pas
   * activé le blocage.
   */
  detectedAdultDomains: string[];
};