import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

type ToastCallback = (message: string, type: ToastType) => void;

let listeners: ToastCallback[] = [];

export const toast = {
    show(message: string, type: ToastType = 'info') {
        listeners.forEach(listener => listener(message, type));
    },
    success(message: string) {
        this.show(message, 'success');
    },
    error(message: string) {
        this.show(message, 'error');
    },
    info(message: string) {
        this.show(message, 'info');
    }
};

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const addToast: ToastCallback = (message, type) => {
            const id = Date.now() + Math.random();
            setToasts(prev => [...prev, { id, message, type }]);

            // Auto dismiss after 3.5 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3500);
        };

        listeners.push(addToast);
        return () => {
            listeners = listeners.filter(l => l !== addToast);
        };
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#D97706]/10 text-[#D97706] text-xs font-bold">
                        ✓
                    </span>
                );
            case 'error':
                return (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-500 text-xs font-bold">
                        ✕
                    </span>
                );
            default:
                return (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-500 text-xs font-bold">
                        ℹ
                    </span>
                );
        }
    };

    const getBorderColor = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'border-[#D97706]/20 bg-[#FAF9F6]';
            case 'error':
                return 'border-red-100 bg-red-50/10';
            default:
                return 'border-blue-100 bg-blue-50/10';
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
            <AnimatePresence>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 25, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85, y: -15 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 border rounded-2xl shadow-xl backdrop-blur-md text-xs text-[#0A2A1B] font-semibold select-none ${getBorderColor(t.type)}`}
                    >
                        {getIcon(t.type)}
                        <span className="flex-1 leading-relaxed font-sans">{t.message}</span>
                        <button
                            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                            className="text-[#0A2A1B]/30 hover:text-[#0A2A1B] transition-colors cursor-pointer text-[10px] ml-1 p-1"
                        >
                            ✕
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
