
//  * adultContentScript.ts
//  * ─────────────────────────────────────────────────────────────────────────────
//  * Injecté sur toutes les pages (https://*/*) à document_start.
//  *
//  * Deux responsabilités :
//  *
//  * 1. BLOCAGE ADULTE
//  *    - Vérifie si le domaine courant est dans PREDEFINED_ADULT_DOMAINS
//  *      (DNR gère déjà ça, mais ce script est un filet de sécurité)
//  *    - Analyse le contenu de la page (title, meta, og, body) pour détecter
//  *      les sites adultes dont le domaine n'est PAS dans la liste prédéfinie
//  *    - Si détecté → redirige immédiatement
//  *
//  * 2. BLOCAGE MOTS-CLÉS
//  *    - Vérifie si l'URL contient un mot-clé bloqué (DNR le couvre aussi)
//  *    - Vérifie si le titre, les metas ou le body contiennent un mot-clé bloqué
//  *    - Si détecté → redirige immédiatement
//  * ─────────────────────────────────────────────────────────────────────────────
 

/* ── Signaux pour la détection adulte ───────────────────────────────────── */

/* ── Domaines considérés comme sûrs — jamais bloqués par la détection dynamique ──
   Ces domaines sont dans des catégories connues (productivité, divertissement légitime).
   Même si une page contient des mots-clés adultes (ex: article, repo GitHub, Wikipedia),
   le domaine ne sera jamais marqué comme adulte.
   La liste couvre les catégories SITE_CATEGORIES de constants.ts.
───────────────────────────────────────────────────────────────────────────────────── */
const SAFE_DOMAINS: string[] = [
    // Productivité & code
    'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
    'notion.so', 'figma.com', 'linear.app', 'trello.com', 'asana.com',
    'jira.atlassian.com', 'confluence.atlassian.com', 'clickup.com',
    'monday.com', 'airtable.com', 'miro.com', 'loom.com',
    'docs.google.com', 'sheets.google.com', 'slides.google.com',
    'drive.google.com', 'calendar.google.com', 'gmail.com',
    'outlook.com', 'office.com', 'teams.microsoft.com', 'slack.com',
    'zoom.us', 'meet.google.com', 'vercel.com', 'netlify.com',
    'supabase.com', 'firebase.google.com', 'aws.amazon.com',
    'vscode.dev', 'codepen.io', 'codesandbox.io', 'replit.com',
    'leetcode.com', 'hackerrank.com', 'freecodecamp.org',
    'developer.mozilla.org', 'npmjs.com', 'pypi.org',
    'anthropic.com', 'openai.com', 'huggingface.co',
    // Recherche & encyclopédies
    'google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com',
    'wikipedia.org', 'wikimedia.org', 'wiktionary.org',
    // Divertissement légitime
    'youtube.com', 'netflix.com', 'spotify.com', 'deezer.com',
    'twitch.tv', 'vimeo.com', 'soundcloud.com',
    // Réseaux sociaux
    'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
    'linkedin.com', 'reddit.com', 'discord.com', 'telegram.org',
    'tiktok.com', 'pinterest.com', 'snapchat.com',
    // News & médias
    'bbc.com', 'cnn.com', 'lemonde.fr', 'lefigaro.fr', 'liberation.fr',
    'nytimes.com', 'theguardian.com', 'reuters.com', 'apnews.com',
    // E-commerce & services
    'amazon.com', 'amazon.fr', 'ebay.com', 'paypal.com',
    'stripe.com', 'shopify.com',
]

/**
 * Vérifie si un domaine est considéré comme sûr (catégorie connue non-adulte).
 * Un domaine sûr ne sera JAMAIS marqué comme adulte par la détection dynamique,
 * même si sa page contient des mots-clés adultes dans son contenu.
 */
function isSafeDomain(domain: string): boolean {
    const d = domain.toLowerCase().replace(/^www\./, '')
    return SAFE_DOMAINS.some(safe => d === safe || d.endsWith('.' + safe))
}

const ADULT_SIGNALS: string[] = [
    'porn', 'xxx', 'xvideos', 'xhamster', 'pornhub', 'redtube', 'youporn',
    'brazzers', 'onlyfans', 'chaturbate', 'livejasmin', 'stripchat',
    'sexe', 'sexo', 'porno', 'erotic', 'hentai', 'milf', 'nude',
    'naked', 'nsfw', 'adult content', 'contenu adulte', '18+',
    'adult entertainment', 'sex videos', 'free porn',
]

const ADULT_OG_TYPES = ['adult', 'xxx']

/* ── Utilitaires ─────────────────────────────────────────────────────────── */

function getCurrentDomain(): string {
    return location.hostname.replace(/^www\./, '').toLowerCase()
}

function redirectTo(url: string): void {
    location.replace(url)
}

/**
 * Notifie le background qu'un domaine adulte a été détecté par analyse de contenu.
 * Appelé TOUJOURS quand un site adulte est détecté, qu'il soit bloqué ou non.
 * Le background l'ajoute à state.detectedAdultDomains pour Analytics.
 */
function markAsAdult(domain: string): void {
    chrome.runtime.sendMessage({ type: 'MARK_ADULT_DOMAIN', domain }).catch(() => {
        // Service worker endormi — non critique, on réessaiera à la prochaine visite
    })
}

function normalize(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getMetaContent(nameOrProp: string): string {
    const el = document.querySelector(
        `meta[name="${nameOrProp}"], meta[property="${nameOrProp}"]`
    ) as HTMLMetaElement | null
    return el?.content ?? ''
}

function resolveRedirect(
    customUrl: string,
    reason:    'adult' | 'keyword',
    value:     string
): string {
    const custom = customUrl?.trim()
    if (custom && (custom.startsWith('http://') || custom.startsWith('https://'))) return custom

    if (reason === 'adult') {
        // Format attendu par /blocked : ?url=<domain>&adult=1
        // On passe le domaine courant comme valeur de ?url
        const domain = getCurrentDomain()
        return chrome.runtime.getURL(
            `/src/blocked/index.html?url=${encodeURIComponent(domain)}&adult=1`
        )
    }

    // keyword
    return chrome.runtime.getURL(
        `/src/blocked/index.html?keyword=${encodeURIComponent(value)}`
    )
}

/* ── Détection adulte (Phase 1 — HEAD) ─────────────────────────────────────
   Seuil de confiance renforcé pour éviter les faux positifs :

   - Signal FORT unique suffit : domaine dans la liste prédéfinie, ou og:type adulte
   - Signal FAIBLE : mot-clé dans une source (URL, titre, meta...)
     → 2 signaux faibles dans des sources DISTINCTES requis pour déclencher

   Jamais déclenché sur un domaine dans SAFE_DOMAINS.
──────────────────────────────────────────────────────────────────────────── */

function isAdultContent(adultDomains: Set<string>): { detected: boolean; signal: string } {
    const domain = getCurrentDomain()

    // Domaine sûr → jamais adulte, quoi qu'il arrive
    if (isSafeDomain(domain)) return { detected: false, signal: '' }

    // Signal FORT 1 : domaine dans la liste prédéfinie
    if (adultDomains.has(domain) || [...adultDomains].some(d => domain.endsWith('.' + d))) {
        return { detected: true, signal: domain }
    }

    // Signal FORT 2 : og:type explicitement adulte
    const ogType = getMetaContent('og:type').toLowerCase()
    if (ADULT_OG_TYPES.some(t => ogType.includes(t))) {
        return { detected: true, signal: `og:type=${ogType}` }
    }

    // Signaux FAIBLES — chaque source est indépendante
    const sources = {
        url:         normalize(location.href),
        title:       normalize(document.title),
        description: normalize(getMetaContent('description') + ' ' + getMetaContent('og:description')),
        keywords:    normalize(getMetaContent('keywords')),
        ogTitle:     normalize(getMetaContent('og:title')),
    }

    // Compter combien de sources DISTINCTES contiennent un signal adulte
    let hits = 0
    const hitSources: string[] = []

    for (const [srcName, srcText] of Object.entries(sources)) {
        if (!srcText.trim()) continue
        const found = ADULT_SIGNALS.find(s => srcText.includes(normalize(s)))
        if (found) {
            hits++
            hitSources.push(`${srcName}:${found}`)
        }
    }

    // Exiger au moins 2 sources distinctes pour confirmer
    if (hits >= 2) {
        return { detected: true, signal: hitSources.join(', ') }
    }

    return { detected: false, signal: '' }
}

/* ── Détection mots-clés ─────────────────────────────────────────────────── */

function matchesKeyword(keywords: string[]): { matched: boolean; keyword: string } {
    if (!keywords.length) return { matched: false, keyword: '' }

    const aggregate = [
        location.href,
        location.hostname,
        document.title,
        getMetaContent('description'),
        getMetaContent('og:title'),
        getMetaContent('og:description'),
        getMetaContent('keywords'),
    ].map(normalize).join(' ')

    for (const kw of keywords) {
        const trimmed = kw.trim()
        if (!trimmed) continue
        if (aggregate.includes(normalize(trimmed))) {
            return { matched: true, keyword: trimmed }
        }
    }
    return { matched: false, keyword: '' }
}

/* ── Vérification sur le body (après DOMContentLoaded) ──────────────────── */

function checkBodyContent(
    adultBlocked:      boolean,
    adultDomains:      Set<string>,
    keywords:          string[],
    customRedirectUrl: string
): void {
    const domain   = getCurrentDomain()
    const bodyText = normalize(document.body?.innerText?.slice(0, 800) ?? '')
    if (!bodyText) return
    console.log(adultDomains)
    // Domaine sûr → jamais marqué adulte
    if (isSafeDomain(domain)) {
        // On passe directement aux mots-clés utilisateur
    } else {
        // Détection adulte sur le body — compter les signaux dans le body
        // Pour marquer/bloquer via le body seul, exiger 3+ occurrences de signaux distincts
        // (le body peut contenir des mentions accidentelles dans des articles légitimes)
        const bodySignals = ADULT_SIGNALS.filter(s => bodyText.includes(normalize(s)))
        if (bodySignals.length >= 3) {
            markAsAdult(domain)
            if (adultBlocked) {
                redirectTo(resolveRedirect(customRedirectUrl, 'adult', bodySignals[0]))
                return
            }
        }
    }

    for (const kw of keywords) {
        const trimmed = kw.trim()
        if (!trimmed) continue
        if (bodyText.includes(normalize(trimmed))) {
            redirectTo(resolveRedirect(customRedirectUrl, 'keyword', trimmed))
            return
        }
    }
}

/* ── Point d'entrée ──────────────────────────────────────────────────────── */

async function init(): Promise<void> {
    // Ne pas s'exécuter sur les pages internes de l'extension
    if (location.href.startsWith(chrome.runtime.getURL(''))) return

    const stored = await chrome.storage.local.get(['blockweb_master_state'])
    const state  = stored?.blockweb_master_state
    if (!state) return
    // @ts-ignore
    const adultBlocked:   boolean  = state.adultContentBlocked ?? false
    // @ts-ignore
    const keywords:       string[] = state.activeBlockedKeywords ?? []
    // @ts-ignore
    const customRedirect: string   = state.customRedirectUrl ?? ''

    // On ne sort PAS si adultBlocked est false —
    // on doit toujours détecter les sites adultes pour les marquer dans Analytics.
    // Le blocage effectif (redirection) n'intervient que si adultBlocked === true.
    const needsKeywordCheck = keywords.length > 0
    // const needsAnyCheck     = true // toujours détecter l'adulte

    // Récupérer la liste des domaines adultes connus (pour Phase 1)
    let adultDomains = new Set<string>()
    try {
        const res  = await chrome.runtime.sendMessage({ type: 'GET_ADULT_DOMAINS' })
        const list: string[] = res?.domains ?? []
        adultDomains = new Set(list.map(d => d.toLowerCase().replace(/^www\./, '')))
    } catch {
        // Service worker endormi — la détection par contenu (Phase 2) prend le relais
    }

    /* ── Phase 1 : HEAD — disponible à document_start ── */

    const { detected: adultDetected, signal } = isAdultContent(adultDomains)
    if (adultDetected) {
        // Marquer TOUJOURS le domaine comme adulte (pour Analytics)
        markAsAdult(getCurrentDomain())
        // Rediriger SEULEMENT si le blocage adulte est activé
        if (adultBlocked) {
            redirectTo(resolveRedirect(customRedirect, 'adult', signal))
            return
        }
    }

    if (needsKeywordCheck) {
        const { matched, keyword } = matchesKeyword(keywords)
        if (matched) {
            redirectTo(resolveRedirect(customRedirect, 'keyword', keyword))
            return
        }
    }

    /* ── Phase 2 : BODY — disponible après DOMContentLoaded ── */
    // checkBodyContent gère aussi la détection sans blocage

    const runBodyCheck = () =>
        checkBodyContent(adultBlocked, adultDomains, keywords, customRedirect)

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runBodyCheck, { once: true })
    } else {
        runBodyCheck()
    }
}

init()