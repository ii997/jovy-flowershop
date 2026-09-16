import { useState, useMemo } from 'react';
import { Flower } from '../../../../types';
import { FlowerUnitFilter, FlowerStockFilter } from '../types';

export function useFlowerFilters(flowers: Flower[] = []) {
    const [searchQuery, setSearchQuery] = useState('');
    const [unitFilter, setUnitFilter] = useState<FlowerUnitFilter>('all');
    const [stockFilter, setStockFilter] = useState<FlowerStockFilter>('all');

    const filteredFlowers = useMemo(() => {
        return flowers.filter(flower => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchesName = flower.name.toLowerCase().includes(q);
                const matchesSize = flower.size?.toLowerCase().includes(q);
                if (!matchesName && !matchesSize) return false;
            }

            // Unit type filter
            if (unitFilter !== 'all') {
                const u = flower.unit_type || 'stem';
                if (u !== unitFilter) return false;
            }

            // Stock filter
            if (stockFilter === 'in_stock') {
                if (!flower.available || flower.quantity <= 0) return false;
            } else if (stockFilter === 'low_stock') {
                if (!flower.available || flower.quantity > 10 || flower.quantity <= 0) return false;
            } else if (stockFilter === 'out_of_stock') {
                if (flower.available && flower.quantity > 0) return false;
            }

            return true;
        });
    }, [flowers, searchQuery, unitFilter, stockFilter]);

    return {
        searchQuery,
        setSearchQuery,
        unitFilter,
        setUnitFilter,
        stockFilter,
        setStockFilter,
        filteredFlowers,
    };
}
