import { useMemo } from 'react';
import { Flower } from '../../../../types';
import { FlowerMetrics } from '../types';

export function useFlowerMetrics(flowers: Flower[] = []): FlowerMetrics {
    return useMemo(() => {
        const totalVarieties = flowers.length;
        const inStockCount = flowers.filter(f => f.available && f.quantity > 10).length;
        const lowStockCount = flowers.filter(f => f.available && f.quantity > 0 && f.quantity <= 10).length;
        const outOfStockCount = flowers.filter(f => !f.available || f.quantity === 0).length;
        const totalStemsVolume = flowers.reduce((acc, f) => acc + (f.quantity || 0), 0);

        return {
            totalVarieties,
            inStockCount,
            lowStockCount,
            outOfStockCount,
            totalStemsVolume,
        };
    }, [flowers]);
}
