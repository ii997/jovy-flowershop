interface PaginationProps {
    currentPage: number;
    totalItems: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, perPage, onPageChange }: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    if (totalItems <= perPage) return null;

    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalItems);

    const getPageNumbers = (): (number | 'ellipsis')[] => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            if (start > 2) pages.push('ellipsis');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('ellipsis');

            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#0A2A1B]/5 mt-4">
            <span className="text-[11px] text-[#0A2A1B]/50 font-medium">
                Showing {startItem}–{endItem} of {totalItems} items
            </span>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-[#0A2A1B]/10 text-[#0A2A1B]/60 hover:bg-[#0A2A1B]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                    ← Prev
                </button>

                {getPageNumbers().map((p, i) =>
                    p === 'ellipsis' ? (
                        <span key={`e-${i}`} className="px-1.5 text-[#0A2A1B]/30 text-xs">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`min-w-[28px] px-1.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                p === currentPage
                                    ? 'bg-[#0A2A1B] text-white shadow-sm'
                                    : 'text-[#0A2A1B]/60 hover:bg-[#0A2A1B]/5 border border-transparent'
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-[#0A2A1B]/10 text-[#0A2A1B]/60 hover:bg-[#0A2A1B]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
