export interface FlattenedTransaction {
    id: string | number;
    order_id: number;
    customer_name: string;
    customer_phone?: string;
    amount: number;
    method: string;
    reference_no: string | null;
    payment_status: string;
    order_status: string;
    receipt_image: string | null;
    created_at: string;
    verified_by?: number | null;
    verified_at?: string | null;
    admin_notes?: string | null;
}

export type TransactionDateFilter = 'all' | 'today' | 'week' | 'month';

export interface TransactionMetrics {
    totalVerifiedAmount: number;
    totalPendingAmount: number;
    totalCount: number;
    gcashCount: number;
    cashCount: number;
}
