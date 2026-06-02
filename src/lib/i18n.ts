import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ── common ─────────────────────────────────────────────────────────────────
import commonFr from '../../_locales/fr/common.json';
import commonEn from '../../_locales/en/common.json';
import commonEs from '../../_locales/es/common.json';
import commonDe from '../../_locales/de/common.json';
import commonIt from '../../_locales/it/common.json';
import commonPt from '../../_locales/pt/common.json';
import commonNl from '../../_locales/nl/common.json';
import commonPl from '../../_locales/pl/common.json';
import commonRu from '../../_locales/ru/common.json';
import commonZh from '../../_locales/zh/common.json';
import commonJa from '../../_locales/ja/common.json';
import commonKo from '../../_locales/ko/common.json';
import commonAr from '../../_locales/ar/common.json';
import commonHi from '../../_locales/hi/common.json';

// ── sidebar ─────────────────────────────────────────────────────────────────
import sidebarFr from '../../_locales/fr/sidebar.json';
import sidebarEn from '../../_locales/en/sidebar.json';
import sidebarEs from '../../_locales/es/sidebar.json';
import sidebarDe from '../../_locales/de/sidebar.json';
import sidebarIt from '../../_locales/it/sidebar.json';
import sidebarPt from '../../_locales/pt/sidebar.json';
import sidebarNl from '../../_locales/nl/sidebar.json';
import sidebarPl from '../../_locales/pl/sidebar.json';
import sidebarRu from '../../_locales/ru/sidebar.json';
import sidebarZh from '../../_locales/zh/sidebar.json';
import sidebarJa from '../../_locales/ja/sidebar.json';
import sidebarKo from '../../_locales/ko/sidebar.json';
import sidebarAr from '../../_locales/ar/sidebar.json';
import sidebarHi from '../../_locales/hi/sidebar.json';

// ── popup ────────────────────────────────────────────────────────────────────
import popupFr from '../../_locales/fr/popup.json';
import popupEn from '../../_locales/en/popup.json';
import popupEs from '../../_locales/es/popup.json';
import popupDe from '../../_locales/de/popup.json';
import popupIt from '../../_locales/it/popup.json';
import popupPt from '../../_locales/pt/popup.json';
import popupNl from '../../_locales/nl/popup.json';
import popupPl from '../../_locales/pl/popup.json';
import popupRu from '../../_locales/ru/popup.json';
import popupZh from '../../_locales/zh/popup.json';
import popupJa from '../../_locales/ja/popup.json';
import popupKo from '../../_locales/ko/popup.json';
import popupAr from '../../_locales/ar/popup.json';
import popupHi from '../../_locales/hi/popup.json';

// ── auth ─────────────────────────────────────────────────────────────────────
import authFr from '../../_locales/fr/auth.json';
import authEn from '../../_locales/en/auth.json';
import authEs from '../../_locales/es/auth.json';
import authDe from '../../_locales/de/auth.json';
import authIt from '../../_locales/it/auth.json';
import authPt from '../../_locales/pt/auth.json';
import authNl from '../../_locales/nl/auth.json';
import authPl from '../../_locales/pl/auth.json';
import authRu from '../../_locales/ru/auth.json';
import authZh from '../../_locales/zh/auth.json';
import authJa from '../../_locales/ja/auth.json';
import authKo from '../../_locales/ko/auth.json';
import authAr from '../../_locales/ar/auth.json';
import authHi from '../../_locales/hi/auth.json';

// ── blocked ──────────────────────────────────────────────────────────────────
import blockedFr from '../../_locales/fr/blocked.json';
import blockedEn from '../../_locales/en/blocked.json';
import blockedEs from '../../_locales/es/blocked.json';
import blockedDe from '../../_locales/de/blocked.json';
import blockedIt from '../../_locales/it/blocked.json';
import blockedPt from '../../_locales/pt/blocked.json';
import blockedNl from '../../_locales/nl/blocked.json';
import blockedPl from '../../_locales/pl/blocked.json';
import blockedRu from '../../_locales/ru/blocked.json';
import blockedZh from '../../_locales/zh/blocked.json';
import blockedJa from '../../_locales/ja/blocked.json';
import blockedKo from '../../_locales/ko/blocked.json';
import blockedAr from '../../_locales/ar/blocked.json';
import blockedHi from '../../_locales/hi/blocked.json';

// ── analytics ────────────────────────────────────────────────────────────────
import analyticsFr from '../../_locales/fr/analytics.json';
import analyticsEn from '../../_locales/en/analytics.json';
import analyticsEs from '../../_locales/es/analytics.json';
import analyticsDe from '../../_locales/de/analytics.json';
import analyticsIt from '../../_locales/it/analytics.json';
import analyticsPt from '../../_locales/pt/analytics.json';
import analyticsNl from '../../_locales/nl/analytics.json';
import analyticsPl from '../../_locales/pl/analytics.json';
import analyticsRu from '../../_locales/ru/analytics.json';
import analyticsZh from '../../_locales/zh/analytics.json';
import analyticsJa from '../../_locales/ja/analytics.json';
import analyticsKo from '../../_locales/ko/analytics.json';
import analyticsAr from '../../_locales/ar/analytics.json';
import analyticsHi from '../../_locales/hi/analytics.json';

// ── blockLists ───────────────────────────────────────────────────────────────
import blockListsFr from '../../_locales/fr/blockLists.json';
import blockListsEn from '../../_locales/en/blockLists.json';
import blockListsEs from '../../_locales/es/blockLists.json';
import blockListsDe from '../../_locales/de/blockLists.json';
import blockListsIt from '../../_locales/it/blockLists.json';
import blockListsPt from '../../_locales/pt/blockLists.json';
import blockListsNl from '../../_locales/nl/blockLists.json';
import blockListsPl from '../../_locales/pl/blockLists.json';
import blockListsRu from '../../_locales/ru/blockLists.json';
import blockListsZh from '../../_locales/zh/blockLists.json';
import blockListsJa from '../../_locales/ja/blockLists.json';
import blockListsKo from '../../_locales/ko/blockLists.json';
import blockListsAr from '../../_locales/ar/blockLists.json';
import blockListsHi from '../../_locales/hi/blockLists.json';

// ── profiles ─────────────────────────────────────────────────────────────────
import profilesFr from '../../_locales/fr/profiles.json';
import profilesEn from '../../_locales/en/profiles.json';
import profilesEs from '../../_locales/es/profiles.json';
import profilesDe from '../../_locales/de/profiles.json';
import profilesIt from '../../_locales/it/profiles.json';
import profilesPt from '../../_locales/pt/profiles.json';
import profilesNl from '../../_locales/nl/profiles.json';
import profilesPl from '../../_locales/pl/profiles.json';
import profilesRu from '../../_locales/ru/profiles.json';
import profilesZh from '../../_locales/zh/profiles.json';
import profilesJa from '../../_locales/ja/profiles.json';
import profilesKo from '../../_locales/ko/profiles.json';
import profilesAr from '../../_locales/ar/profiles.json';
import profilesHi from '../../_locales/hi/profiles.json';

// ── strictMode ───────────────────────────────────────────────────────────────
import strictModeFr from '../../_locales/fr/strictMode.json';
import strictModeEn from '../../_locales/en/strictMode.json';
import strictModeEs from '../../_locales/es/strictMode.json';
import strictModeDe from '../../_locales/de/strictMode.json';
import strictModeIt from '../../_locales/it/strictMode.json';
import strictModePt from '../../_locales/pt/strictMode.json';
import strictModeNl from '../../_locales/nl/strictMode.json';
import strictModePl from '../../_locales/pl/strictMode.json';
import strictModeRu from '../../_locales/ru/strictMode.json';
import strictModeZh from '../../_locales/zh/strictMode.json';
import strictModeJa from '../../_locales/ja/strictMode.json';
import strictModeKo from '../../_locales/ko/strictMode.json';
import strictModeAr from '../../_locales/ar/strictMode.json';
import strictModeHi from '../../_locales/hi/strictMode.json';

// ── account ──────────────────────────────────────────────────────────────────
import accountFr from '../../_locales/fr/account.json';
import accountEn from '../../_locales/en/account.json';
import accountEs from '../../_locales/es/account.json';
import accountDe from '../../_locales/de/account.json';
import accountIt from '../../_locales/it/account.json';
import accountPt from '../../_locales/pt/account.json';
import accountNl from '../../_locales/nl/account.json';
import accountPl from '../../_locales/pl/account.json';
import accountRu from '../../_locales/ru/account.json';
import accountZh from '../../_locales/zh/account.json';
import accountJa from '../../_locales/ja/account.json';
import accountKo from '../../_locales/ko/account.json';
import accountAr from '../../_locales/ar/account.json';
import accountHi from '../../_locales/hi/account.json';

// ── pricing ──────────────────────────────────────────────────────────────────
import pricingFr from '../../_locales/fr/pricing.json';
import pricingEn from '../../_locales/en/pricing.json';
import pricingEs from '../../_locales/es/pricing.json';
import pricingDe from '../../_locales/de/pricing.json';
import pricingIt from '../../_locales/it/pricing.json';
import pricingPt from '../../_locales/pt/pricing.json';
import pricingNl from '../../_locales/nl/pricing.json';
import pricingPl from '../../_locales/pl/pricing.json';
import pricingRu from '../../_locales/ru/pricing.json';
import pricingZh from '../../_locales/zh/pricing.json';
import pricingJa from '../../_locales/ja/pricing.json';
import pricingKo from '../../_locales/ko/pricing.json';
import pricingAr from '../../_locales/ar/pricing.json';
import pricingHi from '../../_locales/hi/pricing.json';

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
