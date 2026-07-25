import React, { useState } from 'react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onCheckoutSuccess: (order: any) => void;
}

export function CheckoutModal({ isOpen, onClose, product, onCheckoutSuccess }: CheckoutModalProps) {
    const [orderType, setOrderType] = useState<'purchase' | 'reservation'>('purchase');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [giftMessage, setGiftMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const cartTotal = product ? product.price : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Map item for database
        const orderItems = product ? [{
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
        }] : [];

        const payload: Record<string, any> = {
            order_type: orderType,
            delivery_type: 'pickup',
            recipient_name: name,
            recipient_phone: phone,
            delivery_date: date,
            gift_message: giftMessage,
            items: orderItems,
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                onCheckoutSuccess(data);
                setIsLoading(false);
            } else {
                setErrors(data.errors || { recipient_name: [data.message || 'Checkout failed.'] });
                setIsLoading(false);
            }
        } catch (error) {
            setErrors({ recipient_name: ['Connection error. Please try again.'] });
            setIsLoading(false);
        }
    };

    const transition = useAnimationTransition('elegant');

    const storeName = localStorage.getItem('store_settings_name') || "Jovy's Flowershop";
    const storeAddress = localStorage.getItem('store_settings_address') || "123 Rizal Avenue, Brgy. San Antonio, Makati City, Metro Manila";
    const storePhone = localStorage.getItem('store_settings_phone') || "+63-2-555-1234";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-sm"
                    />

                    {/* Modal Body */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={transition}
                        className="relative bg-white max-w-lg w-full mx-4 rounded-3xl shadow-2xl p-8 border border-[#0A2A1B]/10 z-10 flex flex-col space-y-5 max-h-[90vh] overflow-y-auto origin-center"
                    >
                <div className="flex justify-between items-center select-none">
                    <h3 className="text-xl font-bold text-[#0A2A1B] font-serif">Pickup Details</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                        aria-label="Close checkout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Order Type Toggle */}
                    <div className="space-y-1 select-none">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Order Type</label>
                        <div className="flex bg-[#F7F4EB] p-1 rounded-full border border-[#0A2A1B]/5 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setOrderType('purchase')}
                                className={`flex-1 py-2 rounded-full cursor-pointer transition-all text-center ${
                                    orderType === 'purchase' ? 'bg-[#0A2A1B] text-white' : 'text-[#0A2A1B]/60'
                                }`}
                            >
                                Confirmed Purchase
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrderType('reservation')}
                                className={`flex-1 py-2 rounded-full cursor-pointer transition-all text-center ${
                                    orderType === 'reservation' ? 'bg-[#0A2A1B] text-white' : 'text-[#0A2A1B]/60'
                                }`}
                            >
                                Reservation (Pay at Store)
                            </button>
                        </div>
                    </div>

                    {/* Pickup Location Info Card */}
                    <div className="bg-[#F7F4EB] p-3.5 rounded-2xl border border-[#0A2A1B]/5 select-none">
                        <p className="text-xs text-[#0A2A1B]/70 leading-relaxed">
                            <span className="font-semibold text-[#0A2A1B]">Pickup Location:</span><br />
                            {storeName} • {storeAddress}<br />
                            <span className="font-semibold text-[#0A2A1B]">Contact:</span> {storePhone}<br />
                            <span className="font-medium">Store Hours:</span> Mon–Fri 8AM–7PM, Sat 9AM–6PM
                        </p>
                    </div>

                    {/* Recipient Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Recipient Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                            required
                        />
                        {errors.recipient_name && <p className="text-red-600 text-xs mt-1">{errors.recipient_name[0]}</p>}
                    </div>

                    {/* Recipient Phone */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Recipient Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                            required
                        />
                        {errors.recipient_phone && <p className="text-red-600 text-xs mt-1">{errors.recipient_phone[0]}</p>}
                    </div>

                    {/* Pickup Date */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Pickup Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                            required
                        />
                        {errors.delivery_date && <p className="text-red-600 text-xs mt-1">{errors.delivery_date[0]}</p>}
                    </div>

                    {/* Gift Message */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Gift Message (Optional)</label>
                        <textarea
                            value={giftMessage}
                            onChange={(e) => setGiftMessage(e.target.value)}
                            rows={3}
                            placeholder="Write a warm note to be hand-styled onto a gift card..."
                            className="w-full px-4 py-3 bg-white border border-[#0A2A1B]/15 rounded-2xl text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors resize-none"
                        />
                    </div>

                    {/* Total Summary Row */}
                    <div className="bg-[#F7F4EB] p-4 rounded-2xl border border-[#0A2A1B]/5 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#0A2A1B]/60 uppercase tracking-wider">Total Cart Amount</span>
                            <span className="text-base font-bold text-[#0A2A1B]">₱{cartTotal.toFixed(2)}</span>
                        </div>
                        {orderType === 'reservation' && (() => {
                            const downpaymentPct = parseInt(localStorage.getItem('store_settings_downpayment_pct') || '30');
                            const downpaymentFraction = downpaymentPct / 100;
                            return (
                                <>
                                    <div className="flex justify-between items-center border-t border-[#0A2A1B]/5 pt-2 text-xs font-bold text-[#D97706]">
                                        <span>Downpayment Required ({downpaymentPct}%)</span>
                                        <span>₱{(cartTotal * downpaymentFraction).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-[#0A2A1B]/50 font-medium">
                                        <span>Remaining Balance (Pay on pickup)</span>
                                        <span>₱{(cartTotal * (1 - downpaymentFraction)).toFixed(2)}</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-[#D97706] hover:bg-[#0A2A1B] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center select-none"
                    >
                        {isLoading
                            ? 'Processing Order...'
                            : orderType === 'purchase'
                            ? 'Complete Pickup Order'
                            : 'Place Pickup Reservation'}
                    </button>
                </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
