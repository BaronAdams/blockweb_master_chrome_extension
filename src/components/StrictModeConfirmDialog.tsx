import React from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlertIcon, Trash2, Pen, ShieldPlus, ShieldOff, TriangleAlert } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    durationLabel: string
}

const StrictModeConfirmDialog: React.FC<Props> = ({ open, onOpenChange, onConfirm, durationLabel }) => {
    const { t }  = useTranslation('strictMode')
    const { t: tc } = useTranslation('common')

    const restrictions = [
        { icon: <Trash2  className="text-rose-400 shrink-0" width="12" />, text: t('r1') },
        { icon: <Pen     className="text-rose-400 shrink-0" width="12" />, text: t('r2') },
        { icon: <ShieldPlus className="text-rose-400 shrink-0" width="12" />, text: t('r3') },
        { icon: <ShieldOff  className="text-rose-400 shrink-0" width="12" />, text: t('r4') },
    ]

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-zinc-950 border border-zinc-800 text-white max-w-sm rounded-2xl p-0 overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-rose-600 to-rose-400" />

                <div className="p-5 space-y-4">
                    {/* Header */}
                    <AlertDialogHeader className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0">
                                <ShieldAlertIcon fill="currentColor" stroke="#7f1d1d" className="text-rose-400" width="16" />
                            </div>
                            <AlertDialogTitle className="text-sm font-semibold text-white leading-tight">
                                {t('confirmTitle')}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-[11px] text-zinc-400 leading-relaxed pl-[42px]">
                            {t('confirmSubtitle', { duration: durationLabel })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Restrictions list */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2">
                        {restrictions.map(({ icon, text }, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <div className="w-5 h-5 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    {icon}
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Irreversibility warning */}
                    <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-500/8 border border-rose-500/20 rounded-lg">
                        <TriangleAlert className="text-rose-400 shrink-0 mt-0.5" width="13" />
                        <p className="text-[11px] text-rose-300/90 leading-relaxed font-medium">
                            {t('confirmWarning')}
                        </p>
                    </div>

                    {/* Footer */}
                    <AlertDialogFooter className="flex gap-2 pt-1">
                        <AlertDialogCancel className="flex-1 h-9 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors">
                            {tc('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirm}
                            className="flex-1 h-9 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/30"
                        >
                            <ShieldAlertIcon fill="currentColor" stroke="#E11D48" width="13" />
                            {t('confirmBtn')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default StrictModeConfirmDialog
