import { useState } from 'react';
import { ShoppingBag, Star } from 'reicon-react';
import { toast } from '../../ui/Toast';

interface ProfileOrdersTabProps {
    orders: any[];
    onSelectOrderToPay: (order: any) => void;
    onSelectOrderToResubmit?: (order: any) => void;
    onCancelSuccess: () => void;
    onReviewSuccess: (orderId: number, review: any) => void;
}

export function ProfileOrdersTab({
    orders,
    onSelectOrderToPay,
    onSelectOrderToResubmit,
    onCancelSuccess,
    onReviewSuccess,
}: ProfileOrdersTabProps) {
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState('');
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
    const [reviewingOrderId, setReviewingOrderId] = useState<number | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const handleCancelOrder = async (orderId: number) => {
        if (cancelReason.trim().length < 5) {
            setCancelError('Reason must be at least 5 characters long.');
            return;
        }

        setIsSubmittingCancel(true);
        setCancelError('');

        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ reason: cancelReason }),
            });

            if (response.ok) {
                setCancellingOrderId(null);
                setCancelReason('');
                onCancelSuccess();
                toast.success('Order cancelled successfully.');
            } else {
                const data = await response.json().catch(() => null);
                setCancelError(data?.message || 'Failed to cancel the order. Please try again.');
            }
        } catch (error) {
            setCancelError('Connection error. Please check your network and try again.');
        } finally {
            setIsSubmittingCancel(false);
        }
    };

    const startReview = (order: any) => {
        setReviewingOrderId(order.id);
        setReviewRating(order.review?.rating ?? 5);
        setReviewComment(order.review?.comment ?? '');
        setReviewError('');
    };

    const handleReview = async (orderId: number) => {
        setIsSubmittingReview(true);
        setReviewError('');

        try {
            const response = await fetch(`/api/orders/${orderId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() || null }),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                setReviewError(data?.message || 'Unable to save your feedback. Please try again.');
                return;
            }

            onReviewSuccess(orderId, data);
            setReviewingOrderId(null);
            toast.success('Thank you for sharing your feedback.');
        } catch {
            setReviewError('Connection error. Please try again.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <div className="space-y-4">
            <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block select-none">Your Orders & Reservations</span>
            {orders.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF9F6] rounded-2xl border border-[#0A2A1B]/5 space-y-2 select-none">
                    <ShoppingBag className="h-8 w-8 mx-auto text-[#0A2A1B]/20" />
                    <h4 className="font-semibold text-sm text-[#0A2A1B]">No orders found</h4>
                    <p className="text-xs text-[#0A2A1B]/55">Your purchases and bookings will appear here once processed.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div
                            key={order.id}
                            className="p-5 border border-[#0A2A1B]/10 rounded-2xl bg-white space-y-3"
                        >
                            <div className="flex justify-between items-center border-b border-[#0A2A1B]/5 pb-2.5">
                                <div>
                                    <span className="font-bold text-sm text-[#0A2A1B]">Order #JFS-{order.id}</span>
                                    <span className="text-[10px] text-[#0A2A1B]/45 block">
                                        Placed: {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                                        order.status === 'cancelled'
                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                            : order.order_type === 'purchase'
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'
                                    }`}>
                                        {order.status === 'cancelled'
                                            ? 'Cancelled'
                                            : order.order_type === 'purchase'
                                            ? 'Purchase'
                                            : 'Reservation'}
                                    </span>
                                    {order.order_type === 'purchase' && order.status !== 'cancelled' && (
                                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                                            order.payment_status === 'verified'
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : order.payment_status === 'awaiting_verification'
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : (order.payment_status === 'failed' || order.payment_status === 'rejected')
                                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                        }`}>
                                            {order.payment_status === 'verified'
                                                ? 'Paid'
                                                : order.payment_status === 'awaiting_verification'
                                                ? 'Verifying'
                                                : (order.payment_status === 'failed' || order.payment_status === 'rejected')
                                                ? 'Proof Rejected'
                                                : 'Unpaid'}
                                        </span>
                                    )}
                                    <span className="text-xs font-bold text-[#0A2A1B]">₱{parseFloat(order.total_price).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-0.5">
                                    <span className="text-[#0A2A1B]/50 block">Recipient</span>
                                    <p className="font-semibold text-[#0A2A1B]">{order.recipient_name}</p>
                                    <p className="text-[#0A2A1B]/75">{order.recipient_phone}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[#0A2A1B]/50 block">Pickup Details</span>
                                     <p className="font-semibold text-[#0A2A1B]">Pickup Date: {order.pickup_date}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="border-t border-[#0A2A1B]/5 pt-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-2">
                                    {order.items && order.items.map((item: any, idx: number) => (
                                        <span key={idx} className="bg-[#FAF9F6] border border-[#0A2A1B]/5 px-2.5 py-1 rounded-lg text-[#0A2A1B]/80 font-medium">
                                            {item.name} <strong className="text-[#0A2A1B]/50">x{item.quantity}</strong>
                                        </span>
                                    ))}
                                </div>
                                
                                {cancellingOrderId !== order.id && order.status === 'confirmed' && (
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCancellingOrderId(order.id);
                                                setCancelReason('');
                                                setCancelError('');
                                            }}
                                            className="px-4 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-bold rounded-full transition-all cursor-pointer active:scale-95 uppercase tracking-wider select-none shrink-0"
                                        >
                                            Cancel Order
                                        </button>
                                        
                                        {order.order_type === 'purchase' && (order.payment_status === 'failed' || order.payment_status === 'rejected') && order.status !== 'cancelled' && order.status !== 'delivered' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (onSelectOrderToResubmit) {
                                                        onSelectOrderToResubmit(order);
                                                    } else {
                                                        onSelectOrderToPay(order);
                                                    }
                                                }}
                                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-full transition-all cursor-pointer active:scale-95 uppercase tracking-wider select-none shrink-0 shadow-xs animate-pulse"
                                            >
                                                Resolve / Resubmit Proof
                                            </button>
                                        )}

                                        {order.order_type === 'purchase' && order.payment_status === 'pending' && order.status !== 'cancelled' && order.status !== 'delivered' && (
                                            <button
                                                type="button"
                                                onClick={() => onSelectOrderToPay(order)}
                                                className="px-4 py-1.5 bg-[#D97706] hover:bg-[#0A2A1B] text-white text-[10px] font-bold rounded-full transition-all cursor-pointer active:scale-95 uppercase tracking-wider select-none shrink-0"
                                            >
                                                Upload Receipt / Pay
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Cancellation Form inside the order card */}
                            {cancellingOrderId === order.id && (
                                <div className="border-t border-[#0A2A1B]/10 pt-3 mt-3 space-y-3">
                                    <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">✿ Request Order Cancellation</label>
                                    <p className="text-[11px] text-[#0A2A1B]/60 leading-normal">Please let us know why you are cancelling this order (minimum 5 characters):</p>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#0A2A1B]/15 bg-white text-xs font-semibold rounded-xl focus:outline-none focus:border-[#D97706] resize-none h-16"
                                        placeholder="Reason for cancellation..."
                                        required
                                    />
                                    {cancelError && <p className="text-red-600 text-[10px] font-semibold">{cancelError}</p>}
                                    <div className="flex justify-end gap-2 text-[10px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCancellingOrderId(null);
                                                setCancelReason('');
                                                setCancelError('');
                                            }}
                                            className="px-3.5 py-1.5 border border-[#0A2A1B]/10 hover:bg-[#0A2A1B]/5 text-[#0A2A1B] rounded-full transition-all cursor-pointer"
                                        >
                                            Keep Order
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isSubmittingCancel || cancelReason.trim().length < 5}
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-full transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                            {isSubmittingCancel ? (
                                                <>
                                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Cancelling...</span>
                                                </>
                                            ) : (
                                                <span>Confirm Cancellation</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Cancellation details */}
                            {order.status === 'cancelled' && order.cancellation && (
                                <div className="mt-3 p-3.5 bg-red-50/50 border border-red-100 rounded-2xl space-y-1 select-text">
                                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">✿ Cancellation Log</span>
                                    <p className="text-xs text-red-800 leading-relaxed">
                                        <span className="font-semibold text-red-900">Reason:</span> {order.cancellation.reason}
                                    </p>
                                </div>
                            )}

                            {order.status === 'delivered' && order.payment_status === 'verified' && (
                                <div className="border-t border-[#0A2A1B]/5 pt-3 mt-3">
                                    {reviewingOrderId !== order.id ? (
                                        <div className="flex items-center justify-between gap-3">
                                            {order.review ? (
                                                <div className="flex items-center gap-2 text-xs text-[#0A2A1B]/70">
                                                    <span className="flex gap-0.5 text-[#D97706]" aria-label={`${order.review.rating} out of 5 stars`}>
                                                        {Array.from({ length: 5 }, (_, index) => (
                                                            <Star key={index} className="h-3.5 w-3.5" weight={index < order.review.rating ? 'Filled' : 'Regular'} aria-hidden={true} />
                                                        ))}
                                                    </span>
                                                    <span>Thanks for your feedback</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-semibold text-[#0A2A1B]/65">How did we do?</span>
                                            )}
                                            <button type="button" onClick={() => startReview(order)} className="px-3.5 py-1.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-[10px] font-bold rounded-full transition-all cursor-pointer uppercase tracking-wider">
                                                {order.review ? 'Edit Feedback' : 'Leave Feedback'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold text-[#0A2A1B] uppercase tracking-wider">Rate your completed order</p>
                                            <div className="flex gap-1" role="radiogroup" aria-label="Order rating">
                                                {Array.from({ length: 5 }, (_, index) => {
                                                    const rating = index + 1;
                                                    return (
                                                        <button key={rating} type="button" role="radio" aria-checked={reviewRating === rating} aria-label={`${rating} star${rating === 1 ? '' : 's'}`} onClick={() => setReviewRating(rating)} className="text-[#D97706] cursor-pointer hover:scale-110 transition-transform">
                                                            <Star className="h-6 w-6" weight={rating <= reviewRating ? 'Filled' : 'Regular'} aria-hidden={true} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={1000} placeholder="Tell us about your flowers (optional)" className="w-full px-3 py-2 border border-[#0A2A1B]/15 rounded-xl text-xs resize-none h-20 focus:outline-none focus:border-[#D97706]" />
                                            {reviewError && <p className="text-[10px] font-semibold text-red-600">{reviewError}</p>}
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => setReviewingOrderId(null)} className="px-3.5 py-1.5 border border-[#0A2A1B]/10 text-[#0A2A1B] text-[10px] font-bold rounded-full cursor-pointer">Cancel</button>
                                                <button type="button" disabled={isSubmittingReview} onClick={() => handleReview(order.id)} className="px-4 py-1.5 bg-[#D97706] disabled:bg-[#D97706]/50 text-white text-[10px] font-bold rounded-full cursor-pointer">{isSubmittingReview ? 'Saving...' : 'Publish Feedback'}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
