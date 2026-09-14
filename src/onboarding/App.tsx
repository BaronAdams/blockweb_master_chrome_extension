import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
    BanIcon, ShieldAlertIcon, CalendarIcon, ChevronRightIcon,
    CheckIcon, BriefcaseIcon, BookOpenIcon, SmartphoneIcon, StarIcon,
    EyeOffIcon, TrendingDownIcon, Gamepad2Icon, TimerIcon,
} from 'lucide-react'
import logo from '@/assets/blockweb_master_icon.svg'
import imgProblem from '@/assets/onboarding/ob-problem.jpg'
import imgCta     from '@/assets/onboarding/ob-cta.jpg'
import "@fontsource/inter/400.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"

/* ─── constants ─────────────────────────────────────────── */

const STORAGE_KEY = 'blockweb_master_state'
const TOTAL = 5

/* ─── background blobs ───────────────────────────────────── */

function Blobs() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
            <div className="blob-1 absolute top-[5%] left-[0%] w-[550px] h-[550px] rounded-full bg-amber-500/10 blur-[120px]" />
            <div className="blob-2 absolute bottom-[0%] right-[0%] w-[480px] h-[480px] rounded-full bg-yellow-400/8 blur-[110px]" />
            <div className="blob-3 absolute top-[40%] left-[35%] w-[320px] h-[320px] rounded-full bg-amber-600/6 blur-[90px]" />
        </div>
    )
}

/* ─── progress dots ──────────────────────────────────────── */

function Dots({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: TOTAL }).map((_, i) => (
                <div
                    key={i}
                    className={`dot ${i === current ? 'dot-active' : i < current ? 'dot-past' : 'dot-inactive'}`}
                />
            ))}
        </div>
    )
}

/* ─── nav buttons ────────────────────────────────────────── */

interface NavProps {
    onNext: () => void
    onSkipToEnd: () => void
    nextLabel?: string
    nextDisabled?: boolean
    showSkip?: boolean
}

function Nav({ onNext, onSkipToEnd, nextLabel, nextDisabled, showSkip = true }: NavProps) {
    const { t } = useTranslation('onboarding')
    return (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-800/60">
            {showSkip ? (
                <button
                    onClick={onSkipToEnd}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-1 py-1"
                >
                    {t('skip')} →
                </button>
            ) : <div />}
            <button
                onClick={onNext}
                disabled={nextDisabled}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-900/20"
            >
                {nextLabel ?? t('next')}
                <ChevronRightIcon width={14} />
            </button>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 0 — WELCOME
══════════════════════════════════════════════════════════ */

function ScreenWelcome({ onNext }: { onNext: () => void }) {
    const { t } = useTranslation('onboarding')

    return (
        <div className="stagger flex flex-col items-center text-center py-12 min-h-[480px] justify-center">
            {/* Logo */}
            <div className="logo-pop mb-8">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl scale-150" />
                    <div className="relative w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                        <img src={logo} alt="BlockWeb Master" className="w-12 h-12" />
                    </div>
                </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    BlockWeb
                </span>
                {' '}
                <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                    Master
                </span>
            </h1>

            {/* Tagline */}
            <p className="text-zinc-400 text-lg max-w-xs leading-relaxed mb-10">
                {t('tagline')}
            </p>

            {/* CTA */}
            <button
                onClick={onNext}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-white font-semibold text-base shadow-xl shadow-amber-900/30 transition-all hover:brightness-110 active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #d97706, #92400e)' }}
            >
                {t('getStarted')}
                <ChevronRightIcon width={18} />
            </button>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 1 — THE PROBLEM
══════════════════════════════════════════════════════════ */

function ScreenProblem({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const { t } = useTranslation('onboarding')

    const problems = [
        { icon: <EyeOffIcon width={16} />,      label: t('problem1'), sub: t('problem1Sub'), color: 'text-rose-400' },
        { icon: <TrendingDownIcon width={16} />, label: t('problem2'), sub: t('problem2Sub'), color: 'text-orange-400' },
        { icon: <Gamepad2Icon width={16} />,     label: t('problem3'), sub: t('problem3Sub'), color: 'text-violet-400' },
        { icon: <TimerIcon width={16} />,        label: t('problem4'), sub: t('problem4Sub'), color: 'text-amber-400' },
    ]

    const stats = [
        { value: t('stat1Value'), label: t('stat1Label'), color: 'text-rose-400',   bg: 'bg-rose-500/8 border-rose-500/15' },
        { value: t('stat2Value'), label: t('stat2Label'), color: 'text-amber-400',  bg: 'bg-amber-500/8 border-amber-500/15' },
        { value: t('stat3Value'), label: t('stat3Label'), color: 'text-violet-400', bg: 'bg-violet-500/8 border-violet-500/15' },
    ]

    return (
        <div className="py-4">
            {/* HStack: image + header text */}
            <div className="flex gap-3.5 mb-5">
                <div className="rounded-xl overflow-hidden shrink-0 shadow-2xl shadow-black/60" style={{ width: '150px', height: '200px' }}>
                    <img src={imgProblem} alt="" className="w-full h-full object-cover object-top" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold mb-3 self-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        {t('problemBadge')}
                    </div>
                    <h2 className="text-[17px] font-bold text-white mb-2 leading-snug">{t('problemTitle')}</h2>
                    <p className="text-zinc-300 text-[13px] leading-relaxed">{t('problemDesc')}</p>
                </div>
            </div>

            {/* Problem pills */}
            <div className="stagger grid grid-cols-2 gap-2 mb-4">
                {problems.map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                        <span className={`shrink-0 mt-0.5 ${p.color}`}>{p.icon}</span>
                        <div>
                            <p className="text-[13px] font-semibold text-white leading-tight mb-0.5">{p.label}</p>
                            <p className="text-[11px] text-zinc-400 leading-snug">{p.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="stagger grid grid-cols-3 gap-2 mb-2">
                {stats.map((s, i) => (
                    <div key={i} className={`px-2 py-3 rounded-xl border ${s.bg} text-center`}>
                        <p className={`text-base font-bold font-mono tabular-nums leading-none mb-1 ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-zinc-400 leading-snug">{s.label}</p>
                    </div>
                ))}
            </div>

            <Nav onNext={onNext} onSkipToEnd={onSkip} />
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 2 — FEATURES
══════════════════════════════════════════════════════════ */

function ScreenFeatures({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const { t } = useTranslation('onboarding')

    const features = [
        {
            icon: <BanIcon className="text-rose-400" width={20} />,
            bg: 'bg-rose-500/10 border-rose-500/20',
            title: t('feat1Title'),
            desc: t('feat1Desc'),
        },
        {
            icon: <ShieldAlertIcon fill="currentColor" stroke="#8b0836" className="text-rose-400" width={20} />,
            bg: 'bg-rose-500/10 border-rose-500/20',
            title: t('feat2Title'),
            desc: t('feat2Desc'),
        },
        {
            icon: <CalendarIcon className="text-amber-400" width={20} />,
            bg: 'bg-amber-500/10 border-amber-500/20',
            title: t('feat3Title'),
            desc: t('feat3Desc'),
        },
    ]

    return (
        <div className="py-6">
            <div className="stagger mb-5 text-center">
                <h2 className="text-2xl font-bold text-white mb-1">{t('solutionTitle')}</h2>
            </div>

            <div className="stagger space-y-3 mb-2">
                {features.map((f, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${f.bg}`}>
                            {f.icon}
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold text-white mb-1">{f.title}</p>
                            <p className="text-[13px] text-zinc-400 leading-relaxed">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Nav onNext={onNext} onSkipToEnd={onSkip} />
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 3 — GOAL SELECTION
══════════════════════════════════════════════════════════ */

function ScreenGoal({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const { t } = useTranslation('onboarding')
    const [selected, setSelected] = useState<number | null>(null)

    const goals = [
        { icon: <BriefcaseIcon width={24} />, label: t('goal1'), color: 'text-blue-400',    activeBorder: 'border-blue-500/50',    activeBg: 'bg-blue-500/10' },
        { icon: <BookOpenIcon width={24} />,  label: t('goal2'), color: 'text-emerald-400', activeBorder: 'border-emerald-500/50', activeBg: 'bg-emerald-500/10' },
        { icon: <SmartphoneIcon width={24} />,label: t('goal3'), color: 'text-rose-400',    activeBorder: 'border-rose-500/50',    activeBg: 'bg-rose-500/10' },
        { icon: <StarIcon width={24} />,      label: t('goal4'), color: 'text-amber-400',   activeBorder: 'border-amber-500/50',   activeBg: 'bg-amber-500/10' },
    ]

    return (
        <div className="py-6">
            <div className="stagger mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{t('goalTitle')}</h2>
                <p className="text-zinc-400 text-sm">{t('goalSubtitle')}</p>
            </div>

            <div className="stagger grid grid-cols-2 gap-3 mb-2">
                {goals.map((g, i) => {
                    const isSelected = selected === i
                    return (
                        <button
                            key={i}
                            onClick={() => setSelected(i)}
                            className={`relative p-5 rounded-xl border text-left transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                                isSelected
                                    ? `${g.activeBorder} ${g.activeBg}`
                                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                            }`}
                            style={{ minHeight: '140px' }}
                        >
                            {isSelected && (
                                <div className="check-pop absolute top-3 right-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <CheckIcon width={11} strokeWidth={3} className="text-white" />
                                </div>
                            )}
                            <div className={`mb-3 transition-colors ${isSelected ? g.color : 'text-zinc-500'}`}>{g.icon}</div>
                            <p className="text-[15px] font-semibold text-white">{g.label}</p>
                        </button>
                    )
                })}
            </div>

            <Nav onNext={onNext} onSkipToEnd={onSkip} nextDisabled={selected === null} />
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 4 — CTA
══════════════════════════════════════════════════════════ */

function ScreenCta({ onCreateAccount, onSkipAccount }: {
    onCreateAccount: () => void
    onSkipAccount: () => void
}) {
    const { t } = useTranslation('onboarding')
    const benefits = [t('ctaBenefit1'), t('ctaBenefit2'), t('ctaBenefit3')]

    return (
        <div className="py-4 flex flex-col items-center">
            {/* HStack: image + title/subtitle */}
            <div className="w-full flex gap-3.5 mb-6">
                <div className="rounded-xl overflow-hidden shrink-0 shadow-2xl shadow-black/60" style={{ width: '150px', height: '190px' }}>
                    <img src={imgCta} alt="" className="w-full h-full object-cover object-center" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                    <h2 className="text-[17px] font-bold text-white mb-2 leading-snug">{t('ctaTitle')}</h2>
                    <p className="text-zinc-300 text-[13px] leading-relaxed">{t('ctaSubtitle')}</p>
                </div>
            </div>

            {/* Benefits */}
            <div className="stagger-benefits w-full space-y-2 mb-7">
                {benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <CheckIcon width={10} strokeWidth={3} className="text-emerald-400" />
                        </div>
                        <p className="text-[13px] text-zinc-300">{b}</p>
                    </div>
                ))}
            </div>

            {/* CTA buttons */}
            <div className="stagger w-full space-y-3">
                <button
                    onClick={onCreateAccount}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm shadow-xl shadow-amber-900/20 transition-all hover:brightness-110 active:scale-[0.97]"
                    style={{ background: 'linear-gradient(135deg, #d97706, #92400e)' }}
                >
                    {t('ctaCreate')}
                    <ChevronRightIcon width={14} />
                </button>

                <button
                    onClick={onSkipAccount}
                    className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    {t('ctaSkip')}
                </button>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   ROOT — OnboardingApp
══════════════════════════════════════════════════════════ */

function markCompleted(cb: () => void) {
    // @ts-ignore
    chrome.storage.local.get(STORAGE_KEY, (res: any) => {
        const current = res[STORAGE_KEY] ?? {}
        // @ts-ignore
        chrome.storage.local.set({ [STORAGE_KEY]: { ...current, onboardingCompleted: true } }, cb)
    })
}

export default function OnboardingApp() {
    const [screen, setScreen] = useState(0)
    const [dir, setDir] = useState<'forward' | 'backward'>('forward')
    const [animKey, setAnimKey] = useState(0)

    const go = useCallback((target: number) => {
        setDir(target > screen ? 'forward' : 'backward')
        setScreen(target)
        setAnimKey(k => k + 1)
    }, [screen])

    const next = () => go(screen + 1)
    const skipToEnd = () => go(TOTAL - 1)

    const finish = (openAuth: boolean) => {
        markCompleted(() => {
            // @ts-ignore
            window.location.href = chrome.runtime.getURL(
                openAuth ? 'src/auth/index.html' : 'src/dashboard/index.html'
            )
        })
    }

    return (
        <div className="min-h-screen relative">
            <Blobs />

            <div className="relative z-10 min-h-screen flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4 py-6">
                    <div className="w-full max-w-md">
                        <div
                            key={animKey}
                            className={dir === 'forward' ? 'screen-forward' : 'screen-backward'}
                        >
                            {screen === 0 && <ScreenWelcome onNext={next} />}
                            {screen === 1 && <ScreenProblem onNext={next} onSkip={skipToEnd} />}
                            {screen === 2 && <ScreenFeatures onNext={next} onSkip={skipToEnd} />}
                            {screen === 3 && <ScreenGoal onNext={next} onSkip={skipToEnd} />}
                            {screen === 4 && (
                                <ScreenCta
                                    onCreateAccount={() => finish(true)}
                                    onSkipAccount={() => finish(false)}
                                />
                            )}
                        </div>

                        <Dots current={screen} />
                    </div>
                </div>
            </div>
        </div>
    )
}
