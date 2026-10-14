import { AnimatePresence, motion } from 'motion/react';
import { X, Trash, Add, Minus } from 'reicon-react';
import { CartItem } from '../types';
import { cartTotal } from '../lib/cart';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    onUpdateQty: (productId: number, qty: number) => void;
    onRemove: (productId: number) => void;
    onCheckout: () => void;
    onClear: () => void;
}

export function CartDrawer({
    isOpen,
    onClose,
    items,
    onUpdateQty,
    onRemove,
    onCheckout,
    onClear,
}: CartDrawerProps) {
    const total = cartTotal(items);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-xs"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.25 }}
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-[#0A2A1B]/10">
                            <div>
                                <h3 className="text-lg font-bold font-serif text-[#0A2A1B]">
                                    Your Cart ({items.reduce((s, i) => s + i.quantity, 0)})
                                </h3>
                                <p className="text-xs text-[#0A2A1B]/60">Review items before checkout</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                                aria-label="Close cart"
                            >
                                <X className="h-6 w-6" strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            {items.length === 0 ? (
                                <div className="text-center py-16 space-y-2">
                                    <p className="text-sm font-bold text-[#0A2A1B]">Your cart is empty</p>
                                    <p className="text-xs text-[#0A2A1B]/60">Add bouquets to get started.</p>
                                </div>
                            ) : (
                                items.map(({ product, quantity }) => (
                                    <div
                                        key={product.id}
                                        className="flex gap-3 p-3 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-2xl"
                                    >
                                        <img
                                            src={product.gallery?.[0] || product.image}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-xl border border-[#0A2A1B]/10 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-bold text-[#0A2A1B] truncate">{product.name}</p>
                                                <button
                                                    onClick={() => onRemove(product.id)}
                                                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                                    aria-label={`Remove ${product.name}`}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs font-mono text-[#0A2A1B]/70">
                                                ₱{product.price.toFixed(2)} each
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 bg-white border border-[#0A2A1B]/10 rounded-full px-1 py-0.5">
                                                    <button
                                                        onClick={() => onUpdateQty(product.id, quantity - 1)}
                                                        className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="text-xs font-bold w-6 text-center">{quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQty(product.id, quantity + 1)}
                                                        className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Add className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <span className="text-sm font-bold font-mono text-[#0A2A1B]">
                                                    ₱{(product.price * quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-5 border-t border-[#0A2A1B]/10 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#0A2A1B]/60">Total</span>
                                    <span className="text-lg font-bold font-mono text-[#0A2A1B]">₱{total.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={onCheckout}
                                    className="w-full py-3 bg-[#D97706] hover:bg-[#0A2A1B] text-white text-sm font-bold rounded-full transition-all cursor-pointer"
                                >
                                    Checkout ({items.reduce((s, i) => s + i.quantity, 0)} items)
                                </button>
                                <button
                                    onClick={onClear}
                                    className="w-full text-xs font-semibold text-slate-400 hover:text-red-600 cursor-pointer"
                                >
                                    Clear cart
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
