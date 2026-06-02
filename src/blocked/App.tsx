import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CircleX,
  Clock,
  Globe,
  Hourglass,
  Lock,
  Settings,
  ShieldAlert,
  Sun,
  Text,
  Timer
} from "lucide-react";
import { State } from "@/lib/types";
import { useTranslation } from 'react-i18next'
import { getT } from '@/lib/i18n'
import i18n from '@/lib/i18n';
import logo from '@/assets/blockweb_master_icon.svg'
import "@fontsource/inter/400.css";
import "@fontsource/montserrat/400.css";
import './App.css'

const twh = getT("blocked")

/* =========================================================
   CITATIONS MOTIVATIONNELLES
========================================================= */
const QUOTES = [
  { text: twh("quote_1_desc"), author: twh("quote_1_author") },
  { text: twh("quote_2_desc"), author: twh("quote_2_author") },
  { text: twh("quote_3_desc"), author: twh("quote_3_author") },
  { text: twh("quote_4_desc"), author: twh("quote_4_author") },
  { text: twh("quote_5_desc"), author: twh("quote_5_author") },
  { text: twh("quote_6_desc"), author: twh("quote_6_author") },
  { text: twh("quote_7_desc"), author: twh("quote_7_author") },
  { text: twh("quote_8_desc"), author: twh("quote_8_author") },
  { text: twh("quote_9_desc"), author: twh("quote_9_author") },
  { text: twh("quote_10_desc"), author: twh("quote_10_author") },
];

const randomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

/* =========================================================
   CONTENU SPÉCIFIQUE PAR TYPE DE PROFIL
========================================================= */
type ProfileType = "daily" | "hourly" | "weekly" | "interval";

const PROFILE_CONTENT: Record<ProfileType, {
  icon: React.ReactNode;
  iconColor: string;
  glowColor: string;
  title: string;
  description: (name: string) => string;
  badge: string;
  reason: string;
}> = {
  daily: {
    icon: <Sun className="text-amber-400" width="40" height="40" />,
    iconColor: "text-amber-400",
    glowColor: "bg-amber-500",
    title: twh('dailyTitle'),
    description: (name: string) => twh('dailyDesc', { name }),
    badge: twh('dailyBadge'),
    reason: twh('dailyReason'),
  },
  hourly: {
    icon: <Clock className="text-blue-400" width="40" height="40" />,
    iconColor: "text-blue-400",
    glowColor: "bg-blue-500",
    title: twh('hourlyTitle'),
    description: (name: string) => twh('hourlyDesc', { name }),
    badge: twh('hourlyBadge'),
    reason: twh('hourlyReason'),
  },
  weekly: {
    icon: <CalendarCheck className="text-violet-400" width="40" height="40" />,
    iconColor: "text-violet-400",
    glowColor: "bg-violet-500",
    title: twh('weeklyTitle'),
    description: (name: string) => twh('weeklyDesc', { name }),
    badge: twh('weeklyBadge'),
    reason: twh('weeklyReason'),
  },
  interval: {
    icon: <Calendar className="text-rose-400" width="40" height="40" />,
    iconColor: "text-rose-400",
    glowColor: "bg-rose-500",
    title: twh('intervalTitle'),
    description: (name: string) => twh('intervalDesc', { name }),
    badge: twh('intervalBadge'),
    reason: twh('intervalReason'),
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

  const { t } = useTranslation('blocked')

  useEffect(() => {
    const locale = i18n.language
    if (locale === 'ar') {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = 'ar'
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = locale
    }
  }, [])

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
          profileName: profile?.name ?? t('limiterProfile'),
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
          icon: <ShieldAlert className="text-rose-400" width="40" height="40" />,
          iconColor: "text-rose-400",
          glowColor: "bg-rose-500",
          title: t('adultBlocked'),
          description: t('adultDesc'),
          badge: t('adultBadge'),
          detail: {
            icon: <CircleX width="18" />,
            label: t('adultBlockedSite'),
            value: blockInfo.value,
            mono: true,
          },
          reason: t('adultReason'),
        };
      case "keyword":
        return {
          icon: <Lock className="text-rose-400" width="40" height="40" />,
          iconColor: "text-rose-400",
          glowColor: "bg-rose-500",
          title: t('restrictedAccess'),
          description: t('keywordDesc', { keyword: blockInfo.value }),
          badge: t('keywordBadge'),
          detail: {
            icon: <Text width={18} />,
            label: t('detectedKeyword'),
            value: blockInfo.value,
            mono: true,
          },
          reason: t('keywordReason'),
        };
      case "profile": {
        const profileType = (blockInfo.profileType ?? "daily") as ProfileType;
        const pc = PROFILE_CONTENT[profileType] ?? PROFILE_CONTENT.daily;
        const profileName = blockInfo.profileName ?? t('limiterProfile');
        return {
          icon: pc.icon,
          iconColor: pc.iconColor,
          glowColor: pc.glowColor,
          title: pc.title,
          description: pc.description(profileName),
          badge: pc.badge,
          detail: {
            icon: <Timer width={18} />,
            label: t('activeProfile'),
            value: profileName,
            mono: false,
          },
          reason: pc.reason,
        };
      }
      case "url":
      default:
        return {
          icon: <Lock className="text-rose-400" width="40" height="40" />,
          iconColor: "text-rose-400",
          glowColor: "bg-rose-500",
          title: t('restrictedAccess'),
          description: t('focusDesc'),
          badge: t('focusBadge'),
          detail: blockInfo.value ? {
            icon: <Globe width={18} />,
            label: t('targetDomain'),
            value: blockInfo.value,
            mono: true,
          } : null,
          reason: t('focusMode'),
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
        <div className="flex group items-center gap-2.5 text-white opacity-80 hover:opacity-100 transition-opacity cursor-default">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
            <img src={logo} className="w-7 h-7 object-cover" />
          </div>
          <span className="text-sm font-medium tracking-tight text-white" translate="no" id="logo-text">BlockWeb Master</span>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center">

        {/* Illustration animée */}
        {content && (
          <div className="relative mb-10 flex items-center justify-center">
            <div className={`absolute w-32 h-32 ${content.glowColor} rounded-full blur-[80px] opacity-20 glow-pulse`} />
            <div className="relative w-24 h-24 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center lock-float shadow-2xl shadow-rose-900/10">
              {content.icon}
            </div>
            <div className="absolute -right-4 top-0 bg-zinc-900 border border-zinc-800 py-1.5 px-3 rounded-full flex items-center gap-2 shadow-xl animate-[bounce_5s_infinite]">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs text-zinc-400 font-medium">{content.badge}</span>
            </div>
          </div>
        )}

        {/* Titre */}
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-4">
          {content?.title ?? t('restrictedAccess')}
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-md mx-auto font-light">
          {content?.description}
        </p>

        {/* Carte détails */}
        <div className="w-full bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md mb-10 text-left">
          <div className="border-b border-white/5 px-5 py-3 bg-white/[0.02]">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('securityDetails')}</span>
          </div>
          <div className="p-5 space-y-4">

            {/* Détail principal */}
            {content?.detail && (
              <>
                <div className="flex items-start justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 border border-white/5 group-hover:border-zinc-700 transition-colors">
                      {content.detail.icon}
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">{content.detail.label}</p>
                      <p className={`text-sm text-zinc-200 ${content.detail.mono ? "font-mono tracking-tight" : "font-medium"}`}>
                        {content.detail.value}
                      </p>
                    </div>
                  </div>
                  <CircleX className="text-rose-500/80 mt-2 shrink-0" width="18" />
                </div>
                <div className="w-full h-px bg-white/5" />
              </>
            )}

            {/* Raison */}
            <div className="flex items-start justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 border border-white/5 group-hover:border-zinc-700 transition-colors">
                  <Hourglass width="18" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">{t('blockingReason')}</p>
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
            <ArrowLeft width="18" />
            {t('goBack')}
          </button>
          <button
            onClick={openDashboard}
            className="w-full sm:w-auto px-6 py-3 bg-transparent border border-zinc-800 text-zinc-400 text-sm font-medium rounded-lg hover:text-white hover:border-zinc-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Settings width="18" />
            {t('manageRules')}
          </button>
        </div>

        {/* Citation aléatoire */}
        <div className="mt-16">
          <p className="text-[15px] italic font-serif tracking-wide text-zinc-500">
            "{quote.text}"
          </p>
          {(quote.author && !quote.author.includes("quote")) && (
            <p className="text-xs text-zinc-600 mt-2 not-italic font-sans">— {quote.author}</p>
          )}
        </div>

      </main>
    </div>
  );
}
