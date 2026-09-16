import { Order } from '../../../../types';
import { toast } from '../../../ui/Toast';
import {
    useUpdateOrderStatus,
    useUpdatePaymentStatus,
    useCancelOrder,
} from '../../../../lib/adminQueries';

interface UseOrderMutationsProps {
    orders: Order[];
    onUpdateOrders?: (updatedOrders: Order[]) => void;
    selectedOrder: Order | null;
    setSelectedOrder: (order: Order | null) => void;
    adminNotes: string;
    setAdminNotes: (notes: string) => void;
    cancelReason: string;
    setCancelReason: (reason: string) => void;
    cancelRefundAmount: string;
    setCancelRefundAmount: (amount: string) => void;
    cancelRefundMethod: string;
    setCancelRefundMethod: (method: string) => void;
    setShowCancelForm: (show: boolean) => void;
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
    cancelRefundAmount,
    setCancelRefundAmount,
    cancelRefundMethod,
    setCancelRefundMethod,
    setShowCancelForm,
}: UseOrderMutationsProps) {
    const updateStatusMutation = useUpdateOrderStatus();
    const updatePaymentMutation = useUpdatePaymentStatus();
    const cancelOrderMutation = useCancelOrder();

    const updatingStatus = updateStatusMutation.isPending || updatePaymentMutation.isPending || cancelOrderMutation.isPending;
    const cancelling = cancelOrderMutation.isPending;

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            const updatedOrder = await updateStatusMutation.mutateAsync({ orderId, status: newStatus });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            toast.success(`Order #JFS-${orderId} status changed to ${newStatus}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update order status');
        }
    };

    const handlePaymentStatusChange = async (orderId: number, newPaymentStatus: string) => {
        try {
            const updatedOrder = await updatePaymentMutation.mutateAsync({
                orderId,
                payment_status: newPaymentStatus,
                admin_notes: adminNotes || null,
            });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setAdminNotes('');
            toast.success(`Order #JFS-${orderId} payment status updated to ${newPaymentStatus}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update payment status');
        }
    };

    const handleApproveAndPrepare = async (orderId: number) => {
        try {
            await updatePaymentMutation.mutateAsync({
                orderId,
                payment_status: 'verified',
                admin_notes: adminNotes || 'Payment verified and order set to preparing.',
            });
            const updatedOrder = await updateStatusMutation.mutateAsync({ orderId, status: 'preparing' });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setAdminNotes('');
            toast.success(`✓ Order #JFS-${orderId} verified & set to Preparing!`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to complete approval flow');
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!cancelReason || cancelReason.trim().length < 5) {
            toast.error('Please provide a reason for cancellation (minimum 5 characters).');
            return;
        }
        try {
            const updatedOrder = await cancelOrderMutation.mutateAsync({
                orderId,
                reason: cancelReason.trim(),
                refund_amount: cancelRefundAmount ? parseFloat(cancelRefundAmount) : null,
                refund_method: cancelRefundMethod,
            });
            onUpdateOrders?.(orders.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);
            setShowCancelForm(false);
            setCancelReason('');
            setCancelRefundAmount('');
            setCancelRefundMethod('none');
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
