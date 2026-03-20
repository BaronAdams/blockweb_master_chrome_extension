
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

/* ── Détection adulte ────────────────────────────────────────────────────── */

function isAdultContent(adultDomains: Set<string>): { detected: boolean; signal: string } {
    const domain = getCurrentDomain()

    // 1. Domaine connu (filet de sécurité)
    if (adultDomains.has(domain) || [...adultDomains].some(d => domain.endsWith(`.${d}`))) {
        return { detected: true, signal: domain }
    }

    // 2. og:type
    const ogType = getMetaContent('og:type').toLowerCase()
    if (ADULT_OG_TYPES.some(t => ogType.includes(t))) {
        return { detected: true, signal: `og:type=${ogType}` }
    }

    // 3. Titre + metas + URL
    const aggregate = [
        document.title,
        getMetaContent('description'),
        getMetaContent('og:description'),
        getMetaContent('og:title'),
        getMetaContent('keywords'),
        location.href,
    ].map(normalize).join(' ')

    const hit = ADULT_SIGNALS.find(s => aggregate.includes(normalize(s)))
    if (hit) return { detected: true, signal: hit }

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
    console.log(adultDomains)
    const bodyText = normalize(document.body?.innerText?.slice(0, 800) ?? '')
    if (!bodyText) return

    if (adultBlocked) {
        const adultHit = ADULT_SIGNALS.find(s => bodyText.includes(normalize(s)))
        if (adultHit) {
            redirectTo(resolveRedirect(customRedirectUrl, 'adult', adultHit))
            return
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
    const adultBlocked:   boolean  = state?.adultContentBlocked ?? false
    // @ts-ignore
    const keywords:       string[] = state?.activeBlockedKeywords ?? []
    // @ts-ignore
    const customRedirect: string   = state?.customRedirectUrl ?? ''

    if (!adultBlocked && keywords.length === 0) return

    // Récupérer la liste des domaines adultes
    let adultDomains = new Set<string>()
    if (adultBlocked) {
        try {
            const res  = await chrome.runtime.sendMessage({ type: 'GET_ADULT_DOMAINS' })
            const list: string[] = res?.domains ?? []
            adultDomains = new Set(list.map(d => d.toLowerCase().replace(/^www\./, '')))
        } catch {
            // Service worker endormi — la détection par contenu prend le relais
        }
    }

    /* ── Phase 1 : HEAD — disponible à document_start ── */

    if (adultBlocked) {
        const { detected, signal } = isAdultContent(adultDomains)
        if (detected) {
            redirectTo(resolveRedirect(customRedirect, 'adult', signal))
            return
        }
    }

    if (keywords.length > 0) {
        const { matched, keyword } = matchesKeyword(keywords)
        if (matched) {
            redirectTo(resolveRedirect(customRedirect, 'keyword', keyword))
            return
        }
    }

    /* ── Phase 2 : BODY — disponible après DOMContentLoaded ── */

    const runBodyCheck = () =>
        checkBodyContent(adultBlocked, adultDomains, keywords, customRedirect)

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runBodyCheck, { once: true })
    } else {
        runBodyCheck()
    }
}

init()