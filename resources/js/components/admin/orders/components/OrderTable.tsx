import { Calendar, Check, Printer } from 'reicon-react';
import { Order } from '../../../../types';
import { Pagination } from '../../../Pagination';
import { getStatusStyle, getPaymentStatusLabel, getOrderUrgency, printOrderSlip } from '../utils';
import { formatPickupTime, getFulfillmentStatusLabel } from '../../../../lib/orderDisplay';

interface OrderTableProps {
    orders: Order[];
    totalOrders: number;
    orderPage: number;
    perPage: number;
    setOrderPage: (page: number) => void;
    onSelectOrder: (order: Order) => void;
    onZoomImage: (url: string | null) => void;
    onStatusChange: (orderId: number, status: string) => void;
    onApproveAndPrepare: (orderId: number) => void;
    updatingStatus: boolean;
}

export function OrderTable({
    orders,
    totalOrders,
    orderPage,
    perPage,
    setOrderPage,
    onSelectOrder,
    onZoomImage,
    onStatusChange,
    onApproveAndPrepare,
    updatingStatus,
}: OrderTableProps) {
    return (
        <div className="bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
                <thead>
                    <tr className="border-b border-[#0A2A1B]/10 text-[#0A2A1B]/60 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3.5 px-3">Order ID & Priority</th>
                        <th className="py-3.5 px-3">Recipient & Contact</th>
                        <th className="py-3.5 px-3">Scheduled Pickup</th>
                        <th className="py-3.5 px-3">Type</th>
                        <th className="py-3.5 px-3">Fulfillment</th>
                        <th className="py-3.5 px-3">Payment Proof</th>
                        <th className="py-3.5 px-3 text-right">Total</th>
                        <th className="py-3.5 px-3 text-right">Fulfillment Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]">
                    {orders.map(o => {
                        const isAwaiting = o.payment_status === 'awaiting_verification';
                        const hasReceipt = Boolean(o.payment_receipt);
                        const urgency = getOrderUrgency(o);

                        return (
                            <tr key={o.id} className={`hover:bg-[#FAF9F6] transition-colors align-middle ${urgency.type === 'funeral' ? 'bg-purple-50/25' : urgency.type === 'birthday' ? 'bg-amber-50/20' : ''}`}>
                                {/* Order ID & Urgency Badge */}
                                <td className="py-3.5 px-3">
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className="font-mono font-bold text-xs text-[#0A2A1B]">#JFS-{o.id}</span>
                                        {urgency.isUrgent && (
                                            <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs ${urgency.badgeClass}`}>
                                                <span>{urgency.icon}</span>
                                                <span>{urgency.label}</span>
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Recipient & Contact */}
                                <td className="py-3.5 px-3">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-sm text-[#0A2A1B]">{o.recipient_name}</p>
                                        <p className="text-[11px] text-[#0A2A1B]/60 font-mono">{o.recipient_phone}</p>
                                    </div>
                                </td>

                                {/* Pickup Date & Card Message Tag */}
                                <td className="py-3.5 px-3">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                                            <span className="font-semibold text-xs text-[#0A2A1B]">{o.pickup_date || 'Not specified'}</span>
                                        </div>
                                        <div className="text-[10px] text-[#0A2A1B]/60 font-medium pl-5">
                                            {formatPickupTime(o.pickup_time)}
                                        </div>
                                        {o.gift_message && (
                                            <span className="inline-block italic text-[10px] text-[#0A2A1B]/60 truncate max-w-[150px]" title={o.gift_message}>
                                                "{o.gift_message}"
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Order Type */}
                                <td className="py-3.5 px-3">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                        o.order_type === 'purchase'
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'
                                    }`}>
                                        {o.order_type === 'purchase' ? 'Direct' : 'Reservation'}
                                    </span>
                                </td>

                                {/* Fulfillment Status */}
                                <td className="py-3.5 px-3">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${getStatusStyle(o.status)}`}>
                                        {getFulfillmentStatusLabel(o.status)}
                                    </span>
                                </td>

                                {/* Payment Status & Quick Thumbnail */}
                                <td className="py-3.5 px-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getStatusStyle(o.payment_status || 'na')}`}>
                                            {getPaymentStatusLabel(o.payment_status)}
                                        </span>
                                        {hasReceipt && (
                                            <button
                                                onClick={() => onZoomImage(o.payment_receipt || null)}
                                                className="w-6 h-6 rounded-lg overflow-hidden border border-[#0A2A1B]/15 hover:border-[#D97706] transition-all shrink-0 cursor-pointer shadow-2xs group relative"
                                                title="Click to zoom payment proof"
                                            >
                                                <img src={o.payment_receipt} alt="Receipt" className="w-full h-full object-cover" />
                                            </button>
                                        )}
                                    </div>
                                </td>

                                {/* Total Price */}
                                <td className="py-3.5 px-3 text-right">
                                    <span className="font-mono font-bold text-xs text-[#0A2A1B]">
                                        ₱{parseFloat(o.total_price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </td>

                                {/* 1-Click Row Actions & Details */}
                                <td className="py-3.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {o.status !== 'cancelled' && (
                                            <>
                                                {isAwaiting && (
                                                    <button
                                                        disabled={updatingStatus}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onApproveAndPrepare(o.id);
                                                        }}
                                                        className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 text-white text-[10px] font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                                                        title="Verify payment"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        <span>Verify Payment</span>
                                                    </button>
                                                )}

                                                {!isAwaiting && o.status === 'confirmed' && (
                                                    <button
                                                        disabled={updatingStatus}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStatusChange(o.id, 'preparing');
                                                        }}
                                                        className="px-2.5 py-1.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-200 text-white text-[10px] font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                                                        title="Mark order as preparing"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        <span>Preparing</span>
                                                    </button>
                                                )}

                                                {!isAwaiting && o.status === 'preparing' && (
                                                    <button
                                                        disabled={updatingStatus}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStatusChange(o.id, 'ready_for_pickup');
                                                        }}
                                                        className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 text-white text-[10px] font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                                                        title="Mark order as ready for pickup"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        <span>Ready</span>
                                                    </button>
                                                )}

                                                {!isAwaiting && o.status === 'ready_for_pickup' && (
                                                    <button
                                                        disabled={updatingStatus}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStatusChange(o.id, 'delivered');
                                                        }}
                                                        className="px-2.5 py-1.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-200 text-white text-[10px] font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                                                        title="Mark order as picked up"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        <span>Picked Up</span>
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* Quick Print Slip Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                printOrderSlip(o);
                                            }}
                                            className="p-1.5 bg-[#FAF9F6] hover:bg-[#0A2A1B] hover:text-white border border-[#0A2A1B]/15 text-[#0A2A1B]/70 text-[10px] font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                                            title="Print Florist Assembly Slip"
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Manage / Inspection Button */}
                                        <button
                                            onClick={() => onSelectOrder(o)}
                                            className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#0A2A1B] hover:text-white border border-[#0A2A1B]/15 text-[#0A2A1B] text-[10px] font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                                        >
                                            Details
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}

                    {orders.length === 0 && (
                        <tr>
                            <td colSpan={8} className="py-12 text-center text-[#0A2A1B]/50 font-medium">
                                No orders found matching your search and filter criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Pagination
                currentPage={orderPage}
                totalItems={totalOrders}
                perPage={perPage}
                onPageChange={setOrderPage}
            />
        </div>
    );
}
