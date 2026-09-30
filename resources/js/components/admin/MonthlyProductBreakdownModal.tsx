import { useState, useMemo } from 'react';
import { X as XIcon, ShoppingBag, Filter, Calendar } from 'reicon-react';
import { useMonthlyProductSales } from '../../lib/adminQueries';
import { MonthlyProductSale } from '../../types';
import { Skeleton } from '../ui/Skeleton';

interface MonthlyProductBreakdownModalProps {
    month: string | null; // e.g. "2025-01"
    onClose: () => void;
}

const OCCASION_OPTIONS = [
    'Birthday',
    'Anniversary',
    "Valentine's",
    'Wedding',
    'Funeral',
    'Graduation',
    'Romance',
    'Get Well Soon',
    'Congratulations',
];

const CATEGORY_OPTIONS = [
    'Bouquets',
    'Classic Roses',
    'Seasonal Tulips',
    'Cheerful Blooms',
    'Exotic Plants',
    'Funeral & Sympathy',
    'Wedding & Events',
];

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthlyProductBreakdownModal({ month, onClose }: MonthlyProductBreakdownModalProps) {
    const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { data, isLoading } = useMonthlyProductSales(month);

    // Format display title e.g. "January 2025"
    const formattedTitle = useMemo(() => {
        if (!month) return '';
        const [yearStr, monthNumStr] = month.split('-');
        const monthIndex = parseInt(monthNumStr, 10) - 1;
        const monthName = MONTH_NAMES[monthIndex] || monthNumStr;
        return `${monthName} ${yearStr}`;
    }, [month]);

    const products = data?.products || [];

    // Filter by occasion and category
    const filteredProducts = useMemo(() => {
        return products.filter((product: MonthlyProductSale) => {
            if (selectedOccasion !== 'all') {
                const hasOccasion = Array.isArray(product.occasions) &&
                    product.occasions.some((occ: string) => occ.toLowerCase() === selectedOccasion.toLowerCase());
                if (!hasOccasion) return false;
            }
            if (selectedCategory !== 'all') {
                if (product.category.toLowerCase() !== selectedCategory.toLowerCase()) {
                    return false;
                }
            }
            return true;
        });
    }, [products, selectedOccasion, selectedCategory]);

    if (!month) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] border border-[#0A2A1B]/10 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b border-[#0A2A1B]/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0A2A1B]/5 text-[#0A2A1B]">
                                <Calendar className="w-3 h-3 text-[#D97706]" />
                                Sales Trend Drill-Down
                            </span>
                            <span className="text-xs text-[#0A2A1B]/50">• Monthly Product Performance</span>
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-[#0A2A1B] mt-1 tracking-tight">
                            Product Sales Breakdown — {formattedTitle}
                        </h3>
                        <p className="text-xs text-[#0A2A1B]/60 mt-0.5">
                            Products ordered during {formattedTitle}, ranked by top sellers (highest revenue).
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-[#0A2A1B]/50 hover:text-[#0A2A1B] hover:bg-[#0A2A1B]/5 rounded-xl cursor-pointer transition-colors"
                        aria-label="Close dialog"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Controls Row: 2 Separate Dropdowns */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#0A2A1B]/5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0A2A1B]/70">
                        <Filter className="w-4 h-4 text-[#D97706]" />
                        <span>Filter Products:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Occasion Filter Dropdown */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="modal-occasion-filter" className="text-xs font-semibold text-[#0A2A1B]/70">
                                Occasion:
                            </label>
                            <select
                                id="modal-occasion-filter"
                                value={selectedOccasion}
                                onChange={(e) => setSelectedOccasion(e.target.value)}
                                className="text-xs font-semibold bg-white border border-[#0A2A1B]/15 text-[#0A2A1B] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0A2A1B] cursor-pointer shadow-2xs"
                            >
                                <option value="all">All Occasions</option>
                                {OCCASION_OPTIONS.map(occ => (
                                    <option key={occ} value={occ}>{occ}</option>
                                ))}
                            </select>
                        </div>

                        {/* Product Category Filter Dropdown */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="modal-category-filter" className="text-xs font-semibold text-[#0A2A1B]/70">
                                Category:
                            </label>
                            <select
                                id="modal-category-filter"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="text-xs font-semibold bg-white border border-[#0A2A1B]/15 text-[#0A2A1B] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0A2A1B] cursor-pointer shadow-2xs"
                            >
                                <option value="all">All Categories</option>
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {(selectedOccasion !== 'all' || selectedCategory !== 'all') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedOccasion('all');
                                    setSelectedCategory('all');
                                }}
                                className="text-xs font-bold text-[#D97706] hover:underline cursor-pointer ml-1"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-y-auto min-h-0 border border-[#0A2A1B]/10 rounded-2xl">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            <Skeleton className="h-8 w-full rounded-lg" />
                            <Skeleton className="h-8 w-full rounded-lg" />
                            <Skeleton className="h-8 w-full rounded-lg" />
                            <Skeleton className="h-8 w-full rounded-lg" />
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-[#0A2A1B]/10 bg-[#FAF9F6] text-[#0A2A1B]/70 uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10">
                                    <th className="py-3 px-4">Product Name</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4 text-center">Units Sold</th>
                                    <th className="py-3 px-4 text-right">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]">
                                {filteredProducts.map((p: MonthlyProductSale) => (
                                    <tr key={p.id} className="hover:bg-[#FAF9F6] transition-colors">
                                        <td className="py-3.5 px-4 font-semibold text-[#0A2A1B]">
                                            <div className="flex flex-col">
                                                <span>{p.name}</span>
                                                {p.occasions && p.occasions.length > 0 && (
                                                    <span className="text-[10px] font-normal text-[#0A2A1B]/50">
                                                        {p.occasions.join(' · ')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-[#0A2A1B]/80 font-medium">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0A2A1B]/5 text-[#0A2A1B]/80 border border-[#0A2A1B]/10">
                                                {p.category}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0A2A1B]">
                                            {p.units_sold} {p.units_sold === 1 ? 'unit' : 'units'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0A2A1B]">
                                            ₱{p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-xs text-[#0A2A1B]/50 gap-2">
                            <ShoppingBag className="w-8 h-8 text-[#0A2A1B]/20" />
                            <span>No product sales found for this filter criteria in {formattedTitle}.</span>
                        </div>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#0A2A1B]/10 text-xs text-[#0A2A1B]/60">
                    <span className="font-medium">
                        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-[#0A2A1B] text-white text-xs font-bold rounded-xl hover:bg-[#0A2A1B]/90 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
