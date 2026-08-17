import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Order, DashboardStats, Flower } from '../types';
import { csrfToken } from './utils';

// API Fetchers
export async function fetchAdminStats(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
}

export async function fetchAdminOrders(): Promise<Order[]> {
    const res = await fetch('/api/admin/orders?per_page=200');
    if (!res.ok) throw new Error('Failed to load orders');
    const data = await res.json();
    return data.data ?? data;
}

export async function fetchAdminFlowers(): Promise<Flower[]> {
    const res = await fetch('/api/admin/flowers');
    if (!res.ok) throw new Error('Failed to load flowers');
    return res.json();
}

export async function fetchAdminProducts(): Promise<Product[]> {
    const res = await fetch('/api/products?per_page=200');
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

export function useAdminOrders() {
    return useQuery({
        queryKey: ['adminOrders'],
        queryFn: fetchAdminOrders,
        staleTime: 1000 * 30, // 30s
    });
}

export function useAdminFlowers() {
    return useQuery({
        queryKey: ['adminFlowers'],
        queryFn: fetchAdminFlowers,
        staleTime: 1000 * 60 * 5,
    });
}

export function useAdminProducts() {
    return useQuery({
        queryKey: ['adminProducts'],
        queryFn: fetchAdminProducts,
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
            refund_amount,
            refund_method,
        }: {
            orderId: number;
            reason: string;
            refund_amount?: number | null;
            refund_method?: string;
        }) => {
            const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ reason, refund_amount, refund_method }),
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
