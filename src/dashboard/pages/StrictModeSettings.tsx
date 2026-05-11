import React, { useState, useEffect } from 'react'
import { getDetailsTime, sendToBackground, getRemainingTime } from '@/lib/utils';
import { LIMITS } from '@/lib/constants';
import { useStateContext } from '@/context/GlobalStateContext';
import { useT, getT } from '@/lib/i18n';
import { Clock, Hourglass, LockIcon, Pen, ShieldAlertIcon, ShieldPlus, Trash2, TriangleAlert } from 'lucide-react';

/* =========================================================
   HELPERS
========================================================= */

const pad = (n: number) => n.toString().padStart(2, '0')

const twh  = getT('strictMode')

const RESTRICTIONS = [
    { icon: <Trash2 className="text-rose-400" width="11"/>, text: twh('r1')  },
    { icon: <Pen className="text-rose-400" width="11" />,   text: twh('r2') },
    { icon: <ShieldPlus className="text-rose-400" width="11"/>, get text() { return twh('r3') } },
]

/* =========================================================
   SOUS-COMPOSANT — Conseils pour tenir bon
   Remplace OsProtectionGuide — conseils pratiques et
   psychologiques pour ne pas contourner le Mode Strict
========================================================= */

const StrictModeTips: React.FC = () => {
    const t = useT('strictMode')

    const TIPS = [
        {
            icon: '📵',
            title: t('tip1Title'),
            desc:  t('tip1Desc'),
        },
        {
            icon: '🔔',
            title: t('tip2Title'),
            desc:  t('tip2Desc'),
        },
        {
            icon: '🧠',
            title: t('tip3Title'),
            desc:  t('tip3Desc'),
        },
        {
            icon: '✅',
            title: t('tip4Title'),
            desc:  t('tip4Desc'),
        },
    ]

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <span className="text-sm">💡</span>
                </div>
                <div>
                    <p className="text-xs font-semibold text-white">{t('tipsTitle')}</p>
                    <p className="text-[10px] text-zinc-500">{t('tipsDesc')}</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {TIPS.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
                        <span className="text-base shrink-0 mt-0.5">{tip.icon}</span>
                        <div>
                            <p className="text-[11px] font-semibold text-zinc-200 mb-0.5">{tip.title}</p>
                            <p className="text-[10px] text-zinc-500 leading-relaxed">{tip.desc}</p>
                        </div>
                    </div>
                ))}

                {/* Bannière motivationnelle */}
                <div className="flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/15 rounded-lg mt-1">
                    <span className="text-amber-400 text-sm shrink-0">⚡</span>
                    <p className="text-[10px] text-amber-300/80 leading-relaxed">
                        {t('tipsBanner')}
                    </p>
                </div>
            </div>
        </div>
    )
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */

const StrictModeSettings: React.FC = () => {
    const t  = useT('strictMode')
    const tc = useT('common')
    const { state } = useStateContext()

    const [days,  setDays]  = useState(0)
    const [hours, setHours] = useState(0)
    const [mins,  setMins]  = useState(0)

    const [remaining, setRemaining] = useState<{
        days: number; hours: number; minutes: number; seconds: number
    } | null>(null)

    const isStrict  = state?.strictModeUntil != null
    const isPremium = state?.isPremium ?? false
    const isZero    = days === 0 && hours === 0 && mins === 0
    const maxLabel  = isPremium ? t('maxPremiumLabel') : t('maxFreeLabel')

    /* ── Countdown ── */
    useEffect(() => {
        if (!state?.strictModeUntil) { setRemaining(null); return }
        const tick = () => {
            const { diffMs, days, hours, minutes, seconds } = getRemainingTime(state.strictModeUntil!)
            if (diffMs <= 0) sendToBackground({ type: 'CHECK_STRICT_EXPIRATION' })
            else             setRemaining({ days, hours, minutes, seconds })
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [state?.strictModeUntil])

    /* ── Sync default time ── */
    useEffect(() => {
        const t = getDetailsTime(state?.strictDefaultTime ?? 0)
        setDays(t.days || 0)
        setHours(t.hours || 0)
        setMins(t.minutes || 0)
    }, [state?.strictDefaultTime])

    /* ── Handlers ── */
    const handleDays = (v: string) => {
        const d = Number(v)
        if (!isPremium && d >= 1) { setDays(1); setHours(0); setMins(0) }
        else setDays(d)
    }
    const handleHours = (v: string) => {
        if (!isPremium && days >= 1) return
        if (isPremium && days >= 30) return
        setHours(Number(v))
    }
    const handleMins = (v: string) => {
        if (!isPremium && days >= 1) return
        if (isPremium && days >= 30) return
        setMins(Number(v))
    }

    const durationMs = () => {
        const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE
        const raw    = ((days * 24 * 60) + (hours * 60) + mins) * 60_000
        return Math.min(raw, limits.maxStrictDuration)
    }

    const startStrict = () => {
        if (isZero) return
        const ms = durationMs()
        sendToBackground({
            type:     'ACTIVATE_STRICT_MODE',
            time:     Date.now() + ms,
            duration: ms,
        })
    }

    return (
        <div className="max-w-xl mx-auto space-y-5 pb-8">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <ShieldAlertIcon fill="currentColor" stroke='#8b0836' className="text-rose-400" width="20" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-white">{t('title')}</h2>
                    <p className="text-xs text-zinc-500">{t('tempLock')}</p>
                </div>
                <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${
                    isStrict
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isStrict ? 'bg-rose-500 animate-pulse' : 'bg-zinc-600'}`} />
                    {isStrict ? t('activeShrt') : t('inactiveShrt')}
                </div>
            </div>

            {/* ── Restrictions ── */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{t('activeRestr')}</p>
                <div className="space-y-2">
                    {RESTRICTIONS.map(({ icon, text }, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                {icon}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Countdown si actif ── */}
            {isStrict && remaining ? (
                <div className="bg-zinc-900/50 border border-rose-500/20 rounded-xl overflow-hidden">
                    <div className="h-0.5 w-full bg-zinc-800 relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-rose-500 animate-pulse w-full" />
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LockIcon fill="currentColor" stroke="#27272a" className="text-rose-400" width="16" />
                                <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">{t('locked')}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600">{t('cantEdit')}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { val: remaining.days,    label: tc('days')    },
                                { val: remaining.hours,   label: tc('hours')   },
                                { val: remaining.minutes, label: tc('minutes') },
                                { val: remaining.seconds, label: tc('seconds') },
                            ].map(({ val, label }) => (
                                <div key={label} className="flex flex-col items-center gap-1 bg-black/40 rounded-lg py-3 border border-zinc-800">
                                    <span className="text-2xl font-mono font-bold text-white tabular-nums">{pad(val)}</span>
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-center text-zinc-600">
                            {t('willDeactivate')}
                        </p>
                    </div>
                </div>
            ) : (
                /* ── Configuration ── */
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Hourglass className="text-zinc-400" width="15" />
                            <p className="text-xs font-medium text-zinc-300">{t('duration')}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500 font-medium">
                            {tc('max')} {maxLabel}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-600 text-center">{tc('days')}</p>
                            <select value={days} onChange={e => handleDays(e.target.value)}
                                className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg px-2 py-2.5 outline-none focus:border-zinc-500 cursor-pointer text-center appearance-none">
                                {!isPremium
                                    ? [0, 1].map(d => <option key={d} value={d}>{pad(d)} {tc('dayShrt')}</option>)
                                    : Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{pad(i)} {tc('dayShrt')}</option>)
                                }
                            </select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-600 text-center">{tc('hours')}</p>
                            <select value={hours} onChange={e => handleHours(e.target.value)}
                                disabled={(!isPremium && days >= 1) || (isPremium && days >= 30)}
                                className="w-full disabled:opacity-30 disabled:cursor-not-allowed bg-black border border-zinc-700 text-white text-xs rounded-lg px-2 py-2.5 outline-none focus:border-zinc-500 cursor-pointer text-center appearance-none">
                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{pad(i)} {tc('hourShrt')}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-600 text-center">{tc('minutes')}</p>
                            <select value={mins} onChange={e => handleMins(e.target.value)}
                                disabled={(!isPremium && days >= 1) || (isPremium && days >= 30)}
                                className="w-full disabled:opacity-30 disabled:cursor-not-allowed bg-black border border-zinc-700 text-white text-xs rounded-lg px-2 py-2.5 outline-none focus:border-zinc-500 cursor-pointer text-center appearance-none">
                                {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{pad(i)} {tc('minuteShrt')}</option>)}
                            </select>
                        </div>
                    </div>

                    {!isZero && (
                        <>
                            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                <Clock className="text-zinc-500" width="13" />
                                <p className="text-[10px] text-zinc-400">
                                    {t('selectedDuration')}{' '}
                                    <span className="text-white font-medium">
                                        {days > 0  && `${days}${tc('dayShrt')} `}
                                        {hours > 0 && `${hours}${tc('hourShrt')} `}
                                        {mins > 0  && `${mins}${tc('minuteShrt')}`}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-start gap-2 p-2.5 bg-rose-500/8 border border-rose-500/15 rounded-lg">
                                <TriangleAlert className="text-rose-400 shrink-0 mt-[0.7px]" width="15" />
                                <p dangerouslySetInnerHTML={{ __html: t('onceActivated') }} className="text-[10px] text-rose-400/80 leading-relaxed" />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Conseils pour tenir bon ── */}
            <StrictModeTips />

            {/* ── Actions ── */}
            {!isStrict && (
                <div className="flex justify-end">
                    <button type="button" onClick={startStrict} disabled={isZero}
                        className="flex items-center gap-2 px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-rose-900/30">
                        <ShieldAlertIcon fill="currentColor" stroke='#E11D48' width="15" />
                        {t('activate')}
                    </button>
                </div>
            )}
        </div>
    )
}

export default StrictModeSettings