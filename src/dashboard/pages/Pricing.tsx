import React, { useState, useRef } from 'react'
import { Icon } from "@iconify/react";
import { useStateContext } from '@/context/GlobalStateContext';
import { useT } from '@/lib/i18n';

/* =========================================================
   CONFIG
========================================================= */
const CHARIOW_LINKS = {
    monthly:  "#", // TODO
    yearly:   "#", // TODO
    lifetime: "#", // TODO
};

// const twh  = getT('pricing')
// const twhc = getT('common')
const isLangFr = () => navigator.language?.startsWith('fr')

/* ── Comparatif Free vs Premium ── */
const COMPARISON = () => [
    { label: isLangFr() ? "Sites bloqués" : "Blocked sites",         free: "3 sites",    premium: isLangFr() ? "Illimités" : "Unlimited"        },
    { label: isLangFr() ? "Mots-clés bloqués" : "Blocked keywords",     free: isLangFr() ? "3 mots-clés" : "3 keywords",premium: "Illimités"        },
    { label: isLangFr() ? "Profils limiteurs" : "Limiter profiles",     free: isLangFr() ? "1 profil" : "1 profile",   premium: "Illimités"        },
    { label: isLangFr() ? "Sites par profils" : "Sites per profile",     free: "3 sites",   premium: "Illimités"        },
    { label: "Whitelist",             free: false,    premium: isLangFr() ? "Illimitée" : "Unlimited"        },
    // { label: "Types de profil",       free: "Quotidien",  premium: "Tous les types"   },
    { label: isLangFr() ? "URL de redirection" : "Redirect URL",    free: false,        premium: true               },
    { label: isLangFr() ? "Bloqueur de contenu adulte" : "Adult content blocker", free: false,   premium: true               },
    { label: isLangFr() ? "Mode Strict" : "Strict Mode",           free: isLangFr() ? "1 jour max" : "1 day max", premium: isLangFr() ? "30 jours max" : "30 days max"     },
    { label: isLangFr() ? "Support prioritaire" : "Priority support",   free: false,        premium: true               },
    { label: isLangFr() ? "Mises à jour futures" : 'Future updates', free: true, premium: true },
]

/* ── FAQ ── */
const FAQ_ITEMS = () => [
    {
        q: isLangFr() ? "Comment activer mon plan après le paiement ?" : "How do I activate my plan after payment?",
        a: isLangFr() ? "Connectez-vous avec l'email utilisé lors de l'achat. Votre plan sera activé automatiquement dans les minutes qui suivent le paiement." : "Log in with the email used at purchase. Your plan will be activated automatically within minutes of payment.",
    },
    {
        q: isLangFr() ? "Puis-je annuler mon abonnement mensuel ou annuel ?" : "Can I cancel my monthly or annual subscription?",
        a: isLangFr() ? "Oui, vous pouvez annuler à tout moment depuis votre espace Chariow. Votre accès Premium reste actif jusqu'à la fin de la période déjà payée." : "Yes, you can cancel anytime from your Chariow dashboard. Your Premium access remains active until the end of the paid period.",
    },
    {
        q: isLangFr() ? "Le plan À Vie inclut-il les futures mises à jour ?" : "Does the Lifetime plan include future updates?",
        a: isLangFr() ? "Oui, absolument. Toutes les mises à jour futures de Blockweb Master sont incluses définitivement, sans aucun frais supplémentaire." : "Yes, absolutely. All future updates to Blockweb Master are included forever, with no additional cost.",
    },
    {
        q: isLangFr() ? "Puis-je obtenir un remboursement ?" : "Can I get a refund?",
        a: isLangFr() ? "Nous offrons un remboursement complet sous 7 jours si vous n'êtes pas satisfait. Contactez le support avec votre email d'achat." : "We offer a full refund within 7 days if you're not satisfied. Contact support with your purchase email.",
    },
    {
        q: isLangFr() ? "Mon plan est-il lié à un seul appareil ?" : "Is my plan tied to a single device?",
        a: isLangFr() ? "Non, votre licence est liée à votre compte email. Vous pouvez l'utiliser sur tous vos appareils en vous connectant avec le même email." : "No, your license is linked to your email account. You can use it on all your devices by logging in with the same email.",
    },
    {
        q: isLangFr() ? "Quelle est la différence entre le plan Annuel et À Vie ?" : "What is the difference between the Annual and Lifetime plans?",
        a: isLangFr() ? "Le plan Annuel se renouvelle chaque année à $27. Le plan À Vie est un paiement unique de $45 qui vous donne accès à Blockweb Master pour toujours — c'est rentabilisé en moins de 2 ans." : "The Annual plan renews each year at $27. The Lifetime plan is a one-time payment of $45 that gives you access to Blockweb Master forever — paid off in less than 2 years.",
    },
]

/* =========================================================
   SOUS-COMPOSANT — Accordion FAQ animé
========================================================= */
const FaqItem: React.FC<{ q: string; a: string; isOpen: boolean; onToggle: () => void }> = ({
    q, a, isOpen, onToggle
}) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div className={`border rounded-xl overflow-hidden transition-colors duration-200 ${isOpen ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/50'}`}>
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
            >
                <span className="text-xs font-medium text-white leading-relaxed">{q}</span>
                <span className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen ? 'border-white bg-white text-black rotate-180' : 'border-zinc-700 text-zinc-500'}`}>
                    <Icon icon="solar:alt-arrow-down-linear" width="10" />
                </span>
            </button>

            {/* Animated content */}
            <div
                ref={contentRef}
                style={{
                    maxHeight: isOpen ? `${contentRef.current?.scrollHeight ?? 200}px` : '0px',
                    opacity: isOpen ? 1 : 0,
                    transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
                    overflow: 'hidden',
                }}
            >
                <div className="px-5 pb-4 border-t border-zinc-800 pt-3">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{a}</p>
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const Pricing: React.FC = () => {
    const t  = useT('pricing')
    // const tc = useT('common')
    const { state }  = useStateContext();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const currentPlan = state?.subscription.plan ?? "FREE";
    const isPremium   = state?.isPremium ?? false;

    const handleUpgrade = (plan: "monthly" | "yearly" | "lifetime") => {
        const link = CHARIOW_LINKS[plan];
        if (link === "#") return;
        window.open(link, "_blank", "noopener,noreferrer");
    };

    /* ── Label CTA selon l'état ── */
    const cta = (plan: string) => currentPlan === plan ? t('currentPlan') : isPremium ? (isLangFr() ? "Changer" : "Switch") : (isLangFr() ? "Commencer" : "Start");
    const isActive = (plan: string) => currentPlan === plan;

    return (
        <div id="tab-pricing" className="space-y-14 max-w-5xl mx-auto pb-12">

            {/* ── Header ── */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-white">{isLangFr() ? 'Choisissez votre plan' : 'Choose your plan'}</h2>
                <p className="text-zinc-400 text-sm">{isLangFr() ? 'Reprenez le contrôle de votre temps en ligne.' : 'Take back control of your time online.'}</p>
            </div>

            {/* ── Bannière Premium actif ── */}
            {isPremium && (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl max-w-md mx-auto">
                    <Icon icon="solar:crown-bold" className="text-emerald-400 shrink-0" width="16" />
                    <div>
                        <p className="text-xs font-medium text-emerald-300">{isLangFr() ? 'Vous êtes déjà Premium' : 'You are already Premium'}</p>
                        <p className="text-[10px] text-emerald-400/60">
                            {currentPlan === "MONTHLY"  && isLangFr() ? 'Plan mensuel actif.' : 'Monthly plan active.'}
                            {currentPlan === "YEARLY"   && isLangFr() ? 'Plan annuel actif.' : 'Annual plan active.'}
                            {currentPlan === "LIFETIME" && isLangFr() ? 'Accès à vie — merci pour votre soutien !' : 'Lifetime access — thank you for your support!'}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Cartes de prix ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">

                {/* FREE */}
                <div className={`rounded-2xl bg-zinc-900 border p-6 flex flex-col gap-5 relative ${isActive('FREE') ? 'border-white' : 'border-zinc-800'}`}>
                    {isActive('FREE') && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full">{t('currentPlan')}</div>}
                    <div>
                        <p className="text-xs text-zinc-500 font-medium mb-3">Free</p>
                        <p className="text-3xl font-bold text-white">$0</p>
                        <p className="text-[11px] text-zinc-500 mt-1">{isLangFr() ? 'Pour toujours' : 'Forever'}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{isLangFr() ? 'Idéal pour découvrir Blockweb Master et commencer à limiter les distractions.' : 'Ideal for discovering Blockweb Master and starting to limit distractions.'}</p>
                    </div>
                    <button
                        disabled={isActive('FREE')}
                        className="w-full py-2.5 rounded-lg border border-zinc-700 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-default transition-colors"
                    >
                        {cta('FREE')}
                    </button>
                </div>

                {/* MONTHLY */}
                <div className={`rounded-2xl bg-zinc-900 border p-6 flex flex-col gap-5 relative ${isActive('MONTHLY') ? 'border-white' : 'border-zinc-800'}`}>
                    {isActive('MONTHLY') && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full">Plan actuel</div>}
                    <div>
                        <p className="text-xs text-zinc-500 font-medium mb-3">Mensuel</p>
                        <p className="text-3xl font-bold text-white">$5 <span className="text-base font-normal text-zinc-500">/mois</span></p>
                        <p className="text-[11px] text-zinc-500 mt-1">{isLangFr() ? 'Sans engagement' : 'No commitment'}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{isLangFr() ? 'Accès complet à toutes les fonctionnalités. Annulez quand vous voulez, sans condition.' : 'Full access to all features. Cancel anytime, no conditions.'}</p>
                    </div>
                    <button
                        onClick={() => handleUpgrade('monthly')}
                        disabled={isActive('MONTHLY')}
                        className="w-full py-2.5 rounded-lg border border-zinc-700 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-default transition-colors"
                    >
                        {cta('MONTHLY')}
                    </button>
                </div>

                {/* YEARLY — mis en avant */}
                <div className={`rounded-2xl bg-zinc-900 border p-6 flex flex-col gap-5 relative shadow-[0_0_40px_rgba(245,158,11,0.12)] transform scale-105 ${isActive('YEARLY') ? 'border-white' : 'border-amber-500/50'}`}>
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap text-black ${isActive('YEARLY') ? 'bg-white' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
                        {isActive('YEARLY') ? 'Plan actuel' : isLangFr() ? 'Le plus populaire' : 'Most popular'}
                    </div>
                    <div className="absolute top-4 right-4">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">-55%</span>
                    </div>
                    <div>
                        <p className="text-xs text-amber-500 font-medium mb-3">Annuel</p>
                        <p className="text-3xl font-bold text-white">$27 <span className="text-base font-normal text-zinc-500">/an</span></p>
                        <p className="text-[11px] text-zinc-500 line-through mt-1">$60/an</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] text-zinc-300 leading-relaxed">{isLangFr() ? "Le meilleur rapport qualité-prix. Économisez $33 chaque année — soit l'équivalent de 6 mois offerts." : 'Best value for money. Save $33 every year — equivalent to 6 months free.'}</p>
                    </div>
                    <button
                        onClick={() => handleUpgrade('yearly')}
                        disabled={isActive('YEARLY')}
                        className="w-full py-2.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-default transition-colors"
                    >
                        {cta('YEARLY')}
                    </button>
                </div>

                {/* LIFETIME */}
                <div className={`rounded-2xl bg-zinc-900 border p-6 flex flex-col gap-5 relative ${isActive('LIFETIME') ? 'border-white' : 'border-zinc-800'}`}>
                    {isActive('LIFETIME') && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full">Plan actuel</div>}
                    <div>
                        <p className="text-xs text-zinc-500 font-medium mb-3">À Vie</p>
                        <p className="text-3xl font-bold text-white">$45</p>
                        <p className="text-[11px] text-zinc-500 mt-1">{isLangFr() ? 'Paiement unique' : 'One-time payment'}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{isLangFr() ? 'Payez une seule fois, profitez pour toujours. Rentabilisé en moins de 2 ans par rapport au mensuel.' : 'Pay once, enjoy forever. Paid off in less than 2 years vs monthly.'}</p>
                    </div>
                    <button
                        onClick={() => handleUpgrade('lifetime')}
                        disabled={isActive('LIFETIME')}
                        className="w-full py-2.5 rounded-lg border border-zinc-700 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-default transition-colors"
                    >
                        {cta('LIFETIME')}
                    </button>
                </div>
            </div>

            {/* ── Note paiement ── */}
            <p className="text-center text-[14px] text-white -mt-8">
                {isLangFr() ? "Paiement sécurisé via Chariow · Connectez-vous avec l'email d'achat pour activer votre plan." : "Secure payment via Chariow · Log in with your purchase email to activate your plan."}
            </p>

            {/* ── Comparatif Free vs Premium ── */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white text-center">{isLangFr() ? 'Ce qui est inclus' : 'What is included'}</h3>
                <div className="rounded-2xl border border-zinc-800 overflow-hidden">

                    {/* En-tête */}
                    <div className="grid grid-cols-3 bg-zinc-900 border-b border-zinc-800">
                        <div className="px-5 py-3.5">
                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">{isLangFr() ? 'Fonctionnalité' : 'Feature'}</p>
                        </div>
                        <div className="px-5 py-3.5 border-l border-zinc-800 text-center">
                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Free</p>
                        </div>
                        <div className="px-5 py-3.5 border-l border-zinc-800 text-center bg-amber-500/5">
                            <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wide flex items-center justify-center gap-1.5">
                                <Icon icon="solar:crown-bold" width="11" /> Premium
                            </p>
                        </div>
                    </div>

                    {/* Lignes */}
                    {COMPARISON().map((row, i) => (
                        <div
                            key={i}
                            className={`grid grid-cols-3 border-b border-zinc-800 last:border-b-0 ${i % 2 === 0 ? 'bg-black/20' : ''}`}
                        >
                            <div className="px-5 py-3 flex items-center">
                                <span className="text-xs text-zinc-300">{row.label}</span>
                            </div>
                            <div className="px-5 py-3 border-l border-zinc-800 flex items-center justify-center">
                                {typeof row.free === 'boolean' ? (
                                    row.free
                                        ? <Icon icon="solar:check-circle-bold" className="text-zinc-500" width="16" />
                                        : <Icon icon="solar:close-circle-bold" className="text-zinc-700" width="16" />
                                ) : (
                                    <span className="text-xs text-zinc-400 text-center">{row.free}</span>
                                )}
                            </div>
                            <div className="px-5 py-3 border-l border-zinc-800 flex items-center justify-center bg-amber-500/[0.03]">
                                {typeof row.premium === 'boolean' ? (
                                    row.premium
                                        ? <Icon icon="solar:check-circle-bold" className="text-amber-500" width="16" />
                                        : <Icon icon="solar:close-circle-bold" className="text-zinc-700" width="16" />
                                ) : (
                                    <span className="text-xs text-amber-400/90 font-medium text-center">{row.premium}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── FAQ ── */}
            <div className="space-y-2 max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-white text-center mb-6">{isLangFr() ? 'Questions fréquentes' : 'Frequently asked questions'}</h3>
                {FAQ_ITEMS().map((item, i) => (
                    <FaqItem
                        key={i}
                        q={item.q}
                        a={item.a}
                        isOpen={openFaq === i}
                        onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                    />
                ))}
            </div>

        </div>
    );
};

export default Pricing;