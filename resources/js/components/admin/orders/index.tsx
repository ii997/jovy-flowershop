import { useState } from 'react';
import { Order, Product } from '../../../types';
import { OrdersTabSkeleton } from '../../ui/Skeleton';
import { useAdminProducts } from '../../../lib/adminQueries';
import { useOrderMetrics } from './hooks/useOrderMetrics';
import { useOrderFilters } from './hooks/useOrderFilters';
import { useOrderMutations } from './hooks/useOrderMutations';
import { OrderMetricsBar } from './components/OrderMetricsBar';
import { OrderFilterToolbar } from './components/OrderFilterToolbar';
import { OrderTable } from './components/OrderTable';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { ImageZoomModal } from './components/ImageZoomModal';
import { CreateOrderModal } from './components/CreateOrderModal';

export interface OrdersTabProps {
    orders: Order[];
    products?: Product[];
    onUpdateOrders?: (updatedOrders: Order[]) => void;
    isLoading?: boolean;
}

export function OrdersTab({ orders, products, onUpdateOrders, isLoading = false }: OrdersTabProps) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelRefundAmount, setCancelRefundAmount] = useState('');
    const [cancelRefundMethod, setCancelRefundMethod] = useState('none');
    const [adminNotes, setAdminNotes] = useState('');
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const adminProductsQuery = useAdminProducts();
    const catalogProducts = products && products.length > 0 ? products : (adminProductsQuery.data || []);

    const metrics = useOrderMetrics(orders);
    const filters = useOrderFilters(orders);
    const mutations = useOrderMutations({
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
    });

    const closeModal = () => {
        setSelectedOrder(null);
        setShowCancelForm(false);
        setCancelReason('');
        setCancelRefundAmount('');
        setCancelRefundMethod('none');
        setAdminNotes('');
    };

    if (isLoading) {
        return <OrdersTabSkeleton />;
    }

    return (
        <div className="space-y-6 select-none">
            {/* Top Florist Triage KPI Grid */}
            <OrderMetricsBar
                metrics={metrics}
                totalOrdersCount={orders.length}
                selectedPaymentFilter={filters.selectedPaymentFilter}
                setSelectedPaymentFilter={filters.setSelectedPaymentFilter}
                selectedStatusFilter={filters.selectedStatusFilter}
                setSelectedStatusFilter={filters.setSelectedStatusFilter}
                dateQuickFilter={filters.dateQuickFilter}
                setDateQuickFilter={filters.setDateQuickFilter}
            />

            {/* Multi-Dimensional Filter & Search Strip */}
            <OrderFilterToolbar
                orderSearch={filters.orderSearch}
                setOrderSearch={filters.setOrderSearch}
                dateQuickFilter={filters.dateQuickFilter}
                setDateQuickFilter={filters.setDateQuickFilter}
                urgencyFilter={filters.urgencyFilter}
                setUrgencyFilter={filters.setUrgencyFilter}
                selectedStatusFilter={filters.selectedStatusFilter}
                setSelectedStatusFilter={filters.setSelectedStatusFilter}
                selectedPaymentFilter={filters.selectedPaymentFilter}
                setSelectedPaymentFilter={filters.setSelectedPaymentFilter}
                orderSortBy={filters.orderSortBy}
                setOrderSortBy={filters.setOrderSortBy}
                orderSortOrder={filters.orderSortOrder}
                setOrderSortOrder={filters.setOrderSortOrder}
                filteredCount={filters.filteredOrders.length}
                onCreateWalkIn={() => setIsCreateModalOpen(true)}
            />

            {/* Orders Table */}
            <OrderTable
                orders={filters.paginatedOrders}
                totalOrders={filters.totalOrders}
                orderPage={filters.orderPage}
                perPage={filters.perPage}
                setOrderPage={filters.setOrderPage}
                onSelectOrder={setSelectedOrder}
                onZoomImage={setZoomImage}
                onStatusChange={mutations.handleStatusChange}
                onApproveAndPrepare={mutations.handleApproveAndPrepare}
                updatingStatus={mutations.updatingStatus}
            />

            {/* Order Inspection & Verification Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={closeModal}
                    onZoomImage={setZoomImage}
                    onStatusChange={mutations.handleStatusChange}
                    onPaymentStatusChange={mutations.handlePaymentStatusChange}
                    onApproveAndPrepare={mutations.handleApproveAndPrepare}
                    updatingStatus={mutations.updatingStatus}
                    adminNotes={adminNotes}
                    setAdminNotes={setAdminNotes}
                    showCancelForm={showCancelForm}
                    setShowCancelForm={setShowCancelForm}
                    cancelReason={cancelReason}
                    setCancelReason={setCancelReason}
                    cancelRefundAmount={cancelRefundAmount}
                    setCancelRefundAmount={setCancelRefundAmount}
                    cancelRefundMethod={cancelRefundMethod}
                    setCancelRefundMethod={setCancelRefundMethod}
                    onCancelOrder={mutations.handleCancelOrder}
                    cancelling={mutations.cancelling}
                />
            )}

            {/* Receipt Image Zoom Modal */}
            <ImageZoomModal
                imageUrl={zoomImage}
                onClose={() => setZoomImage(null)}
            />

            {/* Create Walk-In / Manual Order Modal */}
            <CreateOrderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                products={catalogProducts}
            />
        </div>
    );
}

export default OrdersTab;
