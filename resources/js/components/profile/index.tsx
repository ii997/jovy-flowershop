import { useState, useEffect } from 'react';
import { User } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from '../animations';
import { X, Receipt } from 'reicon-react';
import { useProfileTab } from './hooks/useProfileTab';
import { ProfileDetailsTab } from './components/ProfileDetailsTab';
import { ProfileOrdersTab } from './components/ProfileOrdersTab';
import { ProfileTransactionsTab } from './components/ProfileTransactionsTab';

export interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdateSuccess: (updatedUser: User) => void;
    orders: any[];
    onSelectOrderToPay: (order: any) => void;
    onSelectOrderToResubmit?: (order: any) => void;
    onCancelSuccess: () => void;
    onReviewSuccess: (orderId: number, review: any) => void;
    onLogout?: () => void;
}

export function ProfileModal({
    isOpen,
    onClose,
    user,
    onUpdateSuccess,
    orders,
    onSelectOrderToPay,
    onSelectOrderToResubmit,
    onCancelSuccess,
    onReviewSuccess,
    onLogout,
}: ProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'transactions'>('profile');
    const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

    const profileState = useProfileTab({
        user,
        onUpdateSuccess,
        onClose,
        onLogout,
    });

    useEffect(() => {
        if (user) {
            profileState.setName(user.name);
            profileState.setEmail(user.email);
        }
        if (!isOpen) {
            profileState.setIsConfirmingDelete(false);
            profileState.setDeleteError('');
        }
    }, [user, isOpen]);

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
                        {/* Header */}
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
                        <div className="flex bg-[#FAF9F6] p-1 rounded-full border border-[#0A2A1B]/5 my-4 select-none text-xs font-semibold max-w-md">
                            <button
                                type="button"
                                onClick={() => setActiveTab('profile')}
                                className={`flex-1 py-2 px-3 rounded-full cursor-pointer transition-all text-center ${
                                    activeTab === 'profile' ? 'bg-[#0A2A1B] text-white shadow-xs' : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                }`}
                            >
                                Profile
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('orders')}
                                className={`flex-1 py-2 px-3 rounded-full cursor-pointer transition-all text-center ${
                                    activeTab === 'orders' ? 'bg-[#0A2A1B] text-white shadow-xs' : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                }`}
                            >
                                Orders ({orders.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('transactions')}
                                className={`flex-1 py-2 px-3 rounded-full cursor-pointer transition-all text-center flex items-center justify-center gap-1.5 ${
                                    activeTab === 'transactions' ? 'bg-[#0A2A1B] text-white shadow-xs' : 'text-[#0A2A1B]/60 hover:text-[#0A2A1B]'
                                }`}
                            >
                                <Receipt className="h-3.5 w-3.5" />
                                Transactions
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'profile' && (
                                <ProfileDetailsTab
                                    user={user}
                                    name={profileState.name}
                                    setName={profileState.setName}
                                    email={profileState.email}
                                    currentPassword={profileState.currentPassword}
                                    setCurrentPassword={profileState.setCurrentPassword}
                                    newPassword={profileState.newPassword}
                                    setNewPassword={profileState.setNewPassword}
                                    errors={profileState.errors}
                                    setErrors={profileState.setErrors}
                                    message={profileState.message}
                                    isLoading={profileState.isLoading}
                                    isConfirmingDelete={profileState.isConfirmingDelete}
                                    setIsConfirmingDelete={profileState.setIsConfirmingDelete}
                                    isDeletingAccount={profileState.isDeletingAccount}
                                    isCancellingDelete={profileState.isCancellingDelete}
                                    deleteError={profileState.deleteError}
                                    setDeleteError={profileState.setDeleteError}
                                    deletePassword={profileState.deletePassword}
                                    setDeletePassword={profileState.setDeletePassword}
                                    nameValidation={profileState.nameValidation}
                                    passwordValidation={profileState.passwordValidation}
                                    handleUpdate={profileState.handleUpdate}
                                    handleRequestDeletion={profileState.handleRequestDeletion}
                                    handleCancelDeletion={profileState.handleCancelDeletion}
                                    onLogout={onLogout}
                                />
                            )}

                            {activeTab === 'orders' && (
                                <ProfileOrdersTab
                                    orders={orders}
                                    onSelectOrderToPay={onSelectOrderToPay}
                                    onSelectOrderToResubmit={onSelectOrderToResubmit}
                                    onCancelSuccess={onCancelSuccess}
                                    onReviewSuccess={onReviewSuccess}
                                />
                            )}

                            {activeTab === 'transactions' && (
                                <ProfileTransactionsTab
                                    orders={orders}
                                    previewReceipt={previewReceipt}
                                    setPreviewReceipt={setPreviewReceipt}
                                    onClose={onClose}
                                    onSelectOrderToPay={onSelectOrderToPay}
                                    onSelectOrderToResubmit={onSelectOrderToResubmit}
                                />
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default ProfileModal;
