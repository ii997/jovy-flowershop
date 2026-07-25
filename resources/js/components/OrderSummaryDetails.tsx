import { Order } from '../types';

interface OrderSummaryDetailsProps {
    order: Order;
    totalPrice: number;
}

export function OrderSummaryDetails({ order, totalPrice }: OrderSummaryDetailsProps) {
    return (
        <div className="space-y-5">
            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#0A2A1B]/5 space-y-4 text-xs">
                <div className="flex justify-between border-b border-[#0A2A1B]/5 pb-2">
                    <span className="text-[#0A2A1B]/60">Recipient</span>
                    <span className="font-bold text-[#0A2A1B]">{order.recipient_name}</span>
                </div>
                <div className="flex justify-between border-b border-[#0A2A1B]/5 pb-2">
                    <span className="text-[#0A2A1B]/60">Contact Phone</span>
                    <span className="font-semibold text-[#0A2A1B]">{order.recipient_phone}</span>
                </div>
                <div className="flex justify-between border-b border-[#0A2A1B]/5 pb-2">
                    <span className="text-[#0A2A1B]/60">Preference</span>
                    <span className="font-bold uppercase text-xs text-[#D97706]">{order.delivery_type || 'pickup'}</span>
                </div>
                <div className="flex justify-between border-b border-[#0A2A1B]/5 pb-2">
                    <span className="text-[#0A2A1B]/60">Pickup Date</span>
                    <span className="font-semibold text-[#0A2A1B]">{order.delivery_date}</span>
                </div>
                {order.wrapper_type && (
                    <div className="flex justify-between border-b border-[#0A2A1B]/5 pb-2">
                        <span className="text-[#0A2A1B]/60">Wrapper Style</span>
                        <span className="font-semibold text-[#0A2A1B]">{order.wrapper_type}</span>
                    </div>
                )}
                {order.delivery_type !== 'pickup' && (
                    <div className="space-y-1">
                        <span className="text-[#0A2A1B]/60 block">Delivery Address</span>
                        <p className="text-[#0A2A1B]/90 font-medium">{order.delivery_address}</p>
                    </div>
                )}
                {order.gift_message && (
                    <div className="space-y-1 border-t border-[#0A2A1B]/5 pt-2">
                        <span className="text-[#0A2A1B]/60 block">Card Message</span>
                        <p className="italic text-[#0A2A1B]/75 bg-white p-3 rounded-xl border border-[#0A2A1B]/5">
                            "{order.gift_message}"
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block">Ordered Items</span>
                <div className="max-h-40 overflow-y-auto space-y-2.5 pr-2">
                    {order.items && order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-[#0A2A1B]/85">
                            <span>{item.name} <strong className="text-[#0A2A1B]/50 font-normal">x{item.quantity}</strong></span>
                            <span className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center border-t border-[#0A2A1B]/10 pt-4 text-sm">
                <span className="font-semibold text-[#0A2A1B]">Total Amount</span>
                <span className="text-lg font-bold text-[#0A2A1B]">₱{totalPrice.toFixed(2)}</span>
            </div>
        </div>
    );
}
