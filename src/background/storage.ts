/* ------------------ STORAGE ------------------ */

import { State } from "@/lib/types";
const STORAGE_KEY = "blockweb_master_state";

export function getState(): Promise<State> {
    return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEY, (res) => {
            // @ts-ignore
            resolve(res[STORAGE_KEY]);
        });
    });
}

export function setState(state: State) {
    return chrome.storage.local.set({ [STORAGE_KEY]: state });
}
