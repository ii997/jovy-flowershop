import { ConfirmationDialog } from '../../../ui/ConfirmationDialog';

export interface ConfirmationRequest {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
}

interface ConfirmationModalProps extends ConfirmationRequest {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmationModal(props: ConfirmationModalProps) {
    const { isOpen, onConfirm, onCancel, ...request } = props;
    return (
        <ConfirmationDialog
            isOpen={isOpen}
            title={request.title}
            message={request.message}
            confirmLabel={request.confirmLabel ?? 'Confirm'}
            cancelLabel={request.cancelLabel ?? 'Back'}
            variant={request.variant}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}
