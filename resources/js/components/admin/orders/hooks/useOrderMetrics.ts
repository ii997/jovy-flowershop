import { useMemo } from 'react';
import { Order } from '../../../../types';
import { OrderMetrics } from '../types';

export function useOrderMetrics(orders: Order[]): OrderMetrics {
    return useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

        const list = orders || [];
        const awaitingPayment = list.filter(o => o.payment_status === 'awaiting_verification' && o.status !== 'cancelled').length;
        const preparing = list.filter(o => o.status === 'preparing').length;
        const confirmed = list.filter(o => o.status === 'confirmed').length;
        const delivered = list.filter(o => o.status === 'delivered').length;

        const todayPickups = list.filter(o => {
            if (!o.pickup_date || o.status === 'cancelled') return false;
            const pTime = new Date(o.pickup_date.includes('T') ? o.pickup_date : `${o.pickup_date}T00:00:00`).getTime();
            return !isNaN(pTime) && pTime >= startOfToday && pTime < endOfToday;
        }).length;

        const totalActiveVolume = list
            .filter(o => o.status !== 'cancelled')
            .reduce((acc, o) => acc + (parseFloat(o.total_price?.toString() || '0')), 0);

        return { awaitingPayment, preparing, confirmed, delivered, todayPickups, totalActiveVolume };
    }, [orders]);
}
