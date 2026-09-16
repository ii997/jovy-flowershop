export type DateQuickFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'past';
export type UrgencyFilter = 'all' | 'urgent' | 'funeral' | 'birthday';
export type OrderSortBy = 'urgency' | 'date' | 'price' | 'id';
export type OrderSortOrder = 'asc' | 'desc';

export interface OrderFiltersState {
    orderSearch: string;
    dateQuickFilter: DateQuickFilter;
    orderSortBy: OrderSortBy;
    orderSortOrder: OrderSortOrder;
    selectedOrderType: string;
    selectedStatusFilter: string;
    selectedPaymentFilter: string;
    orderPage: number;
}

export interface OrderMetrics {
    awaitingPayment: number;
    preparing: number;
    confirmed: number;
    delivered: number;
    todayPickups: number;
    totalActiveVolume: number;
}

export interface CancelOrderFormState {
    reason: string;
    refundAmount: string;
    refundMethod: string;
}
