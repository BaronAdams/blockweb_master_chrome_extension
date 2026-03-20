import { State } from "@/lib/types";
import { getState, setState } from "./storage";
import { LIMITS } from "@/lib/constants";

function isKeywordBlocked(state: State, keyword: string) {
    return (
        state.activeBlockedKeywords.includes(keyword) ||
        state.frozenBlockedKeywords.includes(keyword)
    );
}

export async function addBlockedKeyword(keyword: string) {
    const state = await getState();

    if (isKeywordBlocked(state, keyword)) return;

    if (state.isPremium) {
        state.activeBlockedKeywords.push(keyword);
    } else {
        if (state.activeBlockedKeywords.length < LIMITS.FREE.keywords) {
            state.activeBlockedKeywords.push(keyword);
        } else {
            console.log(
                "Limite atteinte",
                "Passez en Premium pour activer plus de Keywordes"
            );
            return;
            // ⚠️ Option alternative possible :
            // state.frozenBlockedKeywords.push(Keyword);
        }
    }

    await setState(state);
    //   await applyKeywordBlockingRules(state.activeBlockedKeywords);
}

export async function removeBlockedKeyword(keyword: string) {
    const state = await getState();
    
    const activeIndex = state.activeBlockedKeywords.indexOf(keyword);
    if (activeIndex !== -1) {
        state.activeBlockedKeywords.splice(activeIndex, 1);
    } else {
        const frozenIndex = state.frozenBlockedKeywords.indexOf(keyword);
        if (frozenIndex !== -1) {
            state.frozenBlockedKeywords.splice(frozenIndex, 1);
        }
    }
    
    await setState(state);
    //   await applyKeywordBlockingRules(state.activeBlockedKeywords);
}