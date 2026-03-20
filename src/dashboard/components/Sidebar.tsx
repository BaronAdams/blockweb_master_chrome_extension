import React from 'react'
import { Icon } from "@iconify/react";
import logo from '@/assets/blockweb_master_icon.svg'
import { useLocation, useNavigate } from 'react-router-dom';
import { useStateContext } from '@/context/GlobalStateContext';


const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { state, avatarUrl } = useStateContext()

    const handlePlanClick = () => {
        if (!state?.isPremium) navigate('/pricing');
    }

    return (
        <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col justify-between h-full z-20 shrink-0 hidden md:flex">
            <div>
                {/* <!-- Logo --> */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
                        {/* <Icon icon="solar:shield-check-linear" className="text-white" width="18" /> */}
                        <img src={logo} className="w-6 h-6 object-cover" />
                    </div>

                    <span className="text-sm font-medium tracking-tight text-white">BlockWeb Master</span>
                </div>

                {/* <!-- Navigation --> */}
                <nav className="p-4 space-y-1">
                    <button onClick={() => navigate('/')} id="nav-analytics" className={`tab-btn ${location.pathname == '/' && 'active'} w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 rounded-lg hover:bg-zinc-900 hover:text-zinc-200 transition-all`}>
                        <Icon icon="solar:chart-square-linear" width="18" className={location.pathname == '/' ? 'text-white' : ''} />
                        Vue d'ensemble
                    </button>
                    <button onClick={() => navigate('/block-lists')} id="nav-lists" className={`tab-btn ${location.pathname == '/block-lists' && 'active'} w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 rounded-lg hover:bg-zinc-900 hover:text-zinc-200 transition-all`}>
                        <Icon icon="solar:list-check-linear" width="18" className={location.pathname == '/block-lists' ? 'text-white' : ''} />
                        Listes de Contrôle
                    </button>
                    <button onClick={() => navigate('/profiles')} id="nav-profiles" className={`tab-btn ${location.pathname.includes('profile') && 'active'} w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 rounded-lg hover:bg-zinc-900 hover:text-zinc-200 transition-all`}>
                        <Icon icon="solar:hourglass-line-linear" width="18" className={location.pathname.includes('profile') ? 'text-white' : ''} />
                        Profils Limiteurs
                    </button>
                    <button onClick={() => navigate('/pricing')} id="nav-pricing" className={`tab-btn ${location.pathname == '/pricing' && 'active'} w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 rounded-lg hover:bg-zinc-900 hover:text-zinc-200 transition-all`}>
                        <Icon icon="solar:tag-price-linear" width="18" className={location.pathname == '/pricing' ? 'text-white' : ''} />
                        Abonnements
                    </button>
                    <button onClick={() => navigate('/strict-mode-settings')} id="nav-strict-mode-settings" className={`tab-btn ${location.pathname == '/strict-mode-settings' && 'active'} w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 rounded-lg hover:bg-zinc-900 hover:text-zinc-200 transition-all`}>
                        <Icon icon="solar:settings-linear" width="18" className={location.pathname == '/strict-mode-settings' ? 'text-white' : ''} />
                        Configuration
                    </button>
                </nav>
            </div>

            {/* <!-- Bottom Section: Subscription & Profile --> */}
            <div className="border-t border-white/5">
                {/* <!-- Premium Banner --> */}
                <div className="p-4 pb-2">
                    <button onClick={handlePlanClick} id="sidebar-plan-card" className="group w-full p-3 rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 hover:border-amber-500/50 transition-all text-left relative overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between mb-1 relative z-10">
                            <span className="text-xs font-medium text-white">Plan Actuel</span>
                            <span id="user-badge" className={state?.isPremium ? "text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded" : "text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700"}>
                                {state?.isPremium ? 'PRO' : 'Free'}
                            </span>
                        </div>
                        <p id="plan-cta" className="text-[10px] text-zinc-500 relative z-10">{state?.isPremium ? 'Gérer' : 'Upgrade'}</p>
                    </button>
                </div>

                {/* <!-- User Profile Button --> */}
                {state?.auth.isAuthenticated && (
                    <div className="p-4 pt-2">
                        <button onClick={() => navigate('/account')} id="nav-account" className={`tab-btn ${location.pathname == '/account' && 'bg-zinc-900'} w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition-all group`}>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-zinc-400 group-hover:text-white overflow-hidden relative user-avatar-container">
                                {avatarUrl?.length ? (
                                    <img id="sidebar-avatar-img" src={avatarUrl} className="w-full h-full object-cover" />
                                ) : 
                                (
                                    <Icon id="sidebar-avatar-icon" icon="solar:user-linear" width="16" />
                                )}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p id="sidebar-username" className="text-xs font-medium text-white truncate">{state?.auth?.userName}</p>
                                <p className="text-[10px] text-zinc-500 truncate">Gérer le compte</p>
                            </div>
                            <Icon icon="solar:settings-linear" className="text-zinc-600 group-hover:text-zinc-400" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    )
}

export default Sidebar