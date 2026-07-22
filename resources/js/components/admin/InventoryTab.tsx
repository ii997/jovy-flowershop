import { useState, useEffect } from 'react';
import { Product, User } from '../../types';
import { Pagination } from '../Pagination';

interface InventoryTabProps {
    user: User | null;
    products: Product[];
    prices: Record<number, string>;
    onPriceChange: (productId: number, val: string) => void;
    onSavePrice: (productId: number) => void;
    onToggleAvailability: (productId: number) => void;
    onEditProduct: (product: Product) => void;
    onOpenCreateModal: () => void;
}

export function InventoryTab({
    user,
    products,
    prices,
    onPriceChange,
    onSavePrice,
    onToggleAvailability,
    onEditProduct,
    onOpenCreateModal,
}: InventoryTabProps) {
    const isAdmin = user?.role === 'admin';
    const PRODUCT_PER_PAGE = 8;
    const [productPage, setProductPage] = useState(1);

    // Reset to first page when the product list changes (e.g. after update)
    useEffect(() => {
        setProductPage(1);
    }, [products.length]);

    const totalProducts = products.length;
    const paginatedProducts = products.slice(
        (productPage - 1) * PRODUCT_PER_PAGE,
        productPage * PRODUCT_PER_PAGE
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center select-none">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-[#0A2A1B]">Inventory Catalog</h2>
                    <p className="text-xs text-[#0A2A1B]/60">Manage listed arrangements, modify prices, and update stock states</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onOpenCreateModal}
                        className="px-4 py-2.5 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-semibold rounded-full transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                        + Add Arrangement
                    </button>
                )}
            </div>

            {/* Inventory Table */}
            <div className="bg-white border border-[#0A2A1B]/5 rounded-3xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-[#0A2A1B]/5 text-[#0A2A1B]/60 uppercase tracking-wider text-[10px] font-bold">
                            <th className="py-3 px-4">Item</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Dimensions</th>
                            <th className="py-3 px-4">Price Override</th>
                            <th className="py-3 px-4 text-center">Stock Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A2A1B]/5 text-[#0A2A1B]/85">
                        {paginatedProducts.map(p => (
                            <tr key={p.id} className="hover:bg-[#FAF9F6]">
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={p.image}
                                            alt={p.name}
                                            className="w-10 h-10 object-cover rounded-xl border border-[#0A2A1B]/5"
                                        />
                                        <span className="font-semibold text-sm text-[#0A2A1B]">{p.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4">{p.category}</td>
                                <td className="py-4 px-4 text-[#0A2A1B]/60 font-medium">{p.dimensions}</td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#0A2A1B]/60">₱</span>
                                        <input
                                            type="text"
                                            value={prices[p.id] !== undefined ? prices[p.id] : p.price.toString()}
                                            onChange={(e) => onPriceChange(p.id, e.target.value)}
                                            disabled={!isAdmin}
                                            className="w-16 px-2 py-1 bg-white border border-[#0A2A1B]/15 rounded-lg text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] disabled:opacity-75 disabled:cursor-not-allowed"
                                        />
                                        {isAdmin && (
                                            <button
                                                onClick={() => onSavePrice(p.id)}
                                                className="px-2.5 py-1 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
                                            >
                                                Save
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <button
                                        onClick={() => onToggleAvailability(p.id)}
                                        disabled={!isAdmin}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                                            isAdmin ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-80'
                                        } ${p.availability
                                                ? 'bg-green-100 border border-green-200 text-green-700'
                                                : 'bg-red-100 border border-red-200 text-red-700'
                                            }`}
                                    >
                                        {p.availability ? 'In Stock' : 'Out of Stock'}
                                    </button>
                                </td>
                                <td className="py-4 px-4 text-right">
                                    {isAdmin ? (
                                        <button
                                            onClick={() => onEditProduct(p)}
                                            className="px-3 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/15 hover:border-transparent hover:bg-[#D97706] hover:text-white text-[10px] font-bold rounded-full transition-all cursor-pointer active:scale-95"
                                        >
                                            Edit Details
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 font-medium italic text-[11px]">Read-only</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Pagination
                    currentPage={productPage}
                    totalItems={totalProducts}
                    perPage={PRODUCT_PER_PAGE}
                    onPageChange={setProductPage}
                />
            </div>
        </div>
    );
}
