import { useStateContext } from '@/context/GlobalStateContext'
import { Profile, WeekDay } from '@/lib/types'
import { formatDuration, getProfileTotalTime } from '@/lib/utils'
import { getProfileLimitMs, isIntervalActive, isProfileActiveToday, isInTimeRange } from '@/background/time'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { getT } from '@/lib/i18n'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Shield, Sun } from 'lucide-react'

// twh = translator without hook
const twh  = getT('profiles')
const twhc = getT('common')

interface Props {
    profile: Profile
    now:     number
}

/* =========================================================
   HELPERS
========================================================= */

// Jours courts — traduits dynamiquement à l'usage
const DAY_SHORT : Record<WeekDay, string> = { 0: twhc('Sun'), 1: twhc('Mon'), 2: twhc('Tue'), 3: twhc('Wed'), 4: twhc('Thu'), 5: twhc('Fri'), 6: twhc('Sat') }

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    daily:    { icon: <Sun className='text-amber-400' width={16}/>,                    label: twh('dailyType'),    color: 'text-amber-400'   },
    hourly:   { icon: <Clock className='text-blue-400' width={16}/>,           label: twh('hourlyType'),   color: 'text-blue-400'    },
    weekly:   { icon: <Calendar className='text-violet-400' width={16}/>,               label: twh('weeklyType'),   color: 'text-violet-400'  },
    interval: { icon: <Shield className='text-rose-400' width={16}/>,    label: twh('intervalType'), color: 'text-rose-400'    },
}

/** Résumé court de la configuration selon le type */
function getConfigDetail(profile: Profile): string {
    const { config } = profile
    switch (config.type) {
        case 'daily': {
            const h = Math.floor(config.dailyLimit / 60)
            const m = config.dailyLimit % 60
            const base = h > 0 ? twh('getDailyLimit_hm', { h, m }) : twh('getDailyLimit_m', { m })
            if (config.days?.length) {
                return base + ` · ${config.days.map(d => DAY_SHORT[d]).join(' ')}`
            }
            return base
        }
        case 'hourly': {
            const base = twh('getHourlyLimit', { hourlyLimit: config.hourlyLimit })
            if (config.days?.length) {
                return base + ` · ${config.days.map(d => DAY_SHORT[d]).join(' ')}`
            }
            return base
        }
        case 'weekly': {
            const h = Math.floor(config.weeklyLimit / 60)
            const m = config.weeklyLimit % 60
            return h > 0 ? twh('getWeeklyLimit_hm', { h, m }) : twh('getWeeklyLimit_m', { m })
        }
        case 'interval': {
            const n = config.rules.length
            return `${n} ${n > 1 ? twhc('configure').toLowerCase() : twhc('configure').toLowerCase()}`
        }
    }
}

/** Détermine l'état de blocage courant pour l'affichage */
function getActiveState(profile: Profile): {
    isInScope:   boolean   // le profil s'applique en ce moment (bons jours + bonne plage)
    isBlocking:  boolean   // blocage actif (interval actif OU limite atteinte)
    label:       string    // texte à afficher si hors scope
} {
    if (!profile.isActive) return { isInScope: false, isBlocking: false, label: twhc('deactivate') }

    const cfg = profile.config

    if (cfg.type === 'interval') {
        const blocking = isIntervalActive(profile)
        return { isInScope: true, isBlocking: blocking, label: blocking ? twh('blocking') : twh('waiting') }
    }

    if (!isProfileActiveToday(profile)) {
        return { isInScope: false, isBlocking: false, label: twh('offDays') }
    }

    if (cfg.type === 'hourly' && !isInTimeRange(profile)) {
        return { isInScope: false, isBlocking: false, label: twh('offRange') }
    }

    return { isInScope: true, isBlocking: false, label: twhc('activate') }
}

/* =========================================================
   COMPOSANT
========================================================= */

const ProfileCard: React.FC<Props> = ({ profile, now }) => {
    const navigate    = useNavigate()
    const { state }   = useStateContext()
    const { t } = useTranslation('profiles')

    const usedMs      = getProfileTotalTime(profile, state?.siteUsage || {}, now)
    const limitMs     = getProfileLimitMs(profile)
    const hasLimit    = limitMs !== Infinity && limitMs > 0
    const percent     = hasLimit ? Math.min(100, Math.round((usedMs / limitMs) * 100)) : 0
    const exceeded    = hasLimit && usedMs >= limitMs

    const meta        = TYPE_META[profile.config.type] ?? TYPE_META.daily
    const activeState = getActiveState(profile)

    /* ── Badge couleur selon l'état ── */
    const badgeDot =
        !profile.isActive      ? 'bg-zinc-600'
        : exceeded             ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
        : activeState.isInScope ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
        :                         'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'

    const badgeText =
        !profile.isActive      ? 'text-zinc-500'
        : exceeded             ? 'text-red-400'
        : activeState.isInScope ? 'text-green-500'
        :                         'text-amber-400'

    const badgeLabel =
        !profile.isActive      ? twhc('deactivate')
        : exceeded             ? twh('noDaySelected').replace(twh('noDay'), twh('limitReachedTxt'))
        : activeState.label

    return (
        <div
            onClick={() => navigate(`/profile/${profile.id}`)}
            className="z-5 p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group"
        >
            {/* ── En-tête ── */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center transition-colors ${meta.color}`}>
                        {meta.icon}
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-white">{profile.name}</h3>
                        <p className="text-[10px] text-zinc-500">
                            {t('getSiteCount', { count: profile.sites.length })} · {getConfigDetail(profile)}
                        </p>
                    </div>
                </div>

                {/* Badge statut */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${badgeDot}`} />
                    <span className={`text-[8px] font-medium tracking-wider ${badgeText}`}>
                        {badgeLabel}
                    </span>
                </div>
            </div>

            {/* ── Barre de progression (uniquement pour les types à limite de temps) ── */}
            {hasLimit ? (
                <>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5">
                        <span>{formatDuration(usedMs)}</span>
                        <span className="text-zinc-600">{formatDuration(limitMs)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-zinc-800">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                !profile.isActive        ? 'bg-zinc-700'
                                : !activeState.isInScope ? 'bg-zinc-700'
                                : exceeded               ? 'bg-red-500'
                                :                         'bg-white'
                            }`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    {/* Indication hors-scope sous la barre */}
                    {profile.isActive && !activeState.isInScope && (
                        <p className="text-[9px] text-amber-600 mt-1">{activeState.label} — {t('trackingPaused')}</p>
                    )}
                </>
            ) : (
                /* Profil interval — afficher l'état des règles */
                <div className="space-y-1 mt-1">
                    {profile.config.type === 'interval' && profile.config.rules.slice(0, 2).map((rule, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[9px] text-zinc-600">
                            <Clock width="10" className="shrink-0" />
                            <span>
                                {rule.allDay ? t('allDayShrt') : `${rule.startTime}–${rule.endTime}`}
                                {' · '}{rule.days.map(d => DAY_SHORT[d as WeekDay]).join(' ')}
                            </span>
                        </div>
                    ))}
                    {profile.config.type === 'interval' && profile.config.rules.length > 2 && (
                        <p className="text-[9px] text-zinc-700">+{profile.config.rules.length - 2} {t('rules')}</p>
                    )}
                </div>
            )}
        </div>
    )
}

export default ProfileCard