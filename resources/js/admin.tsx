import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Product, User } from './types';
import { AdminPanel } from './components/AdminPanel';
import { ToastContainer } from './components/ui/Toast';

function AdminApp() {
    const [user, setUser] = useState<User | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    // Load active session and products
    useEffect(() => {
        const checkAdminSession = async () => {
            try {
                const response = await fetch('/api/user');
                if (response.ok) {
                    const currentUser = await response.json();
                    if (currentUser && currentUser.id && (currentUser.role === 'admin' || currentUser.role === 'staff')) {
                        setUser(currentUser);
                        // Once authenticated, fetch products
                        const prodRes = await fetch('/api/products');
                        if (prodRes.ok) {
                            const prodData = await prodRes.json();
                            setProducts(prodData);
                        }
                        setIsLoading(false);
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
        <>
            <ToastContainer />
            <AdminPanel
                user={user}
                products={products}
                onUpdateProducts={(updated) => setProducts(updated)}
                onBackToStore={() => {
                    window.location.href = '/';
                }}
                onLogout={handleLogout}
            />
        </>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <AdminApp />
        </React.StrictMode>
    );
}
