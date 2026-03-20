import { useStateContext } from '@/context/GlobalStateContext'
import { Icon } from '@iconify/react'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* =========================================================
   TYPES
========================================================= */
interface SubscriptionRow {
    plan:       string
    is_valid:   boolean
    expires_at: string | null
    updated_at: string
}

type SaveStatus = 'idle' | 'loading' | 'success' | 'error'

/* =========================================================
   HELPERS
========================================================= */
async function sendToBackground<T = { success?: boolean; error?: string }>(
    msg: Record<string, unknown>
): Promise<T> {
    return new Promise((resolve) =>
        chrome.runtime.sendMessage(msg, (r) => resolve(r ?? { error: 'Pas de réponse.' }))
    )
}

const PLAN_LABEL: Record<string, string> = {
    FREE:     'Gratuit',
    MONTHLY:  'Mensuel',
    YEARLY:   'Annuel',
    LIFETIME: 'À Vie',
}

const PLAN_COLOR: Record<string, string> = {
    FREE:     'text-zinc-400 bg-zinc-800 border-zinc-700',
    MONTHLY:  'text-amber-300 bg-amber-500/10 border-amber-500/30',
    YEARLY:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
    LIFETIME: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

function formatExpiry(ts: number | null): string | null {
    if (!ts) return null
    return new Date(ts).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
    })
}

/* =========================================================
   AVATARS PRÉDÉFINIS
========================================================= */
const AVATARS = ['Felix', 'Aneka', 'Bob', 'Jack', 'Molly', 'Sarah'].map(
    seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
)

/* =========================================================
   COMPOSANT
========================================================= */
const Account = () => {
    const location             = useLocation()
    const { state, avatarUrl } = useStateContext()   // ← source unique de vérité

    /* ── Username ── */
    const [newUsername,   setNewUsername]  = useState('')
    const [userSaveStatus, setUserSave]   = useState<SaveStatus>('idle')
    const [userSaveError,  setUserError]  = useState<string | null>(null)

    /* ── Mot de passe ── */
    const [showPwdForm,  setShowPwdForm]  = useState(false)
    const [currentPwd,   setCurrentPwd]   = useState('')
    const [newPwd,       setNewPwd]       = useState('')
    const [confirmPwd,   setConfirmPwd]   = useState('')
    const [pwdStatus,    setPwdStatus]    = useState<SaveStatus>('idle')
    const [pwdError,     setPwdError]     = useState<string | null>(null)

    /* ── Déconnexion ── */
    const [logoutLoading,  setLogoutLoading]  = useState(false)
    const [logoutStep,     setLogoutStep]     = useState<'idle' | 'confirm' | 'password'>('idle')
    const [logoutPassword, setLogoutPassword] = useState('')
    const [logoutError,    setLogoutError]    = useState<string | null>(null)

    /* ── Suppression (3 étapes) ── */
    const [deleteStep,     setDeleteStep]     = useState<'idle' | 'confirm' | 'password'>('idle')
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteLoading,  setDeleteLoading]  = useState(false)
    const [deleteError,    setDeleteError]    = useState<string | null>(null)

    /* ── Historique ── */
    const [history,        setHistory]        = useState<SubscriptionRow[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)

    /* ── Redirection si non connecté ── */
    useEffect(() => {
        // state === null = pas encore chargé → on attend
        // state !== null mais isAuthenticated === false → rediriger
        if (state !== null && !state.auth?.isAuthenticated) {
            window.location.href = chrome.runtime.getURL('src/auth/index.html')
        }
    }, [state])

    /* ── Sync username depuis le contexte ── */
    useEffect(() => {
        if (state?.auth?.userName) setNewUsername(state.auth.userName)
    }, [state?.auth?.userName])

    /* ── Charger l'historique Supabase ── */
    useEffect(() => {
        if (!state?.auth?.isAuthenticated || !state?.auth?.accessToken || !state?.auth?.userId) return
        const load = async () => {
            setHistoryLoading(true)
            try {
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${state.auth.userId}&select=plan,is_valid,expires_at,updated_at&order=updated_at.desc`
                const res = await fetch(url, {
                    headers: {
                        apikey:        import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                        Authorization: `Bearer ${state.auth.accessToken}`,
                    },
                })
                if (res.ok) setHistory(await res.json())
            } catch { /* silencieux */ }
            setHistoryLoading(false)
        }
        load()
    }, [state?.auth?.isAuthenticated])

    /* ── Changer d'avatar ──
       On écrit dans le storage — le contexte met automatiquement
       à jour avatarUrl via son listener onChanged */
    const handleAvatarSelect = async (url: string) => {
        const userId = state?.auth?.userId ?? 'guest'
        await chrome.storage.local.set({ [`bwm_avatar_${userId}`]: url })
    }

    /* ── Modifier le username ── */
    const handleUpdateUsername = async () => {
        const trimmed = newUsername.trim()
        if (!trimmed || trimmed === state?.auth?.userName) return
        setUserSave('loading')
        setUserError(null)
        const res = await sendToBackground<{ success: boolean; error?: string }>({
            type: 'UPDATE_USERNAME', username: trimmed,
        })
        if (res.error) {
            setUserError(res.error)
            setUserSave('error')
        } else {
            setUserSave('success')
            setTimeout(() => setUserSave('idle'), 2500)
        }
    }

    /* ── Changer le mot de passe ── */
    const handleChangePassword = async () => {
        setPwdError(null)
        if (!currentPwd || !newPwd || !confirmPwd) {
            setPwdError('Remplis tous les champs.')
            setPwdStatus('error')
            return
        }
        if (newPwd !== confirmPwd) {
            setPwdError('Les nouveaux mots de passe ne correspondent pas.')
            setPwdStatus('error')
            return
        }
        if (newPwd.length < 6) {
            setPwdError('Le mot de passe doit contenir au moins 6 caractères.')
            setPwdStatus('error')
            return
        }
        setPwdStatus('loading')
        const res = await sendToBackground<{ success: boolean; error?: string }>({
            type: 'UPDATE_PASSWORD', currentPwd, newPwd,
        })
        if (res.error) {
            setPwdError(res.error)
            setPwdStatus('error')
        } else {
            setPwdStatus('success')
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
            setTimeout(() => { setPwdStatus('idle'); setShowPwdForm(false) }, 2000)
        }
    }

    /* ── Déconnexion protégée par mot de passe ──
       Un visiteur qui utilise le navigateur ne connaît pas
       le mot de passe → impossible de déconnecter le compte.
    ── */
    const handleLogout = async () => {
        if (!logoutPassword.trim()) {
            setLogoutError('Entre ton mot de passe pour confirmer.')
            return
        }
        setLogoutLoading(true)
        setLogoutError(null)
        // Vérifier le mot de passe avant de déconnecter
        const res = await sendToBackground<{ success?: boolean; error?: string }>({
            type: 'VERIFY_PASSWORD', password: logoutPassword,
        })
        if (res.error) {
            setLogoutError('Mot de passe incorrect.')
            setLogoutLoading(false)
            return
        }
        await sendToBackground({ type: 'SIGN_OUT' })
        window.location.href = chrome.runtime.getURL('src/auth/index.html')
    }

    /* ── Suppression définitive avec vérification du mot de passe ── */
    const handleDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            setDeleteError('Entre ton mot de passe pour confirmer.')
            return
        }
        setDeleteLoading(true)
        setDeleteError(null)
        const res = await sendToBackground<{ success?: boolean; error?: string }>({
            type: 'DELETE_ACCOUNT', password: deletePassword,
        })
        if (res.error) {
            setDeleteError(res.error)
            setDeleteLoading(false)
        } else {
            window.location.href = chrome.runtime.getURL('src/auth/index.html')
        }
    }

    const plan     = state?.subscription?.plan ?? 'FREE'
    const isActive = location.pathname === '/account'

    return (
        <div id="tab-account" className={`tab-pane ${isActive && 'active'} max-w-xl mx-auto`}>

            {/* ── En-tête profil ── */}
            <div className="text-center mb-8">
                <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="w-full h-full rounded-full bg-zinc-900 border border-zinc-700 overflow-hidden shadow-2xl flex items-center justify-center">
                        {avatarUrl
                            ? <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                            : <Icon icon="solar:user-circle-bold" className="text-zinc-500 text-4xl" />
                        }
                    </div>
                    <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${PLAN_COLOR[plan] ?? PLAN_COLOR.FREE}`}>
                        {PLAN_LABEL[plan] ?? plan}
                    </span>
                </div>
                <h2 className="text-base font-semibold text-white mt-3">
                    {state?.auth?.userName ?? 'Utilisateur'}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">{state?.auth?.email ?? '—'}</p>
                {state?.isPremium && state.subscription?.expiresAt && plan !== 'LIFETIME' && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                        Expire le <span className="text-zinc-400">{formatExpiry(state.subscription.expiresAt)}</span>
                    </p>
                )}
                {plan === 'LIFETIME' && (
                    <p className="text-[10px] text-emerald-600 mt-1">✦ Accès à vie</p>
                )}
            </div>

            <div className="space-y-4">

                {/* ── Avatar ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Avatar</p>
                    <div className="grid grid-cols-6 gap-2">
                        {AVATARS.map(url => (
                            <button
                                key={url}
                                onClick={() => handleAvatarSelect(url)}
                                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                                    avatarUrl === url
                                        ? 'border-white scale-110 shadow-lg shadow-white/10'
                                        : 'border-zinc-700 hover:border-zinc-500'
                                }`}
                            >
                                <img src={url} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Nom d'utilisateur ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Nom d'utilisateur</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateUsername()}
                            placeholder="Ton nom d'utilisateur"
                            className="flex-1 bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                        />
                        <button
                            onClick={handleUpdateUsername}
                            disabled={userSaveStatus === 'loading' || !newUsername.trim() || newUsername.trim() === state?.auth?.userName}
                            className="px-4 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                        >
                            {userSaveStatus === 'loading'
                                ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                : userSaveStatus === 'success'
                                    ? <><Icon icon="solar:check-circle-linear" width="12" className="text-emerald-600" /> Sauvegardé</>
                                    : 'Modifier'
                            }
                        </button>
                    </div>
                    {userSaveStatus === 'error' && userSaveError && (
                        <p className="text-[10px] text-rose-400 flex items-center gap-1">
                            <Icon icon="solar:danger-circle-linear" width="11" /> {userSaveError}
                        </p>
                    )}
                </div>

                {/* ── Mot de passe ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Mot de passe</p>
                        <button
                            onClick={() => { setShowPwdForm(v => !v); setPwdStatus('idle'); setPwdError(null) }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            {showPwdForm ? 'Annuler' : 'Modifier'}
                        </button>
                    </div>

                    {!showPwdForm && <p className="text-xs text-zinc-600">••••••••</p>}

                    {showPwdForm && (
                        <div className="space-y-2">
                            <div className="relative group">
                                <Icon icon="solar:lock-password-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={currentPwd}
                                    onChange={e => setCurrentPwd(e.target.value)}
                                    placeholder="Mot de passe actuel"
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="relative group">
                                <Icon icon="solar:lock-keyhole-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={newPwd}
                                    onChange={e => setNewPwd(e.target.value)}
                                    placeholder="Nouveau mot de passe"
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="relative group">
                                <Icon icon="solar:lock-keyhole-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={confirmPwd}
                                    onChange={e => setConfirmPwd(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                                    placeholder="Confirmer le nouveau mot de passe"
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            {pwdStatus === 'error' && pwdError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                    <Icon icon="solar:danger-circle-linear" width="11" /> {pwdError}
                                </p>
                            )}
                            <button
                                onClick={handleChangePassword}
                                disabled={pwdStatus === 'loading' || pwdStatus === 'success'}
                                className="w-full py-2 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-1"
                            >
                                {pwdStatus === 'loading'
                                    ? <><Icon icon="svg-spinners:ring-resize" width="12" /> Mise à jour…</>
                                    : pwdStatus === 'success'
                                        ? <><Icon icon="solar:check-circle-linear" width="12" className="text-emerald-600" /> Mot de passe mis à jour</>
                                        : 'Mettre à jour le mot de passe'
                                }
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Actions compte ── */}
                <div className="flex flex-col gap-2 pt-2">

                    {/* ── Déconnexion — protégée par mot de passe ── */}
                    {logoutStep === 'idle' && (
                        <button
                            onClick={() => setLogoutStep('confirm')}
                            className="w-full py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:logout-linear" width="14" />
                            Se déconnecter
                        </button>
                    )}

                    {logoutStep === 'confirm' && (
                        <div className="space-y-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                            <div className="flex items-start gap-2">
                                <Icon icon="solar:danger-triangle-linear" className="text-amber-400 shrink-0 mt-0.5" width="14" />
                                <p className="text-xs text-amber-300/80">
                                    Confirmer la déconnexion ? Ton mot de passe est requis pour protéger le compte.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLogoutStep('idle'); setLogoutError(null) }}
                                    className="flex-1 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => setLogoutStep('password')}
                                    className="flex-1 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg border border-zinc-600 transition-colors"
                                >
                                    Continuer
                                </button>
                            </div>
                        </div>
                    )}

                    {logoutStep === 'password' && (
                        <div className="space-y-2">
                            <input
                                type="password"
                                value={logoutPassword}
                                onChange={e => { setLogoutPassword(e.target.value); setLogoutError(null) }}
                                onKeyDown={e => e.key === 'Enter' && handleLogout()}
                                placeholder="Ton mot de passe"
                                autoFocus
                                className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                            />
                            {logoutError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1.5">
                                    <Icon icon="solar:danger-circle-linear" width="11" />
                                    {logoutError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLogoutStep('idle'); setLogoutPassword(''); setLogoutError(null) }}
                                    className="flex-1 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={logoutLoading}
                                    className="flex-1 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-lg border border-zinc-600 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {logoutLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : <Icon icon="solar:logout-linear" width="12" />
                                    }
                                    Déconnecter
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Suppression — étape 0 : bouton initial ── */}
                    {deleteStep === 'idle' && (
                        <button
                            onClick={() => setDeleteStep('confirm')}
                            className="w-full py-2.5 rounded-lg border border-rose-900/30 text-rose-500 hover:bg-rose-950/30 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:trash-bin-trash-linear" width="14" />
                            Supprimer mon compte
                        </button>
                    )}

                    {/* ── Suppression — étape 1 : avertissement détaillé ── */}
                    {deleteStep === 'confirm' && (
                        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 space-y-3">
                            <div className="flex items-start gap-2">
                                <Icon icon="solar:danger-triangle-linear" className="text-rose-400 shrink-0 mt-0.5" width="16" />
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold text-rose-300">Suppression définitive du compte</p>
                                    <p className="text-[10px] text-rose-400/80 leading-relaxed">
                                        Cette action est <strong className="text-rose-300">irréversible</strong>. Les éléments suivants seront définitivement supprimés :
                                    </p>
                                    <ul className="text-[10px] text-rose-400/70 space-y-0.5">
                                        <li>• Tes identifiants (email, mot de passe)</li>
                                        <li>• Ton abonnement et son historique</li>
                                        <li>• Toutes tes données de compte</li>
                                    </ul>
                                    <p className="text-[10px] text-zinc-600 mt-1">
                                        Tes règles de blocage locales resteront sur cet appareil.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDeleteStep('idle')}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => setDeleteStep('password')}
                                    className="flex-1 py-2 rounded-lg bg-rose-900/50 hover:bg-rose-800/60 border border-rose-700/50 text-rose-300 text-xs font-medium transition-colors"
                                >
                                    Continuer →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Suppression — étape 2 : saisie du mot de passe ── */}
                    {deleteStep === 'password' && (
                        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 space-y-3">
                            <p className="text-[11px] text-rose-300 font-medium">Confirme ton identité</p>
                            <p className="text-[10px] text-rose-400/70">
                                Entre ton mot de passe pour finaliser la suppression définitive.
                            </p>
                            <div className="relative group">
                                <Icon icon="solar:lock-password-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-rose-400 transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={e => { setDeletePassword(e.target.value); setDeleteError(null) }}
                                    onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
                                    placeholder="Ton mot de passe"
                                    autoFocus
                                    className="w-full bg-black border border-rose-900/40 focus:border-rose-700/60 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            {deleteError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                    <Icon icon="solar:danger-circle-linear" width="11" /> {deleteError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setDeleteStep('idle'); setDeletePassword(''); setDeleteError(null) }}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading || !deletePassword.trim()}
                                    className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {deleteLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : 'Supprimer définitivement'
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Historique des abonnements ── */}
            <div className="border-t border-white/5 mt-8 pt-8">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Icon icon="solar:bill-list-linear" className="text-zinc-500" />
                    Historique des Abonnements
                </h3>
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-zinc-500 text-xs">
                            <Icon icon="svg-spinners:ring-resize" width="14" /> Chargement…
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Icon icon="solar:bill-list-linear" className="text-zinc-700 text-2xl" />
                            <p className="text-xs text-zinc-600">Aucun abonnement enregistré</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-900 text-[10px] text-zinc-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Plan</th>
                                    <th className="px-4 py-3 font-medium">Statut</th>
                                    <th className="px-4 py-3 font-medium">Expiration</th>
                                    <th className="px-4 py-3 font-medium text-right">Mise à jour</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 bg-black text-xs text-zinc-400">
                                {history.map((row, i) => (
                                    <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLOR[row.plan] ?? PLAN_COLOR.FREE}`}>
                                                {PLAN_LABEL[row.plan] ?? row.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] ${row.is_valid ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                {row.is_valid ? '● Actif' : '○ Expiré'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.expires_at ? formatDate(row.expires_at) : <span className="text-zinc-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-600">
                                            {formatDate(row.updated_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Account