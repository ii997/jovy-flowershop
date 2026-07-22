import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: string;
    read_at: string | null;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        if (unreadIds.length === 0) return;

        try {
            const res = await fetch('/api/notifications/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ ids: unreadIds }),
            });
            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => (unreadIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n))
                );
            }
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="relative z-40" ref={dropdownRef}>
            {/* Bell trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B] transition-colors focus:outline-none cursor-pointer"
                aria-label="Notifications"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D97706] text-[8px] font-bold text-white ring-2 ring-white"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl bg-white border border-[#0A2A1B]/5 shadow-xl shadow-[#0A2A1B]/10 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[#0A2A1B]/5 px-4 py-3 bg-[#FAF9F6]">
                            <span className="font-serif text-sm font-bold text-[#0A2A1B]">Notifications</span>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] font-bold text-[#D97706] hover:text-[#0A2A1B] transition-colors cursor-pointer"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-[#0A2A1B]/5">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center space-y-2">
                                    <svg
                                        className="h-8 w-8 mx-auto text-[#0A2A1B]/20"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                    <p className="text-xs text-[#0A2A1B]/50 font-medium">All caught up! No notifications.</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-3 text-left transition-colors relative flex items-start gap-2.5 ${
                                            !notif.read_at ? 'bg-[#F7F4EB]/40 hover:bg-[#F7F4EB]/70' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        {!notif.read_at && (
                                            <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                                        )}
                                        <div className="flex-1 space-y-0.5">
                                            <p className="text-xs font-bold text-[#0A2A1B]">{notif.title}</p>
                                            <p className="text-[11px] text-[#0A2A1B]/75 leading-relaxed">{notif.message}</p>
                                            <span className="text-[9px] text-[#0A2A1B]/40 block font-medium">
                                                {formatTime(notif.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
