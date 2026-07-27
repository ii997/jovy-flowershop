import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Product, User } from './types';
import { AdminPanel } from './components/AdminPanel';
import { ToastContainer } from './components/ui/Toast';
import { csrfToken } from './lib/utils';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function AdminApp() {
    const [user, setUser] = useState<User | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    // Load active session and products
    useEffect(() => {
        const checkAdminSession = async () => {
            try {
                const response = await fetch('/api/user');
                if (response.ok) {
                    const currentUser = await response.json();
                    if (currentUser && currentUser.id && (currentUser.role === 'admin' || currentUser.role === 'staff')) {
                        setUser(currentUser);
                        setIsLoading(false);

                        // Fetch products for inventory
                        try {
                            const prodRes = await fetch('/api/products');
                            if (prodRes.ok) {
                                const prodData = await prodRes.json();
                                setProducts(prodData.data ?? prodData);
                            }
                        } catch (e) {
                            console.error('Failed to load products in admin', e);
                        } finally {
                            setIsLoadingProducts(false);
                        }
                    } else {
                        // Not an admin/staff, redirect to storefront
                        window.location.href = '/';
                    }
                } else {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Failed to verify session:', error);
                window.location.href = '/';
            }
        };

        checkAdminSession();
    }, []);

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
        window.location.href = '/';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6]">
                <div className="flex flex-col items-center gap-3">
                    <span className="text-3xl text-[#D97706] animate-pulse">✿</span>
                    <p className="text-sm font-semibold tracking-wide text-[#0A2A1B]/60 font-sans">
                        Verifying administration access…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <AdminPanel
            user={user}
            products={products}
            isLoadingProducts={isLoadingProducts}
            onUpdateProducts={(updated) => setProducts(updated)}
            onBackToStore={() => {
                window.location.href = '/';
            }}
            onLogout={handleLogout}
        />
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <ToastContainer />
                <AdminApp />
            </QueryClientProvider>
        </React.StrictMode>
    );
}
