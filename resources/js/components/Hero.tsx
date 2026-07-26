import { motion } from 'motion/react';
import { useAnimationTransition } from './animations';

export function Hero() {
    const transition = useAnimationTransition('elegant');

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.12,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                ...transition,
                duration: 0.7
            }
        }
    };
    return (
        <section className="relative overflow-hidden pt-12 pb-20 px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    <motion.span 
                        variants={itemVariants}
                        className="inline-block px-3 py-1 bg-[#0A2A1B]/5 text-[#0A2A1B] text-xs font-semibold uppercase tracking-widest rounded-full"
                    >
                        🕐 5:00 AM to 8:00 PM
                    </motion.span>
                    <motion.h1 
                        variants={itemVariants}
                        className="font-serif text-4xl sm:text-6xl font-bold leading-[1.15] text-[#0A2A1B] pb-2"
                    >
                        Blossoms made simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97706] to-[#0A2A1B] font-extrabold italic">crafted with love.</span>
                    </motion.h1>
                    <motion.p 
                        variants={itemVariants}
                        className="text-lg text-[#0A2A1B]/75 leading-relaxed max-w-[55ch]"
                    >
                        Brings beauty and convenience together, offering fresh floral arrangements for every occasion with the ease of online pre-ordering and store pickup.
                    </motion.p>
                    <motion.div 
                        variants={itemVariants}
                        className="flex gap-4 pt-4"
                    >
                        <motion.a
                            href="#shop"
                            whileHover="hover"
                            initial="initial"
                            whileTap={{ scale: 0.98, y: 1 }}
                            className="relative inline-flex items-center justify-center gap-2.5 px-9 py-3.5 bg-[#0A2A1B] text-white font-medium rounded-full overflow-hidden border border-[#D97706]/35 transition-all duration-300 shadow-lg shadow-[#0A2A1B]/20 select-none text-center cursor-pointer group"
                        >
                            {/* Hover sliding glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                            
                            <motion.span 
                                variants={{
                                    initial: { rotate: 0, scale: 1 },
                                    hover: { rotate: 180, scale: 1.15, color: '#D97706' }
                                }}
                                transition={{ type: 'spring', stiffness: 260, damping: 15 }}
                                className="text-sm text-[#D97706]"
                            >
                                ✿
                            </motion.span>
                            
                            <span className="font-semibold tracking-wide text-sm relative z-10">Shop Collection</span>
                            
                            <motion.span 
                                variants={{
                                    initial: { x: 0, opacity: 0.6 },
                                    hover: { x: 3, opacity: 1, color: '#D97706' }
                                }}
                                className="text-xs text-[#FAF9F6]/80 font-serif"
                            >
                                ➔
                            </motion.span>
                        </motion.a>
                        <a
                            href="#why-us"
                            className="inline-block px-8 py-3 border border-[#0A2A1B]/25 hover:border-[#0A2A1B] text-[#0A2A1B] font-medium rounded-full transition-all duration-300 transform active:scale-[0.98] active:translate-y-0.5 select-none text-center"
                        >
                            Learn More
                        </a>
                    </motion.div>
                </motion.div>

                {/* Hero Visual Orbiting System */}
                <div className="relative flex justify-center items-center h-[360px] sm:h-[420px] lg:h-[450px] w-full overflow-visible">
                    {/* Background card/glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF9F6] to-[#F7F4EB] rounded-3xl -rotate-3 transform scale-95 -z-10 border border-[#0A2A1B]/5"></div>
                    
                    {/* Orbiting Wrapper (Scales for mobile screens to prevent overflow) */}
                    <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] flex items-center justify-center scale-[0.8] xs:scale-[0.9] sm:scale-100 transition-transform duration-500 overflow-visible">
                        
                        {/* Central Hub */}
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.04, 1],
                                rotate: [0, 3, 0, -3, 0]
                            }}
                            transition={{ 
                                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                                rotate: { duration: 15, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="absolute z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0A2A1B] flex flex-col items-center justify-center text-white border border-[#D97706]/30 shadow-xl shadow-[#0A2A1B]/35"
                        >
                            <svg className="h-6 w-6 text-[#D97706] mb-1 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                <path d="M12 4C12 4 8 7 8 10C8 12.5 10 14 12 14C14 14 16 12.5 16 10C16 7 12 4 12 4Z" />
                                <path d="M12 14C12 14 9 16 9 18.5C9 20.5 10.5 22 12 22C13.5 22 15 20.5 15 18.5C15 16 12 14 12 14Z" />
                            </svg>
                            <span className="font-serif text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#FAF9F6]">Jovy's</span>
                            <span className="text-[7px] tracking-wider text-[#D97706]/85 uppercase font-mono font-semibold">Est. 2026</span>
                        </motion.div>

                        {/* Inner Orbit (Dashed ring, rotates clockwise) */}
                        <div className="absolute w-[210px] h-[210px] sm:w-[250px] sm:h-[250px] rounded-full border border-dashed border-[#0A2A1B]/15 z-10 animate-orbit-cw hover-pause">
                            
                            {/* Inner Orbiting Item 1: Orchids (Top) */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="hover-child animate-orbit-counter-cw">
                                    <motion.div 
                                        whileHover={{ scale: 1.12 }}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#0A2A1B]/10 hover:border-[#D97706] shadow-md transition-all duration-300">
                                            <img src="/images/orchids.png" alt="Rare Orchids" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-[#0A2A1B] text-white text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md border border-[#D97706]/20">
                                            Rare Orchids
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Inner Orbiting Item 2: Sunflowers (Bottom) */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                                <div className="hover-child animate-orbit-counter-cw">
                                    <motion.div 
                                        whileHover={{ scale: 1.12 }}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#0A2A1B]/10 hover:border-[#D97706] shadow-md transition-all duration-300">
                                            <img src="/images/sunflowers.png" alt="Golden Sunflowers" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-[#0A2A1B] text-white text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md border border-[#D97706]/20">
                                            Sunflowers
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                        </div>

                        {/* Outer Orbit (Dashed ring, rotates counter-clockwise) */}
                        <div className="absolute w-[310px] h-[310px] sm:w-[370px] sm:h-[370px] rounded-full border border-dashed border-[#0A2A1B]/10 z-0 animate-orbit-ccw hover-pause">
                            
                            {/* Outer Orbiting Item 1: Roses (Left) */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
                                <div className="hover-child animate-orbit-counter-ccw">
                                    <motion.div 
                                        whileHover={{ scale: 1.12 }}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#0A2A1B]/10 hover:border-[#D97706] shadow-md transition-all duration-300">
                                            <img src="/images/roses.png" alt="Luxury Roses" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-[#0A2A1B] text-white text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md border border-[#D97706]/20">
                                            Luxury Roses
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Outer Orbiting Item 2: Tulips (Right) */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                                <div className="hover-child animate-orbit-counter-ccw">
                                    <motion.div 
                                        whileHover={{ scale: 1.12 }}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#0A2A1B]/10 hover:border-[#D97706] shadow-md transition-all duration-300">
                                            <img src="/images/tulips.png" alt="Blushing Tulips" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-[#0A2A1B] text-white text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md border border-[#D97706]/20">
                                            Blushing Tulips
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
