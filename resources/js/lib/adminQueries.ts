import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Order, DashboardStats, Flower, MonthlyProductSalesResponse } from '../types';
import { csrfToken } from './utils';

// API Fetchers
export async function fetchAdminStats(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
}

export async function fetchMonthlyProductSales(month: string): Promise<MonthlyProductSalesResponse> {
    const res = await fetch(`/api/admin/stats/monthly-products?month=${encodeURIComponent(month)}`);
    if (!res.ok) throw new Error('Failed to load monthly product sales');
    return res.json();
}

export async function fetchAdminOrders(): Promise<Order[]> {
    const res = await fetch('/api/admin/orders?per_page=200');
    if (!res.ok) throw new Error('Failed to load orders');
    const data = await res.json();
    return data.data ?? data;
}

export async function fetchAdminFlowers(withArchived = false): Promise<Flower[]> {
    const url = withArchived ? '/api/admin/flowers?with_archived=1' : '/api/admin/flowers';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load flowers');
    return res.json();
}

export async function fetchAdminProducts(withArchived = false): Promise<Product[]> {
    const url = withArchived ? '/api/products?per_page=200&with_archived=1' : '/api/products?per_page=200';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load products');
    const data = await res.json();
    return data.data ?? data;
}

// React Query Hooks
export function useAdminStats() {
    return useQuery({
        queryKey: ['adminStats'],
        queryFn: fetchAdminStats,
        staleTime: 1000 * 60 * 2, // 2 mins
    });
}

export function useMonthlyProductSales(month: string | null) {
    return useQuery({
        queryKey: ['monthlyProductSales', month],
        queryFn: () => fetchMonthlyProductSales(month!),
        enabled: !!month,
        staleTime: 1000 * 60 * 5,
    });
}

export function useAdminOrders() {
    return useQuery({
        queryKey: ['adminOrders'],
        queryFn: fetchAdminOrders,
        staleTime: 1000 * 30, // 30s
    });
}

export function useAdminFlowers(withArchived = false) {
    return useQuery({
        queryKey: ['adminFlowers', withArchived],
        queryFn: () => fetchAdminFlowers(withArchived),
        staleTime: 1000 * 60 * 5,
    });
}

export function useAdminProducts(withArchived = false) {
    return useQuery({
        queryKey: ['adminProducts', withArchived],
        queryFn: () => fetchAdminProducts(withArchived),
        staleTime: 1000 * 60 * 5,
    });
}

export function useToggleAvailability() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (productId: number) => {
            const res = await fetch(`/api/admin/products/${productId}/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });
            if (!res.ok) throw new Error('Failed to toggle availability');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        },
    });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
            const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Failed to update order status');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        },
    });
}

export function useUpdatePaymentStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, payment_status, admin_notes }: { orderId: number; payment_status: string; admin_notes?: string | null }) => {
            const res = await fetch(`/api/admin/orders/${orderId}/payment-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ payment_status, admin_notes }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to update payment status');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        },
    });
}

export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            orderId,
            reason,
        }: {
            orderId: number;
            reason: string;
        }) => {
            const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ reason }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to cancel order');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
        },
    });
}

export function useAddFlower() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            name: string;
            price: number;
            quantity: number;
            unit_type?: string;
            size?: string;
            bundle_qty?: number;
            bundle_price?: number;
        }) => {
            const res = await fetch('/api/admin/flowers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.errors?.name?.[0] || err?.message || 'Failed to add flower');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminFlowers'] });
        },
    });
}

export function useUpdateFlower() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (flower: Flower) => {
            const res = await fetch(`/api/admin/flowers/${flower.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({
                    name: flower.name,
                    price: flower.price,
                    unit_type: flower.unit_type,
                    size: flower.size,
                    bundle_qty: flower.bundle_qty,
                    bundle_price: flower.bundle_price,
                    quantity: flower.quantity,
                    available: flower.available,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.errors?.name?.[0] || err?.message || 'Failed to update flower');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminFlowers'] });
        },
    });
}

export function useCreateManualOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            recipient_name: string;
            recipient_phone?: string;
            order_type?: string;
            pickup_date?: string;
            payment_method: 'cash' | 'gcash';
            status: 'confirmed' | 'delivered';
            gift_message?: string;
            items: { id: number; quantity: number }[];
        }) => {
            const res = await fetch('/api/admin/orders/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const firstError = Object.values((err.errors || {}) as Record<string, string[]>)[0]?.[0];
                throw new Error(err.message || firstError || 'Failed to create manual order');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
            queryClient.invalidateQueries({ queryKey: ['adminFlowers'] });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to delete product');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        },
    });
}

export function useRestoreProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/products/${id}/restore`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to restore product');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        },
    });
}

export function useDeleteFlower() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/flowers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to delete flower');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminFlowers'] });
        },
    });
}

export function useRestoreFlower() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/flowers/${id}/restore`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to restore flower');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminFlowers'] });
        },
    });
}
