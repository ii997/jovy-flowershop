import { useState, useEffect, useRef } from 'react';
import { Product, User, Order, DashboardStats } from '../types';
import { ProductEditModal } from './ProductEditModal';
import { ProductCreateModal } from './ProductCreateModal';
import { toast } from './ui/Toast';
import { NotificationBell } from './NotificationBell';
import { motion, AnimatePresence } from 'motion/react';
import { AdminSidebar } from './admin/AdminSidebar';
import { DashboardTab } from './admin/DashboardTab';
import { OrdersTab } from './admin/OrdersTab';
import { InventoryTab } from './admin/InventoryTab';
import { FlowersTab } from './admin/FlowersTab';
import { SettingsTab } from './admin/SettingsTab';

interface AdminPanelProps {
    user: User | null;
    products: Product[];
    onUpdateProducts: (updatedProducts: Product[]) => void;
    onBackToStore: () => void;
    onLogout: () => void;
}

export function AdminPanel({ user, products, onUpdateProducts, onBackToStore, onLogout }: AdminPanelProps) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'flowers' | 'settings'>('dashboard');
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Admin state
    const [stats, setStats] = useState<DashboardStats>({ gross_sales: 0, total_orders: 0, active_listings: 0, recent_orders: [], revenue_tracking: { paid: 0, pending: 0 }, top_products: [], occasions_breakdown: {}, seasons_breakdown: {}, trends: { daily: [], monthly: [], yearly: [] }, patterns: { average_order_size: 0, repeat_rate: 0, total_customers: 0 } });
    const [orders, setOrders] = useState<Order[]>([]);
    const [flowers, setFlowers] = useState<any[]>([]);
    const [prices, setPrices] = useState<Record<number, string>>({});
    const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // CSRF Utility
    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    // Load admin metrics & inventory
    const loadStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to load stats');
        }
    };

    const loadOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders?per_page=200');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.data ?? data);
            }
        } catch (error) {
            console.error('Failed to load orders');
        }
    };

    const loadFlowers = async () => {
        try {
            const res = await fetch('/api/admin/flowers');
            if (res.ok) {
                const data = await res.json();
                setFlowers(data);
            }
        } catch {
            console.error('Failed to load flowers');
        }
    };

    useEffect(() => {
        loadStats();
        loadOrders();
        loadFlowers();
        // Initialize prices from products state
        setPrices(products.reduce((acc, p) => ({ ...acc, [p.id]: p.price.toString() }), {}));
    }, [products, activeTab]);

    const handlePriceChange = (productId: number, val: string) => {
        setPrices(prev => ({ ...prev, [productId]: val }));
    };

    // Handle price update on the database
    const handleSavePrice = async (productId: number) => {
        const numeric = parseFloat(prices[productId]);
        if (isNaN(numeric) || numeric < 0) {
            toast.error('Please enter a valid price.');
            return;
        }

        try {
            const res = await fetch(`/api/admin/products/${productId}/price`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ price: numeric }),
            });

            if (res.ok) {
                const updatedProduct = await res.json();
                onUpdateProducts(products.map(p => p.id === productId ? updatedProduct : p));
                toast.success('Price updated successfully.');
            } else {
                toast.error('Failed to update price.');
            }
        } catch (error) {
            toast.error('Connection error. Please try again.');
        }
    };

    // Handle availability toggle on the database
    const handleToggleAvailability = async (productId: number) => {
        try {
            const res = await fetch(`/api/admin/products/${productId}/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });

            if (res.ok) {
                const updatedProduct = await res.json();
                onUpdateProducts(products.map(p => p.id === productId ? updatedProduct : p));
                toast.success(`Arrangement availability updated.`);
            } else {
                toast.error('Failed to toggle availability.');
            }
        } catch (error) {
            toast.error('Connection error. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#0A2A1B] font-sans antialiased flex flex-col md:flex-row select-none">
            {/* Mobile Header Bar */}
            <div className="flex md:hidden items-center justify-between p-4 bg-white border-b border-[#0A2A1B]/10 sticky top-0 z-40 w-full shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-2xl text-[#D97706]">✿</span>
                    <span className="font-serif text-lg font-extrabold tracking-tight text-[#0A2A1B]">Jovy Floral</span>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 text-[#0A2A1B] hover:bg-[#0A2A1B]/5 rounded-xl cursor-pointer transition-colors"
                        aria-label="Open menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <AdminSidebar
                user={user}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBackToStore={onBackToStore}
                onLogout={onLogout}
                pendingOrdersCount={orders.filter(o => 
                    o.status !== 'confirmed' && 
                    o.status !== 'delivered' && 
                    o.status !== 'cancelled' && 
                    o.payment_status !== 'verified'
                ).length}
                lowStockCount={products.filter(p => !p.availability).length}
                isMobileOpen={isMobileOpen}
                onMobileClose={() => setIsMobileOpen(false)}
            />

            {/* Main Content Area Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Desktop Global Admin Header */}
                <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-[#0A2A1B]/10 sticky top-0 z-30 w-full shrink-0 select-none">
                    <div className="flex items-center gap-2.5">
                        <h2 className="font-serif text-lg font-bold text-[#0A2A1B]">
                            {{
                                dashboard: 'Dashboard',
                                orders: 'Orders',
                                inventory: 'Inventory',
                                flowers: 'Flowers',
                                settings: 'Settings'
                            }[activeTab] || 'Dashboard'}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="h-5 w-px bg-[#0A2A1B]/10" />
                        
                        {/* Interactive Admin User Pop-over */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                className="flex items-center gap-2 p-1.5 hover:bg-[#0A2A1B]/5 rounded-full transition-all cursor-pointer border border-[#0A2A1B]/10 focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#0A2A1B] text-white flex items-center justify-center font-bold text-xs">
                                    {user?.name.charAt(0).toUpperCase()}
                                </div>
                                <svg className={`h-3.5 w-3.5 text-[#0A2A1B]/50 mr-1 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>

                            <AnimatePresence>
                                {isUserDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2.5 w-48 bg-white border border-[#0A2A1B]/10 rounded-2xl shadow-xl py-2.5 z-50 origin-top-right text-left"
                                    >
                                        <div className="px-4 py-1.5 border-b border-[#0A2A1B]/5 mb-1.5">
                                            <span className="text-xs font-bold text-[#0A2A1B] leading-none block truncate">{user?.name}</span>
                                            <span className="text-[9px] font-extrabold uppercase text-[#D97706] tracking-wider leading-none mt-1 block">{user?.role}</span>
                                        </div>
                                        
                                        <button
                                            onClick={() => {
                                                setIsUserDropdownOpen(false);
                                                setActiveTab('settings');
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-[#0A2A1B]/5 text-xs font-semibold text-[#0A2A1B]/80 cursor-pointer transition-colors block"
                                        >
                                            Settings
                                        </button>
                                        
                                        <button
                                            onClick={() => {
                                                setIsUserDropdownOpen(false);
                                                onLogout();
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-xs font-semibold text-red-600 cursor-pointer transition-colors block"
                                        >
                                            Log Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Tab Content */}
                <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-[calc(100vh-65px)] md:max-h-[calc(100vh-68px)]">
                    {activeTab === 'dashboard' && <DashboardTab stats={stats} />}

                    {activeTab === 'orders' && (
                        <OrdersTab orders={orders} onUpdateOrders={setOrders} />
                    )}

                    {activeTab === 'inventory' && (
                        <InventoryTab
                            user={user}
                            products={products}
                            prices={prices}
                            onPriceChange={handlePriceChange}
                            onSavePrice={handleSavePrice}
                            onToggleAvailability={handleToggleAvailability}
                            onEditProduct={(p) => {
                                setSelectedProductForEdit(p);
                                setIsEditModalOpen(true);
                            }}
                            onOpenCreateModal={() => setIsCreateModalOpen(true)}
                        />
                    )}

                    {activeTab === 'flowers' && (
                        <FlowersTab
                            flowers={flowers}
                            onFlowersChange={setFlowers}
                            isAdmin={user?.role === 'admin'}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsTab user={user} />
                    )}
                </main>
            </div>

            <ProductEditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedProductForEdit(null);
                }}
                product={selectedProductForEdit}
                flowers={flowers}
                onUpdateSuccess={(updatedProduct) => {
                    onUpdateProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
                }}
            />

            <ProductCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                flowers={flowers}
                onCreateSuccess={(newProduct) => {
                    onUpdateProducts([...products, { ...newProduct, price: newProduct.price ?? 0 }]);
                }}
            />
        </div>
    );
}
