import { Filter } from 'reicon-react';

interface FlowerBulkBarProps {
    selectedCount: number;
    hasModifiedRows: boolean;
    isBulkOperating: boolean;
    onBulkAvailability: (makeAvailable: boolean) => void;
    onBulkSaveEdits: () => void;
}

export function FlowerBulkBar({
    selectedCount,
    hasModifiedRows,
    isBulkOperating,
    onBulkAvailability,
    onBulkSaveEdits,
}: FlowerBulkBarProps) {
    if (selectedCount === 0 && !hasModifiedRows) return null;

    return (
        <div className="bg-[#FAF9F6] border border-[#D97706]/40 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0A2A1B]">
                <Filter className="w-4 h-4 text-[#D97706]" />
                {selectedCount > 0 && (
                    <span>{selectedCount} item{selectedCount > 1 ? 's' : ''} selected</span>
                )}
                {hasModifiedRows && (
                    <span className="text-[#D97706]">• Unsaved row edits pending</span>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {selectedCount > 0 && (
                    <>
                        <button
                            onClick={() => onBulkAvailability(true)}
                            disabled={isBulkOperating}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            Mark In-Stock
                        </button>
                        <button
                            onClick={() => onBulkAvailability(false)}
                            disabled={isBulkOperating}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            Mark Out-of-Stock
                        </button>
                    </>
                )}
                {hasModifiedRows && (
                    <button
                        onClick={onBulkSaveEdits}
                        disabled={isBulkOperating}
                        className="px-4 py-1.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
                    >
                        Save All Edits
                    </button>
                )}
            </div>
        </div>
    );
}
