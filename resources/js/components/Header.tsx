import { useState } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';
import { NotificationBell } from './NotificationBell';
import { ArrowRight, User as UserIcon, ChevronDown } from 'reicon-react';

interface HeaderProps {
    user: User | null;
    onAuthClick: () => void;
    onDashboardClick: () => void;
    onLogout: () => void;
    onProfileClick: () => void;
}

export function Header({
    user,
    onAuthClick,
    onDashboardClick,
    onLogout,
    onProfileClick,
}: HeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const transition = useAnimationTransition('snappy');

    return (
        <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#0A2A1B]/10 px-6 py-4 select-none">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 group cursor-pointer select-none" aria-label="Jovy's Flowershop home">
                    <svg className="h-6 w-6 text-[#D97706] transition-transform duration-500 group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M12 4C12 4 8 7 8 10C8 12.5 10 14 12 14C14 14 16 12.5 16 10C16 7 12 4 12 4Z" />
                        <path d="M12 14C12 14 9 16 9 18.5C9 20.5 10.5 22 12 22C13.5 22 15 20.5 15 18.5C15 16 12 14 12 14Z" />
                        <path d="M10 8H14" /><path d="M12 6V10" />
                    </svg>
                    <span className="font-serif text-xl font-bold tracking-wide uppercase text-[#0A2A1B]">Jovy's Flowershop</span>
                </div>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wider uppercase text-[#0A2A1B]/70">
                    <a href="/" className="hover:text-[#0A2A1B] transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-[#0A2A1B] hover:after:w-full after:transition-all">Home</a>
                    <a href="/#shop" className="hover:text-[#0A2A1B] transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-[#0A2A1B] hover:after:w-full after:transition-all">Collections</a>
                    <a href="/#why-us" className="hover:text-[#0A2A1B] transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-[#0A2A1B] hover:after:w-full after:transition-all">About</a>
                    <a href="/#footer" className="hover:text-[#0A2A1B] transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-[#0A2A1B] hover:after:w-full after:transition-all">Contact</a>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* User Auth Info */}
                    {user && (user.role === 'admin' || user.role === 'staff') && (
                        <button
                            onClick={onDashboardClick}
                            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#D97706]/10 hover:bg-[#D97706]/20 border border-[#D97706]/20 rounded-full text-[10px] sm:text-xs font-bold text-[#D97706] transition-all cursor-pointer active:scale-95 select-none"
                        >
                            <span>Dashboard</span>
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    )}

                    {user && <NotificationBell />}

                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-1.5 px-4 py-2 hover:bg-[#0A2A1B]/5 rounded-full text-xs font-semibold text-[#0A2A1B] transition-all cursor-pointer border border-[#0A2A1B]/10"
                            >
                                <UserIcon className="h-4 w-4" />
                                <span>{user.name.split(' ')[0]}</span>
                                <ChevronDown className="h-3 w-3 text-[#0A2A1B]/40" />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={transition}
                                        className="absolute right-0 mt-2.5 w-44 bg-white border border-[#0A2A1B]/15 rounded-2xl shadow-xl py-2 z-50 origin-top-right"
                                    >
                                        {/* Role Label */}
                                        <div className="px-4 py-1.5 border-b border-[#0A2A1B]/5 mb-1.5">
                                            <span className="text-[9px] uppercase font-bold tracking-wider text-[#0A2A1B]/40 block">Account Role</span>
                                            <span className="text-xs font-semibold text-[#D97706]">{user.role}</span>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onProfileClick();
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-[#0A2A1B]/5 text-xs font-medium text-[#0A2A1B] cursor-pointer"
                                        >
                                            My Profile &amp; Orders
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onLogout();
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-xs font-medium text-red-600 cursor-pointer"
                                        >
                                            Log Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <button
                            onClick={onAuthClick}
                            className="px-5 py-2 bg-[#0A2A1B] hover:bg-[#D97706] text-white text-xs font-semibold rounded-full transition-all cursor-pointer active:scale-95 active:translate-y-0.5 select-none"
                        >
                            Log In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
