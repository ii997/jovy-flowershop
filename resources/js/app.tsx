import { StrictMode, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Product, User, Order, CartItem } from './types';
import { csrfToken } from './lib/utils';
import { addToCart as addToCartHelper, cartCount, clearCartStorage, loadStoredCart, maxQtyFor, rehydrateCart, saveCart } from './lib/cart';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { ProductList } from './components/ProductList';
import { Footer } from './components/Footer';
import { ToastContainer, toast } from './components/ui/Toast';
import { ConfirmationDialog } from './components/ui/ConfirmationDialog';
import { AlertTriangle } from 'reicon-react';

// Lazy-loaded — only fetched when first needed.
// React.lazy() requires a default export, so we map the named export.
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const OrderSummaryModal = lazy(() => import('./components/OrderSummaryModal').then(m => ({ default: m.OrderSummaryModal })));
const OrderConfirmedModal = lazy(() => import('./components/OrderConfirmedModal').then(m => ({ default: m.OrderConfirmedModal })));
const PaymentResubmissionModal = lazy(() => import('./components/PaymentResubmissionModal').then(m => ({ default: m.PaymentResubmissionModal })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));

function App() {
    // Dynamic catalog & order states
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCartCheckout, setIsCartCheckout] = useState(false);
    const cartRehydrated = useRef(false);

    // Authentication states
    const [user, setUser] = useState<User | null>(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Order states
    const [orders, setOrders] = useState<Order[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [isConfirmedOpen, setIsConfirmedOpen] = useState(false);
    const [isResubmissionOpen, setIsResubmissionOpen] = useState(false);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [resubmittingOrder, setResubmittingOrder] = useState<Order | null>(null);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isSurgePricing, setIsSurgePricing] = useState(false);
    const [isSurgeExemptFuneral, setIsSurgeExemptFuneral] = useState(true);
    const [shopOccasion, setShopOccasion] = useState<string | undefined>(undefined);
    const [shopSearch, setShopSearch] = useState<string | undefined>(undefined);

    // Load catalog items from backend database
    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data.data ?? data);
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
                        setIsSurgePricing(!!data.surge_pricing);
                        setIsSurgeExemptFuneral(data.surge_exempt_funeral !== undefined ? !!data.surge_exempt_funeral : true);
                        localStorage.setItem('store_settings_downpayment_pct', String(data.downpayment_pct ?? 30));
                        localStorage.setItem('store_settings_name', data.store_name || "Jovy's Flowershop");
                        localStorage.setItem('store_settings_phone', data.store_phone || "+639097850776");
                        localStorage.setItem('store_settings_maintenance', String(!!data.maintenance_mode));
                        localStorage.setItem('store_settings_surge_pricing', String(!!data.surge_pricing));
                        localStorage.setItem('store_settings_surge_exempt_funeral', String(data.surge_exempt_funeral !== undefined ? !!data.surge_exempt_funeral : true));
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

    // Persist cart across reloads (id+qty only; snapshots refreshed from catalog)
    useEffect(() => {
        if (!cartRehydrated.current) return;
        saveCart(cart);
    }, [cart]);

    // Rehydrate persisted cart against the fresh catalog so prices/availability never go stale
    useEffect(() => {
        if (cartRehydrated.current || products.length === 0) return;
        cartRehydrated.current = true;
        setCart(rehydrateCart(loadStoredCart(), products));
    }, [products]);

    const handleOrderBouquet = (product: Product) => {
        if (isMaintenanceMode && user?.role !== 'admin' && user?.role !== 'staff') {
            toast.error('Store is currently undergoing scheduled maintenance. New orders & reservations are temporarily disabled.');
            return;
        }
        setSelectedProduct(product);
        setCheckoutItems([{ product, quantity: 1 }]);
        setIsCartCheckout(false);
        setIsCheckoutOpen(true);
    };

    const handleAddToCart = (product: Product) => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }
        if (!product.availability) {
            toast.error(`${product.name} is currently out of stock.`);
            return;
        }
        const cap = maxQtyFor(product);
        const current = cart.find(i => i.product.id === product.id)?.quantity ?? 0;
        if (current >= cap) {
            toast.error(`Only ${cap} × ${product.name} available.`);
            return;
        }
        setCart(prev => addToCartHelper(prev, product, 1));
        toast.success(`${product.name} added to cart!`);
    };

    const handleUpdateCartQty = (productId: number, qty: number) => {
        if (qty <= 0) {
            setCart(prev => prev.filter(i => i.product.id !== productId));
            return;
        }
        const product = cart.find(i => i.product.id === productId)?.product
            ?? products.find(p => p.id === productId);
        const cap = product ? maxQtyFor(product) : 99;
        if (qty > cap) {
            toast.error(`Only ${cap} available.`);
            return;
        }
        setCart(prev => prev.map(i =>
            i.product.id === productId ? { ...i, quantity: Math.min(qty, cap) } : i
        ));
    };

    const handleRemoveFromCart = (productId: number) => {
        setCart(prev => prev.filter(i => i.product.id !== productId));
    };

    const handleClearCart = () => {
        setCart([]);
        clearCartStorage();
    };

    const handleCartCheckout = () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }
        if (isMaintenanceMode && user?.role !== 'admin' && user?.role !== 'staff') {
            toast.error('Store is currently undergoing scheduled maintenance. New orders & reservations are temporarily disabled.');
            return;
        }
        setSelectedProduct(null);
        setCheckoutItems(cart);
        setIsCartCheckout(true);
        setIsCartOpen(false);
        setIsCheckoutOpen(true);
    };

    const handleSelectOccasionFlower = (occasion: string, flowerName?: string) => {
        setShopOccasion(occasion);
        setShopSearch(flowerName || '');
        const target = document.getElementById('shop');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleLogout = async () => {
        setIsLogoutConfirmOpen(true);
    };

    const confirmLogout = async () => {
        setIsLoggingOut(true);
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
            });
            const data = await response.json().catch(() => null);
            if (data?.csrf_token) {
                const metaTag = document.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', data.csrf_token);
                }
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
        setUser(null);
        setOrders([]);
        setIsProfileOpen(false);
        setIsLogoutConfirmOpen(false);
        setIsLoggingOut(false);
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
        if (isCartCheckout) {
            setCart([]);
            clearCartStorage();
            setIsCartCheckout(false);
        }
        setCheckoutItems([]);
        setSelectedProduct(null);
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
                cartCount={cartCount(cart)}
                onCartClick={() => setIsCartOpen(true)}
            />
            <ConfirmationDialog
                isOpen={isLogoutConfirmOpen}
                title="Log out?"
                message="Are you sure you want to log out of your Jovy's Flowershop account?"
                confirmLabel="Log Out"
                cancelLabel="Stay Logged In"
                variant="danger"
                isProcessing={isLoggingOut}
                onConfirm={confirmLogout}
                onCancel={() => {
                    if (!isLoggingOut) setIsLogoutConfirmOpen(false);
                }}
            />
            {isMaintenanceMode && (
                <div className="bg-[#D97706] text-white px-4 py-3 text-center text-xs font-bold tracking-wide shadow-md flex items-center justify-center gap-2 select-none border-b border-[#D97706]/20">
                    <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
                    <span>Store Notice: Under Maintenance — Browsing is open, but online orders & reservations are temporarily paused.</span>
                </div>
            )}
            {!isMaintenanceMode && isSurgePricing && (
                <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 text-white px-4 py-2.5 text-center text-xs font-semibold tracking-wide shadow-xs flex items-center justify-center gap-2 select-none border-b border-rose-950/20">
                    <span className="text-sm">🌹</span>
                    <span>
                        <strong>Holiday Seasonal Rates in Effect:</strong>{' '}
                        {isSurgeExemptFuneral ? (
                            <>
                                Standard flower bouquets are currently under 2x holiday rates.{' '}
                                <span className="text-rose-200 ml-1">🕊️ Funeral & Sympathy arrangements remain at regular pricing.</span>
                            </>
                        ) : (
                            <>
                                All flower arrangements (including 🕯️ Memorial & Cemetery arrangements) are currently under 2x holiday rates.
                            </>
                        )}
                    </span>
                </div>
            )}

            <Hero />
            <Features 
                products={products}
                onSelectOccasionFlower={handleSelectOccasionFlower}
            />
            <ProductList
                products={products}
                onOrderBouquet={handleOrderBouquet}
                onAddToCart={handleAddToCart}
                isAuthenticated={!!user}
                onAuthClick={() => setIsAuthOpen(true)}
                isLoading={isLoadingProducts}
                activeOccasion={shopOccasion}
                activeSearch={shopSearch}
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
                    onSelectOrderToResubmit={(order) => {
                        setResubmittingOrder(order);
                        setIsProfileOpen(false);
                        setIsResubmissionOpen(true);
                    }}
                    onCancelSuccess={() => {
                        fetchOrders(user);
                        fetchProducts();
                    }}
                    onLogout={handleLogout}
                />

                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    product={selectedProduct}
                    items={checkoutItems}
                    onCheckoutSuccess={handleCheckoutSuccess}
                />

                <CartDrawer
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    items={cart}
                    onUpdateQty={handleUpdateCartQty}
                    onRemove={handleRemoveFromCart}
                    onCheckout={handleCartCheckout}
                    onClear={handleClearCart}
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

                <PaymentResubmissionModal
                    key={`resubmit-${resubmittingOrder?.id ?? 'empty'}`}
                    isOpen={isResubmissionOpen}
                    onClose={() => {
                        setIsResubmissionOpen(false);
                        setResubmittingOrder(null);
                    }}
                    order={resubmittingOrder}
                    onResubmissionSuccess={() => {
                        setIsResubmissionOpen(false);
                        setResubmittingOrder(null);
                        fetchProducts();
                        fetchOrders(user);
                        toast.success('Payment proof resubmitted successfully! The store will re-verify your order shortly.');
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
