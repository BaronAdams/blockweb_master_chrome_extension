import React, { useEffect, useState } from 'react'
import { Icon } from "@iconify/react";
import ProfileCard from '../components/ProfileCard';
import { Link } from 'react-router-dom';
import { useStateContext } from '@/context/GlobalStateContext';
import { Profile } from '@/lib/types';

/* ── Groupement par type ─────────────────────────────────────────────────── */
const TYPE_META: Record<string, { label: string; icon: string; desc: string }> = {
    daily:    { label: "Quotidiens",       icon: "solar:sun-linear",                 desc: "Limite par jour"             },
    hourly:   { label: "Horaires",         icon: "solar:clock-circle-linear",        desc: "Limite par heure glissante"  },
    weekly:   { label: "Hebdomadaires",    icon: "solar:calendar-linear",            desc: "Limite par semaine"          },
    interval: { label: "Par intervalle",   icon: "solar:shield-minimalistic-linear", desc: "Plages horaires définies"    },
};

const TimerProfiles: React.FC = () => {
    const { state } = useStateContext();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const profiles       = state?.activeProfiles  ?? [];
    const frozenProfiles = state?.frozenProfiles   ?? [];
    const hasProfiles    = profiles.length > 0 || frozenProfiles.length > 0;

    // Grouper profils actifs par type
    const grouped = profiles.reduce<Record<string, Profile[]>>((acc, p) => {
        const type = p.config.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(p);
        return acc;
    }, {});

    // Grouper profils frozen par type
    const frozenGrouped = frozenProfiles.reduce<Record<string, Profile[]>>((acc, p) => {
        const type = p.config.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(p);
        return acc;
    }, {});

    const typeOrder = ["daily", "hourly", "weekly", "interval"] as const;

    return (
        <div id="tab-profiles" className="space-y-8">

            {/* ── En-tête ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-medium text-white">Vos Profils</h2>
                    <p className="text-xs text-zinc-500 mt-1">
                        {profiles.length > 0
                            ? `${profiles.length} profil${profiles.length > 1 ? "s" : ""} actif${profiles.length > 1 ? "s" : ""}${frozenProfiles.length > 0 ? ` · ${frozenProfiles.length} gelé${frozenProfiles.length > 1 ? 's' : ''}` : ''}`
                            : "Gérez vos limitations par thématique."
                        }
                    </p>
                </div>
                <Link
                    to="/profiles/create"
                    className="no-underline flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-medium rounded-lg transition-colors"
                >
                    <Icon icon="solar:add-square-linear" width="16" />
                    Créer un profil
                </Link>
            </div>

            {/* ── État vide ─────────────────────────────────────────────────── */}
            {!hasProfiles && (
                <div className="h-80 flex flex-col gap-4 items-center justify-center py-8 text-neutral-400 border border-dashed border-neutral-800 rounded-xl">
                    <Icon icon="solar:folder-with-files-linear" width="36" height="36" className="opacity-40" />
                    <div className="text-center">
                        <h3 className="text-[14px] font-medium">Aucun profil créé</h3>
                        <p className="text-[12px] text-zinc-600 mt-1">
                            Commencez par créer un nouveau profil.
                        </p>
                    </div>
                    <Link
                        to="/profiles/create"
                        className="no-underline flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-medium rounded-lg transition-colors"
                    >
                        <Icon icon="solar:add-square-linear" width="16" />
                        Créer un profil
                    </Link>
                </div>
            )}

            {/* ── Sections par type ─────────────────────────────────────────── */}
            {hasProfiles && typeOrder.map((type) => {
                const group       = grouped[type]       ?? [];
                const frozenGroup = frozenGrouped[type] ?? [];
                if (!group.length && !frozenGroup.length) return null;

                const meta = TYPE_META[type];

                return (
                    <div key={type} className="space-y-3">
                        {/* Titre de section */}
                        <div className="flex items-center gap-2">
                            <Icon icon={meta.icon} className="text-zinc-500" width="14" />
                            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{meta.label}</h3>
                            <span className="text-[10px] text-zinc-600">— {meta.desc}</span>
                            <div className="flex-1 h-px bg-zinc-800 ml-2" />
                            <span className="text-[10px] text-zinc-600">{group.length}</span>
                            {frozenGroup.length > 0 && (
                                <span className="text-[10px] text-amber-500/70 flex items-center gap-1">
                                    <Icon icon="solar:lock-keyhole-linear" width="10" />
                                    {frozenGroup.length}
                                </span>
                            )}
                        </div>

                        {/* Grille de cartes actives */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.map((profile) => (
                                <ProfileCard key={profile.id} profile={profile} now={now} />
                            ))}
                            {/* Cartes frozen — flouées, non-cliquables */}
                            {frozenGroup.map((profile) => (
                                <div key={profile.id} className="relative">
                                    <div className="blur-[2px] pointer-events-none select-none opacity-50">
                                        <ProfileCard profile={profile} now={now} />
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 border border-amber-500/30 rounded-full">
                                            <Icon icon="solar:lock-keyhole-linear" className="text-amber-400" width="12" />
                                            <span className="text-[10px] font-medium text-amber-300">Gelé — Plan Premium</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Bannière upgrade si frozen profiles */}
            {frozenProfiles.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                    <Icon icon="solar:info-circle-linear" className="text-amber-400 shrink-0" width="16" />
                    <p className="text-xs text-amber-300/80 flex-1">
                        {frozenProfiles.length} profil{frozenProfiles.length > 1 ? 's' : ''} gelé{frozenProfiles.length > 1 ? 's' : ''} suite au passage en plan gratuit.
                        Passez à Premium pour les réactiver.
                    </p>
                    <Link to="/pricing" className="no-underline text-[10px] font-bold text-black bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                        Upgrader
                    </Link>
                </div>
            )}
        </div>
    );
};

export default TimerProfiles;