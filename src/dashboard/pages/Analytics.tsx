import React, { useEffect, useState, useMemo } from 'react'
import { Icon } from "@iconify/react";
import { formatDuration, getLiveTodayTime } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '@/context/GlobalStateContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
    LineChart, Line,
} from 'recharts';

/* =========================================================
   PALETTE
========================================================= */
const SITE_COLORS = [
    '#f87171','#fb923c','#fbbf24','#a3e635',
    '#34d399','#22d3ee','#818cf8','#e879f9',
    '#f472b6','#94a3b8','#60a5fa','#4ade80',
]
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

const StackedTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="text-zinc-400 mb-1.5">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.fill }} className="flex justify-between gap-4">
                    <span>{p.name}</span>
                    <span className="font-mono">{formatDuration(p.value)}</span>
                </p>
            ))}
        </div>
    )
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const Analytics: React.FC = () => {
    const { state } = useStateContext()
    const [now, setNow] = useState(Date.now())
    const navigate = useNavigate()
    const [selectedDays, setSelectedDays] = useState<string[]>([todayKey()])
    const [compareMode, setCompareMode] = useState(false)

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

    /* ── Couleur stable par domaine ── */
    const domainColor = useMemo(() => {
        const all = [...new Set(Object.keys(state?.siteUsage ?? {}))].sort()
        return Object.fromEntries(all.map((d, i) => [d, SITE_COLORS[i % SITE_COLORS.length]]))
    }, [state?.siteUsage])

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
                const label = day === today ? "Aujourd'hui" : shortDate(day)
                point[label] = total
            }
            return point
        })
    }, [state?.siteUsage, selectedDays, compareMode, today])

    const hasActivity = hourlyData.some(r => activeDomains.some(d => (r[d] ?? 0) > 0))

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

    const totalToday = sites.reduce((s, u) => s + u.liveMs, 0)
    const totalHist  = Object.entries(state?.usageHistory ?? {})
        .filter(([k]) => !k.includes(':'))
        .reduce((s, [, v]) => s + v, 0)

    /* ── Sélection de jours ── */
    const toggleDay = (day: string) => {
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
                    { icon: 'solar:forbidden-circle-linear', label: 'Sites Bloqués',  value: state?.activeBlockedDomains.length ?? 0 },
                    { icon: 'solar:text-square-linear',      label: 'Mots-Clés',      value: state?.activeBlockedKeywords.length ?? 0 },
                    { icon: 'solar:hourglass-line-linear',   label: 'Profils Actifs', value: state?.activeProfiles.filter(p => p.isActive).length ?? 0 },
                    { icon: 'solar:eye-linear',              label: 'Visites (24h)',  value: sites.length },
                ].map(({ icon, label, value }) => (
                    <div key={label} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between h-24">
                        <div className="flex items-center justify-between text-zinc-500">
                            <Icon icon={icon} width="16" />
                            <span className="text-[10px] uppercase tracking-wide">{label}</span>
                        </div>
                        <span className="text-2xl font-semibold text-white tracking-tight">{value}</span>
                    </div>
                ))}
            </div>

            {/* ── Totaux ── */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Temps total aujourd'hui</p>
                    <p className="text-2xl font-bold text-white">{formatDuration(totalToday)}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Temps total historique</p>
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
                            <h3 className="text-sm font-semibold text-white">Utilisation heure par heure</h3>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                                {compareMode
                                    ? 'Mode comparaison — temps total par heure · max 3 jours simultanés'
                                    : 'Temps passé par site pour la journée sélectionnée'}
                            </p>
                        </div>
                        <button
                            onClick={() => { setCompareMode(v => !v); if (!compareMode) setSelectedDays([today]) }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors shrink-0 ${
                                compareMode
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Icon icon="solar:graph-up-linear" width="12" />
                            {compareMode ? 'Comparaison active' : 'Comparer des jours'}
                        </button>
                    </div>

                    {/* Sélecteur 14 jours */}
                    <div className="flex gap-1.5 flex-wrap">
                        {last14.map((day, i) => {
                            const isSelected = selectedDays.includes(day)
                            const colorIdx   = selectedDays.indexOf(day)
                            const label      = i === 0 ? 'Auj.' : i === 1 ? 'Hier' : shortDate(day)
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
                                ({selectedDays.length}/3 sélectionné{selectedDays.length > 1 ? 's' : ''})
                            </span>
                        )}
                    </div>
                </div>

                {/* Chart */}
                <div className="p-5">
                    {!compareMode ? (
                        !hasActivity ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-700">
                                <Icon icon="solar:chart-2-linear" width="32" />
                                <p className="text-xs">Aucune activité enregistrée ce jour-là.</p>
                                {selectedDays[0] !== today && (
                                    <p className="text-[10px] text-zinc-700">
                                        L'historique horaire est disponible depuis la mise à jour.
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
                                            tickFormatter={h => Number(h) % 2 === 0 ? `${h}h` : ''} />
                                        <YAxis tickFormatter={v => v === 0 ? '' : formatDuration(v)}
                                            tick={{ fill: '#52525b', fontSize: 9 }}
                                            axisLine={false} tickLine={false} width={44} />
                                        <Tooltip content={<HourlyTooltip />} cursor={{ fill: '#27272a' }} />
                                        {activeDomains.map((domain, i) => (
                                            <Bar key={domain} dataKey={domain} stackId="h"
                                                fill={domainColor[domain] ?? SITE_COLORS[i % SITE_COLORS.length]}
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
                                        tickFormatter={h => Number(h) % 2 === 0 ? `${h}h` : ''} />
                                    <YAxis tickFormatter={v => v === 0 ? '' : formatDuration(v)}
                                        tick={{ fill: '#52525b', fontSize: 9 }}
                                        axisLine={false} tickLine={false} width={44} />
                                    <Tooltip content={<CompareTooltip />} />
                                    {selectedDays.map((day, i) => {
                                        const name = day === today ? "Aujourd'hui" : shortDate(day)
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
                                            {day === today ? "Aujourd'hui" : shortDate(day)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                BARRES EMPILÉES — historique vs aujourd'hui
            ═══════════════════════════════════════════ */}
            {sites.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                        Temps cumulé — Historique vs Aujourd'hui
                    </h3>
                    <p className="text-[10px] text-zinc-600 mb-4">
                        Poids de la session du jour dans l'usage total par site.
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={sites.slice(0, 8).map(u => ({
                                domain:        u.domain.length > 14 ? u.domain.slice(0,12)+'…' : u.domain,
                                Historique:    Math.max(0, u.totalTimeMs - u.liveMs),
                                "Aujourd'hui": u.liveMs,
                            }))}
                            margin={{ left: 8, right: 16 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="domain" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={v => formatDuration(v)} tick={{ fill: '#71717a', fontSize: 9 }}
                                axisLine={false} tickLine={false} width={50} />
                            <Tooltip content={<StackedTooltip />} cursor={{ fill: '#27272a' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} />
                            <Bar dataKey="Historique"   stackId="a" fill="#3f3f46" radius={[0,0,4,4]} />
                            <Bar dataKey="Aujourd'hui" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                LIGNE 7 JOURS
            ═══════════════════════════════════════════ */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Évolution sur 7 jours
                </h3>
                <p className="text-[10px] text-zinc-600 mb-4">
                    Temps total de navigation quotidien. Identifie les jours à forte consommation.
                </p>
                {lineData.every(d => d.Total === 0) ? (
                    <div className="flex items-center justify-center py-10 text-zinc-700">
                        <p className="text-xs">Pas encore assez de données (accumulation sur 7 jours).</p>
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
                    Activité — 30 derniers jours
                </h3>
                <p className="text-[10px] text-zinc-600 mb-4">
                    Couleur plus intense = plus de temps passé en ligne ce jour.
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
                    <span className="text-[9px] text-zinc-600">Moins</span>
                    {['#18181b','#312e26','#78350f','#d97706','#f59e0b'].map(col => (
                        <div key={col} className="w-5 h-3 rounded-sm" style={{ background: col }} />
                    ))}
                    <span className="text-[9px] text-zinc-600">Plus</span>
                </div>
            </div>

            {/* ── Table + Strict Mode ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <Icon icon="solar:history-linear" className="text-zinc-500" />
                        Historique de Navigation (aujourd'hui)
                    </h3>
                    <div className="rounded-xl border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-900 text-xs text-zinc-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Site Web</th>
                                    <th className="px-4 py-3 font-medium text-right">Temps Passé</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 bg-black text-xs">
                                {sites.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-8 text-center text-zinc-600">
                                            Aucune navigation aujourd'hui
                                        </td>
                                    </tr>
                                ) : sites.map(u => (
                                    <tr key={u.domain} className="hover:bg-zinc-900/30">
                                        <td className="px-4 py-2 flex items-center gap-3">
                                            <img src={`https://www.google.com/s2/favicons?domain=${u.domain}&sz=32`}
                                                className="w-4 h-4 opacity-70" alt="" />
                                            <span className="text-zinc-300">{u.domain}</span>
                                        </td>
                                        <td className="px-4 py-2 text-right text-zinc-400 font-mono">
                                            {formatDuration(u.liveMs)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div>
                    <div className="p-6 rounded-xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Icon icon="solar:shield-bold" width="120" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                                <Icon icon="solar:shield-check-linear" className="text-zinc-400" width="28" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">Mode Strict</h2>
                            <p className="text-xs text-zinc-500 mb-6 max-w-[200px]">
                                Le mode strict empêche la modification des profils.
                            </p>
                            <button onClick={() => navigate('/strict-mode-settings')}
                                className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-lg transition-colors w-full max-w-[180px]">
                                Configurer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Analytics