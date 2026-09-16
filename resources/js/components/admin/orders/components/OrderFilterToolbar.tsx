import { Search } from 'reicon-react';
import { DateQuickFilter, UrgencyFilter, OrderSortBy, OrderSortOrder } from '../types';

interface OrderFilterToolbarProps {
    orderSearch: string;
    setOrderSearch: (val: string) => void;
    dateQuickFilter: DateQuickFilter;
    setDateQuickFilter: (val: DateQuickFilter) => void;
    urgencyFilter: UrgencyFilter;
    setUrgencyFilter: (val: UrgencyFilter) => void;
    selectedStatusFilter: string;
    setSelectedStatusFilter: (val: string) => void;
    selectedPaymentFilter: string;
    setSelectedPaymentFilter: (val: string) => void;
    orderSortBy: OrderSortBy;
    setOrderSortBy: (val: OrderSortBy) => void;
    orderSortOrder: OrderSortOrder;
    setOrderSortOrder: (val: OrderSortOrder) => void;
    filteredCount: number;
}

export function OrderFilterToolbar({
    orderSearch,
    setOrderSearch,
    dateQuickFilter,
    setDateQuickFilter,
    urgencyFilter,
    setUrgencyFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedPaymentFilter,
    setSelectedPaymentFilter,
    orderSortBy,
    setOrderSortBy,
    orderSortOrder,
    setOrderSortOrder,
    filteredCount,
}: OrderFilterToolbarProps) {
    return (
        <div className="space-y-3.5">
            {/* Date Range & Urgency Quick Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#0A2A1B]/10 rounded-2xl shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/50 px-2">Pickup Date:</span>
                    {(['all', 'today', 'tomorrow', 'week', 'past'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setDateQuickFilter(tab)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                dateQuickFilter === tab
                                    ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                    : 'bg-[#FAF9F6] text-[#0A2A1B]/70 hover:bg-[#0A2A1B]/5 hover:text-[#0A2A1B]'
                            }`}
                        >
                            {tab === 'all' && 'All Dates'}
                            {tab === 'today' && 'Today Only'}
                            {tab === 'tomorrow' && 'Tomorrow'}
                            {tab === 'week' && 'Next 7 Days'}
                            {tab === 'past' && 'Past Dates'}
                        </button>
                    ))}

                    <span className="text-[#0A2A1B]/20 mx-1 hidden sm:inline">|</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/50 px-2">Priority:</span>
                    {(
                        [
                            { id: 'all', label: 'All' },
                            { id: 'urgent', label: '⚡ Any Urgent' },
                            { id: 'funeral', label: '🕊️ Funeral' },
                            { id: 'birthday', label: '🎂 Birthday' },
                        ] as const
                    ).map(item => (
                        <button
                            key={item.id}
                            onClick={() => setUrgencyFilter(item.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                urgencyFilter === item.id
                                    ? item.id === 'funeral'
                                        ? 'bg-purple-800 text-white shadow-2xs'
                                        : item.id === 'birthday'
                                        ? 'bg-amber-700 text-white shadow-2xs'
                                        : 'bg-[#D97706] text-white shadow-2xs'
                                    : 'bg-[#FAF9F6] text-[#0A2A1B]/70 hover:bg-[#0A2A1B]/5 hover:text-[#0A2A1B]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="text-[11px] font-semibold text-[#0A2A1B]/60 px-2">
                    Showing <strong className="text-[#0A2A1B]">{filteredCount}</strong> matching orders
                </div>
            </div>

            {/* Multi-Dimensional Filter & Search Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 border border-[#0A2A1B]/10 rounded-2xl shadow-xs">
                {/* Multi-Field Search Input */}
                <div className="relative sm:col-span-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A2A1B]/40" />
                    <input
                        type="text"
                        placeholder="Search by #JFS ID, recipient name, phone, or Ref #..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs text-[#0A2A1B] placeholder-[#0A2A1B]/40 focus:outline-none focus:border-[#D97706] transition-colors"
                    />
                </div>

                {/* Fulfillment Status Filter */}
                <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                    <option value="active">Active Orders (Confirmed + Preparing)</option>
                    <option value="All">All Fulfillment Statuses</option>
                    <option value="confirmed">Confirmed Only</option>
                    <option value="preparing">Preparing Only</option>
                    <option value="delivered">Delivered / Completed</option>
                    <option value="cancelled">Cancelled Only</option>
                </select>

                {/* Payment Status Filter */}
                <select
                    value={selectedPaymentFilter}
                    onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                    className="px-3 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                    <option value="All">All Payment Statuses</option>
                    <option value="awaiting_verification">Needs Verification</option>
                    <option value="verified">Verified Paid</option>
                    <option value="pending">Pending Proof</option>
                    <option value="failed">Failed / Rejected</option>
                    <option value="refunded">Refunded</option>
                </select>

                {/* Order Type & Sort Options */}
                <select
                    value={`${orderSortBy}-${orderSortOrder}`}
                    onChange={(e) => {
                        const [by, order] = e.target.value.split('-') as [OrderSortBy, OrderSortOrder];
                        setOrderSortBy(by);
                        setOrderSortOrder(order);
                    }}
                    className="px-3 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                    <option value="urgency-desc">🚨 Priority: Urgent Orders First</option>
                    <option value="date-desc">Pickup: Sooner First</option>
                    <option value="date-asc">Pickup: Later First</option>
                    <option value="id-desc">Newest Order ID First</option>
                    <option value="price-desc">Total: Highest First</option>
                    <option value="price-asc">Total: Lowest First</option>
                </select>
            </div>
        </div>
    );
}
