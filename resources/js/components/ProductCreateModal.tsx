import React, { useState } from 'react';
import { Product, Flower } from '../types';
import { computeBouquetPrice } from '../lib/pricing';
import { ImagePicker } from './admin/ImagePicker';
import { X, Check } from 'reicon-react';

interface ProductCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    flowers: Flower[];
    onCreateSuccess: (newProduct: Product) => void;
}

const CATEGORY_OPTIONS = [
    'Bouquets',
    'Classic Roses',
    'Seasonal Tulips',
    'Cheerful Blooms',
    'Exotic Plants',
    'Funeral & Sympathy',
    'Wedding & Events',
];

const OCCASION_OPTIONS = [
    'Birthday',
    'Anniversary',
    "Valentine's",
    'Wedding',
    'Funeral',
    'Graduation',
    'Romance',
    'Get Well Soon',
    'Congratulations',
];

export function ProductCreateModal({ isOpen, onClose, flowers, onCreateSuccess }: ProductCreateModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
    const [occasions, setOccasions] = useState<string[]>(['Birthday']);
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('/images/bouquet1.jpg');

    // Stems list builder
    const [stemsList, setStemsList] = useState<{ flower: string; count: number }[]>([]);
    const [newFlower, setNewFlower] = useState('');
    const [newCount, setNewCount] = useState('');
    const [ingredientError, setIngredientError] = useState('');

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const clearState = () => {
        setName('');
        setCategory(CATEGORY_OPTIONS[0]);
        setOccasions(['Birthday']);
        setDescription('');
        setImage('/images/bouquet1.jpg');
        setStemsList([]);
        setNewFlower('');
        setNewCount('');
        setIngredientError('');
        setErrors({});
    };

    const toggleOccasion = (occ: string) => {
        setOccasions(prev =>
            prev.includes(occ) ? prev.filter(o => o !== occ) : [...prev, occ]
        );
    };

    const getFlowerDisplayName = (f: Flower) => {
        if (f.size && !f.name.toLowerCase().includes(f.size.toLowerCase())) {
            return `${f.name} (${f.size})`;
        }
        return f.name;
    };

    const addStemItem = (e: React.MouseEvent) => {
        e.preventDefault();
        setIngredientError('');
        const countNum = parseFloat(newCount);
        if (!newFlower.trim() || isNaN(countNum) || countNum <= 0) {
            setIngredientError('Please select a flower ingredient and enter a valid quantity.');
            return;
        }

        const match = flowers.find(f => {
            const displayName = getFlowerDisplayName(f).toLowerCase();
            const target = newFlower.trim().toLowerCase();
            return displayName === target || f.name.toLowerCase() === target;
        });

        if (match) {
            const flowerKey = getFlowerDisplayName(match);
            const existing = stemsList.find(item => item.flower.toLowerCase() === flowerKey.toLowerCase());
            const totalProposed = countNum + (existing ? existing.count : 0);
            if (totalProposed > match.quantity) {
                setIngredientError(`Insufficient stock. Only ${match.quantity} ${flowerKey} available.`);
                return;
            }

            if (existing) {
                setStemsList(prev =>
                    prev.map(item =>
                        item.flower.toLowerCase() === flowerKey.toLowerCase()
                            ? { ...item, count: totalProposed }
                            : item
                    )
                );
            } else {
                setStemsList(prev => [...prev, { flower: flowerKey, count: countNum }]);
            }
        } else {
            setStemsList(prev => [...prev, { flower: newFlower.trim(), count: countNum }]);
        }

        setNewFlower('');
        setNewCount('');
    };

    const removeStemItem = (idx: number) => {
        setStemsList(prev => prev.filter((_, i) => i !== idx));
    };

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Convert stemsList to Record objects
        const stemsRecord = stemsList.reduce<Record<string, number>>((acc, item) => {
            acc[item.flower] = item.count;
            return acc;
        }, {});

        const finalOccasions = occasions.length > 0 ? occasions : [category];

        const payload = {
            name,
            category,
            image,
            description,
            seasons: ['All Year'],
            occasions: finalOccasions,
            stems: stemsRecord,
        };

        try {
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                onCreateSuccess(data);
                setIsLoading(false);
                clearState();
                onClose();
            } else {
                setErrors(data.errors || { name: [data.message || 'Product creation failed.'] });
                setIsLoading(false);
            }
        } catch (error) {
            setErrors({ name: ['Connection error. Please try again.'] });
            setIsLoading(false);
        }
    };

    const derivedPrice = computeBouquetPrice(stemsList, flowers);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Body */}
            <div className="relative bg-white max-w-lg w-full mx-4 rounded-3xl shadow-2xl p-8 border border-[#0A2A1B]/10 z-10 flex flex-col space-y-5 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center select-none">
                    <div>
                        <h3 className="text-lg font-bold text-[#0A2A1B] font-serif">Create New Arrangement</h3>
                        <p className="text-[10px] text-[#0A2A1B]/60">Define stems, category, and arrangement catalog details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                        aria-label="Close modal"
                    >
                        <X className="h-6 w-6" strokeWidth={1.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image picker */}
                    <ImagePicker value={image} onChange={setImage} />

                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Arrangement Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Lavender Fields"
                            className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                            required
                        />
                        {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name[0]}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Price — derived from stems, read-only */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Price (₱ PHP)</label>
                            <div className="w-full px-4 py-2.5 bg-[#F7F4EB] border border-[#0A2A1B]/10 rounded-full text-sm font-bold text-[#0A2A1B] flex items-center justify-between">
                                <span>₱{derivedPrice.toFixed(2)}</span>
                                <span className="text-[10px] font-medium text-[#0A2A1B]/50">auto from stems</span>
                            </div>
                        </div>

                        {/* Category Dropdown */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors cursor-pointer"
                                required
                            >
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category[0]}</p>}
                        </div>
                    </div>

                    {/* Multi-Select Occasions Badges */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Suitable Occasions</label>
                            <span className="text-[10px] text-[#0A2A1B]/50 font-medium select-none">Select all that apply</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 select-none">
                            {OCCASION_OPTIONS.map(occ => {
                                const isSelected = occasions.includes(occ);
                                return (
                                    <button
                                        key={occ}
                                        type="button"
                                        onClick={() => toggleOccasion(occ)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                                            isSelected
                                                ? 'bg-[#0A2A1B] text-white border-[#0A2A1B] shadow-xs scale-[1.02]'
                                                : 'bg-[#FAF9F6] text-[#0A2A1B]/70 hover:text-[#0A2A1B] border-[#0A2A1B]/15 hover:border-[#D97706]/50'
                                        }`}
                                    >
                                        {isSelected && <Check className="h-3 w-3 text-[#D97706]" strokeWidth={2.5} />}
                                        <span>{occ}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Flower Ingredients */}
                    <div className="border-t border-[#0A2A1B]/10 pt-4 space-y-3">
                        <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block">Flower Ingredients</span>

                        {stemsList.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2 select-none">
                                {stemsList.map((item, idx) => (
                                    <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF9F6] border border-[#0A2A1B]/10 text-xs rounded-full text-[#0A2A1B] font-semibold">
                                        <span>{item.count}x {item.flower}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeStemItem(idx)}
                                            className="text-red-600 hover:text-red-800 font-bold ml-1 cursor-pointer"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {ingredientError && <p className="text-red-600 text-xs">{ingredientError}</p>}

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <select
                                    value={newFlower}
                                    onChange={(e) => setNewFlower(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                                >
                                    <option value="">-- Select Flower Ingredient --</option>
                                    {flowers.filter(f => f.available).map(f => {
                                        const displayName = getFlowerDisplayName(f);
                                        const unitLabel = f.unit_type && f.unit_type !== 'stem' ? `/${f.unit_type}` : '';
                                        return (
                                            <option key={f.id} value={displayName}>
                                                {displayName} — ₱{f.price}{unitLabel} [Stock: {f.quantity}]
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <input
                                type="number"
                                step="any"
                                min="0.01"
                                value={newCount}
                                onChange={(e) => setNewCount(e.target.value)}
                                placeholder="Qty"
                                className="w-20 px-3.5 py-2 bg-white border border-[#0A2A1B]/15 rounded-full text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                            <button
                                onClick={addStemItem}
                                type="button"
                                className="px-4 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/15 hover:border-transparent hover:bg-[#D97706] hover:text-white text-xs font-bold rounded-full transition-all cursor-pointer"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Product Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the styling details and floral stem counts in this layout..."
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-[#0A2A1B]/15 rounded-2xl text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors resize-none"
                            required
                        />
                        {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description[0]}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 mt-2 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center select-none"
                    >
                        {isLoading ? 'Creating Arrangement...' : 'Create Floral Arrangement'}
                    </button>
                </form>
            </div>
        </div>
    );
}
