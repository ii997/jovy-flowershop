import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Inbox, X } from 'reicon-react';

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
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
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

    const handleMarkAsRead = async (ids: number[]) => {
        if (ids.length === 0) return;

        try {
            const res = await fetch('/api/notifications/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ ids }),
            });
            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => (ids.includes(n.id) ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
                );
            }
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    const handleMarkAllRead = () => {
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        handleMarkAsRead(unreadIds);
    };

    const handleNotificationClick = (notif: NotificationItem) => {
        setSelectedNotification(notif);
        setIsOpen(false);
        if (!notif.read_at) {
            handleMarkAsRead([notif.id]);
        }
    };

    const formatType = (typeStr?: string) => {
        if (!typeStr) return 'Notification';
        return typeStr
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
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

    const formatFullDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <>
            <div className="relative z-40" ref={dropdownRef}>
                {/* Bell trigger button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B] transition-colors focus:outline-none cursor-pointer"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
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
                                        <Inbox className="h-8 w-8 mx-auto text-[#0A2A1B]/20" strokeWidth={1.5} />
                                        <p className="text-xs text-[#0A2A1B]/50 font-medium">All caught up! No notifications.</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <button
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`w-full px-4 py-3 text-left transition-colors relative flex items-start gap-2.5 cursor-pointer ${
                                                !notif.read_at
                                                    ? 'bg-[#F7F4EB]/50 hover:bg-[#F7F4EB]/80'
                                                    : 'hover:bg-gray-50/80 bg-white'
                                            }`}
                                        >
                                            {!notif.read_at && (
                                                <span className="absolute left-2 top-4 h-2 w-2 rounded-full bg-[#D97706]" />
                                            )}
                                            <div className="flex-1 space-y-1 pl-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-xs ${!notif.read_at ? 'font-bold text-[#0A2A1B]' : 'font-medium text-[#0A2A1B]/80'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-[9px] text-[#0A2A1B]/40 shrink-0 font-medium">
                                                        {formatTime(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#0A2A1B]/70 line-clamp-2 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Full Notification Detail Modal (portaled to document.body to escape sticky/backdrop-filter header containers) */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedNotification && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedNotification(null)}
                                className="fixed inset-0 bg-[#0A2A1B]/40 backdrop-blur-xs transition-opacity"
                            />

                            {/* Modal Box */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#0A2A1B]/10 overflow-hidden z-10"
                            >
                                {/* Modal Header */}
                                <div className="flex items-start justify-between p-5 border-b border-[#0A2A1B]/5 bg-[#FAF9F6]">
                                    <div className="space-y-1.5 pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#D97706]/10 text-[#D97706] tracking-wide">
                                                {formatType(selectedNotification.type)}
                                            </span>
                                            <span className="text-[10px] text-[#0A2A1B]/50 font-medium">
                                                {formatFullDate(selectedNotification.created_at)}
                                            </span>
                                        </div>
                                        <h3 className="font-serif text-base font-bold text-[#0A2A1B] leading-snug">
                                            {selectedNotification.title}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedNotification(null)}
                                        className="p-1.5 rounded-full text-[#0A2A1B]/40 hover:text-[#0A2A1B] hover:bg-[#0A2A1B]/5 transition-colors cursor-pointer"
                                        aria-label="Close"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-5 max-h-[60vh] overflow-y-auto">
                                    <div className="p-4 rounded-xl bg-[#F7F4EB]/30 border border-[#0A2A1B]/5">
                                        <p className="text-xs sm:text-sm text-[#0A2A1B]/90 leading-relaxed whitespace-pre-wrap">
                                            {selectedNotification.message}
                                        </p>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end px-5 py-3.5 border-t border-[#0A2A1B]/5 bg-[#FAF9F6]">
                                    <button
                                        onClick={() => setSelectedNotification(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0A2A1B] text-white hover:bg-[#0A2A1B]/90 transition-all cursor-pointer shadow-sm"
                                    >
                                        Done
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
