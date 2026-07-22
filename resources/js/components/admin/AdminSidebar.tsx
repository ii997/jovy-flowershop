import { useState, useEffect } from 'react';
import { User } from '../../types';

interface AdminSidebarProps {
    user: User | null;
    activeTab: 'dashboard' | 'orders' | 'inventory' | 'flowers' | 'settings';
    onTabChange: (tab: 'dashboard' | 'orders' | 'inventory' | 'flowers' | 'settings') => void;
    onBackToStore: () => void;
    onLogout: () => void;
    pendingOrdersCount?: number;
    lowStockCount?: number;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function AdminSidebar({
    user,
    activeTab,
    onTabChange,
    onBackToStore,
    onLogout,
    pendingOrdersCount = 0,
    lowStockCount = 0,
    isMobileOpen = false,
    onMobileClose,
}: AdminSidebarProps) {
    const isAdmin = user?.role === 'admin';

    // Collapsible state persisted in localStorage
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            const stored = localStorage.getItem('admin_sidebar_collapsed');
            return stored === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('admin_sidebar_collapsed', String(isCollapsed));
        } catch (e) {
            console.error('Failed to save sidebar state to localStorage', e);
        }
    }, [isCollapsed]);

    const navItems = [
        {
            id: 'dashboard' as const,
            label: 'Dashboard',
            isAdminOnly: true,
            icon: (active: boolean) => (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${active ? 'text-[#D97706]' : 'text-[#0A2A1B]/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            id: 'orders' as const,
            label: 'Orders Queue',
            isAdminOnly: false,
            badge: pendingOrdersCount,
            icon: (active: boolean) => (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${active ? 'text-[#D97706]' : 'text-[#0A2A1B]/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
        {
            id: 'inventory' as const,
            label: 'Inventory',
            isAdminOnly: false,
            badge: lowStockCount,
            icon: (active: boolean) => (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${active ? 'text-[#D97706]' : 'text-[#0A2A1B]/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            )
        },
        {
            id: 'flowers' as const,
            label: 'Flowers',
            isAdminOnly: false,
            icon: (active: boolean) => (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${active ? 'text-[#D97706]' : 'text-[#0A2A1B]/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 00-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 00-3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a3 3 0 003-3c0-2-3-5-3-5s-3 3-3 5a3 3 0 003 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12a3 3 0 003 3c2 0 5-3 5-3s-3-3-5-3a3 3 0 00-3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 12a3 3 0 00-3-3c-2 0-5 3-5 3s3 3 5 3a3 3 0 00-3-3z" />
                </svg>
            )
        }
    ];

    return (
        <>
            {/* Backdrop for Mobile Drawer */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-[#0A2A1B]/10 flex flex-col justify-between select-none shadow-lg transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-sm ${
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                } ${
                    isCollapsed ? 'w-64 md:w-20 md:p-4' : 'w-64 md:p-6'
                } p-6`}
            >
                {/* Close Button on Mobile Drawer */}
                {isMobileOpen && (
                    <button
                        onClick={onMobileClose}
                        className="absolute top-5 right-5 p-1.5 md:hidden text-[#0A2A1B]/60 hover:text-[#0A2A1B] hover:bg-[#0A2A1B]/5 rounded-xl cursor-pointer transition-colors"
                        aria-label="Close menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <div className="space-y-10">
                    {/* Header Brand */}
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'md:justify-center md:gap-0' : ''}`}>
                        <span className="text-2xl text-[#D97706] animate-pulse shrink-0">✿</span>
                        <span className={`font-serif text-lg font-extrabold tracking-tight text-[#0A2A1B] transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'opacity-100'}`}>
                            Jovy Floral
                        </span>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex flex-col gap-2.5 text-sm font-semibold text-[#0A2A1B]/70">
                        {navItems.map((item) => {
                            if (item.isAdminOnly && !isAdmin) return null;
                            const isActive = activeTab === item.id;
                            const hasBadge = item.badge !== undefined && item.badge > 0;

                            return (
                                <div key={item.id} className="relative group">
                                    <button
                                        onClick={() => {
                                            onTabChange(item.id);
                                            if (onMobileClose) onMobileClose();
                                        }}
                                        className={`w-full flex items-center rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] border-l-4 relative ${
                                            isActive
                                                ? 'bg-[#0A2A1B]/5 text-[#0A2A1B] font-semibold border-[#D97706] shadow-xs'
                                                : 'text-[#0A2A1B]/70 hover:bg-gray-50 hover:text-[#0A2A1B] border-transparent'
                                        } ${isCollapsed ? 'md:justify-center md:px-0 md:py-3.5 md:border-l-0' : 'px-4 py-3 gap-3.5'}`}
                                    >
                                        <div className="shrink-0 relative">
                                            {item.icon(isActive)}
                                            {/* Badge floating on icon when collapsed */}
                                            {isCollapsed && hasBadge && (
                                                <span className="absolute -top-2.5 -right-2.5 bg-[#D97706] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce md:flex hidden">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>

                                        <span className={`transition-all duration-300 truncate ${isCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'opacity-100'}`}>
                                            {item.label}
                                        </span>

                                        {/* Badge Inline when expanded */}
                                        {!isCollapsed && hasBadge && (
                                            <span className="ml-auto bg-[#D97706]/10 border border-[#D97706]/20 text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                                {item.badge}
                                            </span>
                                        )}
                                        {/* Mobile view badge (since mobile is never collapsed) */}
                                        <span className="md:hidden ml-auto bg-[#D97706]/10 border border-[#D97706]/20 text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                            {hasBadge ? item.badge : null}
                                        </span>
                                    </button>

                                    {/* Tooltip for collapsed view on desktop */}
                                    {isCollapsed && (
                                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-[#0A2A1B] text-white text-[11px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-md z-50 pointer-events-none md:block hidden">
                                            {item.label}
                                            {hasBadge && ` (${item.badge} pending)`}
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0A2A1B]" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Profile & Actions */}
                <div className="space-y-5 pt-6 border-t border-[#0A2A1B]/10">
                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 text-sm font-semibold text-[#0A2A1B]/70">
                        {/* Back to Store Button */}
                        <div className="relative group">
                            <button
                                onClick={onBackToStore}
                                className={`w-full flex items-center rounded-xl cursor-pointer hover:bg-gray-50 text-left transition-colors ${
                                    isCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'px-4 py-2.5 gap-3.5'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0A2A1B]/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                                </svg>
                                <span className={`transition-all duration-300 truncate ${isCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'opacity-100'}`}>
                                    Back to Store
                                </span>
                            </button>

                            {isCollapsed && (
                                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-[#0A2A1B] text-white text-[11px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-md z-50 pointer-events-none md:block hidden">
                                    Back to Store
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0A2A1B]" />
                                </div>
                            )}
                        </div>

                        {/* Logout Button */}
                        <div className="relative group">
                            <button
                                onClick={onLogout}
                                className={`w-full flex items-center rounded-xl cursor-pointer hover:bg-red-50 text-red-600 text-left transition-colors ${
                                    isCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'px-4 py-2.5 gap-3.5'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className={`transition-all duration-300 truncate ${isCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'opacity-100'}`}>
                                    Logout
                                </span>
                            </button>

                            {isCollapsed && (
                                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-red-800 text-white text-[11px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-md z-50 pointer-events-none md:block hidden">
                                    Logout
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-red-800" />
                                </div>
                            )}
                        </div>

                        {/* Collapse Sidebar Button (Desktop Only) */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="w-full md:flex hidden items-center rounded-xl cursor-pointer hover:bg-gray-50 text-[#0A2A1B]/55 hover:text-[#0A2A1B] transition-colors mt-2 border border-[#0A2A1B]/5 px-4 py-2.5 gap-3.5 md:justify-start"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 text-[#0A2A1B]/40 transition-transform duration-300 shrink-0 ${isCollapsed ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                            <span className={`transition-all duration-300 truncate text-xs ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'}`}>
                                Collapse Sidebar
                            </span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
