import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import frMessages from '../../_locales/fr/messages.json';
import enMessages from '../../_locales/en/messages.json';
import esMessages from '../../_locales/es/messages.json';
import deMessages from '../../_locales/de/messages.json';
import itMessages from '../../_locales/it/messages.json';
import ptMessages from '../../_locales/pt/messages.json';
import nlMessages from '../../_locales/nl/messages.json';
import plMessages from '../../_locales/pl/messages.json';
import ruMessages from '../../_locales/ru/messages.json';
import zhMessages from '../../_locales/zh/messages.json';
import jaMessages from '../../_locales/ja/messages.json';
import koMessages from '../../_locales/ko/messages.json';
import arMessages from '../../_locales/ar/messages.json';
import hiMessages from '../../_locales/hi/messages.json';

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

i18n.use(initReactI18next).init({
    lng: detectLocale(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    resources: {
        fr: frMessages,
        en: enMessages,
        es: esMessages,
        de: deMessages,
        it: itMessages,
        pt: ptMessages,
        nl: nlMessages,
        pl: plMessages,
        ru: ruMessages,
        zh: zhMessages,
        ja: jaMessages,
        ko: koMessages,
        ar: arMessages,
        hi: hiMessages,
    },
});

export default i18n;

export function getLocale(): Locale {
    return (i18n.language as Locale) ?? 'en';
}

export function getT(namespace: string) {
    return function t(key: string, vars?: Record<string, unknown>): string {
        return i18n.t(key, { ns: namespace, ...(vars ?? {}) }) as string;
    };
}
