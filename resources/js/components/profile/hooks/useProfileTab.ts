import { useState, useMemo } from 'react';
import { User } from '../../../types';
import { validateName, validatePassword } from '../../../lib/authValidation';
import { toast } from '../../ui/Toast';

interface UseProfileTabProps {
    user: User | null;
    onUpdateSuccess: (updatedUser: User) => void;
    onClose: () => void;
    onLogout?: () => void;
}

export function useProfileTab({ user, onUpdateSuccess, onClose, onLogout }: UseProfileTabProps) {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    // Status & validation states
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Account deletion states
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isCancellingDelete, setIsCancellingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

    const nameValidation = useMemo(() => validateName(name), [name]);
    const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
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

    return {
        name,
        setName,
        email,
        setEmail,
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
    };
}
