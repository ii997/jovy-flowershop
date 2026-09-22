import { useState, useMemo, useCallback } from 'react';
import { CircularGallery, GalleryItem } from './ui/circular-gallery-2';
import { Product } from '../types';
import { Sparkles, ArrowRight, X } from 'reicon-react';

export const SIGNATURE_BLOOMS: GalleryItem[] = [
    { 
        text: 'Classic Roses', 
        image: '/images/bouquet1.jpg', 
        flowerKey: 'Rose',
        description: 'Timeless luxury roses for anniversaries, birthdays, and heartfelt romance.'
    },
    { 
        text: 'Seasonal Tulips', 
        image: '/images/bouquet2.jpg', 
        flowerKey: 'Tulip',
        description: 'Vibrant spring tulips hand-bundled for celebrations and joyful milestones.'
    },
    { 
        text: 'Sunny Sunflowers', 
        image: '/images/boquet6.jpg', 
        flowerKey: 'Sunflower',
        description: 'Golden radiant sunflowers inspiring warmth, cheer, and bright congratulations.'
    },
    { 
        text: 'Exotic Orchids', 
        image: '/images/orchids.png', 
        flowerKey: 'Orchid',
        description: 'Delicate tropical orchids crafted for sophisticated gifting and luxury decor.'
    },
    { 
        text: 'White Peonies', 
        image: '/images/wedding.png', 
        flowerKey: 'Peony',
        description: 'Lush fragrant peonies embodying eternal devotion, weddings, and bridal grace.'
    },
    { 
        text: 'Sympathy Lilies', 
        image: '/images/funeral1.jpg', 
        flowerKey: 'Lily',
        description: 'Serene white lilies offering peace, purity, and dignified remembrance.'
    },
    { 
        text: 'Pastel Carnations', 
        image: '/images/boquet10.jpg', 
        flowerKey: 'Carnation',
        description: 'Enduring sweet carnations honoring gratitude, family, and motherly love.'
    },
];

interface FeaturesProps {
    products?: Product[];
    onSelectOccasionFlower?: (occasion: string, flowerName?: string) => void;
}

// Helper to determine occasion badge styling and emoji
function getOccasionBadgeMeta(occasion: string) {
    const clean = occasion.toLowerCase();
    if (clean.includes('birthday')) {
        return {
            label: 'Birthday Celebration',
            icon: '🎂',
            className: 'bg-rose-50/95 text-rose-800 border-rose-200/90 shadow-rose-900/10',
            accent: 'border-rose-400/40 text-rose-700',
        };
    }
    if (clean.includes('wedding')) {
        return {
            label: 'Wedding & Bridal',
            icon: '💍',
            className: 'bg-emerald-50/95 text-emerald-900 border-emerald-300/90 shadow-emerald-900/10',
            accent: 'border-emerald-400/40 text-emerald-800',
        };
    }
    if (clean.includes('funeral') || clean.includes('condolence') || clean.includes('sympathy')) {
        return {
            label: 'Funeral & Memorial',
            icon: '🕊️',
            className: 'bg-slate-900/95 text-slate-100 border-slate-700/90 shadow-slate-950/25',
            accent: 'border-slate-500/40 text-slate-300',
        };
    }
    if (clean.includes('anniversary')) {
        return {
            label: 'Anniversary',
            icon: '💖',
            className: 'bg-amber-50/95 text-amber-900 border-amber-300/90 shadow-amber-900/10',
            accent: 'border-amber-400/40 text-amber-800',
        };
    }
    if (clean.includes('valentine')) {
        return {
            label: "Valentine's & Romance",
            icon: '🌹',
            className: 'bg-red-50/95 text-red-900 border-red-300/90 shadow-red-900/10',
            accent: 'border-red-400/40 text-red-800',
        };
    }
    if (clean.includes('graduation')) {
        return {
            label: 'Graduation Milestone',
            icon: '🎓',
            className: 'bg-indigo-50/95 text-indigo-900 border-indigo-200/90 shadow-indigo-900/10',
            accent: 'border-indigo-400/40 text-indigo-800',
        };
    }
    return {
        label: occasion,
        icon: '✿',
        className: 'bg-[#FAF9F6]/95 text-[#0A2A1B] border-[#0A2A1B]/15 shadow-black/5',
        accent: 'border-[#0A2A1B]/20 text-[#0A2A1B]',
    };
}

export function Features({ products = [], onSelectOccasionFlower }: FeaturesProps) {
    // Selected bloom filter. null = "Seasonal Highlights Overview" (per Q7: B)
    const [selectedFlower, setSelectedFlower] = useState<string | null>(null);

    // Active product items matching the selected flower or trending seasonal highlights
    const displayedItems = useMemo(() => {
        if (!products || products.length === 0) return [];

        const activeCatalog = products.filter(p => !p.deleted_at && p.availability);

        if (selectedFlower) {
            const query = selectedFlower.toLowerCase();
            return activeCatalog.filter(p => {
                const nameMatch = p.name.toLowerCase().includes(query);
                const categoryMatch = p.category.toLowerCase().includes(query);
                const descMatch = p.description.toLowerCase().includes(query);
                
                let stemMatch = false;
                if (p.stems && typeof p.stems === 'object') {
                    stemMatch = Object.keys(p.stems).some(k => k.toLowerCase().includes(query));
                }

                return nameMatch || categoryMatch || descMatch || stemMatch;
            });
        }

        // When null, provide a diverse mix representing major occasions (Birthday, Wedding, Funeral, Anniversary, Romance)
        const keyOccasions = ['Wedding', 'Funeral', 'Birthday', 'Anniversary', "Valentine's", 'Graduation'];
        const chosen: Product[] = [];
        const seenIds = new Set<number>();

        for (const occ of keyOccasions) {
            const match = activeCatalog.find(p => 
                !seenIds.has(p.id) &&
                ((Array.isArray(p.occasions) && p.occasions.includes(occ)) || p.category.toLowerCase() === occ.toLowerCase())
            );
            if (match) {
                chosen.push(match);
                seenIds.add(match.id);
            }
        }

        // Fill remaining with other active products up to 6
        for (const p of activeCatalog) {
            if (chosen.length >= 6) break;
            if (!seenIds.has(p.id)) {
                chosen.push(p);
                seenIds.add(p.id);
            }
        }

        return chosen;
    }, [products, selectedFlower]);

    const activeBloomMeta = useMemo(() => {
        if (!selectedFlower) return null;
        return SIGNATURE_BLOOMS.find(b => b.flowerKey === selectedFlower || b.text.includes(selectedFlower)) || null;
    }, [selectedFlower]);

    const handleGalleryItemClick = useCallback((item: GalleryItem) => {
        if (item.flowerKey) {
            setSelectedFlower(prev => prev === item.flowerKey ? null : item.flowerKey!);
        } else {
            setSelectedFlower(prev => prev === item.text ? null : item.text);
        }
    }, []);

    return (
        <section id="why-us" className="bg-[#FAF9F6] py-20 border-y border-[#0A2A1B]/10 px-6 scroll-mt-12">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Section Header */}
                <div className="max-w-2xl mx-auto text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2A1B]/5 text-[#0A2A1B] text-xs font-semibold uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Interactive Floral Experience</span>
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0A2A1B]">
                        Seasonal Bloom Showcase
                    </h2>
                    <p className="text-[#0A2A1B]/75 text-sm sm:text-base leading-relaxed">
                        Discover how our signature fresh blooms are styled for life's meaningful moments — from joyful Birthdays and Weddings to tender Sympathy tributes. Spin the carousel and select a flower.
                    </p>
                </div>

                {/* 3D Circular Gallery Container */}
                <div className="relative h-[440px] sm:h-[480px] w-full bg-[#F7F4EB]/70 border border-[#0A2A1B]/5 rounded-3xl overflow-hidden shadow-inner flex flex-col items-center justify-center">
                    <div className="absolute top-4 left-6 z-10 hidden sm:flex items-center gap-2 text-xs font-medium text-[#0A2A1B]/50 pointer-events-none">
                        <span>✦ Drag or scroll horizontally to spin</span>
                        <span>•</span>
                        <span className="text-[#D97706] font-semibold">Click a bloom to filter arrangements below</span>
                    </div>

                    <CircularGallery
                        items={SIGNATURE_BLOOMS}
                        bend={2.5}
                        borderRadius={0.06}
                        scrollEase={0.03}
                        scrollSpeed={1.5}
                        onItemClick={handleGalleryItemClick}
                        className="text-[#0A2A1B] font-serif"
                    />
                </div>

                {/* Signature Bloom Pill Filters for Easy Direct Selection */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setSelectedFlower(null)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                            selectedFlower === null
                                ? 'bg-[#0A2A1B] text-white shadow-md'
                                : 'bg-white border border-[#0A2A1B]/15 text-[#0A2A1B]/70 hover:border-[#0A2A1B] hover:text-[#0A2A1B]'
                        }`}
                    >
                        ✿ All Seasonal Highlights
                    </button>
                    {SIGNATURE_BLOOMS.map(bloom => {
                        const isSelected = selectedFlower === bloom.flowerKey;
                        return (
                            <button
                                key={bloom.text}
                                type="button"
                                onClick={() => setSelectedFlower(isSelected ? null : (bloom.flowerKey || bloom.text))}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                                    isSelected
                                        ? 'bg-[#D97706] text-white shadow-md ring-2 ring-[#D97706]/30'
                                        : 'bg-white border border-[#0A2A1B]/15 text-[#0A2A1B]/70 hover:border-[#D97706] hover:text-[#0A2A1B]'
                                }`}
                            >
                                <span>{bloom.text}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Inline Occasion Showcase Section (Positioned directly beneath carousel) */}
                <div className="space-y-6 pt-4 border-t border-[#0A2A1B]/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#0A2A1B]/10 shadow-xs">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">
                                    {selectedFlower ? `${activeBloomMeta?.text || selectedFlower} Occasions` : 'Curated Occasion Highlights'}
                                </span>
                                <span className="text-xs text-[#0A2A1B]/40">•</span>
                                <span className="text-xs text-[#0A2A1B]/60 font-medium">
                                    {displayedItems.length} {displayedItems.length === 1 ? 'arrangement' : 'arrangements'} available
                                </span>
                            </div>
                            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0A2A1B] mt-0.5">
                                {selectedFlower
                                    ? `Occasion Styling for ${activeBloomMeta?.text || selectedFlower}`
                                    : 'Seasonal Highlights Across Life\'s Moments'}
                            </h3>
                            <p className="text-xs text-[#0A2A1B]/65 mt-1">
                                {activeBloomMeta?.description || 'Browse how our master florists combine fresh botanicals for weddings, birthdays, anniversaries, and condolences.'}
                            </p>
                        </div>

                        {selectedFlower && (
                            <button
                                type="button"
                                onClick={() => setSelectedFlower(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF9F6] hover:bg-[#0A2A1B]/10 text-[#0A2A1B] text-xs font-semibold rounded-xl border border-[#0A2A1B]/15 transition-colors self-start sm:self-auto cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Show All Seasonal Highlights</span>
                            </button>
                        )}
                    </div>

                    {/* Occasion Cards Responsive Grid */}
                    {displayedItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedItems.map(product => {
                                // Select primary occasion for badge display
                                const primaryOccasion = (Array.isArray(product.occasions) && product.occasions.length > 0)
                                    ? product.occasions[0]
                                    : product.category;

                                const badgeMeta = getOccasionBadgeMeta(primaryOccasion);

                                // Format stem count list
                                const stemText = product.stems && typeof product.stems === 'object'
                                    ? Object.entries(product.stems).map(([name, qty]) => `${qty}x ${name}`).slice(0, 3).join(' · ')
                                    : product.category;

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => onSelectOccasionFlower?.(primaryOccasion, selectedFlower || undefined)}
                                        className="group bg-white rounded-3xl border border-[#0A2A1B]/10 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#D97706]/40 transition-all duration-300 flex flex-col cursor-pointer"
                                    >
                                        {/* Image Container with Floating Occasion Badge */}
                                        <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                                            {/* Pinned Top-Left Occasion Badge Pill (Per Q3: A) */}
                                            <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border backdrop-blur-md transition-transform group-hover:scale-105 ${badgeMeta.className}`}>
                                                    <span className="text-sm">{badgeMeta.icon}</span>
                                                    <span>{badgeMeta.label}</span>
                                                </span>
                                            </div>

                                            {/* Season / Category Tag top right */}
                                            {Array.isArray(product.seasons) && product.seasons.length > 0 && (
                                                <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white backdrop-blur-md border border-white/20">
                                                        {product.seasons[0]}
                                                    </span>
                                                </div>
                                            )}

                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                loading="lazy"
                                            />
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <h4 className="font-serif text-lg font-bold text-[#0A2A1B] group-hover:text-[#D97706] transition-colors line-clamp-1">
                                                        {product.name}
                                                    </h4>
                                                    <span className="text-base font-bold font-mono text-[#0A2A1B] shrink-0">
                                                        ₱{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#0A2A1B]/70 line-clamp-2 leading-relaxed">
                                                    {product.description}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-[#0A2A1B]/5 flex items-center justify-between">
                                                <span className="text-[11px] text-[#0A2A1B]/55 font-medium truncate max-w-[200px]" title={stemText}>
                                                    {stemText}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D97706] group-hover:translate-x-1 transition-transform">
                                                    <span>Order for {primaryOccasion}</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#0A2A1B]/10 space-y-3">
                            <p className="font-serif text-lg font-bold text-[#0A2A1B]">
                                No Active Catalog Items Found for {selectedFlower}
                            </p>
                            <p className="text-xs text-[#0A2A1B]/60 max-w-md mx-auto">
                                We regularly rotate fresh flower varieties based on seasonal availability. Check back soon or contact our florists directly for bespoke orders.
                            </p>
                            <button
                                type="button"
                                onClick={() => setSelectedFlower(null)}
                                className="px-5 py-2 bg-[#0A2A1B] text-white text-xs font-semibold rounded-full hover:bg-[#D97706] transition-colors cursor-pointer mt-2"
                            >
                                Reset to All Seasonal Highlights
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

