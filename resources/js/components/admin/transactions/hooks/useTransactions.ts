import { useMemo, useState } from 'react';
import { Order, PaymentTransaction } from '../../../../types';
import { FlattenedTransaction, TransactionDateFilter, TransactionMetrics } from '../types';

export function useTransactions(orders: Order[] = []) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [dateQuickFilter, setDateQuickFilter] = useState<TransactionDateFilter>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [methodFilter, setMethodFilter] = useState<string>('all');

    // Flatten transactions from orders
    const transactions = useMemo<FlattenedTransaction[]>(() => {
        const list: FlattenedTransaction[] = [];

        (orders || []).forEach((order: Order) => {
            const orderAmount = typeof order.total_price === 'number' ? order.total_price : parseFloat(order.total_price || '0');
            const fallbackDate = order.created_at || new Date().toISOString();

            if (order.payment_transactions && order.payment_transactions.length > 0) {
                order.payment_transactions.forEach((tx: PaymentTransaction) => {
                    list.push({
                        id: `tx-${tx.id}`,
                        order_id: order.id,
                        customer_name: order.recipient_name,
                        customer_phone: order.recipient_phone,
                        amount: tx.amount ?? orderAmount,
                        method: tx.method || (order.order_type === 'reservation' ? 'Downpayment' : 'GCash'),
                        reference_no: tx.reference_no || order.payment_details?.reference_no || null,
                        payment_status: order.payment_status || 'pending',
                        order_status: order.status,
                        receipt_image: tx.receipt_image || order.payment_receipt || null,
                        created_at: tx.created_at || fallbackDate,
                        verified_by: tx.verified_by,
                        verified_at: tx.verified_at,
                        admin_notes: tx.admin_notes,
                    });
                });
            } else {
                list.push({
                    id: `order-${order.id}`,
                    order_id: order.id,
                    customer_name: order.recipient_name,
                    customer_phone: order.recipient_phone,
                    amount: orderAmount,
                    method: order.order_type === 'reservation' ? 'Reservation Downpayment' : 'GCash / Online',
                    reference_no: order.payment_details?.reference_no || null,
                    payment_status: order.payment_status || (order.payment_receipt ? 'awaiting_verification' : 'pending'),
                    order_status: order.status,
                    receipt_image: order.payment_receipt || null,
                    created_at: fallbackDate,
                });
            }
        });

        // Sort descending by date
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [orders]);

    // Filtered data with stable date calculations
    const filteredData = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = startOfToday + 24 * 60 * 60 * 1000;
        
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        return transactions.filter(tx => {
            const txTime = new Date(tx.created_at).getTime();

            // Date Horizon Filter
            if (dateQuickFilter === 'today') {
                if (isNaN(txTime) || txTime < startOfToday || txTime >= endOfToday) return false;
            } else if (dateQuickFilter === 'week') {
                if (isNaN(txTime) || txTime < startOfWeek) return false;
            } else if (dateQuickFilter === 'month') {
                if (isNaN(txTime) || txTime < startOfMonth) return false;
            }

            // Status Filter
            const matchesStatus = 
                statusFilter === 'all' 
                    ? true 
                    : statusFilter === 'verified' 
                        ? tx.payment_status === 'verified' || tx.payment_status === 'paid'
                        : statusFilter === 'awaiting'
                            ? tx.payment_status === 'awaiting_verification' || tx.payment_status === 'awaiting'
                            : tx.payment_status === statusFilter;

            // Method Filter
            const matchesMethod = 
                methodFilter === 'all' 
                    ? true 
                    : tx.method.toLowerCase().includes(methodFilter.toLowerCase());

            // Search
            const q = globalFilter.toLowerCase().trim();
            const matchesSearch = 
                !q ||
                tx.order_id.toString().includes(q) ||
                `#jfs-${tx.order_id}`.toLowerCase().includes(q) ||
                tx.customer_name.toLowerCase().includes(q) ||
                (tx.reference_no && tx.reference_no.toLowerCase().includes(q)) ||
                (tx.customer_phone && tx.customer_phone.includes(q));

            return matchesStatus && matchesMethod && matchesSearch;
        });
    }, [transactions, dateQuickFilter, statusFilter, methodFilter, globalFilter]);

    // Financial Metrics
    const metrics = useMemo<TransactionMetrics>(() => {
        let totalVerifiedAmount = 0;
        let totalPendingAmount = 0;
        let gcashCount = 0;
        let cashCount = 0;

        filteredData.forEach(tx => {
            if (tx.payment_status === 'verified' || tx.payment_status === 'paid') {
                totalVerifiedAmount += tx.amount;
            } else if (tx.payment_status === 'awaiting_verification' || tx.payment_status === 'pending') {
                totalPendingAmount += tx.amount;
            }

            if (tx.method.toLowerCase().includes('gcash') || tx.method.toLowerCase().includes('online')) {
                gcashCount++;
            } else {
                cashCount++;
            }
        });

        const totalTransactions = filteredData.length;
        const avgTicket = totalTransactions > 0 ? (totalVerifiedAmount + totalPendingAmount) / totalTransactions : 0;

        return {
            totalVerifiedAmount,
            totalPendingAmount,
            totalCount: totalTransactions,
            gcashCount,
            cashCount,
            avgTicket
        };
    }, [filteredData]);

    return {
        transactions,
        filteredData,
        metrics,
        globalFilter,
        setGlobalFilter,
        dateQuickFilter,
        setDateQuickFilter,
        statusFilter,
        setStatusFilter,
        methodFilter,
        setMethodFilter,
    };
}
