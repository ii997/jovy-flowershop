import React, { useState, useRef, useMemo } from 'react';
import { Check, Image as ImageIcon } from 'reicon-react';

export interface PresetImage {
    src: string;
    label: string;
    category: 'Bouquets' | 'Funeral & Sympathy' | 'Exotics & Seasonal';
}

const PRESET_IMAGES: PresetImage[] = [
    // Bouquets & Floral Arrangements
    { src: '/images/bouquet1.jpg', label: 'Classic Crimson Bouquet', category: 'Bouquets' },
    { src: '/images/bouquet2.jpg', label: 'Blushing Pastels Bouquet', category: 'Bouquets' },
    { src: '/images/bouquet3.jpg', label: 'Sweet Spring Arrangement', category: 'Bouquets' },
    { src: '/images/boquet4.jpg', label: 'Artisan Floral Wrap', category: 'Bouquets' },
    { src: '/images/boquet5.jpg', label: 'Romantic Rose & Carnation Mix', category: 'Bouquets' },
    { src: '/images/boquet6.jpg', label: 'Golden Sunflower & Daisy Mix', category: 'Bouquets' },
    { src: '/images/boquet7.jpg', label: 'Lavender Serenity Bundle', category: 'Bouquets' },
    { src: '/images/boquet8.jpg', label: 'Tropical Elegance Bouquet', category: 'Bouquets' },
    { src: '/images/boquet9.jpg', label: 'Daisy Dreams Hand-tied', category: 'Bouquets' },
    { src: '/images/boquet10.jpg', label: 'Pastel Elegance Layout', category: 'Bouquets' },
    { src: '/images/roses.png', label: 'Red Roses Vase', category: 'Bouquets' },
    { src: '/images/tulips.png', label: 'Pink Tulips Wrap', category: 'Bouquets' },

    // Sympathy & Funeral Arrangements
    { src: '/images/funeral1.jpg', label: 'Serene Standing Spray', category: 'Funeral & Sympathy' },
    { src: '/images/funeral2.jpg', label: 'Condolence Floral Basket', category: 'Funeral & Sympathy' },
    { src: '/images/funeral3.jpg', label: 'Peace & Grace Wreath', category: 'Funeral & Sympathy' },
    { src: '/images/funeral4.jpg', label: 'White Lily Tribute Arrangement', category: 'Funeral & Sympathy' },
    { src: '/images/funeral.png', label: 'Sympathy Basket Classic', category: 'Funeral & Sympathy' },

    // Exotics & Seasonal
    { src: '/images/orchids.png', label: 'Midnight Orchid Plant', category: 'Exotics & Seasonal' },
    { src: '/images/sunflowers.png', label: 'Golden Radiance Sunflowers', category: 'Exotics & Seasonal' },
    { src: '/images/wedding.png', label: 'Pure Harmony Wedding Layout', category: 'Exotics & Seasonal' },
    { src: '/images/autumn.png', label: 'Autumn Harvest Layout', category: 'Exotics & Seasonal' },
];

interface ImagePickerProps {
    value: string;
    onChange: (url: string) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const uploadFile = async (file: File) => {
        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
            setUploadError('Only JPEG, PNG, and WebP images are accepted.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setUploadError('Image must be under 2 MB.');
            return;
        }

        setUploadError('');
        setIsUploading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/admin/upload-image', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                onChange(data.url);
            } else {
                const data = await res.json().catch(() => null);
                setUploadError(data?.message || 'Upload failed. Please try again.');
            }
        } catch {
            setUploadError('Connection error. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const isPreset = PRESET_IMAGES.some((img) => img.src === value);

    const filteredPresets = useMemo(() => {
        if (selectedCategory === 'All') return PRESET_IMAGES;
        return PRESET_IMAGES.filter((img) => img.category === selectedCategory);
    }, [selectedCategory]);

    const categories = ['All', 'Bouquets', 'Funeral & Sympathy', 'Exotics & Seasonal'];

    return (
        <div className="space-y-3">
            <label className="text-xs font-semibold text-[#0A2A1B] block">Product Image</label>

            {/* Current preview */}
            {value && (
                <div className="flex items-center gap-3 p-2.5 bg-[#FAF9F6] border border-[#0A2A1B]/5 rounded-2xl">
                    <img
                        src={value}
                        alt="Selected"
                        className="w-16 h-16 object-cover rounded-xl border border-[#0A2A1B]/10"
                    />
                    <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#0A2A1B]/40 block">
                            Selected Image
                        </span>
                        <span className="text-xs text-[#0A2A1B] truncate block max-w-[220px]">
                            {isPreset
                                ? PRESET_IMAGES.find((img) => img.src === value)?.label
                                : 'Custom upload'}
                        </span>
                    </div>
                </div>
            )}

            {/* Preset gallery with Category Pills */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#0A2A1B]/40 uppercase tracking-wider block">
                        Catalog Presets
                    </span>
                    {/* Category Filter Pills */}
                    <div className="flex gap-1 overflow-x-auto select-none">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                                    selectedCategory === cat
                                        ? 'bg-[#0A2A1B] text-white'
                                        : 'bg-[#FAF9F6] text-[#0A2A1B]/60 hover:text-[#0A2A1B] border border-[#0A2A1B]/10'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1 border border-[#0A2A1B]/5 rounded-2xl bg-[#FAF9F6]/40">
                    {filteredPresets.map((img) => (
                        <button
                            key={img.src}
                            type="button"
                            onClick={() => onChange(img.src)}
                            className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                                value === img.src
                                    ? 'border-[#D97706] ring-2 ring-[#D97706]/30 scale-[1.02]'
                                    : 'border-[#0A2A1B]/10 hover:border-[#D97706]/50 hover:scale-[1.03]'
                            }`}
                            title={`${img.label} (${img.category})`}
                        >
                            <img
                                src={img.src}
                                alt={img.label}
                                className="w-full h-full object-cover"
                            />
                            {value === img.src && (
                                <div className="absolute inset-0 bg-[#D97706]/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Upload zone */}
            <div>
                <span className="text-[10px] font-bold text-[#0A2A1B]/40 uppercase tracking-wider block mb-2">
                    Or Upload Custom Photo
                </span>
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                        isDragging
                            ? 'border-[#D97706] bg-[#D97706]/5 scale-[1.01]'
                            : 'border-[#0A2A1B]/15 bg-[#FAF9F6] hover:border-[#D97706]/50 hover:bg-[#D97706]/[0.03]'
                    } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
                >
                    {isUploading ? (
                        <>
                            <div className="w-6 h-6 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-[#0A2A1B]/60 font-medium">Uploading…</span>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="h-5 w-5 text-[#0A2A1B]/30" strokeWidth={1.5} />
                            <span className="text-xs text-[#0A2A1B]/50 font-medium">
                                Drop image here or <span className="text-[#D97706] font-semibold">browse</span>
                            </span>
                            <span className="text-[10px] text-[#0A2A1B]/30">JPEG, PNG, WebP · Max 2 MB</span>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
                {uploadError && (
                    <p className="text-red-600 text-xs mt-1.5">{uploadError}</p>
                )}
            </div>
        </div>
    );
}

