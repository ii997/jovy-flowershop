import { StrictMode, useState, useEffect, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Product, User, Order } from './types';
import { csrfToken } from './lib/utils';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { ProductList } from './components/ProductList';
import { Footer } from './components/Footer';
import { ToastContainer, toast } from './components/ui/Toast';

// Lazy-loaded — only fetched when first needed.
// React.lazy() requires a default export, so we map the named export.
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const OrderSummaryModal = lazy(() => import('./components/OrderSummaryModal').then(m => ({ default: m.OrderSummaryModal })));
const OrderConfirmedModal = lazy(() => import('./components/OrderConfirmedModal').then(m => ({ default: m.OrderConfirmedModal })));

function App() {
    // Dynamic catalog & order states
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Authentication states
    const [user, setUser] = useState<User | null>(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Order states
    const [orders, setOrders] = useState<Order[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [isConfirmedOpen, setIsConfirmedOpen] = useState(false);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    // Load catalog items from backend database
    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to load products');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    // Load order history / queues
    const fetchOrders = async (currentUser: User | null) => {
        if (!currentUser) return;
        try {
            const response = await fetch('/api/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to load orders');
        }
    };

    // Fetch active user session and store settings on load
    useEffect(() => {
        fetchProducts();

        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setIsMaintenanceMode(!!data.maintenance_mode);
                        localStorage.setItem('store_settings_downpayment_pct', String(data.downpayment_pct ?? 30));
                        localStorage.setItem('store_settings_name', data.store_name || "Jovy's Flowershop");
                        localStorage.setItem('store_settings_phone', data.store_phone || "+63-2-555-1234");
                        localStorage.setItem('store_settings_maintenance', String(!!data.maintenance_mode));
                        localStorage.setItem('store_settings_qr_image', data.qr_image || "");
                    }
                }
            } catch (e) {
                console.error("Failed to load store settings from API", e);
            }
        };
        fetchSettings();
        
        const checkSession = async () => {
            try {
                const response = await fetch('/api/user');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.id) {
                        setUser(data);
                        fetchOrders(data);
                        // Do not redirect on storefront load, allowing browsing
                    }
                }
            } catch (error) {
                // Guest session
            }
        };
        checkSession();
    }, []);

    const handleOrderBouquet = (product: Product) => {
        if (isMaintenanceMode && user?.role !== 'admin' && user?.role !== 'staff') {
            toast.error('Store is currently undergoing scheduled maintenance. New orders & reservations are temporarily disabled.');
            return;
        }
        setSelectedProduct(product);
        setIsCheckoutOpen(true);
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });
        } catch (error) {
            console.error('Logout failed');
        }
        setUser(null);
        setOrders([]);
        setIsProfileOpen(false);
        toast.success('Logged out successfully!');
    };

    const handleLoginSuccess = (loggedUser: User) => {
        setUser(loggedUser);
        fetchOrders(loggedUser);
        // Redirect staff or admin immediately
        if (loggedUser.role === 'staff' || loggedUser.role === 'admin') {
            window.location.href = '/admin';
        }
    };

    const handleCheckoutSuccess = (order: Order) => {
        setActiveOrder(order);
        setIsCheckoutOpen(false);
        setIsSummaryOpen(true);
        fetchOrders(user);
        fetchProducts(); // Refresh product quantities so cards show updated stock
    };

    // Render Storefront View
    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#0A2A1B] font-sans antialiased selection:bg-[#D97706]/20">
            <ToastContainer />
            <Header
                user={user}
                onAuthClick={() => setIsAuthOpen(true)}
                onDashboardClick={() => { window.location.href = '/admin'; }}
                onLogout={handleLogout}
                onProfileClick={() => setIsProfileOpen(true)}
            />
            {isMaintenanceMode && (
                <div className="bg-[#D97706] text-white px-4 py-3 text-center text-xs font-bold tracking-wide shadow-md flex items-center justify-center gap-2 select-none border-b border-[#D97706]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Store Notice: Under Maintenance — Browsing is open, but online orders & reservations are temporarily paused.</span>
                </div>
            )}
            <Hero />
            <Features />
            <ProductList 
                products={products} 
                onOrderBouquet={handleOrderBouquet} 
                isAuthenticated={!!user}
                onAuthClick={() => setIsAuthOpen(true)}
                isLoading={isLoadingProducts}
            />
            <Footer />

            {/* Auth Popup Modals — lazy loaded */}
            <Suspense fallback={null}>
                <AuthModal
                    isOpen={isAuthOpen}
                    onClose={() => setIsAuthOpen(false)}
                    onLoginSuccess={handleLoginSuccess}
                />

                <ProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    user={user}
                    onUpdateSuccess={(updatedUser) => setUser(updatedUser)}
                    orders={orders}
                    onSelectOrderToPay={(order) => {
                        setActiveOrder(order);
                        setIsProfileOpen(false);
                        setIsSummaryOpen(true);
                    }}
                    onCancelSuccess={() => {
                        fetchOrders(user);
                        fetchProducts();
                    }}
                />

                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    product={selectedProduct}
                    onCheckoutSuccess={handleCheckoutSuccess}
                />

                <OrderSummaryModal
                    key={activeOrder?.id ?? 'empty'}
                    isOpen={isSummaryOpen}
                    onClose={() => {
                        setIsSummaryOpen(false);
                        setActiveOrder(null);
                    }}
                    order={activeOrder}
                    onPaymentSuccess={() => {
                        setIsSummaryOpen(false);
                        setIsConfirmedOpen(true);
                        fetchProducts(); // Refresh product quantities after payment is confirmed
                        fetchOrders(user); // Refresh order status after payment
                    }}
                />

                <OrderConfirmedModal
                    isOpen={isConfirmedOpen}
                    onClose={() => {
                        setIsConfirmedOpen(false);
                        setActiveOrder(null);
                    }}
                    order={activeOrder}
                />
            </Suspense>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}
