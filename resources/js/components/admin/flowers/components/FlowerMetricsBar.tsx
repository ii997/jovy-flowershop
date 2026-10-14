import { Leaf, Check, AlertTriangle, Archive } from 'reicon-react';
import { FlowerMetrics, FlowerStockFilter } from '../types';

interface FlowerMetricsBarProps {
    metrics: FlowerMetrics;
    stockFilter: FlowerStockFilter;
    setStockFilter: (filter: FlowerStockFilter) => void;
}

export function FlowerMetricsBar({ metrics, stockFilter, setStockFilter }: FlowerMetricsBarProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#0A2A1B]/10 p-4 rounded-3xl shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#0A2A1B]/60 uppercase tracking-wider">
                    <Leaf className="w-3.5 h-3.5 text-[#0A2A1B]" />
                    <span>Varieties</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#0A2A1B] mt-1">{metrics.totalVarieties}</div>
                <div className="text-[10px] text-[#0A2A1B]/50 mt-0.5">{metrics.totalStemsVolume} total units cataloged</div>
            </div>

            <div className="bg-white border border-emerald-200/80 p-4 rounded-3xl shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Healthy Stock</span>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">{metrics.inStockCount}</div>
                <div className="text-[10px] text-emerald-700/70 mt-0.5">Ready for arrangement crafting</div>
            </div>

            <div className="bg-white border border-amber-200/80 p-4 rounded-3xl shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Low Stock Alerts</span>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-900 mt-1">{metrics.lowStockCount}</div>
                <div className="text-[10px] text-amber-700/70 mt-0.5">Remaining units ≤ 10</div>
            </div>

            <button
                type="button"
                onClick={() => setStockFilter('out_of_stock')}
                className={`text-left bg-white border p-4 rounded-3xl shadow-xs transition-all cursor-pointer active:scale-[0.98] ${stockFilter === 'out_of_stock'
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
                    : 'border-rose-200/80 hover:border-rose-400 hover:shadow-sm'
                }`}
                title="Show out-of-stock flower items"
            >
                <div className="flex items-center gap-2 text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    <Archive className="w-3.5 h-3.5 text-rose-600" />
                    <span>Out of Stock</span>
                </div>
                <div className="text-2xl font-bold font-mono text-rose-900 mt-1">{metrics.outOfStockCount}</div>
                <div className="text-[10px] text-rose-700/70 mt-0.5">Click to view items needing replenishment</div>
            </button>
        </div>
    );
}
