import React, { useEffect, useState, useMemo } from 'react'
import { formatDuration, getLiveTodayTime, domainMatchesSite, sendToBackground } from '@/lib/utils';
import { SITE_CATEGORIES, CATEGORY_META, SiteCategory } from '@/lib/constants';
import { PREDEFINED_ADULT_DOMAINS } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '@/context/GlobalStateContext';
import SmartImage from '@/components/SmartImage';
import globeIcon from '@/assets/globe.svg';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
    LineChart, Line,
    PieChart, Pie, Cell,
} from 'recharts';
import { Calendar, ChartLine, ChartColumnBig, Globe, Eye, History, Hourglass, Info, Shield, ShieldCheck, Hash } from 'lucide-react';

/* =========================================================
   PALETTE
========================================================= */
const DAY_COMPARE_COLORS = ['#818cf8', '#34d399', '#fb923c']

/* =========================================================
   HELPERS
========================================================= */
const pad2 = (n: number) => String(n).padStart(2, '0')

function todayKey(): string {
    const d = new Date()
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
}

function getLast14Days(): string[] {
    return Array.from({ length: 14 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i)
        return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
    })
}

function getLast7Days(): string[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
    })
}

function getLast30Days(): string[] {
    return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i))
        return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
    })
}

function shortDate(iso: string): string {
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
}

function heatColor(ms: number, maxMs: number): string {
    if (ms === 0 || maxMs === 0) return '#18181b'
    const r = Math.min(ms / maxMs, 1)
    if (r < 0.25) return '#312e26'
    if (r < 0.5)  return '#78350f'
    if (r < 0.75) return '#d97706'
    return '#f59e0b'
}

/* =========================================================
   TOOLTIPS
========================================================= */
const HourlyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
    const active_ = payload.filter((p: any) => (p.value ?? 0) > 0)
        .sort((a: any, b: any) => b.value - a.value)
    if (!active_.length) return null
    return (
        <div className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-2xl min-w-[160px]">
            <p className="text-zinc-400 mb-2 font-medium">{label}h00</p>
            {active_.map((p: any) => (
                <p key={p.dataKey} className="flex justify-between gap-4" style={{ color: p.fill }}>
                    <span className="truncate max-w-[110px]">{p.dataKey}</span>
                    <span className="font-mono shrink-0">{formatDuration(p.value)}</span>
                </p>
            ))}
            {active_.length > 1 && (
                <p className="flex justify-between gap-4 text-zinc-400 border-t border-zinc-800 mt-1.5 pt-1.5">
                    <span>Total</span>
                    <span className="font-mono">{formatDuration(total)}</span>
                </p>
            )}
        </div>
    )
}

const CompareTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl min-w-[140px]">
            <p className="text-zinc-400 mb-1.5 font-medium">{label}h00</p>
            {payload.filter((p: any) => (p.value ?? 0) > 0).map((p: any, i: number) => (
                <p key={i} className="flex justify-between gap-4" style={{ color: p.stroke }}>
                    <span>{p.name}</span>
                    <span className="font-mono">{formatDuration(p.value)}</span>
                </p>
            ))}
        </div>
    )
}

const LineTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="text-zinc-400 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.stroke }}>{formatDuration(p.value)}</p>
            ))}
        </div>
    )
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const Analytics: React.FC = () => {
    const { t }  = useTranslation('analytics')
    const { t: tc } = useTranslation('common')
    const { state } = useStateContext()
    const [now, setNow] = useState(Date.now())
    const navigate = useNavigate()
    const [selectedDays, setSelectedDays] = useState<string[]>([todayKey()])
    const [compareMode,   setCompareMode]   = useState(false)
    // selectedDay = jour actif pour le donut, la table et le sélecteur de la table.
    // Se synchronise avec selectedDays[0] quand on change de jour dans le bar chart.
    const [selectedDay, setSelectedDay] = useState<string>(todayKey())

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 5000)
        return () => clearInterval(id)
    }, [])

    const today  = todayKey()
    const last14 = getLast14Days()
    const last7  = getLast7Days()
    const last30 = getLast30Days()

    /* ── Sites aujourd'hui ── */
    const sites = useMemo(() =>
        Object.values(state?.siteUsage || {})
            .map(u => ({ ...u, liveMs: getLiveTodayTime(u, now) }))
            .filter(u => u.liveMs > 0)
            .sort((a, b) => b.liveMs - a.liveMs)
    , [state?.siteUsage, now])

    /* ── Classifier un domaine dans une catégorie de productivité ──
       Déclaré avant domainColor pour éviter la Temporal Dead Zone (TDZ).
       Le build minifie les const arrow functions — si classifyDomain est déclaré
       après domainColor, le bundler lève "Cannot access 'x' before initialization".
    ── */
    const classifyDomain = (domain: string): SiteCategory => {
        // Priorité 1 : catégories prédéfinies (adult/distraction/entertainment/productivity)
        // → un domaine ici ne peut jamais être reclassifié par les listes dynamiques
        if (SITE_CATEGORIES.distraction.some(s => domainMatchesSite(domain, s)))   return 'distraction'
        if (SITE_CATEGORIES.entertainment.some(s => domainMatchesSite(domain, s))) return 'entertainment'
        if (SITE_CATEGORIES.productivity.some(s => domainMatchesSite(domain, s)))  return 'productivity'

        // Priorité 2 : adulte (liste prédéfinie + détection dynamique)
        const adultList    = PREDEFINED_ADULT_DOMAINS as readonly string[]
        const detectedList = state?.detectedAdultDomains ?? []
        const isAdult =
            adultList.some((s: string) => domainMatchesSite(domain, s)) ||
            detectedList.some((s: string) => domainMatchesSite(domain, s))
        if (isAdult) return 'adult'

        // Priorité 3 : sites ajoutés manuellement à la productivité par l'utilisateur
        const customProd = state?.customProductivitySites ?? []
        if (customProd.some((s: string) => domainMatchesSite(domain, s))) return 'productivity'

        return 'other'
    }

    /* ── Couleur stable par domaine ── */
    // Couleur par domaine = couleur de sa catégorie de productivité
    // → cohérence visuelle entre le donut et le bar chart horaire
    const domainColor = useMemo(() => {
        const all = [...new Set(Object.keys(state?.siteUsage ?? {}))]
        return Object.fromEntries(
            all.map(d => [d, CATEGORY_META[classifyDomain(d)].color])
        )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state?.siteUsage, state?.detectedAdultDomains])

    /* ── Domaines actifs sur les jours sélectionnés ── */
    const activeDomains = useMemo(() => {
        const set = new Set<string>()
        for (const day of selectedDays) {
            for (const [domain, usage] of Object.entries(state?.siteUsage ?? {})) {
                for (let h = 0; h < 24; h++) {
                    if ((usage.history?.[`${day}:${pad2(h)}`] ?? 0) > 0) set.add(domain)
                }
                // Ajouter aussi si c'est aujourd'hui avec activité live
                if (day === today && getLiveTodayTime(usage, now) > 0) set.add(domain)
            }
        }
        return [...set].sort()
    }, [state?.siteUsage, selectedDays, today, now])

    /* ── Données bar chart horaire (mode normal) ── */
    const hourlyData = useMemo(() => {
        if (compareMode) return []
        const day = selectedDays[0] ?? today
        return Array.from({ length: 24 }, (_, h) => {
            const hKey  = `${day}:${pad2(h)}`
            const point: Record<string, any> = { hour: pad2(h) }
            for (const domain of activeDomains) {
                const stored = state?.siteUsage?.[domain]?.history?.[hKey] ?? 0
                // Ajouter le delta live pour l'heure courante aujourd'hui
                let liveExtra = 0
                if (day === today && h === new Date(now).getHours()) {
                    const u = state?.siteUsage?.[domain]
                    if (u?.lastStart) {
                        liveExtra = now - u.lastStart
                    }
                }
                point[domain] = stored + Math.max(0, liveExtra)
            }
            return point
        })
    }, [state?.siteUsage, selectedDays, activeDomains, compareMode, today, now])

    /* ── Données mode comparaison (line chart) ── */
    const compareData = useMemo(() => {
        if (!compareMode) return []
        return Array.from({ length: 24 }, (_, h) => {
            const point: Record<string, any> = { hour: pad2(h) }
            for (const day of selectedDays) {
                let total = 0
                for (const usage of Object.values(state?.siteUsage ?? {})) {
                    total += usage.history?.[`${day}:${pad2(h)}`] ?? 0
                }
                const label = day === today ? tc('today') : shortDate(day)
                point[label] = total
            }
            return point
        })
    }, [state?.siteUsage, selectedDays, compareMode, today])

    const hasActivity = hourlyData.some(r => activeDomains.some(d => (r[d] ?? 0) > 0))

    /* ── Sites pour le jour sélectionné (donut + table) ── */
    const sitesForDay = useMemo(() => {
        const isToday = selectedDay === today
        return Object.values(state?.siteUsage ?? {})
            .map(u => {
                // Pour aujourd'hui : utiliser getLiveTodayTime (inclut le live)
                // Pour les autres jours : lire depuis history[day]
                const ms = isToday
                    ? getLiveTodayTime(u, now)
                    : (u.history?.[selectedDay] ?? 0)
                return { ...u, liveMs: ms }
            })
            .filter(u => u.liveMs > 0)
            .sort((a, b) => b.liveMs - a.liveMs)
    }, [state?.siteUsage, selectedDay, today, now])

    /* ── Données donut — répartition par catégorie pour le jour sélectionné ── */
    const donutData = useMemo(() => {
        const totals: Record<SiteCategory, number> = {
            adult:         0,
            distraction:   0,
            entertainment: 0,
            productivity:  0,
            other:         0,
        }

        for (const u of sitesForDay) {
            const cat = classifyDomain(u.domain)
            totals[cat] += u.liveMs
        }

        const total = Object.values(totals).reduce((s, v) => s + v, 0)
        const order: SiteCategory[] = ['adult', 'distraction', 'entertainment', 'productivity', 'other']
        const segments = order
            .filter(cat => totals[cat] > 0)
            .map(cat => ({
                cat,
                ...CATEGORY_META[cat],
                value: totals[cat],
                pct:   total > 0 ? Math.round(totals[cat] / total * 100) : 0,
            }))

        return {
            segments,
            totals,
            total,
            hasAdult:     totals.adult > 0,
            adultBlocked: state?.adultContentBlocked ?? false,
        }
    }, [sitesForDay, state?.adultContentBlocked, state?.detectedAdultDomains])

    /* ── Données BarChart "Moyenne vs Aujourd'hui" (7 jours) ── */
    const avgVsTodayData = useMemo(() => {
        const past6Days    = getLast7Days().slice(0, 6)

        return sites.slice(0, 8).map(u => {
            const history      = u.history ?? {}
            const daysWithData = past6Days.filter(d => (history[d] ?? 0) > 0)

            // Diviser par le nombre de jours RÉELLEMENT trackés (pas forcément 6).
            // Si l'utilisateur a 2 jours de données on moyenne sur 2.
            // Quand il atteint 6 jours la moyenne se stabilise à pleine résolution.
            const avgMs = daysWithData.length > 0
                ? daysWithData.reduce((s, d) => s + (history[d] ?? 0), 0) / daysWithData.length
                : 0

            return {
                domain:      u.domain.length > 14 ? u.domain.slice(0,12)+'…' : u.domain,
                Moyenne:     Math.round(avgMs),
                Aujourd_hui: u.liveMs,
                daysTracked: daysWithData.length,
            }
        })
    }, [sites])

    // Nombre de jours avec historique dispo (max 6 = les 6 jours avant aujourd'hui)
    const daysOfHistoryAvailable = useMemo(() => {
        const past6  = getLast7Days().slice(0, 6)
        const usageH = state?.usageHistory ?? {}
        return past6.filter(d => (usageH[d] ?? 0) > 0).length
    }, [state?.usageHistory])

    // Label dynamique pour la légende/tooltip selon les jours réels
    const avgLabel = daysOfHistoryAvailable > 0 ? t('avgLabel', { n: daysOfHistoryAvailable }) : t('avgLabelDefault')

    /* ── 7 jours ── */
    const lineData = useMemo(() =>
        last7.map(day => ({
            day:   shortDate(day),
            Total: state?.usageHistory?.[day] ?? 0,
        }))
    , [state?.usageHistory, last7])

    /* ── Heatmap ── */
    const maxDayMs = useMemo(() => Math.max(...last30.map(d => state?.usageHistory?.[d] ?? 0), 1), [state?.usageHistory, last30])
    const heatRows = useMemo(() => {
        const rows: {day: string; ms: number}[][] = []
        for (let i = 0; i < 30; i += 6)
            rows.push(last30.slice(i, i+6).map(d => ({ day: d, ms: state?.usageHistory?.[d] ?? 0 })))
        return rows
    }, [state?.usageHistory, last30])

    // totalToday = total du jour sélectionné (pas forcément aujourd'hui)
    const totalToday = sitesForDay.reduce((s, u) => s + u.liveMs, 0)
    const totalHist  = Object.entries(state?.usageHistory ?? {})
        .filter(([k]) => !k.includes(':'))
        .reduce((s, [, v]) => s + v, 0)

    /* ── Sélection de jours ── */
    const toggleDay = (day: string) => {
        // Synchroniser toujours selectedDay (donut + table)
        setSelectedDay(day)
        if (!compareMode) { setSelectedDays([day]); return }
        setSelectedDays(prev => {
            if (prev.includes(day)) return prev.length > 1 ? prev.filter(d => d !== day) : prev
            return prev.length >= 3 ? [...prev.slice(1), day] : [...prev, day]
        })
    }

    return (
        <div id="tab-analytics" className="space-y-8 max-w-5xl mx-auto">

            {/* ── Métriques ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: <Globe width="16"/>, label: t('blockedSites'),  value: state?.activeBlockedDomains.length ?? 0 },
                    { icon: <Hash width="16"/>,      label: t('keywords'),      value: state?.activeBlockedKeywords.length ?? 0 },
                    { icon: <Hourglass width="16"/>,   label: t('activeProfiles'), value: state?.activeProfiles.filter(p => p.isActive).length ?? 0 },
                    { icon: <Eye width="16"/>,              label: selectedDay === today ? t('visits') : t('visitsDay', { date: shortDate(selectedDay) }), value: sitesForDay.length },
                ].map(({ icon, label, value }) => (
                    <div key={label} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between h-24">
                        <div className="flex items-center justify-between text-zinc-500">
                            {icon}
                            <span className="text-[10px] uppercase tracking-wide">{label}</span>
                        </div>
                        <span className="text-2xl font-semibold text-white tracking-tight">{value}</span>
                    </div>
                ))}
            </div>

            {/* ── Totaux ── */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                        {selectedDay === today ? t('todayTotal') : t('dayTotal', { date: shortDate(selectedDay) })}
                    </p>
                    <p className="text-2xl font-bold text-white">{formatDuration(totalToday)}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t('historicTotal')}</p>
                    <p className="text-2xl font-bold text-white">{formatDuration(totalHist)}</p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                BAR CHART HORAIRE
            ═══════════════════════════════════════════ */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">

                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-zinc-800 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white">{t('hourlyChart')}</h3>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                                {compareMode
                                    ? t('compareMode')
                                    : t('hourlyDesc')}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const next = !compareMode
                                setCompareMode(next)
                                // À la DÉSACTIVATION de la comparaison → reset sur aujourd'hui
                                // (avant : le reset était à l'activation, c'était inversé)
                                if (!next) {
                                    setSelectedDays([today])
                                    setSelectedDay(today)
                                }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors shrink-0 ${
                                compareMode
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                        >
                            <ChartLine width="12" />
                            {compareMode ? t('compareActive') : t('compareDays')}
                        </button>
                    </div>

                    {/* Sélecteur 14 jours */}
                    <div className="flex gap-1.5 flex-wrap">
                        {last14.map((day, i) => {
                            const isSelected = selectedDays.includes(day)
                            const colorIdx   = selectedDays.indexOf(day)
                            const label      = i === 0 ? tc('today').slice(0,4) + '.' : i === 1 ? tc('yesterday').slice(0,4) + '.' : shortDate(day)
                            const hasData    = (state?.usageHistory?.[day] ?? 0) > 0 || day === today
                            return (
                                <button key={day} onClick={() => toggleDay(day)}
                                    disabled={!hasData}
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all
                                        disabled:opacity-20 disabled:cursor-not-allowed ${
                                        isSelected && !compareMode
                                            ? 'bg-white text-black border-white'
                                            : isSelected && compareMode
                                            ? 'border-transparent'
                                            : 'text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
                                    }`}
                                    style={isSelected && compareMode ? {
                                        background: DAY_COMPARE_COLORS[colorIdx] + '2a',
                                        borderColor: DAY_COMPARE_COLORS[colorIdx] + '70',
                                        color: DAY_COMPARE_COLORS[colorIdx],
                                    } : {}}
                                >
                                    {label}
                                </button>
                            )
                        })}
                        {compareMode && (
                            <span className="text-[10px] text-zinc-600 self-center ml-1">
                                ({selectedDays.length}/3 {selectedDays.length > 1 ? t('selectedPlural') : t('selected')})
                            </span>
                        )}
                    </div>
                </div>

                {/* Chart */}
                <div className="p-5">
                    {!compareMode ? (
                        !hasActivity ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-700">
                                <ChartColumnBig width="32" />
                                <p className="text-xs">{t('noActivity')}</p>
                                {selectedDays[0] !== today && (
                                    <p className="text-[10px] text-zinc-700">
                                        {t('noActivityHint')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={hourlyData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }} barCategoryGap="18%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                        <XAxis dataKey="hour" tick={{ fill: '#71717a', fontSize: 10 }}
                                            axisLine={false} tickLine={false}
                                            tickFormatter={h => Number(h) % 2 === 0 ? t('getHour', { h }) : ''} />
                                        <YAxis
                                            domain={[0, 3_599_999]}
                                            ticks={[0, 900_000, 1_800_000, 2_700_000, 3_599_999]}
                                            tickFormatter={v => {
                                                if (v === 0)         return '0'
                                                if (v === 900_000)   return t('15min')
                                                if (v === 1_800_000) return t('30min')
                                                if (v === 2_700_000) return t('45min')
                                                return t('60min')
                                            }}
                                            tick={{ fill: '#52525b', fontSize: 9 }}
                                            axisLine={false} tickLine={false} width={46} />
                                        <Tooltip content={<HourlyTooltip />} cursor={{ fill: '#27272a' }} />
                                        {activeDomains.map((domain, i) => (
                                            <Bar key={domain} dataKey={domain} stackId="h"
                                                fill={domainColor[domain] ?? CATEGORY_META['other'].color}
                                                radius={i === activeDomains.length - 1 ? [3,3,0,0] : [0,0,0,0]} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                                    {activeDomains.map(domain => (
                                        <div key={domain} className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                                                style={{ background: domainColor[domain] }} />
                                            <span className="text-[10px] text-zinc-400">{domain}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={compareData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="hour" tick={{ fill: '#71717a', fontSize: 10 }}
                                        axisLine={false} tickLine={false}
                                        tickFormatter={h => Number(h) % 2 === 0 ? t('getHour', { h }) : ''} />
                                    <YAxis
                                        domain={[0, 3_599_999]}
                                        ticks={[0, 900_000, 1_800_000, 2_700_000, 3_599_999]}
                                        tickFormatter={v => {
                                            if (v === 0)         return '0'
                                            if (v === 900_000)   return t('15min')
                                            if (v === 1_800_000) return t('30min')
                                            if (v === 2_700_000) return t('45min')
                                            return t('60min')
                                        }}
                                        tick={{ fill: '#52525b', fontSize: 9 }}
                                        axisLine={false} tickLine={false} width={46} />
                                    <Tooltip content={<CompareTooltip />} />
                                    {selectedDays.map((day, i) => {
                                        const name = day === today ? tc('today') : shortDate(day)
                                        return (
                                            <Line key={day} type="monotone" dataKey={name}
                                                stroke={DAY_COMPARE_COLORS[i]} strokeWidth={2}
                                                dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                        )
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="flex gap-5 mt-3">
                                {selectedDays.map((day, i) => (
                                    <div key={day} className="flex items-center gap-1.5">
                                        <span className="w-6 h-0.5 rounded-full" style={{ background: DAY_COMPARE_COLORS[i] }} />
                                        <span className="text-[10px]" style={{ color: DAY_COMPARE_COLORS[i] }}>
                                            {day === today ? tc('today') : shortDate(day)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                DONUT + BAR CHART "MOYENNE VS AUJOURD'HUI"
                Affichés côte à côte sur grand écran
            ═══════════════════════════════════════════════════════ */}
            {sites.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ── Donut : répartition du temps aujourd'hui ── */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                            {t('whereTime')}
                        </h3>
                        <p className="text-[10px] text-zinc-600 mb-4">
                            {selectedDay === today ? tc('today') : shortDate(selectedDay)}
                            {' · '}{donutData.total > 0 ? formatDuration(donutData.total) : '—'}
                        </p>

                        {donutData.segments.length === 0 ? (
                            <div className="flex items-center justify-center py-10 text-zinc-700">
                                <p className="text-xs">{t('noData')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Centre du donut — score de productivité
                                    Le score est positionné via CSS pur (pas dans le stacking
                                    context du PieChart) pour ne pas interférer avec le z-index
                                    du tooltip Recharts.
                                    Le tooltip a wrapperStyle.zIndex=100 et son contenu utilise
                                    position:relative + isolation:isolate pour être toujours
                                    au-dessus du score.
                                */}
                                <div style={{ position: 'relative' }}>
                                    {/* Score au centre — z-index bas, pointer-events none */}
                                    <div style={{
                                        position:       'absolute',
                                        inset:          0,
                                        display:        'flex',
                                        flexDirection:  'column',
                                        alignItems:     'center',
                                        justifyContent: 'center',
                                        pointerEvents:  'none',
                                        zIndex:         1,
                                    }}>
                                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                            {donutData.total > 0
                                                ? Math.round((donutData.totals.productivity / donutData.total) * 100)
                                                : 0}%
                                        </span>
                                        <span style={{ fontSize: '9px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>
                                            {t('productif')}
                                        </span>
                                    </div>

                                    <ResponsiveContainer width="100%" height={190}>
                                        <PieChart>
                                            <Pie
                                                data={donutData.segments}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={56}
                                                outerRadius={84}
                                                paddingAngle={2}
                                                dataKey="value"
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {donutData.segments.map((s, i) => (
                                                    <Cell key={i} fill={s.color} stroke="transparent" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                wrapperStyle={{ zIndex: 100, outline: 'none' }}
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null
                                                    const p = payload[0].payload
                                                    return (
                                                        <div style={{
                                                            position:     'relative',
                                                            isolation:    'isolate',
                                                            background:   '#09090b',
                                                            border:       '1px solid #3f3f46',
                                                            borderRadius: '10px',
                                                            padding:      '10px 14px',
                                                            fontSize:     '12px',
                                                            boxShadow:    '0 8px 32px rgba(0,0,0,0.9)',
                                                            minWidth:     '160px',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                                <span style={{ fontSize: '16px' }}>{p.emoji}</span>
                                                                <span style={{ color: p.color, fontWeight: 700 }}>{p.label}</span>
                                                            </div>
                                                            <p style={{ color: '#e4e4e7', fontFamily: 'monospace', marginBottom: '2px' }}>
                                                                {formatDuration(p.value)}
                                                            </p>
                                                            <p style={{ color: p.color, fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>
                                                                {p.pct}%
                                                            </p>
                                                            <p style={{ color: '#52525b', fontSize: '10px' }}>{p.desc}</p>
                                                        </div>
                                                    )
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Légende avec durée + % */}
                                <div className="space-y-2 mt-1">
                                    {donutData.segments.map(s => (
                                        <div key={s.cat} className="flex items-center gap-2.5">
                                            <span className="text-sm shrink-0">{s.emoji}</span>
                                            <span className="text-[10px] text-zinc-400 flex-1 leading-tight">{s.label}</span>
                                            <span className="text-[10px] font-mono text-zinc-300">{formatDuration(s.value)}</span>
                                            <div className="w-8 text-right">
                                                <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.pct}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Alertes contextuelles */}
                                <div className="space-y-2 mt-3">
                                    {/* Alerte contenu adulte */}
                                    {donutData.hasAdult && (
                                        <div className="flex items-start gap-2 p-2.5 rounded-lg"
                                            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                                            <span className="text-[11px] shrink-0">🔞</span>
                                            <p className="text-[10px] leading-relaxed" style={{ color: '#fda4af' }}>
                                                {donutData.adultBlocked
                                                    ? <>{t('adultWarningBlocked', { time: formatDuration(donutData.totals.adult) })}</>
                                                    : <>{t('adultWarningFree', { time: formatDuration(donutData.totals.adult) })}</>
                                                }
                                            </p>
                                        </div>
                                    )}
                                    {/* Alerte distraction */}
                                    {donutData.totals.distraction > 0 && donutData.total > 0 &&
                                     Math.round(donutData.totals.distraction / donutData.total * 100) >= 40 && (
                                        <div className="flex items-start gap-2 p-2.5 bg-rose-500/8 border border-rose-500/15 rounded-lg">
                                            <span className="text-[11px] shrink-0">📱</span>
                                            <p className="text-[10px] text-rose-400/80 leading-relaxed">
                                                {t('distractionWarning', { pct: Math.round(donutData.totals.distraction / donutData.total * 100) })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Bar chart : Moyenne quotidienne vs Aujourd'hui ── */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                            {t('todayVsAvg')}
                        </h3>
                        <p className="text-[10px] text-zinc-600 mb-4">
                            {t('todayVsAvgDesc')}
                        </p>

                        {daysOfHistoryAvailable === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                    <Calendar className="text-zinc-500" width="18" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 font-medium">{t('insufficientHistory')}</p>
                                    <p className="text-[10px] text-zinc-700 mt-1 max-w-[200px] leading-relaxed">
                                        {t('insufficientDesc')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className={`w-5 h-1.5 rounded-full ${
                                            i < daysOfHistoryAvailable ? 'bg-zinc-400' : 'bg-zinc-800'
                                        }`} />
                                    ))}
                                    <span className="text-[9px] text-zinc-600 ml-1">
                                        {daysOfHistoryAvailable}/6 {t('daysTracked')}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            // Données partielles (< 3j) ou suffisantes (>= 3j) — même graphe
                            <div className="space-y-3">
                                {daysOfHistoryAvailable < 3 && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                                        <Info className="text-amber-400 shrink-0" width="13" />
                                        <p className="text-[10px] text-amber-300/80">
                                            {t('partialAvg', { n: daysOfHistoryAvailable })}
                                        </p>
                                    </div>
                                )}
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={avgVsTodayData} margin={{ left: 8, right: 8 }} barCategoryGap="25%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                        <XAxis dataKey="domain" tick={{ fill: '#a1a1aa', fontSize: 9 }}
                                            axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={v => v === 0 ? '' : formatDuration(v)}
                                            tick={{ fill: '#71717a', fontSize: 9 }}
                                            axisLine={false} tickLine={false} width={48} />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (!active || !payload?.length) return null
                                                const over = (payload.find((p: any) => p.dataKey === tc('today'))?.value ?? 0) >
                                                             (payload.find((p: any) => p.dataKey === t('avgLabelDefault'))?.value ?? 0)
                                                return (
                                                    <div className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl min-w-[140px]">
                                                        <p className="text-zinc-400 mb-1.5">{label}</p>
                                                        {payload.map((p: any) => (
                                                            <p key={p.dataKey} className="flex justify-between gap-4" style={{ color: p.fill }}>
                                                                <span>{p.dataKey === tc('today') ? tc('today') : avgLabel}</span>
                                                                <span className="font-mono">{formatDuration(p.value)}</span>
                                                            </p>
                                                        ))}
                                                        {over && <p className="text-rose-400 text-[10px] mt-1.5">{t('aboveAvg')}</p>}
                                                    </div>
                                                )
                                            }}
                                            cursor={{ fill: '#27272a' }}
                                        />
                                        <Legend
                                            formatter={v => v === tc('today') ? tc('today') : avgLabel}
                                            wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }}
                                        />
                                        <Bar dataKey="Moyenne"     fill="#3f3f46" radius={[3,3,0,0]} />
                                        <Bar dataKey="Aujourd_hui" fill="#f59e0b" radius={[3,3,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                LIGNE 7 JOURS
            ═══════════════════════════════════════════ */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    {t('evolution7d')}
                </h3>
                <p className="text-[10px] text-zinc-600 mb-4">
                    {t('evolution7dDesc')}
                </p>
                {lineData.every(d => d.Total === 0) ? (
                    <div className="flex items-center justify-center py-10 text-zinc-700">
                        <p className="text-xs">{t('notEnoughData')}</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={lineData} margin={{ left: 8, right: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={v => formatDuration(v)} tick={{ fill: '#71717a', fontSize: 9 }}
                                axisLine={false} tickLine={false} width={50} />
                            <Tooltip content={<LineTooltip />} />
                            <Line type="monotone" dataKey="Total" stroke="#818cf8" strokeWidth={2}
                                dot={{ fill: '#818cf8', r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: '#818cf8' }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ═══════════════════════════════════════════
                HEATMAP 30 JOURS
            ═══════════════════════════════════════════ */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    {t('heatmap30d')}
                </h3>
                <p className="text-[10px] text-zinc-600 mb-4">
                    {t('heatmapDesc')}
                </p>
                <div className="space-y-1.5">
                    {heatRows.map((row, ri) => (
                        <div key={ri} className="flex gap-1.5">
                            {row.map(({ day, ms }) => (
                                <div key={day}
                                    className="flex-1 h-8 rounded-md flex items-center justify-center cursor-default group relative"
                                    style={{ background: heatColor(ms, maxDayMs) }}
                                >
                                    <span className="text-[8px] text-white/30 select-none">{shortDate(day)}</span>
                                    {ms > 0 && (
                                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                            {shortDate(day)} · {formatDuration(ms)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <span className="text-[9px] text-zinc-600">{t('less')}</span>
                    {['#18181b','#312e26','#78350f','#d97706','#f59e0b'].map(col => (
                        <div key={col} className="w-5 h-3 rounded-sm" style={{ background: col }} />
                    ))}
                    <span className="text-[9px] text-zinc-600">{t('more')}</span>
                </div>
            </div>

            {/* ── Table + Strict Mode ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {/* Header avec sélecteur de jour */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <History className="text-zinc-500" />
                            {t('history')}
                        </h3>
                        {/* Sélecteur de jour — met à jour donut + table + bar chart */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {last14.map((day, i) => {
                                const hasData = (state?.usageHistory?.[day] ?? 0) > 0 || day === today
                                const isActive = selectedDay === day
                                const label = i === 0 ? tc('today').slice(0, 4) + '.' : i === 1 ? tc('yesterday').slice(0, 4) + '.' : shortDate(day)
                                return (
                                    <button key={day}
                                        onClick={() => { setSelectedDay(day); if (!compareMode) setSelectedDays([day]) }}
                                        disabled={!hasData}
                                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all
                                            disabled:opacity-20 disabled:cursor-not-allowed ${
                                            isActive
                                                ? 'bg-white text-black border-white'
                                                : 'text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    {/* Label jour affiché */}
                    <p className="text-[10px] text-zinc-600">
                        {selectedDay === today
                            ? tc('today')
                            : t('navigateOn', { dayLabel: shortDate(selectedDay) })
                        }
                        {' · '}
                        {t('getSiteCount', { count: sitesForDay.length })}
                        {' · '}
                        {formatDuration(sitesForDay.reduce((s, u) => s + u.liveMs, 0))} {t('total')}
                    </p>
                    <div className="rounded-xl border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-900 text-xs text-zinc-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">{t('siteColumn')}</th>
                                    <th className="px-4 py-3 font-medium">{t('categoryColumn')}</th>
                                    <th className="px-4 py-3 font-medium text-right">{t('timeColumn')}</th>
                                    <th className="px-4 py-3 font-medium text-right">{t('actionColumn')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 bg-black text-xs">
                                {sitesForDay.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                                            {t('noNavigation')}
                                        </td>
                                    </tr>
                                ) : sitesForDay.map(u => {
                                    const cat = classifyDomain(u.domain)
                                    const meta = CATEGORY_META[cat]
                                    // Bouton visible seulement pour les sites "Autre"
                                    // (non classifiés dans adult/distraction/entertainment/productivity)
                                    // isCustomProd : site manuellement classé en productivité
                                    // showProductBtn : visible si "Autre" OU déjà marqué custom productif
                                    // (quand isCustomProd=true, cat devient 'productivity' → isOther=false,
                                    //  mais on veut quand même le bouton pour pouvoir le retirer)
                                    const isCustomProd  = (state?.customProductivitySites ?? []).includes(u.domain)
                                    const showProductBtn = cat === 'other' || isCustomProd
                                    return (
                                        <tr key={u.domain} className="hover:bg-zinc-900/30">
                                            <td className="px-4 py-2 flex items-center gap-3">
                                                    <SmartImage
                                                        src={`https://www.google.com/s2/favicons?domain=${u.domain}&sz=32`}
                                                        fallbackSrc={globeIcon}
                                                        className="w-4 h-4 opacity-70"
                                                    />
                                                <span className="text-zinc-300">{u.domain}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: meta.color }}>
                                                    <span>{meta.emoji}</span>
                                                    <span>{meta.label}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right text-zinc-400 font-mono">
                                                {formatDuration(u.liveMs)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {showProductBtn && (
                                                    <button
                                                        title={isCustomProd ? t('removeProductive') : t('addProductive')}
                                                        onClick={() => sendToBackground({
                                                            type: isCustomProd ? 'REMOVE_PRODUCTIVITY_SITE' : 'ADD_PRODUCTIVITY_SITE',
                                                            domain: u.domain,
                                                        })}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
                                                            isCustomProd
                                                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                                : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400'
                                                        }`}>
                                                        <span>💼</span>
                                                        <span>{isCustomProd ? t('productive') : t('markProductive')}</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div>
                    <div className="p-6 max-h-82 rounded-xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shield width={120} height={120} />
                        </div>
                        <div className="relative z-5 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                                <ShieldCheck className="text-zinc-400" width="28" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">{t('strictModeTitle')}</h2>
                            <p className="text-xs text-zinc-500 mb-6 max-w-[200px]">
                                {t('strictModeDesc')}
                            </p>
                            <button onClick={() => navigate('/strict-mode-settings')}
                                className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-lg transition-colors w-full max-w-[180px]">
                                {tc('configure')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Analytics