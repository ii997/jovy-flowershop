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
import { DollarSign, ShieldCheck, ShoppingBag } from 'reicon-react';

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
        recent_orders: Order[];
        revenue_tracking?: {
            paid: number;
            pending: number;
        };
        top_products?: {
            id: number;
            name: string;
            count: number;
        }[];
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
}

export function DashboardTab({ stats, isLoading = false }: DashboardTabProps) {
    const [trendPeriod, setTrendPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    // 1. Transaction Trends Chart Configuration
    const trendDataList = stats.trends?.[trendPeriod] || [];
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
                borderColor: '#D97706',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
            }
        ]
    };

    const trendChartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                grid: { color: 'rgba(10, 42, 27, 0.05)' },
                ticks: { color: '#0A2A1B', font: { size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#0A2A1B', font: { size: 9 } }
            }
        }
    };

    // 2. Top Products Chart Configuration
    const topProducts = stats.top_products || [];
    const topProductLabels = topProducts.map(p => p.name);
    const topProductCounts = topProducts.map(p => p.count);

    const topProductsChartData = {
        labels: topProductLabels,
        datasets: [
            {
                label: 'Units Ordered',
                data: topProductCounts,
                backgroundColor: '#0A2A1B',
                borderRadius: 4,
            }
        ]
    };

    const topProductsChartOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { color: 'rgba(10, 42, 27, 0.05)' },
                ticks: { color: '#0A2A1B', font: { size: 10 } }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#0A2A1B', font: { size: 10 } }
            }
        }
    };

    return (
        <div className="space-y-8 select-none">
            {/* Core Metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/20 p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300 flex justify-between items-start group">
                    <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/50 tracking-wider">Gross Sales</span>
                        <h4 className="text-2xl font-extrabold text-[#0A2A1B]">₱{stats.gross_sales.toFixed(2)}</h4>
                    </div>
                    <div className="p-2 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-xl text-[#0A2A1B] group-hover:bg-[#0A2A1B]/5 transition-colors">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/20 p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300 flex justify-between items-start group">
                    <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/50 tracking-wider">Collected Revenue</span>
                        <h4 className="text-2xl font-extrabold text-[#0A2A1B]">₱{(stats.revenue_tracking?.paid ?? 0).toFixed(2)}</h4>
                    </div>
                    <div className="p-2 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-xl text-green-600 group-hover:bg-green-50 transition-colors">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/20 p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300 flex justify-between items-start group">
                    <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/50 tracking-wider">Total Transactions</span>
                        <h4 className="text-2xl font-extrabold text-[#0A2A1B]">{stats.total_orders}</h4>
                    </div>
                    <div className="p-2 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-xl text-[#0A2A1B]/70 group-hover:bg-[#0A2A1B]/5 transition-colors">
                        <ShoppingBag className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Sales Trends Chart and customer pattern cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart.js Line Trend Graph */}
                <div className="lg:col-span-2 bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-sm space-y-4 hover:border-[#0A2A1B]/20 transition-all duration-300">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-[#0A2A1B]/50 uppercase tracking-wider">Transaction Trends</h3>
                        <div className="flex bg-[#FAF9F6] border border-[#0A2A1B]/10 p-0.5 rounded-lg text-[10px] font-bold">
                            {(['daily', 'monthly', 'yearly'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setTrendPeriod(p)}
                                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                                        trendPeriod === p
                                            ? 'bg-[#0A2A1B] text-white'
                                            : 'text-[#0A2A1B]/70 hover:text-[#0A2A1B]'
                                    }`}
                                >
                                    {p.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-64">
                        {trendAmounts.length > 0 ? (
                            <Line data={trendChartData} options={trendChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#0A2A1B]/50">
                                No sales data recorded yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer ordering patterns details */}
                <div className="bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 hover:border-[#0A2A1B]/20 transition-all duration-300">
                    <h3 className="text-xs font-bold text-[#0A2A1B]/50 uppercase tracking-wider">Ordering Insights</h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        <div className="border-b border-[#0A2A1B]/5 pb-3">
                            <span className="text-[10px] font-bold text-[#0A2A1B]/60 block uppercase">Average Order Size</span>
                            <span className="text-2xl font-extrabold text-[#0A2A1B]">₱{(stats.patterns?.average_order_size ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="border-b border-[#0A2A1B]/5 pb-3">
                            <span className="text-[10px] font-bold text-[#0A2A1B]/60 block uppercase">Total Client Base</span>
                            <span className="text-2xl font-extrabold text-[#0A2A1B]">{stats.patterns?.total_customers ?? 0} registered clients</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[#0A2A1B]/60 block uppercase">Pending Collection</span>
                            <span className="text-2xl font-extrabold text-[#D97706]">₱{(stats.revenue_tracking?.pending ?? 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Most frequently ordered arrangements */}
            <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-[#0A2A1B]/50 uppercase tracking-wider">Top 10 arrangements</h3>
                <div className="h-64">
                        {topProductCounts.length > 0 ? (
                            <Bar data={topProductsChartData} options={topProductsChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#0A2A1B]/50">
                                No product sales recorded yet.
                            </div>
                        )}
                    </div>
                </div>

            {/* Recent Orders queue list table */}
            <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-[#0A2A1B]/50 uppercase tracking-wider">Recent Orders</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#0A2A1B]/5 text-[#0A2A1B]/60 uppercase tracking-wider text-[10px] font-bold">
                                <th className="py-3 px-4">Order ID</th>
                                <th className="py-3 px-4">Recipient</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Pickup Date</th>
                                <th className="py-3 px-4 text-right">Total Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]/85">
                            {stats.recent_orders.map((o: any) => (
                                <tr key={o.id} className="hover:bg-[#FAF9F6]">
                                    <td className="py-3.5 px-4 font-bold">#JFS-{o.id}</td>
                                    <td className="py-3.5 px-4">{o.recipient_name}</td>
                                    <td className="py-3.5 px-4">
                                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${o.order_type === 'purchase'
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'
                                            }`}>
                                            {o.order_type === 'purchase' ? 'Purchase' : 'Reservation'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4">{o.pickup_date}</td>
                                    <td className="py-3.5 px-4 text-right font-semibold">₱{parseFloat(o.total_price).toFixed(2)}</td>
                                </tr>
                            ))}
                            {stats.recent_orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-[#0A2A1B]/50">No recent orders.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
