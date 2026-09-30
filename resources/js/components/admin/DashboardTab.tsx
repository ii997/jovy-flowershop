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
import { MonthlyProductBreakdownModal } from './MonthlyProductBreakdownModal';
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
            yoy?: {
                month: string;
                month_num: string;
                [key: string]: any;
            }[];
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
    const [selectedYear, setSelectedYear] = useState<string>('2025');
    const [selectedMonthForModal, setSelectedMonthForModal] = useState<string | null>(null);
    const [yoyMetric, setYoyMetric] = useState<'sales' | 'orders'>('sales');

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatToShortMonth = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        const monthNum = parts.length > 1 ? parseInt(parts[1], 10) : parseInt(dateStr, 10);
        return shortMonths[monthNum - 1] || dateStr;
    };

    // Extract all distinct years available in data
    const monthlyRawList = stats?.trends?.monthly || [];
    const yearlyRawList = stats?.trends?.yearly || [];
    const detectedYears = Array.from(new Set([
        '2024',
        '2025',
        '2026',
        ...yearlyRawList.map((y: any) => String(y.year)),
        ...monthlyRawList.map((m: any) => m.month ? m.month.split('-')[0] : '')
    ])).filter(Boolean).sort();

    // 1. Transaction Trends Chart Configuration
    let trendLabels: string[] = [];
    let trendAmounts: number[] = [];
    let trendMonthKeys: string[] = []; // Store actual "YYYY-MM" for click handling

    if (trendPeriod === 'monthly') {
        if (selectedYear === 'all') {
            // All months sorted chronologically
            trendLabels = monthlyRawList.map((item: any) => `${formatToShortMonth(item.month)} '${item.month.split('-')[0].slice(-2)}`);
            trendAmounts = monthlyRawList.map((item: any) => parseFloat(item.total) || 0);
            trendMonthKeys = monthlyRawList.map((item: any) => item.month);
        } else {
            // Full Jan to Dec representation for the specific chosen year (e.g. Jan to Dec 2024 separate from 2025)
            trendLabels = [...shortMonths];
            trendMonthKeys = shortMonths.map((_, i) => `${selectedYear}-${String(i + 1).padStart(2, '0')}`);
            trendAmounts = trendMonthKeys.map(mKey => {
                const found = monthlyRawList.find((item: any) => item.month === mKey);
                return found ? parseFloat(found.total) || 0 : 0;
            });
        }
    } else if (trendPeriod === 'daily') {
        const dailyList = stats?.trends?.daily || [];
        trendLabels = dailyList.map((item: any) => formatToShortMonth(item.date));
        trendAmounts = dailyList.map((item: any) => parseFloat(item.total) || 0);
        trendMonthKeys = dailyList.map((item: any) => item.date ? item.date.slice(0, 7) : '');
    } else {
        // Yearly
        trendLabels = yearlyRawList.map((item: any) => String(item.year));
        trendAmounts = yearlyRawList.map((item: any) => parseFloat(item.total) || 0);
        trendMonthKeys = yearlyRawList.map((item: any) => String(item.year));
    }

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
        onHover: (event: any, chartElement: any[]) => {
            if (event.native?.target) {
                event.native.target.style.cursor = (chartElement.length > 0 && (trendPeriod === 'yearly' || trendPeriod === 'monthly')) ? 'pointer' : 'default';
            }
        },
        onClick: (_event: any, elements: any[]) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                if (trendPeriod === 'yearly') {
                    const clickedYear = trendLabels[index] || String(yearlyRawList[index]?.year);
                    if (clickedYear) {
                        setSelectedYear(clickedYear);
                        setTrendPeriod('monthly');
                    }
                } else if (trendPeriod === 'monthly') {
                    const monthKey = trendMonthKeys[index];
                    if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
                        setSelectedMonthForModal(monthKey);
                    }
                }
            }
        },
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
                    label: (context: any) => {
                        const val = parseFloat(context.parsed.y).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        if (trendPeriod === 'yearly') {
                            return ` Revenue: ₱${val} (Click to drill down into months)`;
                        }
                        if (trendPeriod === 'monthly') {
                            return ` Revenue: ₱${val} (Click to view products)`;
                        }
                        return ` Revenue: ₱${val}`;
                    }
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

    // YoY Multi-Year Comparison (2024, 2025, 2026) Configuration
    const yoyList = stats?.trends?.yoy || [];
    const yoyMonths = yoyList.length > 0 ? yoyList.map((y: any) => y.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const yoyData2024 = yoyList.map((y: any) => yoyMetric === 'sales' ? (y['2024_sales'] || 0) : (y['2024_orders'] || 0));
    const yoyData2025 = yoyList.map((y: any) => yoyMetric === 'sales' ? (y['2025_sales'] || 0) : (y['2025_orders'] || 0));
    const yoyData2026 = yoyList.map((y: any) => yoyMetric === 'sales' ? (y['2026_sales'] || 0) : (y['2026_orders'] || 0));

    const total2024 = yoyData2024.reduce((a: number, b: number) => a + b, 0);
    const total2025 = yoyData2025.reduce((a: number, b: number) => a + b, 0);
    const total2026 = yoyData2026.reduce((a: number, b: number) => a + b, 0);

    const growth2025 = total2024 > 0 ? (((total2025 - total2024) / total2024) * 100).toFixed(1) : '0';
    const growth2026 = total2025 > 0 ? (((total2026 - total2025) / total2025) * 100).toFixed(1) : '0';

    const yoyChartData = {
        labels: yoyMonths,
        datasets: [
            {
                label: '2024',
                data: yoyData2024,
                backgroundColor: 'rgba(148, 163, 184, 0.85)',
                borderColor: '#64748B',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.75,
                categoryPercentage: 0.75,
            },
            {
                label: '2025',
                data: yoyData2025,
                backgroundColor: 'rgba(217, 119, 6, 0.9)',
                borderColor: '#B45309',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.75,
                categoryPercentage: 0.75,
            },
            {
                label: '2026',
                data: yoyData2026,
                backgroundColor: 'rgba(10, 42, 27, 0.95)',
                borderColor: '#0A2A1B',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.75,
                categoryPercentage: 0.75,
            },
        ],
    };

    const yoyChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onHover: (event: any, chartElement: any[]) => {
            if (event.native?.target) {
                event.native.target.style.cursor = chartElement.length > 0 ? 'pointer' : 'default';
            }
        },
        onClick: (_event: any, elements: any[]) => {
            if (elements.length > 0) {
                const element = elements[0];
                const datasetIndex = element.datasetIndex;
                const dataIndex = element.index;
                const clickedYear = yoyChartData.datasets[datasetIndex]?.label;
                const monthNum = String(dataIndex + 1).padStart(2, '0');
                if (clickedYear && monthNum) {
                    setSelectedMonthForModal(`${clickedYear}-${monthNum}`);
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    boxWidth: 10,
                    boxHeight: 10,
                    usePointStyle: true,
                    font: { size: 11, weight: 'bold' as const },
                    color: '#0A2A1B',
                },
            },
            tooltip: {
                backgroundColor: '#0A2A1B',
                titleFont: { size: 11, family: 'Montserrat, sans-serif' },
                bodyFont: { size: 12, weight: 'bold' as const },
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: (context: any) => {
                        const val = context.parsed.y || 0;
                        if (yoyMetric === 'sales') {
                            return ` ${context.dataset.label}: ₱${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Click to view products)`;
                        }
                        return ` ${context.dataset.label}: ${val} orders (Click to view products)`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(10, 42, 27, 0.04)' },
                ticks: {
                    color: '#718096',
                    font: { size: 10 },
                    callback: (value: any) => yoyMetric === 'sales' ? (value >= 1000 ? `₱${(value / 1000).toFixed(0)}k` : `₱${value}`) : value,
                },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#718096', font: { size: 10 } },
            },
        },
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
                            <p className="text-[11px] text-[#0A2A1B]/50 mt-0.5">
                                {trendPeriod === 'monthly' ? (
                                    <span>Viewing <strong>{selectedYear === 'all' ? 'All Recorded Years' : `Jan to Dec ${selectedYear}`}</strong>. Click any month point to view products.</span>
                                ) : trendPeriod === 'yearly' ? (
                                    <span>Viewing <strong>Annual Totals</strong>. Click any year point to drill down into its monthly breakdown.</span>
                                ) : (
                                    <span>Track sales patterns across time.</span>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                            {/* Year Filter Pills for Monthly view */}
                            {trendPeriod === 'monthly' && (
                                <div className="inline-flex bg-[#FAF9F6] p-1 rounded-xl border border-[#0A2A1B]/10 text-[11px] font-bold">
                                    {detectedYears.map(yr => (
                                        <button
                                            key={yr}
                                            type="button"
                                            onClick={() => setSelectedYear(yr)}
                                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${selectedYear === yr
                                                ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                                : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                                }`}
                                        >
                                            {yr}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedYear('all')}
                                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${selectedYear === 'all'
                                            ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                            : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                            }`}
                                    >
                                        ALL
                                    </button>
                                </div>
                            )}

                            {/* Period Switcher (Daily / Monthly / Yearly) */}
                            <div className="inline-flex bg-[#FAF9F6] p-1 rounded-xl border border-[#0A2A1B]/10 text-[11px] font-bold">
                                {(['daily', 'monthly', 'yearly'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setTrendPeriod(p)}
                                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${trendPeriod === p
                                            ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                            : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                            }`}
                                    >
                                        {p.toUpperCase()}
                                    </button>
                                ))}
                            </div>
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

            {/* Multi-Year (2024 - 2026) Monthly Comparison Section */}
            <div className="bg-white border border-[#0A2A1B]/10 rounded-3xl p-6 shadow-xs space-y-5 hover:border-[#0A2A1B]/20 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Multi-Year Growth & Benchmarks</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                2024 · 2025 · 2026
                            </span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#0A2A1B] mt-0.5">Year-over-Year Monthly Performance</h3>
                        <p className="text-xs text-[#0A2A1B]/60">Compare monthly sales and order volume across years to identify seasonal peaks and growth patterns.</p>
                    </div>

                    {/* Metric Switcher: Sales vs Orders */}
                    <div className="inline-flex bg-[#FAF9F6] p-1 rounded-xl border border-[#0A2A1B]/10 text-[11px] font-bold self-start sm:self-auto shrink-0">
                        <button
                            type="button"
                            onClick={() => setYoyMetric('sales')}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${yoyMetric === 'sales'
                                ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                }`}
                        >
                            REVENUE (₱)
                        </button>
                        <button
                            type="button"
                            onClick={() => setYoyMetric('orders')}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${yoyMetric === 'orders'
                                ? 'bg-[#0A2A1B] text-white shadow-2xs'
                                : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                }`}
                        >
                            ORDERS (COUNT)
                        </button>
                    </div>
                </div>

                {/* Annual Comparison Snapshot KPI Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                    <div className="bg-[#FAF9F6] border border-slate-200 p-3.5 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">2024 Total</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">Baseline</span>
                        </div>
                        <div className="text-xl font-bold font-mono text-slate-800 mt-1">
                            {yoyMetric === 'sales' ? `₱${total2024.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${total2024} orders`}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Historical foundation</div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">2025 Total</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                {Number(growth2025) >= 0 ? `+${growth2025}%` : `${growth2025}%`} YoY
                            </span>
                        </div>
                        <div className="text-xl font-bold font-mono text-amber-900 mt-1">
                            {yoyMetric === 'sales' ? `₱${total2025.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${total2025} orders`}
                        </div>
                        <div className="text-[10px] text-amber-700/80 mt-0.5">Rapid store expansion</div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">2026 Total</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                {Number(growth2026) >= 0 ? `+${growth2026}%` : `${growth2026}%`} YoY
                            </span>
                        </div>
                        <div className="text-xl font-bold font-mono text-emerald-950 mt-1">
                            {yoyMetric === 'sales' ? `₱${total2026.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${total2026} orders`}
                        </div>
                        <div className="text-[10px] text-emerald-700/80 mt-0.5">Current fiscal performance</div>
                    </div>
                </div>

                {/* YoY Grouped Bar Chart */}
                <div className="h-72 pt-2">
                    <Bar data={yoyChartData} options={yoyChartOptions} />
                </div>

                <div className="text-[11px] text-[#0A2A1B]/60 bg-[#FAF9F6] p-3 rounded-xl border border-[#0A2A1B]/5 flex items-center gap-2">
                    <Leaf className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span><strong>Floral Seasonal Insights:</strong> Demand surges prominently in <strong>February</strong> (Valentine's Day season) and <strong>May</strong> (Mother's Day season) across all benchmarked years.</span>
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
                                                className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? 'bg-[#0A2A1B]' : idx === 1 ? 'bg-[#D97706]' : 'bg-emerald-600'
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
                                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${o.order_type === 'purchase'
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

            {/* Monthly Product Drill-Down Modal */}
            {selectedMonthForModal && (
                <MonthlyProductBreakdownModal
                    month={selectedMonthForModal}
                    onClose={() => setSelectedMonthForModal(null)}
                />
            )}
        </div>
    );
}

