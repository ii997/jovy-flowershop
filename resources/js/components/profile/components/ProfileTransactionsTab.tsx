import { Receipt, CreditCard, Money, Check, Eye, X } from 'reicon-react';

interface ProfileTransactionsTabProps {
    orders: any[];
    previewReceipt: string | null;
    setPreviewReceipt: (img: string | null) => void;
    onClose: () => void;
    onSelectOrderToPay: (order: any) => void;
    onSelectOrderToResubmit?: (order: any) => void;
}

export function ProfileTransactionsTab({
    orders,
    previewReceipt,
    setPreviewReceipt,
    onClose,
    onSelectOrderToPay,
    onSelectOrderToResubmit,
}: ProfileTransactionsTabProps) {
    return (
        <div className="space-y-4">
            {orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                    <Receipt className="w-12 h-12 text-[#0A2A1B]/20 mx-auto" />
                    <p className="text-sm text-[#0A2A1B]/60 font-medium">No payment transactions recorded yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => {
                        const isVerified = order.payment_status === 'verified' || order.payment_status === 'paid';
                        const isAwaiting = order.payment_status === 'awaiting_verification' || (order.payment_receipt && !order.payment_status);
                        const isFailed = order.payment_status === 'failed' || order.payment_status === 'rejected';
                        const isGCash = (order.payment_method || '').toLowerCase().includes('gcash');

                        return (
                            <div
                                key={order.id}
                                className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#0A2A1B]/10 hover:border-[#D97706]/30 transition-all space-y-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-xs text-[#0A2A1B]">
                                                Order #{order.id}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                isGCash ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                            }`}>
                                                {isGCash ? <CreditCard className="h-3 w-3" /> : <Money className="h-3 w-3" />}
                                                {order.payment_method || 'GCash'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-[#0A2A1B]/50 block mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="text-right">
                                        <span className="font-extrabold text-sm text-[#0A2A1B] block">
                                            ₱{Number(order.total_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        {isVerified && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                                                <Check className="h-3 w-3" /> Verified
                                            </span>
                                        )}
                                        {isAwaiting && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1 animate-pulse">
                                                Awaiting Review
                                            </span>
                                        )}
                                        {isFailed && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 mt-1">
                                                Verification Failed
                                            </span>
                                        )}
                                        {!isVerified && !isAwaiting && !isFailed && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 mt-1">
                                                Unpaid / Pending
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Reference & Proof Row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#0A2A1B]/5 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[#0A2A1B]/50">Ref No:</span>
                                        <span className="font-mono font-bold text-[11px] text-[#0A2A1B] bg-white px-2 py-0.5 rounded border border-[#0A2A1B]/10">
                                            {order.payment_details?.reference_no || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {order.payment_receipt && (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewReceipt(order.payment_receipt)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#D97706]/10 border border-[#0A2A1B]/15 hover:border-[#D97706] text-[#0A2A1B] hover:text-[#D97706] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Eye className="h-3 w-3" /> View Receipt Proof
                                            </button>
                                        )}
                                        {isFailed ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onClose();
                                                    if (onSelectOrderToResubmit) {
                                                        onSelectOrderToResubmit(order);
                                                    } else {
                                                        onSelectOrderToPay(order);
                                                    }
                                                }}
                                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs animate-pulse"
                                            >
                                                <span>Resolve / Resubmit</span>
                                            </button>
                                        ) : !isVerified && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onClose();
                                                    onSelectOrderToPay(order);
                                                }}
                                                className="px-2.5 py-1 bg-[#D97706] hover:bg-[#B45309] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                            >
                                                {order.payment_receipt ? 'Re-upload' : 'Pay Now'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Receipt Preview Lightbox Modal */}
            {previewReceipt && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="relative bg-white max-w-sm w-full rounded-3xl p-5 shadow-2xl border border-[#0A2A1B]/10 flex flex-col space-y-3">
                        <div className="flex items-center justify-between border-b border-[#0A2A1B]/10 pb-2">
                            <h4 className="font-bold text-sm text-[#0A2A1B]">Proof of Payment</h4>
                            <button
                                type="button"
                                onClick={() => setPreviewReceipt(null)}
                                className="p-1 rounded-full hover:bg-gray-100 text-[#0A2A1B]/60 hover:text-[#0A2A1B]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="overflow-auto rounded-xl border border-[#0A2A1B]/10 bg-black/5 flex items-center justify-center p-2">
                            <img src={previewReceipt} alt="Proof of Payment" className="max-h-[50vh] object-contain rounded-lg" />
                        </div>
                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={() => setPreviewReceipt(null)}
                                className="px-4 py-1.5 bg-[#0A2A1B] text-white text-xs font-bold rounded-full hover:bg-[#D97706] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
