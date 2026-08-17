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
    const flowersByName = new Map(flowers.map(f => [f.name.toLowerCase(), f]));

    let total = 0;
    for (const item of stems) {
        const count = Number(item.count);
        if (count <= 0) continue;

        let flower = flowersByName.get(item.flower.toLowerCase());

        // Fallback match for "Name (Size)" pattern
        if (!flower) {
            const match = item.flower.match(/^(.*?)\s*\((.*?)\)$/);
            if (match) {
                const baseName = match[1].trim().toLowerCase();
                const size = match[2].trim().toLowerCase();
                flower = flowers.find(
                    f => f.name.toLowerCase() === baseName && (f.size?.toLowerCase() ?? '') === size
                );
            }
        }

        if (flower) {
            const bQty = flower.bundle_qty ?? 0;
            const bPrice = flower.bundle_price ?? 0;
            if (bQty > 0 && bPrice > 0 && count >= bQty) {
                const bundles = Math.floor(count / bQty);
                const remainder = count - (bundles * bQty);
                total += (bundles * bPrice) + (remainder * flower.price);
            } else {
                total += count * flower.price;
            }
        }
    }

    return Math.round(total * 100) / 100;
}