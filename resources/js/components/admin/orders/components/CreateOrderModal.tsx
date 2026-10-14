import { useState, useMemo } from 'react';
import { Product } from '../../../../types';
import { useCreateManualOrder } from '../../../../lib/adminQueries';
import { toast } from '../../../ui/Toast';
import { X, ShoppingBag, Add, Trash, Check, Search } from 'reicon-react';

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onOrderCreated?: () => void;
}

interface SelectedItem {
    product: Product;
    quantity: number;
}

export function CreateOrderModal({ isOpen, onClose, products, onOrderCreated }: CreateOrderModalProps) {
    const todayStr = new Date().toISOString().split('T')[0];

    const [recipientName, setRecipientName] = useState('Walk-in Customer');
    const [recipientPhone, setRecipientPhone] = useState('09000000000');
    const [pickupDate, setPickupDate] = useState(todayStr);
    const [pickupTime, setPickupTime] = useState('09:00');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
    const [isHandedOverImmediately, setIsHandedOverImmediately] = useState(true);
    const [notes, setNotes] = useState('');
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    // Product search in picker
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
    const [itemQty, setItemQty] = useState(1);

    const createManualOrderMutation = useCreateManualOrder();

    const activeProducts = useMemo(() => {
        return products.filter(p => !p.deleted_at);
    }, [products]);

    const filteredPickerProducts = useMemo(() => {
        if (!productSearch.trim()) return activeProducts;
        const q = productSearch.toLowerCase().trim();
        return activeProducts.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }, [activeProducts, productSearch]);

    if (!isOpen) return null;

    const handleAddItem = () => {
        if (!selectedProductId) return;
        const product = activeProducts.find(p => p.id === selectedProductId);
        if (!product) return;

        setSelectedItems(prev => {
            const existingIdx = prev.findIndex(item => item.product.id === product.id);
            if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx].quantity += itemQty;
                return updated;
            }
            return [...prev, { product, quantity: itemQty }];
        });

        setSelectedProductId('');
        setItemQty(1);
    };

    const handleRemoveItem = (productId: number) => {
        setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const handleQuantityChange = (productId: number, delta: number) => {
        setSelectedItems(prev =>
            prev.map(item => {
                if (item.product.id === productId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const orderTotal = selectedItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!recipientName.trim()) {
            toast.error('Please enter customer name');
            return;
        }

        if (selectedItems.length === 0) {
            toast.error('Please add at least one arrangement/item to the order');
            return;
        }

        try {
            await createManualOrderMutation.mutateAsync({
                recipient_name: recipientName.trim(),
                recipient_phone: recipientPhone.trim() || '09000000000',
                order_type: 'walk-in',
                pickup_date: pickupDate,
                pickup_time: pickupTime,
                payment_method: paymentMethod,
                status: isHandedOverImmediately ? 'delivered' : 'confirmed',
                gift_message: notes.trim() || undefined,
                items: selectedItems.map(i => ({
                    id: i.product.id,
                    quantity: i.quantity,
                })),
            });

            toast.success(`Walk-in order created successfully! (₱${orderTotal.toFixed(2)})`);
            onOrderCreated?.();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to create walk-in order');
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#0A2A1B]/10 max-h-[90vh] flex flex-col space-y-5 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#0A2A1B]/10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#0A2A1B] text-white flex items-center justify-center shadow-xs">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold font-serif text-[#0A2A1B]">New Walk-In Order</h3>
                            <p className="text-xs text-[#0A2A1B]/60">Create manual store register order & deduct inventory immediately</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {/* Customer & Handoff Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#FAF9F6] p-4 rounded-2xl border border-[#0A2A1B]/5">
                        <div>
                            <label className="text-[11px] font-bold text-[#0A2A1B] block mb-1">Customer Name</label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={e => setRecipientName(e.target.value)}
                                placeholder="e.g. Walk-in Customer or Maria Clara"
                                className="w-full px-3 py-2 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-[#0A2A1B] block mb-1">Phone Number (Optional)</label>
                            <input
                                type="text"
                                value={recipientPhone}
                                onChange={e => setRecipientPhone(e.target.value)}
                                placeholder="09000000000"
                                className="w-full px-3 py-2 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-[#0A2A1B] block mb-1">Pickup / Order Date</label>
                            <input
                                type="date"
                                value={pickupDate}
                                onChange={e => setPickupDate(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-[#0A2A1B] block mb-1">Pickup / Order Time</label>
                            <input
                                type="time"
                                min="05:00"
                                max="20:00"
                                value={pickupTime}
                                onChange={e => setPickupTime(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                                required
                            />
                            <p className="text-[10px] text-[#0A2A1B]/45 mt-1">Store pickup hours: 5:00 AM – 8:00 PM</p>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-[#0A2A1B] block mb-1">Payment Method</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                        paymentMethod === 'cash'
                                            ? 'bg-[#0A2A1B] text-white border-[#0A2A1B] shadow-2xs'
                                            : 'bg-white text-[#0A2A1B]/70 border-[#0A2A1B]/15 hover:bg-[#0A2A1B]/5'
                                    }`}
                                >
                                    💵 Cash
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('gcash')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                        paymentMethod === 'gcash'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                            : 'bg-white text-[#0A2A1B]/70 border-[#0A2A1B]/15 hover:bg-[#0A2A1B]/5'
                                    }`}
                                >
                                    📱 GCash
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Immediate Handoff Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-700" />
                            <div>
                                <span className="text-xs font-bold text-emerald-900 block">Completed & Handed Over Immediately</span>
                                <span className="text-[10px] text-emerald-700/80">Marks fulfillment as 'Delivered / Completed' now</span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={isHandedOverImmediately}
                            onChange={e => setIsHandedOverImmediately(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                    </div>

                    {/* Arrangement / Product Item Picker */}
                    <div className="space-y-2.5">
                        <label className="text-xs font-bold text-[#0A2A1B] uppercase tracking-wider block">Add Bouquet / Arrangement</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                    placeholder="Filter catalog items..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                                />
                            </div>
                            <select
                                value={selectedProductId}
                                onChange={e => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
                                className="flex-1 px-3 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs font-semibold text-[#0A2A1B] focus:outline-none focus:border-[#D97706] cursor-pointer"
                            >
                                <option value="">-- Select Floral Arrangement --</option>
                                {filteredPickerProducts.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (₱{p.price.toFixed(2)})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min={1}
                                value={itemQty}
                                onChange={e => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 px-2 py-1.5 bg-[#FAF9F6] border border-[#0A2A1B]/10 rounded-xl text-xs font-mono text-center text-[#0A2A1B] focus:outline-none focus:border-[#D97706]"
                            />
                            <button
                                type="button"
                                onClick={handleAddItem}
                                disabled={!selectedProductId}
                                className="px-4 py-1.5 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                                <Add className="w-3.5 h-3.5" />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>

                    {/* Selected Order Items List */}
                    <div className="border border-[#0A2A1B]/10 rounded-2xl overflow-hidden divide-y divide-slate-100">
                        {selectedItems.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">
                                No items added to walk-in cart yet. Select an arrangement above.
                            </div>
                        ) : (
                            selectedItems.map(item => (
                                <div key={item.product.id} className="p-3 flex items-center justify-between gap-3 bg-white">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-10 h-10 object-cover rounded-xl border border-slate-100 shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <span className="font-bold text-xs text-[#0A2A1B] block truncate">{item.product.name}</span>
                                            <span className="text-[11px] font-mono text-slate-500">₱{item.product.price.toFixed(2)} each</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => handleQuantityChange(item.product.id, -1)}
                                                className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                                            >
                                                -
                                            </button>
                                            <span className="px-2 py-0.5 text-xs font-mono font-bold">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleQuantityChange(item.product.id, 1)}
                                                className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <span className="font-mono font-bold text-xs text-[#0A2A1B] min-w-16 text-right">
                                            ₱{(item.product.price * item.quantity).toFixed(2)}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.product.id)}
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Notes / Message */}
                    <div>
                        <label className="text-[11px] font-bold text-[#0A2A1B] block mb-1">Staff / Register Note (Optional)</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Paid in full with cash, requested ribbon color..."
                            className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#0A2A1B]/15 rounded-xl text-xs text-[#0A2A1B] focus:outline-none focus:border-[#D97706] resize-none"
                        />
                    </div>

                    {/* Order Total & Submit */}
                    <div className="pt-2 border-t border-[#0A2A1B]/10 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2A1B]/50 block">Grand Total</span>
                            <div className="text-xl font-bold font-mono text-[#0A2A1B]">
                                ₱{orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createManualOrderMutation.isPending || selectedItems.length === 0}
                                className="px-5 py-2 bg-[#D97706] hover:bg-[#0A2A1B] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                {createManualOrderMutation.isPending ? 'Processing...' : 'Confirm & Record Order'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
