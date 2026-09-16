import { DollarSign, Check, Clock, TrendUp } from 'reicon-react';
import { TransactionMetrics } from '../types';

interface TransactionMetricsBarProps {
    metrics: TransactionMetrics;
}

export function TransactionMetricsBar({ metrics }: TransactionMetricsBarProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Total Verified Gross */}
            <div className="bg-white p-4 rounded-3xl border border-[#0A2A1B]/10 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Gross</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#0A2A1B] mt-1">
                    ₱{metrics.totalVerifiedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-emerald-700/70 mt-0.5 font-medium">Reconciled funds</div>
            </div>

            {/* Awaiting Review Floating */}
            <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>Pending Verification</span>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                    ₱{metrics.totalPendingAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-amber-700/70 mt-0.5 font-medium">Unconfirmed receipts</div>
            </div>

            {/* Total Count */}
            <div className="bg-white p-4 rounded-3xl border border-[#0A2A1B]/10 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-[#0A2A1B]" />
                    <span>Total Volume</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#0A2A1B] mt-1">{metrics.totalCount}</div>
                <div className="text-[10px] text-[#0A2A1B]/50 mt-0.5">{metrics.gcashCount} GCash · {metrics.cashCount} In-Store</div>
            </div>

            {/* Average Order Value */}
            <div className="bg-white p-4 rounded-3xl border border-[#0A2A1B]/10 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                    <TrendUp className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Average Ticket</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#0A2A1B] mt-1">
                    ₱{metrics.avgTicket.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-[#0A2A1B]/50 mt-0.5">Per transaction mean</div>
            </div>
        </div>
    );
}
