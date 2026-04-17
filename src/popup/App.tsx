import { useState, useEffect, useRef } from 'react';
import { State } from '@/lib/types';
import { getLocale, useT } from '@/lib/i18n';
import { getRemainingTime, sendToBackground } from '@/lib/utils';
import { LIMITS } from '@/lib/constants';
import { ArrowRight, BadgeCheckIcon, BanIcon, ChartColumn, CheckCircleIcon, CircleAlert, CrownIcon, FileType, Globe, Hash, LockIcon, LockKeyhole, ShieldAlertIcon, ShieldCheck, Trash2 } from 'lucide-react';
import logo from '@/assets/blockweb_master_icon.svg'
import globeIcon from '@/assets/globe.svg'
import "@fontsource/inter/400.css";
import './App.css';
import SmartImage from '@/components/SmartImage';

const STORAGE_KEY = "blockweb_master_state";
const pad = (n: number) => n.toString().padStart(2, '0');

export default function App() {
    const t = useT('popup');
    const tc = useT('common');

    const [activeTab, setActiveTab] = useState<'domains' | 'keywords' | 'whitelist'>('domains');
    const [state, setState_] = useState<State | null>(null);
    const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);
    const [mins, setMins] = useState(0);

    /* Inputs non-contrôlés — évite la perte de focus sur re-render */
    const domainRef = useRef<HTMLInputElement>(null);
    const keywordRef = useRef<HTMLInputElement>(null);
    const whitelistRef = useRef<HTMLInputElement>(null);

    /* Onglet actif du navigateur */
    const [currentTabDomain, setCurrentTabDomain] = useState<string | null>(null);
    const [tabIsWebPage, setTabIsWebPage] = useState<boolean | null>(null); // null = loading
    const [quickBlockStatus, setQuickBlockStatus] = useState<'idle' | 'blocked' | 'dismissed'>('idle');

    // Dans votre composant racine ou Layout
    useEffect(() => {
        const locale = getLocale()
        if (locale === 'ar') {
            document.documentElement.dir = 'rtl'
            document.documentElement.lang = 'ar'
        } else {
            document.documentElement.dir = 'ltr'
            document.documentElement.lang = locale
        }
    }, [])

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
            else setRemaining({ days, hours, minutes, seconds });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [state?.strictModeUntil]);

    const isPremium = state?.isPremium ?? false;
    const isStrict = !!state?.strictModeUntil;
    const isZeroDuration = days === 0 && hours === 0 && mins === 0;
    const isDomainLimitReached = !isPremium && (state?.activeBlockedDomains?.length ?? 0) >= LIMITS.FREE.domains;
    const isKeywordLimitReached = !isPremium && (state?.activeBlockedKeywords?.length ?? 0) >= LIMITS.FREE.keywords;
    const frozenDomains = state?.frozenBlockedDomains ?? [];
    const frozenKeywords = state?.frozenBlockedKeywords ?? [];

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
        const raw = ((days * 24 * 60) + (hours * 60) + mins) * 60_000;
        const ms = Math.min(raw, limits.maxStrictDuration);
        sendToBackground({ type: 'ACTIVATE_STRICT_MODE', time: Date.now() + ms, duration: ms });
    };

    const goToDashboard = () => chrome.tabs.create({ url: '/src/dashboard/index.html' });
    const goToAuthPage = () => chrome.tabs.create({ url: '/src/auth/index.html' });
    const goToPricing = () => chrome.tabs.create({ url: '/src/dashboard/index.html#/pricing' });

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
                            {t('login')}
                        </button>
                    )}
                    <button onClick={goToDashboard} title="Dashboard"
                        className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                        <ChartColumn width="18" />
                    </button>
                </div>
            </header>

            {/* ── Bannière suggestion / avertissement page courante ── */}
            {tabIsWebPage === false && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
                    <CircleAlert className="text-zinc-500 shrink-0" width="14" />
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                        {t('notAWebPage')}
                    </p>
                </div>
            )}
            {/* Suggestion blocage — site non encore bloqué, pas encore traité */}
            {tabIsWebPage === true && currentTabDomain && quickBlockStatus === 'idle' && !(state?.activeBlockedDomains ?? []).includes(currentTabDomain) && !isStrict && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-rose-500/8 border-b border-rose-500/15">
                    <SmartImage
                        src={`https://www.google.com/s2/favicons?domain=${currentTabDomain}&sz=32`}
                        fallbackSrc={globeIcon}
                        className="w-4 h-4 opacity-70 shrink-0"
                    />
                    <p className="text-[10px] text-zinc-300 flex-1 truncate min-w-0"
                        dangerouslySetInnerHTML={{ __html: t('blockQuestion', currentTabDomain) }}
                    >
                    </p>
                    <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setQuickBlockStatus('dismissed')}
                            className="px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                            {tc('no')}
                        </button>
                        <button onClick={quickBlockCurrentTab}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1">
                            <BanIcon fill='#fff' stroke='currentColor' className='text-rose-400' width="11" />
                            {t('blockCurrent')}
                        </button>
                    </div>
                </div>
            )}
            {/* Site déjà bloqué */}
            {tabIsWebPage === true && currentTabDomain && quickBlockStatus === 'idle' && (state?.activeBlockedDomains ?? []).includes(currentTabDomain) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/8 border-b border-emerald-500/15">
                    <CheckCircleIcon fill='currentColor' stroke='#000' className="text-emerald-400 shrink-0" width="13" />
                    <p className="text-[10px] text-emerald-300">
                        <strong>{currentTabDomain}</strong> {t('alreadyBlocked')}
                    </p>
                </div>
            )}
            {/* Confirmation après blocage */}
            {quickBlockStatus === 'blocked' && currentTabDomain && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/8 border-b border-emerald-500/15">
                    <CheckCircleIcon fill='currentColor' stroke='#000' className="text-emerald-400 shrink-0" width="13" />
                    <p className="text-[10px] text-emerald-300">
                        <strong>{currentTabDomain}</strong> {t('added')}
                    </p>
                </div>
            )}

            {/* Tabs */}
            <nav className="flex items-center px-4 pt-3 pb-0 gap-5 border-b border-white/5 text-xs font-medium bg-black/20">
                {(['domains', 'keywords', 'whitelist'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                            }`}>
                        {tab === 'domains' ? t('domains') : tab === 'keywords' ? t('keywords') : t('whitelist')}
                        {tab === 'whitelist' && !isPremium && (
                            <LockKeyhole width="10" className="text-zinc-600" />
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
                                placeholder={isDomainLimitReached ? t('limitReached') : t('addDomain')}
                                disabled={isDomainLimitReached || isStrict}
                                className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-9 py-2.5 outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600 disabled:opacity-40" />
                            <Globe className="absolute left-3 top-[7.6px] text-zinc-600" width="15" />
                            <button onClick={addDomain} disabled={isDomainLimitReached || isStrict}
                                className="absolute right-2.5 top-[7.6px] p-0.5 text-zinc-500 hover:text-white disabled:opacity-40 transition-colors">
                                <ArrowRight width="16" />
                            </button>
                        </div>
                        {isDomainLimitReached && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <CircleAlert className="text-amber-500 shrink-0" width="13" />
                                <p className="text-[10px] text-amber-200 flex-1">
                                    {t('limit')} ({LIMITS.FREE.domains}/{LIMITS.FREE.domains}) —{' '}
                                    <button onClick={goToPricing} className="underline">{tc('upgrade')}</button>
                                </p>
                            </div>
                        )}
                        <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                            {(state?.activeBlockedDomains.length ?? 0) === 0 ? (
                                <li className="flex flex-col items-center py-8 text-zinc-700 border border-dashed border-zinc-800 rounded-lg gap-2">
                                    <Globe width="22" />
                                    <span className="text-xs">{t('noDomain')}</span>
                                </li>
                            ) : state?.activeBlockedDomains.map((domain, i) => (
                                <li key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800/50 group hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <SmartImage
                                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                            fallbackSrc={globeIcon}
                                            className="w-4 h-4 opacity-60"
                                        />
                                        <span className="text-xs text-zinc-300">{domain}</span>
                                    </div>
                                    <button disabled={isStrict}
                                        onClick={() => sendToBackground({ type: 'REMOVE_DOMAIN', domain })}
                                        className="text-zinc-700 hover:text-rose-500 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 width="13" />
                                    </button>
                                </li>
                            ))}
                            {/* Frozen domains — flouées */}
                            {frozenDomains.map((domain, i) => (
                                <li key={`frozen_${i}`}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/40 blur-[1.5px] pointer-events-none select-none opacity-50">
                                    <div className="flex items-center gap-2">
                                        <SmartImage
                                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                            className="w-4 h-4 opacity-40"
                                            fallbackSrc={globeIcon}
                                        />
                                        <span className="text-xs text-zinc-500">{domain}</span>
                                    </div>
                                    <LockKeyhole className="text-amber-500/60" width="12" />
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
                                placeholder={isKeywordLimitReached ? t('limitReached') : t('addKeyword')}
                                disabled={isKeywordLimitReached || isStrict}
                                className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-9 py-2.5 outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600 disabled:opacity-40" />
                            <FileType className="absolute left-3 top-[7.6px] text-zinc-600" width="15" />
                            <button onClick={addKeyword} disabled={isKeywordLimitReached || isStrict}
                                className="absolute right-2.5 top-[7.6px] p-0.5 text-zinc-500 hover:text-white disabled:opacity-40 transition-colors">
                                <ArrowRight width="16" />
                            </button>
                        </div>
                        {isKeywordLimitReached && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <CircleAlert className="text-amber-500 shrink-0" width="13" />
                                <p className="text-[10px] text-amber-200 flex-1">
                                    {t('limitReached')} —{' '}
                                    <button onClick={goToPricing} className="underline">{tc('upgrade')}</button>
                                </p>
                            </div>
                        )}
                        <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                            {(state?.activeBlockedKeywords.length ?? 0) === 0 ? (
                                <li className="flex flex-col items-center py-8 text-zinc-700 border border-dashed border-zinc-800 rounded-lg gap-2">
                                    <Hash width="22" />
                                    <span className="text-xs">{t('noKeyword')}</span>
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
                                        <Trash2 width="13" />
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
                                    <LockKeyhole className="text-amber-500/60" width="12" />
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
                                    <LockKeyhole className="text-amber-400" width="22" />
                                </div>
                                <div>
                                    <h3 className="text-white text-xs font-semibold mb-1">{t('whitelistPremium')}</h3>
                                    <p className="text-zinc-600 text-[10px] leading-relaxed">{t('whitelistDesc')}</p>
                                </div>
                                <button onClick={goToPricing}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors">
                                    {t('unlock')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {/* Input ajout whitelist */}
                                <div className="relative">
                                    <input ref={whitelistRef} type="text"
                                        onKeyDown={e => { if (e.key === 'Enter') addWhitelistEntry(); }}
                                        placeholder={t('addWhitelist')}
                                        disabled={isStrict}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xs rounded-lg pl-9 pr-9 py-2.5 outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600 disabled:opacity-40" />
                                    <ShieldCheck className="absolute left-3 top-[7.6px] text-zinc-600" width="15" />
                                    <button onClick={addWhitelistEntry} disabled={isStrict}
                                        className="absolute right-2.5 top-[7.6px] p-0.5 text-zinc-500 hover:text-white disabled:opacity-40 transition-colors">
                                        <ArrowRight width="16" />
                                    </button>
                                </div>
                                {(state?.whitelist.length ?? 0) === 0 ? (
                                    <div className="flex flex-col items-center py-6 text-zinc-700 border border-dashed border-zinc-800 rounded-lg gap-2">
                                        <ShieldCheck width="22" />
                                        <span className="text-xs">{t('noWhitelist')}</span>
                                    </div>
                                ) : state?.whitelist.map((w, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg group">
                                        <span className="text-xs text-zinc-300">{w}</span>
                                        <button
                                            onClick={() => sendToBackground({ type: 'REMOVE_WHITE', index: i })}
                                            className="text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 width="13" />
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
                                <LockIcon fill='currentColor' stroke='#18181B' className="text-rose-400" width="12" />
                                <span className="text-[9px] font-semibold text-rose-300 uppercase tracking-wider">{t('strictActive')}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {[
                                    { val: remaining.days, label: tc('dayShrt') },
                                    { val: remaining.hours, label: tc('hourShrt') },
                                    { val: remaining.minutes, label: tc('minuteShrt') },
                                    { val: remaining.seconds, label: tc('secondShrt') },
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
                                <ShieldAlertIcon fill='currentColor' stroke='#18181B' className="text-zinc-500" width="15" />
                                <span className="text-[10px] font-medium text-zinc-400">{t('strictMode')}</span>
                            </div>
                            <span className="text-[9px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                {tc('max')} {isPremium ? `30${tc('dayShrt')}` : `24${tc('hourShrt')}`}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <div>
                                <p className="text-[9px] text-zinc-600 text-center mb-0.5">{tc('days')}</p>
                                <select value={days} onChange={e => handleDays(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white text-[10px] rounded-lg py-2 outline-none cursor-pointer text-center appearance-none">
                                    {!isPremium
                                        ? [0, 1].map(d => <option key={d} value={d}>{pad(d)} {tc('dayShrt')}</option>)
                                        : Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{pad(i)} {tc('dayShrt')}</option>)
                                    }
                                </select>
                            </div>
                            <div>
                                <p className="text-[9px] text-zinc-600 text-center mb-0.5">{tc('hours')}</p>
                                <select value={hours} onChange={e => handleHours(e.target.value)}
                                    disabled={(!isPremium && days >= 1) || (isPremium && days >= 30)}
                                    className="w-full disabled:opacity-30 bg-zinc-950 border border-zinc-800 text-white text-[10px] rounded-lg py-2 outline-none cursor-pointer text-center appearance-none">
                                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{pad(i)} {tc('hourShrt')}</option>)}
                                </select>
                            </div>
                            <div>
                                <p className="text-[9px] text-zinc-600 text-center mb-0.5">{tc('minutes')}</p>
                                <select value={mins} onChange={e => handleMins(e.target.value)}
                                    disabled={(!isPremium && days >= 1) || (isPremium && days >= 30)}
                                    className="w-full disabled:opacity-30 bg-zinc-950 border border-zinc-800 text-white text-[10px] rounded-lg py-2 outline-none cursor-pointer text-center appearance-none">
                                    {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{pad(i)} {tc('minuteShrt')}</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={startStrict} disabled={isZeroDuration}
                            className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-500 text-white">
                            <ShieldAlertIcon fill='currentColor' stroke="#E11D48" width="16" />
                            {t('activateStrict')}
                        </button>
                    </div>
                )}

                {/* CTA Premium */}
                {isPremium ? (
                    <button className="w-full py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium flex items-center justify-center gap-2 cursor-default">
                        <BadgeCheckIcon fill="currentColor" stroke="#27272A" className="text-emerald-400" width="16" />
                        {t('premiumActive')}
                    </button>
                ) : (
                    <button onClick={goToPricing}
                        className="w-full py-2.5 rounded-xl premium-gradient text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all">
                        <CrownIcon width="15" />
                        {t('goPremium')}
                    </button>
                )}

                <p className="text-center text-[9px] text-zinc-700">
                    v1.0.2 • <span className="hover:text-zinc-500 cursor-pointer">{tc('support')}</span>
                </p>
            </footer>
        </div>
    );
}