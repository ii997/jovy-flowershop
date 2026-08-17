import { useState, useEffect, useRef } from 'react';
import { Product, User } from '../types';
import { ProductEditModal } from './ProductEditModal';
import { ProductCreateModal } from './ProductCreateModal';
import { toast } from './ui/Toast';
import { Menu, ChevronDown } from 'reicon-react';
import { NotificationBell } from './NotificationBell';
import { motion, AnimatePresence } from 'motion/react';
import { AdminSidebar } from './admin/AdminSidebar';
import { DashboardTab } from './admin/DashboardTab';
import { OrdersTab } from './admin/OrdersTab';
import { InventoryTab } from './admin/InventoryTab';
import { FlowersTab } from './admin/FlowersTab';
import { SettingsTab } from './admin/SettingsTab';
import {
    useAdminStats,
    useAdminOrders,
    useAdminFlowers,
    useToggleAvailability,
} from '../lib/adminQueries';

interface AdminPanelProps {
    user: User | null;
    products: Product[];
    onUpdateProducts: (updatedProducts: Product[]) => void;
    onBackToStore: () => void;
    onLogout: () => void;
    isLoadingProducts?: boolean;
}

export function AdminPanel({ user, products, onUpdateProducts, onBackToStore, onLogout, isLoadingProducts = false }: AdminPanelProps) {
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

    // TanStack Queries for reactive admin state
    const { data: stats = { gross_sales: 0, total_orders: 0, active_listings: 0, recent_orders: [], revenue_tracking: { paid: 0, pending: 0 }, top_products: [], occasions_breakdown: {}, seasons_breakdown: {}, trends: { daily: [], monthly: [], yearly: [] }, patterns: { average_order_size: 0, repeat_rate: 0, total_customers: 0 } }, isLoading: isLoadingStats } = useAdminStats();
    const { data: orders = [], isLoading: isLoadingOrders } = useAdminOrders();
    const { data: flowers = [], isLoading: isLoadingFlowers } = useAdminFlowers();

    // TanStack Mutations
    const toggleAvailabilityMutation = useToggleAvailability();

    const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Handle availability toggle via TanStack Mutation
    const handleToggleAvailability = async (productId: number) => {
        try {
            const updatedProduct = await toggleAvailabilityMutation.mutateAsync(productId);
            onUpdateProducts(products.map(p => p.id === productId ? updatedProduct : p));
            toast.success('Arrangement availability updated.');
        } catch {
            toast.error('Failed to toggle availability.');
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
                        <Menu className="h-6 w-6" />
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
                                <ChevronDown className={`h-3.5 w-3.5 text-[#0A2A1B]/50 mr-1 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
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
                    {activeTab === 'dashboard' && <DashboardTab stats={stats} isLoading={isLoadingStats} />}

                    {activeTab === 'orders' && (
                        <OrdersTab orders={orders} isLoading={isLoadingOrders} />
                    )}

                    {activeTab === 'inventory' && (
                        <InventoryTab
                            user={user}
                            products={products}
                            onToggleAvailability={handleToggleAvailability}
                            onEditProduct={(p) => {
                                setSelectedProductForEdit(p);
                                setIsEditModalOpen(true);
                            }}
                            onOpenCreateModal={() => setIsCreateModalOpen(true)}
                            isLoading={isLoadingProducts}
                        />
                    )}

                    {activeTab === 'flowers' && (
                        <FlowersTab
                            flowers={flowers}
                            isAdmin={user?.role === 'admin'}
                            isLoading={isLoadingFlowers}
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
