import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Sparkles } from 'lucide-react'

const CURRENT_VERSION = chrome.runtime.getManifest().version

export default function WhatsNewBanner() {
    const { t } = useTranslation('whatsNew')
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // @ts-ignore
        chrome.storage.local.get('pendingWhatsNew', (res: any) => {
            if (res.pendingWhatsNew === CURRENT_VERSION) setVisible(true)
        })
    }, [])

    const dismiss = () => {
        setVisible(false)
        // @ts-ignore
        chrome.storage.local.remove('pendingWhatsNew')
        // @ts-ignore
        chrome.storage.local.set({ whatsNewAcked: CURRENT_VERSION })
        chrome.action.setBadgeText({ text: '' })
    }

    if (!visible) return null

    return (
        <div
            className="mx-8 mt-6 flex items-start gap-4 rounded-xl px-5 py-4"
            style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(160,110,8,0.10) 50%, rgba(212,175,55,0.15) 100%)',
                border: '1px solid rgba(200,150,12,0.38)',
            }}
        >
            {/* Icône dorée */}
            <Sparkles
                className="mt-0.5 shrink-0"
                size={17}
                style={{ color: '#d4af37' }}
            />

            <div className="flex-1 min-w-0">
                {/* Label version — argenté */}
                <p
                    className="font-semibold uppercase tracking-wider mb-1"
                    style={{ fontSize: '10.5px', color: '#a8afc4' }}
                >
                    {t('title')}
                </p>
                {/* Titre principal — blanc pur */}
                <p
                    className="font-medium leading-snug"
                    style={{ fontSize: '12.5px', color: '#ffffff' }}
                >
                    {t('adultFreeTitle')}
                </p>
                {/* Description — gris doux */}
                <p
                    className="mt-0.5 leading-relaxed"
                    style={{ fontSize: '10.5px', color: '#7a7f96' }}
                >
                    {t('adultFreeDesc')}
                </p>
            </div>

            {/* Bouton dismiss — argenté, hover blanc */}
            <button
                onClick={dismiss}
                className="shrink-0 flex items-center gap-1.5 transition-colors mt-0.5 hover:opacity-100"
                style={{ fontSize: '10.5px', color: '#a8afc4' }}
                aria-label={t('dismiss')}
            >
                <span>{t('dismiss')}</span>
                <X size={12} />
            </button>
        </div>
    )
}
