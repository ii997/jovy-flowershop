import { X as XIcon, Printer, ArrowRight, Check, XCircle, FileText, Eye } from 'reicon-react';
import { Order } from '../../../../types';
import { getStatusStyle, getPaymentStatusLabel, printOrderSlip, getOrderUrgency } from '../utils';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onZoomImage: (url: string | null) => void;
    onStatusChange: (orderId: number, status: string) => void;
    onPaymentStatusChange: (orderId: number, paymentStatus: string) => void;
    onApproveAndPrepare: (orderId: number) => void;
    updatingStatus: boolean;
    adminNotes: string;
    setAdminNotes: (val: string) => void;
    showCancelForm: boolean;
    setShowCancelForm: (show: boolean) => void;
    cancelReason: string;
    setCancelReason: (val: string) => void;
    cancelRefundAmount: string;
    setCancelRefundAmount: (val: string) => void;
    cancelRefundMethod: string;
    setCancelRefundMethod: (val: string) => void;
    onCancelOrder: (orderId: number) => void;
    cancelling: boolean;
}

export function OrderDetailsModal({
    order,
    onClose,
    onZoomImage,
    onStatusChange,
    onPaymentStatusChange,
    onApproveAndPrepare,
    updatingStatus,
    adminNotes,
    setAdminNotes,
    showCancelForm,
    setShowCancelForm,
    cancelReason,
    setCancelReason,
    cancelRefundAmount,
    setCancelRefundAmount,
    cancelRefundMethod,
    setCancelRefundMethod,
    onCancelOrder,
    cancelling,
}: OrderDetailsModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
            <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto border border-[#0A2A1B]/10 space-y-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-4 border-b border-[#0A2A1B]/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Fulfillment & Receipt Hub</span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-0.5">
                            <h3 className="font-serif text-xl font-bold text-[#0A2A1B]">
                                Order #JFS-{order.id}
                            </h3>
                            {(() => {
                                const urgency = getOrderUrgency(order);
                                if (!urgency.isUrgent) return null;
                                return (
                                    <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs ${urgency.badgeClass}`}>
                                        <span>{urgency.icon}</span>
                                        <span>{urgency.label}</span>
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => printOrderSlip(order)}
                            className="px-3.5 py-1.5 bg-[#FAF9F6] hover:bg-[#0A2A1B] hover:text-white border border-[#0A2A1B]/15 text-[#0A2A1B] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Florist Slip</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-all active:scale-95"
                        >
                            <XIcon className="h-5 w-5" strokeWidth={2} />
                        </button>
                    </div>
                </div>

                {/* Modal Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Order Invoice Info */}
                    <div className="space-y-5 text-xs text-[#0A2A1B]">
                        {/* Fulfillment Details Card */}
                        <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/10 space-y-3.5">
                            <h4 className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider border-b border-[#0A2A1B]/10 pb-2">
                                Customer & Recipient Details
                            </h4>
                            <div className="flex justify-between">
                                <span className="text-[#0A2A1B]/60">Recipient</span>
                                <span className="font-bold">{order.recipient_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#0A2A1B]/60">Contact Phone</span>
                                <span className="font-mono font-semibold">{order.recipient_phone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#0A2A1B]/60">Fulfillment Mode</span>
                                <span className="font-bold">Store Pickup</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#0A2A1B]/60">Pickup Date</span>
                                <span className="font-semibold">
                                    {(() => {
                                        if (!order.pickup_date) return 'N/A';
                                        const d = new Date(order.pickup_date.includes('T') ? order.pickup_date : `${order.pickup_date}T00:00:00`);
                                        return isNaN(d.getTime()) ? order.pickup_date : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    })()}
                                </span>
                            </div>
                            {order.gift_message && (
                                <div className="space-y-1 pt-2 border-t border-[#0A2A1B]/10">
                                    <span className="text-[#0A2A1B]/60 block font-semibold">Card Message:</span>
                                    <p className="italic text-[#0A2A1B]/80 bg-white p-3 rounded-xl border border-[#0A2A1B]/10">
                                        "{order.gift_message}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Items List Card */}
                        <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/10 space-y-3.5">
                            <h4 className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider border-b border-[#0A2A1B]/10 pb-2">
                                Arrangements Ordered
                            </h4>
                            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                                {order.items && order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center font-medium bg-white p-2.5 rounded-xl border border-[#0A2A1B]/5">
                                        <div>
                                            <span className="font-bold text-[#0A2A1B]">{item.name}</span>
                                            <span className="text-xs text-[#0A2A1B]/50 ml-1.5 font-normal">x{item.quantity}</span>
                                        </div>
                                        <span className="font-mono font-bold text-[#0A2A1B]">
                                            ₱{(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center border-t border-[#0A2A1B]/15 pt-3 text-sm">
                                <span className="font-bold text-[#0A2A1B]">Grand Total</span>
                                <span className="font-mono text-base font-extrabold text-[#D97706]">
                                    ₱{parseFloat(order.total_price.toString()).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Cancellation Details Log (If Cancelled) */}
                        {order.cancellation && (
                            <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 space-y-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-700 border-b border-rose-200 pb-2">
                                    Cancellation Log
                                </h4>
                                <div className="space-y-2 font-medium text-rose-900">
                                    <p><strong>Reason:</strong> {order.cancellation.reason}</p>
                                    {order.cancellation.refund_amount && (
                                        <p className="mt-1">
                                            <strong>Refund Amount:</strong> ₱{order.cancellation.refund_amount.toFixed(2)} ({order.cancellation.refund_method === 'original_payment' ? 'Original Payment' : order.cancellation.refund_method === 'store_credit' ? 'Store Credit' : 'No Refund'})
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Payment Proof Review First, Followed by Linear Fulfillment */}
                    <div className="space-y-5 text-xs text-[#0A2A1B]">
                        {/* 1. Payment Proof & Verification (Top Priority) */}
                        {order.payment_status && order.payment_status !== 'na' && order.status !== 'cancelled' && (
                            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/10 space-y-4">
                                <div className="flex justify-between items-center border-b border-[#0A2A1B]/10 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/60">
                                            Payment Verification
                                        </span>
                                    </div>
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${getStatusStyle(order.payment_status)}`}>
                                        {getPaymentStatusLabel(order.payment_status)}
                                    </span>
                                </div>

                                {order.payment_receipt ? (
                                    <div className="space-y-3">
                                        {/* Reference & Amount Summary Card */}
                                        <div className="bg-white border border-[#0A2A1B]/10 p-3.5 rounded-xl space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#0A2A1B]/60">Reference Code</span>
                                                <span className="font-mono font-bold text-xs select-all text-[#0A2A1B]">
                                                    {order.payment_details?.reference_no || 'Not provided'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#0A2A1B]/60">Extracted Amount</span>
                                                <span className="font-mono font-extrabold text-sm text-[#D97706]">
                                                    {order.payment_details?.amount ? `₱${parseFloat(order.payment_details.amount.toString()).toFixed(2)}` : 'Not provided'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Receipt Screenshot with Lightbox Zoom */}
                                        <div 
                                            onClick={() => onZoomImage(order.payment_receipt || null)}
                                            className="relative rounded-2xl overflow-hidden border border-[#0A2A1B]/15 bg-white p-2 flex justify-center cursor-pointer hover:border-[#D97706] transition-all group max-h-56"
                                        >
                                            <img 
                                                src={order.payment_receipt} 
                                                alt="Receipt uploaded by customer" 
                                                className="max-h-52 object-contain rounded-xl transition-transform group-hover:scale-[1.02]" 
                                            />
                                            <div className="absolute inset-0 bg-[#0A2A1B]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all gap-1.5 rounded-2xl">
                                                <Eye className="h-4 w-4" strokeWidth={2.5} />
                                                <span>Click to Zoom Receipt</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-white rounded-xl border border-dashed border-[#0A2A1B]/15 space-y-1.5">
                                        <FileText className="h-7 w-7 mx-auto text-[#0A2A1B]/20" strokeWidth={1.5} />
                                        <h5 className="font-semibold text-[#0A2A1B]/60 text-xs">No Payment Proof Submitted</h5>
                                        <p className="text-[10px] text-[#0A2A1B]/45 max-w-[200px] mx-auto">Customer has not uploaded an InstaPay / GCash transaction screenshot yet.</p>
                                    </div>
                                )}

                                {/* Admin Feedback Notes Input */}
                                <div className="space-y-1.5 pt-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/60 block">
                                        Auditor / Feedback Notes
                                    </label>
                                    <textarea
                                        placeholder="Add notes or reason if rejecting payment (visible to customer on re-upload)..."
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] outline-none focus:border-[#D97706] resize-none placeholder:text-gray-400"
                                    />
                                </div>

                                {/* Single Clear Decision Actions Bar */}
                                {(order.payment_status === 'awaiting_verification' || order.payment_status === 'pending') && (
                                    <div className="space-y-2 pt-1">
                                        {order.status === 'confirmed' ? (
                                            <button
                                                onClick={() => onApproveAndPrepare(order.id)}
                                                disabled={updatingStatus}
                                                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-100 text-white disabled:text-gray-400 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                            >
                                                <span>✓ Approve Payment & Start Prep</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onPaymentStatusChange(order.id, 'verified')}
                                                disabled={updatingStatus}
                                                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all disabled:bg-gray-100 disabled:text-gray-400 text-center"
                                            >
                                                ✓ Verify Payment
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onPaymentStatusChange(order.id, 'failed')}
                                            disabled={updatingStatus}
                                            className="w-full py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 text-center"
                                        >
                                            Mark Failed / Reject
                                        </button>
                                    </div>
                                )}

                                {order.payment_status === 'verified' && (
                                    <div className="flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold py-2 rounded-xl text-center">
                                        <Check className="h-4 w-4 text-emerald-700" strokeWidth={2.5} />
                                        <span>Payment Confirmed & Verified</span>
                                    </div>
                                )}

                                {order.payment_status === 'failed' && (
                                    <button
                                        onClick={() => onPaymentStatusChange(order.id, 'awaiting_verification')}
                                        disabled={updatingStatus}
                                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-100 text-white disabled:text-gray-400 text-xs font-bold rounded-xl cursor-pointer transition-colors disabled:cursor-not-allowed"
                                    >
                                        Reset to Verification Queue
                                    </button>
                                )}
                            </div>
                        )}

                        {/* 2. Fulfillment Progression Stepper */}
                        <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/10 space-y-4">
                            <div className="flex justify-between items-center border-b border-[#0A2A1B]/10 pb-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/60 block">
                                    Fulfillment Progression
                                </label>
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getStatusStyle(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>

                            {order.status === 'cancelled' ? (
                                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                                    <XCircle className="h-4 w-4" />
                                    <span>This order has been cancelled and inventory restocked.</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Stepper Dots */}
                                    {/* Streamlined Fulfillment Journey (Confirmed -> Delivered) */}
                                    <div className="relative flex items-center justify-between px-12 py-1">
                                        <div className="absolute left-16 right-16 top-4 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
                                        <div 
                                            className="absolute left-16 top-4 -translate-y-1/2 h-0.5 bg-emerald-600 z-0 transition-all duration-500" 
                                            style={{ 
                                                width: order.status === 'delivered' ? 'calc(100% - 8rem)' : '0%' 
                                            }} 
                                        />

                                        {/* Step 1: Confirmed */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-emerald-50 text-emerald-700 border-emerald-600 shadow-xs">
                                                1
                                            </div>
                                            <span className="text-[10px] font-bold text-emerald-700 mt-2 uppercase tracking-wider">Confirmed</span>
                                        </div>

                                        {/* Step 2: Delivered */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                                                order.status === 'delivered'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-600 shadow-xs'
                                                    : 'bg-white text-slate-400 border-slate-300'
                                            }`}>
                                                2
                                            </div>
                                            <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-all duration-300 ${
                                                order.status === 'delivered'
                                                    ? 'text-emerald-700'
                                                    : 'text-slate-400'
                                            }`}>Delivered / Completed</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons for Next Fulfillment Step */}
                                    <div className="pt-2">
                                        {order.status === 'confirmed' && order.payment_status === 'awaiting_verification' && (
                                            <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
                                                <span className="text-base">ℹ</span>
                                                <span className="font-medium">Approve payment proof above to verify customer payment and prepare for delivery/handoff.</span>
                                            </div>
                                        )}

                                        {order.status === 'confirmed' && order.payment_status !== 'awaiting_verification' && (
                                            <button 
                                                disabled={updatingStatus}
                                                onClick={() => onStatusChange(order.id, 'delivered')}
                                                className="w-full py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-100 text-white text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs"
                                            >
                                                <Check className="h-4 w-4" strokeWidth={2.5} />
                                                <span>Mark Order as Delivered / Completed</span>
                                            </button>
                                        )}

                                        {order.status === 'preparing' && (
                                            <button 
                                                disabled={updatingStatus}
                                                onClick={() => onStatusChange(order.id, 'delivered')}
                                                className="w-full py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-100 text-white text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs"
                                            >
                                                <span>Complete Order (Ready for Handoff)</span>
                                                <Check className="h-4 w-4" strokeWidth={2.5} />
                                            </button>
                                        )}

                                        {order.status === 'delivered' && (
                                            <div className="flex items-center justify-center gap-1.5 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold">
                                                <Check className="h-4 w-4 text-emerald-700" strokeWidth={3} />
                                                <span>Order Successfully Fulfilled & Delivered</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cancel Order Action */}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <div className="pt-2 border-t border-[#0A2A1B]/5">
                                    {!showCancelForm ? (
                                        <button 
                                            type="button"
                                            onClick={() => setShowCancelForm(true)}
                                            className="text-rose-600 hover:text-rose-700 text-xs font-semibold text-center w-full cursor-pointer transition-colors block"
                                        >
                                            Cancel Order
                                        </button>
                                    ) : (
                                        <div className="mt-2 p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-700 border-b border-rose-200 pb-1">
                                                Cancel Order & Restock Inventory
                                            </h4>
                                            <textarea 
                                                placeholder="Reason for cancellation (required, min 5 chars)..." 
                                                value={cancelReason}
                                                onChange={(e) => setCancelReason(e.target.value)} 
                                                rows={3}
                                                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 outline-none focus:border-rose-500 resize-none" 
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[9px] font-semibold text-rose-700 block mb-1">Refund Amount</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        min="0" 
                                                        placeholder="0.00" 
                                                        value={cancelRefundAmount}
                                                        onChange={(e) => setCancelRefundAmount(e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 outline-none focus:border-rose-500" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-semibold text-rose-700 block mb-1">Refund Method</label>
                                                    <select 
                                                        value={cancelRefundMethod} 
                                                        onChange={(e) => setCancelRefundMethod(e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 outline-none focus:border-rose-500 cursor-pointer"
                                                    >
                                                        <option value="none">No Refund</option>
                                                        <option value="original_payment">Original Payment</option>
                                                        <option value="store_credit">Store Credit</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <button 
                                                    type="button"
                                                    onClick={() => { setShowCancelForm(false); setCancelReason(''); setCancelRefundAmount(''); setCancelRefundMethod('none'); }}
                                                    disabled={cancelling}
                                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:bg-gray-100 text-slate-700 disabled:text-gray-400 text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:cursor-not-allowed"
                                                >
                                                    Back
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => onCancelOrder(order.id)}
                                                    disabled={cancelling || cancelReason.length < 5}
                                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-100 text-white disabled:text-gray-400 text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    {cancelling ? 'Processing...' : 'Confirm Cancel'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
