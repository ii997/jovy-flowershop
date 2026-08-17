import React, { useState } from 'react';
import { Product, Flower } from '../types';
import { computeBouquetPrice } from '../lib/pricing';
import { ImagePicker } from './admin/ImagePicker';
import { X } from 'reicon-react';

interface ProductCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    flowers: Flower[];
    onCreateSuccess: (newProduct: Product) => void;
}

export function ProductCreateModal({ isOpen, onClose, flowers, onCreateSuccess }: ProductCreateModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
    const [image, setImage] = useState('/images/roses.png');

    // Stems list builder
    const [stemsList, setStemsList] = useState<{ flower: string; count: number }[]>([]);
    const [newFlower, setNewFlower] = useState('');
    const [newCount, setNewCount] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [ingredientError, setIngredientError] = useState('');

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const clearState = () => {
        setName('');
        setCategory('');
        setDescription('');
        setSelectedOccasions([]);
        setImage('/images/roses.png');
        setStemsList([]);
        setNewFlower('');
        setNewCount('');
        setIngredientError('');
        setErrors({});
        setShowSuggestions(false);
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
            setIngredientError('Please enter a valid flower name and count.');
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
        setShowSuggestions(false);
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

        const payload = {
            name,
            category,
            image,
            description,
            seasons: ['All Year'],
            occasions: selectedOccasions,
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
                clearState();
                setIsLoading(false);
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

    const filteredSuggestions = flowers.filter(f => {
        const displayName = getFlowerDisplayName(f).toLowerCase();
        const query = newFlower.toLowerCase();
        return (displayName.includes(query) || f.name.toLowerCase().includes(query) || (f.size && f.size.toLowerCase().includes(query))) && f.available;
    });

    const derivedPrice = computeBouquetPrice(stemsList, flowers);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                onClick={() => {
                    clearState();
                    onClose();
                }}
                className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Body */}
            <div className="relative bg-white max-w-lg w-full mx-4 rounded-3xl shadow-2xl p-8 border border-[#0A2A1B]/10 z-10 flex flex-col space-y-5 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center select-none">
                    <div>
                        <h3 className="text-lg font-bold text-[#0A2A1B] font-serif">Add Floral Arrangement</h3>
                        <p className="text-[10px] text-[#0A2A1B]/60">List a new catalog item for storefront clients</p>
                    </div>
                    <button
                        onClick={() => {
                            clearState();
                            onClose();
                        }}
                        className="p-1 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                        aria-label="Close creation modal"
                    >
                        <X className="h-6 w-6" strokeWidth={1.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Arrangement Image Picker */}
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
                            <div className="w-full px-4 py-2.5 bg-[#F7F4EB] border border-[#0A2A1B]/10 rounded-full text-sm font-bold text-[#0A2A1B]">
                                ₱{derivedPrice.toFixed(2)}
                                <span className="ml-1.5 text-[10px] font-medium text-[#0A2A1B]/50">auto from stems</span>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Category</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g. Classic Bouquets"
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                required
                            />
                            {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category[0]}</p>}
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

                        <div className="flex gap-2 relative">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newFlower}
                                    onChange={(e) => {
                                        setNewFlower(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Flower name (e.g. Roses)"
                                    className="w-full px-3.5 py-2 bg-white border border-[#0A2A1B]/15 rounded-full text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                                />
                                {showSuggestions && newFlower.trim() && filteredSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-[#0A2A1B]/10 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-50 p-2 space-y-1">
                                        {filteredSuggestions.map(f => {
                                            const displayName = getFlowerDisplayName(f);
                                            return (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewFlower(displayName);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-[#FAF9F6] rounded-xl text-xs text-[#0A2A1B] font-medium flex items-center justify-between cursor-pointer gap-2"
                                                >
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <span className="truncate">{f.name}</span>
                                                        {f.size && (
                                                            <span className="shrink-0 px-1.5 py-0.5 bg-[#D97706]/10 text-[#D97706] text-[10px] font-bold rounded-md">
                                                                {f.size}
                                                            </span>
                                                        )}
                                                        {f.unit_type && f.unit_type !== 'stem' && (
                                                            <span className="shrink-0 px-1.5 py-0.5 bg-[#0A2A1B]/5 text-[#0A2A1B]/60 text-[9px] font-semibold rounded-md">
                                                                per {f.unit_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 text-right">
                                                        <span className="font-bold text-[#0A2A1B]">₱{f.price}</span>
                                                        <span className="text-[10px] text-[#0A2A1B]/55">Stock: {f.quantity}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <input
                                type="number"
                                value={newCount}
                                onChange={(e) => setNewCount(e.target.value)}
                                placeholder="Count"
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

                    {/* Occasions — Pill Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Occasions</label>
                        <div className="flex flex-wrap gap-2">
                            {['Birthday', 'Anniversary', 'Valentines', 'Wedding', 'Funeral'].map(occ => {
                                const isSelected = selectedOccasions.includes(occ);
                                return (
                                    <button
                                        key={occ}
                                        type="button"
                                        onClick={() => {
                                            setSelectedOccasions(prev =>
                                                isSelected ? prev.filter(o => o !== occ) : [...prev, occ]
                                            );
                                        }}
                                        className={`px-4 py-2 text-xs font-bold rounded-full border-2 transition-all cursor-pointer active:scale-95 select-none ${
                                            isSelected
                                                ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                                                : 'bg-white text-[#0A2A1B]/70 border-[#0A2A1B]/15 hover:border-[#D97706]/40'
                                        }`}
                                    >
                                        {occ}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.occasions && <p className="text-red-600 text-xs mt-1">{errors.occasions[0]}</p>}
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
