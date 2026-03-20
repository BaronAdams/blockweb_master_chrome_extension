import { useStateContext } from '@/context/GlobalStateContext'
import { Icon } from '@iconify/react'
import { ActionFunctionArgs, Form, redirect, useNavigate, useRouteLoaderData, useSubmit } from 'react-router-dom'
import { useRef } from 'react'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { IntervalRule, Profile, ProfileConfig, TimeRange, WeekDay } from '@/lib/types'
import { sendToBackground, isValidUrl, normalizeDomain } from '@/lib/utils'
import { useState } from 'react'
import { LIMITS } from '@/lib/constants'

/* =========================================================
   CONSTANTES
========================================================= */

const DAY_LABELS: { key: WeekDay; label: string; short: string }[] = [
    { key: 1, label: 'Lundi', short: 'L' },
    { key: 2, label: 'Mardi', short: 'Ma' },
    { key: 3, label: 'Mercredi', short: 'Me' },
    { key: 4, label: 'Jeudi', short: 'J' },
    { key: 5, label: 'Vendredi', short: 'V' },
    { key: 6, label: 'Samedi', short: 'S' },
    { key: 0, label: 'Dimanche', short: 'D' },
]

const TYPE_LABEL: Record<string, string> = {
    daily: 'Quotidien',
    hourly: 'Horaire',
    weekly: 'Hebdomadaire',
    interval: 'Programmé',
}

/* =========================================================
   ACTION React Router v6 — Édition d'un profil
   Reçoit : name, sites (JSON), config (JSON)
   Appelée par <Form method="POST"> dans le composant
========================================================= */
export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData()
    const intent = formData.get('intent') as string

    // Suppression — déléguée depuis TimerProfileDetail via submit({}, { action: 'edit' })
    // On ne gère pas la suppression ici, elle est dans la route 'delete'
    if (intent === 'delete') return null

    const name = (formData.get('name') as string)?.trim()
    const sitesRaw = formData.get('sites') as string
    const configRaw = formData.get('config') as string

    if (!name || !sitesRaw || !configRaw) return { error: 'Données manquantes.' }

    let sites: string[]
    let config: ProfileConfig
    try {
        sites = JSON.parse(sitesRaw)
        config = JSON.parse(configRaw)
    } catch { return { error: 'Données corrompues.' } }

    if (!sites.length) return { error: 'Ajoute au moins un site.' }
    if (config.type !== 'interval') {
        const limit =
            config.type === 'daily' ? config.dailyLimit :
                config.type === 'hourly' ? config.hourlyLimit :
                    config.weeklyLimit
        if (!limit) return { error: 'La limite doit être supérieure à 0.' }
    } else if (!config.rules.length) {
        return { error: 'Ajoute au moins une règle.' }
    }

    const profileId = params.profileId as string
    const res = await sendToBackground({
        type: 'EDIT_PROFILE',
        id: profileId,
        data: { name, sites, config },
    })
    if (res?.success) return redirect(`/profile/${profileId}`)
}

/* =========================================================
   SOUS-COMPOSANTS (mêmes que TimerProfileCreate)
========================================================= */

function DaySelector({ selected, onChange, disabled }: {
    selected: WeekDay[]; onChange: (d: WeekDay[]) => void; disabled?: boolean
}) {
    const toggle = (d: WeekDay) =>
        onChange(selected.includes(d) ? selected.filter(x => x !== d) : [...selected, d])

    return (
        <div className="flex gap-1.5 flex-wrap">
            {DAY_LABELS.map(({ key, short, label }) => (
                <button key={key} type="button" title={label} onClick={() => !disabled && toggle(key)}
                    disabled={disabled}
                    className={`w-8 h-8 rounded-lg text-[10px] font-semibold transition-all border disabled:cursor-not-allowed ${selected.includes(key)
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                        }`}>
                    {short}
                </button>
            ))}
            {!disabled && (
                <button type="button"
                    onClick={() => onChange(selected.length === 7 ? [] : DAY_LABELS.map(d => d.key))}
                    className="px-2 h-8 rounded-lg text-[10px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-all">
                    {selected.length === 7 ? 'Aucun' : 'Tous'}
                </button>
            )}
        </div>
    )
}

function DurationPicker({ maxHours, value, onChange, label, disabled }: {
    maxHours: number; value: { hours: number; mins: number }
    onChange: (v: { hours: number; mins: number }) => void; label?: string; disabled?: boolean
}) {
    return (
        <div className="space-y-1.5">
            {label && <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{label}</p>}
            <div className="flex items-center gap-2">
                {maxHours > 0 && (
                    <>
                        <div className="flex-1 relative">
                            <input type="number" min={0} max={maxHours} value={value.hours} disabled={disabled}
                                onChange={e => onChange({ ...value, hours: Math.min(maxHours, Math.max(0, Number(e.target.value))) })}
                                className="w-full disabled:opacity-50 disabled:bg-zinc-900 bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-zinc-500 transition-colors text-center" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">h</span>
                        </div>
                        <span className="text-zinc-600 font-bold">:</span>
                    </>
                )}
                <div className="flex-1 relative">
                    <input type="number" min={maxHours > 0 ? 0 : 1} max={59} value={value.mins} disabled={disabled}
                        onChange={e => onChange({ ...value, mins: Math.min(59, Math.max(maxHours > 0 ? 0 : 1, Number(e.target.value))) })}
                        className="w-full disabled:opacity-50 disabled:bg-zinc-900 bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-zinc-500 transition-colors text-center" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">min</span>
                </div>
            </div>
        </div>
    )
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */

const TimerProfileEdit = () => {
    const { currentProfile } = useRouteLoaderData('timer-profile') as { currentProfile: Profile | undefined }
    const navigate = useNavigate()
    const submit = useSubmit()
    const { state } = useStateContext()

    const isStrict = !!state?.strictModeUntil
    const maxSites = state?.isPremium ? 20 : LIMITS.FREE.sitesPerProfile

    /* ── Refs hidden inputs (React Router Form) ── */
    const sitesInputRef = useRef<HTMLInputElement>(null)
    const configInputRef = useRef<HTMLInputElement>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)

    /* ── Champs communs ── */
    const [name, setName] = useState(currentProfile?.name ?? '')
    const [siteInput, setSiteInput] = useState('')
    const [siteError, setSiteError] = useState('')
    const [sites, setSites] = useState<string[]>(currentProfile?.sites ?? [])
    const [error, setError] = useState<string | null>(null)

    /* ── Durée (daily / hourly / weekly) ── */
    const initDuration = (): { hours: number; mins: number } => {
        const cfg = currentProfile?.config
        if (!cfg) return { hours: 0, mins: 30 }
        if (cfg.type === 'daily') return { hours: Math.floor(cfg.dailyLimit / 60), mins: cfg.dailyLimit % 60 }
        if (cfg.type === 'hourly') return { hours: 0, mins: cfg.hourlyLimit }
        if (cfg.type === 'weekly') return { hours: Math.floor(cfg.weeklyLimit / 60), mins: cfg.weeklyLimit % 60 }
        return { hours: 0, mins: 30 }
    }
    const [duration, setDuration] = useState(initDuration)

    /* ── Jours (daily / hourly) ── */
    const [selectedDays, setSelectedDays] = useState<WeekDay[]>(() => {
        const cfg = currentProfile?.config
        if (cfg?.type === 'daily' || cfg?.type === 'hourly') return cfg.days ?? []
        return []
    })

    /* ── Plages horaires (hourly) ── */
    const [timeRanges, setTimeRanges] = useState<TimeRange[]>(() => {
        const cfg = currentProfile?.config
        return (cfg?.type === 'hourly' && cfg.timeRanges) ? cfg.timeRanges : []
    })
    const [newRangeStart, setNewRangeStart] = useState('09:00')
    const [newRangeEnd, setNewRangeEnd] = useState('18:00')

    /* ── Règles interval ── */
    const [rules, setRules] = useState<IntervalRule[]>(() => {
        const cfg = currentProfile?.config
        return cfg?.type === 'interval' ? cfg.rules : [{ days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' }]
    })
    const [newRuleDays, setNewRuleDays] = useState<WeekDay[]>([1, 2, 3, 4, 5])
    const [newRuleStart, setNewRuleStart] = useState('20:00')
    const [newRuleEnd, setNewRuleEnd] = useState('23:59')
    const [newRuleAllDay, setNewRuleAllDay] = useState(false)

    if (!currentProfile) {
        return (
            <div className="max-w-2xl mx-auto flex justify-center items-center py-16 text-zinc-400 text-sm">
                Ce profil n'existe pas.
            </div>
        )
    }

    const profileType = currentProfile.config.type
    // const maxHours    = profileType === 'hourly' ? 0 : profileType === 'weekly' ? 167 : 23

    /* ── Sites ── */
    const addSite = () => {
        const trimmed = siteInput.trim()
        if (!trimmed) return
        if (!isValidUrl(trimmed)) { setSiteError('URL invalide. Ex: youtube.com'); return }
        const normalized = normalizeDomain(trimmed)
        if (sites.includes(normalized)) { setSiteError('Ce site est déjà ajouté.'); return }
        if (sites.length >= maxSites) { setSiteError(`Maximum ${maxSites} sites atteint.`); return }
        setSites(s => [...s, normalized])
        setSiteInput('')
        setSiteError('')
    }

    /* ── Plages horaires ── */
    const addTimeRange = () => {
        if (newRangeStart >= newRangeEnd) return
        if (timeRanges.some(r => r.start === newRangeStart && r.end === newRangeEnd)) return
        setTimeRanges(p => [...p, { start: newRangeStart, end: newRangeEnd }])
    }

    /* ── Règles interval ── */
    const addRule = () => {
        if (newRuleDays.length === 0) return
        if (!newRuleAllDay && newRuleStart >= newRuleEnd) return
        setRules(p => [...p, {
            days: newRuleDays,
            startTime: newRuleAllDay ? '00:00' : newRuleStart,
            endTime: newRuleAllDay ? '23:59' : newRuleEnd,
            allDay: newRuleAllDay,
        }])
    }

    const toggleRuleDay = (ruleIdx: number, day: WeekDay) =>
        setRules(r => r.map((rule, i) => i !== ruleIdx ? rule : {
            ...rule,
            days: rule.days.includes(day) ? rule.days.filter(d => d !== day) : [...rule.days, day],
        }))

    /* ── Validation + injection hidden inputs avant submit React Router ── */
    const handleBeforeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        setError(null)
        if (!name.trim()) { e.preventDefault(); setError('Donne un nom au profil.'); return }
        if (!sites.length) { e.preventDefault(); setError('Ajoute au moins un site.'); return }

        const totalMins = duration.hours * 60 + duration.mins
        if (profileType !== 'interval' && totalMins === 0) { e.preventDefault(); setError('La limite doit être supérieure à 0.'); return }
        if (profileType === 'interval' && !rules.length) { e.preventDefault(); setError('Ajoute au moins une règle.'); return }
        if (profileType === 'interval' && rules.some(r => !r.days.length)) {
            e.preventDefault(); setError('Chaque règle doit avoir au moins un jour.'); return
        }

        const totalMinsF = duration.hours * 60 + duration.mins
        let config: ProfileConfig
        switch (profileType) {
            case 'daily': config = { type: 'daily', dailyLimit: totalMinsF, days: selectedDays.length ? selectedDays : undefined }; break
            case 'hourly': config = { type: 'hourly', hourlyLimit: duration.mins, days: selectedDays.length ? selectedDays : undefined, timeRanges: timeRanges.length ? timeRanges : undefined }; break
            case 'weekly': config = { type: 'weekly', weeklyLimit: totalMinsF }; break
            case 'interval': config = { type: 'interval', rules }; break
        }

        if (sitesInputRef.current) sitesInputRef.current.value = JSON.stringify(sites)
        if (configInputRef.current) configInputRef.current.value = JSON.stringify(config)
        if (nameInputRef.current) nameInputRef.current.value = name.trim()
    }

    return (
        <Form method="POST" onSubmit={handleBeforeSubmit}>
            <input ref={nameInputRef} type="hidden" name="name" />
            <input ref={sitesInputRef} type="hidden" name="sites" />
            <input ref={configInputRef} type="hidden" name="config" />

            <div className="max-w-2xl mx-auto space-y-6 pb-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                            <Icon icon="solar:arrow-left-linear" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-medium text-white">Éditer le Profil</h2>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 uppercase tracking-wide">
                                    {TYPE_LABEL[profileType]}
                                </span>
                            </div>
                            {isStrict && (
                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-0.5">
                                    <Icon icon="solar:lock-password-linear" /> Modification bloquée par le Mode Strict
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bouton suppression */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button type="button" disabled={state?.strictModeUntil != null}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 disabled:cursor-not-allowed">
                                <Icon icon="solar:trash-bin-trash-linear" />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogMedia>
                                    <Icon icon="solar:trash-bin-trash-bold" width="20" />
                                </AlertDialogMedia>
                                <AlertDialogTitle className='text-white text-sm font-semibold tracking-tight'>
                                    Supprimer le profil ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    <p className="text-zinc-500 text-[13px] mb-6 leading-relaxed">
                                        Voulez vous vraiment supprimer ce profil ? Cette action est irréversible.
                                    </p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className='text-xs'>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => submit({}, { method: 'post', action: 'delete' })}
                                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center justify-center gap-2">
                                    <Icon icon="solar:trash-bin-trash-linear" width="14" /> Supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Nom */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Nom du profil</p>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={isStrict}
                        className="w-full disabled:opacity-50 disabled:bg-zinc-900 bg-black border border-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-white/20 transition-colors" />
                </div>

                {/* Configuration */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 space-y-5">
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Configuration</p>

                    {/* DAILY */}
                    {profileType === 'daily' && (
                        <div className="space-y-4">
                            <DurationPicker maxHours={23} value={duration} onChange={setDuration} label="Durée max par jour" disabled={isStrict} />
                            <div className="space-y-2">
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                    Jours <span className="normal-case text-zinc-600">(vide = tous les jours)</span>
                                </p>
                                <DaySelector selected={selectedDays} onChange={setSelectedDays} disabled={isStrict} />
                            </div>
                        </div>
                    )}

                    {/* HOURLY */}
                    {profileType === 'hourly' && (
                        <div className="space-y-4">
                            <DurationPicker maxHours={0} value={{ hours: 0, mins: duration.mins }} onChange={v => setDuration({ hours: 0, mins: v.mins })} label="Durée max par heure (1–59 min)" disabled={isStrict} />
                            <div className="space-y-2">
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                    Jours <span className="normal-case text-zinc-600">(vide = tous les jours)</span>
                                </p>
                                <DaySelector selected={selectedDays} onChange={setSelectedDays} disabled={isStrict} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                    Plages horaires <span className="normal-case text-zinc-600">(vide = toute la journée)</span>
                                </p>
                                {!isStrict && (
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <input type="time" value={newRangeStart} onChange={e => setNewRangeStart(e.target.value)}
                                            className="bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-zinc-500" />
                                        <span className="text-zinc-600 text-xs">→</span>
                                        <input type="time" value={newRangeEnd} onChange={e => setNewRangeEnd(e.target.value)}
                                            className="bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-zinc-500" />
                                        <button type="button" onClick={addTimeRange}
                                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg border border-zinc-700 transition-colors">
                                            + Ajouter
                                        </button>
                                    </div>
                                )}
                                {timeRanges.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {timeRanges.map((r, i) => (
                                            <div key={i} className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700 text-[10px] text-zinc-300">
                                                {r.start} → {r.end}
                                                {!isStrict && (
                                                    <button type="button" onClick={() => setTimeRanges(p => p.filter((_, j) => j !== i))}
                                                        className="ml-1 hover:text-white text-zinc-400">×</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* WEEKLY */}
                    {profileType === 'weekly' && (
                        <DurationPicker maxHours={167} value={duration} onChange={setDuration} label="Durée max par semaine" disabled={isStrict} />
                    )}

                    {/* INTERVAL */}
                    {profileType === 'interval' && (
                        <div className="space-y-4">
                            {!isStrict && (
                                <>
                                    <label className="flex items-center gap-2 cursor-pointer" onClick={() => setNewRuleAllDay(v => !v)}>
                                        <div className={`w-9 h-5 rounded-full transition-colors relative ${newRuleAllDay ? 'bg-white' : 'bg-zinc-700'}`}>
                                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform ${newRuleAllDay ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </div>
                                        <span className="text-[11px] text-zinc-400">Toute la journée</span>
                                    </label>

                                    <div className="space-y-2">
                                        <p className="text-[10px] text-zinc-400">Jours</p>
                                        <DaySelector selected={newRuleDays} onChange={setNewRuleDays} />
                                    </div>

                                    {!newRuleAllDay && (
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <input type="time" value={newRuleStart} onChange={e => setNewRuleStart(e.target.value)}
                                                className="bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-zinc-500" />
                                            <span className="text-zinc-600 text-xs">→</span>
                                            <input type="time" value={newRuleEnd} onChange={e => setNewRuleEnd(e.target.value)}
                                                className="bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-zinc-500" />
                                        </div>
                                    )}

                                    <button type="button" onClick={addRule}
                                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg border border-zinc-700 transition-colors">
                                        + Ajouter cette plage
                                    </button>
                                </>
                            )}

                            {rules.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Règles actives</p>
                                    {rules.map((rule, i) => (
                                        <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-400 font-medium">Règle {i + 1}</span>
                                                {!isStrict && (
                                                    <button type="button" onClick={() => setRules(r => r.filter((_, j) => j !== i))}
                                                        className="text-zinc-600 hover:text-red-400 transition-colors">
                                                        <Icon icon="solar:trash-bin-trash-linear" width="14" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Jours de la règle existante */}
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] text-zinc-600">Jours actifs</p>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {DAY_LABELS.map(({ key, short }) => (
                                                        <button key={key} type="button" disabled={isStrict}
                                                            onClick={() => toggleRuleDay(i, key)}
                                                            className={`w-8 h-8 rounded-lg text-[10px] font-semibold transition-all border disabled:cursor-not-allowed ${rule.days.includes(key)
                                                                ? 'bg-white text-black border-white'
                                                                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                                                                }`}>
                                                            {short}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-zinc-400">
                                                {rule.allDay ? 'Toute la journée' : `${rule.startTime} → ${rule.endTime}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sites */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Sites surveillés</p>
                        <span className="text-[10px] text-zinc-600">{sites.length}/{maxSites}</span>
                    </div>

                    <div className="flex gap-2">
                        <input type="text" value={siteInput}
                            onChange={e => { setSiteInput(e.target.value); setSiteError('') }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSite() } }}
                            disabled={sites.length >= maxSites || isStrict}
                            placeholder="Nouveau site... Ex: youtube.com"
                            className="flex-1 disabled:opacity-50 disabled:bg-zinc-900 bg-black border border-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-white/20 transition-colors" />
                        <button type="button" onClick={addSite} disabled={sites.length >= maxSites || isStrict}
                            className="px-4 bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg hover:bg-zinc-700 border border-zinc-700 transition-colors">
                            <Icon icon="solar:add-circle-linear" />
                        </button>
                    </div>

                    {siteError && <p className="text-xs text-red-400">{siteError}</p>}

                    <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        {sites.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic px-4 py-3">Aucun site ajouté</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <tbody className="divide-y divide-zinc-800 bg-black text-xs">
                                    {sites.map((site, i) => (
                                        <tr key={i} className="hover:bg-zinc-900/30">
                                            <td className="px-4 py-3 flex items-center gap-3">
                                                <img src={`https://www.google.com/s2/favicons?domain=${site}&sz=28`}
                                                    className="w-5 h-5 opacity-70" alt="" />
                                                <span className="text-zinc-300">{site}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button type="button" disabled={isStrict}
                                                    onClick={() => setSites(s => s.filter((_, j) => j !== i))}
                                                    className="w-6 h-6 disabled:cursor-not-allowed flex items-center justify-center rounded bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-500 text-zinc-400 transition-colors">
                                                    <Icon icon="solar:trash-bin-trash-linear" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Erreur */}
                {error && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                        <Icon icon="solar:danger-circle-linear" className="text-rose-400 shrink-0" width="14" />
                        <p className="text-[11px] text-rose-300">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end">
                    <button type="submit" disabled={isStrict}
                        className="px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
                        Enregistrer les modifications
                    </button>
                </div>
            </div>
        </Form>
    )
}

export default TimerProfileEdit