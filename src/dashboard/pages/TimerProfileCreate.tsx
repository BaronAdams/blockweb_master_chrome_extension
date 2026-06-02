import { useStateContext } from '@/context/GlobalStateContext'
import { useTranslation } from 'react-i18next'
import { getT } from '@/lib/i18n'
import { LIMITS } from '@/lib/constants'
import { IntervalRule, Profile, ProfileConfig, ProfileType, TimeRange, WeekDay } from '@/lib/types'
import { normalizeDomain, sendToBackground } from '@/lib/utils'
import { Icon } from '@iconify/react'
import { nanoid } from 'nanoid'
import { useRef, useState } from 'react'
import { ActionFunctionArgs, Form, Link, useNavigate, useActionData } from 'react-router-dom'
import {
    AlertDialog, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, ArrowRight, Calendar, CheckCircleIcon, CircleAlert, Clock, PlayIcon, Shield, Sun, Trash2, TriangleAlert } from 'lucide-react'
import SmartImage from '@/components/SmartImage';
import globeIcon from '@/assets/globe.svg';

const twh = getT('profiles')
const twhc = getT('common')
/* =========================================================
   ACTION React Router v6
========================================================= */
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData()
    const name = (formData.get('name') as string)?.trim()
    const sitesRaw = formData.get('sites') as string
    const configRaw = formData.get('config') as string

    if (!name || !sitesRaw || !configRaw) return { error: twh('missingData') }

    let sites: string[]
    let config: ProfileConfig
    try {
        sites = JSON.parse(sitesRaw)
        config = JSON.parse(configRaw)
    } catch { return { error: twh('corruptedData') } }

    if (!sites.length) return { error: twh('noSites') }
    if (config.type !== 'interval') {
        const limit =
            config.type === 'daily' ? config.dailyLimit :
                config.type === 'hourly' ? config.hourlyLimit :
                    config.weeklyLimit
        if (!limit) return { error: twh('noLimit') }
    } else if (!config.rules.length) {
        return { error: twh('noRules') }
    }

    const profile: Profile = {
        id: nanoid(15), name, sites,
        isActive: false, activatedAt: null, config,
        baselineUsage: {}, frozenSiteMs: {},
        baselineHourKey: null, baselineWeekKey: null,
    }
    await sendToBackground({ type: 'ADD_PROFILE', data: profile })
    // Retourner l'ID au lieu de rediriger — le composant gère la confirmation
    return { profileId: profile.id }
}

/* =========================================================
   CONSTANTES
========================================================= */

const DAY_LABELS: { key: WeekDay; label: string; short: string }[] = [
    { key: 1, label: twhc('Monday'), short: twhc('Mon') },
    { key: 2, label: twhc('Tuesday'), short: twhc('Tue') },
    { key: 3, label: twhc('Wednesday'), short: twhc('Wed') },
    { key: 4, label: twhc('Thursday'), short: twhc('Thu') },
    { key: 5, label: twhc('Friday'), short: twhc('Fri') },
    { key: 6, label: twhc('Saturday'), short: twhc('Sat') },
    { key: 0, label: twhc('Sunday'), short: twhc('Sun') },
]

const SUGGESTED_SITES = [
    { domain: 'youtube.com', icon: 'logos:youtube-icon' },
    { domain: 'instagram.com', icon: 'skill-icons:instagram' },
    { domain: 'tiktok.com', icon: 'logos:tiktok-icon' },
    { domain: 'twitter.com', icon: 'skill-icons:twitter' },
    { domain: 'facebook.com', icon: 'logos:facebook' },
    { domain: 'reddit.com', icon: 'logos:reddit-icon' },
    { domain: 'twitch.tv', icon: 'logos:twitch' },
    { domain: 'netflix.com', icon: 'logos:netflix-icon' },
    { domain: 'snapchat.com', icon: 'fa7-brands:snapchat-square' },
    { domain: 'pinterest.com', icon: 'logos:pinterest' },
    { domain: 'discord.com', icon: 'logos:discord-icon' },
    { domain: 'linkedin.com', icon: 'logos:linkedin-icon' },
]

const TYPE_OPTIONS: {
    type: ProfileType
    label: string
    desc: string
    icon: React.ReactNode
    color: string
}[] = [
        { type: 'daily', label: twh('dailyLimit'), desc: twh('dailyCreateDesc'), icon: <Sun className='text-amber-400' width={18}/>, color: 'text-amber-400' },
        { type: 'hourly', label: twh('hourlyLimit'), desc: twh('hourlyCreateDesc'), icon: <Clock className='text-blue-400' width={18}/>, color: 'text-blue-400' },
        { type: 'weekly', label: twh('weeklyLimit'), desc: twh('weeklyCreateDesc'), icon: <Calendar className='text-violet-400' width={18}/>, color: 'text-violet-400' },
        { type: 'interval', label: twh('intervalLimit'), desc: twh('intervalCreateDesc'), icon: <Shield className='text-rose-400' width={18}/>, color: 'text-rose-400' },
    ]

/* =========================================================
   SOUS-COMPOSANTS
========================================================= */

function StepIndicator({ current }: { current: 0 | 1 }) {
    return (
        <div className="flex items-center gap-2">
            {[0, 1].map(i => (
                <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i < current ? 'bg-white' : i === current ? 'bg-zinc-500' : 'bg-zinc-800'
                    }`} />
            ))}
        </div>
    )
}

function DaySelector({ selected, onChange }: {
    selected: WeekDay[]; onChange: (d: WeekDay[]) => void
}) {
    const twh = getT('profiles')
    const toggle = (d: WeekDay) =>
        onChange(selected.includes(d) ? selected.filter(x => x !== d) : [...selected, d])
    return (
        <div className="flex gap-1.5 flex-wrap">
            {DAY_LABELS.map(({ key, short, label }) => (
                <button key={key} type="button" title={label} onClick={() => toggle(key)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-semibold transition-all border ${selected.includes(key)
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:border-zinc-500'
                        }`}>
                    {short}
                </button>
            ))}
            <button type="button"
                onClick={() => onChange(selected.length === 7 ? [] : DAY_LABELS.map(d => d.key))}
                className="px-2 h-8 rounded-lg text-[13px] text-zinc-500 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-all">
                {selected.length === 7 ? twh('none') : twh('all')}
            </button>
        </div>
    )
}

function DurationPicker({ maxHours, value, onChange }: {
    maxHours: number
    value: { hours: number; mins: number }
    onChange: (v: { hours: number; mins: number }) => void
}) {
    // const twh = getT('profiles')
    const twhc = getT('common')

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                {maxHours > 0 && (
                    <>
                        <div className="flex-1 relative">
                            <input type="number" min={0} max={maxHours} value={value.hours}
                                onChange={e => onChange({ ...value, hours: Math.min(maxHours, Math.max(0, Number(e.target.value))) })}
                                className="w-full bg-black border border-zinc-700 text-white text-[13px] rounded-lg px-3 py-2 outline-none focus:border-zinc-500 transition-colors text-center" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-400">{twhc('hourShrt')}</span>
                        </div>
                        <span className="text-zinc-400 font-bold text-[13px]">:</span>
                    </>
                )}
                <div className="flex-1 relative">
                    <input type="number" min={maxHours > 0 ? 0 : 1} max={59} value={value.mins}
                        onChange={e => onChange({ ...value, mins: Math.min(59, Math.max(maxHours > 0 ? 0 : 1, Number(e.target.value))) })}
                        className="w-full bg-black border border-zinc-700 text-white text-[13px] rounded-lg px-3 py-2 outline-none focus:border-zinc-500 transition-colors text-center" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-400">{twhc('minuteShrt')}</span>
                </div>
            </div>
            <p className="text-[13px] text-zinc-400">
                {`${twhc('max')} : `}{maxHours > 0 ? `${maxHours}${twhc('hourShrt')} 59${twhc('minuteShrt')}` : `59 ${twhc('minuteShrt')}`}
            </p>
        </div>
    )
}

function Section({ title, hint, children }: {
    title: string; hint?: string; children: React.ReactNode
}) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2.5">
            <div>
                <p className="text-[13px] font-medium text-zinc-300">{title}</p>
                {hint && <p className="text-[13px] text-zinc-400 mt-0.5">{hint}</p>}
            </div>
            {children}
        </div>
    )
}

function ErrorBanner({ msg }: { msg: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <CircleAlert className="text-rose-400 shrink-0" width="14" />
            <p className="text-[13px] text-rose-300">{msg}</p>
        </div>
    )
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */

const TimerProfileCreate = () => {
    const { t }  = useTranslation('profiles')
    const { t: tc } = useTranslation('common')
    const { state } = useStateContext()
    const navigate = useNavigate()
    const actionData = useActionData() as { profileId?: string } | undefined

    // Quand l'action retourne un profileId, on affiche le dialog
    const createdProfileId = actionData?.profileId ?? null
    const showDialog = !!createdProfileId

    const sitesInputRef = useRef<HTMLInputElement>(null)
    const configInputRef = useRef<HTMLInputElement>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)

    /* ── Steps ── */
    const [step, setStep] = useState<1 | 2>(1)

    /* ── Step 1 ── */
    const [profileType, setProfileType] = useState<ProfileType | null>(null)

    /* ── Step 2 — champs communs ── */
    const [name, setName] = useState('')
    const [duration, setDuration] = useState({ hours: 0, mins: 30 })
    const [selectedDays, setSelectedDays] = useState<WeekDay[]>([])

    /* ── Step 2 — hourly ── */
    const [timeRanges, setTimeRanges] = useState<TimeRange[]>([])
    const [newRangeStart, setNewRangeStart] = useState('09:00')
    const [newRangeEnd, setNewRangeEnd] = useState('18:00')

    /* ── Step 2 — interval ── */
    const [intervalRules, setIntervalRules] = useState<IntervalRule[]>([])
    const [newRuleDays, setNewRuleDays] = useState<WeekDay[]>([1, 2, 3, 4, 5])
    const [newRuleStart, setNewRuleStart] = useState('20:00')
    const [newRuleEnd, setNewRuleEnd] = useState('23:59')
    const [newRuleAllDay, setNewRuleAllDay] = useState(false)

    /* ── Sites ── */
    const [sites, setSites] = useState<string[]>([])
    const [siteInput, setSiteInput] = useState('')

    /* ── Erreurs ── */
    const [stepError, setStepError] = useState<string | null>(null)

    /* ── Limites ── */
    const profileCount = state?.activeProfiles.length ?? 0
    const maxProfiles = state?.isPremium ? Infinity : LIMITS.FREE.profiles
    const limitReached = profileCount >= maxProfiles
    const maxSites = state?.isPremium ? Infinity : LIMITS.FREE.sitesPerProfile

    // const maxHours = profileType === 'hourly' ? 0 : profileType === 'weekly' ? 167 : 23

    /* ── Helpers sites ── */
    const addSite = (domain: string) => {
        const n = normalizeDomain(domain)
        if (!n || sites.includes(n) || sites.length >= maxSites) return
        setSites(p => [...p, n])
    }
    const addSiteFromInput = () => {
        if (siteInput.trim()) { addSite(siteInput.trim()); setSiteInput('') }
    }

    /* ── Helpers plages ── */
    const addTimeRange = () => {
        if (newRangeStart >= newRangeEnd) return
        if (timeRanges.some(r => r.start === newRangeStart && r.end === newRangeEnd)) return
        setTimeRanges(p => [...p, { start: newRangeStart, end: newRangeEnd }])
    }
    const addIntervalRule = () => {
        if (newRuleDays.length === 0) return
        if (!newRuleAllDay && newRuleStart >= newRuleEnd) return
        setIntervalRules(p => [...p, {
            days: newRuleDays,
            startTime: newRuleAllDay ? '00:00' : newRuleStart,
            endTime: newRuleAllDay ? '23:59' : newRuleEnd,
            allDay: newRuleAllDay,
        }])
    }

    const buildConfig = (): ProfileConfig => {
        const totalMins = duration.hours * 60 + duration.mins
        switch (profileType!) {
            case 'daily': return { type: 'daily', dailyLimit: totalMins, days: selectedDays.length ? selectedDays : undefined }
            case 'hourly': return { type: 'hourly', hourlyLimit: duration.mins, days: selectedDays.length ? selectedDays : undefined, timeRanges: timeRanges.length ? timeRanges : undefined }
            case 'weekly': return { type: 'weekly', weeklyLimit: totalMins }
            case 'interval': return { type: 'interval', rules: intervalRules }
        }
    }

    /* ── Step 1 → Step 2 ── */
    const goToStep2 = (type: ProfileType) => {
        if (limitReached) { navigate('/pricing'); return }
        setProfileType(type)
        setDuration({ hours: 0, mins: 30 })
        setSelectedDays([])
        setTimeRanges([])
        setIntervalRules([])
        setStepError(null)
        setStep(2)
    }

    /* ── Validation avant submit ── */
    const handleBeforeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        setStepError(null)
        if (!name.trim()) { e.preventDefault(); setStepError(t('giveName')); return }
        if (!sites.length) { e.preventDefault(); setStepError(t('noSites')); return }
        const totalMins = duration.hours * 60 + duration.mins
        if (profileType !== 'interval' && totalMins === 0) { e.preventDefault(); setStepError(t('noLimit')); return }
        if (profileType === 'interval' && !intervalRules.length) { e.preventDefault(); setStepError(t('noRules')); return }
        if (sitesInputRef.current) sitesInputRef.current.value = JSON.stringify(sites)
        if (configInputRef.current) configInputRef.current.value = JSON.stringify(buildConfig())
        if (nameInputRef.current) nameInputRef.current.value = name.trim()
    }

    return (
        <div className="max-w-xl mx-auto space-y-5 pb-8">

            {/* Header */}
            <div className="flex items-center gap-3">
                <button type="button"
                    onClick={() => step === 1 ? navigate('/profiles') : setStep(1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft width="16" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                        <h2 className="text-[13px] font-semibold text-white">{t('newProfile')}</h2>
                        <span className="text-[13px] text-zinc-500">
                            {step === 1 ? t('step1') : t('step2')}
                        </span>
                    </div>
                    <StepIndicator current={(step - 1) as 0 | 1} />
                </div>
            </div>

            {/* ============================================================
                STEP 1 — Choix du type
            ============================================================ */}
            {step === 1 && (
                <div className="space-y-4">

                    {/* Bannière limite atteinte */}
                    {limitReached && (
                        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl">
                            <TriangleAlert className="text-amber-400 shrink-0 mt-0.5" width="16" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-amber-300">{t('limitReached')}</p>
                                <p className="text-[13px] text-amber-400/80 mt-0.5">
                                    {LIMITS.FREE.profiles} {t('limitDesc', { n: LIMITS.FREE.profiles }).split(LIMITS.FREE.profiles.toString())[1]}
                                </p>
                            </div>
                            <Link to="/pricing"
                                className="no-underline shrink-0 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[13px] font-bold rounded-lg transition-colors">{tc('upgrade')}</Link>
                        </div>
                    )}

                    {/* VStack de cartes */}
                    <div className="flex flex-col gap-2">
                        {TYPE_OPTIONS.map(({ type, label, desc, icon, color }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => goToStep2(type)}
                                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${limitReached
                                    ? 'border-zinc-800 opacity-40 cursor-not-allowed'
                                    : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 ${color}`}>
                                    {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-white">{label}</p>
                                    <p className="text-[13px] text-zinc-400 mt-0.5">{desc}</p>
                                </div>
                                <ArrowRight className="text-zinc-400 shrink-0" width="14" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ============================================================
                STEP 2 — Tous les paramètres
            ============================================================ */}
            {step === 2 && profileType && (
                <Form method="POST" onSubmit={handleBeforeSubmit} className="space-y-4">
                    <input ref={nameInputRef} type="hidden" name="name" />
                    <input ref={sitesInputRef} type="hidden" name="sites" />
                    <input ref={configInputRef} type="hidden" name="config" />

                    {/* Nom */}
                    <Section title={t('profileName')}>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            placeholder={t('namePlaceholder')}
                            className="w-full bg-black border border-zinc-700 text-white text-[13px] rounded-lg px-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400" />
                    </Section>

                    {/* DAILY */}
                    {profileType === 'daily' && (<>
                        <Section title={t('maxPerDay')}>
                            <DurationPicker maxHours={23} value={duration} onChange={setDuration} />
                        </Section>
                        <Section title={t('appDays')} hint="Laisser vide = tous les jours">
                            <DaySelector selected={selectedDays} onChange={setSelectedDays} />
                        </Section>
                    </>)}

                    {/* HOURLY */}
                    {profileType === 'hourly' && (<>
                        <Section title={t('maxPerHour')} hint={t('between1and59')}>
                            <DurationPicker maxHours={0} value={{ hours: 0, mins: duration.mins }} onChange={v => setDuration({ hours: 0, mins: v.mins })} />
                        </Section>
                        <Section title={t('appDays')} hint="Laisser vide = tous les jours">
                            <DaySelector selected={selectedDays} onChange={setSelectedDays} />
                        </Section>
                        <Section title={t('timeRanges')} hint={t('emptyRanges')}>
                            <div className="flex gap-2 items-center flex-wrap">
                                <input type="time" value={newRangeStart} onChange={e => setNewRangeStart(e.target.value)}
                                    className="bg-black border border-zinc-700 text-white text-[13px] rounded-lg px-3 py-2 outline-none focus:border-zinc-500" />
                                <span className="text-zinc-400 text-[13px]">→</span>
                                <input type="time" value={newRangeEnd} onChange={e => setNewRangeEnd(e.target.value)}
                                    className="bg-black border border-zinc-700 text-white text-[13px] rounded-lg px-3 py-2 outline-none focus:border-zinc-500" />
                                <button type="button" onClick={addTimeRange}
                                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] rounded-lg border border-zinc-700 transition-colors">
                                    {t('add')}
                                </button>
                            </div>
                            {timeRanges.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {timeRanges.map((r, i) => (
                                        <div key={i} className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700 text-[13px] text-zinc-300">
                                            {r.start} → {r.end}
                                            <button type="button" onClick={() => setTimeRanges(p => p.filter((_, j) => j !== i))}
                                                className="ml-1 hover:text-white text-zinc-500">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>
                    </>)}

                    {/* WEEKLY */}
                    {profileType === 'weekly' && (
                        <Section title={t('maxPerWeek')}>
                            <DurationPicker maxHours={167} value={duration} onChange={setDuration} />
                        </Section>
                    )}

                    {/* INTERVAL */}
                    {profileType === 'interval' && (
                        <Section title="Plages de blocage" hint="Blocage total pendant ces plages">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2.5 cursor-pointer" onClick={() => setNewRuleAllDay(v => !v)}>
                                    <div className={`w-8 h-4.5 rounded-full transition-colors relative ${newRuleAllDay ? 'bg-white' : 'bg-zinc-700'}`}
                                        style={{ height: '18px' }}>
                                        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-transform ${newRuleAllDay ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </div>
                                    <span className="text-[13px] text-zinc-400">{t('allDay')}</span>
                                </label>
                                <div className="space-y-1.5">
                                    <p className="text-[13px] text-zinc-500">{tc('days')}</p>
                                    <DaySelector selected={newRuleDays} onChange={setNewRuleDays} />
                                </div>
                                {!newRuleAllDay && (
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <input type="time" value={newRuleStart} onChange={e => setNewRuleStart(e.target.value)}
                                            className="bg-black border border-zinc-700 text-white text-[13px] rounded-lg px-3 py-2 outline-none focus:border-zinc-500" />
                                        <span className="text-zinc-400 text-[13px]">→</span>
                                        <input type="time" value={newRuleEnd} onChange={e => setNewRuleEnd(e.target.value)}
                                            className="bg-black border border-zinc-700 text-white text-[13px] rounded-lg px-3 py-2 outline-none focus:border-zinc-500" />
                                    </div>
                                )}
                                <button type="button" onClick={addIntervalRule}
                                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] font-medium rounded-lg border border-zinc-700 transition-colors">
                                    {t('addRange')}
                                </button>
                                {intervalRules.length > 0 && (
                                    <div className="space-y-1.5">
                                        {intervalRules.map((rule, i) => (
                                            <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-800/60 rounded-lg border border-zinc-700">
                                                <div>
                                                    <p className="text-[13px] text-white">
                                                        {rule.allDay ? t('allDay') : `${rule.startTime} → ${rule.endTime}`}
                                                    </p>
                                                    <p className="text-[13px] text-zinc-500 mt-0.5">
                                                        {rule.days.map(d => DAY_LABELS.find(x => x.key === d)?.short).join(' · ')}
                                                    </p>
                                                </div>
                                                <button type="button" onClick={() => setIntervalRules(p => p.filter((_, j) => j !== i))}
                                                    className="text-zinc-400 hover:text-rose-400 transition-colors">
                                                    <Trash2 width="13" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Sites — suggestions */}
                    <Section title={t('quickSuggestions')}>
                        <div className="grid grid-cols-4 gap-1.5">
                            {SUGGESTED_SITES.map(({ domain, icon }) => (
                                <button key={domain} type="button"
                                    onClick={() => sites.includes(domain) ? setSites(p => p.filter(s => s !== domain)) : addSite(domain)}
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${sites.includes(domain)
                                        ? 'border-white bg-white/10'
                                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                                        }`}>
                                    <Icon icon={icon} width="14" className="shrink-0" />
                                    <span className="text-[13px] text-zinc-300 truncate">
                                        {domain.replace('.com', '').replace('.tv', '')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* Sites les plus visités — critères stricts */}
                    {(() => {
                        if (!state?.siteUsage) return null
                        const MIN_DAILY_MS  = 5  * 60 * 1000  // 5min minimum par jour
                        const MIN_TOTAL_MS  = 10 * 60 * 1000  // 10min minimum au total
                        const MIN_DAYS      = 2               // présent au moins 2 jours différents

                        const topSites = Object.entries(state.siteUsage)
                            .filter(([d, u]) => {
                                // Exclure les suggestions déjà affichées
                                if (SUGGESTED_SITES.some(s => s.domain === d)) return false
                                // Exclure si temps total insuffisant
                                if ((u.totalTimeMs ?? 0) < MIN_TOTAL_MS) return false
                                // Compter les jours avec activité ≥ MIN_DAILY_MS
                                const history = u.history ?? {}
                                const daysWithActivity = Object.entries(history)
                                    .filter(([k, ms]) => !k.includes(':') && ms >= MIN_DAILY_MS)
                                    .length
                                return daysWithActivity >= MIN_DAYS
                            })
                            .sort((a, b) => (b[1].totalTimeMs ?? 0) - (a[1].totalTimeMs ?? 0))
                            .slice(0, 8)

                        if (!topSites.length) return null
                        return (
                            <Section title={t('topSites')}
                                hint={t('topSitesHint')}>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {topSites.map(([domain, usage]) => {
                                        const totalH = Math.floor((usage.totalTimeMs ?? 0) / 3600000)
                                        const totalM = Math.floor(((usage.totalTimeMs ?? 0) % 3600000) / 60000)
                                        const timeLabel = totalH > 0 ? `${totalH}${tc('hourShrt')} ${totalM}${tc('minuteShrt')}` : `${totalM}${tc('minuteShrt')}`
                                        return (
                                            <button key={domain} type="button"
                                                onClick={() => sites.includes(domain) ? setSites(p => p.filter(s => s !== domain)) : addSite(domain)}
                                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all ${sites.includes(domain)
                                                    ? 'border-white bg-white/10'
                                                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                                                    }`}>
                                                <SmartImage 
                                                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                                    fallbackSrc={globeIcon}
                                                    className="w-4 h-4 shrink-0 opacity-80" 
                                                />
                                                <span className="text-[13px] text-zinc-300 truncate flex-1">{domain}</span>
                                                {sites.includes(domain)
                                                    ? <CheckCircleIcon fill='currentColor' stroke="#000" width="11" className="text-white shrink-0" />
                                                    : <span className="text-[10px] text-zinc-600 shrink-0">{timeLabel}</span>
                                                }
                                            </button>
                                        )
                                    })}
                                </div>
                            </Section>
                        )
                    })()}

                    {/* Saisie manuelle */}
                    <Section title="Autre site">
                        <div className="flex gap-2">
                            <input type="text" value={siteInput} onChange={e => setSiteInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSiteFromInput() } }}
                                placeholder={t('siteInputPlhldr')} disabled={sites.length >= maxSites}
                                className="flex-1 disabled:cursor-not-allowed bg-black border border-zinc-700 text-white text-[13px] rounded-lg px-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400" />
                            <button type="button" onClick={addSiteFromInput} disabled={sites.length >= maxSites}
                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-[13px] rounded-lg border border-zinc-700 transition-colors">
                                {tc('add')}
                            </button>
                        </div>
                        {/* Sites sélectionnés */}
                        {sites.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {sites.map((site, i) => (
                                    <div key={i} className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700 text-[13px] text-zinc-300">
                                        <SmartImage 
                                            src={`https://www.google.com/s2/favicons?domain=${site}&sz=32`}
                                            fallbackSrc={globeIcon} 
                                            className="w-3.5 h-3.5 opacity-70" 
                                        />
                                        {site}
                                        <button type="button" onClick={() => setSites(p => p.filter((_, j) => j !== i))}
                                            className="hover:text-white text-zinc-500 ml-0.5">×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {sites.length === 0 && (
                            <p className="text-[13px] text-zinc-400 italic pt-1">{t('noSite')}</p>
                        )}
                    </Section>

                    {stepError && <ErrorBanner msg={stepError} />}

                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={() => setStep(1)}
                            className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">{tc('back')}</button>
                        <button type="submit"
                            className="px-5 py-2 bg-white hover:bg-zinc-200 text-black text-[13px] font-semibold rounded-lg transition-colors">
                            {t('create')}
                        </button>
                    </div>
                </Form>
            )}
            {/* ── AlertDialog — activer maintenant ou plus tard ? ── */}
            <AlertDialog open={showDialog}>
                <AlertDialogContent className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                    <AlertDialogHeader className="space-y-3">
                        <AlertDialogMedia>
                            <CheckCircleIcon fill='currentColor' stroke='#000' className="text-emerald-400" width="24" />
                        </AlertDialogMedia>
                        <AlertDialogTitle className="text-white text-sm font-semibold">
                            {t('created')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400 text-xs leading-relaxed">
                            {t('createdDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-2 mt-2">
                        {/* Plus tard → aller vers la liste */}
                        <button
                            type="button"
                            onClick={() => navigate('/profiles')}
                            className="flex-1 py-2.5 text-xs font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors"
                        >
                            {t('laterBtn')}
                        </button>
                        {/* Activer maintenant → TOGGLE_PROFILE puis redirection */}
                        <button
                            type="button"
                            onClick={async () => {
                                if (createdProfileId) {
                                    await sendToBackground({ type: 'TOGGLE_PROFILE', id: createdProfileId })
                                }
                                navigate('/profiles')
                            }}
                            className="flex-1 py-2.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                            <PlayIcon fill='currentColor' width="12" />
                            {t('activateNow')}
                        </button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default TimerProfileCreate