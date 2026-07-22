import { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Order } from '../../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardTabProps {
    stats: {
        gross_sales: number;
        total_orders: number;
        active_listings: number;
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
}

export function DashboardTab({ stats }: DashboardTabProps) {
    const [trendPeriod, setTrendPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');

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

    // 3. Occasions & Seasons Doughnut Charts
    const occasionsBreakdown = stats.occasions_breakdown || {};
    const occasionsLabels = Object.keys(occasionsBreakdown);
    const occasionsValues = Object.values(occasionsBreakdown);

    const occasionsChartData = {
        labels: occasionsLabels,
        datasets: [
            {
                data: occasionsValues,
                backgroundColor: [
                    '#0A2A1B',
                    '#D97706',
                    '#F59E0B',
                    '#34D399',
                    '#10B981',
                ],
                borderWidth: 1,
            }
        ]
    };

    const seasonsBreakdown = stats.seasons_breakdown || {};
    const seasonsLabels = Object.keys(seasonsBreakdown);
    const seasonsValues = Object.values(seasonsBreakdown);

    const seasonsChartData = {
        labels: seasonsLabels,
        datasets: [
            {
                data: seasonsValues,
                backgroundColor: [
                    '#D97706',
                    '#F59E0B',
                    '#34D399',
                    '#0A2A1B',
                ],
                borderWidth: 1,
            }
        ]
    };

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#0A2A1B',
                    font: { size: 10 }
                }
            }
        }
    };

    return (
        <div className="space-y-8 select-none">
            <div>
                <h2 className="font-serif text-2xl font-bold text-[#0A2A1B]">Sales Analytics Dashboard</h2>
                <p className="text-xs text-[#0A2A1B]/60">Live updates mapping performance, collections, client demographics, and products</p>
            </div>

            {/* Core Metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/20 p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300 flex justify-between items-start group">
                    <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/50 tracking-wider">Gross Sales</span>
                        <h4 className="text-2xl font-extrabold text-[#0A2A1B]">₱{stats.gross_sales.toFixed(2)}</h4>
                        <p className="text-[10px] text-green-700 font-medium">Combined shop turnover</p>
                    </div>
                    <div className="p-2 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-xl text-[#0A2A1B] group-hover:bg-[#0A2A1B]/5 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/20 p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300 flex justify-between items-start group">
                    <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/50 tracking-wider">Collected Revenue</span>
                        <h4 className="text-2xl font-extrabold text-[#0A2A1B]">₱{(stats.revenue_tracking?.paid ?? 0).toFixed(2)}</h4>
                        <p className="text-[10px] text-green-600 font-medium">Payments validated successfully</p>
                    </div>
                    <div className="p-2 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-xl text-green-600 group-hover:bg-green-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/20 p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300 flex justify-between items-start group">
                    <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/50 tracking-wider">Total Transactions</span>
                        <h4 className="text-2xl font-extrabold text-[#0A2A1B]">{stats.total_orders}</h4>
                        <p className="text-[10px] text-[#0A2A1B]/60 font-medium">Total orders queue volume</p>
                    </div>
                    <div className="p-2 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-xl text-[#0A2A1B]/70 group-hover:bg-[#0A2A1B]/5 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white border border-[#0A2A1B]/10 hover:border-[#0A2A1B]/20 p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300 flex justify-between items-start group">
                    <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/50 tracking-wider">Customer Demographics</span>
                        <h4 className="text-2xl font-extrabold text-[#0A2A1B]">{(stats.patterns?.repeat_rate ?? 0).toFixed(1)}%</h4>
                        <p className="text-[10px] text-[#0A2A1B]/60 font-medium">Repeat purchase rate ratio</p>
                    </div>
                    <div className="p-2 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-xl text-[#D97706] group-hover:bg-[#D97706]/5 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
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

            {/* Most frequently ordered arrangements and target categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Horizontal Bar Chart top arrangements */}
                <div className="lg:col-span-2 bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm space-y-4">
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

                {/* Peaks analysis occasions and seasons breakdowns */}
                <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-[#0A2A1B]/50 uppercase tracking-wider">Category Analytics</h3>
                    <div className="grid grid-cols-2 gap-4 h-64 items-center">
                        <div className="space-y-2 text-center">
                            <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/60 block">Occasions</span>
                            {occasionsValues.length > 0 ? (
                                <div className="w-full max-h-48 flex justify-center">
                                    <Doughnut data={occasionsChartData} options={doughnutOptions} />
                                </div>
                            ) : (
                                <span className="text-[10px] text-[#0A2A1B]/50 italic block pt-8">No records</span>
                            )}
                        </div>
                        <div className="space-y-2 text-center">
                            <span className="text-[9px] uppercase font-bold text-[#0A2A1B]/60 block">Seasons</span>
                            {seasonsValues.length > 0 ? (
                                <div className="w-full max-h-48 flex justify-center">
                                    <Doughnut data={seasonsChartData} options={doughnutOptions} />
                                </div>
                            ) : (
                                <span className="text-[10px] text-[#0A2A1B]/50 italic block pt-8">No records</span>
                            )}
                        </div>
                    </div>
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
                                <th className="py-3 px-4">Delivery Date</th>
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
                                    <td className="py-3.5 px-4">{o.delivery_date}</td>
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
