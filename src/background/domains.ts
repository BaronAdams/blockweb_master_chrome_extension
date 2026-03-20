import { State } from "@/lib/types";
import { getState, setState } from "./storage";
import { LIMITS } from "@/lib/constants";

function isDomainBlocked(state: State, domain: string) {
    return (
        state.activeBlockedDomains.includes(domain) ||
        state.frozenBlockedDomains.includes(domain)
    );
}

export async function addBlockedDomain(domain: string) {
    const state = await getState();

    if (isDomainBlocked(state, domain)) return;

    if (state.isPremium) {
        state.activeBlockedDomains.push(domain);
    } else {
        if (state.activeBlockedDomains.length < LIMITS.FREE.domains) {
            state.activeBlockedDomains.push(domain);
        } else {
            console.log(
                "Limite atteinte",
                "Passez en Premium pour activer plus de domaines"
            );
            return;
            // ⚠️ Option alternative possible :
            // state.frozenBlockedDomains.push(domain);
        }
    }

    await setState(state);
    //   await applyDomainBlockingRules(state.activeBlockedDomains);
}

export async function removeBlockedDomain(domain: string) {
    const state = await getState();
    
    const activeIndex = state.activeBlockedDomains.indexOf(domain);
    if (activeIndex !== -1) {
        state.activeBlockedDomains.splice(activeIndex, 1);
    } else {
        const frozenIndex = state.frozenBlockedDomains.indexOf(domain);
        if (frozenIndex !== -1) {
            state.frozenBlockedDomains.splice(frozenIndex, 1);
        }
    }
    
    await setState(state);
    //   await applyDomainBlockingRules(state.activeBlockedDomains);
}

export const getDomain = (url?: string): string | null => {
  if (!url || !url.startsWith("http")) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};