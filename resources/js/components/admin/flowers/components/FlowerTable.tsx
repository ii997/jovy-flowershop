import { useMemo } from 'react';
import { Flower } from '../../../../types';
import { Pagination } from '../../../Pagination';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    PaginationState,
} from '@tanstack/react-table';
import { AlertTriangle } from 'reicon-react';
import { FlowersTabMeta } from '../types';

interface FlowerTableProps {
    data: Flower[];
    isAdmin: boolean;
    selectedIds: number[];
    toggleSelect: (id: number) => void;
    toggleSelectAll: () => void;
    editPrices: Record<number, string>;
    setEditPrices: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    editUnitTypes: Record<number, string>;
    setEditUnitTypes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    editSizes: Record<number, string>;
    setEditSizes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    editBundleQtys: Record<number, string>;
    setEditBundleQtys: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    editBundlePrices: Record<number, string>;
    setEditBundlePrices: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    editQtys: Record<number, string>;
    setEditQtys: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    handleSaveFlower: (flower: Flower) => void;
    handleToggleAvailability: (flower: Flower) => void;
    isSaving: boolean;
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
}

const columnHelper = createColumnHelper<Flower>();

export function FlowerTable({
    data,
    isAdmin,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    editPrices,
    setEditPrices,
    editUnitTypes,
    setEditUnitTypes,
    editSizes,
    setEditSizes,
    editBundleQtys,
    setEditBundleQtys,
    editBundlePrices,
    setEditBundlePrices,
    editQtys,
    setEditQtys,
    handleSaveFlower,
    handleToggleAvailability,
    isSaving,
    pagination,
    setPagination,
}: FlowerTableProps) {
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'select',
            header: info => {
                const meta = info.table.options.meta as FlowersTabMeta;
                if (!meta.isAdmin) return null;
                const isAllSelected = data.length > 0 && meta.selectedIds.length === data.length;
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
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                if (!meta.isAdmin) return null;
                const isChecked = meta.selectedIds.includes(f.id);
                return (
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => meta.toggleSelect(f.id)}
                            className="w-4 h-4 rounded text-[#0A2A1B] focus:ring-[#D97706] border-[#0A2A1B]/20 cursor-pointer"
                        />
                    </div>
                );
            },
        }),
        columnHelper.accessor('name', {
            header: 'Flower Name & Variant',
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                const currentSize = meta.editSizes[f.id] !== undefined ? meta.editSizes[f.id] : (f.size ?? '');
                const isLow = f.available && f.quantity > 0 && f.quantity <= 10;
                const isOut = !f.available || f.quantity === 0;

                return (
                    <div className="flex flex-col gap-1.5 py-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0A2A1B] capitalize">{f.name}</span>
                            {isLow && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                                    Low Stock ({f.quantity})
                                </span>
                            )}
                            {isOut && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    Out of Stock
                                </span>
                            )}
                        </div>
                        {meta.isAdmin ? (
                            <input
                                type="text"
                                value={currentSize}
                                onChange={e => meta.setEditSizes(prev => ({ ...prev, [f.id]: e.target.value }))}
                                placeholder="Size variant (e.g. Medium)"
                                className="w-28 px-2 py-0.5 bg-white border border-[#0A2A1B]/15 rounded-lg text-[10px] text-[#0A2A1B] focus:outline-none focus:border-[#D97706] shadow-2xs"
                            />
                        ) : (
                            f.size && (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-[#0A2A1B]/5 text-[#0A2A1B]/70 rounded-md w-max">
                                    {f.size}
                                </span>
                            )
                        )}
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'unitType',
            header: 'Unit Type',
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                const currentUnitType = meta.editUnitTypes[f.id] !== undefined ? meta.editUnitTypes[f.id] : (f.unit_type ?? 'stem');
                return (
                    <select
                        value={currentUnitType}
                        onChange={e => meta.setEditUnitTypes(prev => ({ ...prev, [f.id]: e.target.value }))}
                        disabled={!meta.isAdmin}
                        className="px-2.5 py-1.5 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75 shadow-2xs cursor-pointer"
                    >
                        <option value="stem">stem</option>
                        <option value="stick">stick</option>
                        <option value="kilo">kilo</option>
                    </select>
                );
            },
        }),
        columnHelper.display({
            id: 'unitPrice',
            header: 'Unit Price',
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                const currentPrice = meta.editPrices[f.id] !== undefined ? meta.editPrices[f.id] : f.price.toString();
                return (
                    <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[#0A2A1B]/60 font-semibold">₱</span>
                        <input
                            type="text"
                            value={currentPrice}
                            onChange={e => meta.setEditPrices(prev => ({ ...prev, [f.id]: e.target.value }))}
                            disabled={!meta.isAdmin}
                            className="w-20 px-2 py-1.5 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs font-bold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75 shadow-2xs"
                        />
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'bundlePricing',
            header: 'Bundle Rule',
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                const bQty = meta.editBundleQtys[f.id] !== undefined ? meta.editBundleQtys[f.id] : (f.bundle_qty ? f.bundle_qty.toString() : '');
                const bPrice = meta.editBundlePrices[f.id] !== undefined ? meta.editBundlePrices[f.id] : (f.bundle_price ? f.bundle_price.toString() : '');

                return (
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <input
                            type="text"
                            value={bQty}
                            onChange={e => meta.setEditBundleQtys(prev => ({ ...prev, [f.id]: e.target.value }))}
                            placeholder="Qty"
                            disabled={!meta.isAdmin}
                            className="w-11 px-1.5 py-1.5 bg-white border border-[#0A2A1B]/15 rounded-xl text-center text-xs font-bold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75 shadow-2xs"
                        />
                        <span className="text-[#0A2A1B]/60 text-[11px]">for ₱</span>
                        <input
                            type="text"
                            value={bPrice}
                            onChange={e => meta.setEditBundlePrices(prev => ({ ...prev, [f.id]: e.target.value }))}
                            placeholder="Price"
                            disabled={!meta.isAdmin}
                            className="w-16 px-1.5 py-1.5 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs font-bold font-mono text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75 shadow-2xs"
                        />
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'quantity',
            header: 'Stock Count',
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                const currentQty = meta.editQtys[f.id] !== undefined ? meta.editQtys[f.id] : f.quantity.toString();
                return (
                    <input
                        type="text"
                        value={currentQty}
                        onChange={e => meta.setEditQtys(prev => ({ ...prev, [f.id]: e.target.value }))}
                        disabled={!meta.isAdmin}
                        className="w-16 px-2 py-1.5 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs font-bold font-mono text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75 shadow-2xs"
                    />
                );
            },
        }),
        columnHelper.display({
            id: 'availability',
            header: () => <div className="text-center">Status & Actions</div>,
            cell: info => {
                const f = info.row.original;
                const meta = info.table.options.meta as FlowersTabMeta;
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => meta.handleToggleAvailability(f)}
                            disabled={!meta.isAdmin}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all ${
                                meta.isAdmin ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'
                            } ${f.available
                                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                                : 'bg-rose-50 border border-rose-300 text-rose-800'
                            }`}
                        >
                            {f.available ? 'In Stock' : 'Out of Stock'}
                        </button>
                        {meta.isAdmin && (
                            <button
                                onClick={() => meta.handleSaveFlower(f)}
                                disabled={meta.isSaving}
                                className="px-3 py-1.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
                            >
                                Save
                            </button>
                        )}
                    </div>
                );
            },
        }),
    ], [data, toggleSelectAll]);

    const table = useReactTable({
        data,
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
            editPrices,
            editUnitTypes,
            editSizes,
            editBundleQtys,
            editBundlePrices,
            editQtys,
            handleSaveFlower,
            handleToggleAvailability,
            isSaving,
            setEditSizes,
            setEditUnitTypes,
            setEditPrices,
            setEditBundleQtys,
            setEditBundlePrices,
            setEditQtys,
        } satisfies FlowersTabMeta,
    });

    return (
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
                                <td key={cell.id} className="py-4 px-4">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-[#0A2A1B]/50 font-medium">
                                No flowers found matching current search/filter criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Pagination
                currentPage={table.getState().pagination.pageIndex + 1}
                totalItems={data.length}
                perPage={pagination.pageSize}
                onPageChange={(page) => table.setPageIndex(page - 1)}
            />
        </div>
    );
}
