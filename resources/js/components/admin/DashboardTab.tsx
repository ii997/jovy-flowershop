import { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Order } from '../../types';
import { DashboardSkeleton } from '../ui/Skeleton';
import { getOrderUrgency } from './orders/utils';
import {
    DollarSign,
    ShieldCheck,
    ShoppingBag,
    TrendUp,
    Calendar,
    Users,
    Leaf,
    Clock,
    Package,
    ArrowRight
} from 'reicon-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardTabProps {
    stats: {
        gross_sales: number;
        total_orders: number;
        active_listings?: number;
        recent_orders: Order[];
        revenue_tracking?: {
            paid: number;
            pending: number;
        };
        top_products?: {
            id: number;
            name: string;
            count: number;
            revenue?: number;
        }[];
        occasions_breakdown?: Record<string, number>;
        seasons_breakdown?: Record<string, number>;
        trends?: {
            daily: { date: string; total: string; count: number }[];
            monthly: { month: string; total: string; count: number }[];
            yearly: { year: string; total: string; count: number }[];
        };
        patterns?: {
            average_order_size: number;
            repeat_rate: number;
            total_customers: number;
        };
    };
    isLoading?: boolean;
    onViewAllOrders?: () => void;
}

// Global stable plugin for drawing end labels on horizontal bar chart
const endLabelPlugin = {
    id: 'endLabelPlugin',
    afterDatasetsDraw(chart: any) {
        const { ctx, data } = chart;
        const dataset = data.datasets[0];
        const extraData = dataset?.extraData || [];
        chart.getDatasetMeta(0).data.forEach((bar: any, index: number) => {
            const count = dataset.data[index] ?? 0;
            const revenue = extraData[index]?.revenue;
            const revenueText = revenue !== undefined && revenue > 0 ? ` · ₱${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
            const text = `${count} ${count === 1 ? 'order' : 'orders'}${revenueText}`;

            ctx.save();
            ctx.font = '600 11px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#4A5568';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, bar.x + 8, bar.y);
            ctx.restore();
        });
    }
};

export function DashboardTab({ stats, isLoading = false, onViewAllOrders }: DashboardTabProps) {
    const [trendPeriod, setTrendPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    // 1. Transaction Trends Chart Configuration
    const trendDataList = stats?.trends?.[trendPeriod] || [];
    const trendLabels = trendDataList.map((item: any) => {
        if (trendPeriod === 'daily') return item.date;
        if (trendPeriod === 'monthly') return item.month;
        return item.year;
    });
    const trendAmounts = trendDataList.map(item => parseFloat(item.total) || 0);

    const trendChartData = {
        labels: trendLabels,
        datasets: [
            {
                label: 'Sales Revenue (₱ PHP)',
                data: trendAmounts,
                borderColor: '#0A2A1B',
                backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(10, 42, 27, 0.05)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(10, 42, 27, 0.16)');
                    gradient.addColorStop(0.7, 'rgba(217, 119, 6, 0.04)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    return gradient;
                },
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#D97706',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };

    const trendChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0A2A1B',
                titleFont: { size: 11, family: 'Montserrat, sans-serif' },
                bodyFont: { size: 12, weight: 'bold' as const },
                padding: 12,
                cornerRadius: 10,
                displayColors: false,
                callbacks: {
                    label: (context: any) => ` Revenue: ₱${parseFloat(context.parsed.y).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(10, 42, 27, 0.04)' },
                ticks: {
                    maxTicksLimit: 5,
                    color: '#718096',
                    font: { size: 10 },
                    callback: (value: any) => `₱${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#718096', font: { size: 10 } }
            }
        }
    };

    // 2. Top Products Horizontal Bar Chart Configuration
    const topProducts = stats?.top_products || [];
    const topProductLabels = topProducts.map(p => p.name);
    const topProductCounts = topProducts.map(p => p.count);

    const topProductsChartData = {
        labels: topProductLabels,
        datasets: [
            {
                label: 'Units Ordered',
                data: topProductCounts,
                extraData: topProducts,
                backgroundColor: '#0A2A1B',
                hoverBackgroundColor: '#D97706',
                borderRadius: 9999,
                maxBarThickness: 16,
                barThickness: 14,
            }
        ]
    };

    const topProductsChartOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                right: 150,
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0A2A1B',
                titleFont: { size: 11, family: 'Montserrat, sans-serif' },
                bodyFont: { size: 12, weight: 'bold' as const },
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context: any) => {
                        const idx = context.dataIndex;
                        const p = topProducts[idx];
                        const count = context.parsed.x;
                        const revStr = p?.revenue !== undefined ? ` · ₱${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
                        return ` ${count} ${count === 1 ? 'order' : 'orders'}${revStr}`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(10, 42, 27, 0.04)' },
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    color: '#718096',
                    font: { size: 11 },
                }
            },
            y: {
                grid: { display: false },
                ticks: {
                    color: '#0A2A1B',
                    font: { size: 11, weight: 'bold' as const }
                }
            }
        }
    };

    // Calculate total occasions volume for percentage indicators
    const occasionsData = stats?.occasions_breakdown || {};
    const occasionsList = Object.entries(occasionsData)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);
    const totalOccasionsCount = occasionsList.reduce((sum, [_, c]) => sum + c, 0);

    return (
        <div className="space-y-8 select-none">
            {/* Header Welcome / Command Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#0A2A1B]/5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0A2A1B]/5 text-[#0A2A1B]">
                            <Leaf className="w-3 h-3 text-[#D97706]" />
                            Executive Overview
                        </span>
                        <span className="text-xs text-[#0A2A1B]/50">• Live Florist Metrics</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A2A1B] mt-1 tracking-tight">
                        Store Analytics & Performance
                    </h1>
                </div>

                {/* Operations Quick Pill Strip */}
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0A2A1B]/70 bg-white px-3 py-1.5 rounded-2xl border border-[#0A2A1B]/10 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Online Store Live</span>
                    </div>
                    {stats?.active_listings !== undefined && (
                        <>
                            <span className="text-[#0A2A1B]/20">|</span>
                            <span>{stats.active_listings} Active Catalog Items</span>
                        </>
                    )}
                </div>
            </div>

            {/* Core Metrics Grid - 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Gross Sales */}
                <div className="relative overflow-hidden bg-white border border-[#0A2A1B]/10 p-5 rounded-3xl shadow-xs hover:border-[#0A2A1B]/25 hover:shadow-sm transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider block">
                                Gross Sales
                            </span>
                            <h4 className="text-2xl lg:text-3xl font-bold text-[#0A2A1B] font-mono tracking-tight">
                                ₱{(stats?.gross_sales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h4>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-[#0A2A1B]/5 text-[#0A2A1B] flex items-center justify-center shrink-0 group-hover:bg-[#0A2A1B] group-hover:text-white transition-colors duration-300">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#0A2A1B]/5 flex items-center gap-1.5 text-[11px] text-[#0A2A1B]/60 font-medium">
                        <TrendUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cumulative all-time revenue</span>
                    </div>
                </div>

                {/* Collected Revenue */}
                <div className="relative overflow-hidden bg-white border border-[#0A2A1B]/10 p-5 rounded-3xl shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-700/80 uppercase tracking-wider block">
                                Collected Revenue
                            </span>
                            <h4 className="text-2xl lg:text-3xl font-bold text-emerald-900 font-mono tracking-tight">
                                ₱{(stats?.revenue_tracking?.paid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h4>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#0A2A1B]/5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Verified paid transactions</span>
                    </div>
                </div>

                {/* Pending Collection */}
                <div className="relative overflow-hidden bg-white border border-[#0A2A1B]/10 p-5 rounded-3xl shadow-xs hover:border-amber-300 hover:shadow-sm transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-700/80 uppercase tracking-wider block">
                                Pending Collection
                            </span>
                            <h4 className="text-2xl lg:text-3xl font-bold text-amber-900 font-mono tracking-tight">
                                ₱{(stats?.revenue_tracking?.pending ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h4>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#0A2A1B]/5 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Awaiting verification / pickup</span>
                    </div>
                </div>

                {/* Total Transactions */}
                <div className="relative overflow-hidden bg-white border border-[#0A2A1B]/10 p-5 rounded-3xl shadow-xs hover:border-[#0A2A1B]/25 hover:shadow-sm transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider block">
                                Total Orders
                            </span>
                            <h4 className="text-2xl lg:text-3xl font-bold text-[#0A2A1B] font-mono tracking-tight">
                                {stats?.total_orders ?? 0}
                            </h4>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center shrink-0 group-hover:bg-[#D97706] group-hover:text-white transition-colors duration-300">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#0A2A1B]/5 flex items-center gap-1.5 text-[11px] text-[#0A2A1B]/60 font-medium">
                        <Package className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>All orders fulfilled & active</span>
                    </div>
                </div>
            </div>

            {/* Sales Trends Chart and Customer Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Trend Graph */}
                <div className="lg:col-span-2 bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-xs space-y-4 hover:border-[#0A2A1B]/20 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Revenue Analysis</span>
                            <h3 className="font-serif text-lg font-bold text-[#0A2A1B]">Transaction & Sales Trends</h3>
                        </div>
                        <div className="inline-flex bg-[#FAF9F6] p-1 rounded-xl border border-[#0A2A1B]/10 text-[11px] font-bold self-start sm:self-auto">
                            {(['daily', 'monthly', 'yearly'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setTrendPeriod(p)}
                                    className={`px-3.5 py-1 rounded-lg transition-all cursor-pointer ${
                                        trendPeriod === p
                                            ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                            : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                    }`}
                                >
                                    {p.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-68 pt-2">
                        {trendAmounts.length > 0 ? (
                            <Line data={trendChartData} options={trendChartOptions} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-xs text-[#0A2A1B]/40 gap-2">
                                <Calendar className="w-6 h-6 text-[#0A2A1B]/20" />
                                <span>No sales transactions recorded yet for this period.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer Ordering Insights Column */}
                <div className="bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-[#0A2A1B]/20 transition-all duration-300">
                    <div>
                        <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Customer Intelligence</span>
                        <h3 className="font-serif text-lg font-bold text-[#0A2A1B] mb-4">Ordering Insights</h3>
                    </div>

                    <div className="flex-1 flex flex-col justify-around py-2 space-y-4">
                        <div className="bg-[#FAF9F6] border border-[#0A2A1B]/5 p-4 rounded-2xl space-y-1">
                            <span className="text-[11px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider block">Average Basket Value</span>
                            <div className="text-2xl font-bold text-[#0A2A1B] font-mono">
                                ₱{(stats?.patterns?.average_order_size ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-[#0A2A1B]/50 block">Average spend per completed transaction</span>
                        </div>

                        <div className="bg-[#FAF9F6] border border-[#0A2A1B]/5 p-4 rounded-2xl space-y-1">
                            <span className="text-[11px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider block">Registered Client Base</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-[#0A2A1B] font-mono">
                                    {stats?.patterns?.total_customers ?? 0}
                                </span>
                                <span className="text-xs font-semibold text-[#0A2A1B]/60 font-sans">
                                    {(stats?.patterns?.total_customers ?? 0) === 1 ? 'registered customer' : 'registered customers'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#D97706] font-semibold">
                                <Users className="w-3.5 h-3.5" />
                                <span>Repeat order rate: {(stats?.patterns?.repeat_rate ?? 0).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row: Top 10 Arrangements & Occasions Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top 10 Arrangements Chart */}
                <div className="lg:col-span-2 bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-xs space-y-4 hover:border-[#0A2A1B]/20 transition-all duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Bestsellers</span>
                            <h3 className="font-serif text-lg font-bold text-[#0A2A1B]">Top 10 Floral Arrangements</h3>
                        </div>
                        <span className="text-xs text-[#0A2A1B]/50">Ranked by units sold</span>
                    </div>

                    <div className="h-68">
                        {topProductCounts.length > 0 ? (
                            <Bar 
                                data={topProductsChartData} 
                                options={topProductsChartOptions} 
                                plugins={[endLabelPlugin]}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#0A2A1B]/40">
                                No arrangement sales recorded yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Demand by Occasion Breakdown */}
                <div className="bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-xs flex flex-col hover:border-[#0A2A1B]/20 transition-all duration-300">
                    <div className="mb-4">
                        <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Demand Drivers</span>
                        <h3 className="font-serif text-lg font-bold text-[#0A2A1B]">Occasions Breakdown</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-68">
                        {occasionsList.length > 0 ? (
                            occasionsList.slice(0, 5).map(([occ, count], idx) => {
                                const percentage = totalOccasionsCount > 0 ? Math.round((count / totalOccasionsCount) * 100) : 0;
                                return (
                                    <div key={occ} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-[#0A2A1B] capitalize">{occ}</span>
                                            <span className="font-mono text-[#0A2A1B]/70 font-bold">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-[#0A2A1B]/5 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    idx === 0 ? 'bg-[#0A2A1B]' : idx === 1 ? 'bg-[#D97706]' : 'bg-emerald-600'
                                                }`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#0A2A1B]/40">
                                Occasion data will populate as orders are received.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Orders Queue Table */}
            <div className="bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-xs space-y-4 hover:border-[#0A2A1B]/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Live Queue</span>
                        <h3 className="font-serif text-lg font-bold text-[#0A2A1B]">Recent Incoming Orders</h3>
                    </div>
                    {onViewAllOrders && (
                        <button
                            onClick={onViewAllOrders}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A2A1B] hover:text-[#D97706] transition-colors cursor-pointer"
                        >
                            <span>View all orders</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#0A2A1B]/10 text-[#0A2A1B]/60 uppercase tracking-wider text-[10px] font-bold">
                                <th className="py-3 px-4">Order ID & Priority</th>
                                <th className="py-3 px-4">Recipient</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Pickup Date</th>
                                <th className="py-3 px-4 text-right">Total Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]">
                            {stats?.recent_orders?.map((o: any) => {
                                const urgency = getOrderUrgency(o);
                                return (
                                    <tr key={o.id} className={`hover:bg-[#FAF9F6] transition-colors ${urgency.type === 'funeral' ? 'bg-purple-50/20' : urgency.type === 'birthday' ? 'bg-amber-50/15' : ''}`}>
                                        <td className="py-3.5 px-4 font-mono font-bold text-[#0A2A1B]">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span>#JFS-{o.id}</span>
                                                {urgency.isUrgent && (
                                                    <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs ${urgency.badgeClass}`}>
                                                        <span>{urgency.icon}</span>
                                                        <span>{urgency.label}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-[#0A2A1B]">{o.recipient_name}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                                                o.order_type === 'purchase'
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                            }`}>
                                                {o.order_type === 'purchase' ? 'Direct Purchase' : 'Reservation'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-[#0A2A1B]/70 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                                                <span>{o.pickup_date}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0A2A1B]">
                                            ₱{parseFloat(o.total_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!stats?.recent_orders || stats.recent_orders.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-[#0A2A1B]/40">
                                        No recent orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

