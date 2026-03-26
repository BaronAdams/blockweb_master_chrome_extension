import { useState, useEffect, useRef } from 'react';
import { State } from '@/lib/types';
import { Icon } from "@iconify/react";
import { getRemainingTime, sendToBackground } from '@/lib/utils';
import { LIMITS } from '@/lib/constants';
import logo from '@/assets/blockweb_master_icon.svg'
import "@fontsource/inter/400.css";
import './App.css';

const STORAGE_KEY = "blockweb_master_state";
const pad = (n: number) => n.toString().padStart(2, '0');

export default function App() {
    const [activeTab,   setActiveTab]  = useState<'domains' | 'keywords' | 'whitelist'>('domains');
    const [state,       setState_]     = useState<State | null>(null);
    const [remaining,   setRemaining]  = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [days,  setDays]  = useState(0);
    const [hours, setHours] = useState(0);
    const [mins,  setMins]  = useState(0);

    /* Inputs non-contrôlés — évite la perte de focus sur re-render */
    const domainRef     = useRef<HTMLInputElement>(null);
    const keywordRef    = useRef<HTMLInputElement>(null);
    const whitelistRef  = useRef<HTMLInputElement>(null);

    /* Onglet actif du navigateur */
    const [currentTabDomain, setCurrentTabDomain] = useState<string | null>(null);
    const [tabIsWebPage,     setTabIsWebPage]      = useState<boolean | null>(null); // null = loading
    const [quickBlockStatus, setQuickBlockStatus] = useState<'idle' | 'blocked' | 'dismissed'>('idle');

    /* ── Chargement state + détection onglet actif ── */
    useEffect(() => {
        // @ts-ignore
        chrome.storage.local.get(STORAGE_KEY, (res) => setState_(res[STORAGE_KEY] ?? null));
        const listener = (changes: any) => {
            if (changes[STORAGE_KEY]) setState_(changes[STORAGE_KEY].newValue);
        };
        chrome.storage.onChanged.addListener(listener);

        // Récupérer l'onglet actif pour proposer le blocage rapide
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab?.url) { setTabIsWebPage(false); return; }
            const url = tab.url;
            if (url.startsWith('http://') || url.startsWith('https://')) {
                try {
                    const domain = new URL(url).hostname.replace(/^www\./, '');
                    setCurrentTabDomain(domain);
                    setTabIsWebPage(true);
                } catch { setTabIsWebPage(false); }
            } else {
                // chrome://, extension://, about:, etc.
                setTabIsWebPage(false);
            }
        });

        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    /* ── Sync durée depuis strictDefaultTime ── */
    useEffect(() => {
        if (!state?.strictDefaultTime) return;
        const totalMins = Math.floor(state.strictDefaultTime / 60_000);
        setDays(Math.floor(totalMins / (24 * 60)));
        setHours(Math.floor((totalMins % (24 * 60)) / 60));
        setMins(totalMins % 60);
    }, [state?.strictDefaultTime]);

    /* ── Countdown ── */
    useEffect(() => {
        if (!state?.strictModeUntil) { setRemaining(null); return; }
        const tick = () => {
            const { diffMs, days, hours, minutes, seconds } = getRemainingTime(state.strictModeUntil!);
            if (diffMs <= 0) sendToBackground({ type: 'CHECK_STRICT_EXPIRATION' });
            else             setRemaining({ days, hours, minutes, seconds });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [state?.strictModeUntil]);

    const isPremium             = state?.isPremium ?? false;
    const isStrict              = !!state?.strictModeUntil;
    const isZeroDuration        = days === 0 && hours === 0 && mins === 0;
    const isDomainLimitReached  = !isPremium && (state?.activeBlockedDomains?.length ?? 0) >= LIMITS.FREE.domains;
    const isKeywordLimitReached = !isPremium && (state?.activeBlockedKeywords?.length ?? 0) >= LIMITS.FREE.keywords;
    const frozenDomains         = state?.frozenBlockedDomains  ?? [];
    const frozenKeywords        = state?.frozenBlockedKeywords ?? [];

    const addDomain = async () => {
        const val = domainRef.current?.value.trim();
        if (!val) return;
        await sendToBackground({ type: 'ADD_DOMAIN', domain: val });
        if (domainRef.current) domainRef.current.value = '';
    };

    const addKeyword = async () => {
        const val = keywordRef.current?.value.trim();
        if (!val) return;
        await sendToBackground({ type: 'ADD_KEYWORD', keyword: val });
        if (keywordRef.current) keywordRef.current.value = '';
    };

    const addWhitelistEntry = async () => {
        const val = whitelistRef.current?.value.trim();
        if (!val) return;
        await sendToBackground({ type: 'ADD_WHITE', white: val });
        if (whitelistRef.current) whitelistRef.current.value = '';
    };

    const quickBlockCurrentTab = async () => {
        if (!currentTabDomain) return;
        await sendToBackground({ type: 'ADD_DOMAIN', domain: currentTabDomain });
        setQuickBlockStatus('blocked');
    };

    const handleDays = (v: string) => {
        const d = Number(v);
        if (!isPremium && d >= 1) { setDays(1); setHours(0); setMins(0); }
        else setDays(d);
    };
    const handleHours = (v: string) => {
        if (!isPremium && days >= 1) return;
        if (isPremium && days >= 30) return;
        setHours(Number(v));
    };
    const handleMins = (v: string) => {
        if (!isPremium && days >= 1) return;
        if (isPremium && days >= 30) return;
        setMins(Number(v));
    };

    /* ── Activation atomique ── */
    const startStrict = () => {
        if (isZeroDuration) return;
        const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
        const raw    = ((days * 24 * 60) + (hours * 60) + mins) * 60_000;
        const ms     = Math.min(raw, limits.maxStrictDuration);
        sendToBackground({ type: 'ACTIVATE_STRICT_MODE', time: Date.now() + ms, duration: ms });
    };

    const goToDashboard = () => chrome.tabs.create({ url: '/src/dashboard/index.html' });
    const goToAuthPage = () => chrome.tabs.create({ url: '/src/auth/index.html' });
    const goToPricing   = () => chrome.tabs.create({ url: '/src/dashboard/index.html#/pricing' });

    return (
        <div className="flex flex-col border border-white/10 antialiased selection:bg-amber-500/30 selection:text-amber-200">

            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md z-20">
                <div className="flex items-center gap-2">
                    <img src={logo} className="w-7 h-7 object-cover" alt="logo" />
                    <span className="text-sm font-medium tracking-tight text-white">BlockWeb Master</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {isStrict && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-wider">Strict</span>
                        </div>
                    )}
                    {!state?.auth.isAuthenticated && (
                        <button onClick={goToAuthPage}
                            className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-medium rounded-lg transition-colors">
                            Connexion
                        </button>
                    )}
                    <button onClick={goToDashboard} title="Dashboard"
                        className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                        <Icon icon="solar:chart-square-linear" width="18" />
                    </button>
                </div>
            </header>

            {/* ── Bannière suggestion / avertissement page courante ── */}
            {tabIsWebPage === false && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
                    <Icon icon="solar:info-circle-linear" className="text-zinc-500 shrink-0" width="14" />
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Impossible d'effectuer un blocage sur cette page.
                        Navigue vers un site web pour utiliser cette fonctionnalité.
                    </p>
                </div>
            )}
            {/* Suggestion blocage — site non encore bloqué, pas encore traité */}
            {tabIsWebPage === true && currentTabDomain && quickBlockStatus === 'idle' && !(state?.activeBlockedDomains ?? []).includes(currentTabDomain) && !isStrict && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-rose-500/8 border-b border-rose-500/15">
                    <img src={`https://www.google.com/s2/favicons?domain=${currentTabDomain}&sz=32`}
                        className="w-4 h-4 opacity-70 shrink-0" alt="" />
                    <p className="text-[10px] text-zinc-300 flex-1 truncate min-w-0">
                        Bloquer <strong className="text-white">{currentTabDomain}</strong> ?
                    </p>
                    <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setQuickBlockStatus('dismissed')}
                            className="px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                            Non
                        </button>
                        <button onClick={quickBlockCurrentTab}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1">
                            <Icon icon="solar:forbidden-circle-bold" width="11" />
                            Bloquer
                        </button>
                    </div>
                </div>
            )}
            {/* Site déjà bloqué */}
            {tabIsWebPage === true && currentTabDomain && quickBlockStatus === 'idle' && (state?.activeBlockedDomains ?? []).includes(currentTabDomain) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/8 border-b border-emerald-500/15">
                    <Icon icon="solar:check-circle-bold" className="text-emerald-400 shrink-0" width="13" />
                    <p className="text-[10px] text-emerald-300">
                        <strong>{currentTabDomain}</strong> est déjà bloqué.
                    </p>
                </div>
            )}
            {/* Confirmation après blocage */}
            {quickBlockStatus === 'blocked' && currentTabDomain && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/8 border-b border-emerald-500/15">
                    <Icon icon="solar:check-circle-bold" className="text-emerald-400 shrink-0" width="13" />
                    <p className="text-[10px] text-emerald-300">
                        <strong>{currentTabDomain}</strong> ajouté aux sites bloqués.
                    </p>
                </div>
            )}

            {/* Tabs */}
            <nav className="flex items-center px-4 pt-3 pb-0 gap-5 border-b border-white/5 text-xs font-medium bg-black/20">
                {(['domains', 'keywords', 'whitelist'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                            activeTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}>
                        {tab === 'domains' ? 'Domaines' : tab === 'keywords' ? 'Mots-clés' : 'Whitelist'}
                        {tab === 'whitelist' && !isPremium && (
                            <Icon icon="solar:lock-keyhole-linear" width="10" className="text-zinc-600" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Contenu */}
            <main className="flex-1 overflow-y-auto bg-zinc-950">

                {/* Domaines */}
                {activeTab === 'domains' && (
                    <div className="p-4 space-y-3">
                        <div className="relative">
                            <input ref={domainRef} type="text"
                                onKeyDown={e => { if (e.key === 'Enter') addDomain(); }}
                                placeholder={isDomainLimitReached ? 'Limite atteinte' : 'ex: facebook.com'}
                                disabled={isDomainLimitReached || isStrict}
                                className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-9 py-2.5 outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600 disabled:opacity-40" />
                            <Icon icon="solar:global-linear" className="absolute left-3 top-2.5 text-zinc-600" width="15" />
                            <button onClick={addDomain} disabled={isDomainLimitReached || isStrict}
                                className="absolute right-2.5 top-2 p-0.5 text-zinc-500 hover:text-white disabled:opacity-40 transition-colors">
                                <Icon icon="solar:arrow-right-linear" width="16" />
                            </button>
                        </div>
                        {isDomainLimitReached && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Icon icon="solar:info-circle-linear" className="text-amber-500 shrink-0" width="13" />
                                <p className="text-[10px] text-amber-200 flex-1">
                                    Limite ({LIMITS.FREE.domains}/{LIMITS.FREE.domains}) —{' '}
                                    <button onClick={goToPricing} className="underline">Upgrader</button>
                                </p>
                            </div>
                        )}
                        <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                            {(state?.activeBlockedDomains.length ?? 0) === 0 ? (
                                <li className="flex flex-col items-center py-8 text-zinc-700 border border-dashed border-zinc-800 rounded-lg gap-2">
                                    <Icon icon="mynaui:globe" width="22" />
                                    <span className="text-xs">Aucun site bloqué</span>
                                </li>
                            ) : state?.activeBlockedDomains.map((domain, i) => (
                                <li key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800/50 group hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} className="w-4 h-4 opacity-60" alt="" />
                                        <span className="text-xs text-zinc-300">{domain}</span>
                                    </div>
                                    <button disabled={isStrict}
                                        onClick={() => sendToBackground({ type: 'REMOVE_DOMAIN', domain })}
                                        className="text-zinc-700 hover:text-rose-500 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100">
                                        <Icon icon="solar:trash-bin-trash-linear" width="13" />
                                    </button>
                                </li>
                            ))}
                            {/* Frozen domains — flouées */}
                            {frozenDomains.map((domain, i) => (
                                <li key={`frozen_${i}`}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/40 blur-[1.5px] pointer-events-none select-none opacity-50">
                                    <div className="flex items-center gap-2">
                                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} className="w-4 h-4 opacity-40" alt="" />
                                        <span className="text-xs text-zinc-500">{domain}</span>
                                    </div>
                                    <Icon icon="solar:lock-keyhole-linear" className="text-amber-500/60" width="12" />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Mots-clés */}
                {activeTab === 'keywords' && (
                    <div className="p-4 space-y-3">
                        <div className="relative">
                            <input ref={keywordRef} type="text"
                                onKeyDown={e => { if (e.key === 'Enter') addKeyword(); }}
                                placeholder={isKeywordLimitReached ? 'Limite atteinte' : 'ex: distractions'}
                                disabled={isKeywordLimitReached || isStrict}
                                className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-9 py-2.5 outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600 disabled:opacity-40" />
                            <Icon icon="solar:text-field-linear" className="absolute left-3 top-2.5 text-zinc-600" width="15" />
                            <button onClick={addKeyword} disabled={isKeywordLimitReached || isStrict}
                                className="absolute right-2.5 top-2 p-0.5 text-zinc-500 hover:text-white disabled:opacity-40 transition-colors">
                                <Icon icon="solar:arrow-right-linear" width="16" />
                            </button>
                        </div>
                        {isKeywordLimitReached && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Icon icon="solar:info-circle-linear" className="text-amber-500 shrink-0" width="13" />
                                <p className="text-[10px] text-amber-200 flex-1">
                                    Limite atteinte —{' '}
                                    <button onClick={goToPricing} className="underline">Upgrader</button>
                                </p>
                            </div>
                        )}
                        <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                            {(state?.activeBlockedKeywords.length ?? 0) === 0 ? (
                                <li className="flex flex-col items-center py-8 text-zinc-700 border border-dashed border-zinc-800 rounded-lg gap-2">
                                    <Icon icon="tabler:hash" width="22" />
                                    <span className="text-xs">Aucun mot-clé bloqué</span>
                                </li>
                            ) : state?.activeBlockedKeywords.map((keyword, i) => (
                                <li key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800/50 group hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-600 font-mono text-xs">#</span>
                                        <span className="text-xs text-zinc-300">{keyword}</span>
                                    </div>
                                    <button disabled={isStrict}
                                        onClick={() => sendToBackground({ type: 'REMOVE_KEYWORD', keyword })}
                                        className="text-zinc-700 hover:text-rose-500 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100">
                                        <Icon icon="solar:trash-bin-trash-linear" width="13" />
                                    </button>
                                </li>
                            ))}
                            {/* Frozen keywords — flouées */}
                            {frozenKeywords.map((keyword, i) => (
                                <li key={`frozen_kw_${i}`}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/40 blur-[1.5px] pointer-events-none select-none opacity-50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-600/50 font-mono text-xs">#</span>
                                        <span className="text-xs text-zinc-500">{keyword}</span>
                                    </div>
                                    <Icon icon="solar:lock-keyhole-linear" className="text-amber-500/60" width="12" />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Whitelist */}
                {activeTab === 'whitelist' && (
                    <div className="p-4">
                        {!isPremium ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <Icon icon="solar:lock-keyhole-minimalistic-linear" className="text-amber-400" width="22" />
                                </div>
                                <div>
                                    <h3 className="text-white text-xs font-semibold mb-1">Whitelist Premium</h3>
                                    <p className="text-zinc-600 text-[10px] leading-relaxed">Autorisez certains sites malgré les blocages.</p>
                                </div>
                                <button onClick={goToPricing}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors">
                                    Débloquer
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {/* Input ajout whitelist */}
                                <div className="relative">
                                    <input ref={whitelistRef} type="text"
                                        onKeyDown={e => { if (e.key === 'Enter') addWhitelistEntry(); }}
                                        placeholder="ex: wikipedia.org"
                                        disabled={isStrict}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-9 py-2.5 outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600 disabled:opacity-40" />
                                    <Icon icon="solar:shield-check-linear" className="absolute left-3 top-2.5 text-zinc-600" width="15" />
                                    <button onClick={addWhitelistEntry} disabled={isStrict}
                                        className="absolute right-2.5 top-2 p-0.5 text-zinc-500 hover:text-white disabled:opacity-40 transition-colors">
                                        <Icon icon="solar:arrow-right-linear" width="16" />
                                    </button>
                                </div>
                                {(state?.whitelist.length ?? 0) === 0 ? (
                                    <div className="flex flex-col items-center py-6 text-zinc-700 border border-dashed border-zinc-800 rounded-lg gap-2">
                                        <Icon icon="solar:shield-check-linear" width="22" />
                                        <span className="text-xs">Aucun site en liste blanche</span>
                                    </div>
                                ) : state?.whitelist.map((w, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg group">
                                        <span className="text-xs text-zinc-300">{w}</span>
                                        <button
                                            onClick={() => sendToBackground({ type: 'REMOVE_WHITE', index: i })}
                                            className="text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Icon icon="solar:trash-bin-trash-linear" width="13" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-zinc-900/80 backdrop-blur-md border-t border-white/5 p-4 z-20 space-y-3">

                {/* Countdown si actif */}
                {remaining ? (
                    <div className="bg-zinc-950/80 rounded-xl border border-rose-500/20 overflow-hidden">
                        <div className="h-0.5 bg-rose-500 animate-pulse" />
                        <div className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Icon icon="solar:lock-password-bold" className="text-rose-400" width="12" />
                                <span className="text-[9px] font-semibold text-rose-300 uppercase tracking-wider">Mode Strict Actif</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {[
                                    { val: remaining.days,    label: 'j'   },
                                    { val: remaining.hours,   label: 'h'   },
                                    { val: remaining.minutes, label: 'min' },
                                    { val: remaining.seconds, label: 's'   },
                                ].map(({ val, label }) => (
                                    <div key={label} className="flex flex-col items-center bg-black/30 rounded-lg py-2 border border-zinc-800">
                                        <span className="text-sm font-mono font-bold text-white tabular-nums">{pad(val)}</span>
                                        <span className="text-[8px] text-zinc-600">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Configuration mode strict */
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Icon icon="solar:shield-warning-bold" className="text-zinc-500" width="13" />
                                <span className="text-[10px] font-medium text-zinc-400">Mode Strict</span>
                            </div>
                            <span className="text-[9px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                Max {isPremium ? '30j' : '24h'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <div>
                                <p className="text-[9px] text-zinc-600 text-center mb-0.5">Jours</p>
                                <select value={days} onChange={e => handleDays(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white text-[10px] rounded-lg py-2 outline-none cursor-pointer text-center appearance-none">
                                    {!isPremium
                                        ? [0, 1].map(d => <option key={d} value={d}>{pad(d)} j</option>)
                                        : Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{pad(i)} j</option>)
                                    }
                                </select>
                            </div>
                            <div>
                                <p className="text-[9px] text-zinc-600 text-center mb-0.5">Heures</p>
                                <select value={hours} onChange={e => handleHours(e.target.value)}
                                    disabled={(!isPremium && days >= 1) || (isPremium && days >= 30)}
                                    className="w-full disabled:opacity-30 bg-zinc-950 border border-zinc-800 text-white text-[10px] rounded-lg py-2 outline-none cursor-pointer text-center appearance-none">
                                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{pad(i)} h</option>)}
                                </select>
                            </div>
                            <div>
                                <p className="text-[9px] text-zinc-600 text-center mb-0.5">Min</p>
                                <select value={mins} onChange={e => handleMins(e.target.value)}
                                    disabled={(!isPremium && days >= 1) || (isPremium && days >= 30)}
                                    className="w-full disabled:opacity-30 bg-zinc-950 border border-zinc-800 text-white text-[10px] rounded-lg py-2 outline-none cursor-pointer text-center appearance-none">
                                    {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{pad(i)} min</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={startStrict} disabled={isZeroDuration}
                            className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-500 text-white">
                            <Icon icon="solar:shield-warning-bold" width="12" />
                            Activer le Mode Strict
                        </button>
                    </div>
                )}

                {/* CTA Premium */}
                {isPremium ? (
                    <button className="w-full py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium flex items-center justify-center gap-2 cursor-default">
                        <Icon icon="solar:verified-check-bold" className="text-emerald-400" width="15" />
                        Plan Premium Actif
                    </button>
                ) : (
                    <button onClick={goToPricing}
                        className="w-full py-2.5 rounded-xl premium-gradient text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all">
                        <Icon icon="solar:crown-star-bold" width="15" />
                        Passer au Premium
                    </button>
                )}

                <p className="text-center text-[9px] text-zinc-700">
                    v1.0.2 • <span className="hover:text-zinc-500 cursor-pointer">Support</span>
                </p>
            </footer>
        </div>
    );
}