import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';
import { validateName, validatePassword } from '../lib/authValidation';
import { X, AlertTriangle, ShoppingBag } from 'reicon-react';
import { toast } from './ui/Toast';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdateSuccess: (updatedUser: User) => void;
    orders: any[];
    onSelectOrderToPay: (order: any) => void;
    onCancelSuccess: () => void;
    onLogout?: () => void;
}

export function ProfileModal({ isOpen, onClose, user, onUpdateSuccess, orders, onSelectOrderToPay, onCancelSuccess, onLogout }: ProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    // States for status / validation
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // States for account deletion
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isCancellingDelete, setIsCancellingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

    // Realtime validation
    const nameValidation = useMemo(() => validateName(name), [name]);
    const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);

    // States for order cancellation
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState('');
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
        if (!isOpen) {
            setCancellingOrderId(null);
            setCancelReason('');
            setCancelError('');
            setIsSubmittingCancel(false);
            setIsConfirmingDelete(false);
            setDeleteError('');
        }
    }, [user, isOpen]);

    const handleRequestDeletion = async () => {
        if (!deletePassword) {
            setDeleteError('Please enter your current password to confirm account deletion.');
            return;
        }

        setIsDeletingAccount(true);
        setDeleteError('');

        try {
            const response = await fetch('/api/account/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ current_password: deletePassword }),
            });

            if (response.ok) {
                toast.success('Account marked for deletion. You have been logged out.');
                onClose();
                if (onLogout) {
                    onLogout();
                } else {
                    window.location.reload();
                }
            } else {
                const data = await response.json().catch(() => null);
                setDeleteError(data?.message || data?.errors?.current_password?.[0] || 'Failed to request account deletion.');
            }
        } catch (error) {
            setDeleteError('Connection error. Please try again.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleCancelDeletion = async () => {
        setIsCancellingDelete(true);
        setDeleteError('');

        try {
            const response = await fetch('/api/account/cancel-deletion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Account deletion request canceled.');
                onUpdateSuccess(data.user);
                setIsConfirmingDelete(false);
            } else {
                setDeleteError(data?.message || 'Failed to cancel deletion request.');
            }
        } catch (error) {
            setDeleteError('Connection error. Please try again.');
        } finally {
            setIsCancellingDelete(false);
        }
    };

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const handleCancelOrder = async (orderId: number) => {
        if (cancelReason.trim().length < 5) {
            setCancelError('Reason must be at least 5 characters long.');
            return;
        }

        setIsSubmittingCancel(true);
        setCancelError('');

        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ reason: cancelReason }),
            });

            if (response.ok) {
                setCancellingOrderId(null);
                setCancelReason('');
                onCancelSuccess();
                toast.success('Order cancelled successfully.');
            } else {
                const data = await response.json().catch(() => null);
                setCancelError(data?.message || 'Failed to cancel the order. Please try again.');
            }
        } catch (error) {
            setCancelError('Connection error. Please check your network and try again.');
        } finally {
            setIsSubmittingCancel(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setMessage('');

        if (!nameValidation.isValid) {
            setErrors({ name: [nameValidation.message] });
            return;
        }

        if (newPassword && !passwordValidation.isValid) {
            setErrors({ new_password: ['New password must be at least 8 characters long.'] });
            return;
        }

        setIsLoading(true);

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
                onUpdateSuccess(data);
                setMessage('Profile updated successfully.');
                setCurrentPassword('');
                setNewPassword('');
                setIsLoading(false);
            } else {
                setErrors(data.errors || { name: [data.message || 'Profile update failed.'] });
                setIsLoading(false);
            }
        } catch (error) {
            setErrors({ name: ['Connection error. Please try again.'] });
            setIsLoading(false);
        }
    };

    const transition = useAnimationTransition('elegant');

    return (
        <AnimatePresence>
            {isOpen && user && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-sm"
                    />

                    {/* Modal Body */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={transition}
                        className="relative bg-white max-w-2xl w-full mx-4 rounded-3xl shadow-2xl p-8 border border-[#0A2A1B]/10 z-10 flex flex-col h-[75vh] origin-center"
                    >
                <div className="flex justify-between items-center pb-4 border-b border-[#0A2A1B]/10">
                    <h3 className="text-xl font-bold text-[#0A2A1B] font-serif">Account Panel</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                        aria-label="Close modal"
                    >
                        <X className="h-6 w-6" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-[#FAF9F6] p-1 rounded-full border border-[#0A2A1B]/5 my-4 select-none text-xs font-semibold max-w-xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-2 rounded-full cursor-pointer transition-all text-center ${
                            activeTab === 'profile' ? 'bg-[#0A2A1B] text-white' : 'text-[#0A2A1B]/60'
                        }`}
                    >
                        Profile Settings
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-2 rounded-full cursor-pointer transition-all text-center ${
                            activeTab === 'orders' ? 'bg-[#0A2A1B] text-white' : 'text-[#0A2A1B]/60'
                        }`}
                    >
                        My Orders ({orders.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'profile' ? (
                        <div className="space-y-4">
                            {user.deletion_requested_at && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 select-none">
                                    <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>Account Scheduled for Deletion</span>
                                    </div>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        Your account is in a 30-day grace period and scheduled for permanent removal on{' '}
                                        <strong>{new Date(new Date(user.deletion_requested_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>.
                                    </p>
                                    <button
                                        type="button"
                                        disabled={isCancellingDelete}
                                        onClick={handleCancelDeletion}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                                    >
                                        {isCancellingDelete ? 'Cancelling Request...' : 'Undo / Cancel Account Deletion'}
                                    </button>
                                </div>
                            )}

                            {message && (
                                <div className="p-3.5 bg-green-50 text-green-700 text-xs rounded-2xl border border-green-200">
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="flex justify-between items-center bg-[#F7F4EB] px-4 py-2.5 rounded-2xl border border-[#0A2A1B]/5">
                                    <span className="text-xs text-[#0A2A1B]/60">Account Type</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#0A2A1B] text-white rounded-full">
                                        {user.role}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[#0A2A1B] block">Email Address (Read-only)</label>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-[#0A2A1B]/10 text-[#0A2A1B]/50 rounded-full text-sm cursor-not-allowed select-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-[#0A2A1B] block">Full Name</label>
                                        {name.length > 0 && nameValidation.isValid && (
                                            <span className="text-[11px] font-medium text-emerald-600">✓ Valid name</span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (errors.name) setErrors((prev) => ({ ...prev, name: [] }));
                                        }}
                                        className={`w-full px-4 py-2.5 bg-white border rounded-full text-sm focus:outline-none text-[#0A2A1B] transition-colors ${
                                            name.length > 0 && !nameValidation.isValid
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                        }`}
                                        required
                                    />
                                    {name.length > 0 && !nameValidation.isValid && (
                                        <p className="text-red-500 text-xs mt-1">{nameValidation.message}</p>
                                    )}
                                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name[0]}</p>}
                                </div>

                                <div className="border-t border-[#0A2A1B]/10 pt-4 space-y-4">
                                    <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block">Change Password (Optional)</span>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-[#0A2A1B] block">Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                        />
                                        {errors.current_password && <p className="text-red-600 text-xs mt-1">{errors.current_password[0]}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-[#0A2A1B] block">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                if (errors.new_password) setErrors((prev) => ({ ...prev, new_password: [] }));
                                            }}
                                            className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                        />
                                        {newPassword.length > 0 && (
                                            <div className="mt-2 space-y-1.5 p-2.5 bg-[#F7F4EB] rounded-xl border border-[#0A2A1B]/5">
                                                <div className="flex justify-between items-center text-[11px] font-semibold text-[#0A2A1B]/80">
                                                    <span>Password Strength</span>
                                                    <span style={{ color: passwordValidation.color }}>{passwordValidation.label}</span>
                                                </div>
                                                <div className="flex gap-1 h-1.5 w-full">
                                                    {[1, 2, 3, 4].map((step) => (
                                                        <div
                                                            key={step}
                                                            className="flex-1 h-full rounded-full transition-all duration-300"
                                                            style={{
                                                                backgroundColor: step <= passwordValidation.score ? passwordValidation.color : '#E5E7EB',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                                                    <div className={`flex items-center gap-1 ${passwordValidation.criteria.minLength ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                                                        <span>{passwordValidation.criteria.minLength ? '✓' : '•'}</span> At least 8 chars
                                                    </div>
                                                    <div className={`flex items-center gap-1 ${passwordValidation.criteria.hasUppercase ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                                                        <span>{passwordValidation.criteria.hasUppercase ? '✓' : '•'}</span> Uppercase letter
                                                    </div>
                                                    <div className={`flex items-center gap-1 ${passwordValidation.criteria.hasLowercase ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                                                        <span>{passwordValidation.criteria.hasLowercase ? '✓' : '•'}</span> Lowercase letter
                                                    </div>
                                                    <div className={`flex items-center gap-1 ${passwordValidation.criteria.hasNumberOrSpecial ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                                                        <span>{passwordValidation.criteria.hasNumberOrSpecial ? '✓' : '•'}</span> Number / Special
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {errors.new_password && <p className="text-red-600 text-xs mt-1">{errors.new_password[0]}</p>}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center"
                                >
                                    {isLoading ? 'Updating Profile...' : 'Save Profile Details'}
                                </button>
                            </form>

                            {/* Danger Zone: Account Deletion */}
                            <div className="border-t border-red-100 pt-6 mt-6 space-y-3">
                                <span className="text-xs font-bold text-red-600/70 uppercase tracking-wider block select-none">Danger Zone</span>
                                {!isConfirmingDelete ? (
                                    <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                                        <div>
                                            <h5 className="text-xs font-bold text-red-900">Delete Account</h5>
                                            <p className="text-[11px] text-red-700/70">Request account deletion with a 30-day grace period.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmingDelete(true)}
                                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition-all cursor-pointer active:scale-95 shrink-0 shadow-sm"
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
                                        <div className="space-y-1">
                                            <h5 className="text-xs font-bold text-red-900">Are you sure you want to delete your account?</h5>
                                            <p className="text-[11px] text-red-700 leading-normal">
                                                Your account will be logged out immediately and scheduled for permanent deletion after 30 days. You can cancel this request anytime within 30 days.
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-red-800 block">Enter your current password to confirm:</label>
                                            <input
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => {
                                                    setDeletePassword(e.target.value);
                                                    if (deleteError) setDeleteError('');
                                                }}
                                                placeholder="Current password"
                                                className="w-full px-4 py-2.5 bg-white border border-red-300 rounded-full text-sm focus:outline-none focus:border-red-500 text-[#0A2A1B] transition-colors"
                                                autoFocus
                                            />
                                        </div>
                                        {deleteError && <p className="text-xs text-red-600 font-semibold">{deleteError}</p>}
                                        <div className="flex justify-end gap-2 text-xs font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsConfirmingDelete(false);
                                                    setDeleteError('');
                                                    setDeletePassword('');
                                                }}
                                                className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-full transition-all cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isDeletingAccount || !deletePassword}
                                                onClick={handleRequestDeletion}
                                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                            >
                                                {isDeletingAccount ? 'Processing...' : 'Confirm Account Deletion'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <span className="text-xs font-bold text-[#0A2A1B]/40 uppercase tracking-wider block select-none">Your Orders & Reservations</span>
                            {orders.length === 0 ? (
                                <div className="text-center py-16 bg-[#FAF9F6] rounded-2xl border border-[#0A2A1B]/5 space-y-2 select-none">
                                    <ShoppingBag className="h-8 w-8 mx-auto text-[#0A2A1B]/20" />
                                    <h4 className="font-semibold text-sm text-[#0A2A1B]">No orders found</h4>
                                    <p className="text-xs text-[#0A2A1B]/55">Your purchases and bookings will appear here once processed.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div
                                            key={order.id}
                                            className="p-5 border border-[#0A2A1B]/10 rounded-2xl bg-white space-y-3"
                                        >
                                            <div className="flex justify-between items-center border-b border-[#0A2A1B]/5 pb-2.5">
                                                <div>
                                                    <span className="font-bold text-sm text-[#0A2A1B]">Order #JFS-{order.id}</span>
                                                    <span className="text-[10px] text-[#0A2A1B]/45 block">
                                                        Placed: {new Date(order.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                                                        order.status === 'cancelled'
                                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                                            : order.order_type === 'purchase'
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'
                                                    }`}>
                                                        {order.status === 'cancelled'
                                                            ? 'Cancelled'
                                                            : order.order_type === 'purchase'
                                                            ? 'Purchase'
                                                            : 'Reservation'}
                                                    </span>
                                                    {order.order_type === 'purchase' && order.status !== 'cancelled' && (
                                                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                                                            order.payment_status === 'verified'
                                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                                : order.payment_status === 'awaiting_verification'
                                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                        }`}>
                                                            {order.payment_status === 'verified'
                                                                ? 'Paid'
                                                                : order.payment_status === 'awaiting_verification'
                                                                ? 'Verifying'
                                                                : 'Unpaid'}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-bold text-[#0A2A1B]">₱{parseFloat(order.total_price).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                <div className="space-y-0.5">
                                                    <span className="text-[#0A2A1B]/50 block">Recipient</span>
                                                    <p className="font-semibold text-[#0A2A1B]">{order.recipient_name}</p>
                                                    <p className="text-[#0A2A1B]/75">{order.recipient_phone}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-[#0A2A1B]/50 block">Pickup Details</span>
                                                     <p className="font-semibold text-[#0A2A1B]">Pickup Date: {order.pickup_date}</p>
                                                </div>
                                            </div>

                                            {/* Items */}
                                            <div className="border-t border-[#0A2A1B]/5 pt-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {order.items && order.items.map((item: any, idx: number) => (
                                                        <span key={idx} className="bg-[#FAF9F6] border border-[#0A2A1B]/5 px-2.5 py-1 rounded-lg text-[#0A2A1B]/80 font-medium">
                                                            {item.name} <strong className="text-[#0A2A1B]/50">x{item.quantity}</strong>
                                                        </span>
                                                    ))}
                                                </div>
                                                
                                                {cancellingOrderId !== order.id && order.status === 'confirmed' && (
                                                    <div className="flex gap-2 self-end sm:self-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCancellingOrderId(order.id);
                                                                setCancelReason('');
                                                                setCancelError('');
                                                            }}
                                                            className="px-4 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-bold rounded-full transition-all cursor-pointer active:scale-95 uppercase tracking-wider select-none shrink-0"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                        
                                                        {order.order_type === 'purchase' && order.payment_status === 'pending' && order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onSelectOrderToPay(order)}
                                                                className="px-4 py-1.5 bg-[#D97706] hover:bg-[#0A2A1B] text-white text-[10px] font-bold rounded-full transition-all cursor-pointer active:scale-95 uppercase tracking-wider select-none shrink-0"
                                                            >
                                                                Upload Receipt / Pay
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Cancellation Form inside the order card */}
                                            {cancellingOrderId === order.id && (
                                                <div className="border-t border-[#0A2A1B]/10 pt-3 mt-3 space-y-3">
                                                    <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">✿ Request Order Cancellation</label>
                                                    <p className="text-[11px] text-[#0A2A1B]/60 leading-normal">Please let us know why you are cancelling this order (minimum 5 characters):</p>
                                                    <textarea
                                                        value={cancelReason}
                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                        className="w-full px-3 py-2 border border-[#0A2A1B]/15 bg-white text-xs font-semibold rounded-xl focus:outline-none focus:border-[#D97706] resize-none h-16"
                                                        placeholder="Reason for cancellation..."
                                                        required
                                                    />
                                                    {cancelError && <p className="text-red-600 text-[10px] font-semibold">{cancelError}</p>}
                                                    <div className="flex justify-end gap-2 text-[10px] font-bold">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCancellingOrderId(null);
                                                                setCancelReason('');
                                                                setCancelError('');
                                                            }}
                                                            className="px-3.5 py-1.5 border border-[#0A2A1B]/10 hover:bg-[#0A2A1B]/5 text-[#0A2A1B] rounded-full transition-all cursor-pointer"
                                                        >
                                                            Keep Order
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isSubmittingCancel || cancelReason.trim().length < 5}
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-full transition-all cursor-pointer flex items-center gap-1.5"
                                                        >
                                                            {isSubmittingCancel ? (
                                                                <>
                                                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                                                    <span>Cancelling...</span>
                                                                </>
                                                            ) : (
                                                                <span>Confirm Cancellation</span>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cancellation details */}
                                            {order.status === 'cancelled' && order.cancellation && (
                                                <div className="mt-3 p-3.5 bg-red-50/50 border border-red-100 rounded-2xl space-y-1 select-text">
                                                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">✿ Cancellation Log</span>
                                                    <p className="text-xs text-red-800 leading-relaxed">
                                                        <span className="font-semibold text-red-900">Reason:</span> {order.cancellation.reason}
                                                    </p>
                                                    {parseFloat(order.cancellation.refund_amount || 0) > 0 && (
                                                        <p className="text-xs text-red-800 font-semibold">
                                                            Refunded: ₱{parseFloat(order.cancellation.refund_amount).toFixed(2)} via {order.cancellation.refund_method}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
