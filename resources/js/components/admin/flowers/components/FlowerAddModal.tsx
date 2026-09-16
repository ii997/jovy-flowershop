import { X as XIcon } from 'reicon-react';

interface FlowerAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    newName: string;
    setNewName: (val: string) => void;
    newUnitType: string;
    setNewUnitType: (val: string) => void;
    newSize: string;
    setNewSize: (val: string) => void;
    newPrice: string;
    setNewPrice: (val: string) => void;
    newQty: string;
    setNewQty: (val: string) => void;
    newBundleQty: string;
    setNewBundleQty: (val: string) => void;
    newBundlePrice: string;
    setNewBundlePrice: (val: string) => void;
    addError: string;
    setAddError: (val: string) => void;
    onAdd: () => Promise<void>;
    isAdding: boolean;
}

export function FlowerAddModal({
    isOpen,
    onClose,
    newName,
    setNewName,
    newUnitType,
    setNewUnitType,
    newSize,
    setNewSize,
    newPrice,
    setNewPrice,
    newQty,
    setNewQty,
    newBundleQty,
    setNewBundleQty,
    newBundlePrice,
    setNewBundlePrice,
    addError,
    setAddError,
    onAdd,
    isAdding,
}: FlowerAddModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto border border-[#0A2A1B]/10 space-y-5">
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-3 border-b border-[#0A2A1B]/10">
                    <div>
                        <h3 className="font-serif font-bold text-[#0A2A1B] text-xl">Add Flower Variety</h3>
                        <p className="text-xs text-[#0A2A1B]/60">Configure stem pricing, size variants, and bundle rules.</p>
                    </div>
                    <button 
                        onClick={() => {
                            onClose();
                            setAddError('');
                        }}
                        className="p-1.5 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-95"
                    >
                        <XIcon className="h-6 w-6" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Modal Form */}
                <div className="space-y-4 text-xs text-[#0A2A1B]">
                    {/* Flower Name */}
                    <div>
                        <label className="text-[11px] font-semibold text-[#0A2A1B]/70 block mb-1">
                            Flower Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g. Chrysanthemum, Anthurium, Red Roses"
                            className="w-full px-3.5 py-2.5 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] transition-colors"
                        />
                    </div>

                    {/* Unit Type & Size */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-[#0A2A1B]/70 block mb-1">
                                Unit Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={newUnitType}
                                onChange={e => setNewUnitType(e.target.value)}
                                className="w-full px-3 py-2.5 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] bg-white cursor-pointer"
                            >
                                <option value="stem">stem</option>
                                <option value="stick">stick</option>
                                <option value="kilo">kilo</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-[#0A2A1B]/70 block mb-1">
                                Size <span className="text-[#0A2A1B]/40 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={newSize}
                                onChange={e => setNewSize(e.target.value)}
                                placeholder="e.g. Medium, Large, Small"
                                className="w-full px-3.5 py-2.5 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                    </div>

                    {/* Unit Price & Stock Quantity */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-[#0A2A1B]/70 block mb-1">
                                Unit Price (₱) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newPrice}
                                onChange={e => setNewPrice(e.target.value)}
                                placeholder="35.00"
                                className="w-full px-3.5 py-2.5 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-[#0A2A1B]/70 block mb-1">
                                Stock Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={newQty}
                                onChange={e => setNewQty(e.target.value)}
                                placeholder="100"
                                className="w-full px-3.5 py-2.5 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                    </div>

                    {/* Tiered / Bundle Pricing Container (Optional) */}
                    <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#0A2A1B]/5 space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/50 block">
                            Tiered Bundle Pricing <span className="text-[#0A2A1B]/40 font-normal lowercase">(optional discount rules)</span>
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-semibold text-[#0A2A1B]/60 block mb-1">Bundle Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newBundleQty}
                                    onChange={e => setNewBundleQty(e.target.value)}
                                    placeholder="e.g. 3"
                                    className="w-full px-3 py-2 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-[#0A2A1B]/60 block mb-1">Bundle Price (₱)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newBundlePrice}
                                    onChange={e => setNewBundlePrice(e.target.value)}
                                    placeholder="e.g. 100.00"
                                    className="w-full px-3 py-2 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                                />
                            </div>
                        </div>
                    </div>

                    {addError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                            {addError}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-[#0A2A1B]/10 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            setAddError('');
                        }}
                        className="px-4 py-2 text-[#0A2A1B]/70 hover:text-[#0A2A1B] hover:bg-[#0A2A1B]/5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onAdd}
                        disabled={isAdding}
                        className="px-5 py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                        {isAdding ? 'Adding...' : 'Add Flower Item'}
                    </button>
                </div>
            </div>
        </div>
    );
}
