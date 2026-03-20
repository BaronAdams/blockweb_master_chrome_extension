import { Icon } from "@iconify/react";
import "@fontsource/inter/400.css";
import './App.css'
import { useEffect, useState } from "react";
import { State } from "@/lib/types";
import logo from '@/assets/blockweb_master_icon.svg'

/* =========================================================
   CITATIONS MOTIVATIONNELLES
========================================================= */
const QUOTES = [
  { text: "La discipline est de choisir entre ce que vous voulez maintenant et ce que vous voulez le plus.", author: "Abraham Lincoln" },
  { text: "La concentration est la racine de toutes les capacités humaines supérieures.", author: "Bruce Lee" },
  { text: "Ce n'est pas le temps qui manque, c'est la direction.", author: "Sénèque" },
  { text: "Chaque distraction est une dette envers votre futur moi.", author: "" },
  { text: "Le secret du succès est de commencer.", author: "Mark Twain" },
  { text: "Une heure de concentration vaut plus que dix heures d'effort dispersé.", author: "" },
  { text: "Vous devenez ce que vous faites de façon répétée.", author: "Aristote" },
  { text: "La vraie liberté, c'est de contrôler ses propres actions.", author: "Épictète" },
  { text: "Le manque de direction, et non le manque de temps, est le problème.", author: "Zig Ziglar" },
  { text: "Faites un pas à la fois, mais faites-le maintenant.", author: "" },
];

const randomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

/* =========================================================
   CONTENU SPÉCIFIQUE PAR TYPE DE PROFIL
========================================================= */
type ProfileType = "daily" | "hourly" | "weekly" | "interval";

const PROFILE_CONTENT: Record<ProfileType, {
  icon: string;
  iconColor: string;
  glowColor: string;
  title: string;
  description: (name: string) => string;
  badge: string;
  reason: string;
}> = {
  daily: {
    icon:        "solar:sun-bold",
    iconColor:   "text-amber-400",
    glowColor:   "bg-amber-500",
    title:       "Limite Journalière Atteinte",
    description: (name) => `Vous avez épuisé votre quota du jour pour le profil "${name}". Revenez demain, reposé et concentré.`,
    badge:       "Temps épuisé",
    reason:      "Limite journalière atteinte",
  },
  hourly: {
    icon:        "solar:clock-circle-bold",
    iconColor:   "text-blue-400",
    glowColor:   "bg-blue-500",
    title:       "Pause Obligatoire",
    description: (name) => `Vous avez atteint votre limite horaire pour le profil "${name}". Profitez-en pour vous étirer — l'accès se rouvrira à la prochaine heure.`,
    badge:       "Temps épuisé",
    reason:      "Limite horaire atteinte",
  },
  weekly: {
    icon:        "solar:calendar-mark-bold",
    iconColor:   "text-violet-400",
    glowColor:   "bg-violet-500",
    title:       "Budget Hebdomadaire Épuisé",
    description: (name) => `Vous avez consommé tout votre temps alloué cette semaine pour le profil "${name}". Le compteur se remet à zéro lundi à minuit.`,
    badge:       "Temps épuisé",
    reason:      "Limite hebdomadaire atteinte",
  },
  interval: {
    icon:        "solar:calendar-date-bold",
    iconColor:   "text-rose-400",
    glowColor:   "bg-rose-500",
    title:       "Blocage Programmé Actif",
    description: (name) => `Le profil "${name}" bloque cet accès sur cette plage horaire. Restez concentré, la plage se terminera bientôt.`,
    badge:       "Plage de blocage active",
    reason:      "Blocage par intervalle programmé",
  },
};

/* =========================================================
   TYPES
========================================================= */
type BlockReason = "url" | "keyword" | "profile" | "adult" | "unknown";

interface BlockInfo {
  reason: BlockReason;
  value: string;
  profileName?: string;
  profileType?: ProfileType;
}

/* =========================================================
   COMPOSANT
========================================================= */
export default function App() {
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
  const [quote] = useState(randomQuote);

  /* ── Lecture des paramètres URL + résolution du profil ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    const keyword = params.get("keyword");
    const profileId = params.get("profile");
    const isAdult = params.get("adult") === "1";

    if (isAdult && url) {
      setBlockInfo({ reason: "adult", value: url });
      return;
    }

    if (url) {
      setBlockInfo({ reason: "url", value: url });
      return;
    }

    if (keyword) {
      setBlockInfo({ reason: "keyword", value: keyword });
      return;
    }

    if (profileId) {
      // Résoudre le nom du profil depuis le storage
      chrome.storage.local.get(["blockweb_master_state"], (result) => {
        const state = result?.blockweb_master_state as State;
        const allProfiles = [
          ...(state?.activeProfiles ?? []),
          ...(state?.frozenProfiles ?? []),
        ];
        const profile = allProfiles.find((p: { id: string }) => p.id === profileId);
        setBlockInfo({
          reason: "profile",
          value: profileId,
          profileName: profile?.name ?? "Profil limiteur",
          profileType: profile?.config.type
        });
      });
      return;
    }

    setBlockInfo({ reason: "unknown", value: "" });
  }, []);

  /* ── Ouvrir le dashboard ── */
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/dashboard/index.html") });
  };

  /* ── Contenu selon la raison ── */
  const getContent = () => {
    if (!blockInfo) return null;

    switch (blockInfo.reason) {
      case "adult":
        return {
          icon: "solar:shield-warning-bold",
          iconColor: "text-rose-400",
          glowColor: "bg-rose-500",
          title: "Contenu Adulte Bloqué",
          description: "Ce site a été identifié comme contenu adulte. Le filtre de protection est actif.",
          badge: "Contenu restreint",
          detail: {
            icon: "solar:forbidden-circle-linear",
            label: "Site adulte bloqué",
            value: blockInfo.value,
            mono: true,
          },
          reason: "Protection adulte activée",
        };
      case "keyword":
        return {
          icon: "solar:lock-password-bold",
          iconColor: "text-rose-400",
          glowColor: "bg-rose-500",
          title: "Accès Restreint",
          description: `Cette page contient le mot-clé bloqué "${blockInfo.value}".`,
          badge: "Bloqué",
          detail: {
            icon: "solar:text-field-linear",
            label: "Mot-clé détecté",
            value: blockInfo.value,
            mono: true,
          },
          reason: "Mot-clé bloqué",
        };
      case "profile": {
        const profileType = (blockInfo.profileType ?? "daily") as ProfileType;
        const pc = PROFILE_CONTENT[profileType] ?? PROFILE_CONTENT.daily;
        const profileName = blockInfo.profileName ?? "Profil limiteur";
        return {
          icon:        pc.icon,
          iconColor:   pc.iconColor,
          glowColor:   pc.glowColor,
          title:       pc.title,
          description: pc.description(profileName),
          badge:       pc.badge,
          detail: {
            icon:  "solar:stopwatch-linear",
            label: "Profil actif",
            value: profileName,
            mono:  false,
          },
          reason: pc.reason,
        };
      }
      case "url":
      default:
        return {
          icon: "solar:lock-password-bold",
          iconColor: "text-rose-400",
          glowColor: "bg-rose-500",
          title: "Accès Restreint",
          description: "Cette page a été bloquée pour vous aider à rester concentré sur vos objectifs.",
          badge: "Bloqué",
          detail: blockInfo.value ? {
            icon: "bx:globe",
            label: "Domaine ciblé",
            value: blockInfo.value,
            mono: true,
          } : null,
          reason: "Mode Focus Actif",
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden selection:bg-rose-500/30 selection:text-rose-200">

      {/* Fond grille */}
      <div className="absolute inset-0 bg-grid pointer-events-none z-0" />

      {/* Logo */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-center md:justify-start z-20">
        <div className="flex items-center gap-2 text-white opacity-80 hover:opacity-100 transition-opacity cursor-default">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
              <img src={logo} className="w-8 h-8 object-cover" />
          </div>
          <span className="text-sm font-medium tracking-tight text-white">BlockWeb Master</span>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center">

        {/* Illustration animée */}
        {content && (
          <div className="relative mb-10 flex items-center justify-center">
            <div className={`absolute w-32 h-32 ${content.glowColor} rounded-full blur-[80px] opacity-20 glow-pulse`} />
            <div className="relative w-24 h-24 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center lock-float shadow-2xl shadow-rose-900/10">
              <Icon icon={content.icon} width="40" className={content.iconColor} />
            </div>
            <div className="absolute -right-4 top-0 bg-zinc-900 border border-zinc-800 py-1.5 px-3 rounded-full flex items-center gap-2 shadow-xl animate-[bounce_5s_infinite]">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs text-zinc-400 font-medium">{content.badge}</span>
            </div>
          </div>
        )}

        {/* Titre */}
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-4">
          {content?.title ?? "Accès Restreint"}
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-md mx-auto font-light">
          {content?.description}
        </p>

        {/* Carte détails */}
        <div className="w-full bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md mb-10 text-left">
          <div className="border-b border-white/5 px-5 py-3 bg-white/[0.02]">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Détails de sécurité</span>
          </div>
          <div className="p-5 space-y-4">

            {/* Détail principal */}
            {content?.detail && (
              <>
                <div className="flex items-start justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 border border-white/5 group-hover:border-zinc-700 transition-colors">
                      <Icon icon={content.detail.icon} width="18" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">{content.detail.label}</p>
                      <p className={`text-sm text-zinc-200 ${content.detail.mono ? "font-mono tracking-tight" : "font-medium"}`}>
                        {content.detail.value}
                      </p>
                    </div>
                  </div>
                  <Icon icon="solar:forbidden-circle-linear" className="text-rose-500/80 mt-2 shrink-0" width="18" />
                </div>
                <div className="w-full h-px bg-white/5" />
              </>
            )}

            {/* Raison */}
            <div className="flex items-start justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 border border-white/5 group-hover:border-zinc-700 transition-colors">
                  <Icon icon="solar:hourglass-linear" width="18" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Raison du blocage</p>
                  <p className="text-sm text-zinc-200">{content?.reason}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => history.back()}
            className="w-full sm:w-auto px-6 py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Icon icon="solar:arrow-left-linear" width="18" />
            Retourner en arrière
          </button>
          <button
            onClick={openDashboard}
            className="w-full sm:w-auto px-6 py-3 bg-transparent border border-zinc-800 text-zinc-400 text-sm font-medium rounded-lg hover:text-white hover:border-zinc-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Icon icon="solar:settings-linear" width="18" />
            Gérer les règles
          </button>
        </div>

        {/* Citation aléatoire */}
        <div className="mt-16">
          <p className="text-[15px] italic font-serif tracking-wide text-zinc-500">
            "{quote.text}"
          </p>
          {quote.author && (
            <p className="text-xs text-zinc-600 mt-2 not-italic font-sans">— {quote.author}</p>
          )}
        </div>

      </main>
    </div>
  );
}