import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { toast } from '../ui/Toast';
import { SettingsTabSkeleton } from '../ui/Skeleton';

interface SettingsTabProps {
    user: User | null;
    isLoading?: boolean;
}

export function SettingsTab({ user, isLoading: externalLoading = false }: SettingsTabProps) {
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    // Admin Profile States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
    const [profileSuccess, setProfileSuccess] = useState('');
    const [isProfileSaving, setIsProfileSaving] = useState(false);

    // Store Settings States (persisted in localStorage)
    const [storeName, setStoreName] = useState("Jovy's Flowershop");
    const [storePhone, setStorePhone] = useState("+63-2-555-1234");
    const [storeAddress, setStoreAddress] = useState("123 Rizal Avenue, Makati City, Metro Manila");
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [sameDayDelivery, setSameDayDelivery] = useState(true);
    const [downpaymentPct, setDownpaymentPct] = useState(30);
    const [storeSuccess, setStoreSuccess] = useState('');
    const [qrImage, setQrImage] = useState('');
    const [isQrDragging, setIsQrDragging] = useState(false);
    const [isQrUploading, setIsQrUploading] = useState(false);
    const [qrUploadError, setQrUploadError] = useState('');
    const qrFileInputRef = useRef<HTMLInputElement>(null);

    // Load initial values
    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }

        // Fetch settings from API
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setStoreName(data.store_name || "Jovy's Flowershop");
                        setStorePhone(data.store_phone || "+63-2-555-1234");
                        setStoreAddress(data.store_address || "123 Rizal Avenue, Makati City, Metro Manila");
                        setMaintenanceMode(!!data.maintenance_mode);
                        setSameDayDelivery(!!data.same_day_delivery);
                        setQrImage(data.qr_image || "");
                        setDownpaymentPct(data.downpayment_pct ?? 30);
                    }
                }
            } catch (e) {
                console.error("Failed to load store settings from API", e);
            } finally {
                setIsLoadingSettings(false);
            }
        };

        fetchSettings();
    }, [user]);

    if (externalLoading || isLoadingSettings) {
        return <SettingsTabSkeleton />;
    }

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProfileSaving(true);
        setProfileErrors({});
        setProfileSuccess('');

        const payload: any = { name };
        if (newPassword) {
            payload.current_password = currentPassword;
            payload.new_password = newPassword;
        }

        try {
            const response = await fetch('/api/profile', {
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
                setProfileSuccess('Profile updated successfully.');
                setCurrentPassword('');
                setNewPassword('');
            } else {
                setProfileErrors(data.errors || { name: [data.message || 'Profile update failed.'] });
            }
        } catch (error) {
            setProfileErrors({ name: ['Connection error. Please try again.'] });
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handleStoreSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setStoreSuccess('');

        const payload = {
            store_name: storeName,
            store_phone: storePhone,
            store_address: storeAddress,
            maintenance_mode: maintenanceMode,
            same_day_delivery: sameDayDelivery,
            qr_image: qrImage,
            downpayment_pct: downpaymentPct
        };

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Also write to localStorage for backward compatibility/quick access
                localStorage.setItem('store_settings_name', storeName);
                localStorage.setItem('store_settings_phone', storePhone);
                localStorage.setItem('store_settings_address', storeAddress);
                localStorage.setItem('store_settings_maintenance', String(maintenanceMode));
                localStorage.setItem('store_settings_delivery', String(sameDayDelivery));
                localStorage.setItem('store_settings_qr_image', qrImage);
                localStorage.setItem('store_settings_downpayment_pct', String(downpaymentPct));

                toast.success('Store settings saved successfully.');
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to save store settings.');
            }
        } catch (e) {
            toast.error('Failed to save store settings.');
        }
    };

    const uploadQrFile = async (file: File) => {
        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
            setQrUploadError('Only JPEG, PNG, and WebP images are accepted.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setQrUploadError('Image must be under 2 MB.');
            return;
        }

        setQrUploadError('');
        setIsQrUploading(true);

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
                setQrImage(data.url);
            } else {
                const data = await res.json().catch(() => null);
                setQrUploadError(data?.message || 'Upload failed. Please try again.');
            }
        } catch {
            setQrUploadError('Connection error. Please try again.');
        } finally {
            setIsQrUploading(false);
        }
    };

    const handleQrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadQrFile(file);
        e.target.value = '';
    };

    const handleQrDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsQrDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadQrFile(file);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 select-none">
            {/* Header Title */}
            <div>
                <h1 className="font-serif text-3xl font-extrabold text-[#0A2A1B] tracking-tight">System Settings</h1>
                <p className="text-xs text-[#0A2A1B]/60 mt-1.5 font-medium">Manage store operations, layout configuration, and administrator credentials.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Store Operations Panel */}
                <div className="bg-white rounded-3xl border border-[#0A2A1B]/10 p-6 md:p-8 shadow-sm flex flex-col justify-between">
                    <form onSubmit={handleStoreSave} className="space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-[#0A2A1B] font-serif border-b border-[#0A2A1B]/10 pb-3 flex items-center gap-2">
                                <span className="text-[#D97706]">✿</span> Storefront Settings
                            </h2>
                        </div>

                        {storeSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-3 rounded-xl transition-all">
                                {storeSuccess}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">Store Name</label>
                                <input
                                    type="text"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-[#0A2A1B]/15 bg-gray-50/50 focus:bg-white text-xs font-semibold text-[#0A2A1B] outline-hidden focus:border-[#D97706] transition-colors"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">Contact Phone</label>
                                <input
                                    type="text"
                                    value={storePhone}
                                    onChange={(e) => setStorePhone(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-[#0A2A1B]/15 bg-gray-50/50 focus:bg-white text-xs font-semibold text-[#0A2A1B] outline-hidden focus:border-[#D97706] transition-colors"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">Reservation Downpayment (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={downpaymentPct}
                                    onChange={(e) => setDownpaymentPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="px-4 py-2.5 rounded-xl border border-[#0A2A1B]/15 bg-gray-50/50 focus:bg-white text-xs font-semibold text-[#0A2A1B] outline-hidden focus:border-[#D97706] transition-colors"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">Store Address</label>
                                <textarea
                                    value={storeAddress}
                                    onChange={(e) => setStoreAddress(e.target.value)}
                                    rows={2}
                                    className="px-4 py-2.5 rounded-xl border border-[#0A2A1B]/15 bg-gray-50/50 focus:bg-white text-xs font-semibold text-[#0A2A1B] outline-hidden focus:border-[#D97706] transition-colors resize-none"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2 pt-2 border-t border-[#0A2A1B]/5">
                                <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">InstaPay QR Code Image</label>
                                
                                {qrImage ? (
                                    <div className="flex items-center gap-4 p-3 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-2xl">
                                        <img
                                            src={qrImage}
                                            alt="InstaPay QR Code"
                                            className="w-20 h-20 object-contain rounded-xl bg-white p-1 border border-[#0A2A1B]/5"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[9px] uppercase font-bold tracking-wider text-[#0A2A1B]/40 block">
                                                Active QR Image
                                            </span>
                                            <span className="text-xs text-[#0A2A1B]/70 block truncate max-w-[200px]">
                                                {qrImage.split('/').pop()}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQrImage('')}
                                                className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                                            >
                                                Clear & Use Default
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onDrop={handleQrDrop}
                                        onDragOver={(e) => { e.preventDefault(); setIsQrDragging(true); }}
                                        onDragLeave={() => setIsQrDragging(false)}
                                        onClick={() => qrFileInputRef.current?.click()}
                                        className={`relative flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                                            isQrDragging
                                                ? 'border-[#D97706] bg-[#D97706]/5 scale-[1.01]'
                                                : 'border-[#0A2A1B]/15 bg-[#FAF9F6] hover:border-[#D97706]/50 hover:bg-[#D97706]/[0.02]'
                                        } ${isQrUploading ? 'pointer-events-none opacity-60' : ''}`}
                                    >
                                        {isQrUploading ? (
                                            <>
                                                <div className="w-6 h-6 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
                                                <span className="text-[10px] text-[#0A2A1B]/60 font-medium">Uploading QR Code…</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0A2A1B]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-xs text-[#0A2A1B]/55 font-semibold text-center">
                                                    Drag & drop QR image or <span className="text-[#D97706]">browse</span>
                                                </span>
                                                <span className="text-[9px] text-[#0A2A1B]/35">JPG, PNG, WebP · Max 2 MB</span>
                                            </>
                                        )}
                                        <input
                                            ref={qrFileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleQrFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                )}
                                {qrUploadError && (
                                    <p className="text-red-600 text-[10px] font-bold mt-1">{qrUploadError}</p>
                                )}
                            </div>
                        </div>

                        {/* Toggle Switches */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between p-4 bg-gray-50/60 rounded-2xl border border-[#0A2A1B]/5 hover:border-[#0A2A1B]/10 transition-colors">
                                <div className="space-y-0.5 pr-4">
                                    <h4 className="text-xs font-bold text-[#0A2A1B]">Same-Day Delivery</h4>
                                    <p className="text-[10px] text-[#0A2A1B]/50 font-medium">Allow customers to request expedited, same-day fulfillment at checkout.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSameDayDelivery(!sameDayDelivery)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-hidden ${sameDayDelivery ? 'bg-[#0A2A1B]' : 'bg-gray-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${sameDayDelivery ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50/60 rounded-2xl border border-[#0A2A1B]/5 hover:border-[#0A2A1B]/10 transition-colors">
                                <div className="space-y-0.5 pr-4">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-[#0A2A1B]">Under Maintenance</h4>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${maintenanceMode ? 'bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30 animate-pulse' : 'bg-gray-200 text-gray-600'}`}>
                                            {maintenanceMode ? 'ACTIVE' : 'OFF'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#0A2A1B]/50 font-medium">Render a maintenance notice block to customers and temporarily disable purchases.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-hidden ${maintenanceMode ? 'bg-[#D97706]' : 'bg-gray-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full bg-[#0A2A1B] text-white hover:bg-[#0A2A1B]/90 px-6 py-3 rounded-2xl cursor-pointer text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] border border-transparent shadow-xs"
                            >
                                Save Store Configuration
                            </button>
                        </div>
                    </form>
                </div>

                {/* Profile settings Panel */}
                <div className="bg-white rounded-3xl border border-[#0A2A1B]/10 p-6 md:p-8 shadow-sm flex flex-col justify-between">
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-[#0A2A1B] font-serif border-b border-[#0A2A1B]/10 pb-3 flex items-center gap-2">
                                <span className="text-[#D97706]">✿</span> Administrator Profile
                            </h2>
                        </div>

                        {profileSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-3 rounded-xl transition-all">
                                {profileSuccess}
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="px-4 py-2.5 rounded-xl border border-[#0A2A1B]/15 bg-gray-50/50 focus:bg-white text-xs font-semibold text-[#0A2A1B] outline-hidden focus:border-[#D97706] transition-colors"
                                required
                            />
                            {profileErrors.name && (
                                <p className="text-red-500 text-[10px] font-bold mt-1">{profileErrors.name[0]}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">Account Email (Unchangeable)</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="px-4 py-2.5 rounded-xl border border-[#0A2A1B]/10 bg-gray-100 text-xs font-semibold text-[#0A2A1B]/50 cursor-not-allowed outline-hidden"
                            />
                        </div>

                        <div className="space-y-4 pt-3 border-t border-[#0A2A1B]/5">
                            <h3 className="text-xs font-bold text-[#0A2A1B]/70 tracking-tight uppercase">Update Access Credentials</h3>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="px-4 py-2.5 rounded-xl border border-[#0A2A1B]/15 bg-gray-50/50 focus:bg-white text-xs font-semibold text-[#0A2A1B] outline-hidden focus:border-[#D97706] transition-colors"
                                    required={!!newPassword}
                                />
                                {profileErrors.current_password && (
                                    <p className="text-red-500 text-[10px] font-bold mt-1">{profileErrors.current_password[0]}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] uppercase font-bold tracking-wider text-[#0A2A1B]/60">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="px-4 py-2.5 rounded-xl border border-[#0A2A1B]/15 bg-gray-50/50 focus:bg-white text-xs font-semibold text-[#0A2A1B] outline-hidden focus:border-[#D97706] transition-colors"
                                />
                                {profileErrors.new_password && (
                                    <p className="text-red-500 text-[10px] font-bold mt-1">{profileErrors.new_password[0]}</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isProfileSaving}
                                className="w-full bg-[#0A2A1B] text-white hover:bg-[#0A2A1B]/90 px-6 py-3 rounded-2xl cursor-pointer text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed border border-transparent shadow-xs"
                            >
                                {isProfileSaving ? 'Updating Profile...' : 'Update Account Details'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
