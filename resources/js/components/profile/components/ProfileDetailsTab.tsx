import React from 'react';
import { User } from '../../../types';
import { AlertTriangle } from 'reicon-react';
import { ValidationResult, PasswordValidationResult } from '../../../lib/authValidation';

interface ProfileDetailsTabProps {
    user: User;
    name: string;
    setName: (val: string) => void;
    email: string;
    currentPassword: string;
    setCurrentPassword: (val: string) => void;
    newPassword: string;
    setNewPassword: (val: string) => void;
    errors: Record<string, string[]>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    message: string;
    isLoading: boolean;
    isConfirmingDelete: boolean;
    setIsConfirmingDelete: (val: boolean) => void;
    isDeletingAccount: boolean;
    isCancellingDelete: boolean;
    deleteError: string;
    setDeleteError: (val: string) => void;
    deletePassword: string;
    setDeletePassword: (val: string) => void;
    nameValidation: ValidationResult;
    passwordValidation: PasswordValidationResult;
    handleUpdate: (e: React.FormEvent) => Promise<void>;
    handleRequestDeletion: () => Promise<void>;
    handleCancelDeletion: () => Promise<void>;
    onLogout?: () => void;
}

export function ProfileDetailsTab({
    user,
    name,
    setName,
    email,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    errors,
    setErrors,
    message,
    isLoading,
    isConfirmingDelete,
    setIsConfirmingDelete,
    isDeletingAccount,
    isCancellingDelete,
    deleteError,
    setDeleteError,
    deletePassword,
    setDeletePassword,
    nameValidation,
    passwordValidation,
    handleUpdate,
    handleRequestDeletion,
    handleCancelDeletion,
    onLogout,
}: ProfileDetailsTabProps) {
    return (
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
                    className="w-full py-3 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center shadow-xs"
                >
                    {isLoading ? 'Updating Profile...' : 'Save Profile Details'}
                </button>
            </form>

            {/* Account Sign Out Action */}
            {onLogout && (
                <div className="border-t border-[#0A2A1B]/10 pt-4 flex items-center justify-between">
                    <div>
                        <h5 className="text-xs font-bold text-[#0A2A1B]">Sign Out</h5>
                        <p className="text-[11px] text-[#0A2A1B]/60">Safely log out of your session on this device.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="px-4 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                        Log Out
                    </button>
                </div>
            )}

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
    );
}
