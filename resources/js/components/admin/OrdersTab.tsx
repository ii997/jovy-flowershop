import { useState, useEffect } from 'react';
import { Order, PaymentTransaction } from '../../types';
import { Pagination } from '../Pagination';
import { toast } from '../ui/Toast';
import { OrdersTabSkeleton } from '../ui/Skeleton';
import {
    useUpdateOrderStatus,
    useUpdatePaymentStatus,
    useCancelOrder,
} from '../../lib/adminQueries';

interface OrdersTabProps {
    orders: Order[];
    onUpdateOrders?: (updatedOrders: Order[]) => void;
    isLoading?: boolean;
}

export function OrdersTab({ orders, onUpdateOrders, isLoading = false }: OrdersTabProps) {
    if (isLoading) {
        return <OrdersTabSkeleton />;
    }
    const [orderSearch, setOrderSearch] = useState('');
    const [orderSortBy, setOrderSortBy] = useState<'date' | 'price'>('date');
    const [orderSortOrder, setOrderSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedOrderType, setSelectedOrderType] = useState('All');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('active');
    const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('All');
    const ORDER_PER_PAGE = 10;
    const [orderPage, setOrderPage] = useState(1);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelRefundAmount, setCancelRefundAmount] = useState('');
    const [cancelRefundMethod, setCancelRefundMethod] = useState('none');
    const [adminNotes, setAdminNotes] = useState('');
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    const updateStatusMutation = useUpdateOrderStatus();
    const updatePaymentMutation = useUpdatePaymentStatus();
    const cancelOrderMutation = useCancelOrder();
    const updatingStatus = updateStatusMutation.isPending || updatePaymentMutation.isPending || cancelOrderMutation.isPending;
    const cancelling = cancelOrderMutation.isPending;

    useEffect(() => {
        setOrderPage(1);
    }, [orderSearch, selectedOrderType, selectedStatusFilter, selectedPaymentFilter, orderSortBy, orderSortOrder]);

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            const updatedOrder = await updateStatusMutation.mutateAsync({ orderId, status: newStatus });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            toast.success('Order status updated');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update order status');
        }
    };

    const handlePaymentStatusChange = async (orderId: number, newPaymentStatus: string) => {
        try {
            const updatedOrder = await updatePaymentMutation.mutateAsync({
                orderId,
                payment_status: newPaymentStatus,
                admin_notes: adminNotes || null,
            });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setAdminNotes('');
            toast.success('Payment status updated');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update payment status');
        }
    };

    const handleApproveAndPrepare = async (orderId: number) => {
        try {
            await updatePaymentMutation.mutateAsync({
                orderId,
                payment_status: 'verified',
                admin_notes: adminNotes || 'Payment verified and order set to preparing.',
            });
            const updatedOrder = await updateStatusMutation.mutateAsync({ orderId, status: 'preparing' });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setAdminNotes('');
            toast.success('Payment verified & order set to Preparing!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to complete approval flow');
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!cancelReason || cancelReason.length < 5) {
            toast.error('Please provide a reason for cancellation (minimum 5 characters).');
            return;
        }
        try {
            const updatedOrder = await cancelOrderMutation.mutateAsync({
                orderId,
                reason: cancelReason,
                refund_amount: cancelRefundAmount ? parseFloat(cancelRefundAmount) : null,
                refund_method: cancelRefundMethod,
            });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setShowCancelForm(false);
            setCancelReason('');
            setCancelRefundAmount('');
            setCancelRefundMethod('none');
            toast.success('Order cancelled successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel order');
        }
    };

    const filteredOrders = (orders || [])
        .filter(order => {
            const recipientName = order.recipient_name || '';
            const matchesSearch = recipientName.toLowerCase().includes(orderSearch.toLowerCase());
            const matchesType = selectedOrderType === 'All' || order.order_type === selectedOrderType;
            const matchesStatus = selectedStatusFilter === 'All'
                ? true
                : selectedStatusFilter === 'active'
                    ? (order.status === 'confirmed' || order.status === 'preparing')
                    : order.status === selectedStatusFilter;
            const matchesPayment = selectedPaymentFilter === 'All' || order.payment_status === selectedPaymentFilter;
            return matchesSearch && matchesType && matchesStatus && matchesPayment;
        })
        .sort((a, b) => {
            let fieldA = orderSortBy === 'date' ? new Date(a.pickup_date || 0).getTime() : parseFloat((a.total_price || 0).toString());
            let fieldB = orderSortBy === 'date' ? new Date(b.pickup_date || 0).getTime() : parseFloat((b.total_price || 0).toString());
            if (orderSortOrder === 'asc') return fieldA > fieldB ? 1 : -1;
            else return fieldA < fieldB ? 1 : -1;
        });

    const totalOrders = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice((orderPage - 1) * ORDER_PER_PAGE, orderPage * ORDER_PER_PAGE);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-700 border border-green-200';
            case 'preparing': return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'delivered': return 'bg-[#0A2A1B]/10 text-[#0A2A1B] border border-[#0A2A1B]/20';
            case 'cancelled': case 'failed': case 'refunded': return 'bg-red-100 text-red-700 border border-red-200';
            case 'awaiting_verification': return 'bg-orange-100 text-orange-700 border border-orange-200';
            case 'na': return 'bg-gray-100 text-gray-500 border border-gray-200';
            default: return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        }
    };

    const getPaymentStatusLabel = (ps?: string) => {
        switch (ps) {
            case 'pending': return 'Pending';
            case 'awaiting_verification': return 'Awaiting Verification';
            case 'verified': return 'Verified';
            case 'failed': return 'Failed';
            case 'refunded': return 'Refunded';
            case 'na': return 'N/A';
            default: return ps || 'N/A';
        }
    };

    const closeModal = () => {
        setSelectedOrder(null);
        setShowCancelForm(false);
        setCancelReason(''); setCancelRefundAmount(''); setCancelRefundMethod('none');
        setAdminNotes('');
    };
    return (
        <div className="space-y-6 select-none">
            <div>
                <h2 className="font-serif text-2xl font-bold text-[#0A2A1B]">Orders Queue</h2>
                <p className="text-xs text-[#0A2A1B]/60">Manage all incoming custom orders, update fulfillment statuses, and verify payments</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 bg-white p-4 border border-[#0A2A1B]/5 rounded-2xl shadow-sm">
                <input type="text" placeholder="Search recipient..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border border-[#0A2A1B]/10 rounded-full text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]" />
                <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-[#0A2A1B]/10 rounded-full text-xs font-semibold text-[#0A2A1B] focus:outline-none cursor-pointer">
                    <option value="active">Active Orders (Fulfilling)</option>
                    <option value="All">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="delivered">Completed / Ready</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select value={selectedPaymentFilter} onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                    className="px-4 py-2 border border-[#0A2A1B]/10 rounded-full text-xs font-semibold text-[#0A2A1B] focus:outline-none cursor-pointer">
                    <option value="All">All Payments</option>
                    <option value="pending">Pending</option>
                    <option value="awaiting_verification">Awaiting Verification</option>
                    <option value="verified">Verified</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                </select>
                <select value={selectedOrderType} onChange={(e) => setSelectedOrderType(e.target.value)}
                    className="px-4 py-2 border border-[#0A2A1B]/10 rounded-full text-xs font-semibold text-[#0A2A1B] focus:outline-none cursor-pointer">
                    <option value="All">All Types</option>
                    <option value="purchase">Purchases Only</option>
                    <option value="reservation">Reservations Only</option>
                </select>
                <select value={`${orderSortBy}-${orderSortOrder}`} onChange={(e) => { const [by, order] = e.target.value.split('-') as [any, any]; setOrderSortBy(by); setOrderSortOrder(order); }}
                    className="px-4 py-2 border border-[#0A2A1B]/10 rounded-full text-xs font-semibold text-[#0A2A1B] focus:outline-none cursor-pointer">
                    <option value="date-desc">Pickup: Sooner</option>
                    <option value="date-asc">Pickup: Later</option>
                    <option value="price-desc">Total: Highest</option>
                    <option value="price-asc">Total: Lowest</option>
                </select>
            </div>
            <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-[#0A2A1B]/5 text-[#0A2A1B]/60 uppercase tracking-wider text-[10px] font-bold">
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Recipient</th>
                            <th className="py-3 px-4">Phone</th>
                            <th className="py-3 px-4">Pickup Date</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Payment</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]/85">
                        {paginatedOrders.map(o => (
                            <tr key={o.id} className="hover:bg-[#FAF9F6] align-top">
                                <td className="py-4 px-4 font-bold">#JFS-{o.id}</td>
                                <td className="py-4 px-4">
                                    <p className="font-semibold text-[#0A2A1B]">{o.recipient_name}</p>
                                </td>
                                <td className="py-4 px-4">{o.recipient_phone}</td>
                                <td className="py-4 px-4">
                                    <p className="font-semibold text-[#0A2A1B]">{o.pickup_date}</p>
                                    {o.gift_message && <p className="italic text-[10px] text-[#0A2A1B]/50 mt-1 truncate max-w-[120px]">"{o.gift_message}"</p>}
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${o.order_type === 'purchase' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'}`}>
                                        {o.order_type === 'purchase' ? 'Purchase' : 'Reservation'}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${getStatusStyle(o.status)}`}>{o.status}</span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${getStatusStyle(o.payment_status || 'na')}`}>{getPaymentStatusLabel(o.payment_status)}</span>
                                </td>
                                <td className="py-4 px-4 text-right font-semibold">₱{parseFloat(o.total_price.toString()).toFixed(2)}</td>
                                <td className="py-4 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {o.status !== 'cancelled' && (
                                            <>
                                                {o.payment_status === 'awaiting_verification' && (
                                                    <button
                                                        disabled={updatingStatus}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApproveAndPrepare(o.id);
                                                        }}
                                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white text-[10px] font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                                                        title="Verify payment and start preparation in 1 click"
                                                    >
                                                        <span>✓ Verify & Prepare</span>
                                                    </button>
                                                )}
                                                {o.payment_status !== 'awaiting_verification' && o.status === 'confirmed' && (
                                                    <button
                                                        disabled={updatingStatus}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(o.id, 'preparing');
                                                        }}
                                                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white text-[10px] font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                                                    >
                                                        <span>⚡ Prepare</span>
                                                    </button>
                                                )}
                                                {o.status === 'preparing' && (
                                                    <button
                                                        disabled={updatingStatus}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(o.id, 'delivered');
                                                        }}
                                                        className="px-2.5 py-1.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-200 text-white text-[10px] font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                                                    >
                                                        <span>✔ Complete / Ready</span>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <button onClick={() => setSelectedOrder(o)}
                                            className="px-3 py-1.5 bg-[#0A2A1B]/5 hover:bg-[#D97706]/10 text-[#0A2A1B] hover:text-[#D97706] text-[10px] font-bold rounded-xl transition-colors cursor-pointer shrink-0">Manage</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedOrders.length === 0 && (
                            <tr><td colSpan={9} className="py-12 text-center text-[#0A2A1B]/50 font-medium">No orders found matching the criteria.</td></tr>
                        )}
                    </tbody>
                </table>
                <Pagination currentPage={orderPage} totalItems={totalOrders} perPage={ORDER_PER_PAGE} onPageChange={setOrderPage} />
            </div>            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
                    <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto border border-[#0A2A1B]/10 space-y-6">
                        <div className="flex justify-between items-center pb-3 border-b border-[#0A2A1B]/10">
                            <div>
                                <h3 className="text-xl font-bold text-[#0A2A1B] font-serif">Order Details & Verification</h3>
                                <p className="text-xs text-[#0A2A1B]/60">Order Reference ID: #JFS-{selectedOrder.id}</p>
                            </div>
                            <button onClick={closeModal} className="p-1.5 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: Order Invoice Info */}
                            <div className="space-y-5 text-xs text-[#0A2A1B]">
                                {/* Fulfillment Details Card */}
                                <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/5 space-y-3.5">
                                    <h4 className="text-[10px] font-bold text-[#0A2A1B]/50 uppercase tracking-wider border-b border-[#0A2A1B]/5 pb-2">Fulfillment Details</h4>
                                    <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Recipient</span><span className="font-bold">{selectedOrder.recipient_name}</span></div>
                                    <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Phone</span><span className="font-semibold">{selectedOrder.recipient_phone}</span></div>
                                    <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Fulfillment</span><span className="font-bold">Store Pickup</span></div>
                                    <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Pickup Date</span><span className="font-semibold">{selectedOrder.pickup_date}</span></div>
                                    {selectedOrder.wrapper_type && (
                                        <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Wrap</span><span className="font-semibold">{selectedOrder.wrapper_type}</span></div>
                                    )}
                                    {selectedOrder.gift_message && (
                                        <div className="space-y-1 pt-2 border-t border-[#0A2A1B]/5">
                                            <span className="text-[#0A2A1B]/60 block font-semibold">Message card:</span>
                                            <p className="italic text-[#0A2A1B]/70 bg-white p-2.5 rounded-xl border border-[#0A2A1B]/5">"{selectedOrder.gift_message}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Items List Card */}
                                <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/5 space-y-3.5">
                                    <h4 className="text-[10px] font-bold text-[#0A2A1B]/50 uppercase tracking-wider border-b border-[#0A2A1B]/5 pb-2">Items Ordered</h4>
                                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                        {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between font-medium">
                                                <span>{item.name} <strong className="text-[#0A2A1B]/40 font-normal">x{item.quantity}</strong></span>
                                                <span className="font-bold">₱{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center border-t border-[#0A2A1B]/15 pt-3.5 text-sm">
                                        <span className="font-bold">Grand Total</span>
                                        <span className="text-base font-extrabold text-[#D97706]">₱{parseFloat(selectedOrder.total_price.toString()).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Cancellation Details Log (If Cancelled) */}
                                {selectedOrder.cancellation && (
                                    <div className="bg-red-50 p-5 rounded-2xl border border-red-250 space-y-3">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-700 border-b border-red-150 pb-2">Cancellation Log</h4>
                                        <div className="space-y-2 font-medium">
                                            <p><strong>Reason:</strong> {selectedOrder.cancellation.reason}</p>
                                            {selectedOrder.cancellation.refund_amount && (
                                                <p className="mt-1">
                                                    <strong>Refund Amount:</strong> ₱{selectedOrder.cancellation.refund_amount.toFixed(2)} ({selectedOrder.cancellation.refund_method === 'original_payment' ? 'Original Payment' : selectedOrder.cancellation.refund_method === 'store_credit' ? 'Store Credit' : 'No Refund'})
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Fulfillment, Payments, and Verification Actions */}
                            <div className="space-y-5 text-xs text-[#0A2A1B]">
                                {/* Fast Approval Banner */}
                                {selectedOrder.payment_status === 'awaiting_verification' && selectedOrder.status === 'confirmed' && (
                                    <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-emerald-500/15 border-2 border-emerald-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                                ✓
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-[#0A2A1B] text-xs">Payment Awaiting Approval</h5>
                                                <p className="text-[11px] text-[#0A2A1B]/70">Customer uploaded proof of payment. Approve payment & start preparation in 1 click.</p>
                                            </div>
                                        </div>
                                        <button
                                            disabled={updatingStatus}
                                            onClick={() => handleApproveAndPrepare(selectedOrder.id)}
                                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
                                        >
                                            <span>✓ Verify & Start Preparation</span>
                                        </button>
                                    </div>
                                )}

                                {/* Stepper Progress Section */}
                                <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/5 space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/60">Fulfillment Progression</label>
                                        
                                        {selectedOrder.status === 'cancelled' ? (
                                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>This order has been cancelled.</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Stepper Steps visual line */}
                                                <div className="flex items-center justify-between px-4 py-2 relative">
                                                    <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                                                    <div 
                                                        className="absolute left-8 top-1/2 h-0.5 bg-[#0A2A1B] -translate-y-1/2 z-0 transition-all duration-500" 
                                                        style={{ 
                                                            width: selectedOrder.status === 'delivered' 
                                                                ? 'calc(100% - 4rem)' 
                                                                : selectedOrder.status === 'preparing' 
                                                                    ? 'calc(50% - 2rem)' 
                                                                    : '0%' 
                                                        }} 
                                                    />

                                                    {/* Step 1 */}
                                                    <div className="flex flex-col items-center z-10">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 bg-yellow-50 text-yellow-700 border-yellow-500">1</div>
                                                        <span className="text-[9px] font-bold text-yellow-700 mt-1 uppercase tracking-wider">Confirmed</span>
                                                    </div>

                                                    {/* Step 2 */}
                                                    <div className="flex flex-col items-center z-10">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${
                                                            selectedOrder.status === 'preparing' || selectedOrder.status === 'delivered'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-500'
                                                                : 'bg-white text-gray-400 border-gray-200'
                                                        }`}>2</div>
                                                        <span className={`text-[9px] font-bold mt-1 uppercase tracking-wider transition-all duration-300 ${
                                                            selectedOrder.status === 'preparing' || selectedOrder.status === 'delivered'
                                                                ? 'text-blue-700'
                                                                : 'text-gray-400'
                                                        }`}>Preparing</span>
                                                    </div>

                                                    {/* Step 3 */}
                                                    <div className="flex flex-col items-center z-10">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${
                                                            selectedOrder.status === 'delivered'
                                                                ? 'bg-[#0A2A1B]/10 text-[#0A2A1B] border-[#0A2A1B]'
                                                                : 'bg-white text-gray-400 border-gray-200'
                                                        }`}>3</div>
                                                        <span className={`text-[9px] font-bold mt-1 uppercase tracking-wider transition-all duration-300 ${
                                                            selectedOrder.status === 'delivered'
                                                                ? 'text-[#0A2A1B]'
                                                                : 'text-gray-400'
                                                        }`}>Delivered</span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="pt-2">
                                                    {selectedOrder.status === 'confirmed' && (
                                                        <button 
                                                            disabled={updatingStatus}
                                                            onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 text-white disabled:text-gray-400 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                                                        >
                                                            <span>Start Preparing Order</span>
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {selectedOrder.status === 'preparing' && (
                                                        <button 
                                                            disabled={updatingStatus}
                                                            onClick={() => {
                                                                if (selectedOrder.order_type === 'purchase' && selectedOrder.payment_status !== 'verified') {
                                                                    if (!window.confirm('Warning: Payment has not been verified for this purchase. Do you want to mark it as Delivered anyway?')) {
                                                                        return;
                                                                    }
                                                                }
                                                                handleStatusChange(selectedOrder.id, 'delivered');
                                                            }}
                                                            className="w-full py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-100 text-white disabled:text-gray-400 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                                                        >
                                                            <span>Complete Order</span>
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {selectedOrder.status === 'delivered' && (
                                                        <div className="flex items-center justify-center gap-1.5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-bold">
                                                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span>Order Successfully Delivered</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Verification Panel (If Purchase and not Cancelled) */}
                                {selectedOrder.payment_status && selectedOrder.payment_status !== 'na' && selectedOrder.status !== 'cancelled' && (
                                    <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/5 space-y-4">
                                        <div className="flex justify-between items-center border-b border-[#0A2A1B]/5 pb-2">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/60">Payment Proof & Verification</h4>
                                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${getStatusStyle(selectedOrder.payment_status)}`}>
                                                {getPaymentStatusLabel(selectedOrder.payment_status)}
                                            </span>
                                        </div>

                                        {selectedOrder.order_type === 'reservation' ? (
                                            !selectedOrder.payment_receipt ? (
                                                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-[#0A2A1B]/15 space-y-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-[#0A2A1B]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                    <h5 className="font-semibold text-[#0A2A1B]/60 text-xs">No Downpayment Proof Submitted</h5>
                                                    <p className="text-[10px] text-[#0A2A1B]/45 max-w-[200px] mx-auto">The customer has not uploaded their {localStorage.getItem('store_settings_downpayment_pct') || '30'}% downpayment receipt screenshot yet.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="bg-white border border-[#0A2A1B]/10 p-4 rounded-xl space-y-2.5">
                                                        <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Reference ID</span><span className="font-bold select-text">{selectedOrder.payment_details?.reference_no || 'Not found'}</span></div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[#0A2A1B]/60">Extracted Amount</span>
                                                            <span className="font-bold">
                                                                {selectedOrder.payment_details?.amount ? `₱${parseFloat(selectedOrder.payment_details.amount.toString()).toFixed(2)}` : 'Not found'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Transaction Date</span><span className="font-semibold">{selectedOrder.payment_details?.transaction_date || 'Not found'}</span></div>
                                                        
                                                        {selectedOrder.payment_details?.amount && (() => {
                                                            const downpaymentPct = parseInt(localStorage.getItem('store_settings_downpayment_pct') || '30');
                                                            const expectedAmount = parseFloat(selectedOrder.total_price.toString()) * (downpaymentPct / 100.0);
                                                            const isMatch = Math.abs(parseFloat(selectedOrder.payment_details.amount.toString()) - expectedAmount) < 0.01;
                                                            return (
                                                                <div className="pt-2 border-t border-[#0A2A1B]/5">
                                                                    {isMatch ? (
                                                                        <div className="bg-green-50 text-green-800 text-[10px] font-bold p-2.5 rounded-lg flex items-center gap-1.5">
                                                                            <span>✓</span> Downpayment matches {downpaymentPct}% required perfectly!
                                                                        </div>
                                                                    ) : (
                                                                        <div className="bg-red-50 text-red-800 text-[10px] font-bold p-2.5 rounded-lg flex items-center gap-1.5">
                                                                            <span>⚠</span> Extracted amount differs from {downpaymentPct}% Downpayment (₱{expectedAmount.toFixed(2)})!
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    <div 
                                                        onClick={() => setZoomImage(selectedOrder.payment_receipt || null)}
                                                        className="relative rounded-2xl overflow-hidden border border-[#0A2A1B]/15 bg-[#FAF9F6] p-2 flex justify-center cursor-pointer hover:border-[#D97706] transition-all group"
                                                    >
                                                        <img src={selectedOrder.payment_receipt} alt="Receipt uploaded by customer" className="max-h-56 object-contain rounded-xl transition-transform group-hover:scale-[1.02]" />
                                                        <div className="absolute inset-0 bg-[#0A2A1B]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all gap-1.5 rounded-2xl">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                                            </svg>
                                                            <span>Click to Expand</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            selectedOrder.payment_receipt ? (
                                                <div className="space-y-4">
                                                    <div className="bg-white border border-[#0A2A1B]/10 p-4 rounded-xl space-y-2.5">
                                                        <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Reference ID</span><span className="font-bold select-text">{selectedOrder.payment_details?.reference_no || 'Not found'}</span></div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[#0A2A1B]/60">Extracted Amount</span>
                                                            <span className="font-bold">
                                                                {selectedOrder.payment_details?.amount ? `₱${parseFloat(selectedOrder.payment_details.amount.toString()).toFixed(2)}` : 'Not found'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between"><span className="text-[#0A2A1B]/60">Transaction Date</span><span className="font-semibold">{selectedOrder.payment_details?.transaction_date || 'Not found'}</span></div>
                                                        
                                                        {selectedOrder.payment_details?.amount && (
                                                            <div className="pt-2 border-t border-[#0A2A1B]/5">
                                                                {Math.abs(parseFloat(selectedOrder.payment_details.amount.toString()) - parseFloat(selectedOrder.total_price.toString())) < 0.01 ? (
                                                                    <div className="bg-green-50 text-green-800 text-[10px] font-bold p-2.5 rounded-lg flex items-center gap-1.5">
                                                                        <span>✓</span> Amount matches order total perfectly!
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-red-50 text-red-800 text-[10px] font-bold p-2.5 rounded-lg flex items-center gap-1.5">
                                                                        <span>⚠</span> Extracted Amount differs from Order Total (₱{parseFloat(selectedOrder.total_price.toString()).toFixed(2)})!
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div 
                                                        onClick={() => setZoomImage(selectedOrder.payment_receipt || null)}
                                                        className="relative rounded-2xl overflow-hidden border border-[#0A2A1B]/15 bg-[#FAF9F6] p-2 flex justify-center cursor-pointer hover:border-[#D97706] transition-all group"
                                                    >
                                                        <img src={selectedOrder.payment_receipt} alt="Receipt uploaded by customer" className="max-h-56 object-contain rounded-xl transition-transform group-hover:scale-[1.02]" />
                                                        <div className="absolute inset-0 bg-[#0A2A1B]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all gap-1.5 rounded-2xl">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                                            </svg>
                                                            <span>Click to Expand</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-[#0A2A1B]/15 space-y-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-[#0A2A1B]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <h5 className="font-semibold text-[#0A2A1B]/60 text-xs">No Payment Proof Submitted</h5>
                                                    <p className="text-[10px] text-[#0A2A1B]/45 max-w-[200px] mx-auto">The customer has not uploaded their InstaPay transaction screenshot yet.</p>
                                                </div>
                                            )
                                        )}

                                        {/* Action Area */}
                                        <div className="space-y-3 pt-2">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/60">Verification Actions</label>
                                            <textarea placeholder="Admin notes (optional)..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                                rows={2} className="w-full px-3 py-2 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] outline-none focus:border-[#D97706] resize-none" />
                                            
                                            {(selectedOrder.payment_status === 'awaiting_verification' || selectedOrder.payment_status === 'pending') && (
                                                <div className="flex flex-col gap-2">
                                                    {selectedOrder.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleApproveAndPrepare(selectedOrder.id)}
                                                            disabled={updatingStatus}
                                                            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 text-white disabled:text-gray-400 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                                        >
                                                            <span>✓ Verify Payment & Start Preparing</span>
                                                        </button>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handlePaymentStatusChange(selectedOrder.id, 'verified')}
                                                            disabled={updatingStatus}
                                                            className="w-full px-3 py-2 border-2 border-green-600 text-green-700 hover:bg-green-50 disabled:bg-gray-100 disabled:border-gray-200 text-[10px] font-bold rounded-xl cursor-pointer transition-colors disabled:cursor-not-allowed text-center"
                                                        >
                                                            Verify Payment Only
                                                        </button>
                                                        <button
                                                            onClick={() => handlePaymentStatusChange(selectedOrder.id, 'failed')}
                                                            disabled={updatingStatus}
                                                            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-100 text-white disabled:text-gray-400 text-[10px] font-bold rounded-xl cursor-pointer transition-colors disabled:cursor-not-allowed text-center"
                                                        >
                                                            Mark Failed
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedOrder.payment_status === 'verified' && (
                                                <div className="bg-green-50 border border-green-200 text-green-800 text-[10px] font-bold px-3 py-2 rounded-xl text-center">Payment verified ✓</div>
                                            )}
                                            {selectedOrder.payment_status === 'failed' && (
                                                <button onClick={() => handlePaymentStatusChange(selectedOrder.id, 'awaiting_verification')}
                                                    disabled={updatingStatus}
                                                    className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 text-white disabled:text-gray-400 text-[10px] font-bold rounded-xl cursor-pointer transition-colors disabled:cursor-not-allowed">Reset to Verification Queue</button>
                                            )}
                                        </div>

                                        {/* Transaction Logs */}
                                        {selectedOrder.payment_transactions && selectedOrder.payment_transactions.length > 0 && (
                                            <div className="pt-2.5 border-t border-[#0A2A1B]/5">
                                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/60 mb-2">History Log</h5>
                                                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                                    {selectedOrder.payment_transactions.map((tx: PaymentTransaction, idx: number) => (
                                                        <div key={tx.id} className="bg-white p-2.5 rounded-xl border border-[#0A2A1B]/5 text-[10px]">
                                                            <div className="flex justify-between">
                                                                <span className="font-bold text-[#0A2A1B]">#{idx + 1} - {tx.type}</span>
                                                                <span className="text-[#0A2A1B]/60">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ''}</span>
                                                            </div>
                                                            <div className="flex justify-between mt-1">
                                                                <span>Amount: <strong>₱{tx.amount?.toFixed(2)}</strong></span>
                                                                <span>Method: {tx.method || 'N/A'}</span>
                                                            </div>
                                                            {tx.verified_by && <div className="text-green-700 mt-1">Verified by #{tx.verified_by} {tx.verified_at ? new Date(tx.verified_at).toLocaleString() : ''}</div>}
                                                            {tx.admin_notes && <div className="text-[#0A2A1B]/60 mt-0.5 italic">Notes: {tx.admin_notes}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Cancellation Action Form (If Not Cancelled or Delivered) */}
                                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                                    <div className="bg-red-50/50 p-5 rounded-2xl border border-red-200/50 space-y-3">
                                        {!showCancelForm ? (
                                            <button onClick={() => setShowCancelForm(true)}
                                                className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-xl cursor-pointer transition-colors text-center">Cancel Order</button>
                                        ) : (
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-700 border-b border-red-100 pb-1">Cancel Order</h4>
                                                <textarea placeholder="Reason for cancellation (required, min 5 chars)..." value={cancelReason}
                                                    onChange={(e) => setCancelReason(e.target.value)} rows={3}
                                                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs text-[#0A2A1B] outline-none focus:border-red-500 resize-none" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[9px] font-semibold text-red-700 block mb-1">Refund Amount</label>
                                                        <input type="number" step="0.01" min="0" placeholder="0.00" value={cancelRefundAmount}
                                                            onChange={(e) => setCancelRefundAmount(e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs text-[#0A2A1B] outline-none focus:border-red-500" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-semibold text-red-700 block mb-1">Refund Method</label>
                                                        <select value={cancelRefundMethod} onChange={(e) => setCancelRefundMethod(e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs text-[#0A2A1B] outline-none focus:border-red-500 cursor-pointer">
                                                            <option value="none">No Refund</option>
                                                            <option value="original_payment">Original Payment</option>
                                                            <option value="store_credit">Store Credit</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <button onClick={() => { setShowCancelForm(false); setCancelReason(''); setCancelRefundAmount(''); setCancelRefundMethod('none'); }}
                                                        disabled={cancelling}
                                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 disabled:text-gray-400 text-[10px] font-bold rounded-xl cursor-pointer transition-colors disabled:cursor-not-allowed">Back</button>
                                                    <button onClick={() => handleCancelOrder(selectedOrder.id)}
                                                        disabled={cancelling || cancelReason.length < 5}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-100 text-white disabled:text-gray-400 text-[10px] font-bold rounded-xl cursor-pointer transition-colors disabled:cursor-not-allowed">{cancelling ? 'Processing...' : 'Confirm Cancel'}</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pt-3 border-t border-[#0A2A1B]/10 flex justify-end">
                            <button onClick={closeModal} className="px-6 py-2.5 bg-[#0A2A1B] text-white hover:bg-[#D97706] rounded-full text-xs font-bold transition-all cursor-pointer">Close Queue Details</button>
                        </div>
                    </div>
                </div>
            )}

            {zoomImage && (
                <div 
                    onClick={() => setZoomImage(null)}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out select-none"
                >
                    <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center justify-center">
                        <img 
                            src={zoomImage} 
                            alt="Receipt full expansion view" 
                            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
                        />
                        <span className="text-white/60 text-[11px] font-bold mt-4 tracking-wider uppercase">Click anywhere to close full screen</span>
                    </div>
                </div>
            )}
        </div>
    );
}