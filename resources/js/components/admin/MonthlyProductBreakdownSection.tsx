import { useState, useMemo } from 'react';
import { X as XIcon, ShoppingBag, Filter, Calendar, Award, Package, Sparkles, Printer } from 'reicon-react';
import { useMonthlyProductSales } from '../../lib/adminQueries';
import { MonthlyProductSale } from '../../types';
import { Skeleton } from '../ui/Skeleton';
import { toast } from '../ui/Toast';

interface MonthlyProductBreakdownSectionProps {
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

export function MonthlyProductBreakdownSection({ month, onClose }: MonthlyProductBreakdownSectionProps) {
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

    // Compute month summary statistics
    const monthStats = useMemo(() => {
        const totalRev = filteredProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);
        const totalUnits = filteredProducts.reduce((sum, p) => sum + (p.units_sold || 0), 0);
        const topProduct = filteredProducts[0] || null;
        return { totalRev, totalUnits, topProduct };
    }, [filteredProducts]);

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Unable to open print preview. Please check popup permissions.');
            return;
        }

        const rowsHtml = filteredProducts.map((p, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 8px 6px; font-weight: bold; color: #64748b;">#${idx + 1}</td>
                <td style="padding: 8px 6px; font-weight: bold; color: #0A2A1B;">${p.name}</td>
                <td style="padding: 8px 6px;">${p.category}</td>
                <td style="padding: 8px 6px;">${Array.isArray(p.occasions) && p.occasions.length > 0 ? p.occasions.join(', ') : 'General'}</td>
                <td style="padding: 8px 6px; text-align: center; font-weight: 600;">${p.units_sold}</td>
                <td style="padding: 8px 6px; text-align: right; font-family: monospace;">₱${(p.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-family: monospace; color: #0A2A1B;">₱${(p.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Product Sales Performance - ${formattedTitle}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0A2A1B; line-height: 1.4; }
                    .header { text-align: center; border-bottom: 2px solid #0A2A1B; padding-bottom: 12px; margin-bottom: 16px; }
                    .title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0A2A1B; }
                    .subtitle { font-size: 11px; color: #D97706; font-weight: bold; margin-top: 4px; }
                    .meta { font-size: 12px; color: #64748b; margin-top: 6px; }
                    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
                    .kpi-card { background: #FAF9F6; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; }
                    .kpi-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
                    .kpi-value { font-size: 18px; font-weight: 800; color: #0A2A1B; margin-top: 2px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #0A2A1B; }
                    .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 12px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">Jovy's Flowershop</div>
                    <div class="subtitle">MONTHLY PRODUCT SALES BREAKDOWN & PERFORMANCE REPORT</div>
                    <div class="meta">Period: ${formattedTitle} • Category: ${selectedCategory.toUpperCase()} • Occasion: ${selectedOccasion.toUpperCase()} • Generated: ${new Date().toLocaleString('en-PH')}</div>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-title">Total Filtered Revenue</div>
                        <div class="kpi-value">₱${monthStats.totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-title">Total Units Sold</div>
                        <div class="kpi-value">${monthStats.totalUnits} items</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-title">Top Performing Arrangement</div>
                        <div class="kpi-value" style="font-size: 14px;">${monthStats.topProduct?.name || 'N/A'}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Arrangement Name</th>
                            <th>Category</th>
                            <th>Occasions</th>
                            <th style="text-align: center;">Units Sold</th>
                            <th style="text-align: right;">Unit Price</th>
                            <th style="text-align: right;">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#94a3b8;">No product sales recorded in this period.</td></tr>'}
                    </tbody>
                </table>

                <div class="footer">
                    <div>Generated by Store Manager / Inventory Lead</div>
                    <div>Page 1 of 1</div>
                </div>

            </body>
            </html>
        `;

        printWindow.addEventListener('load', () => printWindow.print(), { once: true });
        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (!month) return null;

    return (
        <section
            id="monthly-product-breakdown-section"
            className="bg-white border-2 border-[#0A2A1B]/15 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-300 relative transition-all"
        >
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#0A2A1B]/10">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0A2A1B] text-white shadow-2xs">
                            <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                            {formattedTitle}
                        </span>
                        <span className="text-xs font-semibold text-[#0A2A1B]/60">
                            • Sales Per Product & Top Sellers
                        </span>
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0A2A1B] tracking-tight">
                        Product Sales Breakdown — {formattedTitle}
                    </h3>
                    <p className="text-xs text-[#0A2A1B]/60">
                        Detailed breakdown of all floral arrangements ordered in <strong>{formattedTitle}</strong>, sorted by top sellers.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                    <button
                        type="button"
                        onClick={handlePrintReport}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#FAF9F6] text-[#0A2A1B] hover:bg-[#0A2A1B] hover:text-white rounded-xl border border-[#0A2A1B]/10 cursor-pointer transition-colors shadow-2xs active:scale-95"
                        title="Print Monthly Product Breakdown Report"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Report</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0A2A1B]/70 hover:text-[#0A2A1B] hover:bg-[#0A2A1B]/5 rounded-xl border border-[#0A2A1B]/10 cursor-pointer transition-colors"
                        title="Close breakdown section"
                    >
                        <XIcon className="w-4 h-4 text-[#0A2A1B]/60" />
                        <span>Dismiss</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-[#FAF9F6] border border-[#0A2A1B]/10 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider block">
                            Filtered Revenue
                        </span>
                        <span className="text-lg font-bold font-mono text-[#0A2A1B]">
                            ₱{monthStats.totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#0A2A1B]/5 text-[#0A2A1B] flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-[#D97706]" />
                    </div>
                </div>

                <div className="bg-[#FAF9F6] border border-[#0A2A1B]/10 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider block">
                            Units Sold
                        </span>
                        <span className="text-lg font-bold font-mono text-[#0A2A1B]">
                            {monthStats.totalUnits} items
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#0A2A1B]/5 text-[#0A2A1B] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-[#0A2A1B]" />
                    </div>
                </div>

                <div className="bg-[#FAF9F6] border border-[#0A2A1B]/10 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider block">
                            #1 Bestseller
                        </span>
                        <span className="text-xs font-bold text-[#0A2A1B] truncate max-w-[170px] block" title={monthStats.topProduct?.name || 'N/A'}>
                            {monthStats.topProduct ? monthStats.topProduct.name : 'N/A'}
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4 text-[#D97706]" />
                    </div>
                </div>
            </div>

            {/* Clickable Category & Occasion Filters (Two Distinct Rows) */}
            <div className="bg-[#FAF9F6] border border-[#0A2A1B]/10 p-4 rounded-2xl space-y-3.5">
                {/* Row 1: Occasion Pills */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0A2A1B]">
                            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                            <span>Occasion Filter:</span>
                            <span className="text-[11px] font-normal text-[#0A2A1B]/60">(Click to view Birthday, Anniversary, etc.)</span>
                        </div>
                        {selectedOccasion !== 'all' && (
                            <button
                                type="button"
                                onClick={() => setSelectedOccasion('all')}
                                className="text-[11px] font-bold text-[#D97706] hover:underline cursor-pointer"
                            >
                                Clear Occasion
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedOccasion('all')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedOccasion === 'all'
                                ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                : 'bg-white text-[#0A2A1B]/70 border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/30 hover:text-[#0A2A1B]'
                                }`}
                        >
                            All Occasions
                        </button>
                        {OCCASION_OPTIONS.map(occ => (
                            <button
                                key={occ}
                                type="button"
                                onClick={() => setSelectedOccasion(occ)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedOccasion.toLowerCase() === occ.toLowerCase()
                                    ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                    : 'bg-white text-[#0A2A1B]/70 border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/30 hover:text-[#0A2A1B]'
                                    }`}
                            >
                                {occ}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#0A2A1B]/5" />

                {/* Row 2: Flower Category Pills */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0A2A1B]">
                            <Filter className="w-3.5 h-3.5 text-[#0A2A1B]" />
                            <span>Flower Category:</span>
                            <span className="text-[11px] font-normal text-[#0A2A1B]/60">(Click to view Bouquets, Classic Roses, etc.)</span>
                        </div>
                        {selectedCategory !== 'all' && (
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                className="text-[11px] font-bold text-[#D97706] hover:underline cursor-pointer"
                            >
                                Clear Category
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedCategory === 'all'
                                ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                : 'bg-white text-[#0A2A1B]/70 border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/30 hover:text-[#0A2A1B]'
                                }`}
                        >
                            All Categories
                        </button>
                        {CATEGORY_OPTIONS.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedCategory.toLowerCase() === cat.toLowerCase()
                                    ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                    : 'bg-white text-[#0A2A1B]/70 border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/30 hover:text-[#0A2A1B]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Breakdown Table */}
            <div className="border border-[#0A2A1B]/10 rounded-2xl overflow-hidden shadow-2xs bg-white">
                {isLoading ? (
                    <div className="p-6 space-y-3">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-[#FAF9F6] border-b border-[#0A2A1B]/10 text-[#0A2A1B]/70 uppercase tracking-wider font-bold">
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4">Arrangement & Occasions</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4 text-right">Unit Price</th>
                                    <th className="py-3 px-4 text-right">Units Sold</th>
                                    <th className="py-3 px-4 text-right">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#0A2A1B]/5">
                                {filteredProducts.map((prod, index) => {
                                    const rank = index + 1;
                                    return (
                                        <tr
                                            key={prod.id}
                                            className="hover:bg-[#FAF9F6]/80 transition-colors group"
                                        >
                                            {/* Rank Badge */}
                                            <td className="py-3 px-4 text-center font-bold">
                                                {rank === 1 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black shadow-xs">
                                                        1
                                                    </span>
                                                ) : rank === 2 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-[11px] font-black shadow-xs">
                                                        2
                                                    </span>
                                                ) : rank === 3 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 text-[11px] font-black">
                                                        3
                                                    </span>
                                                ) : (
                                                    <span className="text-[#0A2A1B]/40 font-mono text-[11px]">
                                                        #{rank}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Product Name, Thumbnail, and Occasion Badges */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {prod.image ? (
                                                        <img
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            className="w-11 h-11 object-cover rounded-xl border border-[#0A2A1B]/10 shrink-0 bg-slate-100 shadow-2xs"
                                                            onError={(e) => {
                                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-xl border border-[#0A2A1B]/10 shrink-0 bg-[#FAF9F6] flex items-center justify-center text-[#0A2A1B]/30">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1 min-w-0">
                                                        <div className="font-bold text-[#0A2A1B] text-sm group-hover:text-[#D97706] transition-colors truncate">
                                                            {prod.name}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {prod.occasions && prod.occasions.length > 0 ? (
                                                                prod.occasions.map((occ: string) => (
                                                                    <span
                                                                        key={occ}
                                                                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${selectedOccasion.toLowerCase() === occ.toLowerCase()
                                                                            ? 'bg-[#D97706] text-white'
                                                                            : 'bg-[#0A2A1B]/5 text-[#0A2A1B]/70'
                                                                            }`}
                                                                    >
                                                                        {occ}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[10px] text-[#0A2A1B]/40 italic">
                                                                    Standard
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="py-3 px-4">
                                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${selectedCategory.toLowerCase() === prod.category.toLowerCase()
                                                    ? 'bg-[#0A2A1B] text-white'
                                                    : 'bg-[#FAF9F6] border border-[#0A2A1B]/10 text-[#0A2A1B]/80'
                                                    }`}>
                                                    {prod.category}
                                                </span>
                                            </td>

                                            {/* Unit Price */}
                                            <td className="py-3 px-4 text-right font-mono text-[#0A2A1B]/70 font-semibold">
                                                {prod.price ? `₱${prod.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                            </td>

                                            {/* Units Sold */}
                                            <td className="py-3 px-4 text-right">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#0A2A1B]/5 text-[#0A2A1B]">
                                                    {prod.units_sold} {prod.units_sold === 1 ? 'unit' : 'units'}
                                                </span>
                                            </td>

                                            {/* Revenue */}
                                            <td className="py-3 px-4 text-right font-mono font-bold text-[#0A2A1B] text-sm">
                                                ₱{prod.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#0A2A1B]/5 flex items-center justify-center text-[#0A2A1B]/40">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-[#0A2A1B]">No products found for this filter</h4>
                            <p className="text-xs text-[#0A2A1B]/60 max-w-sm">
                                No sales matching the selected category and occasion were recorded in {formattedTitle}.
                            </p>
                        </div>
                        {(selectedOccasion !== 'all' || selectedCategory !== 'all') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedOccasion('all');
                                    setSelectedCategory('all');
                                }}
                                className="px-3.5 py-1.5 text-xs font-bold bg-[#0A2A1B] text-white rounded-xl cursor-pointer hover:bg-[#0A2A1B]/90 transition-colors shadow-2xs"
                            >
                                Reset Category & Occasion Filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
