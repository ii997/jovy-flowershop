import { useMemo } from 'react';
import { 
    createColumnHelper, 
    flexRender, 
    getCoreRowModel, 
    getPaginationRowModel, 
    getFilteredRowModel, 
    useReactTable 
} from '@tanstack/react-table';
import { 
    CreditCard, 
    Money, 
    Copy, 
    Check, 
    Eye, 
    Receipt, 
    ChevronLeft, 
    ChevronRight 
} from 'reicon-react';
import { FlattenedTransaction } from '../types';
import { handleCopyReference } from '../utils';

interface TransactionTableProps {
    data: FlattenedTransaction[];
    onPreviewReceipt: (img: string) => void;
    onSelectTransaction: (tx: FlattenedTransaction) => void;
}

export function TransactionTable({
    data,
    onPreviewReceipt,
    onSelectTransaction,
}: TransactionTableProps) {
    const columnHelper = createColumnHelper<FlattenedTransaction>();

    const columns = useMemo(() => [
        columnHelper.accessor('created_at', {
            header: 'Date & Time',
            cell: info => {
                const date = new Date(info.getValue());
                return (
                    <div className="flex flex-col text-xs py-1">
                        <span className="font-bold text-[#0A2A1B]">
                            {date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-[#0A2A1B]/50 font-mono">
                            {date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('order_id', {
            header: 'Order ID',
            cell: info => (
                <span className="font-mono font-bold text-xs text-[#0A2A1B]">
                    #JFS-{info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('customer_name', {
            header: 'Customer',
            cell: info => {
                const row = info.row.original;
                return (
                    <div className="flex flex-col text-xs">
                        <span className="font-bold text-[#0A2A1B]">{info.getValue()}</span>
                        {row.customer_phone && (
                            <span className="text-[10px] text-[#0A2A1B]/50 font-mono">{row.customer_phone}</span>
                        )}
                    </div>
                );
            },
        }),
        columnHelper.accessor('method', {
            header: 'Channel',
            cell: info => {
                const val = info.getValue();
                const isGcash = val.toLowerCase().includes('gcash') || val.toLowerCase().includes('online');
                return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isGcash ? 'bg-sky-50 text-sky-800 border border-sky-300' : 'bg-amber-50 text-amber-900 border border-amber-300'
                    }`}>
                        {isGcash ? <CreditCard className="h-3 w-3 text-sky-600" /> : <Money className="h-3 w-3 text-amber-600" />}
                        {val}
                    </span>
                );
            },
        }),
        columnHelper.accessor('reference_no', {
            header: 'Reference Number',
            cell: info => {
                const ref = info.getValue();
                return ref ? (
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#0A2A1B] bg-[#FAF9F6] border border-[#0A2A1B]/10 px-2 py-0.5 rounded-lg select-all">
                            {ref}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleCopyReference(ref)}
                            className="p-1 hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/40 hover:text-[#0A2A1B] rounded cursor-pointer transition-colors"
                            title="Copy reference number"
                        >
                            <Copy className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <span className="text-[11px] text-[#0A2A1B]/35 italic">No ref attached</span>
                );
            },
        }),
        columnHelper.accessor('amount', {
            header: 'Amount',
            cell: info => (
                <span className="font-mono font-bold text-sm text-[#0A2A1B]">
                    ₱{Number(info.getValue() || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            ),
        }),
        columnHelper.accessor('payment_status', {
            header: 'Status',
            cell: info => {
                const status = info.getValue();
                if (status === 'verified' || status === 'paid') {
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-full">
                            <Check className="h-3 w-3 text-emerald-600" /> Verified Paid
                        </span>
                    );
                }
                if (status === 'awaiting_verification' || status === 'awaiting') {
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-400 text-[10px] font-bold rounded-full animate-pulse">
                            Needs Review
                        </span>
                    );
                }
                if (status === 'failed' || status === 'rejected') {
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 text-[10px] font-bold rounded-full">
                            Failed / Rejected
                        </span>
                    );
                }
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold rounded-full">
                        Pending Proof
                    </span>
                );
            },
        }),
        columnHelper.accessor('receipt_image', {
            header: 'Proof',
            cell: info => {
                const img = info.getValue();
                return img ? (
                    <button
                        type="button"
                        onClick={() => onPreviewReceipt(img)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF9F6] hover:bg-[#D97706] hover:text-white border border-[#0A2A1B]/15 text-[#0A2A1B] text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                        <Eye className="h-3 w-3" />
                        <span>Preview</span>
                    </button>
                ) : (
                    <span className="text-[10px] text-[#0A2A1B]/35">None</span>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-right">Ledger</div>,
            cell: info => (
                <div className="text-right">
                    <button
                        type="button"
                        onClick={() => onSelectTransaction(info.row.original)}
                        className="p-1.5 hover:bg-[#0A2A1B]/5 rounded-xl text-[#0A2A1B]/60 hover:text-[#0A2A1B] transition-colors cursor-pointer"
                        title="View Full Ledger Details"
                    >
                        <Receipt className="h-4 w-4" />
                    </button>
                </div>
            ),
        }),
    ], [columnHelper, onPreviewReceipt, onSelectTransaction]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <div className="bg-white rounded-3xl border border-[#0A2A1B]/10 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="border-b border-[#0A2A1B]/10 bg-[#FAF9F6]/50">
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-4 py-3.5 text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-[#0A2A1B]/5">
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="hover:bg-[#FAF9F6]/70 transition-colors">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="px-4 py-3.5">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {table.getRowModel().rows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-12 text-[#0A2A1B]/40 text-xs">
                                    No financial transactions match the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* TanStack Pagination Controls */}
            {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#0A2A1B]/10 bg-[#FAF9F6]/30">
                    <span className="text-xs text-[#0A2A1B]/60">
                        Page <strong className="text-[#0A2A1B]">{table.getState().pagination.pageIndex + 1}</strong> of{' '}
                        <strong className="text-[#0A2A1B]">{table.getPageCount()}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="p-2 border border-[#0A2A1B]/10 rounded-xl hover:bg-white text-[#0A2A1B] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="p-2 border border-[#0A2A1B]/10 rounded-xl hover:bg-white text-[#0A2A1B] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
