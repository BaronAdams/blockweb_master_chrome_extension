import React, { useState, useEffect } from 'react'
import { Icon } from "@iconify/react";
import { getDetailsTime, sendToBackground, getRemainingTime } from '@/lib/utils';
import { LIMITS } from '@/lib/constants';
import { useStateContext } from '@/context/GlobalStateContext';
import { useT, getT } from '@/lib/i18n';

/* =========================================================
   HELPERS
========================================================= */

const pad = (n: number) => n.toString().padStart(2, '0')

const twh  = getT('strictMode')
    
const RESTRICTIONS = [
    { icon: 'solar:trash-bin-trash-linear', text: twh('r1')  },
    { icon: 'solar:pen-linear',             text: twh('r2') },
    { icon: 'solar:shield-plus-linear',     get text() { return navigator.language?.startsWith('fr') ? "Ajout de sites à la whitelist désactivé" : 'Adding sites to the whitelist is disabled' } },
]

/* =========================================================
   SOUS-COMPOSANT — Guide protection OS
   Explique comment forcer l'installation via ExtensionInstallForcelist
   sur Windows (Registre) et macOS (Config Profile)
========================================================= */

const OsProtectionGuide: React.FC = () => {
    const [os,       setOs]       = useState<'windows' | 'mac' | 'other'>('other')
    const [extId,    setExtId]    = useState<string>('')
    const [copied,   setCopied]   = useState<string | null>(null)
    const t  = useT('strictMode')

    useEffect(() => {
        // Détecter l'OS
        const ua = navigator.userAgent.toLowerCase()
        if (ua.includes('win'))    setOs('windows')
        else if (ua.includes('mac')) setOs('mac')

        // Récupérer l'ID de l'extension
        setExtId(chrome.runtime.id ?? '')
    }, [])

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key)
            setTimeout(() => setCopied(null), 2000)
        })
    }

    const CMD_WIN_CREATE = `reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist"`
    const CMD_WIN_ADD    = `reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist" /v "1" /t REG_SZ /d "${extId}"`
    const CMD_WIN_REMOVE = `reg delete "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist" /v 1 /f`

    const CodeBlock = ({ code, id }: { code: string; id: string }) => (
        <div className="relative flex items-start gap-2 bg-black/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 font-mono text-[10px] text-zinc-300 group">
            <span className="flex-1 break-all leading-relaxed">{code}</span>
            <button
                type="button"
                onClick={() => copy(code, id)}
                className="shrink-0 ml-2 mt-0.5 text-zinc-600 hover:text-white transition-colors"
                title="Copier"
            >
                <Icon
                    icon={copied === id ? 'solar:check-circle-bold' : 'solar:copy-linear'}
                    className={copied === id ? 'text-emerald-400' : ''}
                    width="13"
                />
            </button>
        </div>
    )

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Icon icon="solar:shield-keyhole-bold" className="text-violet-400" width="14" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-semibold text-white">{t('osProtection')}</p>
                    <p className="text-[10px] text-zinc-500">{t('osDesc')}</p>
                </div>
                {/* Sélecteur OS */}
                <div className="flex gap-1">
                    {(['windows', 'mac'] as const).map(o => (
                        <button
                            key={o}
                            type="button"
                            onClick={() => setOs(o)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                                os === o
                                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                            }`}
                        >
                            {o === 'windows' ? t('windows') : t('mac')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Explication */}
                <div className="flex items-start gap-2.5 p-3 bg-violet-500/8 border border-violet-500/15 rounded-lg">
                    <Icon icon="solar:info-circle-linear" className="text-violet-400 shrink-0 mt-0.5" width="13" />
                    <p className="text-[10px] text-violet-300/80 leading-relaxed">
                        La politique <strong className="text-violet-200">ExtensionInstallForcelist</strong> de Chrome 
                        grise le bouton "Supprimer" sur la page des extensions.
                        {navigator.language?.startsWith('fr') ? "L'extension devient impossible à désinstaller depuis l'interface Chrome." : 'The extension becomes impossible to uninstall from the Chrome interface.'}
                    </p>
                </div>

                {/* ID de l'extension */}
                {extId && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] text-zinc-500 font-medium">ID de ton extension</p>
                        <CodeBlock code={extId} id="ext-id" />
                    </div>
                )}

                {/* Instructions Windows */}
                {os === 'windows' && (
                    <div className="space-y-3">
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                            Instructions Windows — Command Prompt (Admin)
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">1</span>
                                <p className="text-[10px] text-zinc-400">Ouvre <strong className="text-zinc-200">Command Prompt en tant qu'Administrateur</strong></p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">2</span>
                                <p className="text-[10px] text-zinc-400">{navigator.language?.startsWith('fr') ? "Crée l'entrée dans le Registre" : 'Creates the Registry entry'}</p>
                            </div>
                            <CodeBlock code={CMD_WIN_CREATE} id="win-create" />

                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">3</span>
                                <p className="text-[10px] text-zinc-400">{navigator.language?.startsWith('fr') ? "Ajoute l'extension à la liste de force" : 'Adds the extension to the force list'}</p>
                            </div>
                            <CodeBlock code={CMD_WIN_ADD} id="win-add" />

                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">4</span>
                                <p className="text-[10px] text-zinc-400">Redémarre Chrome — le bouton "Supprimer" sera grisé ✓</p>
                            </div>
                        </div>

                        {/* Annuler */}
                        <div className="pt-1 border-t border-zinc-800/60 space-y-1.5">
                            <p className="text-[10px] text-zinc-600 font-medium">{navigator.language?.startsWith('fr') ? 'Pour annuler (après le mode strict)' : 'To undo (after strict mode)'}</p>
                            <CodeBlock code={CMD_WIN_REMOVE} id="win-remove" />
                        </div>
                    </div>
                )}

                {/* Instructions macOS */}
                {os === 'mac' && (
                    <div className="space-y-3">
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                            Instructions macOS — Profil de configuration
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">1</span>
                                <p className="text-[10px] text-zinc-400">
                                    {navigator.language?.startsWith('fr') ? 'Crée un fichier' : 'Creates a file'} <strong className="text-zinc-200">enforce_extension.mobileconfig</strong>
                                </p>
                            </div>
                            <CodeBlock
                                code={`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>PayloadContent</key><array><dict>
    <key>PayloadType</key><string>com.apple.ManagedClient.preferences</string>
    <key>PayloadIdentifier</key><string>com.blockwebmaster.enforce</string>
    <key>PayloadUUID</key><string>12345678-1234-1234-1234-123456789012</string>
    <key>PayloadVersion</key><integer>1</integer>
    <key>ExtensionInstallForcelist</key>
    <array><string>${extId}</string></array>
  </dict></array>
  <key>PayloadIdentifier</key><string>com.blockwebmaster.profile</string>
  <key>PayloadType</key><string>Configuration</string>
  <key>PayloadUUID</key><string>87654321-4321-4321-4321-210987654321</string>
  <key>PayloadVersion</key><integer>1</integer>
</dict></plist>`}
                                id="mac-plist"
                            />

                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">2</span>
                                <p className="text-[10px] text-zinc-400">
                                    {navigator.language?.startsWith('fr') ? "Double-clique sur le fichier pour l'installer via" : 'Double-click the file to install it via'} <strong className="text-zinc-200">Préférences Système → Profils</strong>
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">3</span>
                                <p className="text-[10px] text-zinc-400">Redémarre Chrome — le bouton "Supprimer" sera grisé ✓</p>
                            </div>
                        </div>

                        <div className="pt-1 border-t border-zinc-800/60">
                            <p className="text-[10px] text-zinc-600">
                                {navigator.language?.startsWith('fr') ? 'Pour annuler : Préférences Système → Profils → sélectionne le profil → bouton' : 'To undo: System Preferences → Profiles → select the profile → button'} <strong>−</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Avertissement */}
                <div className="flex items-start gap-2 p-2.5 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                    <Icon icon="solar:danger-triangle-linear" className="text-amber-400 shrink-0 mt-0.5" width="12" />
                    <p className="text-[10px] text-amber-400/80 leading-relaxed">
                        {navigator.language?.startsWith('fr') ? 'Ces commandes nécessitent des droits administrateur sur ton ordinateur.' : 'These commands require administrator rights on your computer.'}
                        Pour annuler la protection, tu auras besoin de refaire la manipulation inverse.
                        Note les commandes de suppression quelque part en dehors du navigateur.
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
    const maxLabel  = isPremium ? '30 jours' : '24 heures'

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
        // Un seul message atomique — évite la race condition entre
        // SAVE_STRICT_TIME et ACTIVATE_STRICT_MODE
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
                    <Icon icon="solar:shield-warning-bold" className="text-rose-400" width="20" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-white">{t('title')}</h2>
                    <p className="text-xs text-zinc-500">Verrou temporaire contre les distractions.</p>
                </div>
                <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${
                    isStrict
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isStrict ? 'bg-rose-500 animate-pulse' : 'bg-zinc-600'}`} />
                    {isStrict ? 'Actif' : 'Inactif'}
                </div>
            </div>

            {/* ── Restrictions ── */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Restrictions actives</p>
                <div className="space-y-2">
                    {RESTRICTIONS.map(({ icon, text }, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Icon icon={icon} className="text-rose-400" width="11" />
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
                                <Icon icon="solar:lock-password-bold" className="text-rose-400" width="16" />
                                <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">{navigator.language?.startsWith('fr') ? 'Verrouillé' : 'Locked'}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600">Impossible de modifier</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { val: remaining.days,    label: 'jours'    },
                                { val: remaining.hours,   label: 'heures'   },
                                { val: remaining.minutes, label: 'minutes'  },
                                { val: remaining.seconds, label: 'secondes' },
                            ].map(({ val, label }) => (
                                <div key={label} className="flex flex-col items-center gap-1 bg-black/40 rounded-lg py-3 border border-zinc-800">
                                    <span className="text-2xl font-mono font-bold text-white tabular-nums">{pad(val)}</span>
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-center text-zinc-600">
                            {navigator.language?.startsWith('fr') ? "Se désactivera automatiquement à l'expiration du timer." : 'Will deactivate automatically when the timer expires.'}
                        </p>
                    </div>
                </div>
            ) : (
                /* ── Configuration ── */
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:hourglass-line-linear" className="text-zinc-400" width="15" />
                            <p className="text-xs font-medium text-zinc-300">{navigator.language?.startsWith('fr') ? 'Durée du Mode Strict' : 'Strict Mode Duration'}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500 font-medium">
                            Max {maxLabel}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-600 text-center">{tc('days')}</p>
                            <select value={days} onChange={e => handleDays(e.target.value)}
                                className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg px-2 py-2.5 outline-none focus:border-zinc-500 cursor-pointer text-center appearance-none">
                                {!isPremium
                                    ? [0, 1].map(d => <option key={d} value={d}>{pad(d)} j</option>)
                                    : Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{pad(i)} j</option>)
                                }
                            </select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-600 text-center">{tc('hours')}</p>
                            <select value={hours} onChange={e => handleHours(e.target.value)}
                                disabled={(!isPremium && days >= 1) || (isPremium && days >= 30)}
                                className="w-full disabled:opacity-30 disabled:cursor-not-allowed bg-black border border-zinc-700 text-white text-xs rounded-lg px-2 py-2.5 outline-none focus:border-zinc-500 cursor-pointer text-center appearance-none">
                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{pad(i)} h</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-600 text-center">Minutes</p>
                            <select value={mins} onChange={e => handleMins(e.target.value)}
                                disabled={(!isPremium && days >= 1) || (isPremium && days >= 30)}
                                className="w-full disabled:opacity-30 disabled:cursor-not-allowed bg-black border border-zinc-700 text-white text-xs rounded-lg px-2 py-2.5 outline-none focus:border-zinc-500 cursor-pointer text-center appearance-none">
                                {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{pad(i)} min</option>)}
                            </select>
                        </div>
                    </div>

                    {!isZero && (
                        <>
                            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                <Icon icon="solar:clock-circle-linear" className="text-zinc-500" width="13" />
                                <p className="text-[10px] text-zinc-400">
                                    {navigator.language?.startsWith('fr') ? 'Durée sélectionnée :' : 'Selected duration:'}{' '}
                                    <span className="text-white font-medium">
                                        {days > 0  && `${days}j `}
                                        {hours > 0 && `${hours}h `}
                                        {mins > 0  && `${mins}min`}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-start gap-2 p-2.5 bg-rose-500/8 border border-rose-500/15 rounded-lg">
                                <Icon icon="solar:danger-triangle-linear" className="text-rose-400 shrink-0 mt-0.5" width="13" />
                                <p className="text-[10px] text-rose-400/80 leading-relaxed">
                                    {navigator.language?.startsWith('fr') ? 'Une fois activé, le mode strict' : 'Once activated, strict mode'} <strong className="text-rose-300">{navigator.language?.startsWith('fr') ? 'ne peut pas être annulé' : 'cannot be cancelled'}</strong> avant la fin du timer.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Guide protection OS ── */}
            <OsProtectionGuide />

            {/* ── Actions ── */}
            {!isStrict && (
                <div className="flex justify-end">
                    <button type="button" onClick={startStrict} disabled={isZero}
                        className="flex items-center gap-2 px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-rose-900/30">
                        <Icon icon="solar:shield-warning-bold" width="13" />
                        Activer le Mode Strict
                    </button>
                </div>
            )}
        </div>
    )
}

export default StrictModeSettings