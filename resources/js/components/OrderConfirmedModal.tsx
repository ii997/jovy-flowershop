import { useState, useEffect } from 'react';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';

interface ConfettiParticle {
    id: number;
    x: number; // percentage
    delay: number; // seconds
    duration: number; // seconds
    size: number; // pixels
    color: string;
    rotation: number;
    shape: 'square' | 'circle' | 'triangle';
}

const CONFETTI_COLORS = ['#D97706', '#0A2A1B', '#F472B6', '#F87171', '#34D399', '#60A5FA'];
const CONFETTI_SHAPES: ('square' | 'circle' | 'triangle')[] = ['square', 'circle', 'triangle'];

function LocalConfetti() {
    const [particles, setParticles] = useState<ConfettiParticle[]>([]);

    useEffect(() => {
        const list: ConfettiParticle[] = [];
        for (let i = 0; i < 80; i++) {
            list.push({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 1.5,
                duration: 2.5 + Math.random() * 2.5,
                size: 6 + Math.random() * 6,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                rotation: Math.random() * 360,
                shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
            });
        }
        setParticles(list);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
            {particles.map(p => {
                let borderStyles = {};
                if (p.shape === 'triangle') {
                    borderStyles = {
                        borderLeft: `${p.size / 2}px solid transparent`,
                        borderRight: `${p.size / 2}px solid transparent`,
                        borderBottom: `${p.size}px solid ${p.color}`,
                    };
                }

                return (
                    <motion.div
                        key={p.id}
                        initial={{
                            y: -20,
                            x: `${p.x}%`,
                            rotate: 0,
                            opacity: 1,
                        }}
                        animate={{
                            y: '105vh',
                            x: `${p.x + (Math.random() * 16 - 8)}%`, // sway
                            rotate: p.rotation + 360,
                            opacity: [1, 1, 0.7, 0],
                        }}
                        transition={{
                            duration: p.duration,
                            delay: p.delay,
                            ease: 'linear',
                            repeat: Infinity,
                        }}
                        style={{
                            position: 'absolute',
                            width: p.shape === 'triangle' ? 0 : p.size,
                            height: p.shape === 'triangle' ? 0 : p.size,
                            backgroundColor: p.shape === 'triangle' ? 'transparent' : p.color,
                            borderRadius: p.shape === 'circle' ? '50%' : '0%',
                            ...borderStyles,
                        }}
                    />
                );
            })}
        </div>
    );
}

interface OrderConfirmedModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export function OrderConfirmedModal({ isOpen, onClose, order }: OrderConfirmedModalProps) {
    const transition = useAnimationTransition('elegant');

    if (!order) return null;

    const isReservation = order.order_type === 'reservation';
    const totalPrice = typeof order.total_price === 'number' 
        ? order.total_price 
        : parseFloat(order.total_price || '0');

    // Success checkmark path animations
    const checkmarkVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                delay: 0.2,
                type: 'spring' as const,
                stiffness: 100,
                damping: 15,
                duration: 0.8
            }
        }
    };

    const circleVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 120,
                damping: 12,
                duration: 0.6
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center animate-fade-in" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-sm"
                    />

                    {/* Confetti Animation overlay */}
                    <LocalConfetti />

                    {/* Modal Body */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={transition}
                        className="relative bg-[#FAF9F6] max-w-md w-full mx-4 rounded-3xl shadow-2xl p-8 border border-[#0A2A1B]/10 z-10 flex flex-col items-center text-center space-y-6 select-none max-h-[90vh] overflow-y-auto origin-center"
                    >
                        {/* Animated Success Icon */}
                        <div className="relative flex items-center justify-center w-20 h-20">
                            <motion.div
                                variants={circleVariants}
                                initial="hidden"
                                animate="visible"
                                className="absolute inset-0 rounded-full bg-[#0A2A1B]/5 border border-[#0A2A1B]/10"
                            />
                            <svg className="w-10 h-10 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <motion.path
                                    variants={checkmarkVariants}
                                    initial="hidden"
                                    animate="visible"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>

                        {/* Title & Headline */}
                        <div className="space-y-2">
                            <h3 className="font-serif text-2xl font-bold text-[#0A2A1B] leading-tight">
                                {isReservation ? 'Reservation Placed!' : 'Order Placed!'}
                            </h3>
                            <p className="text-xs text-[#0A2A1B]/60 font-medium tracking-wide">
                                Order ID: <span className="font-bold text-[#0A2A1B]">#JFS-{order.id}</span>
                            </p>
                        </div>

                        {/* Next Steps / Confirmation Message */}
                        <p className="text-sm text-[#0A2A1B]/80 leading-relaxed max-w-[34ch]">
                            {isReservation
                                ? 'Your reservation details have been recorded. You can complete payment at our store upon pick-up.'
                                : 'Thank you for your purchase. We have received your receipt and will verify the transaction shortly to begin styling your bouquet.'}
                        </p>

                        {/* Order Details Card */}
                        <div className="w-full bg-white border border-[#0A2A1B]/5 rounded-2xl p-5 text-left space-y-3 text-xs shadow-sm">
                            <div className="flex justify-between border-b border-[#0A2A1B]/5 pb-2">
                                <span className="text-[#0A2A1B]/55 font-medium">Recipient</span>
                                <span className="font-bold text-[#0A2A1B]">{order.recipient_name}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#0A2A1B]/5 pb-2">
                                <span className="text-[#0A2A1B]/55 font-medium">Phone</span>
                                <span className="font-semibold text-[#0A2A1B]">{order.recipient_phone}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#0A2A1B]/5 pb-2">
                                <span className="text-[#0A2A1B]/55 font-medium">Pickup Date</span>
                                <span className="font-semibold text-[#0A2A1B]">{order.delivery_date}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[#0A2A1B]/55 font-medium">Order Type</span>
                                <span className="font-semibold text-[#0A2A1B] leading-relaxed">
                                    {order.delivery_type === 'delivery' ? order.delivery_address : 'Store Pickup'}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-[#0A2A1B]/10 pt-3 text-sm">
                                <span className="font-bold text-[#0A2A1B]">Total Amount</span>
                                <span className="font-bold text-[#D97706]">₱{totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-sm font-semibold rounded-full shadow-md shadow-[#0A2A1B]/10 hover:shadow-[#D97706]/10 hover:shadow-lg transition-all duration-300 transform active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center"
                        >
                            Continue Shopping
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
