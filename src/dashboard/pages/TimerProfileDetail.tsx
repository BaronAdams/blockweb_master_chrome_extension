import { useStateContext } from '@/context/GlobalStateContext'
import { Profile, WeekDay } from '@/lib/types'
import { formatDuration, getProfileSiteTime, getProfileTotalTime } from '@/lib/utils'
import { getProfileLimitMs, isIntervalActive, isProfileActiveToday, isInTimeRange } from '@/background/time'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getT } from '@/lib/i18n'
import { useNavigate, useFetcher, useSubmit, useRouteLoaderData } from 'react-router-dom'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Calendar, Clock, Pen, Shield, Sun, Trash2, Trash2Icon } from 'lucide-react'
import SmartImage from '@/components/SmartImage';
import globeIcon from '@/assets/globe.svg';

/* =========================================================
   CONSTANTES
========================================================= */

const twh  = getT('profiles')
const twhc = getT('common')

const DAY_LABELS : Record<WeekDay, string> = {
    0: twhc('Sun'), 1: twhc('Mon'), 2: twhc('Tue'), 3: twhc('Wed'), 4: twhc('Thu'), 5: twhc('Fri'), 6: twhc('Sat'),
}

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    daily: { icon: <Sun className='text-amber-400' width={24}/>, label: twh('dailyType'), color: 'text-amber-400' },
    hourly: { icon: <Clock className='text-blue-400' width={24}/>, label: twh('hourlyType'), color: 'text-blue-400' },
    weekly: { icon: <Calendar className='text-violet-400' width={24}/>, label: twh('weeklyType'), color: 'text-violet-400' },
    interval: { icon: <Shield className='text-rose-400' width={24}/>, label: twh('intervalType'), color: 'text-rose-400' },
}

/* =========================================================
   HELPERS
========================================================= */

function getConfigSummary(profile: Profile): { detail: string; extra?: string } {
    const { config } = profile
    switch (config.type) {
        case 'daily': {
            const days = config.days?.length
                ? config.days.map(d => DAY_LABELS[d]).join(', ')
                : twh('allDays')
            const h = Math.floor(config.dailyLimit / 60)
            const m = config.dailyLimit % 60
            return { detail: h > 0 ? twh('getDailyLimit_hm', { h, m }) : twh('getDailyLimit_m', { m }), extra: days }
        }
        case 'hourly': {
            const time = twh('getHourlyLimit', { hourlyLimit: config.hourlyLimit })
            const days = config.days?.length ? config.days.map(d => DAY_LABELS[d]).join(', ') : twh('allDays')
            const ranges = config.timeRanges?.length
                ? config.timeRanges.map(r => `${r.start}–${r.end}`).join(', ')
                : twh('allDayShrt')
            return { detail: time, extra: `${days} · ${ranges}` }
        }
        case 'weekly': {
            const h = Math.floor(config.weeklyLimit / 60)
            const m = config.weeklyLimit % 60
            return { detail: h > 0 ? twh('getWeeklyLimit_hm', { h, m }) : twh('getWeeklyLimit_m', { m }) }
        }
        case 'interval': {
            const n = config.rules.length
            return { detail: twh('getRulesLimit', { n }) }
        }
    }
}

/* =========================================================
   COMPOSANT
========================================================= */

const TimerProfileDetail = () => {
    const navigate = useNavigate()
    const fetcher = useFetcher()
    const submit = useSubmit()
    const { state } = useStateContext()
    const { t } = useTranslation('profiles')
    const { t: ts } = useTranslation('strictMode')
    const { t: tc } = useTranslation('common')
    const { currentProfile } = useRouteLoaderData('timer-profile') as { currentProfile: Profile | undefined }

    const [isEnabled, setIsEnabled] = useState(currentProfile?.isActive ?? false)
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])

    if (!currentProfile) {
        return (
            <div className="max-w-2xl mx-auto flex justify-center items-center py-16 text-zinc-500 text-sm">
                {t('noProfile')}
            </div>
        )
    }

    const cfg = currentProfile.config
    const usedMs = getProfileTotalTime(currentProfile, state?.siteUsage || {}, now)
    const limitMs = getProfileLimitMs(currentProfile)
    const hasLimit = limitMs !== Infinity
    const percent = hasLimit && limitMs > 0 ? Math.min(100, Math.round((usedMs / limitMs) * 100)) : 0
    const exceeded = hasLimit && usedMs >= limitMs

    const meta = TYPE_META[cfg.type] ?? TYPE_META.daily
    const summary = getConfigSummary(currentProfile)

    /* ── État courant ── */
    const inScope =
        cfg.type === 'interval' ? isIntervalActive(currentProfile)
            : !currentProfile.isActive ? false
                : !isProfileActiveToday(currentProfile) ? false
                    : cfg.type === 'hourly' && !isInTimeRange(currentProfile) ? false
                        : true

    return (
        <div id="tab-profile-detail" className="max-w-2xl mx-auto space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/profiles')}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft width="12" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-white">{currentProfile.name}</h2>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 uppercase tracking-wide ${meta.color}`}>
                                {meta.label}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500">{t('detailsStats')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle actif/inactif
                        En mode strict : activation autorisée, désactivation interdite */}
                    <div className="relative flex items-center"
                        title={state?.strictModeUntil && isEnabled ? t('unableDeactivateStrict') : ''}>
                        <input type="checkbox" name="toggle-profile" id="toggle-profile"
                            checked={isEnabled}
                            disabled={!!(state?.strictModeUntil && isEnabled)}
                            onChange={(e) => {
                                setIsEnabled(e.target.checked)
                                fetcher.submit({}, { method: 'post', action: 'toggle' })
                            }}
                            className={`toggle-checkbox absolute ${isEnabled ? 'right-0' : 'left-0'} block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-zinc-700 transition-all duration-300 z-20 disabled:cursor-not-allowed`}
                        />
                        <label htmlFor="toggle-profile" className="toggle-label block overflow-hidden h-5 w-10 rounded-full bg-zinc-800 cursor-pointer border border-zinc-700 transition-colors duration-300" />
                    </div>

                    {/* Éditer */}
                    <button onClick={() => navigate(`/profile/${currentProfile.id}/edit`)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
                        <Pen width="12" />
                    </button>

                    {/* Supprimer */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button type="button" disabled={state?.strictModeUntil != null}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 disabled:cursor-not-allowed">
                                <Trash2 width="14" />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogMedia>
                                    <Trash2Icon fill='currentColor' stroke='#ffffff' width="20" />
                                </AlertDialogMedia>
                                <AlertDialogTitle className='text-white text-sm font-semibold tracking-tight'>
                                    {t('deleteProfile')}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    <p className="text-zinc-500 text-[13px] mb-6 leading-relaxed">
                                        {t('deleteDesc')}
                                    </p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className='text-xs'>{tc('cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => submit({}, { method: 'post', action: 'delete' })}
                                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center justify-center gap-2">
                                    <Trash2 width="14" /> {tc('delete')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* ── Stats Hero ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Barre de consommation */}
                <div className="md:col-span-2 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-xs text-zinc-400 uppercase tracking-wide">{t('consumption')}</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-bold text-white">{formatDuration(usedMs)}</span>
                                {hasLimit && (
                                    <span className="text-sm text-zinc-500">/ {formatDuration(limitMs)}</span>
                                )}
                                {!hasLimit && cfg.type === 'interval' && (
                                    <span className="text-xs text-zinc-600 italic">
                                        {inScope ? 'Blocage actif' : 'Hors plage'}
                                    </span>
                                )}
                            </div>
                        </div>
                        {hasLimit && limitMs > 0 && (
                            <span className={`text-xl font-medium ${exceeded ? 'text-red-400' : 'text-white'}`}>
                                {percent}%
                            </span>
                        )}
                    </div>

                    {hasLimit && limitMs > 0 && (
                        <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-zinc-800/50">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${!isEnabled ? 'bg-zinc-600'
                                        : !inScope ? 'bg-zinc-700'
                                            : exceeded ? 'bg-red-500'
                                                : 'bg-white'
                                    }`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    )}

                    {/* Info hors scope */}
                    {isEnabled && !inScope && hasLimit && (
                        <p className="text-[10px] text-amber-600 mt-2">
                            {!isProfileActiveToday(currentProfile) ? t('inactiveTrackingToday') 
                                : cfg.type === 'hourly' ? t('outsideTimeRange')
                                    : ''}
                        </p>
                    )}
                </div>

                {/* Config summary */}
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col justify-center items-center text-center gap-2">
                    <div className={`w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-1 ${meta.color}`}>
                        {meta.icon}
                    </div>
                    <span className="text-sm font-semibold text-white">{summary.detail}</span>
                    {summary.extra && (
                        <span className="text-[10px] text-zinc-500 leading-relaxed">{summary.extra}</span>
                    )}
                    <span className="text-[10px] text-zinc-600 uppercase mt-1">
                        {t('monitored', { n: currentProfile.sites.length })}
                    </span>
                </div>
            </div>

            {/* ── Règles interval ── */}
            {cfg.type === 'interval' && (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="bg-zinc-900/50 px-4 py-3 border-b border-zinc-800">
                        <h3 className="text-xs font-medium text-white uppercase tracking-wide">{t('blockRanges')}</h3>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {cfg.rules.map((rule, i) => {
                            const date = new Date(now)
                            const currentDay = date.getDay() as WeekDay
                            const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                            const ruleActive = rule.days.includes(currentDay) && (
                                rule.allDay ? true : (hhmm >= rule.startTime && hhmm <= rule.endTime)
                            )
                            return (
                                <div key={i} className="px-4 py-3 flex items-center justify-between bg-black">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${ruleActive ? 'bg-green-400' : 'bg-zinc-600'}`} />
                                        <div>
                                            <p className="text-xs text-zinc-300">
                                                {rule.allDay ? t('allDayShrt') : `${rule.startTime} – ${rule.endTime}`}
                                            </p>
                                            <p className="text-[10px] text-zinc-600 mt-0.5">
                                                {rule.days.map(d => DAY_LABELS[d as WeekDay]).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ruleActive ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {ruleActive ? ts('activeShrt') : t('waiting')}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Détail par site ── */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <div className="bg-zinc-900/50 px-4 py-3 border-b border-zinc-800">
                    <h3 className="text-xs font-medium text-white uppercase tracking-wide">
                        {t('perSiteDetail')} {cfg.type !== 'weekly' ? `(${tc('today')})` : `(${tc('thisWeek')})`}
                    </h3>
                </div>
                <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-zinc-800 bg-black text-xs">
                        {currentProfile.sites.map((site) => {
                            const siteMs = getProfileSiteTime(currentProfile, site, state?.siteUsage || {}, now)
                            return (
                                <tr key={site} className="hover:bg-zinc-900/30">
                                    <td className="px-4 py-3 flex items-center gap-3">
                                        <SmartImage 
                                            src={`https://www.google.com/s2/favicons?domain=${site}&sz=32`}
                                            fallbackSrc={globeIcon} 
                                            className="w-6 h-6 opacity-70" 
                                        />
                                        <span className="text-zinc-300">{site}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-zinc-400 font-mono">
                                        {cfg.type === 'interval' ? '—' : formatDuration(siteMs)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default TimerProfileDetail