import React, { useState, useRef } from 'react'
import { Icon } from "@iconify/react";
import { useStateContext } from '@/context/GlobalStateContext';

/* =========================================================
   CONFIG
========================================================= */
const CHARIOW_LINKS = {
    monthly:  "#", // TODO
    yearly:   "#", // TODO
    lifetime: "#", // TODO
};

/* ── Comparatif Free vs Premium ── */
const COMPARISON = [
    { label: "Sites bloqués",         free: "3 sites",    premium: "Illimités"        },
    { label: "Mots-clés bloqués",     free: "3 mots-clés",premium: "Illimités"        },
    { label: "Profils limiteurs",     free: "1 profil",   premium: "Illimités"        },
    { label: "Sites par profils",     free: "3 sites",   premium: "Illimités"        },
    { label: "Whitelist",             free: false,    premium: "Illimitée"        },
    // { label: "Types de profil",       free: "Quotidien",  premium: "Tous les types"   },
    { label: "URL de redirection",    free: false,        premium: true               },
    { label: "Bloqueur de contenu adulte", free: false,   premium: true               },
    { label: "Mode Strict",           free: "1 jour max", premium: "30 jours max"     },
    { label: "Support prioritaire",   free: false,        premium: true               },
    { label: "Mises à jour futures",  free: true,         premium: true               },
];

/* ── FAQ ── */
const FAQ_ITEMS = [
    {
        q: "Comment activer mon plan après le paiement ?",
        a: "Connectez-vous avec l'email utilisé lors de l'achat. Votre plan sera activé automatiquement dans les minutes qui suivent le paiement.",
    },
    {
        q: "Puis-je annuler mon abonnement mensuel ou annuel ?",
        a: "Oui, vous pouvez annuler à tout moment depuis votre espace Chariow. Votre accès Premium reste actif jusqu'à la fin de la période déjà payée.",
    },
    {
        q: "Le plan À Vie inclut-il les futures mises à jour ?",
        a: "Oui, absolument. Toutes les mises à jour futures de Blockweb Master sont incluses définitivement, sans aucun frais supplémentaire.",
    },
    {
        q: "Puis-je obtenir un remboursement ?",
        a: "Nous offrons un remboursement complet sous 7 jours si vous n'êtes pas satisfait. Contactez le support avec votre email d'achat.",
    },
    {
        q: "Mon plan est-il lié à un seul appareil ?",
        a: "Non, votre licence est liée à votre compte email. Vous pouvez l'utiliser sur tous vos appareils en vous connectant avec le même email.",
    },
    {
        q: "Quelle est la différence entre le plan Annuel et À Vie ?",
        a: "Le plan Annuel se renouvelle chaque année à $27. Le plan À Vie est un paiement unique de $45 qui vous donne accès à Blockweb Master pour toujours — c'est rentabilisé en moins de 2 ans.",
    },
];

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
    const cta = (plan: string) => currentPlan === plan ? "Plan actuel" : isPremium ? "Changer" : "Commencer";
    const isActive = (plan: string) => currentPlan === plan;

    return (
        <div id="tab-pricing" className="space-y-14 max-w-5xl mx-auto pb-12">

            {/* ── Header ── */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-white">Choisissez votre plan</h2>
                <p className="text-zinc-400 text-sm">Reprenez le contrôle de votre temps en ligne.</p>
            </div>

            {/* ── Bannière Premium actif ── */}
            {isPremium && (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl max-w-md mx-auto">
                    <Icon icon="solar:crown-bold" className="text-emerald-400 shrink-0" width="16" />
                    <div>
                        <p className="text-xs font-medium text-emerald-300">Vous êtes déjà Premium</p>
                        <p className="text-[10px] text-emerald-400/60">
                            {currentPlan === "MONTHLY"  && "Plan mensuel actif."}
                            {currentPlan === "YEARLY"   && "Plan annuel actif."}
                            {currentPlan === "LIFETIME" && "Accès à vie — merci pour votre soutien !"}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Cartes de prix ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">

                {/* FREE */}
                <div className={`rounded-2xl bg-zinc-900 border p-6 flex flex-col gap-5 relative ${isActive('FREE') ? 'border-white' : 'border-zinc-800'}`}>
                    {isActive('FREE') && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full">Plan actuel</div>}
                    <div>
                        <p className="text-xs text-zinc-500 font-medium mb-3">Free</p>
                        <p className="text-3xl font-bold text-white">$0</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Pour toujours</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] text-zinc-400 leading-relaxed">Idéal pour découvrir Blockweb Master et commencer à limiter les distractions.</p>
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
                        <p className="text-[11px] text-zinc-500 mt-1">Sans engagement</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] text-zinc-400 leading-relaxed">Accès complet à toutes les fonctionnalités. Annulez quand vous voulez, sans condition.</p>
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
                        {isActive('YEARLY') ? 'Plan actuel' : 'Le plus populaire'}
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
                        <p className="text-[11px] text-zinc-300 leading-relaxed">Le meilleur rapport qualité-prix. Économisez $33 chaque année — soit l'équivalent de 6 mois offerts.</p>
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
                        <p className="text-[11px] text-zinc-500 mt-1">Paiement unique</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] text-zinc-400 leading-relaxed">Payez une seule fois, profitez pour toujours. Rentabilisé en moins de 2 ans par rapport au mensuel.</p>
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
                Paiement sécurisé via Chariow · Connectez-vous avec l'email d'achat pour activer votre plan.
            </p>

            {/* ── Comparatif Free vs Premium ── */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white text-center">Ce qui est inclus</h3>
                <div className="rounded-2xl border border-zinc-800 overflow-hidden">

                    {/* En-tête */}
                    <div className="grid grid-cols-3 bg-zinc-900 border-b border-zinc-800">
                        <div className="px-5 py-3.5">
                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Fonctionnalité</p>
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
                    {COMPARISON.map((row, i) => (
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
                <h3 className="text-sm font-semibold text-white text-center mb-6">Questions fréquentes</h3>
                {FAQ_ITEMS.map((item, i) => (
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