import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';
import { X } from 'reicon-react';

interface InstaPayQrProps {
    totalPrice: number;
    customQrImage: string | null;
}

export function InstaPayQr({ totalPrice, customQrImage }: InstaPayQrProps) {
    const [isQrExpanded, setIsQrExpanded] = useState<boolean>(false);
    const transition = useAnimationTransition('elegant');

    const qrCodeMarkup = (
        customQrImage ? (
            <img
                src={customQrImage}
                alt="InstaPay QR Code"
                className="w-full h-full object-contain rounded"
            />
        ) : (
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="25" height="25" rx="2" fill="#0A2A1B" />
                <rect x="10" y="10" width="15" height="15" rx="1" fill="white" />
                <rect x="13" y="13" width="9" height="9" fill="#0A2A1B" />

                <rect x="70" y="5" width="25" height="25" rx="2" fill="#0A2A1B" />
                <rect x="75" y="10" width="15" height="15" rx="1" fill="white" />
                <rect x="78" y="13" width="9" height="9" fill="#0A2A1B" />

                <rect x="5" y="70" width="25" height="25" rx="2" fill="#0A2A1B" />
                <rect x="10" y="75" width="15" height="15" rx="1" fill="white" />
                <rect x="13" y="78" width="9" height="9" fill="#0A2A1B" />

                {/* Simulated QR noise dots */}
                <rect x="40" y="10" width="6" height="6" fill="#0A2A1B" />
                <rect x="50" y="15" width="8" height="4" fill="#0A2A1B" />
                <rect x="45" y="25" width="12" height="6" fill="#D97706" />
                <rect x="75" y="45" width="10" height="10" fill="#0A2A1B" />
                <rect x="85" y="35" width="8" height="6" fill="#0A2A1B" />
                <rect x="10" y="45" width="8" height="8" fill="#0A2A1B" />
                <rect x="25" y="55" width="6" height="10" fill="#0A2A1B" />
                <rect x="45" y="45" width="10" height="10" fill="#0A2A1B" />
                <rect x="55" y="55" width="8" height="8" fill="#D97706" />
                <rect x="35" y="70" width="10" height="6" fill="#0A2A1B" />
                <rect x="45" y="80" width="14" height="10" fill="#0A2A1B" />
                <rect x="70" y="70" width="8" height="8" fill="#0A2A1B" />
                <rect x="80" y="80" width="10" height="8" fill="#0A2A1B" />

                {/* QR Ph / InstaPay center logo placeholder */}
                <rect x="38" y="38" width="24" height="24" rx="4" fill="white" stroke="#0A2A1B" strokeWidth="2" />
                <text x="50" y="52" fill="#D97706" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">QR Ph</text>
            </svg>
        )
    );

    return (
        <>
            <div className="bg-[#0A2A1B]/5 border border-[#0A2A1B]/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-[#0A2A1B]/40 uppercase tracking-wider">
                    <span>InstaPay Account details</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#0A2A1B]/60">Bank</span>
                    <span className="font-bold text-[#0A2A1B]">UnionBank</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#0A2A1B]/60">Name</span>
                    <span className="font-bold text-[#0A2A1B]">Jovy Flower Shop</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#0A2A1B]/60">Account #</span>
                    <span className="font-bold text-[#0A2A1B] tracking-wider">1023-4567-8901</span>
                </div>
            </div>

            {/* QR Code and Scan Instructions */}
            <div className="flex flex-col items-center justify-center p-4 bg-white border border-[#0A2A1B]/10 rounded-2xl space-y-3">
                <button
                    type="button"
                    onClick={() => setIsQrExpanded(true)}
                    title="Click to expand QR Code"
                    className="w-36 h-36 bg-white p-2 border-2 border-[#0A2A1B] rounded-xl flex items-center justify-center relative cursor-zoom-in hover:scale-[1.03] active:scale-[0.98] transition-all group shadow-xs hover:shadow-sm"
                >
                    {qrCodeMarkup}
                </button>
                <p className="text-[10px] text-center text-[#0A2A1B]/70 font-medium">
                    Click the QR code above to expand. Scan using your banking app to pay instantly.
                </p>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {isQrExpanded && (
                    <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
                        <motion.div
                            onClick={() => setIsQrExpanded(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-[#0A2A1B]/70 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={transition}
                            className="relative bg-white max-w-sm w-full rounded-3xl shadow-2xl p-6 border border-[#0A2A1B]/15 z-10 flex flex-col items-center space-y-4 select-none"
                        >
                            <button
                                onClick={() => setIsQrExpanded(false)}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                                aria-label="Close zoom"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="text-center space-y-1">
                                <h4 className="font-serif text-lg font-bold text-[#0A2A1B]">InstaPay QR Code</h4>
                                <p className="text-[10px] uppercase font-bold tracking-wider text-[#D97706]">Scan to Pay ₱{totalPrice.toFixed(2)}</p>
                            </div>

                            <div className="w-64 h-64 bg-white p-3 border-2 border-[#0A2A1B] rounded-2xl flex items-center justify-center shadow-inner relative">
                                {qrCodeMarkup}
                            </div>

                            <div className="w-full bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-2xl p-4 space-y-1.5 text-xs text-left">
                                <div className="flex justify-between">
                                    <span className="text-[#0A2A1B]/60">Bank Name</span>
                                    <span className="font-bold text-[#0A2A1B]">UnionBank</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#0A2A1B]/60">Account Holder</span>
                                    <span className="font-bold text-[#0A2A1B]">Jovy Flower Shop</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#0A2A1B]/60">Account Number</span>
                                    <span className="font-bold text-[#0A2A1B] tracking-wider">1023-4567-8901</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsQrExpanded(false)}
                                className="w-full py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-semibold rounded-full cursor-pointer transition-all active:scale-[0.98]"
                            >
                                Close Zoom
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
