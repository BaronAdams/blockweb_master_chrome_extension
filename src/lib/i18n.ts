import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ── common ─────────────────────────────────────────────────────────────────
import commonFr from '../../locales/fr/common.json';
import commonEn from '../../locales/en/common.json';
import commonEs from '../../locales/es/common.json';
import commonDe from '../../locales/de/common.json';
import commonIt from '../../locales/it/common.json';
import commonPt from '../../locales/pt/common.json';
import commonNl from '../../locales/nl/common.json';
import commonPl from '../../locales/pl/common.json';
import commonRu from '../../locales/ru/common.json';
import commonZh from '../../locales/zh/common.json';
import commonJa from '../../locales/ja/common.json';
import commonKo from '../../locales/ko/common.json';
import commonAr from '../../locales/ar/common.json';
import commonHi from '../../locales/hi/common.json';

// ── sidebar ─────────────────────────────────────────────────────────────────
import sidebarFr from '../../locales/fr/sidebar.json';
import sidebarEn from '../../locales/en/sidebar.json';
import sidebarEs from '../../locales/es/sidebar.json';
import sidebarDe from '../../locales/de/sidebar.json';
import sidebarIt from '../../locales/it/sidebar.json';
import sidebarPt from '../../locales/pt/sidebar.json';
import sidebarNl from '../../locales/nl/sidebar.json';
import sidebarPl from '../../locales/pl/sidebar.json';
import sidebarRu from '../../locales/ru/sidebar.json';
import sidebarZh from '../../locales/zh/sidebar.json';
import sidebarJa from '../../locales/ja/sidebar.json';
import sidebarKo from '../../locales/ko/sidebar.json';
import sidebarAr from '../../locales/ar/sidebar.json';
import sidebarHi from '../../locales/hi/sidebar.json';

// ── popup ────────────────────────────────────────────────────────────────────
import popupFr from '../../locales/fr/popup.json';
import popupEn from '../../locales/en/popup.json';
import popupEs from '../../locales/es/popup.json';
import popupDe from '../../locales/de/popup.json';
import popupIt from '../../locales/it/popup.json';
import popupPt from '../../locales/pt/popup.json';
import popupNl from '../../locales/nl/popup.json';
import popupPl from '../../locales/pl/popup.json';
import popupRu from '../../locales/ru/popup.json';
import popupZh from '../../locales/zh/popup.json';
import popupJa from '../../locales/ja/popup.json';
import popupKo from '../../locales/ko/popup.json';
import popupAr from '../../locales/ar/popup.json';
import popupHi from '../../locales/hi/popup.json';

// ── auth ─────────────────────────────────────────────────────────────────────
import authFr from '../../locales/fr/auth.json';
import authEn from '../../locales/en/auth.json';
import authEs from '../../locales/es/auth.json';
import authDe from '../../locales/de/auth.json';
import authIt from '../../locales/it/auth.json';
import authPt from '../../locales/pt/auth.json';
import authNl from '../../locales/nl/auth.json';
import authPl from '../../locales/pl/auth.json';
import authRu from '../../locales/ru/auth.json';
import authZh from '../../locales/zh/auth.json';
import authJa from '../../locales/ja/auth.json';
import authKo from '../../locales/ko/auth.json';
import authAr from '../../locales/ar/auth.json';
import authHi from '../../locales/hi/auth.json';

// ── blocked ──────────────────────────────────────────────────────────────────
import blockedFr from '../../locales/fr/blocked.json';
import blockedEn from '../../locales/en/blocked.json';
import blockedEs from '../../locales/es/blocked.json';
import blockedDe from '../../locales/de/blocked.json';
import blockedIt from '../../locales/it/blocked.json';
import blockedPt from '../../locales/pt/blocked.json';
import blockedNl from '../../locales/nl/blocked.json';
import blockedPl from '../../locales/pl/blocked.json';
import blockedRu from '../../locales/ru/blocked.json';
import blockedZh from '../../locales/zh/blocked.json';
import blockedJa from '../../locales/ja/blocked.json';
import blockedKo from '../../locales/ko/blocked.json';
import blockedAr from '../../locales/ar/blocked.json';
import blockedHi from '../../locales/hi/blocked.json';

// ── analytics ────────────────────────────────────────────────────────────────
import analyticsFr from '../../locales/fr/analytics.json';
import analyticsEn from '../../locales/en/analytics.json';
import analyticsEs from '../../locales/es/analytics.json';
import analyticsDe from '../../locales/de/analytics.json';
import analyticsIt from '../../locales/it/analytics.json';
import analyticsPt from '../../locales/pt/analytics.json';
import analyticsNl from '../../locales/nl/analytics.json';
import analyticsPl from '../../locales/pl/analytics.json';
import analyticsRu from '../../locales/ru/analytics.json';
import analyticsZh from '../../locales/zh/analytics.json';
import analyticsJa from '../../locales/ja/analytics.json';
import analyticsKo from '../../locales/ko/analytics.json';
import analyticsAr from '../../locales/ar/analytics.json';
import analyticsHi from '../../locales/hi/analytics.json';

// ── blockLists ───────────────────────────────────────────────────────────────
import blockListsFr from '../../locales/fr/blockLists.json';
import blockListsEn from '../../locales/en/blockLists.json';
import blockListsEs from '../../locales/es/blockLists.json';
import blockListsDe from '../../locales/de/blockLists.json';
import blockListsIt from '../../locales/it/blockLists.json';
import blockListsPt from '../../locales/pt/blockLists.json';
import blockListsNl from '../../locales/nl/blockLists.json';
import blockListsPl from '../../locales/pl/blockLists.json';
import blockListsRu from '../../locales/ru/blockLists.json';
import blockListsZh from '../../locales/zh/blockLists.json';
import blockListsJa from '../../locales/ja/blockLists.json';
import blockListsKo from '../../locales/ko/blockLists.json';
import blockListsAr from '../../locales/ar/blockLists.json';
import blockListsHi from '../../locales/hi/blockLists.json';

// ── profiles ─────────────────────────────────────────────────────────────────
import profilesFr from '../../locales/fr/profiles.json';
import profilesEn from '../../locales/en/profiles.json';
import profilesEs from '../../locales/es/profiles.json';
import profilesDe from '../../locales/de/profiles.json';
import profilesIt from '../../locales/it/profiles.json';
import profilesPt from '../../locales/pt/profiles.json';
import profilesNl from '../../locales/nl/profiles.json';
import profilesPl from '../../locales/pl/profiles.json';
import profilesRu from '../../locales/ru/profiles.json';
import profilesZh from '../../locales/zh/profiles.json';
import profilesJa from '../../locales/ja/profiles.json';
import profilesKo from '../../locales/ko/profiles.json';
import profilesAr from '../../locales/ar/profiles.json';
import profilesHi from '../../locales/hi/profiles.json';

// ── strictMode ───────────────────────────────────────────────────────────────
import strictModeFr from '../../locales/fr/strictMode.json';
import strictModeEn from '../../locales/en/strictMode.json';
import strictModeEs from '../../locales/es/strictMode.json';
import strictModeDe from '../../locales/de/strictMode.json';
import strictModeIt from '../../locales/it/strictMode.json';
import strictModePt from '../../locales/pt/strictMode.json';
import strictModeNl from '../../locales/nl/strictMode.json';
import strictModePl from '../../locales/pl/strictMode.json';
import strictModeRu from '../../locales/ru/strictMode.json';
import strictModeZh from '../../locales/zh/strictMode.json';
import strictModeJa from '../../locales/ja/strictMode.json';
import strictModeKo from '../../locales/ko/strictMode.json';
import strictModeAr from '../../locales/ar/strictMode.json';
import strictModeHi from '../../locales/hi/strictMode.json';

// ── account ──────────────────────────────────────────────────────────────────
import accountFr from '../../locales/fr/account.json';
import accountEn from '../../locales/en/account.json';
import accountEs from '../../locales/es/account.json';
import accountDe from '../../locales/de/account.json';
import accountIt from '../../locales/it/account.json';
import accountPt from '../../locales/pt/account.json';
import accountNl from '../../locales/nl/account.json';
import accountPl from '../../locales/pl/account.json';
import accountRu from '../../locales/ru/account.json';
import accountZh from '../../locales/zh/account.json';
import accountJa from '../../locales/ja/account.json';
import accountKo from '../../locales/ko/account.json';
import accountAr from '../../locales/ar/account.json';
import accountHi from '../../locales/hi/account.json';

// ── pricing ──────────────────────────────────────────────────────────────────
import pricingFr from '../../locales/fr/pricing.json';
import pricingEn from '../../locales/en/pricing.json';
import pricingEs from '../../locales/es/pricing.json';
import pricingDe from '../../locales/de/pricing.json';
import pricingIt from '../../locales/it/pricing.json';
import pricingPt from '../../locales/pt/pricing.json';
import pricingNl from '../../locales/nl/pricing.json';
import pricingPl from '../../locales/pl/pricing.json';
import pricingRu from '../../locales/ru/pricing.json';
import pricingZh from '../../locales/zh/pricing.json';
import pricingJa from '../../locales/ja/pricing.json';
import pricingKo from '../../locales/ko/pricing.json';
import pricingAr from '../../locales/ar/pricing.json';
import pricingHi from '../../locales/hi/pricing.json';

// ── Types ─────────────────────────────────────────────────────────────────────
export type Locale = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'pl' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';
export const SUPPORTED_LOCALES: Locale[] = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'];

function detectLocale(): Locale {
    const lang = (navigator.language ?? 'en').toLowerCase().slice(0, 2);
    const map: Record<string, Locale> = {
        fr: 'fr', en: 'en', es: 'es', de: 'de', it: 'it',
        pt: 'pt', nl: 'nl', pl: 'pl', ru: 'ru', zh: 'zh',
        ja: 'ja', ko: 'ko', ar: 'ar', hi: 'hi',
    };
    return map[lang] ?? 'en';
}

// ── Initialize ────────────────────────────────────────────────────────────────
i18n.use(initReactI18next).init({
    lng: detectLocale(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    resources: {
        fr: { common: commonFr, sidebar: sidebarFr, popup: popupFr, auth: authFr, blocked: blockedFr, analytics: analyticsFr, blockLists: blockListsFr, profiles: profilesFr, strictMode: strictModeFr, account: accountFr, pricing: pricingFr },
        en: { common: commonEn, sidebar: sidebarEn, popup: popupEn, auth: authEn, blocked: blockedEn, analytics: analyticsEn, blockLists: blockListsEn, profiles: profilesEn, strictMode: strictModeEn, account: accountEn, pricing: pricingEn },
        es: { common: commonEs, sidebar: sidebarEs, popup: popupEs, auth: authEs, blocked: blockedEs, analytics: analyticsEs, blockLists: blockListsEs, profiles: profilesEs, strictMode: strictModeEs, account: accountEs, pricing: pricingEs },
        de: { common: commonDe, sidebar: sidebarDe, popup: popupDe, auth: authDe, blocked: blockedDe, analytics: analyticsDe, blockLists: blockListsDe, profiles: profilesDe, strictMode: strictModeDe, account: accountDe, pricing: pricingDe },
        it: { common: commonIt, sidebar: sidebarIt, popup: popupIt, auth: authIt, blocked: blockedIt, analytics: analyticsIt, blockLists: blockListsIt, profiles: profilesIt, strictMode: strictModeIt, account: accountIt, pricing: pricingIt },
        pt: { common: commonPt, sidebar: sidebarPt, popup: popupPt, auth: authPt, blocked: blockedPt, analytics: analyticsPt, blockLists: blockListsPt, profiles: profilesPt, strictMode: strictModePt, account: accountPt, pricing: pricingPt },
        nl: { common: commonNl, sidebar: sidebarNl, popup: popupNl, auth: authNl, blocked: blockedNl, analytics: analyticsNl, blockLists: blockListsNl, profiles: profilesNl, strictMode: strictModeNl, account: accountNl, pricing: pricingNl },
        pl: { common: commonPl, sidebar: sidebarPl, popup: popupPl, auth: authPl, blocked: blockedPl, analytics: analyticsPl, blockLists: blockListsPl, profiles: profilesPl, strictMode: strictModePl, account: accountPl, pricing: pricingPl },
        ru: { common: commonRu, sidebar: sidebarRu, popup: popupRu, auth: authRu, blocked: blockedRu, analytics: analyticsRu, blockLists: blockListsRu, profiles: profilesRu, strictMode: strictModeRu, account: accountRu, pricing: pricingRu },
        zh: { common: commonZh, sidebar: sidebarZh, popup: popupZh, auth: authZh, blocked: blockedZh, analytics: analyticsZh, blockLists: blockListsZh, profiles: profilesZh, strictMode: strictModeZh, account: accountZh, pricing: pricingZh },
        ja: { common: commonJa, sidebar: sidebarJa, popup: popupJa, auth: authJa, blocked: blockedJa, analytics: analyticsJa, blockLists: blockListsJa, profiles: profilesJa, strictMode: strictModeJa, account: accountJa, pricing: pricingJa },
        ko: { common: commonKo, sidebar: sidebarKo, popup: popupKo, auth: authKo, blocked: blockedKo, analytics: analyticsKo, blockLists: blockListsKo, profiles: profilesKo, strictMode: strictModeKo, account: accountKo, pricing: pricingKo },
        ar: { common: commonAr, sidebar: sidebarAr, popup: popupAr, auth: authAr, blocked: blockedAr, analytics: analyticsAr, blockLists: blockListsAr, profiles: profilesAr, strictMode: strictModeAr, account: accountAr, pricing: pricingAr },
        hi: { common: commonHi, sidebar: sidebarHi, popup: popupHi, auth: authHi, blocked: blockedHi, analytics: analyticsHi, blockLists: blockListsHi, profiles: profilesHi, strictMode: strictModeHi, account: accountHi, pricing: pricingHi },
    },
});

export default i18n;

// ── Compatibility helpers ─────────────────────────────────────────────────────

/** Current locale — replaces the old getLocale() */
export function getLocale(): Locale {
    return (i18n.language as Locale) ?? 'en';
}

/**
 * Non-hook translator for module-level usage (outside React components).
 * Usage:  const t = getT('popup');  t('key', { var: value })
 */
export function getT(namespace: string) {
    return function t(key: string, vars?: Record<string, unknown>): string {
        return i18n.t(key, { ns: namespace, ...(vars ?? {}) }) as string;
    };
}
