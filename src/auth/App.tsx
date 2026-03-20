import { Icon } from '@iconify/react'
import { useRef, useState } from 'react'
import logo from '@/assets/blockweb_master_icon.svg'
import "@fontsource/inter/400.css"
import './App.css'

/* =========================================================
   TYPES
========================================================= */
type Mode   = 'login' | 'register' | 'forgot'
type Status = 'idle' | 'loading' | 'error' | 'success'

/* =========================================================
   MESSAGES D'ERREUR CONTEXTUELS
   Centralisés ici pour être cohérents et maintenables
========================================================= */
const LOGIN_ERRORS: Record<string, string> = {
    'Invalid login credentials':          'Adresse email ou mot de passe incorrect.',
    'Email not confirmed':                 'Compte non activé.',   // géré via notConfirmedEmail
    'Too many requests':                   'Trop de tentatives. Réessaie dans quelques minutes.',
    'User not found':                      'Aucun compte trouvé avec cette adresse email.',
}

const REGISTER_ERRORS: Record<string, string> = {
    'User already registered':             'Un compte existe déjà avec cette adresse email. Connecte-toi ou utilise "Mot de passe oublié".',
    'already registered':                  'Un compte existe déjà avec cette adresse email. Connecte-toi ou utilise "Mot de passe oublié".',
    'already been registered':             'Un compte existe déjà avec cette adresse email. Connecte-toi ou utilise "Mot de passe oublié".',
    'Password should be at least 6':       'Le mot de passe doit contenir au moins 6 caractères.',
    'Unable to validate email address':    'Adresse email invalide.',
    'Signup is disabled':                  'Les inscriptions sont temporairement désactivées.',
}

function resolveError(raw: string, map: Record<string, string>): string {
    for (const [key, msg] of Object.entries(map)) {
        if (raw.toLowerCase().includes(key.toLowerCase())) return msg
    }
    // Fallback générique
    return 'Une erreur est survenue. Veuillez réessayer.'
}

/* =========================================================
   HELPER — background service worker
========================================================= */
async function sendToBackground(
    msg: Record<string, unknown>
): Promise<{ error: string | null; needsConfirmation?: boolean; notConfirmed?: boolean }> {
    return new Promise((resolve) =>
        chrome.runtime.sendMessage(msg, (r) => resolve(r ?? { error: 'Pas de réponse du background.' }))
    )
}

/* =========================================================
   COMPOSANT
========================================================= */
export default function App() {
    // const { state } = useStateContext()
    const [mode,   setMode]   = useState<Mode>('login')
    const [status, setStatus] = useState<Status>('idle')

    // Message d'erreur classique (rouge)
    const [errorMsg,  setError]   = useState<string | null>(null)
    // Message informatif persistant (vert) — survit au switch de mode
    const [infoMsg,   setInfo]    = useState<string | null>(null)

    // Email non confirmé — survit aussi au switch register → login
    const [notConfirmedEmail, setNotConfirmedEmail] = useState<string | null>(null)
    const [resendLoading,     setResendLoading]     = useState(false)
    const [resendDone,        setResendDone]         = useState(false)

    /* ── Champs login ── */
    const [loginEmailValue, setLoginEmailValue] = useState('')
    const loginPassword = useRef<HTMLInputElement>(null)

    /* ── Champs register ── */
    const regUsername = useRef<HTMLInputElement>(null)
    const regEmail    = useRef<HTMLInputElement>(null)
    const regPassword = useRef<HTMLInputElement>(null)

    /* ── Champ forgot ── */
    const forgotEmail = useRef<HTMLInputElement>(null)

    /* ── Aller au dashboard ── */
    const goToDashboard = () => {
        window.location.href = chrome.runtime.getURL('src/dashboard/index.html')
    }

    /* ── Switch de tab ──
       infoMsg et notConfirmedEmail PERSISTENT lors du switch register → login
       (le message "vérifie ton email" doit rester visible après le switch)       */
    const switchMode = (next: Mode) => {
        if (next === mode) return
        setError(null)
        setStatus('idle')
        // On efface l'info et le notConfirmed SEULEMENT si on ne vient pas de register
        // ou si on va vers forgot (où ces messages n'ont plus de sens)
        if (next === 'forgot') {
            setInfo(null)
            setNotConfirmedEmail(null)
            setResendDone(false)
        }
        setMode(next)
    }

    /* ── Submit login ── */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setInfo(null)
        setNotConfirmedEmail(null)
        setStatus('loading')

        const result = await sendToBackground({
            type:     'SIGN_IN',
            email:    loginEmailValue,
            password: loginPassword.current?.value,
        })

        // console.log("Misa à jour du state", state)
        // setInterval(()=>console.log("Temps d'attente pour voir la souscription"),20000)

        if (result.notConfirmed) {
            setStatus('error')
            setNotConfirmedEmail(loginEmailValue)
            return
        }
        if (result.error) {
            setError(resolveError(result.error, LOGIN_ERRORS))
            setStatus('error')
            return
        }
        setStatus('success')
        goToDashboard()
    }

    /* ── Submit register ── */
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setInfo(null)
        setStatus('loading')

        const result = await sendToBackground({
            type:     'SIGN_UP',
            username: regUsername.current?.value,
            email:    regEmail.current?.value,
            password: regPassword.current?.value,
        })

        if (result.error) {
            setError(resolveError(result.error, REGISTER_ERRORS))
            setStatus('error')
            return
        }

        if (result.needsConfirmation) {
            // Inscription réussie — switch vers login
            // Email pré-rempli depuis le form d'inscription, password vidé
            const registeredEmail = regEmail.current?.value ?? ''
            setLoginEmailValue(registeredEmail)
            if (loginPassword.current) loginPassword.current.value = ''
            setInfo('Compte créé ! Un email de confirmation a été envoyé à ton adresse. Clique le lien puis connecte-toi.')
            setStatus('idle')
            setMode('login')   // direct — préserve infoMsg
            return
        }

        // Inscription directe (Confirm email désactivé)
        setStatus('success')
        goToDashboard()
    }

    /* ── Renvoyer l'email de confirmation ── */
    const handleResendConfirmation = async () => {
        if (!notConfirmedEmail || resendLoading || resendDone) return
        setResendLoading(true)
        await sendToBackground({ type: 'RESEND_CONFIRMATION', email: notConfirmedEmail })
        setResendLoading(false)
        setResendDone(true)
    }

    /* ── Submit forgot password ── */
    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setInfo(null)
        setStatus('loading')

        const result = await sendToBackground({
            type:  'RESET_PASSWORD',
            email: forgotEmail.current?.value,
        })

        if (result.error) {
            setError('Impossible d\'envoyer le lien. Vérifie l\'adresse email et réessaie.')
            setStatus('error')
            return
        }
        setStatus('success')
        setInfo('Un lien de réinitialisation a été envoyé à ton adresse email.')
    }

    const isLoading = status === 'loading'

    /* ── Bannières visibles ── */
    const showNotConfirmed = !!notConfirmedEmail
    const showError        = !!errorMsg && !showNotConfirmed
    const showInfo         = !!infoMsg  && !showNotConfirmed

    return (
        <main className="h-screen w-screen overflow-hidden antialiased selection:bg-amber-500/30 selection:text-amber-200 bg-black">
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">

                {/* Grille de fond */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                <div className="w-full max-w-[380px] relative z-10">

                    {/* ── Header — logo + titre cliquables vers le dashboard ── */}
                    <div className="text-center mb-8">
                        <button
                            onClick={goToDashboard}
                            className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl shadow-zinc-900/50 hover:border-white/20 transition-colors"
                            title="Aller au tableau de bord"
                        >
                            <img src={logo} className="size-10 object-cover" alt="logo" />
                        </button>
                        <button
                            onClick={goToDashboard}
                            className="text-xl font-medium text-white tracking-tight mb-2 hover:text-zinc-300 transition-colors block mx-auto"
                        >
                            Blockweb Master
                        </button>
                        <p className="text-xs text-zinc-500">
                            {mode === 'forgot'
                                ? 'Réinitialisation du mot de passe'
                                : 'Reprenez le contrôle de votre temps.'
                            }
                        </p>
                    </div>

                    {/* ── Card ── */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">

                        {/* ── Tabs (masqués en mode forgot) ── */}
                        {mode !== 'forgot' && (
                            <div className="grid grid-cols-2 p-1 bg-zinc-900/50 rounded-lg mb-6 border border-zinc-800/50 relative">
                                <span
                                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-zinc-800 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                    style={{ transform: mode === 'login' ? 'translateX(4px)' : 'translateX(calc(100% + 4px))' }}
                                />
                                <button
                                    onClick={() => switchMode('login')}
                                    className={`relative z-10 text-xs font-medium py-2 rounded-md transition-colors duration-200 ${mode === 'login' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Connexion
                                </button>
                                <button
                                    onClick={() => switchMode('register')}
                                    className={`relative z-10 text-xs font-medium py-2 rounded-md transition-colors duration-200 ${mode === 'register' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Inscription
                                </button>
                            </div>
                        )}

                        {/* ── Bannière : email non confirmé (ambre) ── */}
                        <div style={{
                            maxHeight:    showNotConfirmed ? '130px' : '0px',
                            opacity:      showNotConfirmed ? 1 : 0,
                            overflow:     'hidden',
                            transition:   'max-height 0.3s ease, opacity 0.2s ease',
                            marginBottom: showNotConfirmed ? '16px' : '0px',
                        }}>
                            <div className="px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
                                <div className="flex items-start gap-2">
                                    <Icon icon="solar:letter-unread-linear" className="text-amber-400 shrink-0 mt-0.5" width="14" />
                                    <p className="text-[11px] text-amber-300 leading-relaxed">
                                        Ton compte n'est pas encore activé. Vérifie ta boîte mail et clique le lien d'activation envoyé lors de ton inscription.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResendConfirmation}
                                    disabled={resendLoading || resendDone}
                                    className="w-full py-1.5 rounded-md border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {resendLoading
                                        ? <><Icon icon="svg-spinners:ring-resize" width="11" /> Envoi…</>
                                        : resendDone
                                            ? <><Icon icon="solar:check-circle-linear" width="11" /> Email renvoyé !</>
                                            : <><Icon icon="solar:restart-linear" width="11" /> Renvoyer l'email d'activation</>
                                    }
                                </button>
                            </div>
                        </div>

                        {/* ── Bannière : erreur classique (rouge) ── */}
                        <div style={{
                            maxHeight:    showError ? '70px' : '0px',
                            opacity:      showError ? 1 : 0,
                            overflow:     'hidden',
                            transition:   'max-height 0.25s ease, opacity 0.2s ease',
                            marginBottom: showError ? '16px' : '0px',
                        }}>
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <Icon icon="solar:danger-circle-linear" className="text-rose-400 shrink-0" width="14" />
                                <p className="text-[11px] text-rose-300 leading-relaxed">{errorMsg}</p>
                            </div>
                        </div>

                        {/* ── Bannière : info / succès (vert) — persiste entre les modes ── */}
                        <div style={{
                            maxHeight:    showInfo ? '80px' : '0px',
                            opacity:      showInfo ? 1 : 0,
                            overflow:     'hidden',
                            transition:   'max-height 0.25s ease, opacity 0.2s ease',
                            marginBottom: showInfo ? '16px' : '0px',
                        }}>
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <Icon icon="solar:check-circle-linear" className="text-emerald-400 shrink-0 mt-0.5" width="14" />
                                <p className="text-[11px] text-emerald-300 leading-relaxed">{infoMsg}</p>
                            </div>
                        </div>

                        {/* =========================================================
                            MODE FORGOT PASSWORD
                        ========================================================= */}
                        {mode === 'forgot' && (
                            <form onSubmit={handleForgot} className="space-y-4">
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    Entre ton adresse email. Si un compte existe, tu recevras un lien pour définir ton mot de passe.
                                </p>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Email</label>
                                    <div className="relative group">
                                        <Icon icon="solar:letter-linear" className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white" />
                                        <input
                                            ref={forgotEmail}
                                            type="email"
                                            placeholder="exemple@email.com"
                                            autoFocus
                                            className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-white/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || status === 'success'}
                                    className="w-full py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-2 flex items-center justify-center gap-2"
                                >
                                    {isLoading
                                        ? <><Icon icon="svg-spinners:ring-resize" width="14" /> Envoi…</>
                                        : 'Envoyer le lien'
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <Icon icon="solar:arrow-left-linear" width="12" />
                                    Retour à la connexion
                                </button>
                            </form>
                        )}

                        {/* =========================================================
                            MODE LOGIN + REGISTER (formulaires glissants)
                        ========================================================= */}
                        {mode !== 'forgot' && (
                            <div className="relative overflow-hidden">
                                <div
                                    className="flex transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                    style={{ transform: mode === 'login' ? 'translateX(0%)' : 'translateX(-50%)', width: '200%' }}
                                >

                                    {/* ── Formulaire Connexion ── */}
                                    <div className="w-1/2 shrink-0 pr-3">
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Email</label>
                                                <div className="relative group">
                                                    <Icon icon="solar:letter-linear" className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white" />
                                                    <input
                                                        type="email"
                                                        value={loginEmailValue}
                                                        onChange={e => setLoginEmailValue(e.target.value)}
                                                        placeholder="exemple@email.com"
                                                        tabIndex={mode === 'login' ? 0 : -1}
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-white/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Mot de passe</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => switchMode('forgot')}
                                                        className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                                                    >
                                                        Oublié ?
                                                    </button>
                                                </div>
                                                <div className="relative group">
                                                    <Icon icon="solar:lock-password-linear" className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white" />
                                                    <input
                                                        ref={loginPassword}
                                                        type="password"
                                                        placeholder="••••••••"
                                                        tabIndex={mode === 'login' ? 0 : -1}
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-white/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-2 flex items-center justify-center gap-2"
                                            >
                                                {isLoading && mode === 'login'
                                                    ? <><Icon icon="svg-spinners:ring-resize" width="14" /> Connexion…</>
                                                    : 'Se connecter'
                                                }
                                            </button>
                                        </form>
                                    </div>

                                    {/* ── Formulaire Inscription ── */}
                                    <div className="w-1/2 shrink-0 pl-3">
                                        <form onSubmit={handleRegister} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Nom d'utilisateur</label>
                                                <div className="relative group">
                                                    <Icon icon="solar:user-circle-linear" className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white" />
                                                    <input
                                                        ref={regUsername}
                                                        type="text"
                                                        placeholder="Alexandre"
                                                        tabIndex={mode === 'register' ? 0 : -1}
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-white/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Email</label>
                                                <div className="relative group">
                                                    <Icon icon="solar:letter-linear" className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white" />
                                                    <input
                                                        ref={regEmail}
                                                        type="email"
                                                        placeholder="exemple@email.com"
                                                        tabIndex={mode === 'register' ? 0 : -1}
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-white/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Mot de passe</label>
                                                <div className="relative group">
                                                    <Icon icon="solar:lock-password-linear" className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white" />
                                                    <input
                                                        ref={regPassword}
                                                        type="password"
                                                        placeholder="Créer un mot de passe"
                                                        tabIndex={mode === 'register' ? 0 : -1}
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-white/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-2 flex items-center justify-center gap-2"
                                            >
                                                {isLoading && mode === 'register'
                                                    ? <><Icon icon="svg-spinners:ring-resize" width="14" /> Création…</>
                                                    : 'Créer un compte'
                                                }
                                            </button>
                                        </form>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* ── Divider + OAuth (masqués en mode forgot) ── */}
                        {mode !== 'forgot' && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-zinc-800" />
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase">
                                        <span className="bg-zinc-950 px-2 text-zinc-500">Ou continuer avec</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors">
                                        <Icon icon="devicon:google" width="14" /> Google
                                    </button>
                                    <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors">
                                        <Icon icon="devicon:github" width="14" className="invert opacity-80" /> Github
                                    </button>
                                </div>
                            </>
                        )}

                    </div>

                    {/* ── Footer ── */}
                    <p className="text-center text-[10px] text-zinc-600 mt-6">
                        En continuant, vous acceptez nos{' '}
                        <a href="#" className="text-zinc-400 hover:underline">Conditions</a>
                        {' '}et notre{' '}
                        <a href="#" className="text-zinc-400 hover:underline">Politique de confidentialité</a>.
                    </p>
                </div>
            </div>
        </main>
    )
}