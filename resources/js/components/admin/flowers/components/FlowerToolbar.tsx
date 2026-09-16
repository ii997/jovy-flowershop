import { Search, Add } from 'reicon-react';
import { FlowerUnitFilter, FlowerStockFilter } from '../types';

interface FlowerToolbarProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    unitFilter: FlowerUnitFilter;
    setUnitFilter: (val: FlowerUnitFilter) => void;
    stockFilter: FlowerStockFilter;
    setStockFilter: (val: FlowerStockFilter) => void;
    isAdmin: boolean;
    onOpenAddModal: () => void;
}

export function FlowerToolbar({
    searchQuery,
    setSearchQuery,
    unitFilter,
    setUnitFilter,
    stockFilter,
    setStockFilter,
    isAdmin,
    onOpenAddModal,
}: FlowerToolbarProps) {
    return (
        <div className="space-y-4">
            {/* Header Action Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#0A2A1B]/10 rounded-3xl p-5 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Stem Inventory & Pricing</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#0A2A1B] mt-0.5">Raw Flower Catalog</h3>
                    <p className="text-xs text-[#0A2A1B]/60">Manage raw stems, size variants, bundle discount tiers, and real-time inventory.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onOpenAddModal}
                        className="px-5 py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                    >
                        <Add className="w-4 h-4" />
                        <span>Add Flower Item</span>
                    </button>
                )}
            </div>

            {/* Search & Filter Strip */}
            <div className="bg-white border border-[#0A2A1B]/10 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A2A1B]/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search flower by name or size..."
                        className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-2xl text-xs text-[#0A2A1B] placeholder-[#0A2A1B]/40 focus:outline-none focus:border-[#D97706] transition-colors"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Unit Type Filter */}
                    <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-xl border border-[#0A2A1B]/10 text-[11px] font-bold">
                        {(['all', 'stem', 'stick', 'kilo'] as const).map(u => (
                            <button
                                key={u}
                                onClick={() => setUnitFilter(u)}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer capitalize ${
                                    unitFilter === u
                                        ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                        : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                }`}
                            >
                                {u === 'all' ? 'All Units' : u}
                            </button>
                        ))}
                    </div>

                    {/* Stock Status Filter */}
                    <select
                        value={stockFilter}
                        onChange={e => setStockFilter(e.target.value as FlowerStockFilter)}
                        className="px-3 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                    >
                        <option value="all">All Stock Statuses</option>
                        <option value="in_stock">In Stock Only</option>
                        <option value="low_stock">Low Stock (≤ 10)</option>
                        <option value="out_of_stock">Out of Stock Only</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
