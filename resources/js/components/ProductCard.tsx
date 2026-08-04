import { useState } from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';
import { useAnimationTransition } from './animations';
import { ChevronLeft, ChevronRight, Star, Leaf } from 'reicon-react';

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
                            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden={true} />
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
                            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden={true} />
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
                            <Star className="h-3 w-3" weight="Filled" aria-hidden={true} />
                            <span className="font-semibold text-[#0A2A1B]">{product.rating}</span>
                        </div>
                    </div>
                    
                    <p className="text-xs text-[#0A2A1B]/75 line-clamp-2 leading-relaxed">{product.description}</p>

                    {/* Size & Stats */}
                    <div className="flex flex-col gap-1.5 text-[10px] text-[#0A2A1B]/50 font-medium pt-1">
                        <span>Size: {product.size}</span>
                        {product.stems && Object.keys(product.stems).length > 0 && (
                            <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
                                <Leaf className="h-3 w-3 text-[#D97706]" strokeWidth={1.5} aria-hidden={true} />
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
