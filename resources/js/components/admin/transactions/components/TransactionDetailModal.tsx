import { X as XIcon } from 'reicon-react';
import { FlattenedTransaction } from '../types';

interface TransactionDetailModalProps {
    tx: FlattenedTransaction | null;
    onClose: () => void;
    onPreviewReceipt: (img: string) => void;
}

export function TransactionDetailModal({
    tx,
    onClose,
    onPreviewReceipt,
}: TransactionDetailModalProps) {
    if (!tx) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 border border-[#0A2A1B]/10 space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-[#0A2A1B]/10">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">Transaction Audit Record</span>
                        <h3 className="font-serif text-lg font-bold text-[#0A2A1B]">Order #JFS-{tx.order_id}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-3.5 text-xs text-[#0A2A1B]">
                    <div className="flex justify-between py-1.5 border-b border-[#0A2A1B]/5">
                        <span className="text-[#0A2A1B]/60">Customer Name</span>
                        <span className="font-bold">{tx.customer_name}</span>
                    </div>
                    {tx.customer_phone && (
                        <div className="flex justify-between py-1.5 border-b border-[#0A2A1B]/5">
                            <span className="text-[#0A2A1B]/60">Contact Phone</span>
                            <span className="font-mono font-semibold">{tx.customer_phone}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-1.5 border-b border-[#0A2A1B]/5">
                        <span className="text-[#0A2A1B]/60">Payment Method</span>
                        <span className="font-bold">{tx.method}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#0A2A1B]/5">
                        <span className="text-[#0A2A1B]/60">Reference Code</span>
                        <span className="font-mono font-bold">{tx.reference_no || 'None Provided'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#0A2A1B]/5">
                        <span className="text-[#0A2A1B]/60">Total Value</span>
                        <span className="font-mono font-extrabold text-sm text-[#D97706]">
                            ₱{Number(tx.amount || 0).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#0A2A1B]/5">
                        <span className="text-[#0A2A1B]/60">Recorded At</span>
                        <span>{new Date(tx.created_at).toLocaleString('en-PH')}</span>
                    </div>
                    {tx.admin_notes && (
                        <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#0A2A1B]/10 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-[#0A2A1B]/60">Auditor Notes</span>
                            <p className="text-xs text-[#0A2A1B]/80">{tx.admin_notes}</p>
                        </div>
                    )}
                </div>

                {tx.receipt_image && (
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => onPreviewReceipt(tx.receipt_image!)}
                            className="w-full py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center shadow-2xs"
                        >
                            Open Attached Payment Receipt
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
