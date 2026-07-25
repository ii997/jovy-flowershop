import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-[#0A2A1B]/5 rounded-xl ${className}`}
            {...props}
        />
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_-1px_rgba(0,0,0,0.02)] border border-[#0A2A1B]/5 flex flex-col justify-between p-0 h-[440px]">
            {/* Image Placeholder */}
            <div className="relative aspect-square w-full bg-[#FAF9F6] animate-pulse overflow-hidden">
                <div className="absolute top-3 left-3 w-16 h-5 bg-[#0A2A1B]/10 rounded-full" />
            </div>

            {/* Details Container */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-3/5 rounded-lg" />
                        <Skeleton className="h-4 w-10 rounded-md" />
                    </div>

                    <div className="space-y-1.5 pt-1">
                        <Skeleton className="h-3.5 w-full rounded" />
                        <Skeleton className="h-3.5 w-4/5 rounded" />
                    </div>

                    <div className="space-y-1 pt-2">
                        <Skeleton className="h-2.5 w-1/2 rounded" />
                        <Skeleton className="h-2.5 w-2/3 rounded" />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-28 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function CatalogSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-36 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-md" />
        </div>
    );
}

export function ChartSkeleton({ height = 'h-72' }: { height?: string }) {
    return (
        <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-44 rounded-md" />
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                </div>
            </div>
            <div className={`${height} w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2`}>
                <Skeleton className="h-1/3 w-full rounded-t-lg" />
                <Skeleton className="h-2/3 w-full rounded-t-lg" />
                <Skeleton className="h-1/2 w-full rounded-t-lg" />
                <Skeleton className="h-3/4 w-full rounded-t-lg" />
                <Skeleton className="h-2/5 w-full rounded-t-lg" />
                <Skeleton className="h-4/5 w-full rounded-t-lg" />
                <Skeleton className="h-3/5 w-full rounded-t-lg" />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm overflow-x-auto space-y-4">
            <div className="flex items-center justify-between pb-2">
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-full" />
            </div>
            <div className="space-y-3">
                <div className="flex gap-4 pb-2 border-b border-[#0A2A1B]/5">
                    {Array.from({ length: cols }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full rounded" />
                    ))}
                </div>
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex gap-4 py-2 items-center">
                        {Array.from({ length: cols }).map((_, c) => (
                            <Skeleton key={c} className="h-8 w-full rounded-xl" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Stat Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>

            {/* Main Charts Row Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>

            {/* Recent Orders Table Skeleton */}
            <TableSkeleton rows={5} cols={5} />
        </div>
    );
}

export function OrdersTabSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-72 rounded-md" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>
            </div>

            {/* Filter Bar Skeleton */}
            <div className="bg-[#F7F4EB] p-4 rounded-2xl border border-[#0A2A1B]/5 flex flex-wrap gap-4 items-center justify-between">
                <Skeleton className="h-10 w-72 rounded-full" />
                <div className="flex gap-3">
                    <Skeleton className="h-9 w-28 rounded-full" />
                    <Skeleton className="h-9 w-28 rounded-full" />
                    <Skeleton className="h-9 w-28 rounded-full" />
                </div>
            </div>

            {/* Orders Table Skeleton */}
            <TableSkeleton rows={8} cols={6} />
        </div>
    );
}

export function InventoryTabSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-52 rounded-lg" />
                    <Skeleton className="h-4 w-80 rounded-md" />
                </div>
                <Skeleton className="h-10 w-36 rounded-full" />
            </div>

            {/* Inventory Table Skeleton */}
            <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm overflow-x-auto space-y-4">
                <div className="space-y-3">
                    <div className="flex gap-4 pb-2 border-b border-[#0A2A1B]/5">
                        <Skeleton className="h-4 w-1/4 rounded" />
                        <Skeleton className="h-4 w-1/6 rounded" />
                        <Skeleton className="h-4 w-1/6 rounded" />
                        <Skeleton className="h-4 w-1/6 rounded" />
                        <Skeleton className="h-4 w-1/6 rounded" />
                        <Skeleton className="h-4 w-1/6 rounded" />
                    </div>
                    {Array.from({ length: 6 }).map((_, r) => (
                        <div key={r} className="flex gap-4 py-3 items-center border-b border-[#0A2A1B]/5">
                            <div className="flex items-center gap-3 w-1/4">
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <Skeleton className="h-5 w-3/4 rounded-md" />
                            </div>
                            <Skeleton className="h-5 w-1/6 rounded-md" />
                            <Skeleton className="h-5 w-1/6 rounded-md" />
                            <Skeleton className="h-8 w-1/6 rounded-lg" />
                            <Skeleton className="h-6 w-1/6 rounded-full" />
                            <Skeleton className="h-8 w-1/6 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function FlowersTabSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
                <Skeleton className="h-7 w-56 rounded-lg" />
                <Skeleton className="h-4 w-80 rounded-md" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Skeleton */}
                <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm space-y-4">
                    <Skeleton className="h-6 w-36 rounded-md" />
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-full" />
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="lg:col-span-2">
                    <TableSkeleton rows={6} cols={4} />
                </div>
            </div>
        </div>
    );
}

export function SettingsTabSkeleton() {
    return (
        <div className="space-y-8 animate-fade-in max-w-4xl">
            <div className="space-y-2">
                <Skeleton className="h-7 w-44 rounded-lg" />
                <Skeleton className="h-4 w-72 rounded-md" />
            </div>
            <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm space-y-6">
                <Skeleton className="h-6 w-36 rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>
        </div>
    );
}
