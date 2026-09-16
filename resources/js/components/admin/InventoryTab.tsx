import { useMemo, useState } from 'react';
import { Product, User } from '../../types';
import { Pagination } from '../Pagination';
import { InventoryTabSkeleton } from '../ui/Skeleton';
import { toast } from '../ui/Toast';
import {
    Search,
    ShoppingBag,
    Check,
    Archive,
    DollarSign,
    Add,
    Edit,
    Filter
} from 'reicon-react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';

interface InventoryTabProps {
    user: User | null;
    products: Product[];
    onToggleAvailability: (productId: number) => void;
    onUpdateProducts?: (updatedProducts: Product[]) => void;
    onEditProduct: (product: Product) => void;
    onOpenCreateModal: () => void;
    isLoading?: boolean;
}

const columnHelper = createColumnHelper<Product>();

export function InventoryTab({
    user,
    products,
    onToggleAvailability,
    onUpdateProducts,
    onEditProduct,
    onOpenCreateModal,
    isLoading = false,
}: InventoryTabProps) {
    const isAdmin = user?.role === 'admin';

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkOperating, setIsBulkOperating] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });

    // Inventory Calculations
    const totalArrangements = products.length;
    const inStockCount = products.filter(p => p.availability).length;
    const outOfStockCount = products.filter(p => !p.availability).length;
    const averagePrice = totalArrangements > 0
        ? products.reduce((acc, p) => acc + (p.price || 0), 0) / totalArrangements
        : 0;

    // Available categories extracted from current products
    const categories = useMemo(() => {
        const set = new Set<string>();
        products.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set).sort();
    }, [products]);

    // Filtered Products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchesName = product.name.toLowerCase().includes(q);
                const matchesCategory = product.category?.toLowerCase().includes(q);
                const matchesDesc = product.description?.toLowerCase().includes(q);
                if (!matchesName && !matchesCategory && !matchesDesc) return false;
            }

            // Category filter
            if (selectedCategory !== 'all' && product.category !== selectedCategory) {
                return false;
            }

            // Stock filter
            if (stockFilter === 'in_stock' && !product.availability) return false;
            if (stockFilter === 'out_of_stock' && product.availability) return false;

            return true;
        });
    }, [products, searchQuery, selectedCategory, stockFilter]);

    // Bulk Selection Handlers
    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredProducts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProducts.map(p => p.id));
        }
    };

    const handleBulkAvailability = async (makeAvailable: boolean) => {
        const targets = products.filter(p => selectedIds.includes(p.id) && p.availability !== makeAvailable);
        if (targets.length === 0) {
            setSelectedIds([]);
            return;
        }

        setIsBulkOperating(true);
        // Optimistically update local state immediately so UI updates in real-time
        const targetIds = new Set(targets.map(t => t.id));
        const updatedList = products.map(p => targetIds.has(p.id) ? { ...p, availability: makeAvailable } : p);
        onUpdateProducts?.(updatedList);
        setSelectedIds([]);

        try {
            // Send requests for all targets
            await Promise.all(
                targets.map(t =>
                    fetch(`/api/admin/products/${t.id}/availability`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                    })
                )
            );
            toast.success(`Updated availability for ${targets.length} arrangement${targets.length > 1 ? 's' : ''}.`);
        } catch {
            toast.error('Failed to update some arrangements. Reverting state.');
            onUpdateProducts?.(products);
        } finally {
            setIsBulkOperating(false);
        }
    };

    /** Table meta shape */
    interface InventoryTabMeta {
        isAdmin: boolean;
        selectedIds: number[];
        toggleSelect: (id: number) => void;
        onToggleAvailability: (id: number) => void;
        onEditProduct: (p: Product) => void;
    }

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'select',
            header: info => {
                const meta = info.table.options.meta as InventoryTabMeta;
                if (!meta.isAdmin) return null;
                const isAllSelected = filteredProducts.length > 0 && meta.selectedIds.length === filteredProducts.length;
                return (
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded text-[#0A2A1B] focus:ring-[#D97706] border-[#0A2A1B]/20 cursor-pointer"
                        />
                    </div>
                );
            },
            cell: info => {
                const p = info.row.original;
                const meta = info.table.options.meta as InventoryTabMeta;
                if (!meta.isAdmin) return null;
                const isChecked = meta.selectedIds.includes(p.id);
                return (
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => meta.toggleSelect(p.id)}
                            className="w-4 h-4 rounded text-[#0A2A1B] focus:ring-[#D97706] border-[#0A2A1B]/20 cursor-pointer"
                        />
                    </div>
                );
            },
        }),
        columnHelper.accessor('name', {
            header: 'Arrangement',
            cell: info => {
                const p = info.row.original;
                return (
                    <div className="flex items-center gap-3.5 py-1">
                        <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-2xl border border-[#0A2A1B]/10 shadow-2xs shrink-0"
                            loading="lazy"
                        />
                        <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-sm text-[#0A2A1B] block truncate max-w-xs">{p.name}</span>
                            <span className="text-[11px] text-[#0A2A1B]/50 block truncate max-w-xs">{p.category}</span>
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.accessor('category', {
            header: 'Category',
            cell: info => (
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#0A2A1B]/5 text-[#0A2A1B]">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('price', {
            header: 'Price',
            cell: info => {
                const p = info.row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-mono font-bold text-sm text-[#0A2A1B]">
                            ₱{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {p.is_surge_applied && (
                            <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">
                                (2x Surge Active)
                            </span>
                        )}
                    </div>
                );
            },
        }),

        columnHelper.accessor('availability', {
            header: () => <div className="text-center">Stock Status</div>,
            cell: info => {
                const p = info.row.original;
                const meta = info.table.options.meta as InventoryTabMeta;
                return (
                    <div className="text-center">
                        <button
                            onClick={() => meta.onToggleAvailability(p.id)}
                            disabled={!meta.isAdmin}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all ${
                                meta.isAdmin ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-80'
                            } ${p.availability
                                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                                }`}
                        >
                            {p.availability ? 'In Stock' : 'Out of Stock'}
                        </button>
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: info => {
                const p = info.row.original;
                const meta = info.table.options.meta as InventoryTabMeta;
                return (
                    <div className="text-right">
                        {meta.isAdmin ? (
                            <button
                                onClick={() => meta.onEditProduct(p)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/15 hover:border-transparent hover:bg-[#D97706] hover:text-white text-[11px] font-bold text-[#0A2A1B] rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                            </button>
                        ) : (
                            <span className="text-[#0A2A1B]/40 font-medium italic text-[11px]">Read-only</span>
                        )}
                    </div>
                );
            },
        }),
    ], [filteredProducts]);

    const table = useReactTable({
        data: filteredProducts,
        columns,
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
        autoResetPageIndex: false,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        meta: {
            isAdmin,
            selectedIds,
            toggleSelect,
            onToggleAvailability,
            onEditProduct,
        } satisfies InventoryTabMeta,
    });

    if (isLoading) {
        return <InventoryTabSkeleton />;
    }

    return (
        <div className="space-y-6 select-none">
            {/* Top Catalog Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#0A2A1B]/10 p-4 rounded-3xl shadow-xs">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#0A2A1B]" />
                        <span>Catalog Items</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#0A2A1B] mt-1">{totalArrangements}</div>
                    <div className="text-[10px] text-[#0A2A1B]/50 mt-0.5">{categories.length} active bouquet categories</div>
                </div>

                <div className="bg-white border border-emerald-200/80 p-4 rounded-3xl shadow-xs">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Live on Storefront</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">{inStockCount}</div>
                    <div className="text-[10px] text-emerald-700/70 mt-0.5">Available for instant ordering</div>
                </div>

                <div className="bg-white border border-rose-200/80 p-4 rounded-3xl shadow-xs">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                        <Archive className="w-3.5 h-3.5 text-rose-600" />
                        <span>Out of Stock</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-rose-900 mt-1">{outOfStockCount}</div>
                    <div className="text-[10px] text-rose-700/70 mt-0.5">Hidden from active checkout</div>
                </div>

                <div className="bg-white border border-[#0A2A1B]/10 p-4 rounded-3xl shadow-xs">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                        <DollarSign className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Average Bouquet Price</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#0A2A1B] mt-1">
                        ₱{averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-[#0A2A1B]/50 mt-0.5">Catalog average listing value</div>
                </div>
            </div>

            {/* Header Action Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#0A2A1B]/10 rounded-3xl p-5 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Arrangement Catalog</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#0A2A1B] mt-0.5">Bouquet & Product Inventory</h3>
                    <p className="text-xs text-[#0A2A1B]/60">Manage floral arrangement listings, pricing, descriptions, and storefront visibility.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onOpenCreateModal}
                        className="px-5 py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                    >
                        <Add className="w-4 h-4" />
                        <span>Add Arrangement</span>
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
                        placeholder="Search arrangements by name or category..."
                        className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-2xl text-xs text-[#0A2A1B] placeholder-[#0A2A1B]/40 focus:outline-none focus:border-[#D97706] transition-colors"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Category Filter Dropdown */}
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="px-3 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Stock Status Filter */}
                    <select
                        value={stockFilter}
                        onChange={e => setStockFilter(e.target.value as any)}
                        className="px-3 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                    >
                        <option value="all">All Availability</option>
                        <option value="in_stock">In Stock Only</option>
                        <option value="out_of_stock">Out of Stock Only</option>
                    </select>
                </div>
            </div>

            {/* Bulk Action Toolbar */}
            {isAdmin && selectedIds.length > 0 && (
                <div className="bg-[#FAF9F6] border border-[#D97706]/40 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0A2A1B]">
                        <Filter className="w-4 h-4 text-[#D97706]" />
                        <span>{selectedIds.length} arrangement{selectedIds.length > 1 ? 's' : ''} selected</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={isBulkOperating}
                            onClick={() => handleBulkAvailability(true)}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                            {isBulkOperating ? 'Updating...' : 'Mark In-Stock'}
                        </button>
                        <button
                            type="button"
                            disabled={isBulkOperating}
                            onClick={() => handleBulkAvailability(false)}
                            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                            {isBulkOperating ? 'Updating...' : 'Mark Out-of-Stock'}
                        </button>
                    </div>
                </div>
            )}

            {/* Inventory TanStack Table */}
            <div className="bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="border-b border-[#0A2A1B]/10 text-[#0A2A1B]/60 uppercase tracking-wider text-[10px] font-bold">
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="py-3.5 px-4">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]">
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="hover:bg-[#FAF9F6] transition-colors">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="py-3.5 px-4">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-[#0A2A1B]/50 font-medium">
                                    No floral arrangements found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <Pagination
                    currentPage={table.getState().pagination.pageIndex + 1}
                    totalItems={filteredProducts.length}
                    perPage={8}
                    onPageChange={(page) => table.setPageIndex(page - 1)}
                />
            </div>
        </div>
    );
}

