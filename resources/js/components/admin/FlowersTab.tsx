import React, { useState } from 'react';
import { Flower } from '../../types';
import { Pagination } from '../Pagination';

interface FlowersTabProps {
    flowers: Flower[];
    onFlowersChange: (updated: Flower[]) => void;
    isAdmin: boolean;
}

export function FlowersTab({ flowers, onFlowersChange, isAdmin }: FlowersTabProps) {
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newQty, setNewQty] = useState('');
    const [addError, setAddError] = useState('');
    const [editPrices, setEditPrices] = useState<Record<number, string>>({});
    const [editQtys, setEditQtys] = useState<Record<number, string>>({});
    const [savingId, setSavingId] = useState<number | null>(null);
    const [rowError, setRowError] = useState('');
    const [errorTimeout, setErrorTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    const FLOWERS_PER_PAGE = 8;
    const [flowerPage, setFlowerPage] = useState(1);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const showRowError = (message: string) => {
        if (errorTimeout) clearTimeout(errorTimeout);
        setRowError(message);
        setErrorTimeout(setTimeout(() => setRowError(''), 4000));
    };

    const handleAdd = async () => {
        setAddError('');
        const price = parseFloat(newPrice);
        const qty = parseInt(newQty);
        if (!newName.trim() || isNaN(price) || price < 0 || isNaN(qty) || qty < 0) {
            setAddError('Please fill in all fields with valid values.');
            return;
        }

        try {
            const res = await fetch('/api/admin/flowers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ name: newName.trim(), price, quantity: qty }),
            });

            if (res.ok) {
                const created: Flower = await res.json();
                onFlowersChange([...flowers, created]);
                setNewName('');
                setNewPrice('');
                setNewQty('');
            } else {
                const data = await res.json().catch(() => null);
                setAddError(data?.errors?.name?.[0] || data?.message || 'Failed to add flower.');
            }
        } catch {
            setAddError('Connection error. Please try again.');
        }
    };

    const handleSaveFlower = async (flower: Flower) => {
        const price = parseFloat(editPrices[flower.id]?.toString() ?? flower.price.toString());
        const qty = parseInt(editQtys[flower.id]?.toString() ?? flower.quantity.toString());
        if (isNaN(price) || price < 0 || isNaN(qty) || qty < 0) return;

        setSavingId(flower.id);
        try {
            const res = await fetch(`/api/admin/flowers/${flower.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ name: flower.name, price, quantity: qty, available: flower.available }),
            });

            if (res.ok) {
                const updated: Flower = await res.json();
                onFlowersChange(flowers.map(f => f.id === updated.id ? updated : f));
            } else {
                showRowError('Failed to save flower. Please try again.');
            }
        } catch {
            showRowError('Connection error. Please try again.');
        } finally {
            setSavingId(null);
        }
    };

    const handleToggleAvailability = async (flower: Flower) => {
        try {
            const res = await fetch(`/api/admin/flowers/${flower.id}/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });

            if (res.ok) {
                const updated: Flower = await res.json();
                onFlowersChange(flowers.map(f => f.id === updated.id ? updated : f));
            } else {
                showRowError('Failed to toggle availability. Please try again.');
            }
        } catch {
            showRowError('Connection error. Please try again.');
        }
    };

    const totalFlowers = flowers.length;
    const paginatedFlowers = flowers.slice(
        (flowerPage - 1) * FLOWERS_PER_PAGE,
        flowerPage * FLOWERS_PER_PAGE
    );

    // Reset to page 1 when list length changes
    React.useEffect(() => {
        setFlowerPage(1);
    }, [flowers.length]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-serif text-2xl font-bold text-[#0A2A1B]">Flowers Inventory</h2>
                <p className="text-xs text-[#0A2A1B]/60">Manage individual flower types and stock levels</p>
            </div>

            {/* Add Flower Form */}
            {isAdmin && (
                <div className="bg-white border border-[#0A2A1B]/5 rounded-2xl p-4 shadow-sm">
                    <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block mb-3">Add New Flower</span>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[10px] font-semibold text-[#0A2A1B]/60 block mb-1">Flower Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="e.g. Roses"
                                className="w-full px-3.5 py-2 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-[10px] font-semibold text-[#0A2A1B]/60 block mb-1">Unit Price</label>
                            <input
                                type="text"
                                value={newPrice}
                                onChange={e => setNewPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3.5 py-2 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-[10px] font-semibold text-[#0A2A1B]/60 block mb-1">Quantity</label>
                            <input
                                type="text"
                                value={newQty}
                                onChange={e => setNewQty(e.target.value)}
                                placeholder="0"
                                className="w-full px-3.5 py-2 border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>
                        <button
                            onClick={handleAdd}
                            className="px-5 py-2 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95"
                        >
                            Add Flower
                        </button>
                    </div>
                    {addError && <p className="text-red-600 text-xs mt-2">{addError}</p>}
                </div>
            )}

            {/* Save/Toggle Error */}
            {rowError && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-2">{rowError}</p>
            )}

            {/* Flowers Table */}
            <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-[#0A2A1B]/5 text-[#0A2A1B]/60 uppercase tracking-wider text-[10px] font-bold">
                            <th className="py-3 px-4">Flower</th>
                            <th className="py-3 px-4">Unit Price</th>
                            <th className="py-3 px-4">Quantity</th>
                            <th className="py-3 px-4 text-center">Availability</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]/85">
                        {paginatedFlowers.map(f => {
                            const currentPrice = editPrices[f.id] !== undefined ? editPrices[f.id] : f.price.toString();
                            const currentQty = editQtys[f.id] !== undefined ? editQtys[f.id] : f.quantity.toString();
                            const isSaving = savingId === f.id;

                            return (
                                <tr key={f.id} className="hover:bg-[#FAF9F6]">
                                    <td className="py-4 px-4">
                                        <span className="font-semibold text-sm text-[#0A2A1B] capitalize">{f.name}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[#0A2A1B]/60 font-medium">₱</span>
                                            <input
                                                type="text"
                                                value={currentPrice}
                                                onChange={e => setEditPrices(prev => ({ ...prev, [f.id]: e.target.value }))}
                                                disabled={!isAdmin}
                                                className="w-16 px-1.5 py-1 bg-white border border-[#0A2A1B]/15 rounded-lg text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75"
                                            />
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <input
                                            type="text"
                                            value={currentQty}
                                            onChange={e => setEditQtys(prev => ({ ...prev, [f.id]: e.target.value }))}
                                            disabled={!isAdmin}
                                            className="w-16 px-1.5 py-1 bg-white border border-[#0A2A1B]/15 rounded-lg text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75"
                                        />
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleAvailability(f)}
                                                disabled={!isAdmin}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                                                    isAdmin ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'
                                                } ${f.available
                                                    ? 'bg-green-100 border border-green-200 text-green-700'
                                                    : 'bg-red-100 border border-red-200 text-red-700'
                                                }`}
                                            >
                                                {f.available ? 'In Stock' : 'Out of Stock'}
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleSaveFlower(f)}
                                                    disabled={isSaving}
                                                    className="px-2.5 py-1 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
                                                >
                                                    {isSaving ? '...' : 'Save'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {paginatedFlowers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-[#0A2A1B]/50 font-medium">
                                    No flowers added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <Pagination
                    currentPage={flowerPage}
                    totalItems={totalFlowers}
                    perPage={FLOWERS_PER_PAGE}
                    onPageChange={setFlowerPage}
                />
            </div>
        </div>
    );
}
