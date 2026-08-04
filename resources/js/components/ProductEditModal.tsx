import React, { useState, useEffect } from 'react';
import { Product, Flower } from '../types';
import { computeBouquetPrice } from '../lib/pricing';
import { ImagePicker } from './admin/ImagePicker';
import { toast } from './ui/Toast';
import { X } from 'reicon-react';

interface ProductEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    flowers: Flower[];
    onUpdateSuccess: (updatedProduct: Product) => void;
}

export function ProductEditModal({ isOpen, onClose, product, flowers, onUpdateSuccess }: ProductEditModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [size, setSize] = useState('');
    const [description, setDescription] = useState('');
    const [occasions, setOccasions] = useState('');
    const [seasons, setSeasons] = useState('');
    const [image, setImage] = useState('');
    
    // Stems list builder
    const [stemsList, setStemsList] = useState<{ flower: string; count: number }[]>([]);
    const [newFlower, setNewFlower] = useState('');
    const [newCount, setNewCount] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setName(product.name);
            setCategory(product.category);
            setSize(product.size);
            setDescription(product.description);
            setOccasions(product.occasions.join(', '));
            setSeasons(product.seasons.join(', '));
            setImage(product.image);
            
            // Map Record to array list
            if (product.stems) {
                setStemsList(
                    Object.entries(product.stems).map(([flower, count]) => ({
                        flower,
                        count: Number(count),
                    }))
                );
            } else {
                setStemsList([]);
            }
        }
        setNewFlower('');
        setNewCount('');
        setErrors({});
        setShowSuggestions(false);
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const addStemItem = (e: React.MouseEvent) => {
        e.preventDefault();
        const countNum = parseInt(newCount);
        if (!newFlower.trim() || isNaN(countNum) || countNum <= 0) {
            toast.error('Please enter a valid flower name and count.');
            return;
        }

        const match = flowers.find(f => f.name.toLowerCase() === newFlower.trim().toLowerCase());
        if (match) {
            const existing = stemsList.find(item => item.flower.toLowerCase() === match.name.toLowerCase());
            const totalProposed = countNum + (existing ? existing.count : 0);
            if (totalProposed > match.quantity) {
                toast.error(`Insufficient stock. Only ${match.quantity} ${match.name} available in stock.`);
                return;
            }

            if (existing) {
                setStemsList(prev =>
                    prev.map(item =>
                        item.flower.toLowerCase() === match.name.toLowerCase()
                            ? { ...item, count: totalProposed }
                            : item
                    )
                );
            } else {
                setStemsList(prev => [...prev, { flower: match.name, count: countNum }]);
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
            size,
            occasions: occasions.split(',').map(s => s.trim()).filter(Boolean),
            seasons: seasons.split(',').map(s => s.trim()).filter(Boolean),
            stems: stemsRecord,
        };

        try {
            const response = await fetch(`/api/admin/products/${product.id}/update`, {
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
                onUpdateSuccess(data);
                setIsLoading(false);
                onClose();
            } else {
                setErrors(data.errors || { name: [data.message || 'Product update failed.'] });
                setIsLoading(false);
            }
        } catch (error) {
            setErrors({ name: ['Connection error. Please try again.'] });
            setIsLoading(false);
        }
    };

    const filteredSuggestions = flowers.filter(f =>
        f.name.toLowerCase().includes(newFlower.toLowerCase()) &&
        f.available
    );

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
                        <h3 className="text-lg font-bold text-[#0A2A1B] font-serif">Edit Arrangement Details</h3>
                        <p className="text-[10px] text-[#0A2A1B]/60">Modify listed product details and arrangement options</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                        aria-label="Close edit modal"
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
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                required
                            />
                            {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category[0]}</p>}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0A2A1B] block">Size</label>
                        <div className="flex gap-2">
                            {['S', 'M', 'L', 'XL'].map(s => {
                                const currentSize = size.replace('Size ', '');
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSize(`Size ${s}`)}
                                        className={`w-14 h-10 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer active:scale-95 ${
                                            currentSize === s
                                                ? 'bg-[#0A2A1B] text-white border-[#0A2A1B] shadow-sm'
                                                : 'bg-white text-[#0A2A1B]/70 border-[#0A2A1B]/15 hover:border-[#0A2A1B]/30'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.size && <p className="text-red-600 text-xs mt-1">{errors.size[0]}</p>}
                    </div>

                    {/* Dynamic Flower Stems Builder */}
                    <div className="border-t border-[#0A2A1B]/10 pt-4 space-y-3">
                        <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block">Flower Ingredients List</span>
                        
                        {/* Display Added Stems */}
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
                                    <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-[#0A2A1B]/10 rounded-2xl shadow-xl max-h-40 overflow-y-auto z-50 p-2 space-y-1">
                                        {filteredSuggestions.map(f => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => {
                                                    setNewFlower(f.name);
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-[#FAF9F6] rounded-xl text-xs text-[#0A2A1B] font-medium flex justify-between cursor-pointer"
                                            >
                                                <span>{f.name}</span>
                                                <span className="text-[10px] text-[#0A2A1B]/55">Stock: {f.quantity}</span>
                                            </button>
                                        ))}
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
                                const selectedList = occasions.split(',').map(o => o.trim()).filter(Boolean);
                                const isSelected = selectedList.includes(occ);
                                return (
                                    <button
                                        key={occ}
                                        type="button"
                                        onClick={() => {
                                            const updatedList = isSelected
                                                ? selectedList.filter(o => o !== occ)
                                                : [...selectedList, occ];
                                            setOccasions(updatedList.join(', '));
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
                        {isLoading ? 'Saving Product Details...' : 'Save Product Details'}
                    </button>
                </form>
            </div>
        </div>
    );
}
