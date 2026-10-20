import { useState, useEffect, useMemo } from 'react';
import { Order } from '../../../../types';
import { DateQuickFilter, UrgencyFilter, OrderSortBy, OrderSortOrder } from '../types';
import { getOrderUrgency } from '../utils';

export const ORDER_PER_PAGE = 10;

export function useOrderFilters(orders: Order[]) {
    const [orderSearch, setOrderSearch] = useState('');
    const [dateQuickFilter, setDateQuickFilter] = useState<DateQuickFilter>('all');
    const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
    const [orderSortBy, setOrderSortBy] = useState<OrderSortBy>('urgency');
    const [orderSortOrder, setOrderSortOrder] = useState<OrderSortOrder>('desc');
    const [selectedOrderType, setSelectedOrderType] = useState('All');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('active');
    const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('All');
    const [orderPage, setOrderPage] = useState(1);

    // Reset pagination on filter change
    useEffect(() => {
        setOrderPage(1);
    }, [orderSearch, dateQuickFilter, urgencyFilter, selectedOrderType, selectedStatusFilter, selectedPaymentFilter, orderSortBy, orderSortOrder]);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;
        const endOfTomorrow = startOfTomorrow + 24 * 60 * 60 * 1000;
        const endOfWeek = startOfToday + 7 * 24 * 60 * 60 * 1000;

        return (orders || [])
            .filter(order => {
                // Multi-field search
                if (orderSearch.trim()) {
                    const q = orderSearch.toLowerCase().trim();
                    const idMatch = `#JFS-${order.id}`.toLowerCase().includes(q) || `${order.id}`.includes(q);
                    const nameMatch = (order.recipient_name || '').toLowerCase().includes(q);
                    const phoneMatch = (order.recipient_phone || '').toLowerCase().includes(q);
                    const refMatch = (order.payment_details?.reference_no || '').toLowerCase().includes(q);
                    const giftMatch = (order.gift_message || '').toLowerCase().includes(q);
                    if (!idMatch && !nameMatch && !phoneMatch && !refMatch && !giftMatch) return false;
                }

                // Date Quick Filter
                if (dateQuickFilter !== 'all') {
                    if (!order.pickup_date) return false;
                    const pTime = new Date(order.pickup_date.includes('T') ? order.pickup_date : `${order.pickup_date}T00:00:00`).getTime();
                    if (isNaN(pTime)) return false;

                    if (dateQuickFilter === 'today' && (pTime < startOfToday || pTime >= startOfTomorrow)) return false;
                    if (dateQuickFilter === 'tomorrow' && (pTime < startOfTomorrow || pTime >= endOfTomorrow)) return false;
                    if (dateQuickFilter === 'week' && (pTime < startOfToday || pTime > endOfWeek)) return false;
                    if (dateQuickFilter === 'past' && pTime >= startOfToday) return false;
                }

                // Urgency Filter
                if (urgencyFilter !== 'all') {
                    const urgency = getOrderUrgency(order);
                    if (urgencyFilter === 'urgent' && !urgency.isUrgent) return false;
                    if (urgencyFilter === 'funeral' && urgency.type !== 'funeral') return false;
                    if (urgencyFilter === 'birthday' && urgency.type !== 'birthday') return false;
                }

                // Type filter
                if (selectedOrderType !== 'All' && order.order_type !== selectedOrderType) {
                    return false;
                }

                // Status filter
                if (selectedStatusFilter !== 'All') {
                    if (selectedStatusFilter === 'active') {
                        if (order.status !== 'confirmed' && order.status !== 'preparing') return false;
                    } else if (order.status !== selectedStatusFilter) {
                        return false;
                    }
                }

                // Payment Filter
                if (selectedPaymentFilter !== 'All' && order.payment_status !== selectedPaymentFilter) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (orderSortBy === 'urgency') {
                    const urgencyA = getOrderUrgency(a);
                    const urgencyB = getOrderUrgency(b);
                    // Higher priority first (funeral=2, birthday=1, standard=0)
                    if (urgencyA.priority !== urgencyB.priority) {
                        return orderSortOrder === 'desc'
                            ? urgencyB.priority - urgencyA.priority
                            : urgencyA.priority - urgencyB.priority;
                    }
                    // For equal urgency, prioritize earlier pickup dates
                    const dateA = new Date(a.pickup_date || 0).getTime();
                    const dateB = new Date(b.pickup_date || 0).getTime();
                    return dateA - dateB;
                }
                if (orderSortBy === 'date') {
                    const fieldA = new Date(a.pickup_date || 0).getTime();
                    const fieldB = new Date(b.pickup_date || 0).getTime();
                    return orderSortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
                }
                if (orderSortBy === 'price') {
                    const fieldA = parseFloat((a.total_price || 0).toString());
                    const fieldB = parseFloat((b.total_price || 0).toString());
                    return orderSortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
                }
                if (orderSortBy === 'id') {
                    return orderSortOrder === 'asc' ? a.id - b.id : b.id - a.id;
                }
                return 0;
            });
    }, [orders, orderSearch, dateQuickFilter, urgencyFilter, selectedOrderType, selectedStatusFilter, selectedPaymentFilter, orderSortBy, orderSortOrder]);

    const totalOrders = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice((orderPage - 1) * ORDER_PER_PAGE, orderPage * ORDER_PER_PAGE);

    return {
        orderSearch,
        setOrderSearch,
        dateQuickFilter,
        setDateQuickFilter,
        urgencyFilter,
        setUrgencyFilter,
        orderSortBy,
        setOrderSortBy,
        orderSortOrder,
        setOrderSortOrder,
        selectedOrderType,
        setSelectedOrderType,
        selectedStatusFilter,
        setSelectedStatusFilter,
        selectedPaymentFilter,
        setSelectedPaymentFilter,
        orderPage,
        setOrderPage,
        filteredOrders,
        paginatedOrders,
        totalOrders,
        perPage: ORDER_PER_PAGE,
    };
}

