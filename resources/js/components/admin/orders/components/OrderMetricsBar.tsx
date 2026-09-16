import { Clock, Calendar, Sparkles, Check, DollarSign } from 'reicon-react';
import { OrderMetrics, DateQuickFilter } from '../types';

interface OrderMetricsBarProps {
    metrics: OrderMetrics;
    totalOrdersCount: number;
    selectedPaymentFilter: string;
    setSelectedPaymentFilter: (val: string) => void;
    selectedStatusFilter: string;
    setSelectedStatusFilter: (val: string) => void;
    dateQuickFilter: DateQuickFilter;
    setDateQuickFilter: (val: DateQuickFilter) => void;
}

export function OrderMetricsBar({
    metrics,
    totalOrdersCount,
    selectedPaymentFilter,
    setSelectedPaymentFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    dateQuickFilter,
    setDateQuickFilter,
}: OrderMetricsBarProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Needs Payment Verification Card */}
            <div 
                onClick={() => { setSelectedPaymentFilter('awaiting_verification'); setSelectedStatusFilter('All'); }}
                className={`bg-white p-4 rounded-3xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                    selectedPaymentFilter === 'awaiting_verification' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-amber-200/80'
                }`}
            >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>Awaiting Payment</span>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-900 mt-1">{metrics.awaitingPayment}</div>
                <div className="text-[10px] text-amber-700/70 mt-0.5">Proof pending review</div>
            </div>

            {/* Today's Pickups Card */}
            <div 
                onClick={() => { setDateQuickFilter(dateQuickFilter === 'today' ? 'all' : 'today'); }}
                className={`bg-white p-4 rounded-3xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                    dateQuickFilter === 'today' ? 'border-[#D97706] ring-2 ring-[#D97706]/20 bg-[#D97706]/5' : 'border-[#0A2A1B]/10'
                }`}
            >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Today's Pickups</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#0A2A1B] mt-1">{metrics.todayPickups}</div>
                <div className="text-[10px] text-[#0A2A1B]/50 mt-0.5">Scheduled for today</div>
            </div>

            {/* In Preparation Card */}
            <div 
                onClick={() => { setSelectedStatusFilter('preparing'); setSelectedPaymentFilter('All'); }}
                className={`bg-white p-4 rounded-3xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                    selectedStatusFilter === 'preparing' ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20' : 'border-sky-200/80'
                }`}
            >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>In Preparation</span>
                </div>
                <div className="text-2xl font-bold font-mono text-sky-900 mt-1">{metrics.preparing}</div>
                <div className="text-[10px] text-sky-700/70 mt-0.5">On the florist bench</div>
            </div>

            {/* Ready / Delivered Card */}
            <div 
                onClick={() => { setSelectedStatusFilter('delivered'); setSelectedPaymentFilter('All'); }}
                className={`bg-white p-4 rounded-3xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                    selectedStatusFilter === 'delivered' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-emerald-200/80'
                }`}
            >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fulfilled / Ready</span>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">{metrics.delivered}</div>
                <div className="text-[10px] text-emerald-700/70 mt-0.5">Completed orders</div>
            </div>

            {/* Total Active Volume */}
            <div className="bg-white p-4 rounded-3xl border border-[#0A2A1B]/10 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-[#0A2A1B]" />
                    <span>Active Pipeline</span>
                </div>
                <div className="text-xl font-bold font-mono text-[#0A2A1B] mt-1">
                    ₱{metrics.totalActiveVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-[#0A2A1B]/50 mt-0.5">{totalOrdersCount} total lifetime orders</div>
            </div>
        </div>
    );
}
