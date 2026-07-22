import { useState } from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';
import { useAnimationTransition } from './animations';

interface ProductCardProps {
    product: Product;
    onOrderBouquet: (product: Product) => void;
}

export function ProductCard({ product, onOrderBouquet }: ProductCardProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const hasGallery = product.gallery && product.gallery.length > 1;

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveImageIndex(prev => (prev === 0 ? product.gallery.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveImageIndex(prev => (prev === product.gallery.length - 1 ? 0 : prev + 1));
    };

    const transition = useAnimationTransition('elegant');

    return (
        <motion.div 
            whileHover="hover"
            transition={transition}
            variants={{
                hover: {
                    y: -6,
                    boxShadow: "0 20px 25px -5px rgba(10, 42, 27, 0.06), 0 8px 10px -6px rgba(10, 42, 27, 0.06)"
                }
            }}
            className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_-1px_rgba(0,0,0,0.02)] border border-[#0A2A1B]/5 flex flex-col justify-between"
        >
            {/* Image Container */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#F7F4EB]">
                <motion.img
                    variants={{
                        hover: { scale: 1.05 }
                    }}
                    transition={transition}
                    src={product.gallery[activeImageIndex]}
                    alt={`${product.name} - View ${activeImageIndex + 1}`}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                />

                {/* Availability Badge */}
                {!product.availability && (
                    <div className="absolute inset-0 bg-[#0A2A1B]/60 backdrop-blur-[2px] flex items-center justify-center select-none">
                        <span className="bg-white text-[#0A2A1B] font-bold text-xs px-4 py-1.5 rounded-full tracking-wider uppercase shadow-md">
                            Sold Out
                        </span>
                    </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3 bg-[#FAF9F6] border border-[#0A2A1B]/10 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider text-[#0A2A1B] uppercase select-none">
                    {product.category}
                </div>

                {/* Gallery Controls (if multiple images exist) */}
                {hasGallery && product.availability && (
                    <div className="absolute inset-x-0 bottom-3 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
                        <button
                            onClick={handlePrevImage}
                            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-[#0A2A1B] shadow-md transition-all active:scale-90 cursor-pointer"
                            aria-label="Previous Image"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <div className="flex gap-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                            {product.gallery.map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                                        idx === activeImageIndex ? 'bg-white w-3' : 'bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleNextImage}
                            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-[#0A2A1B] shadow-md transition-all active:scale-90 cursor-pointer"
                            aria-label="Next Image"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Details Container */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base text-[#0A2A1B]">{product.name}</h3>
                        <div className="flex items-center text-xs text-[#D97706] gap-0.5 select-none">
                            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1L12 2z" />
                            </svg>
                            <span className="font-semibold text-[#0A2A1B]">{product.rating}</span>
                        </div>
                    </div>
                    
                    <p className="text-xs text-[#0A2A1B]/75 line-clamp-2 leading-relaxed">{product.description}</p>

                    {/* Dimensions & Stats */}
                    <div className="flex flex-col gap-1.5 text-[10px] text-[#0A2A1B]/50 font-medium pt-1">
                        <span>Dimensions: {product.dimensions}</span>
                        {product.stems && Object.keys(product.stems).length > 0 && (
                            <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
                                <svg className="h-3 w-3 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                    <path d="M12 4C12 4 8 7 8 10C8 12.5 10 14 12 14C14 14 16 12.5 16 10C16 7 12 4 12 4Z" />
                                    <path d="M12 14C12 14 9 16 9 18.5C9 20.5 10.5 22 12 22C13.5 22 15 20.5 15 18.5C15 16 12 14 12 14Z" />
                                </svg>
                                {Object.entries(product.stems).map(([flower, count], idx) => (
                                    <span key={idx} className="text-[#0A2A1B]/65">
                                        {count}x {flower}
                                        {idx < Object.keys(product.stems!).length - 1 && <span className="ml-1.5 text-[#0A2A1B]/30">•</span>}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-[#0A2A1B]">₱{product.price.toFixed(2)}</span>
                    {product.availability ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            transition={transition}
                            onClick={() => {
                                onOrderBouquet(product);
                            }}
                            className="px-6 py-2 bg-[#D97706] hover:bg-[#0A2A1B] text-white text-xs font-semibold rounded-full border border-transparent shadow-xs transition-colors duration-300 cursor-pointer"
                        >
                            Order Bouquet
                        </motion.button>
                    ) : (
                        <button
                            disabled
                            className="px-6 py-2 bg-gray-100 border border-gray-200 text-gray-400 text-xs font-semibold rounded-full select-none cursor-not-allowed"
                        >
                            Out of Stock
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
