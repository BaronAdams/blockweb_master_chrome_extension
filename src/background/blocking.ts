import { PREDEFINED_ADULT_DOMAINS } from "@/lib/constants";
import { Profile, State } from "@/lib/types";
import { isProfileLimitReached } from "./time";

/* =========================================================
   RÉPARTITION DES IDs DE RÈGLES DNR
   ─────────────────────────────────────────────────────────
   1     → 999    Domaines bloqués (sites utilisateur + adultes)
   1000  → 1999   Mots-clés bloqués
   2000  → 2999   Whitelist (action: allow, priorité 3)
   3000  → 3009   Safe Search — redirection moteurs de recherche
   10000 +        Profils (calculés via stableId)
========================================================= */

const BLOCKED_EXTENSION_PATH  = "/src/blocked/index.html";
const MAIN_FRAME: chrome.declarativeNetRequest.ResourceType[] = [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME];
const ALL_FRAMES:  chrome.declarativeNetRequest.ResourceType[] = [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME, chrome.declarativeNetRequest.ResourceType.SUB_FRAME];

/* =========================================================
   HELPERS
========================================================= */

/**
 * Construit l'action de redirection selon le customRedirectUrl défini par l'utilisateur.
 * - Si une URL custom valide existe → redirige vers cette URL externe
 * - Sinon → redirige vers la page /blocked interne de l'extension
 *
 * Note : les règles DNR ne peuvent pas lire dynamiquement le state.
 * On résout l'URL cible ici au moment de la construction des règles,
 * c'est-à-dire à chaque appel de syncDnrRules() (déclenché par storage.onChanged).
 */
function buildRedirectAction(
    customRedirectUrl: string | undefined,
    extensionQuery:    string,
): chrome.declarativeNetRequest.RuleAction {
    const custom = customRedirectUrl?.trim()
    if (custom && (custom.startsWith('http://') || custom.startsWith('https://'))) {
        return {
            type:     'redirect' as chrome.declarativeNetRequest.RuleActionType,
            redirect: { url: custom },
        }
    }
    return {
        type:     'redirect' as chrome.declarativeNetRequest.RuleActionType,
        redirect: { extensionPath: `${BLOCKED_EXTENSION_PATH}?${extensionQuery}` },
    }
}

/** Hash stable d'un domaine → entier dans [0, 88_999] */
function stableId(domain: string): number {
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
        hash = (hash * 31 + domain.charCodeAt(i)) & 0xffff;
    }
    return hash % 89_000;
}

/** Supprime les règles DNR dont les IDs sont dans la plage [from, to] */
async function clearRulesInRange(from: number, to: number): Promise<void> {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const toRemove = existing
        .filter(r => r.id >= from && r.id <= to)
        .map(r => r.id);

    if (toRemove.length) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: toRemove });
    }
}

/* =========================================================
   PROFILE RULES  (IDs >= 10_000)
========================================================= */

export const clearProfileRules = async (): Promise<void> => {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const toRemove = existing.filter(r => r.id >= 10_000).map(r => r.id);
    if (toRemove.length) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: toRemove });
    }
};

export const applyProfileBlocking = async (profile: Profile): Promise<void> => {
    await clearProfileRules();

    const rules: chrome.declarativeNetRequest.Rule[] = profile.sites.map((domain) => ({
        id: 10_000 + stableId(domain),
        priority: 2, // > whitelist (3 gagne sur 2, voir note whitelist)
        condition: {
            urlFilter: `||${domain}`,
            resourceTypes: MAIN_FRAME,
        },
        action: {
            type: "redirect" as chrome.declarativeNetRequest.RuleActionType,
            redirect: {
                extensionPath: `${BLOCKED_EXTENSION_PATH}?profile=${encodeURIComponent(profile.id)}`,
            },
        },
    }));

    if (rules.length) {
        await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
    }
};

/**
 * Réévalue tous les profils actifs et applique/retire les règles de blocage.
 * À appeler après chaque stopTracking() ou changement d'état de profil.
 * Retourne le profil bloqué ou null.
 */
export const syncProfileRules = async (
    activeProfiles: Profile[],
    siteUsage: State["siteUsage"],
    now = Date.now()
): Promise<Profile | null> => {
    const blockedProfile = activeProfiles.find(
        (p) => p.isActive && isProfileLimitReached(p, siteUsage, now)
    ) ?? null;

    if (blockedProfile) {
        await applyProfileBlocking(blockedProfile);
    } else {
        await clearProfileRules();
    }

    return blockedProfile;
};

/* =========================================================
   WHITELIST RULES  (IDs 2000 → 2999)
   Priorité 3 — passe devant les blocages standards (priorité 1)
   mais PAS devant les profils (priorité 2).
   Note : pour qu'un profil puisse bloquer un site en whitelist,
   on laisse la priorité profil à 2 < whitelist 3. Si tu veux
   l'inverse (whitelist toujours gagnante), passe les profils à 4.
========================================================= */

export const syncWhitelistRules = async (whitelist: string[]): Promise<void> => {
    await clearRulesInRange(2_000, 2_999);

    if (!whitelist.length) return;

    const rules: chrome.declarativeNetRequest.Rule[] = whitelist
        .slice(0, 999) // max 999 entrées dans cette plage
        .map((domain, i) => ({
            id: 2_000 + i,
            priority: 3,
            condition: {
                urlFilter: `||${domain}`,
                resourceTypes: ALL_FRAMES,
            },
            action: {
                type: "allow" as chrome.declarativeNetRequest.RuleActionType,
            },
        }));

    await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
};

/* =========================================================
   ADULT CONTENT — SAFE SEARCH  (IDs 3000 → 3009)
   Force le Safe Search sur les moteurs de recherche supportés
   quand adultContentBlocked === true.
   Cela empêche les requêtes d'images/vidéos explicites.
   Le masquage des liens dans les résultats est géré par
   le content script (adultContentScript.ts).
========================================================= */

/* ── Safe Search via queryTransform ──────────────────────────────────────
   On utilise redirect.transform.queryTransform pour AJOUTER le paramètre
   safe search à la requête existante, sans écraser le paramètre ?q=.
   Avec redirect: { url: hardcodedUrl }, la requête de l'utilisateur était
   perdue. queryTransform.addOrReplaceParams préserve tous les paramètres
   existants et ajoute/remplace uniquement ceux spécifiés.
──────────────────────────────────────────────────────────────────────── */
const SAFE_SEARCH_RULES: {
    id: number
    urlFilter: string
    param: { key: string; value: string }
}[] = [
    { id: 3_000, urlFilter: "||google.com/search*",        param: { key: "safe",        value: "active" } },
    { id: 3_001, urlFilter: "||bing.com/search*",          param: { key: "adlt",        value: "strict" } },
    { id: 3_002, urlFilter: "||duckduckgo.com/*",          param: { key: "kp",          value: "1"      } },
    { id: 3_003, urlFilter: "||search.yahoo.com/search*",  param: { key: "vm",          value: "r"      } },
    { id: 3_004, urlFilter: "||search.brave.com/search*",  param: { key: "safesearch",  value: "strict" } },
];

const applySafeSearchRules = async (): Promise<void> => {
    const rules: chrome.declarativeNetRequest.Rule[] = SAFE_SEARCH_RULES.map(({ id, urlFilter, param }) => ({
        id,
        priority: 1,
        condition: {
            urlFilter,
            resourceTypes: MAIN_FRAME,
        },
        action: {
            type: "redirect" as chrome.declarativeNetRequest.RuleActionType,
            redirect: {
                // transform préserve l'URL originale et ajoute/remplace uniquement
                // le paramètre de safe search — la requête ?q= est conservée
                transform: {
                    queryTransform: {
                        addOrReplaceParams: [param],
                    },
                },
            },
        },
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
};

const clearSafeSearchRules = async (): Promise<void> => {
    await clearRulesInRange(3_000, 3_009);
};

/* =========================================================
   DOMAIN & KEYWORD RULES  (IDs 1 → 999 et 1000 → 1999)
   + ADULT CONTENT DOMAINS
   + WHITELIST
   + SAFE SEARCH
   Point d'entrée unique à appeler à chaque changement d'état.
========================================================= */

export async function syncDnrRules(state: State): Promise<void> {
    /* ── 1. Construire la liste des domaines bloqués ── */
    const userDomains  = state.activeBlockedDomains ?? [];
    const adultDomains = state.adultContentBlocked ? (PREDEFINED_ADULT_DOMAINS ?? []) : [];

    // Déduplique domaines utilisateur + adultes
    const allBlockedDomains = [...new Set([...userDomains, ...adultDomains])];

    /* ── 2. Construire les règles domaines (IDs 1 → 999) ── */
    const domainRules: chrome.declarativeNetRequest.Rule[] = allBlockedDomains
        .slice(0, 999)
        .map((domain, i) => {
            const isAdult   = state.adultContentBlocked && adultDomains.includes(domain)
            const query     = `url=${encodeURIComponent(domain)}${isAdult ? '&adult=1' : ''}`
            return {
                id: i + 1,
                priority: 1,
                condition: {
                    urlFilter: `||${domain}`,
                    resourceTypes: ALL_FRAMES,
                },
                action: buildRedirectAction(state.customRedirectUrl, query),
            }
        });

    /* ── 3. Construire les règles mots-clés (IDs 1000 → 1999) ── */
    const keywordRules: chrome.declarativeNetRequest.Rule[] = (state.activeBlockedKeywords ?? [])
        .slice(0, 999)
        .map((keyword, i) => ({
            id: 1_000 + i,
            priority: 1,
            condition: {
                urlFilter: keyword,
                resourceTypes: ALL_FRAMES,
            },
            action: buildRedirectAction(
                state.customRedirectUrl,
                `keyword=${encodeURIComponent(keyword)}`
            ),
        }));

    /* ── 4. Appliquer domaines + mots-clés (IDs 1 → 1999) ── */
    await clearRulesInRange(1, 1_999);
    const allRules = [...domainRules, ...keywordRules];
    if (allRules.length) {
        await chrome.declarativeNetRequest.updateDynamicRules({ addRules: allRules });
    }

    /* ── 5. Whitelist (IDs 2000 → 2999) ── */
    await syncWhitelistRules(state.whitelist ?? []);

    /* ── 6. Safe Search (IDs 3000 → 3009) ── */
    if (state.adultContentBlocked) {
        await clearSafeSearchRules();
        await applySafeSearchRules();
    } else {
        await clearSafeSearchRules();
    }
}