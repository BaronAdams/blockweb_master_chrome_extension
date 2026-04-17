import { getT } from "./i18n"

// Définition des limites
export const LIMITS = {
    FREE: {
        domains: 3,
        keywords: 3,
        profiles: 1,
        sitesPerProfile: 3,
        maxTime: 60,
        maxStrictDuration: 24 * 60 * 60 * 1000 // 24h en ms
    },
    PREMIUM: {
        domains: Infinity,
        keywords: Infinity,
        profiles: Infinity,
        sitesPerProfile: Infinity,
        maxTime: 1440,
        maxStrictDuration: 30 * 24 * 60 * 60 * 1000 // 30 jours en ms
    }
}

// Liste complète des domaines adultes prédéfinis
export const PREDEFINED_ADULT_DOMAINS: string[] = [
    // Plateformes principales
    "xvideos.com",
    "hotebonytube.com",
    "mat6tube.com",
    "playvids.com",
    "wow.xxx",
    "xhand.net",
    "thumbzilla.com",
    "ebonygalore.com",
    "analdin.com",
    "xozilla.com",
    "upornia.com",
    "mylust.com",
    "xbabe.com",
    "pornhub.com",
    "redtube.com",
    "youporn.com",
    "tube8.com",
    "xnxx.com",
    "xhamster.com",
    "spankwire.com",
    "extremetube.com",
    "tnaflix.com",
    "eporner.com",
    "beeg.com",
    "hardsextube.com",
    "porntube.com",
    "sunporno.com",
    "vporn.com",
    "slutload.com",
    "drtuber.com",
    "fucktube.com",
    "movporn.com",
    "pornoxo.com",
    "cliphunter.com",
    // Webcams
    "livejasmine.com",
    "camsoda.com",
    "flirt4free.com",
    "cam4.com",
    "chaturbate.com",
    "myfreecams.com",
    "stripchat.com",
    "bongacams.com",
    "cam.org",
    "jerkmate.com",
]

/* =========================================================
   SITE CATEGORIES
   ─────────────────────────────────────────────────────────
   Utilisé dans Analytics pour classifier le temps de navigation.
   Les domaines sont comparés via domainMatchesSite() →
   un sous-domaine matche son domaine parent.

   Ajoute ici les domaines que tu veux classer.
   Ordre de priorité (premier match gagne) :
     Adulte > Distraction > Divertissement > Productivité > Autre
========================================================= */

export const SITE_CATEGORIES = {

    /** Réseaux sociaux & contenus chronophages */
    distraction: [
        'facebook.com',
        'instagram.com',
        'tiktok.com',
        'twitter.com',
        'x.com',
        'snapchat.com',
        'reddit.com',
        'pinterest.com',
        'linkedin.com',
        'tumblr.com',
        'discord.com',
        'telegram.org',
        'whatsapp.com',
        'messenger.com',
        'threads.net',
        'bereal.com',
        'vk.com',
        'weibo.com',
        'quora.com',
        '9gag.com',
        'buzzfeed.com',
        'dailymotion.com',
    ],

    /** Divertissement passif */
    entertainment: [
        'youtube.com',
        'netflix.com',
        'twitch.tv',
        'spotify.com',
        'deezer.com',
        'disneyplus.com',
        'primevideo.com',
        'hulu.com',
        'hbomax.com',
        'max.com',
        'appletv.apple.com',
        'crunchyroll.com',
        'soundcloud.com',
        'vimeo.com',
        'kick.com',
        'bilibili.com',
        'pandora.com',
        'iheart.com',
        'twitch.tv',
        'mixer.com',
        'peacocktv.com',
        'paramountplus.com',
        'gaming.youtube.com',
    ],

    /** Travail & productivité */
    productivity: [
        'github.com',
        'gitlab.com',
        'bitbucket.org',
        'notion.so',
        'figma.com',
        'stackoverflow.com',
        'docs.google.com',
        'sheets.google.com',
        'slides.google.com',
        'drive.google.com',
        'calendar.google.com',
        'gmail.com',
        'outlook.com',
        'office.com',
        'teams.microsoft.com',
        'slack.com',
        'jira.atlassian.com',
        'confluence.atlassian.com',
        'linear.app',
        'trello.com',
        'asana.com',
        'clickup.com',
        'monday.com',
        'airtable.com',
        'miro.com',
        'loom.com',
        'zoom.us',
        'meet.google.com',
        'vercel.com',
        'netlify.com',
        'supabase.com',
        'firebase.google.com',
        'aws.amazon.com',
        'console.cloud.google.com',
        'vscode.dev',
        'codepen.io',
        'codesandbox.io',
        'replit.com',
        'leetcode.com',
        'hackerrank.com',
        'coursera.org',
        'udemy.com',
        'freecodecamp.org',
        'developer.mozilla.org',
        'docs.anthropic.com',
        'openai.com',
        'anthropic.com',
        'huggingface.co',
        'npmjs.com',
        'pypi.org',
    ],

} as const


export type SiteCategory = 'adult' | 'distraction' | 'entertainment' | 'productivity' | 'other'

const twhc = getT('common')
export const CATEGORY_META: Record<SiteCategory, {
    label:   string
    color:   string
    emoji:   string
    desc:    string
}> = {
    adult: {
        label: twhc('adultContent'),
        color: '#f43f5e',
        emoji: '🔞',
        desc:  twhc('adultContentDesc'),
    },
    distraction: {
        label: twhc('distraction'),
        color: '#9e4fe7',
        emoji: '📱',
        desc:  twhc('distractionDesc'),
    },
    entertainment: {
        label: twhc('entertainment'),
        color: '#fbbf24',
        emoji: '🎬',
        desc:  twhc('entertainmentDesc'),
    },
    productivity: {
        label: twhc('productivity'),
        color: '#34d399',
        emoji: '💼',
        desc:  twhc('productivityDesc'),
    },
    other: {
        label: twhc('other'),
        color: '#60a5fa',
        emoji: '🌐',
        desc:  twhc('otherDesc'),
    },
}