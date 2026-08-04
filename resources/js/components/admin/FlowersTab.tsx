import { useState, useMemo } from 'react';
import { Flower } from '../../types';
import { Pagination } from '../Pagination';
import { FlowersTabSkeleton } from '../ui/Skeleton';
import { toast } from '../ui/Toast';
import { useAddFlower, useUpdateFlower } from '../../lib/adminQueries';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';

interface FlowersTabProps {
    flowers: Flower[];
    onFlowersChange?: (updated: Flower[]) => void;
    isAdmin: boolean;
    isLoading?: boolean;
}

const columnHelper = createColumnHelper<Flower>();

export function FlowersTab({ flowers, onFlowersChange, isAdmin, isLoading = false }: FlowersTabProps) {
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newQty, setNewQty] = useState('');
    const [addError, setAddError] = useState('');
    const [editPrices, setEditPrices] = useState<Record<number, string>>({});
    const [editQtys, setEditQtys] = useState<Record<number, string>>({});
    const [rowError, setRowError] = useState('');
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });

    const addFlowerMutation = useAddFlower();
    const updateFlowerMutation = useUpdateFlower();

    const showRowError = (message: string) => {
        setRowError(message);
        setTimeout(() => setRowError(''), 4000);
    };

    const handleAdd = async () => {
        setAddError('');
        const price = parseFloat(newPrice);
        const qty = parseInt(newQty);
        if (!newName.trim() || isNaN(price) || price < 0 || isNaN(qty) || qty < 0) {
            const errorMsg = 'Please fill in all fields with valid values.';
            setAddError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        try {
            const created: Flower = await addFlowerMutation.mutateAsync({ name: newName.trim(), price, quantity: qty });
            onFlowersChange?.([...flowers, created]);
            setNewName('');
            setNewPrice('');
            setNewQty('');
            toast.success(`Flower "${created.name}" added successfully!`);
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to add flower.';
            setAddError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleSaveFlower = async (flower: Flower) => {
        const price = parseFloat(editPrices[flower.id]?.toString() ?? flower.price.toString());
        const qty = parseInt(editQtys[flower.id]?.toString() ?? flower.quantity.toString());
        if (isNaN(price) || price < 0 || isNaN(qty) || qty < 0) {
            const errorMsg = 'Please enter a valid price and quantity.';
            showRowError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        try {
            const updated: Flower = await updateFlowerMutation.mutateAsync({
                ...flower,
                price,
                quantity: qty,
            });
            onFlowersChange?.(flowers.map(f => f.id === updated.id ? updated : f));
            toast.success(`Updated "${updated.name}" inventory successfully!`);
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to save flower. Please try again.';
            showRowError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleToggleAvailability = async (flower: Flower) => {
        try {
            const updated: Flower = await updateFlowerMutation.mutateAsync({
                ...flower,
                available: !flower.available,
            });
            onFlowersChange?.(flowers.map(f => f.id === updated.id ? updated : f));
            toast.success(`"${updated.name}" is now ${updated.available ? 'In Stock' : 'Out of Stock'}.`);
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to toggle availability. Please try again.';
            showRowError(errorMsg);
            toast.error(errorMsg);
        }
    };

    /** Table meta shape — provides fresh callback/state references to stable column cells */
    interface FlowersTabMeta {
        isAdmin: boolean;
        editPrices: Record<number, string>;
        editQtys: Record<number, string>;
        handleSaveFlower: (flower: Flower) => void;
        handleToggleAvailability: (flower: Flower) => void;
        isSaving: boolean;
    }

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Flower',
            cell: info => <span className="font-semibold text-sm text-[#0A2A1B] capitalize">{info.getValue()}</span>,
        }),
        columnHelper.display({
            id: 'unitPrice',
            header: 'Unit Price',
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                const currentPrice = meta.editPrices[f.id] !== undefined ? meta.editPrices[f.id] : f.price.toString();
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#0A2A1B]/60 font-medium">₱</span>
                        <input
                            type="text"
                            value={currentPrice}
                            onChange={e => setEditPrices(prev => ({ ...prev, [f.id]: e.target.value }))}
                            disabled={!meta.isAdmin}
                            className="w-16 px-1.5 py-1 bg-white border border-[#0A2A1B]/15 rounded-lg text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75"
                        />
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'quantity',
            header: 'Quantity',
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                const currentQty = meta.editQtys[f.id] !== undefined ? meta.editQtys[f.id] : f.quantity.toString();
                return (
                    <input
                        type="text"
                        value={currentQty}
                        onChange={e => setEditQtys(prev => ({ ...prev, [f.id]: e.target.value }))}
                        disabled={!meta.isAdmin}
                        className="w-16 px-1.5 py-1 bg-white border border-[#0A2A1B]/15 rounded-lg text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75"
                    />
                );
            },
        }),
        columnHelper.display({
            id: 'availability',
            header: () => <div className="text-center">Availability</div>,
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => meta.handleToggleAvailability(f)}
                            disabled={!meta.isAdmin}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                                meta.isAdmin ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'
                            } ${f.available
                                ? 'bg-green-100 border border-green-200 text-green-700'
                                : 'bg-red-100 border border-red-200 text-red-700'
                            }`}
                        >
                            {f.available ? 'In Stock' : 'Out of Stock'}
                        </button>
                        {meta.isAdmin && (
                            <button
                                onClick={() => meta.handleSaveFlower(f)}
                                disabled={meta.isSaving}
                                className="px-2.5 py-1 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
                            >
                                Save
                            </button>
                        )}
                    </div>
                );
            },
        }),
    ], []);  // stable — deps provided via table meta, read at render time

    const table = useReactTable({
        data: flowers,
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
            editPrices,
            editQtys,
            handleSaveFlower,
            handleToggleAvailability,
            isSaving: updateFlowerMutation.isPending,
        } satisfies FlowersTabMeta,
    });

    if (isLoading) {
        return <FlowersTabSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Add Flower Form */}
            {isAdmin && (
                <div className="bg-white border border-[#0A2A1B]/5 rounded-2xl p-4 shadow-sm">
                    <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block mb-3">Add New Flower</span>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[10px] font-semibold text-[#0A2A1B]/60 block mb-1">Flower Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="e.g. Roses"
                                className="w-full px-3.5 py-2 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-[10px] font-semibold text-[#0A2A1B]/60 block mb-1">Unit Price</label>
                            <input
                                type="text"
                                value={newPrice}
                                onChange={e => setNewPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3.5 py-2 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-[10px] font-semibold text-[#0A2A1B]/60 block mb-1">Quantity</label>
                            <input
                                type="text"
                                value={newQty}
                                onChange={e => setNewQty(e.target.value)}
                                placeholder="0"
                                className="w-full px-3.5 py-2 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={addFlowerMutation.isPending}
                            className="px-5 py-2 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 text-white text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95"
                        >
                            {addFlowerMutation.isPending ? 'Adding...' : 'Add Flower'}
                        </button>
                    </div>
                    {addError && <p className="text-red-600 text-xs mt-2">{addError}</p>}
                </div>
            )}

            {/* Save/Toggle Error */}
            {rowError && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-2">{rowError}</p>
            )}

            {/* Flowers TanStack Table */}
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
                        {flowers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-[#0A2A1B]/50 font-medium">
                                    No flowers added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <Pagination
                    currentPage={table.getState().pagination.pageIndex + 1}
                    totalItems={flowers.length}
                    perPage={8}
                    onPageChange={(page) => table.setPageIndex(page - 1)}
                />
            </div>
        </div>
    );
}
