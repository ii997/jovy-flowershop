import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    cartCount: number;
    cartTotal: number;
    onUpdateQuantity: (productId: number, amount: number) => void;
    onRemoveFromCart: (productId: number) => void;
    onCheckoutClick: () => void;
}

export function CartDrawer({
    isOpen,
    onClose,
    cart,
    cartCount,
    cartTotal,
    onUpdateQuantity,
    onRemoveFromCart,
    onCheckoutClick,
}: CartDrawerProps) {
    const transition = useAnimationTransition('elegant');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-sm"
                    />

                    {/* Drawer Content */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={transition}
                        className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col border-l border-[#0A2A1B]/10 origin-right"
                    >
                <div className="px-6 py-5 border-b border-[#0A2A1B]/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-[#0A2A1B]">
                        <span>Shopping Cart</span>
                        <span className="text-sm font-normal text-[#0A2A1B]/60">({cartCount} items)</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer active:scale-95 transition-all"
                        aria-label="Close Cart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <AnimatePresence initial={false} mode="popLayout">
                        {cart.length === 0 ? (
                            <motion.div
                                key="empty-cart"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={transition}
                                className="h-full flex flex-col items-center justify-center text-center space-y-4"
                            >
                                <svg className="h-12 w-12 text-[#0A2A1B]/20 select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                    <path d="M3 6h18" />
                                    <path d="M16 10a4 4 0 01-8 0" />
                                </svg>
                                <h4 className="font-semibold text-lg text-[#0A2A1B]">Your cart is empty</h4>
                                <p className="text-xs text-[#0A2A1B]/60 max-w-[240px]">Explore our fresh floral collections and add some beauty to your basket.</p>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-[#0A2A1B] text-white text-xs font-semibold rounded-full hover:bg-[#D97706] transition-colors cursor-pointer active:scale-95"
                                >
                                    Browse Store
                                </button>
                            </motion.div>
                        ) : (
                            cart.map(item => (
                                <motion.div
                                    key={item.product.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 50, scale: 0.9, height: 0, marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0, overflow: 'hidden' }}
                                    transition={transition}
                                    className="flex gap-4 border-b border-[#0A2A1B]/5 pb-4 last:border-0 last:pb-0"
                                >
                                    <img
                                        src={item.product.image}
                                        alt={item.product.description}
                                        className="w-20 h-20 object-cover rounded-xl bg-[#F7F4EB] border border-[#0A2A1B]/5"
                                    />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-sm text-[#0A2A1B]">{item.product.name}</h4>
                                                <button
                                                    onClick={() => onRemoveFromCart(item.product.id)}
                                                    className="text-xs text-[#0A2A1B]/60 hover:text-[#f53003] font-medium cursor-pointer active:scale-95 transition-all"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <span className="text-xs text-[#0A2A1B]/60">{item.product.category}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center border border-[#0A2A1B]/15 rounded-full overflow-hidden bg-[#FAF9F6]">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                                                    className="px-2.5 py-1 hover:bg-[#0A2A1B]/5 font-semibold text-xs transition-colors cursor-pointer active:scale-95 text-[#0A2A1B]"
                                                >
                                                    -
                                                </button>
                                                <span className="px-3 text-xs font-medium text-[#0A2A1B]">{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                                                    disabled={item.quantity >= item.product.quantity}
                                                    className="px-2.5 py-1 hover:bg-[#0A2A1B]/5 font-semibold text-xs transition-colors cursor-pointer active:scale-95 text-[#0A2A1B] disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="font-bold text-sm text-[#0A2A1B]">
                                                ₱{(item.product.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Cart Footer Summary */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-[#0A2A1B]/10 bg-[#F7F4EB] space-y-4">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-[#0A2A1B]/60">Subtotal</span>
                            <span className="text-[#0A2A1B] font-bold text-lg">₱{cartTotal.toFixed(2)}</span>
                        </div>
                        <p className="text-[11px] text-[#0A2A1B]/60">Shipping and tax calculated at checkout.</p>
                        <button
                            onClick={onCheckoutClick}
                            className="w-full py-3 bg-[#D97706] hover:bg-[#0A2A1B] text-white text-sm font-semibold rounded-full transition-all duration-300 shadow-md shadow-[#D97706]/10 cursor-pointer active:scale-[0.98] active:translate-y-0.5 select-none text-center"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )}
</AnimatePresence>
);
}
