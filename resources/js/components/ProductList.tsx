import { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { CatalogSkeleton } from './ui/Skeleton';

interface ProductListProps {
    products: Product[];
    onOrderBouquet: (product: Product) => void;
    isAuthenticated: boolean;
    onAuthClick: () => void;
    isLoading?: boolean;
}

const OCCASIONS = ['All', 'Birthday', 'Anniversary', "Valentine's", 'Wedding', 'Funeral'];

export function ProductList({ products, onOrderBouquet, isAuthenticated, onAuthClick, isLoading = false }: ProductListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOccasion, setSelectedOccasion] = useState('All');
    const [showOutOfStock, setShowOutOfStock] = useState(false);

    // Filter logic
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesOccasion = selectedOccasion === 'All' || product.occasions.includes(selectedOccasion);
        
        // Hide sold out unless showOutOfStock is checked
        const matchesStock = showOutOfStock || product.availability;

        return matchesSearch && matchesOccasion && matchesStock;
    });

    return (
        <section id="shop" className="py-20 px-6">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Section Header & Title */}
                <div className="space-y-4">
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0A2A1B]">Curated Collections</h2>
                    <p className="text-[#0A2A1B]/70">Explore our fresh floral collections handpicked for any occasion and season.</p>
                </div>

                {!isAuthenticated ? (
                    <div className="text-center py-20 px-8 bg-transparent space-y-6 max-w-xl mx-auto select-none">
                        <div className="p-5 bg-[#FAF9F6] rounded-full border border-[#0A2A1B]/5 text-[#D97706] inline-block animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-[#0A2A1B] font-serif">Unlock Our Floral Collections</h3>
                            <p className="text-xs sm:text-sm text-[#0A2A1B]/60 leading-relaxed max-w-md mx-auto">
                                Browsing our premium collections is reserved for members. Please log in or create an account to view, choose, and order our fresh seasonal bouquets.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onAuthClick}
                            className="px-8 py-3 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-semibold rounded-full transition-all active:scale-[0.98] cursor-pointer"
                        >
                            Log In or Register
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Filter and Search Controls */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F7F4EB] p-4 rounded-2xl border border-[#0A2A1B]/5">
                            {/* Search Bar */}
                            <div className="relative w-full md:w-80 select-none">
                                <input
                                    type="text"
                                    placeholder="Search bouquets or exotics..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#0A2A1B]/10 rounded-full text-sm text-[#0A2A1B] placeholder-[#0A2A1B]/40 focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-all"
                                />
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#0A2A1B]/40"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Filter Selects */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto select-none">
                                {/* Occasion Filter */}
                                <div className="relative flex-1 sm:flex-initial">
                                    <select
                                        value={selectedOccasion}
                                        onChange={(e) => setSelectedOccasion(e.target.value)}
                                        className="w-full sm:w-44 px-4 py-2 bg-white border border-[#0A2A1B]/10 rounded-full text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] transition-all appearance-none cursor-pointer"
                                    >
                                        {OCCASIONS.map(occ => (
                                            <option key={occ} value={occ}>
                                                {occ === 'All' ? 'All Occasions' : occ}
                                            </option>
                                        ))}
                                    </select>
                                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[#0A2A1B]/40 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>

                                {/* Show Out of Stock Toggle */}
                                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-[#0A2A1B]/10 rounded-full text-xs font-semibold text-[#0A2A1B] cursor-pointer hover:border-[#D97706] transition-colors select-none">
                                    <input
                                        type="checkbox"
                                        checked={showOutOfStock}
                                        onChange={(e) => setShowOutOfStock(e.target.checked)}
                                        className="rounded border-[#0A2A1B]/15 text-[#D97706] focus:ring-[#D97706] cursor-pointer"
                                    />
                                    <span>Show Sold Out</span>
                                </label>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {isLoading ? (
                            <CatalogSkeleton count={8} />
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-[#0A2A1B]/5 space-y-4">
                                <svg className="h-12 w-12 mx-auto text-[#0A2A1B]/20 select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="M21 21l-4.3-4.3" />
                                    <path d="M8 11h6" />
                                    <path d="M11 8v6" />
                                </svg>
                                <h3 className="text-lg font-bold text-[#0A2A1B]">No matches found</h3>
                                <p className="text-sm text-[#0A2A1B]/60 max-w-[280px] mx-auto">Try adjusting your filters or searching for something else.</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedOccasion('All');
                                        setShowOutOfStock(false);
                                    }}
                                    className="px-6 py-2 bg-[#0A2A1B] text-white text-xs font-semibold rounded-full hover:bg-[#D97706] transition-colors cursor-pointer active:scale-95"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onOrderBouquet={onOrderBouquet}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
