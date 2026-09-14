import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
    BanIcon, ShieldAlertIcon, UsersIcon, ChevronRightIcon,
    CheckIcon, BriefcaseIcon, BookOpenIcon, SmartphoneIcon, StarIcon,
    EyeOffIcon, TrendingDownIcon, Gamepad2Icon, TimerIcon,
} from 'lucide-react'
import logo from '@/assets/blockweb_master_icon.svg'
import imgWelcome    from '@/assets/onboarding/ob-welcome.png'
import imgProblem    from '@/assets/onboarding/ob-problem.jpg'
import imgCta        from '@/assets/onboarding/ob-cta.jpg'
import imgFeatBlock  from '@/assets/onboarding/ob-feat-block.png'
import imgFeatStrict from '@/assets/onboarding/ob-feat-strict.png'
import imgFeatProfs  from '@/assets/onboarding/ob-feat-profiles.jpg'
import imgGoalWork   from '@/assets/onboarding/ob-goal-work.jpg'
import imgGoalStudy  from '@/assets/onboarding/ob-goal-study.jpg'
import imgGoalDetox  from '@/assets/onboarding/ob-goal-detox.jpg'
import imgGoalPers   from '@/assets/onboarding/ob-goal-personal.jpg'
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
        <div className="stagger flex flex-col items-center text-center py-6">
            {/* Logo */}
            <div className="logo-pop mb-5">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl scale-150" />
                    <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                        <img src={logo} alt="BlockWeb Master" className="w-10 h-10" />
                    </div>
                </div>
            </div>

            {/* Hero image */}
            <div className="w-full rounded-2xl overflow-hidden mb-6 shadow-2xl shadow-black/60" style={{ height: '190px' }}>
                <img src={imgWelcome} alt="" className="w-full h-full object-cover object-center" />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    BlockWeb
                </span>
                {' '}
                <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                    Master
                </span>
            </h1>

            {/* Tagline */}
            <p className="text-zinc-400 text-base max-w-xs leading-relaxed mb-8">
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
        { icon: <EyeOffIcon width={16} />,       label: t('problem1'), sub: t('problem1Sub'), color: 'text-rose-400',   dot: 'bg-rose-500' },
        { icon: <TrendingDownIcon width={16} />,  label: t('problem2'), sub: t('problem2Sub'), color: 'text-orange-400', dot: 'bg-orange-500' },
        { icon: <Gamepad2Icon width={16} />,      label: t('problem3'), sub: t('problem3Sub'), color: 'text-violet-400', dot: 'bg-violet-500' },
        { icon: <TimerIcon width={16} />,         label: t('problem4'), sub: t('problem4Sub'), color: 'text-amber-400',  dot: 'bg-amber-500' },
    ]

    const stats = [
        { value: t('stat1Value'), label: t('stat1Label'), color: 'text-rose-400',   bg: 'bg-rose-500/8 border-rose-500/15' },
        { value: t('stat2Value'), label: t('stat2Label'), color: 'text-amber-400',  bg: 'bg-amber-500/8 border-amber-500/15' },
        { value: t('stat3Value'), label: t('stat3Label'), color: 'text-violet-400', bg: 'bg-violet-500/8 border-violet-500/15' },
    ]

    return (
        <div className="py-4">
            {/* Hero image */}
            <div className="w-full rounded-2xl overflow-hidden mb-5 shadow-2xl shadow-black/60" style={{ height: '175px' }}>
                <img src={imgProblem} alt="" className="w-full h-full object-cover object-top" />
            </div>

            {/* Header */}
            <div className="stagger mb-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {t('problemBadge')}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-snug">{t('problemTitle')}</h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">{t('problemDesc')}</p>
            </div>

            {/* Problem pills */}
            <div className="stagger grid grid-cols-2 gap-2 mb-4">
                {problems.map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                        <span className={`shrink-0 ${p.color}`}>{p.icon}</span>
                        <div>
                            <p className="text-[12px] font-semibold text-white leading-tight">{p.label}</p>
                            <p className="text-[10px] text-zinc-500 leading-snug">{p.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="stagger grid grid-cols-3 gap-2 mb-2">
                {stats.map((s, i) => (
                    <div key={i} className={`px-2 py-3 rounded-xl border ${s.bg} text-center`}>
                        <p className={`text-base font-bold font-mono tabular-nums leading-none mb-1 ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-zinc-500 leading-snug">{s.label}</p>
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
            image: imgFeatBlock,
            icon: <BanIcon className="text-rose-400" width={18} />,
            title: t('feat1Title'),
            desc: t('feat1Desc'),
        },
        {
            image: imgFeatStrict,
            icon: <ShieldAlertIcon fill="currentColor" stroke="#8b0836" className="text-rose-400" width={18} />,
            title: t('feat2Title'),
            desc: t('feat2Desc'),
        },
        {
            image: imgFeatProfs,
            icon: <UsersIcon className="text-amber-400" width={18} />,
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
                        className="rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors overflow-hidden"
                    >
                        {/* Feature image banner */}
                        <div className="w-full overflow-hidden" style={{ height: '100px' }}>
                            <img src={f.image} alt="" className="w-full h-full object-cover object-center" />
                        </div>
                        {/* Text */}
                        <div className="flex items-start gap-3 p-3.5">
                            <span className="shrink-0 mt-0.5">{f.icon}</span>
                            <div>
                                <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                                <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
                            </div>
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
        { image: imgGoalWork,   icon: <BriefcaseIcon width={18} />, label: t('goal1'), color: 'text-blue-300',    ring: 'ring-blue-500/60' },
        { image: imgGoalStudy,  icon: <BookOpenIcon width={18} />,  label: t('goal2'), color: 'text-emerald-300', ring: 'ring-emerald-500/60' },
        { image: imgGoalDetox,  icon: <SmartphoneIcon width={18} />,label: t('goal3'), color: 'text-rose-300',    ring: 'ring-rose-500/60' },
        { image: imgGoalPers,   icon: <StarIcon width={18} />,      label: t('goal4'), color: 'text-amber-300',   ring: 'ring-amber-500/60' },
    ]

    return (
        <div className="py-6">
            <div className="stagger mb-5 text-center">
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
                            className={`relative rounded-xl overflow-hidden text-left transition-all duration-200 active:scale-[0.97] ${
                                isSelected ? `ring-2 ${g.ring}` : 'ring-0'
                            }`}
                            style={{ minHeight: '110px' }}
                        >
                            {/* Background image */}
                            <img src={g.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            {/* Dark overlay — lighter when selected */}
                            <div className={`absolute inset-0 transition-opacity duration-200 ${isSelected ? 'bg-black/40' : 'bg-black/60'}`} />
                            {/* Selected checkmark */}
                            {isSelected && (
                                <div className="check-pop absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                    <CheckIcon width={11} strokeWidth={3} className="text-white" />
                                </div>
                            )}
                            {/* Content */}
                            <div className="relative p-3.5 flex flex-col justify-end h-full" style={{ minHeight: '110px' }}>
                                <div className={`mb-1.5 ${g.color}`}>{g.icon}</div>
                                <p className="text-sm font-semibold text-white drop-shadow">{g.label}</p>
                            </div>
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
        <div className="py-4 flex flex-col items-center text-center">
            {/* CTA hero image */}
            <div className="w-full rounded-2xl overflow-hidden mb-5 shadow-2xl shadow-black/60" style={{ height: '185px' }}>
                <img src={imgCta} alt="" className="w-full h-full object-cover object-center" />
            </div>

            <div className="stagger w-full flex flex-col items-center">
                <h2 className="text-2xl font-bold text-white mb-2">{t('ctaTitle')}</h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mb-6">{t('ctaSubtitle')}</p>
            </div>

            {/* Benefits */}
            <div className="stagger-benefits w-full space-y-2 mb-8 max-w-xs">
                {benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <CheckIcon width={10} strokeWidth={3} className="text-emerald-400" />
                        </div>
                        <p className="text-xs text-zinc-300">{b}</p>
                    </div>
                ))}
            </div>

            {/* CTA buttons */}
            <div className="stagger w-full max-w-xs space-y-3">
                <button
                    onClick={onCreateAccount}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm shadow-xl shadow-amber-900/20 transition-all hover:brightness-110 active:scale-[0.97]"
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
