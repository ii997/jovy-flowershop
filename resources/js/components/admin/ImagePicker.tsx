import React, { useState, useRef } from 'react';
import { Check, Image as ImageIcon } from 'reicon-react';

const PRESET_IMAGES = [
    { src: '/images/roses.png', label: 'Red Roses' },
    { src: '/images/orchids.png', label: 'Orchids' },
    { src: '/images/tulips.png', label: 'Tulips' },
    { src: '/images/sunflowers.png', label: 'Sunflowers' },
    { src: '/images/wedding.png', label: 'Wedding' },
    { src: '/images/funeral.png', label: 'Sympathy' },
    { src: '/images/autumn.png', label: 'Autumn' },
];

interface ImagePickerProps {
    value: string;
    onChange: (url: string) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
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

            {/* Preset gallery */}
            <div>
                <span className="text-[10px] font-bold text-[#0A2A1B]/40 uppercase tracking-wider block mb-2">
                    Catalog Presets
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                    {PRESET_IMAGES.map((img) => (
                        <button
                            key={img.src}
                            type="button"
                            onClick={() => onChange(img.src)}
                            className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                                value === img.src
                                    ? 'border-[#D97706] ring-2 ring-[#D97706]/30 scale-[1.02]'
                                    : 'border-[#0A2A1B]/10 hover:border-[#D97706]/50 hover:scale-[1.03]'
                            }`}
                            title={img.label}
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
                    className={`relative flex flex-col items-center justify-center gap-2 py-5 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
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
                            <ImageIcon className="h-6 w-6 text-[#0A2A1B]/30" strokeWidth={1.5} />
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
