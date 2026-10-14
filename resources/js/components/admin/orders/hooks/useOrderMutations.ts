import { Order } from '../../../../types';
import { toast } from '../../../ui/Toast';
import {
    useUpdateOrderStatus,
    useUpdatePaymentStatus,
    useCancelOrder,
} from '../../../../lib/adminQueries';
import { ConfirmationRequest } from '../components/ConfirmationModal';

const fulfillmentStatusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready to pickup',
    delivered: 'Picked up / Completed',
    cancelled: 'Cancelled',
};

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pending Proof',
    awaiting_verification: 'Needs Verification',
    verified: 'Verified Paid',
    failed: 'Failed / Rejected',
    refunded: 'Refunded',
};

const getOrderLabel = (orders: Order[], orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    return `Order #JFS-${orderId}${order?.recipient_name ? ` for ${order.recipient_name}` : ''}`;
};

interface UseOrderMutationsProps {
    orders: Order[];
    onUpdateOrders?: (updatedOrders: Order[]) => void;
    selectedOrder: Order | null;
    setSelectedOrder: (order: Order | null) => void;
    adminNotes: string;
    setAdminNotes: (notes: string) => void;
    cancelReason: string;
    setCancelReason: (reason: string) => void;
    setShowCancelForm: (show: boolean) => void;
    requestConfirmation: (request: ConfirmationRequest) => Promise<boolean>;
}

export function useOrderMutations({
    orders,
    onUpdateOrders,
    selectedOrder,
    setSelectedOrder,
    adminNotes,
    setAdminNotes,
    cancelReason,
    setCancelReason,
    setShowCancelForm,
    requestConfirmation,
}: UseOrderMutationsProps) {
    const updateStatusMutation = useUpdateOrderStatus();
    const updatePaymentMutation = useUpdatePaymentStatus();
    const cancelOrderMutation = useCancelOrder();

    const updatingStatus = updateStatusMutation.isPending || updatePaymentMutation.isPending || cancelOrderMutation.isPending;
    const cancelling = cancelOrderMutation.isPending;

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        const statusLabel = fulfillmentStatusLabels[newStatus] || newStatus;
        const confirmed = await requestConfirmation({
            title: 'Update order status?',
            message: `Change ${getOrderLabel(orders, orderId)} to "${statusLabel}"?`,
            confirmLabel: `Mark ${statusLabel}`,
        });
        if (!confirmed) {
            return;
        }

        try {
            const updatedOrder = await updateStatusMutation.mutateAsync({ orderId, status: newStatus });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            toast.success(`Order #JFS-${orderId} status changed to ${statusLabel}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update order status');
        }
    };

    const handlePaymentStatusChange = async (orderId: number, newPaymentStatus: string) => {
        const paymentLabel = paymentStatusLabels[newPaymentStatus] || newPaymentStatus;
        const confirmed = await requestConfirmation({
            title: 'Update payment status?',
            message: `Change payment status for ${getOrderLabel(orders, orderId)} to "${paymentLabel}"?`,
            confirmLabel: `Set ${paymentLabel}`,
        });
        if (!confirmed) {
            return;
        }

        try {
            const updatedOrder = await updatePaymentMutation.mutateAsync({
                orderId,
                payment_status: newPaymentStatus,
                admin_notes: adminNotes || null,
            });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setAdminNotes('');
            toast.success(`Order #JFS-${orderId} payment status updated to ${paymentLabel}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update payment status');
        }
    };

    const handleApproveAndPrepare = async (orderId: number) => {
        const confirmed = await requestConfirmation({
            title: 'Verify payment?',
            message: `Verify payment for ${getOrderLabel(orders, orderId)}? This will notify the customer.`,
            confirmLabel: 'Verify Payment',
        });
        if (!confirmed) {
            return;
        }

        try {
            const updatedOrder = await updatePaymentMutation.mutateAsync({
                orderId,
                payment_status: 'verified',
                admin_notes: adminNotes || 'Payment verified.',
            });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setAdminNotes('');
            toast.success(`✓ Order #JFS-${orderId} payment verified!`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to complete approval flow');
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!cancelReason || cancelReason.trim().length < 5) {
            toast.error('Please provide a reason for cancellation (minimum 5 characters).');
            return;
        }

        const confirmed = await requestConfirmation({
            title: 'Cancel order?',
            message: `Cancel ${getOrderLabel(orders, orderId)} and restore inventory? This action will notify the customer.`,
            confirmLabel: 'Cancel Order',
            variant: 'danger',
        });
        if (!confirmed) {
            return;
        }

        try {
            const updatedOrder = await cancelOrderMutation.mutateAsync({
                orderId,
                reason: cancelReason.trim(),
            });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setShowCancelForm(false);
            setCancelReason('');
            toast.success('Order cancelled and inventory restored');
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel order');
        }
    };

    return {
        updatingStatus,
        cancelling,
        handleStatusChange,
        handlePaymentStatusChange,
        handleApproveAndPrepare,
        handleCancelOrder,
    };
}
