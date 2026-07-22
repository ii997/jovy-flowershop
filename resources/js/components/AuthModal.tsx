import React, { useState } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';
import { toast } from './ui/Toast';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
    
    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Feedback states
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const clearState = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        setMessage('');
    };

    const handleTabChange = (tab: 'login' | 'register' | 'forgot') => {
        setActiveTab(tab);
        clearState();
    };

    const csrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const handleLogin = async (e?: React.FormEvent, customCredentials?: { email: string; password: string }) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setErrors({});

        const loginEmail = customCredentials ? customCredentials.email : email;
        const loginPassword = customCredentials ? customCredentials.password : password;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });

            if (response.status === 429) {
                setErrors({ email: ['Too many login attempts. Please wait a minute and try again.'] });
                setIsLoading(false);
                return false;
            }

            const data = await response.json();

            if (response.ok) {
                toast.success('Logged in successfully!');
                onLoginSuccess(data);
                onClose();
                clearState();
                setIsLoading(false);
                return true;
            } else {
                setErrors(data.errors || { email: [data.message || 'Invalid credentials.'] });
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            setErrors({ email: ['Connection error. Please try again.'] });
            setIsLoading(false);
            return false;
        }
    };

    const handleRegister = async (e?: React.FormEvent, customReg?: any) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Confirm password validation
        if (!customReg && password !== confirmPassword) {
            setErrors({ password: ['Passwords do not match.'] });
            setIsLoading(false);
            return false;
        }

        const regData = customReg || { name, email, password };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken() || '',
                },
                body: JSON.stringify(regData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Account registered successfully!');
                onLoginSuccess(data);
                onClose();
                clearState();
                setIsLoading(false);
                return true;
            } else {
                setErrors(data.errors || { email: [data.message || 'Registration failed.'] });
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            setErrors({ email: ['Connection error. Please try again.'] });
            setIsLoading(false);
            return false;
        }
    };

const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate password recovery email link
        setTimeout(() => {
            setMessage('A password reset link has been simulated and sent to your email.');
            setIsLoading(false);
        }, 1000);
    };

    const transition = useAnimationTransition('elegant');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-[#0A2A1B]/40 backdrop-blur-sm"
                    />

                    {/* Modal Body */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={transition}
                        className="relative bg-white max-w-md w-full mx-4 rounded-3xl shadow-2xl p-8 border border-[#0A2A1B]/10 z-10 flex flex-col space-y-6 origin-center"
                    >
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[#0A2A1B] font-serif">
                        {activeTab === 'login' && 'Welcome Back'}
                        {activeTab === 'register' && 'Create Account'}
                        {activeTab === 'forgot' && 'Reset Password'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-[#0A2A1B]/5 text-[#0A2A1B]/60 hover:text-[#0A2A1B] cursor-pointer transition-all active:scale-90"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                {activeTab !== 'forgot' && (
                    <div className="flex bg-[#F7F4EB] p-1 rounded-full border border-[#0A2A1B]/5 select-none text-xs font-semibold">
                        <button
                            onClick={() => handleTabChange('login')}
                            className={`flex-1 py-2 rounded-full cursor-pointer transition-all text-center ${
                                activeTab === 'login' ? 'bg-[#0A2A1B] text-white' : 'text-[#0A2A1B]/60'
                            }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => handleTabChange('register')}
                            className={`flex-1 py-2 rounded-full cursor-pointer transition-all text-center ${
                                activeTab === 'register' ? 'bg-[#0A2A1B] text-white' : 'text-[#0A2A1B]/60'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

{/* Tab Forms */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                required
                            />
                            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-[#0A2A1B] block">Password</label>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('forgot')}
                                    className="text-[11px] font-semibold text-[#D97706] hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                required
                            />
                            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password[0]}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 mt-2 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {activeTab === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                required
                            />
                            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name[0]}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                required
                            />
                            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                required
                            />
                            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password[0]}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                placeholder="Re-enter your password"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                required
                            />
                            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password[0]}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 mt-2 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                )}

                {activeTab === 'forgot' && (
                    <div className="space-y-4">
                        <p className="text-xs text-[#0A2A1B]/75 leading-relaxed">
                            Enter the email address associated with your account, and we will send you a simulated link to reset your password.
                        </p>

                        {message && (
                            <div className="p-3.5 bg-green-50 text-green-700 text-xs rounded-2xl border border-green-200">
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[#0A2A1B] block">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-[#0A2A1B]/15 rounded-full text-sm focus:outline-none focus:border-[#D97706] text-[#0A2A1B] transition-colors"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-[#0A2A1B] hover:bg-[#D97706] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] active:translate-y-0.5 cursor-pointer text-center"
                            >
                                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <button
                            type="button"
                            onClick={() => handleTabChange('login')}
                            className="w-full text-xs font-semibold text-[#0A2A1B]/60 hover:text-[#0A2A1B]"
                        >
                            Back to Sign In
                        </button>
                    </div>
                )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

