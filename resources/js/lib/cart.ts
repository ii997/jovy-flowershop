import { CartItem, Product } from '../types';

const STORAGE_KEY_V2 = 'jfs_cart_v2';
const STORAGE_KEY_V1 = 'jfs_cart_v1';

export interface StoredCartLine {
    id: number;
    quantity: number;
}

function isValidLine(line: any): line is StoredCartLine {
    return (
        line &&
        Number.isInteger(line.id) &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0
    );
}

function clampQty(qty: number): number {
    if (!Number.isInteger(qty) || qty <= 0) return 1;
    return Math.min(qty, 99);
}

/** Read persisted id+qty lines. Supports legacy v1 (full product snapshots) for migration. */
export function loadStoredCart(): StoredCartLine[] {
    try {
        const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
        if (rawV2) {
            const parsed = JSON.parse(rawV2);
            if (Array.isArray(parsed)) {
                return parsed.filter(isValidLine).map(l => ({ id: l.id, quantity: clampQty(l.quantity) }));
            }
        }
        const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
        if (rawV1) {
            const parsed = JSON.parse(rawV1);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item: any) => ({
                        id: item?.product?.id ?? item?.id,
                        quantity: item?.quantity,
                    }))
                    .filter(isValidLine)
                    .map(l => ({ id: l.id, quantity: clampQty(l.quantity) }));
            }
        }
    } catch {
        // Corrupt storage — start empty.
    }
    return [];
}

/** Merge stored lines with the fresh catalog so prices/availability never go stale. */
export function rehydrateCart(stored: StoredCartLine[], products: Product[]): CartItem[] {
    if (stored.length === 0 || products.length === 0) return [];
    const byId = new Map(products.map(p => [p.id, p]));
    const merged = new Map<number, CartItem>();
    for (const line of stored) {
        const product = byId.get(line.id);
        if (!product) continue;
        const existing = merged.get(line.id);
        if (existing) {
            existing.quantity = Math.min(existing.quantity + line.quantity, 99);
        } else {
            merged.set(line.id, { product, quantity: clampQty(line.quantity) });
        }
    }
    return [...merged.values()];
}

/** @deprecated Use loadStoredCart + rehydrateCart so prices stay fresh. Kept for compat. */
export function loadCart(): CartItem[] {
    return loadStoredCart().map(line => ({
        product: { id: line.id } as Product,
        quantity: line.quantity,
    }));
}

export function saveCart(items: CartItem[]): void {
    try {
        const lines: StoredCartLine[] = items
            .filter(i => Number.isInteger(i?.product?.id))
            .map(i => ({ id: i.product.id, quantity: clampQty(i.quantity) }));
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(lines));
        localStorage.removeItem(STORAGE_KEY_V1);
    } catch {
        // Storage full or unavailable — cart stays in memory only.
    }
}

export function clearCartStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY_V2);
        localStorage.removeItem(STORAGE_KEY_V1);
    } catch {
        // Ignore.
    }
}

export function maxQtyFor(product: Product): number {
    const stock = (product as { quantity?: unknown }).quantity;
    if (typeof stock === 'number' && Number.isFinite(stock) && stock > 0) {
        return Math.min(Math.floor(stock), 99);
    }
    return 99;
}

export function addToCart(items: CartItem[], product: Product, qty = 1): CartItem[] {
    const cap = maxQtyFor(product);
    const add = Math.min(Math.max(qty, 1), cap);
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
        return items.map(i =>
            i.product.id === product.id
                ? { ...i, product, quantity: Math.min(i.quantity + add, cap) }
                : i
        );
    }
    return [...items, { product, quantity: Math.min(add, cap) }];
}

export function cartCount(items: CartItem[]): number {
    return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotal(items: CartItem[]): number {
    return items.reduce((sum, i) => sum + (i.product.price || 0) * i.quantity, 0);
}
