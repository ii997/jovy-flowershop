import { useMemo } from 'react';
import { Product, User } from '../../types';
import { Pagination } from '../Pagination';
import { InventoryTabSkeleton } from '../ui/Skeleton';
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
    prices: Record<number, string>;
    onPriceChange: (productId: number, val: string) => void;
    onSavePrice: (productId: number) => void;
    onToggleAvailability: (productId: number) => void;
    onEditProduct: (product: Product) => void;
    onOpenCreateModal: () => void;
    isLoading?: boolean;
}

const columnHelper = createColumnHelper<Product>();

export function InventoryTab({
    user,
    products,
    prices,
    onPriceChange,
    onSavePrice,
    onToggleAvailability,
    onEditProduct,
    onOpenCreateModal,
    isLoading = false,
}: InventoryTabProps) {
    const isAdmin = user?.role === 'admin';

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Item',
            cell: info => {
                const p = info.row.original;
                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-xl border border-[#0A2A1B]/5"
                        />
                        <span className="font-semibold text-sm text-[#0A2A1B]">{p.name}</span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('category', {
            header: 'Category',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('dimensions', {
            header: 'Dimensions',
            cell: info => <span className="text-[#0A2A1B]/60 font-medium">{info.getValue()}</span>,
        }),
        columnHelper.display({
            id: 'priceOverride',
            header: 'Price Override',
            cell: info => {
                const p = info.row.original;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0A2A1B]/60">₱</span>
                        <input
                            type="text"
                            value={prices[p.id] !== undefined ? prices[p.id] : p.price.toString()}
                            onChange={(e) => onPriceChange(p.id, e.target.value)}
                            disabled={!isAdmin}
                            className="w-16 px-2 py-1 bg-white border border-[#0A2A1B]/15 rounded-lg text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                        {isAdmin && (
                            <button
                                onClick={() => onSavePrice(p.id)}
                                className="px-2.5 py-1 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
                            >
                                Save
                            </button>
                        )}
                    </div>
                );
            },
        }),
        columnHelper.accessor('availability', {
            header: () => <div className="text-center">Stock Status</div>,
            cell: info => {
                const p = info.row.original;
                return (
                    <div className="text-center">
                        <button
                            onClick={() => onToggleAvailability(p.id)}
                            disabled={!isAdmin}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                                isAdmin ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-80'
                            } ${p.availability
                                    ? 'bg-green-100 border border-green-200 text-green-700'
                                    : 'bg-red-100 border border-red-200 text-red-700'
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
                return (
                    <div className="text-right">
                        {isAdmin ? (
                            <button
                                onClick={() => onEditProduct(p)}
                                className="px-3 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/15 hover:border-transparent hover:bg-[#D97706] hover:text-white text-[10px] font-bold rounded-full transition-all cursor-pointer active:scale-95"
                            >
                                Edit Details
                            </button>
                        ) : (
                            <span className="text-gray-400 font-medium italic text-[11px]">Read-only</span>
                        )}
                    </div>
                );
            },
        }),
    ], [isAdmin, prices, onPriceChange, onSavePrice, onToggleAvailability, onEditProduct]);

    const table = useReactTable({
        data: products,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 8,
            },
        },
    });

    if (isLoading) {
        return <InventoryTabSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center select-none">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-[#0A2A1B]">Inventory Catalog</h2>
                    <p className="text-xs text-[#0A2A1B]/60">Manage listed arrangements, modify prices, and update stock states</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onOpenCreateModal}
                        className="px-4 py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-semibold rounded-full transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                        + Add Arrangement
                    </button>
                )}
            </div>

            {/* Inventory TanStack Table */}
            <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="border-b border-[#0A2A1B]/5 text-[#0A2A1B]/60 uppercase tracking-wider text-[10px] font-bold">
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="py-3 px-4">
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
                    <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]/85">
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="hover:bg-[#FAF9F6]">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="py-4 px-4">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Pagination
                    currentPage={table.getState().pagination.pageIndex + 1}
                    totalItems={products.length}
                    perPage={8}
                    onPageChange={(page) => table.setPageIndex(page - 1)}
                />
            </div>
        </div>
    );
}
