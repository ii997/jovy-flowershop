import { Flower } from '../types';

/**
 * Compute a bouquet's selling price from its stem composition, mirroring the
 * server rule (App\Support\ProductPricing). Price = Σ (flower unit price × count).
 *
 * Stems referencing flowers missing from the catalog contribute 0 — the server
 * rejects such saves anyway (it validates every stem against the catalog), so
 * for a valid bouquet this preview matches the persisted price. The client
 * value is a live preview only; the server remains the source of truth.
 */
export function computeBouquetPrice(
    stems: { flower: string; count: number }[],
    flowers: Flower[],
): number {
    const priceByFlower = new Map(flowers.map(f => [f.name.toLowerCase(), f.price]));

    return stems.reduce((total, item) => {
        const unitPrice = priceByFlower.get(item.flower.toLowerCase());
        return total + (unitPrice ?? 0) * item.count;
    }, 0);
}