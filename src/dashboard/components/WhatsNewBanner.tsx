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
        chrome.action.setBadgeText({ text: '' })
    }

    if (!visible) return null

    return (
        <div className="mx-8 mt-6 flex items-start gap-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-5 py-4">
            <Sparkles className="mt-0.5 shrink-0 text-amber-400" size={18} />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
                    {t('title')}
                </p>
                <p className="text-sm font-medium text-white leading-snug">
                    {t('adultFreeTitle')}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
                    {t('adultFreeDesc')}
                </p>
            </div>
            <button
                onClick={dismiss}
                className="shrink-0 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mt-0.5"
                aria-label={t('dismiss')}
            >
                <span>{t('dismiss')}</span>
                <X size={13} />
            </button>
        </div>
    )
}
