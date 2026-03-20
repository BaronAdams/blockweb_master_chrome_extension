import { State } from '@/lib/types'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

/* =========================================================
   TYPES
========================================================= */
interface GlobalContextType {
  state: State | null
  avatarUrl: string
  refresh: () => Promise<void>   // exposé pour forcer un re-chargement depuis n'importe quel composant
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined)

/* =========================================================
   PROVIDER
========================================================= */
export const GlobalStateProvider = ({ children }: { children: React.ReactNode }) => {
  const STORAGE_KEY = 'blockweb_master_state'

  const [state, setState_] = useState<State | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  /* ── Charge le state ET l'avatar en une seule passe ──
     L'avatar dépend du userId, donc on ne peut le charger
     qu'après avoir lu le state — les deux sont groupés ici. */
  const refresh = useCallback(async () => {
    const res = await chrome.storage.local.get(STORAGE_KEY)
    // @ts-ignore
    const s: State | null = res[STORAGE_KEY] ?? null
    setState_(s)

    if (s?.auth?.userId) {
      const avatarKey = `bwm_avatar_${s.auth.userId}`
      const avatarRes = await chrome.storage.local.get(avatarKey)
      // @ts-ignore
      setAvatarUrl(avatarRes[avatarKey] ?? '')
    } else {
      setAvatarUrl('')
    }
  }, [])

  /* ── Chargement initial ── */
  useEffect(() => {
    refresh()
  }, [refresh])

  /* ── Listener sur les changements de storage ── */
  useEffect(() => {
    const handler = (changes: Record<string, chrome.storage.StorageChange>) => {

      // 1. Mise à jour du state principal
      if (changes[STORAGE_KEY]) {
        // @ts-ignore
        const newState: State | null = changes[STORAGE_KEY].newValue ?? null
        setState_(newState)

        // Si le userId change (connexion / déconnexion) → recharger l'avatar
        if (newState?.auth?.userId) {
          const avatarKey = `bwm_avatar_${newState.auth.userId}`
          chrome.storage.local.get(avatarKey, (res) => {
            // @ts-ignore
            setAvatarUrl(res[avatarKey] ?? '')
          })
        } else {
          setAvatarUrl('')
        }
      }

      // 2. Mise à jour de l'avatar si l'utilisateur vient d'en choisir un nouveau
      //    (Account.tsx écrit bwm_avatar_<userId> → on intercepte ici)
      for (const key of Object.keys(changes)) {
        if (!key.startsWith('bwm_avatar_')) continue
        // Comparer avec le userId courant pour ne pas appliquer l'avatar d'un autre compte
        setState_(prev => {
          if (prev?.auth?.userId && key === `bwm_avatar_${prev.auth.userId}`) {
            // @ts-ignore
            setAvatarUrl(changes[key].newValue ?? '')
          }
          return prev   // on ne modifie pas le state, juste l'avatar
        })
      }
    }

    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  }, [])

  return (
    <GlobalContext.Provider value={{ state, avatarUrl, refresh }}>
      {children}
    </GlobalContext.Provider>
  )
}

/* =========================================================
   HOOK
========================================================= */
export const useStateContext = () => {
  const context = useContext(GlobalContext)
  if (!context) throw new Error('useStateContext must be used within GlobalStateProvider')
  return context
}