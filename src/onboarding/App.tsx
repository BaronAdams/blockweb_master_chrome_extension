import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
    BanIcon, ShieldAlertIcon, UsersIcon, ChevronRightIcon,
    CheckIcon, BriefcaseIcon, BookOpenIcon, SmartphoneIcon, StarIcon,
} from 'lucide-react'
import logo from '@/assets/blockweb_master_icon.svg'
import "@fontsource/inter/400.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"

/* ─── constants ─────────────────────────────────────────── */

const STORAGE_KEY = 'blockweb_master_state'
const TOTAL = 5

/* ─── animation helpers ─────────────────────────────────── */

const slide = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.18, ease: 'easeOut' as const } },
    exit: (dir: number) => ({
        x: dir > 0 ? -60 : 60, opacity: 0,
        transition: { duration: 0.14, ease: 'easeIn' as const },
    }),
}

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
}

const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
}

/* ─── background blobs ───────────────────────────────────── */

function Blobs() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
            <motion.div
                className="absolute top-[5%] left-[0%] w-[550px] h-[550px] rounded-full bg-amber-500/10 blur-[120px]"
                animate={{ x: [0, 35, 0], y: [0, -25, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute bottom-[0%] right-[0%] w-[480px] h-[480px] rounded-full bg-yellow-400/8 blur-[110px]"
                animate={{ x: [0, -28, 0], y: [0, 22, 0] }}
                transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
            <motion.div
                className="absolute top-[40%] left-[35%] w-[320px] h-[320px] rounded-full bg-amber-600/6 blur-[90px]"
                animate={{ x: [0, 20, 0], y: [0, -28, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            />
        </div>
    )
}

/* ─── progress dots ──────────────────────────────────────── */

function Dots({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: TOTAL }).map((_, i) => (
                <motion.div
                    key={i}
                    className="h-1.5 rounded-full bg-zinc-700"
                    animate={{
                        width: i === current ? 24 : 6,
                        backgroundColor: i === current ? '#f59e0b' : i < current ? '#92400e' : '#3f3f46',
                    }}
                    transition={{ duration: 0.2 }}
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
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNext}
                disabled={nextDisabled}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-rose-900/30"
            >
                {nextLabel ?? t('next')}
                <ChevronRightIcon width={14} />
            </motion.button>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 0 — WELCOME
══════════════════════════════════════════════════════════ */

function ScreenWelcome({ onNext }: { onNext: () => void }) {
    const { t } = useTranslation('onboarding')

    return (
        <motion.div
            className="flex flex-col items-center justify-center text-center py-12 min-h-[500px]"
            variants={stagger} initial="hidden" animate="show"
        >
            {/* Logo */}
            <motion.div
                variants={fadeUp}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] } }}
                className="mb-8"
            >
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl scale-150" />
                    <div className="relative w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                        <img src={logo} alt="BlockWeb Master" className="w-12 h-12" />
                    </div>
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                variants={fadeUp}
                className="text-4xl font-bold text-white mb-3 tracking-tight"
            >
                <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    BlockWeb
                </span>
                {' '}
                <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                    Master
                </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p variants={fadeUp} className="text-zinc-400 text-base max-w-xs leading-relaxed mb-10">
                {t('tagline')}
            </motion.p>

            {/* CTA */}
            <motion.button
                variants={fadeUp}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onNext}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-white font-semibold text-base shadow-xl shadow-rose-900/40 transition-all"
                style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
            >
                {t('getStarted')}
                <ChevronRightIcon width={18} />
            </motion.button>
        </motion.div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 1 — THE PROBLEM
══════════════════════════════════════════════════════════ */

function ScreenProblem({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const { t } = useTranslation('onboarding')

    const stats = [
        { value: t('stat1Value'), label: t('stat1Label'), color: 'text-rose-400', bg: 'bg-rose-500/8 border-rose-500/15' },
        { value: t('stat2Value'), label: t('stat2Label'), color: 'text-amber-400', bg: 'bg-amber-500/8 border-amber-500/15' },
        { value: t('stat3Value'), label: t('stat3Label'), color: 'text-violet-400', bg: 'bg-violet-500/8 border-violet-500/15' },
    ]

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="py-6">
            <motion.div variants={fadeUp} className="mb-7 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {t('problemTitle').split(' ').slice(0, 2).join(' ')}
                </div>
                <h2 className="text-2xl font-bold text-white mb-3 leading-snug">{t('problemTitle')}</h2>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mx-auto">{t('problemDesc')}</p>
            </motion.div>

            <div className="grid grid-cols-3 gap-3 mb-2">
                {stats.map((s, i) => (
                    <motion.div
                        key={i}
                        variants={fadeUp}
                        className={`p-4 rounded-xl border ${s.bg} text-center`}
                    >
                        <p className={`text-2xl font-bold font-mono tabular-nums mb-1 ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-zinc-500 leading-snug">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            <Nav onNext={onNext} onSkipToEnd={onSkip} />
        </motion.div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 2 — FEATURES
══════════════════════════════════════════════════════════ */

function ScreenFeatures({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const { t } = useTranslation('onboarding')

    const features = [
        {
            icon: <BanIcon className="text-rose-400" width={22} />,
            bg: 'bg-rose-500/10 border-rose-500/20',
            title: t('feat1Title'),
            desc: t('feat1Desc'),
        },
        {
            icon: <ShieldAlertIcon fill="currentColor" stroke="#8b0836" className="text-rose-400" width={22} />,
            bg: 'bg-rose-500/10 border-rose-500/20',
            title: t('feat2Title'),
            desc: t('feat2Desc'),
        },
        {
            icon: <UsersIcon className="text-amber-400" width={22} />,
            bg: 'bg-amber-500/10 border-amber-500/20',
            title: t('feat3Title'),
            desc: t('feat3Desc'),
        },
    ]

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="py-6">
            <motion.div variants={fadeUp} className="mb-7 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{t('solutionTitle')}</h2>
            </motion.div>

            <div className="space-y-3 mb-2">
                {features.map((f, i) => (
                    <motion.div
                        key={i}
                        variants={fadeUp}
                        className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${f.bg}`}>
                            {f.icon}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                            <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <Nav onNext={onNext} onSkipToEnd={onSkip} />
        </motion.div>
    )
}

/* ══════════════════════════════════════════════════════════
   SCREEN 3 — GOAL SELECTION
══════════════════════════════════════════════════════════ */

function ScreenGoal({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const { t } = useTranslation('onboarding')
    const [selected, setSelected] = useState<number | null>(null)

    const goals = [
        { icon: <BriefcaseIcon width={22} />, label: t('goal1'), color: 'text-blue-400', activeBg: 'border-blue-500/50 bg-blue-500/8' },
        { icon: <BookOpenIcon width={22} />, label: t('goal2'), color: 'text-emerald-400', activeBg: 'border-emerald-500/50 bg-emerald-500/8' },
        { icon: <SmartphoneIcon width={22} />, label: t('goal3'), color: 'text-rose-400', activeBg: 'border-rose-500/50 bg-rose-500/8' },
        { icon: <StarIcon width={22} />, label: t('goal4'), color: 'text-amber-400', activeBg: 'border-amber-500/50 bg-amber-500/8' },
    ]

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="py-6">
            <motion.div variants={fadeUp} className="mb-7 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{t('goalTitle')}</h2>
                <p className="text-zinc-500 text-sm">{t('goalSubtitle')}</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 mb-2">
                {goals.map((g, i) => (
                    <motion.button
                        key={i}
                        variants={fadeUp}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelected(i)}
                        className={`relative p-5 rounded-xl border text-left transition-all duration-200 ${
                            selected === i
                                ? `${g.activeBg} ${g.color}`
                                : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                        }`}
                    >
                        {selected === i && (
                            <motion.div
                                layoutId="goal-check"
                                className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                                <CheckIcon width={10} strokeWidth={3} className="text-white" />
                            </motion.div>
                        )}
                        <div className={`mb-2 ${selected === i ? g.color : 'text-zinc-500'}`}>{g.icon}</div>
                        <p className="text-sm font-semibold text-white">{g.label}</p>
                    </motion.button>
                ))}
            </div>

            <Nav
                onNext={onNext}
                onSkipToEnd={onSkip}
                nextDisabled={selected === null}
            />
        </motion.div>
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
        <motion.div
            variants={stagger} initial="hidden" animate="show"
            className="py-6 flex flex-col items-center text-center"
        >
            {/* Logo small */}
            <motion.div variants={fadeUp} className="mb-5">
                <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <img src={logo} alt="BlockWeb Master" className="w-8 h-8" />
                </div>
            </motion.div>

            <motion.h2 variants={fadeUp} className="text-2xl font-bold text-white mb-2">
                {t('ctaTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-sm leading-relaxed max-w-xs mb-7">
                {t('ctaSubtitle')}
            </motion.p>

            {/* Benefits */}
            <motion.div variants={stagger} className="w-full space-y-2 mb-8 max-w-xs">
                {benefits.map((b, i) => (
                    <motion.div
                        key={i}
                        variants={fadeUp}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left"
                    >
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <CheckIcon width={10} strokeWidth={3} className="text-emerald-400" />
                        </div>
                        <p className="text-xs text-zinc-300">{b}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="w-full max-w-xs space-y-3">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onCreateAccount}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm shadow-xl shadow-rose-900/30 transition-all"
                    style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
                >
                    {t('ctaCreate')}
                    <ChevronRightIcon width={14} />
                </motion.button>

                <button
                    onClick={onSkipAccount}
                    className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    {t('ctaSkip')}
                </button>
            </motion.div>
        </motion.div>
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
    const [dir, setDir] = useState(1)

    const go = useCallback((target: number) => {
        setDir(target > screen ? 1 : -1)
        setScreen(target)
    }, [screen])

    const next = () => go(screen + 1)
    const skipToEnd = () => go(TOTAL - 1)

    const finish = (openAuth: boolean) => {
        markCompleted(() => {
            if (openAuth) {
                // @ts-ignore
                window.location.href = chrome.runtime.getURL('src/auth/index.html')
            } else {
                // @ts-ignore
                window.location.href = chrome.runtime.getURL('src/dashboard/index.html')
            }
        })
    }

    return (
        <div className="min-h-screen bg-zinc-950 relative">
            <Blobs />

            <div className="relative z-10 min-h-screen flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4 py-6">
                    <div className="w-full max-w-md">
                        <AnimatePresence mode="wait" custom={dir}>
                            <motion.div
                                key={screen}
                                custom={dir}
                                variants={slide}
                                initial="enter"
                                animate="center"
                                exit="exit"
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
                            </motion.div>
                        </AnimatePresence>

                        <Dots current={screen} />
                    </div>
                </div>
            </div>
        </div>
    )
}
