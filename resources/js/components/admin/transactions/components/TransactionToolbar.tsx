import { Search, Download, Printer } from 'reicon-react';
import { TransactionDateFilter } from '../types';

interface TransactionToolbarProps {
    globalFilter: string;
    setGlobalFilter: (val: string) => void;
    dateQuickFilter: TransactionDateFilter;
    setDateQuickFilter: (val: TransactionDateFilter) => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    methodFilter: string;
    setMethodFilter: (val: string) => void;
    onExportCSV: () => void;
    onPrintCashUpSlip: () => void;
}

export function TransactionToolbar({
    globalFilter,
    setGlobalFilter,
    dateQuickFilter,
    setDateQuickFilter,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    onExportCSV,
    onPrintCashUpSlip,
}: TransactionToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-3xl border border-[#0A2A1B]/10 shadow-xs">
            {/* Left Controls: Search & Date Tabs */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search Input */}
                <div className="relative min-w-[240px] flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A2A1B]/40" />
                    <input
                        type="text"
                        value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)}
                        placeholder="Search ref #, name, phone, order #..."
                        className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-2xl text-xs text-[#0A2A1B] placeholder-[#0A2A1B]/40 focus:outline-none focus:border-[#D97706] transition-colors"
                    />
                </div>

                {/* Date Horizon Filter Tabs */}
                <div className="flex items-center bg-[#FAF9F6] p-1 rounded-2xl border border-[#0A2A1B]/10">
                    {(['all', 'today', 'week', 'month'] as const).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setDateQuickFilter(tab)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                dateQuickFilter === tab
                                    ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                    : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                            }`}
                        >
                            {tab === 'all' && 'All Time'}
                            {tab === 'today' && 'Today'}
                            {tab === 'week' && 'This Week'}
                            {tab === 'month' && 'This Month'}
                        </button>
                    ))}
                </div>

                {/* Status Dropdown */}
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-2xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                    <option value="all">All Statuses</option>
                    <option value="verified">Verified Paid</option>
                    <option value="awaiting">Needs Review</option>
                    <option value="pending">Pending Proof</option>
                    <option value="failed">Failed / Rejected</option>
                </select>

                {/* Method Dropdown */}
                <select
                    value={methodFilter}
                    onChange={e => setMethodFilter(e.target.value)}
                    className="px-3 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-2xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                    <option value="all">All Channels</option>
                    <option value="gcash">GCash</option>
                    <option value="downpayment">Downpayment</option>
                    <option value="online">Online Payment</option>
                </select>
            </div>

            {/* Right Controls: Actions */}
            <div className="flex items-center gap-2 justify-end">
                <button
                    type="button"
                    onClick={onExportCSV}
                    className="px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#0A2A1B] hover:text-white border border-[#0A2A1B]/15 text-[#0A2A1B] text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                </button>

                <button
                    type="button"
                    onClick={onPrintCashUpSlip}
                    className="px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#0A2A1B] hover:text-white border border-[#0A2A1B]/15 text-[#0A2A1B] text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Cash-Up Slip</span>
                </button>
            </div>
        </div>
    );
}
