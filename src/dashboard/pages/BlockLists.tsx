import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { isValidUrl, sendToBackground } from '@/lib/utils';
import { LIMITS } from '@/lib/constants';
import { useStateContext } from '@/context/GlobalStateContext';
import { useT } from '@/lib/i18n';
import { toast } from "sonner"
import { ArrowDown, Ban, BanIcon, CircleCheck, CirclePlus, FileType, Globe, Hash, Info, Link, LockKeyhole, Trash2 } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import globeIcon from '@/assets/globe.svg';

const PREVIEW_COUNT = 5
/* =========================================================
   CollapsibleList — liste avec expansion animée
   ─────────────────────────────────────────────────────────
   Affiche les N premiers éléments + un bouton animé qui
   révèle le reste avec une transition max-height fluide.
   Le compteur "+N" reste visible quand la liste est réduite.
========================================================= */
interface CollapsibleListProps {
    children: React.ReactNode[]   // items rendus
    total:    number               // nombre total d'éléments
}

const CollapsibleList: React.FC<CollapsibleListProps> = ({ children }) => {
    const [expanded, setExpanded]   = useState(false)
    const extraRef                  = useRef<HTMLDivElement>(null)
    const [extraH, setExtraH]       = useState(0)

    const preview  = children.slice(0, PREVIEW_COUNT)
    const extra    = children.slice(PREVIEW_COUNT)
    const hasExtra = extra.length > 0
    const t = useT('blockLists')

    // Mesure la hauteur réelle des éléments cachés pour l'animation
    useEffect(() => {
        if (extraRef.current) {
            setExtraH(extraRef.current.scrollHeight)
        }
    }, [extra.length])

    return (
        <div className="space-y-1.5">
            {/* Éléments toujours visibles */}
            {preview}

            {/* Éléments cachés — animés par max-height */}
            {hasExtra && (
                <div
                    ref={extraRef}
                    style={{
                        maxHeight:  expanded ? `${extraH}px` : '0px',
                        overflow:   'hidden',
                        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
                    }}
                    className="space-y-1.5"
                >
                    {extra}
                </div>
            )}

            {/* Bouton expand/collapse */}
            {hasExtra && (
                <button
                    type="button"
                    onClick={() => setExpanded(v => !v)}
                    className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-lg border border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all group"
                >
                    {!expanded && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 rounded-md text-[10px] font-semibold text-zinc-400 group-hover:text-white transition-colors">
                            +{extra.length}
                        </span>
                    )}
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        {expanded ? t('showLess') : t('seeMore', extra.length)}
                    </span>
                    <ArrowDown
                        width="12"
                        className={`text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 ${expanded ? 'rotate-180' : ''}`}
                    />
                </button>
            )}
        </div>
    )
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const BlockLists: React.FC = () => {
    const t  = useT('blockLists')
    const tc = useT('common')
    const navigate = useNavigate()
    const { state } = useStateContext()

    // useRef pour les inputs — évite que le re-render du contexte
    // (déclenché par chaque changement de storage) ne détruise le focus
    const domainRef  = useRef<HTMLInputElement>(null)
    const keywordRef = useRef<HTMLInputElement>(null)
    const whiteRef   = useRef<HTMLInputElement>(null)
    const customRef  = useRef<HTMLInputElement>(null)

    /* ── Actions ── */
    const addDomain = useCallback(async () => {
        const val = domainRef.current?.value.trim()
        if (!val) return
        await sendToBackground({ type: 'ADD_DOMAIN', domain: val })
        if (domainRef.current) domainRef.current.value = ''
    }, [])

    const addKeyword = useCallback(async () => {
        const val = keywordRef.current?.value.trim()
        if (!val) return
        await sendToBackground({ type: 'ADD_KEYWORD', keyword: val })
        if (keywordRef.current) keywordRef.current.value = ''
    }, [])

    const addWhite = useCallback(async () => {
        const val = whiteRef.current?.value.trim()
        if (!val) return
        await sendToBackground({ type: 'ADD_WHITE', white: val })
        if (whiteRef.current) whiteRef.current.value = ''
    }, [])

    const saveCustomUrl = useCallback(async () => {
        const val = customRef.current?.value ?? ''
        if (!isValidUrl(val)) {
            toast.error(t('invalidUrl'))
            return
        }
        const res = await sendToBackground({ type: 'SET_CUSTOM_URL', customRedirectUrl: val })
        if (res.success) toast.success(t('updatedRedirect'))
        else             toast.error(tc('error'))
    }, [])

    /* ── Limites ── */
    const domains         = state?.activeBlockedDomains  ?? []
    const keywords        = state?.activeBlockedKeywords ?? []
    const whitelist       = state?.whitelist             ?? []
    const frozenDomains   = state?.frozenBlockedDomains  ?? []
    const frozenKeywords  = state?.frozenBlockedKeywords ?? []
    const isPremium       = state?.isPremium             ?? false
    const isStrict        = !!state?.strictModeUntil

    const domainLimit     = isPremium ? Infinity : LIMITS.FREE.domains
    const keywordLimit    = isPremium ? Infinity : LIMITS.FREE.keywords
    const domainFull      = !isPremium && domains.length  >= LIMITS.FREE.domains
    const keywordFull     = !isPremium && keywords.length >= LIMITS.FREE.keywords

    // En mode strict : ADD_WHITE bloqué, REMOVE_WHITE autorisé
    const whiteAddDisabled = isStrict || !isPremium

    const checkPremium = () => {
        if (!isPremium) navigate('/pricing')
    }

    /* ── Rendu d'un item domaine actif ── */
    const renderDomain = (domain: string, idx: number) => (
        <li key={`${domain}_${idx}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2.5">
                <SmartImage
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    fallbackSrc={globeIcon}
                    className="w-4 h-4 opacity-60"
                />
                <span className="text-xs text-zinc-300 font-normal">{domain}</span>
            </div>
            <button
                disabled={isStrict}
                onClick={() => sendToBackground({ type: 'REMOVE_DOMAIN', domain })}
                className="text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all disabled:cursor-not-allowed"
            >
                <Trash2 width="14" />
            </button>
        </li>
    )

    /* ── Rendu d'un item domaine frozen (flou, non interactif) ── */
    const renderFrozenDomain = (domain: string, idx: number) => (
        <li key={`frozen_${domain}_${idx}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 blur-[1.5px] pointer-events-none select-none opacity-60">
            <div className="flex items-center gap-2.5">
                <SmartImage 
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    fallbackSrc={globeIcon}
                    className="w-4 h-4 opacity-40" 
                />
                <span className="text-xs text-zinc-500">{domain}</span>
            </div>
            <LockKeyhole className="text-amber-500/60" width="13" />
        </li>
    )

    /* ── Rendu d'un item mot-clé actif ── */
    const renderKeyword = (keyword: string, idx: number) => (
        <li key={`${keyword}_${idx}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2.5">
                <span className="text-zinc-600 font-mono text-xs">#</span>
                <span className="text-xs text-zinc-300">{keyword}</span>
            </div>
            <button
                disabled={isStrict}
                onClick={() => sendToBackground({ type: 'REMOVE_KEYWORD', keyword })}
                className="text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all disabled:cursor-not-allowed"
            >
                <Trash2 width="14" />
            </button>
        </li>
    )

    /* ── Rendu d'un item mot-clé frozen ── */
    const renderFrozenKeyword = (keyword: string, idx: number) => (
        <li key={`frozen_${keyword}_${idx}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 blur-[1.5px] pointer-events-none select-none opacity-60">
            <div className="flex items-center gap-2.5">
                <span className="text-zinc-600/50 font-mono text-xs">#</span>
                <span className="text-xs text-zinc-500">{keyword}</span>
            </div>
            <LockKeyhole className="text-amber-500/60" width="13" />
        </li>
    )

    /* ── Rendu d'un item whitelist ── */
    const renderWhite = (w: string, realIdx: number) => (
        <li key={`${w}_${realIdx}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2.5">
                <SmartImage 
                    src={`https://www.google.com/s2/favicons?domain=${w}&sz=32`}
                    fallbackSrc={globeIcon}
                    className="w-4 h-4 opacity-60" 
                />
                <span className="text-xs text-zinc-300">{w}</span>
            </div>
            <button
                onClick={() => sendToBackground({ type: 'REMOVE_WHITE', index: realIdx })}
                className="text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
            >
                <Trash2 width="14" />
            </button>
        </li>
    )

    /* ── Compteur et badge limite — taille augmentée ── */
    const LimitBadge = ({ count, max, frozen = 0 }: { count: number; max: number; frozen?: number }) => {
        const full = max !== Infinity && count >= max
        return (
            <div className="flex items-center gap-2">
                {frozen > 0 && (
                    <span className="text-sm text-amber-400/70 font-semibold flex items-center gap-1.5">
                        <LockKeyhole width="14" />
                        {frozen} {t('frozen')}
                    </span>
                )}
                <span className={`text-base font-bold px-2.5 py-0.5 rounded-md ${
                    full
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : max === Infinity
                            ? 'text-zinc-400'
                            : 'text-zinc-300 bg-zinc-800 border border-zinc-700'
                }`}>
                    {count}{max !== Infinity ? `/${max}` : ''}
                </span>
            </div>
        )
    }

    /* ── Section vide ── */
    const EmptyState = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
        <li className="flex flex-col items-center justify-center py-8 gap-2 border border-dashed border-zinc-800 rounded-lg">
            {icon}
            <span className="text-xs text-zinc-600">{label}</span>
        </li>
    )

    /* ── Input commun ── */
    // Input non-contrôlé (ref) — le composant ne re-render pas quand l'utilisateur tape,
    // ce qui préserve le focus même si le parent re-render à cause du contexte global
    const ListInput = ({
        inputRef, onAdd, placeholder, disabled
    }: {
        inputRef:    React.RefObject<HTMLInputElement>
        onAdd:       () => void
        placeholder: string
        disabled?:   boolean
    }) => (
        <div className="flex gap-2 mb-3">
            <input
                ref={inputRef}
                type="text"
                defaultValue=""
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1 disabled:opacity-40 disabled:cursor-not-allowed bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
            />
            <button
                type="button"
                onClick={onAdd}
                disabled={disabled}
                className="px-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg border border-zinc-700 transition-colors"
            >
                <CirclePlus width="16" />
            </button>
        </div>
    )

    return (
        <div id="tab-lists" className="space-y-8 max-w-3xl mx-auto">

            {/* ── Section 1 : Contenu adulte ── */}
            <section className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <BanIcon fill="#E63B4F" stroke="#000" /*className="text-rose-500"*/ width="20" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                {t('adultBlocking')}
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold">PRO</span>
                            </h3>
                            <p className="text-xs text-zinc-500 mt-0.5">{t('adultDesc')}</p>
                        </div>
                    </div>
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            id="adult-toggle"
                            checked={state?.adultContentBlocked ?? false}
                            disabled={!isPremium || (isStrict && (state?.adultContentBlocked ?? false))}
                            onChange={() => sendToBackground({ type: 'TOGGLE_ADULT_CONTENT' })}
                            className={`toggle-checkbox absolute ${state?.adultContentBlocked ? 'right-0' : 'left-0'} block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-zinc-700 transition-all duration-300 z-5`}
                        />
                        <label htmlFor="adult-toggle" className="toggle-label block overflow-hidden h-5 w-10 rounded-full bg-zinc-800 cursor-pointer border border-zinc-700" />
                        {!isPremium && (
                            <div onClick={checkPremium} className="absolute inset-0 z-30 cursor-pointer" />
                        )}
                    </div>
                </div>
            </section>

            {/* ── Section 2 : Domaines bloqués ── */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <Ban width="16" className="text-rose-500" />
                        {t('blockedDomains')}
                    </h3>
                    <LimitBadge count={domains.length} max={domainLimit} frozen={frozenDomains.length} />
                </div>

                {domainFull && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Info className="text-amber-500 shrink-0" width="15" />
                        <p className="text-xs text-amber-300 flex-1">
                            {t('limitReached')} ({LIMITS.FREE.domains}/{LIMITS.FREE.domains}).
                        </p>
                        <button onClick={() => navigate('/pricing')}
                            className="text-[10px] font-bold text-black bg-amber-500 hover:bg-amber-400 px-2 py-1 rounded transition-colors shrink-0">{tc('upgrade')}</button>
                    </div>
                )}

                <ListInput
                // @ts-ignore
                    inputRef={domainRef}
                    onAdd={addDomain}
                    placeholder={domainFull ? t('limitReached') : t('domainPlaceholder')}
                    disabled={domainFull}
                />

                {domains.length === 0 && frozenDomains.length === 0 ? (
                    <ul><EmptyState icon={<Globe width="28" className="text-zinc-700" />} label={t('noDomain')} /></ul>
                ) : (
                    <ul className="space-y-0">
                        <CollapsibleList total={domains.length + frozenDomains.length}>
                            {[
                                ...domains.map((d, i) => renderDomain(d, i)),
                                ...frozenDomains.map((d, i) => renderFrozenDomain(d, i)),
                            ]}
                        </CollapsibleList>
                    </ul>
                )}
                {frozenDomains.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                        <Info className="text-amber-400 shrink-0" width="13" />
                        <p className="text-xs text-amber-300/80 flex-1">
                            {frozenDomains.length} {t('domain',frozenDomains.length)} {t('frozen') + ' — ' + t('upgradePremiumToActivate')}
                        </p>
                        <button onClick={() => navigate('/pricing')}
                            className="text-[10px] font-bold text-black bg-amber-500 hover:bg-amber-400 px-2 py-1 rounded transition-colors shrink-0">{tc('upgrade')}</button>
                    </div>
                )}
            </section>

            {/* ── Section 3 : Mots-clés bloqués ── */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <FileType className="text-orange-500" width="16" />
                        {t('blockedKeywords')}
                    </h3>
                    <LimitBadge count={keywords.length} max={keywordLimit} frozen={frozenKeywords.length} />
                </div>

                {keywordFull && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Info className="text-amber-500 shrink-0" width="15" />
                        <p className="text-xs text-amber-300 flex-1">
                            {t('limitReached')} ({LIMITS.FREE.keywords}/{LIMITS.FREE.keywords}).
                        </p>
                        <button onClick={() => navigate('/pricing')}
                            className="text-[10px] font-bold text-black bg-amber-500 hover:bg-amber-400 px-2 py-1 rounded transition-colors shrink-0">{tc('upgrade')}</button>
                    </div>
                )}

                <ListInput
                // @ts-ignore
                    inputRef={keywordRef}
                    onAdd={addKeyword}
                    placeholder={keywordFull ? t('limitReached') : t('keywordPlaceholder')}
                    disabled={keywordFull}
                />

                {keywords.length === 0 && frozenKeywords.length === 0 ? (
                    <ul><EmptyState icon={<Hash width="28" className="text-zinc-700" />} label={t('noKeyword')} /></ul>
                ) : (
                    <ul className="space-y-0">
                        <CollapsibleList total={keywords.length + frozenKeywords.length}>
                            {[
                                ...keywords.map((k, i) => renderKeyword(k, i)),
                                ...frozenKeywords.map((k, i) => renderFrozenKeyword(k, i)),
                            ]}
                        </CollapsibleList>
                    </ul>
                )}
                {frozenKeywords.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                        <Info className="text-amber-400 shrink-0" width="13" />
                        <p className="text-xs text-amber-300/80 flex-1">
                            {frozenKeywords.length} {t('keyword', frozenKeywords.length)} {t('frozen') + ' — ' + t('upgradePremiumToActivate')}
                        </p>
                        <button onClick={() => navigate('/pricing')}
                            className="text-[10px] font-bold text-black bg-amber-500 hover:bg-amber-400 px-2 py-1 rounded transition-colors shrink-0">{tc('upgrade')}</button>
                    </div>
                )}
            </section>

            {/* ── Section 4 : URL de redirection (Premium) ── */}
            <section className="space-y-3 relative">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Link className="text-blue-500" width="16" />
                    {t('customRedirect')}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold">{tc('pro')}</span>
                    {!isPremium && <LockKeyhole className="text-amber-500 ml-auto" width="14" />}
                </h3>

                <div className={`${!isPremium ? 'opacity-30 pointer-events-none blur-[1px]' : ''} transition-all`}>
                    <div className="flex gap-2">
                        <input
                            ref={customRef}
                            type="text"
                            defaultValue={state?.customRedirectUrl ?? ''}
                            placeholder={t('redirectPlaceholder')}
                            className="flex-1 bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                        />
                        <button onClick={saveCustomUrl}
                            className="px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg border border-zinc-700 transition-colors">{tc('save')}</button>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1.5">{t('redirectDesc')}</p>
                </div>

                {!isPremium && (
                    <div className="absolute inset-0 top-8 z-10 flex items-center justify-center">
                        <button onClick={checkPremium}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-colors">{tc('upgrade')}</button>
                    </div>
                )}
            </section>

            {/* ── Section 5 : Whitelist (Premium) ── */}
            <section className="space-y-3 relative">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <CircleCheck className="text-emerald-500" width="16" />
                    {t('whitelist')}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold">{tc('pro')}</span>
                    {!isPremium && <LockKeyhole className="text-amber-500 ml-auto" width="14" />}
                </h3>

                <div className={`${!isPremium ? 'opacity-30 pointer-events-none blur-[1px]' : ''} transition-all`}>
                    <ListInput
                        // @ts-ignore   
                        inputRef={whiteRef}
                        onAdd={addWhite}
                        placeholder={isStrict ? t('strictBlocked') : t('whitePlaceholder')}
                        disabled={whiteAddDisabled}
                    />

                    {isPremium ? (
                        whitelist.length === 0 ? (
                            <ul><EmptyState icon={<Globe width="28" className="text-zinc-700" />} label={t('noWhite')} /></ul>
                        ) : (
                            <ul className="space-y-0">
                                <CollapsibleList total={whitelist.length}>
                                    {/* On passe l'index réel (i) au handler, pas l'index de la liste slicée */}
                                    {whitelist.map((w, i) => renderWhite(w, i))}
                                </CollapsibleList>
                            </ul>
                        )
                    ) : (
                        <ul className="space-y-1.5">
                            <li className="h-9 bg-zinc-900/50 rounded-lg border border-zinc-800" />
                            <li className="h-9 bg-zinc-900/50 rounded-lg border border-zinc-800" />
                        </ul>
                    )}
                </div>

                {!isPremium && (
                    <div className="absolute inset-0 top-8 z-10 flex items-center justify-center">
                        <button onClick={checkPremium}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-colors">{tc('upgrade')}</button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default memo(BlockLists)