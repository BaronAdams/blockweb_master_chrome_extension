import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useStateContext } from '@/context/GlobalStateContext';
import { Toaster } from "@/components/ui/sonner"
import { useEffect } from 'react'
import { sendToBackground } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const Layout = () => {
    const t  = useT('sidebar')
    const tp = useT('popup')
    const ts = useT('strictMode')
    const tc = useT('common')
    const { state } = useStateContext();
    const location = useLocation();

    /* ── Vérification d'expiration du mode strict ──────────────────────────
       Ce check tourne dans le Layout (toujours monté) toutes les secondes.
       Sans ça, l'expiration n'est détectée que si l'utilisateur est sur la
       page StrictModeSettings — le seul endroit où le countdown existait.
    ─────────────────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!state?.strictModeUntil) return

        const id = setInterval(() => {
            if (!state.strictModeUntil) return
            const remaining = state.strictModeUntil - Date.now()
            if (remaining <= 0) {
                sendToBackground({ type: 'CHECK_STRICT_EXPIRATION' })
            }
        }, 1000)

        return () => clearInterval(id)
    }, [state?.strictModeUntil])

    const titles: Record<string, string> = {
        '/': t('analytics'), '/block-lists': t('blockLists'), '/profiles': t('profiles'),
        '/pricing': t('pricing'), '/strict-mode-settings': ts('title'), '/account': tc('manage'),
        'profile-create': t('profiles'), 'profile-edit': t('profiles'), 'profile-detail': t('profiles')
    };

    /* ── Ouvrir le dashboard ── */
    const openAuthpage = () => {
        window.location.href = chrome.runtime.getURL('src/auth/index.html')
    };
    // const openDashboard = () => {
    //     chrome.tabs.create({ url: chrome.runtime.getURL("src/dashboard/index.html") });
    // };

    return (
        <>
            <Toaster />
            <div className="h-screen w-screen overflow-hidden flex antialiased selection:bg-amber-500/30 selection:text-amber-200">
                {/* <!-- SIDEBAR --> */}
                <Sidebar />
                {/* <!-- MAIN CONTENT --> */}
                <main className="flex-1 h-full overflow-y-auto bg-black relative">
                    {/* <!-- TOP BAR --> */}
                    <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                        {/* @ts-ignore */}
                        <h1 id="page-title" className="text-sm font-medium text-white">{titles[location.pathname]}</h1>
                        <div className='flex gap-3'>
                            {/* Auth Button Actions */}
                            {!state?.auth.isAuthenticated && (
                                <div id='auth-buttons'>
                                    <button
                                        onClick={() => openAuthpage()}
                                        className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-medium rounded-lg transition-colors"
                                    >
                                        {/* <Icon icon="solar:add-square-linear" width="16" /> */}
                                        {tp('login')}
                                    </button>
                                </div>
                            )}
                            {/* Strict Mode Badge */}
                            <div className="flex items-center gap-4">
                                <div id="strict-status-indicator" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                                    <div id="strict-dot" className={state?.strictModeUntil ?
                                        "w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-colors"
                                        : "w-2 h-2 rounded-full bg-zinc-600 transition-colors"}></div>
                                    <span id="strict-text" className={`text-[10px] font-medium ${state?.strictModeUntil ? 'text-green-500' : 'text-zinc-500'} uppercase tracking-wider`}>
                                        {state?.strictModeUntil ? ts('active') : ts('inactive')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </header>
                    <div className="p-8 max-w-5xl mx-auto pb-20">
                        <Outlet />
                    </div>
                </main>
            </div>
        </>
    )
}

export default Layout