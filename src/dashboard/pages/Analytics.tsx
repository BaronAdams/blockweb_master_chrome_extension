import React, { useEffect, useState } from 'react'
import { Icon } from "@iconify/react";
import { formatDuration, getLiveTodayTime } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '@/context/GlobalStateContext';


const Analytics: React.FC = () => {
    const { state } = useStateContext();
    const [now, setNow] = useState(Date.now());
    const navigate = useNavigate();

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const sites = Object.values(state?.siteUsage || {})
        .filter((u) => getLiveTodayTime(u, now) > 0)
        .sort((a, b) =>
            getLiveTodayTime(b, now) - getLiveTodayTime(a, now)
        );

    return (
        <div id="tab-analytics" className={`space-y-8`}>
            {/* <!-- Metrics Grid --> */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-zinc-500">
                        <Icon icon="solar:forbidden-circle-linear" />
                        <span className="text-[10px] uppercase">Sites Bloqués</span>
                    </div>
                    <span id="metric-blocked-sites" className="text-2xl font-semibold text-white tracking-tight">{state?.activeBlockedDomains.length || 0}</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-zinc-500">
                        <Icon icon="solar:text-square-linear" />
                        <span className="text-[10px] uppercase">Mots Clés</span>
                    </div>
                    <span id="metric-keywords" className="text-2xl font-semibold text-white tracking-tight">{state?.activeBlockedKeywords.length || 0}</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-zinc-500">
                        <Icon icon="solar:hourglass-line-linear" />
                        <span className="text-[10px] uppercase">Profils Actifs</span>
                    </div>
                    <span id="metric-profiles" className="text-2xl font-semibold text-white tracking-tight">{state?.activeProfiles.filter((p) => p.isActive).length || 0}</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-zinc-500">
                        <Icon icon="solar:eye-linear" />
                        <span className="text-[10px] uppercase">Visites (24h)</span>
                    </div>
                    <span id="metric-visits" className="text-2xl font-semibold text-white tracking-tight">{sites.length || 0}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* <!-- Visited Sites List --> */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <Icon icon="solar:history-linear" className="text-zinc-500" />
                        Historique de Navigation
                    </h3>

                    <div className="rounded-xl border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-900 text-xs text-zinc-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Site Web</th>
                                    <th className="px-4 py-3 font-medium text-right">Temps Passé</th>
                                </tr>
                            </thead>
                            <tbody id="history-list" className="divide-y divide-zinc-800 bg-black text-xs">
                                {sites.map((usage) => (
                                        <tr key={usage.domain}>
                                            <td className="px-4 py-2 text-zinc-300 flex items-center gap-3">
                                                <img src={`https://www.google.com/s2/favicons?domain=${usage.domain}&sz=32`} className="w-4 h-4 mr-3 opacity-70 transition-all" alt="" />
                                                <span>{usage.domain}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right text-zinc-500">
                                                {/* {formatDuration(h.todayTimeMs)} */}
                                                {formatDuration(getLiveTodayTime(usage, now))}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* <!-- Strict Mode Status Card --> */}
                <div>
                    <div className="p-6 rounded-xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Icon icon="solar:shield-bold" width="120" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div id="strict-card-icon" className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4 transition-colors duration-300">
                                <Icon icon="solar:shield-check-linear" className="text-zinc-400" width="28" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">Mode Strict</h2>
                            <p id="strict-card-desc" className="text-xs text-zinc-500 mb-6 max-w-[200px]">
                                Le mode strict empêche la modification des profils.
                            </p>
                            <button onClick={() =>navigate('/strict-mode-settings')} className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-lg transition-colors w-full max-w-[180px]">
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