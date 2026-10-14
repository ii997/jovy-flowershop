interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    isProcessing?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmationDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    isProcessing = false,
    onConfirm,
    onCancel,
}: ConfirmationDialogProps) {
    if (!isOpen) return null;

    const confirmClass = variant === 'danger'
        ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/25'
        : 'bg-[#0A2A1B] hover:bg-[#D97706] focus:ring-[#D97706]/25';

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white rounded-3xl border border-[#0A2A1B]/10 shadow-2xl p-5 space-y-4 animate-scale-in">
                <div className="space-y-1.5">
                    <h3 className="text-base font-bold font-serif text-[#0A2A1B]">{title}</h3>
                    <p className="text-xs leading-relaxed text-[#0A2A1B]/70">{message}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 disabled:text-slate-400 text-xs font-bold rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`px-4 py-2.5 text-white disabled:text-white/70 text-xs font-bold rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors active:scale-[0.98] focus:outline-none focus:ring-4 ${confirmClass}`}
                    >
                        {isProcessing ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
