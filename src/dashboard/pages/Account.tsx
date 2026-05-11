import { useStateContext } from '@/context/GlobalStateContext'
import { useT, getT } from '@/lib/i18n'
import { Icon } from '@iconify/react'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import felixAvatar from '@/assets/avatars/felix.svg'
import anekaAvatar from '@/assets/avatars/aneka.svg'
import bobAvatar from '@/assets/avatars/bob.svg'
import jackAvatar from '@/assets/avatars/jack.svg'
import mollyAvatar from '@/assets/avatars/molly.svg'
import sarahAvatar from '@/assets/avatars/sarah.svg'

// twh (translator without hook)
// twhc (common translator without hook)
const twhc = getT("common")


/* =========================================================
   GÉNÉRATION DE PHRASE DE CONFIRMATION
   Phrase longue aléatoire que l'utilisateur doit recopier
   manuellement — sans copier-coller possible
========================================================= */
// ═══════════════════════════════════════════════════════════
// POOLS DE MOTS — 14 langues
// Chaque langue a 30 mots répartis sur 5 catégories de 6 mots.
// La phrase générée est construite ligne par ligne, chaque ligne
// étant remplie jusqu'à ~28 chars avant de passer à la suivante.
// Aucun tiret entre les mots — séparateur : espace.
// ═══════════════════════════════════════════════════════════

const WORD_POOLS: Record<string, string[][]> = {
    fr: [
        ['supprimer', 'effacer', 'confirmer', 'valider', 'approuver', 'finaliser'],
        ['définitivement', 'irrévocablement', 'irréversiblement', 'absolument', 'totalement', 'entièrement'],
        ['compte', 'profil', 'accès', 'espace', 'historique', 'session'],
        ['personnel', 'confidentiel', 'sécurisé', 'protégé', 'privé', 'chiffré'],
        ['données', 'informations', 'fichiers', 'archives', 'entrées', 'ressources'],
    ],
    en: [
        ['delete', 'remove', 'confirm', 'validate', 'approve', 'finalize'],
        ['permanently', 'irreversibly', 'completely', 'absolutely', 'entirely', 'definitively'],
        ['account', 'profile', 'access', 'workspace', 'history', 'session'],
        ['personal', 'confidential', 'secured', 'protected', 'private', 'encrypted'],
        ['data', 'information', 'files', 'archives', 'records', 'resources'],
    ],
    es: [
        ['eliminar', 'borrar', 'confirmar', 'validar', 'aprobar', 'finalizar'],
        ['permanentemente', 'irrevocablemente', 'completamente', 'absolutamente', 'definitivamente', 'totalmente'],
        ['cuenta', 'perfil', 'acceso', 'historial', 'espacio', 'sesión'],
        ['personal', 'confidencial', 'protegido', 'seguro', 'privado', 'cifrado'],
        ['datos', 'información', 'archivos', 'registros', 'entradas', 'recursos'],
    ],
    de: [
        ['löschen', 'entfernen', 'bestätigen', 'validieren', 'genehmigen', 'abschließen'],
        ['dauerhaft', 'unwiderruflich', 'vollständig', 'absolut', 'endgültig', 'restlos'],
        ['Konto', 'Profil', 'Zugang', 'Verlauf', 'Sitzung', 'Bereich'],
        ['persönlich', 'vertraulich', 'gesichert', 'geschützt', 'privat', 'verschlüsselt'],
        ['Daten', 'Informationen', 'Dateien', 'Archive', 'Einträge', 'Ressourcen'],
    ],
    it: [
        ['eliminare', 'cancellare', 'confermare', 'validare', 'approvare', 'finalizzare'],
        ['definitivamente', 'irrevocabilmente', 'completamente', 'assolutamente', 'totalmente', 'permanentemente'],
        ['account', 'profilo', 'accesso', 'cronologia', 'spazio', 'sessione'],
        ['personale', 'riservato', 'protetto', 'sicuro', 'privato', 'cifrato'],
        ['dati', 'informazioni', 'file', 'archivi', 'record', 'risorse'],
    ],
    pt: [
        ['excluir', 'apagar', 'confirmar', 'validar', 'aprovar', 'finalizar'],
        ['permanentemente', 'irrevogavelmente', 'completamente', 'absolutamente', 'definitivamente', 'totalmente'],
        ['conta', 'perfil', 'acesso', 'histórico', 'espaço', 'sessão'],
        ['pessoal', 'confidencial', 'protegido', 'seguro', 'privado', 'criptografado'],
        ['dados', 'informações', 'arquivos', 'registros', 'entradas', 'recursos'],
    ],
    nl: [
        ['verwijderen', 'wissen', 'bevestigen', 'valideren', 'goedkeuren', 'voltooien'],
        ['permanent', 'onherroepelijk', 'volledig', 'absoluut', 'definitief', 'totaal'],
        ['account', 'profiel', 'toegang', 'geschiedenis', 'ruimte', 'sessie'],
        ['persoonlijk', 'vertrouwelijk', 'beveiligd', 'beschermd', 'privé', 'versleuteld'],
        ['gegevens', 'informatie', 'bestanden', 'archieven', 'records', 'bronnen'],
    ],
    pl: [
        ['usunąć', 'skasować', 'potwierdzić', 'zatwierdzić', 'zaakceptować', 'zakończyć'],
        ['trwale', 'nieodwracalnie', 'całkowicie', 'absolutnie', 'definitywnie', 'bezpowrotnie'],
        ['konto', 'profil', 'dostęp', 'historia', 'przestrzeń', 'sesja'],
        ['osobiste', 'poufne', 'zabezpieczone', 'chronione', 'prywatne', 'zaszyfrowane'],
        ['dane', 'informacje', 'pliki', 'archiwa', 'rekordy', 'zasoby'],
    ],
    ru: [
        ['удалить', 'стереть', 'подтвердить', 'проверить', 'одобрить', 'завершить'],
        ['навсегда', 'безвозвратно', 'полностью', 'абсолютно', 'окончательно', 'бесповоротно'],
        ['аккаунт', 'профиль', 'доступ', 'история', 'пространство', 'сессия'],
        ['личное', 'конфиденциальное', 'защищённое', 'приватное', 'зашифрованное', 'секретное'],
        ['данные', 'информацию', 'файлы', 'архивы', 'записи', 'ресурсы'],
    ],
    zh: [
        ['删除', '清除', '确认', '验证', '批准', '完成'],
        ['永久地', '不可逆地', '彻底地', '完全地', '最终地', '绝对地'],
        ['账户', '档案', '访问', '历史', '空间', '会话'],
        ['个人的', '机密的', '受保护的', '加密的', '私人的', '安全的'],
        ['数据', '信息', '文件', '档案', '记录', '资源'],
    ],
    ja: [
        ['削除する', '消去する', '確認する', '検証する', '承認する', '完了する'],
        ['永久に', '取り消せない形で', '完全に', '絶対的に', '最終的に', '徹底的に'],
        ['アカウント', 'プロフィール', 'アクセス', '履歴', 'スペース', 'セッション'],
        ['個人的な', '機密の', '保護された', '暗号化された', 'プライベートな', '安全な'],
        ['データ', '情報', 'ファイル', 'アーカイブ', 'レコード', 'リソース'],
    ],
    ko: [
        ['삭제하다', '지우다', '확인하다', '검증하다', '승인하다', '완료하다'],
        ['영구적으로', '되돌릴 수 없게', '완전히', '절대적으로', '최종적으로', '철저히'],
        ['계정', '프로필', '접근', '기록', '공간', '세션'],
        ['개인적인', '기밀의', '보호된', '암호화된', '비공개의', '안전한'],
        ['데이터', '정보', '파일', '아카이브', '레코드', '리소스'],
    ],
    ar: [
        ['حذف', 'مسح', 'تأكيد', 'التحقق', 'الموافقة', 'إنهاء'],
        ['نهائياً', 'بشكل لا رجعة فيه', 'تماماً', 'بشكل مطلق', 'بصفة دائمة', 'كلياً'],
        ['الحساب', 'الملف', 'الوصول', 'السجل', 'المساحة', 'الجلسة'],
        ['الشخصي', 'السري', 'المحمي', 'المشفر', 'الخاص', 'الآمن'],
        ['البيانات', 'المعلومات', 'الملفات', 'الأرشيف', 'السجلات', 'الموارد'],
    ],
    hi: [
        ['हटाना', 'मिटाना', 'पुष्टि करना', 'मान्य करना', 'स्वीकृत करना', 'पूरा करना'],
        ['स्थायी रूप से', 'अपरिवर्तनीय रूप से', 'पूरी तरह से', 'बिल्कुल', 'निश्चित रूप से', 'सम्पूर्ण रूप से'],
        ['खाता', 'प्रोफ़ाइल', 'पहुँच', 'इतिहास', 'स्थान', 'सत्र'],
        ['व्यक्तिगत', 'गोपनीय', 'सुरक्षित', 'एन्क्रिप्टेड', 'निजी', 'संरक्षित'],
        ['डेटा', 'जानकारी', 'फ़ाइलें', 'अभिलेखागार', 'रिकॉर्ड', 'संसाधन'],
    ],
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Génère une phrase de confirmation de 7 lignes.
 * Règles :
 *  - Séparateur entre mots : espace (pas de tiret)
 *  - Chaque ligne est remplie jusqu'à ~28 caractères avant passage à la suivante
 *  - Code aléatoire 8 chiffres sur la dernière ligne pour l'unicité
 *  - 14 langues supportées, fallback sur 'en'
 */
function generateConfirmPhrase(lang: string = 'en'): string {
    const pool = WORD_POOLS[lang] ?? WORD_POOLS['en']

    // Piocher un mot aléatoire dans chaque catégorie (5 catégories)
    // Puis répéter avec variation pour avoir suffisamment de matière
    const rawWords: string[] = []
    // 3 passes sur les 5 catégories = 15 mots maximum
    for (let pass = 0; pass < 3; pass++) {
        for (const cat of pool) {
            rawWords.push(pick(cat))
        }
    }

    // Construire les lignes en remplissant chaque ligne jusqu'à LINE_TARGET chars
    const LINE_TARGET = 28
    const lines: string[] = []
    let current = ''
    let wordIdx = 0

    while (wordIdx < rawWords.length && lines.length < 6) {
        const word = rawWords[wordIdx]
        const next = current.length === 0 ? word : current + ' ' + word

        if (next.length <= LINE_TARGET) {
            current = next
            wordIdx++
        } else {
            // La ligne est assez pleine — on la valide et on passe à la suivante
            if (current.length > 0) {
                lines.push(current)
                current = ''
            } else {
                // Mot seul trop long (CJK, arabe, hindi) — on le force quand même
                lines.push(word)
                wordIdx++
            }
        }
    }

    // Vider ce qui reste dans current
    if (current.length > 0 && lines.length < 6) {
        lines.push(current)
    }

    // Compléter jusqu'à 6 lignes si besoin (ne devrait pas arriver avec 15 mots)
    while (lines.length < 6) {
        lines.push(pick(pool[lines.length % pool.length]))
    }

    // Ligne 7 : code numérique 8 chiffres
    const code = Math.floor(10000000 + Math.random() * 90000000).toString()
    lines.push(code)

    return lines.join('\n')
}

/* Input sans copier-coller */
export const NoPasteInput = ({
    value, onChange, placeholder, autoFocus, className
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    autoFocus?: boolean
    className?: string
}) => (
    <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        className={className}
        onChange={e => onChange(e.target.value)}
        onPaste={e => e.preventDefault()}
        onCopy={e => e.preventDefault()}
        onCut={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
    />
)

/* Textarea sans copier-coller — pour la phrase multi-lignes */
const NoPasteTextarea = ({
    value, onChange, placeholder, autoFocus, rows = 7, className
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    autoFocus?: boolean
    rows?: number
    className?: string
}) => (
    <textarea
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        rows={rows}
        className={className}
        onChange={e => onChange(e.target.value)}
        onPaste={e => e.preventDefault()}
        onCopy={e => e.preventDefault()}
        onCut={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
    />
)


/* =========================================================
   TYPES
========================================================= */
interface SubscriptionRow {
    plan:       string
    is_valid:   boolean
    expires_at: string | null
    updated_at: string
}

type SaveStatus = 'idle' | 'loading' | 'success' | 'error'

/* =========================================================
   HELPERS
========================================================= */
async function sendToBackground<T = { success?: boolean; error?: string }>(
    msg: Record<string, unknown>
): Promise<T> {
    return new Promise((resolve) =>
        chrome.runtime.sendMessage(msg, (r) => resolve(r ?? { error: twhc("backgroundNotReply") }))
    )
}

const PLAN_LABEL: Record<string, string> = {
    FREE:     twhc('free'),
    MONTHLY:  twhc('monthly'),
    YEARLY:   twhc('yearly'),
    LIFETIME: twhc('lifetime'),
}

const PLAN_COLOR: Record<string, string> = {
    FREE:     'text-zinc-400 bg-zinc-800 border-zinc-700',
    MONTHLY:  'text-amber-300 bg-amber-500/10 border-amber-500/30',
    YEARLY:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
    LIFETIME: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

function formatExpiry(ts: number | null): string | null {
    if (!ts) return null
    return new Date(ts).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
    })
}

/* =========================================================
   AVATARS PRÉDÉFINIS
========================================================= */
const AVATARS = [felixAvatar, anekaAvatar, bobAvatar, jackAvatar, mollyAvatar, sarahAvatar]

/* =========================================================
   COMPOSANT
========================================================= */
const Account = () => {
    const t  = useT('account')
    const tc = useT('common')
    const location             = useLocation()
    const { state, avatarUrl } = useStateContext()   // ← source unique de vérité

    /* ── Username ── */
    const [newUsername,   setNewUsername]  = useState('')
    const [userSaveStatus, setUserSave]   = useState<SaveStatus>('idle')
    const [userSaveError,  setUserError]  = useState<string | null>(null)

    /* ── Mot de passe ── */
    const [showPwdForm,  setShowPwdForm]  = useState(false)
    const [currentPwd,   setCurrentPwd]   = useState('')
    const [newPwd,       setNewPwd]       = useState('')
    const [confirmPwd,   setConfirmPwd]   = useState('')
    const [pwdStatus,    setPwdStatus]    = useState<SaveStatus>('idle')
    const [pwdError,     setPwdError]     = useState<string | null>(null)

    /* ── Déconnexion ── */
    const [logoutLoading,  setLogoutLoading]  = useState(false)
    const [logoutStep,     setLogoutStep]     = useState<'idle' | 'confirm' | 'password' | 'phrase'>('idle')
    const [logoutPassword, setLogoutPassword] = useState('')
    const [logoutPhrase,   setLogoutPhrase]   = useState('')
    const [logoutPhraseTarget, setLogoutPhraseTarget] = useState('')
    const [logoutError,    setLogoutError]    = useState<string | null>(null)

    /* ── Suppression (4 étapes) ── */
    const [deleteStep,     setDeleteStep]     = useState<'idle' | 'confirm' | 'password' | 'phrase'>('idle')
    const [deletePassword, setDeletePassword] = useState('')
    const [deletePhrase,   setDeletePhrase]   = useState('')
    const [deletePhraseTarget, setDeletePhraseTarget] = useState('')
    const [deleteLoading,  setDeleteLoading]  = useState(false)
    const [deleteError,    setDeleteError]    = useState<string | null>(null)

    /* ── Historique ── */
    const [history,        setHistory]        = useState<SubscriptionRow[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)

    /* ── Redirection si non connecté ── */
    useEffect(() => {
        // state === null = pas encore chargé → on attend
        // state !== null mais isAuthenticated === false → rediriger
        if (state !== null && !state.auth?.isAuthenticated) {
            window.location.href = chrome.runtime.getURL('src/auth/index.html')
        }
    }, [state])

    /* ── Sync username depuis le contexte ── */
    useEffect(() => {
        if (state?.auth?.userName) setNewUsername(state.auth.userName)
    }, [state?.auth?.userName])

    /* ── Charger l'historique Supabase ── */
    useEffect(() => {
        if (!state?.auth?.isAuthenticated || !state?.auth?.accessToken || !state?.auth?.userId) return
        const load = async () => {
            setHistoryLoading(true)
            try {
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${state.auth.userId}&select=plan,is_valid,expires_at,updated_at&order=updated_at.desc`
                const res = await fetch(url, {
                    headers: {
                        apikey:        import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                        Authorization: `Bearer ${state.auth.accessToken}`,
                    },
                })
                if (res.ok) setHistory(await res.json())
            } catch { /* silencieux */ }
            setHistoryLoading(false)
        }
        load()
    }, [state?.auth?.isAuthenticated])

    /* ── Changer d'avatar ──
       On écrit dans le storage — le contexte met automatiquement
       à jour avatarUrl via son listener onChanged */
    const handleAvatarSelect = async (url: string) => {
        const userId = state?.auth?.userId ?? 'guest'
        await chrome.storage.local.set({ [`bwm_avatar_${userId}`]: url })
    }

    /* ── Modifier le username ── */
    const handleUpdateUsername = async () => {
        const trimmed = newUsername.trim()
        if (!trimmed || trimmed === state?.auth?.userName) return
        setUserSave('loading')
        setUserError(null)
        const res = await sendToBackground<{ success: boolean; error?: string }>({
            type: 'UPDATE_USERNAME', username: trimmed,
        })
        if (res.error) {
            setUserError(res.error)
            setUserSave('error')
        } else {
            setUserSave('success')
            setTimeout(() => setUserSave('idle'), 2500)
        }
    }

    /* ── Changer le mot de passe ── */
    const handleChangePassword = async () => {
        setPwdError(null)
        if (!currentPwd || !newPwd || !confirmPwd) {
            setPwdError(t('fillInputs'))
            setPwdStatus('error')
            return
        }
        if (newPwd !== confirmPwd) {
            setPwdError(t('newPwdsDontMatch'))
            setPwdStatus('error')
            return
        }
        if (newPwd.length < 6) {
            setPwdError(t('pwdLengthRule'))
            setPwdStatus('error')
            return
        }
        setPwdStatus('loading')
        const res = await sendToBackground<{ success: boolean; error?: string }>({
            type: 'UPDATE_PASSWORD', currentPwd, newPwd,
        })
        if (res.error) {
            setPwdError(res.error)
            setPwdStatus('error')
        } else {
            setPwdStatus('success')
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
            setTimeout(() => { setPwdStatus('idle'); setShowPwdForm(false) }, 2000)
        }
    }

    /* ── Déconnexion — 3 étapes : confirm → password → phrase ── */
    const handleLogoutPasswordCheck = async () => {
        if (!logoutPassword.trim()) {
            setLogoutError(t('enterPwd'))
            return
        }
        setLogoutLoading(true)
        setLogoutError(null)
        const res = await sendToBackground<{ success?: boolean; error?: string }>({
            type: 'VERIFY_PASSWORD', password: logoutPassword,
        })
        setLogoutLoading(false)
        if (res.error) {
            setLogoutError(t('incorrectPwd'))
            return
        }
        // Mot de passe OK → générer la phrase et passer à l'étape phrase
        const phrase = generateConfirmPhrase(navigator.language?.slice(0, 2) ?? 'en')
        setLogoutPhraseTarget(phrase)
        setLogoutPhrase('')
        setLogoutStep('phrase')
    }

    const handleLogout = async () => {
        if (logoutPhrase.trim() !== logoutPhraseTarget) {
            setLogoutError(t('phraseIncorrect'))
            return
        }
        setLogoutLoading(true)
        await sendToBackground({ type: 'SIGN_OUT' })
        window.location.href = chrome.runtime.getURL('src/auth/index.html')
    }

    /* ── Suppression — étape password ── */
    const handleDeletePasswordCheck = async () => {
        if (!deletePassword.trim()) {
            setDeleteError(t('enterPwd'))
            return
        }
        setDeleteLoading(true)
        setDeleteError(null)
        const res = await sendToBackground<{ success?: boolean; error?: string }>({
            type: 'VERIFY_PASSWORD', password: deletePassword,
        })
        setDeleteLoading(false)
        if (res.error) {
            setDeleteError(t('incorrectPwd'))
            return
        }
        // Mot de passe OK → générer la phrase
        const phrase = generateConfirmPhrase(navigator.language?.slice(0, 2) ?? 'en')
        setDeletePhraseTarget(phrase)
        setDeletePhrase('')
        setDeleteStep('phrase')
    }

    /* ── Suppression — étape phrase ── */
    const handleDeleteAccount = async () => {
        if (deletePhrase.trim() !== deletePhraseTarget) {
            setDeleteError(t('phraseIncorrect'))
            return
        }
        setDeleteLoading(true)
        setDeleteError(null)
        const res = await sendToBackground<{ success?: boolean; error?: string }>({
            type: 'DELETE_ACCOUNT', password: deletePassword,
        })
        if (res.error) {
            setDeleteError(res.error)
            setDeleteLoading(false)
        } else {
            window.location.href = chrome.runtime.getURL('src/auth/index.html')
        }
    }

    const plan     = state?.subscription?.plan ?? 'FREE'
    const isActive = location.pathname === '/account'

    return (
        <div id="tab-account" className={`tab-pane ${isActive && 'active'} max-w-xl mx-auto`}>

            {/* ── En-tête profil ── */}
            <div className="text-center mb-8">
                <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="w-full h-full rounded-full bg-zinc-900 border border-zinc-700 overflow-hidden shadow-2xl flex items-center justify-center">
                        {avatarUrl
                            ? <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                            : <Icon icon="solar:user-circle-bold" className="text-zinc-500 text-4xl" />
                        }
                    </div>
                    <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${PLAN_COLOR[plan] ?? PLAN_COLOR.FREE}`}>
                        {PLAN_LABEL[plan] ?? plan}
                    </span>
                </div>
                <h2 className="text-base font-semibold text-white mt-3">
                    {state?.auth?.userName ?? t('user')}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">{state?.auth?.email ?? '—'}</p>
                {state?.isPremium && state.subscription?.expiresAt && plan !== 'LIFETIME' && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                        {t('expiresAt')} <span className="text-zinc-400">{formatExpiry(state.subscription.expiresAt)}</span>
                    </p>
                )}
                {plan === 'LIFETIME' && (
                    <p className="text-[10px] text-emerald-600 mt-1">{t('lifetimeAccess')}</p>
                )}
            </div>

            <div className="space-y-4">

                {/* ── Avatar ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t('avatar')}</p>
                    <div className="grid grid-cols-6 gap-2">
                        {AVATARS.map(url => (
                            <button
                                key={url}
                                onClick={() => handleAvatarSelect(url)}
                                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                                    avatarUrl === url
                                        ? 'border-white scale-110 shadow-lg shadow-white/10'
                                        : 'border-zinc-700 hover:border-zinc-500'
                                }`}
                            >
                                <img src={url} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Nom d'utilisateur ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t('username')}</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateUsername()}
                            placeholder={t('yourUsername')}
                            className="flex-1 bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                        />
                        <button
                            onClick={handleUpdateUsername}
                            disabled={userSaveStatus === 'loading' || !newUsername.trim() || newUsername.trim() === state?.auth?.userName}
                            className="px-4 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                        >
                            {userSaveStatus === 'loading'
                                ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                : userSaveStatus === 'success'
                                    ? <><Icon icon="solar:check-circle-linear" width="12" className="text-emerald-600" /> {tc('saved')}</>
                                    : tc('edit')
                            }
                        </button>
                    </div>
                    {userSaveStatus === 'error' && userSaveError && (
                        <p className="text-[10px] text-rose-400 flex items-center gap-1">
                            <Icon icon="solar:danger-circle-linear" width="11" /> {userSaveError}
                        </p>
                    )}
                </div>

                {/* ── Mot de passe ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Mot de passe</p>
                        <button
                            onClick={() => { setShowPwdForm(v => !v); setPwdStatus('idle'); setPwdError(null) }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            {showPwdForm ? tc('cancel') : tc('edit')}
                        </button>
                    </div>

                    {!showPwdForm && <p className="text-xs text-zinc-600">••••••••</p>}

                    {showPwdForm && (
                        <div className="space-y-2">
                            <div className="relative group">
                                <Icon icon="solar:lock-password-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={currentPwd}
                                    onChange={e => setCurrentPwd(e.target.value)}
                                    placeholder={t('currentPwd')}
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="relative group">
                                <Icon icon="solar:lock-keyhole-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={newPwd}
                                    onChange={e => setNewPwd(e.target.value)}
                                    placeholder={t('newPwd')}
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="relative group">
                                <Icon icon="solar:lock-keyhole-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={confirmPwd}
                                    onChange={e => setConfirmPwd(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                                    placeholder={t('confirmNewPwd')}
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            {pwdStatus === 'error' && pwdError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                    <Icon icon="solar:danger-circle-linear" width="11" /> {pwdError}
                                </p>
                            )}
                            <button
                                onClick={handleChangePassword}
                                disabled={pwdStatus === 'loading' || pwdStatus === 'success'}
                                className="w-full py-2 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-1"
                            >
                                {pwdStatus === 'loading'
                                    ? <><Icon icon="svg-spinners:ring-resize" width="12" /> {t('updating')}</>
                                    : pwdStatus === 'success'
                                        ? <><Icon icon="solar:check-circle-linear" width="12" className="text-emerald-600" /> {t('passwordSuccess')}</>
                                        : t('updatePwd')
                                }
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Actions compte ── */}
                <div className="flex flex-col gap-2 pt-2">

                    {/* ── Déconnexion — protégée par mot de passe ── */}
                    {logoutStep === 'idle' && (
                        <button
                            onClick={() => setLogoutStep('confirm')}
                            className="w-full py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:logout-linear" width="14" />
                            {t('signOut')}
                        </button>
                    )}

                    {logoutStep === 'confirm' && (
                        <div className="space-y-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                            <div className="flex items-start gap-2">
                                <Icon icon="solar:danger-triangle-linear" className="text-amber-400 shrink-0 mt-0.5" width="14" />
                                <p className="text-xs text-amber-300/80">
                                    {t('confirmSignOut')}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLogoutStep('idle'); setLogoutError(null) }}
                                    className="flex-1 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={() => setLogoutStep('password')}
                                    className="flex-1 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg border border-zinc-600 transition-colors"
                                >
                                    {tc('continue')}
                                </button>
                            </div>
                        </div>
                    )}

                    {logoutStep === 'password' && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-zinc-500">{t('enterPwdToLogout')}</p>
                            <input
                                type="password"
                                value={logoutPassword}
                                onChange={e => { setLogoutPassword(e.target.value); setLogoutError(null) }}
                                onKeyDown={e => e.key === 'Enter' && handleLogoutPasswordCheck()}
                                placeholder={t('yourPwd')}
                                autoFocus
                                className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                            />
                            {logoutError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1.5">
                                    <Icon icon="solar:danger-circle-linear" width="11" />
                                    {logoutError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLogoutStep('idle'); setLogoutPassword(''); setLogoutError(null) }}
                                    className="flex-1 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={handleLogoutPasswordCheck}
                                    disabled={logoutLoading}
                                    className="flex-1 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-lg border border-zinc-600 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {logoutLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : tc('continue')
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Déconnexion — étape 3 : phrase de confirmation ── */}
                    {logoutStep === 'phrase' && (
                        <div className="space-y-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-amber-300">{t('typePhrase')}</p>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">{t('typePhraseDesc')}</p>
                                {/* Phrase à recopier — sélectionnable mais non copiable via l'UI */}
                                <div
                                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 font-mono text-[11px] text-amber-300 tracking-wide select-text"
                                    onCopy={e => e.preventDefault()}
                                >
                                    {logoutPhraseTarget}
                                </div>
                            </div>
                            <NoPasteTextarea
                                value={logoutPhrase}
                                onChange={v => { setLogoutPhrase(v); setLogoutError(null) }}
                                placeholder={t('typeHere')}
                                autoFocus
                                rows={7}
                                className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600 font-mono resize-none leading-relaxed"
                            />
                            {/* Indicateur de progression */}
                            {logoutPhrase.length > 0 && (
                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            logoutPhrase === logoutPhraseTarget ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${Math.min(100, (logoutPhrase.length / logoutPhraseTarget.length) * 100)}%` }}
                                    />
                                </div>
                            )}
                            {logoutError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1.5">
                                    <Icon icon="solar:danger-circle-linear" width="11" />
                                    {logoutError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLogoutStep('idle'); setLogoutPassword(''); setLogoutPhrase(''); setLogoutError(null) }}
                                    className="flex-1 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={logoutLoading || logoutPhrase !== logoutPhraseTarget}
                                    className="flex-1 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 rounded-lg border border-zinc-600 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {logoutLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : <Icon icon="solar:logout-linear" width="12" />
                                    }
                                    {t('logOut')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Suppression — étape 0 : bouton initial ── */}
                    {deleteStep === 'idle' && (
                        <button
                            onClick={() => setDeleteStep('confirm')}
                            className="w-full py-2.5 rounded-lg border border-rose-900/30 text-rose-500 hover:bg-rose-950/30 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:trash-bin-trash-linear" width="14" />
                            {t('deleteMyAccount')}
                        </button>
                    )}

                    {/* ── Suppression — étape 1 : avertissement détaillé ── */}
                    {deleteStep === 'confirm' && (
                        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 space-y-3">
                            <div className="flex items-start gap-2">
                                <Icon icon="solar:danger-triangle-linear" className="text-rose-400 shrink-0 mt-0.5" width="16" />
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold text-rose-300">{t('permanentDeletion')}</p>
                                    <p className="text-[10px] text-rose-400/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('deleteDesc')  }} />
                                    <ul className="text-[10px] text-rose-400/70 space-y-0.5">
                                        <li>{t('yourIds')}</li>
                                        <li>{t('yourSubandHist')}</li>
                                        <li>{t('yourData')}</li>
                                    </ul>
                                    <p className="text-[10px] text-zinc-600 mt-1">
                                        {t('blockRulesDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDeleteStep('idle')}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={() => setDeleteStep('password')}
                                    className="flex-1 py-2 rounded-lg bg-rose-900/50 hover:bg-rose-800/60 border border-rose-700/50 text-rose-300 text-xs font-medium transition-colors"
                                >
                                    {tc('continue')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Suppression — étape 2 : saisie du mot de passe ── */}
                    {deleteStep === 'password' && (
                        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 space-y-3">
                            <p className="text-[11px] text-rose-300 font-medium">{t('confirmId')}</p>
                            <p className="text-[10px] text-rose-400/70">{t('enterPwdForDeletion')}</p>
                            <div className="relative group">
                                <Icon icon="solar:lock-password-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-rose-400 transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={e => { setDeletePassword(e.target.value); setDeleteError(null) }}
                                    onKeyDown={e => e.key === 'Enter' && handleDeletePasswordCheck()}
                                    placeholder={t('yourPwd')}
                                    autoFocus
                                    className="w-full bg-black border border-rose-900/40 focus:border-rose-700/60 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            {deleteError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                    <Icon icon="solar:danger-circle-linear" width="11" /> {deleteError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setDeleteStep('idle'); setDeletePassword(''); setDeleteError(null) }}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={handleDeletePasswordCheck}
                                    disabled={deleteLoading || !deletePassword.trim()}
                                    className="flex-1 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800/70 border border-rose-700/50 text-rose-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {deleteLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : tc('continue')
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Suppression — étape 3 : phrase de confirmation ── */}
                    {deleteStep === 'phrase' && (
                        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 space-y-3">
                            <div className="space-y-1.5">
                                <p className="text-[11px] text-rose-300 font-semibold">{t('typePhrase')}</p>
                                <p className="text-[10px] text-rose-400/70 leading-relaxed">{t('typePhraseDescDelete')}</p>
                                {/* Phrase à recopier */}
                                <div
                                    className="px-3 py-2 rounded-lg bg-black/60 border border-rose-900/40 font-mono text-[11px] text-rose-300 tracking-wide select-text"
                                    onCopy={e => e.preventDefault()}
                                >
                                    {deletePhraseTarget}
                                </div>
                            </div>
                            <NoPasteTextarea
                                value={deletePhrase}
                                onChange={v => { setDeletePhrase(v); setDeleteError(null) }}
                                placeholder={t('typeHere')}
                                autoFocus
                                rows={7}
                                className="w-full bg-black border border-rose-900/40 focus:border-rose-700/60 text-white text-xs rounded-lg px-3 py-2.5 outline-none transition-colors placeholder:text-zinc-600 font-mono resize-none leading-relaxed"
                            />
                            {/* Indicateur de progression */}
                            {deletePhrase.length > 0 && (
                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            deletePhrase === deletePhraseTarget ? 'bg-emerald-500' : 'bg-rose-600'
                                        }`}
                                        style={{ width: `${Math.min(100, (deletePhrase.length / deletePhraseTarget.length) * 100)}%` }}
                                    />
                                </div>
                            )}
                            {deleteError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                    <Icon icon="solar:danger-circle-linear" width="11" /> {deleteError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setDeleteStep('idle'); setDeletePassword(''); setDeletePhrase(''); setDeleteError(null) }}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading || deletePhrase !== deletePhraseTarget}
                                    className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                                >
                                    {deleteLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : t('permanentDelete')
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Historique des abonnements ── */}
            <div className="border-t border-white/5 mt-8 pt-8">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Icon icon="solar:bill-list-linear" className="text-zinc-500" />
                    {t('subHistory')}
                </h3>
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-zinc-500 text-xs">
                            <Icon icon="svg-spinners:ring-resize" width="14" /> {tc('loading')}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Icon icon="solar:bill-list-linear" className="text-zinc-700 text-2xl" />
                            <p className="text-xs text-zinc-600">{t('noSubSaved')}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-900 text-[10px] text-zinc-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 font-medium">{t('plan')}</th>
                                    <th className="px-4 py-3 font-medium">{t('status')}</th>
                                    <th className="px-4 py-3 font-medium">{t('expiration')}</th>
                                    <th className="px-4 py-3 font-medium text-right">{t('update')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 bg-black text-xs text-zinc-400">
                                {history.map((row, i) => (
                                    <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLOR[row.plan] ?? PLAN_COLOR.FREE}`}>
                                                {PLAN_LABEL[row.plan] ?? row.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] ${row.is_valid ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                {row.is_valid ? `● ${t('active')}` : `○ ${t('expired')}`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.expires_at ? formatDate(row.expires_at) : <span className="text-zinc-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-600">
                                            {formatDate(row.updated_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Account