import React, { useState, useEffect, useMemo } from 'react';
import { CartItem, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';
import { X, Check, AlertTriangle } from 'reicon-react';
import { toast } from './ui/Toast';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    items?: CartItem[];
    onCheckoutSuccess: (order: any) => void;
}

export function CheckoutModal({ isOpen, onClose, product, items, onCheckoutSuccess }: CheckoutModalProps) {
    const [orderType, setOrderType] = useState<'purchase' | 'reservation'>('purchase');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [giftMessage, setGiftMessage] = useState('');
    const [agreedToNoRefund, setAgreedToNoRefund] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Dynamic Store Settings state fetched from backend API
    const [storeSettings, setStoreSettings] = useState({
        name: localStorage.getItem('store_settings_name') || "Jovy's Flowershop",
        address: localStorage.getItem('store_settings_address') || "Barangay Pob. Kidapawan City",
        phone: localStorage.getItem('store_settings_phone') || "+639097850776",
        downpaymentPct: parseInt(localStorage.getItem('store_settings_downpayment_pct') || '30', 10),
    });

    // Compute Date Constraints (minimum is today, max is 1 year in advance)
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const maxDateStr = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setAgreedToNoRefund(false);
            return;
        }

        // Reset or initialize default date to today if empty
        if (!date) {
            setDate(todayStr);
        }

        if (!time) {
            setTime('09:00');
        }

        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        const updatedName = data.store_name || "Jovy's Flowershop";
                        const updatedAddress = data.store_address || "Barangay Pob. Kidapawan City";
                        const updatedPhone = data.store_phone || "+639097850776";
                        const updatedPct = data.downpayment_pct ?? 30;

                        setStoreSettings({
                            name: updatedName,
                            address: updatedAddress,
                            phone: updatedPhone,
                            downpaymentPct: updatedPct,
                        });

                        localStorage.setItem('store_settings_name', updatedName);
                        localStorage.setItem('store_settings_address', updatedAddress);
                        localStorage.setItem('store_settings_phone', updatedPhone);
                        localStorage.setItem('store_settings_downpayment_pct', String(updatedPct));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch store settings in CheckoutModal", e);
            }
        };

        fetchSettings();
    }, [isOpen, todayStr, date, time]);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const cartTotal = items && items.length > 0
        ? items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
        : product ? product.price : 0;

    const hasItems = (items && items.length > 0) || !!product;

    // Real-time Field Validations
    const isNameValid = useMemo(() => {
        const trimmed = name.trim();
        return trimmed.length >= 2 && /^[a-zA-Z\s.'-]+$/.test(trimmed);
    }, [name]);

    const isPhoneValid = useMemo(() => {
        const trimmed = phone.trim();
        return /^(09\d{9}|\+639\d{9})$/.test(trimmed);
    }, [phone]);

    const isDateValid = useMemo(() => {
        if (!date) return false;
        return date >= todayStr && date <= maxDateStr;
    }, [date, todayStr, maxDateStr]);

    const isTimeValid = useMemo(() => {
        if (!time) return false;
        return time >= '05:00' && time <= '20:00';
    }, [time]);

    const isFormValid = isNameValid && isPhoneValid && isDateValid && isTimeValid && hasItems && agreedToNoRefund;

    // Input handlers with strict character enforcement (Fool-proof)
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Disallow numbers, script brackets, and invalid symbols
        const cleanVal = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '').slice(0, 60);
        setName(cleanVal);
        if (errors.recipient_name) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.recipient_name;
                return next;
            });
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow leading '+' and only digits afterwards
        let clean = '';
        if (raw.startsWith('+')) {
            clean = '+' + raw.slice(1).replace(/\D/g, '');
        } else {
            clean = raw.replace(/\D/g, '');
        }
        // Limit max length to standard PH mobile (13 for +639..., 11 for 09...)
        clean = clean.slice(0, 13);
        setPhone(clean);

        if (errors.recipient_phone) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.recipient_phone;
                return next;
            });
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.value;
        setDate(selected);
        if (errors.pickup_date) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.pickup_date;
                return next;
            });
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTime(e.target.value);
        if (errors.pickup_time) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.pickup_time;
                return next;
            });
        }
    };

    const handleGiftMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Enforce 300 character max limit
        setGiftMessage(e.target.value.slice(0, 300));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Client-side guard checks
        if (!hasItems) {
            toast.error('No arrangement selected for checkout.');
            return;
        }

        if (!agreedToNoRefund) {
            toast.error('Please acknowledge and agree to the No Refund Policy.');
            return;
        }

        if (!isNameValid) {
            setErrors({ recipient_name: ['Please enter a valid recipient name (letters and spaces only, min 2 chars).'] });
            return;
        }

        if (!isPhoneValid) {
            setErrors({ recipient_phone: ['Please enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567).'] });
            return;
        }

        if (!isDateValid) {
            setErrors({ pickup_date: ['Please select a pickup date on or after today.'] });
            return;
        }

        if (!isTimeValid) {
            setErrors({ pickup_time: ['Please select a pickup time between 5:00 AM and 8:00 PM.'] });
            return;
        }

        setIsLoading(true);
        setErrors({});

        // Map items for database
        const orderItems = items && items.length > 0
            ? items.map(({ product: p, quantity }) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                quantity,
            }))
            : [{
                id: product!.id,
                name: product!.name,
                price: product!.price,
                quantity: 1,
            }];

        const payload = {
            order_type: orderType,
            recipient_name: name.trim(),
            recipient_phone: phone.trim(),
            pickup_date: date,
            pickup_time: time,
            gift_message: giftMessage.trim() || null,
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
                toast.success('Order placed successfully!');
                onCheckoutSuccess(data);
                setIsLoading(false);
            } else {
                setErrors(data.errors || { recipient_name: [data.message || 'Checkout failed. Please review your details.'] });
                setIsLoading(false);
            }
        } catch (error) {
            setErrors({ recipient_name: ['Connection error. Please check your network and try again.'] });
            setIsLoading(false);
        }
    };

    const transition = useAnimationTransition('elegant');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-xs select-none"
                    />

                    {/* Modal Body */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={transition}
                        className="relative bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#0A2A1B]/10 z-10 flex flex-col space-y-5 max-h-[90vh] overflow-y-auto origin-center"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center select-none pb-2 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-[#0A2A1B] font-serif">Pickup &amp; Order Details</h3>
                                <p className="text-xs text-[#0A2A1B]/60">Complete your bouquet reservation or purchase</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-all active:scale-90"
                                aria-label="Close checkout"
                            >
                                <X className="h-6 w-6" strokeWidth={1.5} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Order Type Toggle */}
                            <div className="space-y-1.5 select-none">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#0A2A1B]/70 block">Order Fulfillment Type</label>
                                <div className="grid grid-cols-2 bg-[#F7F4EB] p-1 rounded-2xl border border-[#0A2A1B]/5 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setOrderType('purchase')}
                                        className={`py-2 px-3 rounded-xl cursor-pointer transition-all text-center ${
                                            orderType === 'purchase'
                                                ? 'bg-[#0A2A1B] text-white shadow-xs'
                                                : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                        }`}
                                    >
                                        Confirmed Purchase
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderType('reservation')}
                                        className={`py-2 px-3 rounded-xl cursor-pointer transition-all text-center ${
                                            orderType === 'reservation'
                                                ? 'bg-[#0A2A1B] text-white shadow-xs'
                                                : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                        }`}
                                    >
                                        Reservation (Store Pay)
                                    </button>
                                </div>
                            </div>

                            {/* Pickup Location Info Card */}
                            <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#0A2A1B]/5 select-none">
                                <p className="text-xs text-[#0A2A1B]/70 leading-relaxed">
                                    <span className="font-semibold text-[#0A2A1B]">Pickup Location:</span><br />
                                    {storeSettings.name} • {storeSettings.address}<br />
                                    <span className="font-semibold text-[#0A2A1B]">Contact:</span> {storeSettings.phone}<br />
                                    <span className="font-medium">Store Hours:</span> Daily 5:00 AM – 8:00 PM
                                </p>
                            </div>

                            {/* Recipient Name */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-[#0A2A1B] block">
                                        Recipient Full Name <span className="text-red-500">*</span>
                                    </label>
                                    {isNameValid && (
                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                            <Check className="h-3 w-3" /> Valid
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    name="recipient_name"
                                    autoComplete="name"
                                    value={name}
                                    onChange={handleNameChange}
                                    placeholder="e.g. Jovelyn Santos"
                                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-[#0A2A1B] focus:outline-none transition-colors ${
                                        name && !isNameValid
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                    }`}
                                    required
                                />
                                {name && !isNameValid && (
                                    <p className="text-red-600 text-xs mt-0.5">Letters, spaces, dots, and hyphens only (min 2 characters).</p>
                                )}
                                {errors.recipient_name && <p className="text-red-600 text-xs mt-1">{errors.recipient_name[0]}</p>}
                            </div>

                            {/* Recipient Phone */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-[#0A2A1B] block">
                                        Recipient Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    {isPhoneValid && (
                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                            <Check className="h-3 w-3" /> Valid
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="tel"
                                    name="recipient_phone"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="e.g. 09171234567 or +639171234567"
                                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-[#0A2A1B] focus:outline-none transition-colors ${
                                        phone && !isPhoneValid
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                    }`}
                                    required
                                />
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span>Format: 11 digits (09XXXXXXXXX) or 13 chars (+639XXXXXXXXX)</span>
                                    <span>Digits only</span>
                                </div>
                                {phone && !isPhoneValid && (
                                    <p className="text-red-600 text-xs mt-0.5">Must be a valid 11-digit or +63 mobile number.</p>
                                )}
                                {errors.recipient_phone && <p className="text-red-600 text-xs mt-1">{errors.recipient_phone[0]}</p>}
                            </div>

                            {/* Pickup Schedule */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-[#0A2A1B] block">
                                        Pickup Date <span className="text-red-500">*</span>
                                    </label>
                                    {isDateValid && (
                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                            <Check className="h-3 w-3" /> Selected
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="date"
                                    name="pickup_date"
                                    min={todayStr}
                                    max={maxDateStr}
                                    value={date}
                                    onChange={handleDateChange}
                                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-[#0A2A1B] focus:outline-none transition-colors ${
                                        date && !isDateValid
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                    }`}
                                    required
                                />
                                {date && !isDateValid && (
                                    <p className="text-red-600 text-xs mt-0.5">Pickup date cannot be in the past.</p>
                                )}
                                {errors.pickup_date && <p className="text-red-600 text-xs mt-1">{errors.pickup_date[0]}</p>}
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-[#0A2A1B] block">
                                        Pickup Time <span className="text-red-500">*</span>
                                    </label>
                                    {isTimeValid && (
                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                            <Check className="h-3 w-3" /> Selected
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="time"
                                    name="pickup_time"
                                    min="05:00"
                                    max="20:00"
                                    value={time}
                                    onChange={handleTimeChange}
                                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-[#0A2A1B] focus:outline-none transition-colors ${
                                        time && !isTimeValid
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                    }`}
                                    required
                                />
                                <p className="text-[10px] text-slate-400">Pickup hours: 5:00 AM – 8:00 PM</p>
                                {time && !isTimeValid && (
                                    <p className="text-red-600 text-xs mt-0.5">Pickup time must be within store hours.</p>
                                )}
                                {errors.pickup_time && <p className="text-red-600 text-xs mt-1">{errors.pickup_time[0]}</p>}
                            </div>
                            </div>

                            {/* Gift Message */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-[#0A2A1B] block">
                                        Gift Message <span className="text-slate-400 font-normal">(Optional)</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {giftMessage.length}/300
                                    </span>
                                </div>
                                <textarea
                                    name="gift_message"
                                    value={giftMessage}
                                    onChange={handleGiftMessageChange}
                                    maxLength={300}
                                    rows={3}
                                    placeholder="Write a warm note to be hand-styled onto a gift card..."
                                    className="w-full px-4 py-3 bg-white border border-[#0A2A1B]/15 rounded-2xl text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors resize-none"
                                />
                            </div>

                            {/* Total Summary Row */}
                            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#0A2A1B]/5 space-y-2">
                                {items && items.length > 1 && (
                                    <div className="space-y-1.5 border-b border-[#0A2A1B]/5 pb-2">
                                        {items.map(({ product: p, quantity }) => (
                                            <div key={p.id} className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-[#0A2A1B]/80">{p.name} <span className="text-[#0A2A1B]/50">x{quantity}</span></span>
                                                <span className="font-mono font-semibold">₱{(p.price * quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#0A2A1B]/60 uppercase tracking-wider">Total Cart Amount</span>
                                    <span className="text-base font-bold text-[#0A2A1B] font-mono">₱{cartTotal.toFixed(2)}</span>
                                </div>
                                {orderType === 'reservation' && (() => {
                                    const downpaymentFraction = storeSettings.downpaymentPct / 100;
                                    return (
                                        <>
                                            <div className="flex justify-between items-center border-t border-[#0A2A1B]/5 pt-2 text-xs font-bold text-[#D97706]">
                                                <span>Downpayment Required ({storeSettings.downpaymentPct}%)</span>
                                                <span className="font-mono">₱{(cartTotal * downpaymentFraction).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-[#0A2A1B]/50 font-medium">
                                                <span>Remaining Balance (Pay on pickup)</span>
                                                <span className="font-mono">₱{(cartTotal * (1 - downpaymentFraction)).toFixed(2)}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* No Refund Policy Notice Card */}
                            <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl space-y-2.5">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-0.5 text-xs">
                                        <p className="font-bold text-amber-950">Perishable Floral Notice — No Refund Policy</p>
                                        <p className="text-amber-800/90 leading-relaxed text-[11px]">
                                            Fresh flowers and custom arrangements are perishable goods crafted exclusively for your scheduled pickup. Once confirmed, orders cannot be cancelled, returned, or refunded.
                                        </p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2.5 pt-2 border-t border-amber-200/60 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={agreedToNoRefund}
                                        onChange={(e) => setAgreedToNoRefund(e.target.checked)}
                                        className="h-4 w-4 rounded border-amber-300 text-[#D97706] focus:ring-[#D97706] focus:ring-offset-0 cursor-pointer"
                                        required
                                    />
                                    <span className="text-xs font-semibold text-amber-950">
                                        I understand and agree to the No Refund Policy <span className="text-red-500">*</span>
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !isFormValid}
                                className="w-full py-3.5 bg-[#D97706] hover:bg-[#0A2A1B] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-full transition-all active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center select-none shadow-sm"
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
