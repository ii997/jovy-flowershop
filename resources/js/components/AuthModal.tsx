import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationTransition } from './animations';
import { toast } from './ui/Toast';
import { validateEmail, validateName, validatePassword, validatePasswordMatch, useDebounce } from '../lib/authValidation';
import { LegalModal } from './LegalModal';
import { X, Check } from 'reicon-react';

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

    // Debounced field values — validation only runs after the user pauses typing
    const debouncedEmail = useDebounce(email, 300);
    const debouncedName = useDebounce(name, 300);
    const debouncedPassword = useDebounce(password, 300);
    const debouncedConfirmPassword = useDebounce(confirmPassword, 300);

    // Touched tracking for realtime feedback
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    
    // Feedback states
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Agreement & legal modal states
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
        isOpen: false,
        type: 'terms',
    });

    // Validation evaluations (debounced — only recompute after the user pauses typing)
    const emailValidation = useMemo(() => validateEmail(debouncedEmail), [debouncedEmail]);
    const nameValidation = useMemo(() => validateName(debouncedName), [debouncedName]);
    const passwordValidation = useMemo(() => validatePassword(debouncedPassword), [debouncedPassword]);
    const confirmPasswordValidation = useMemo(() => validatePasswordMatch(debouncedPassword, debouncedConfirmPassword), [debouncedPassword, debouncedConfirmPassword]);

    const markTouched = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const clearState = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTouched({});
        setErrors({});
        setMessage('');
        setAgreedToTerms(false);
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

        const loginEmail = customCredentials ? customCredentials.email : email;
        const loginPassword = customCredentials ? customCredentials.password : password;

        if (!customCredentials) {
            setTouched({ email: true, password: true });
            // Validate raw field values synchronously (not debounced), so a fast
            // typist who clicks submit immediately gets the correct validation result.
            const emailResult = validateEmail(loginEmail);
            if (!emailResult.isValid) {
                setErrors({ email: [emailResult.message] });
                return false;
            }
            if (!loginPassword) {
                setErrors({ password: ['Password is required.'] });
                return false;
            }
        }

        setIsLoading(true);
        setErrors({});

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

        if (!customReg) {
            setTouched({ name: true, email: true, password: true, confirmPassword: true });

            // Validate raw field values synchronously (not debounced)
            const nameResult = validateName(name);
            if (!nameResult.isValid) {
                setErrors({ name: [nameResult.message] });
                return false;
            }
            const emailResult = validateEmail(email);
            if (!emailResult.isValid) {
                setErrors({ email: [emailResult.message] });
                return false;
            }
            if (!validatePassword(password).isValid) {
                setErrors({ password: ['Password must be at least 8 characters long.'] });
                return false;
            }
            const confirmResult = validatePasswordMatch(password, confirmPassword);
            if (!confirmResult.isValid) {
                setErrors({ password: [confirmResult.message] });
                return false;
            }
            if (!agreedToTerms) {
                setErrors({ terms: ['You must agree to the Terms and Privacy Policy to continue.'] });
                return false;
            }
        }

        setIsLoading(true);
        setErrors({});

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
        setTouched({ email: true });

        if (!emailValidation.isValid) {
            setErrors({ email: [emailValidation.message] });
            return;
        }

        setIsLoading(true);
        setErrors({});
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
                        <X className="h-6 w-6" strokeWidth={1.5} />
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
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-[#0A2A1B] block">Email Address</label>
                                {touched.email && emailValidation.isValid && (
                                    <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        Valid email
                                    </span>
                                )}
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    markTouched('email');
                                    if (errors.email) setErrors((prev) => ({ ...prev, email: [] }));
                                }}
                                onBlur={() => markTouched('email')}
                                className={`w-full px-4 py-2.5 bg-white border rounded-full text-sm focus:outline-none text-[#0A2A1B] transition-colors ${
                                    touched.email && !emailValidation.isValid
                                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                                        : touched.email && emailValidation.isValid
                                        ? 'border-emerald-500/50 focus:border-emerald-600'
                                        : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                }`}
                                required
                            />
                            {touched.email && !emailValidation.isValid && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <span>⚠</span> {emailValidation.message}
                                </p>
                            )}
                            {errors.email && errors.email.length > 0 && (
                                <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>
                            )}
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
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    markTouched('password');
                                    if (errors.password) setErrors((prev) => ({ ...prev, password: [] }));
                                }}
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
                        {/* Full Name */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-[#0A2A1B] block">Full Name</label>
                                {touched.name && nameValidation.isValid && (
                                    <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        Looks good
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    markTouched('name');
                                    if (errors.name) setErrors((prev) => ({ ...prev, name: [] }));
                                }}
                                onBlur={() => markTouched('name')}
                                placeholder="e.g. Maria Clara"
                                className={`w-full px-4 py-2.5 bg-white border rounded-full text-sm focus:outline-none text-[#0A2A1B] transition-colors ${
                                    touched.name && !nameValidation.isValid
                                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                                        : touched.name && nameValidation.isValid
                                        ? 'border-emerald-500/50 focus:border-emerald-600'
                                        : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                }`}
                                required
                            />
                            {touched.name && !nameValidation.isValid && (
                                <p className="text-red-500 text-xs mt-1">{nameValidation.message}</p>
                            )}
                            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name[0]}</p>}
                        </div>

                        {/* Email Address */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-[#0A2A1B] block">Email Address</label>
                                {touched.email && emailValidation.isValid && (
                                    <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        Valid email
                                    </span>
                                )}
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    markTouched('email');
                                    if (errors.email) setErrors((prev) => ({ ...prev, email: [] }));
                                }}
                                onBlur={() => markTouched('email')}
                                placeholder="your@email.com"
                                className={`w-full px-4 py-2.5 bg-white border rounded-full text-sm focus:outline-none text-[#0A2A1B] transition-colors ${
                                    touched.email && !emailValidation.isValid
                                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                                        : touched.email && emailValidation.isValid
                                        ? 'border-emerald-500/50 focus:border-emerald-600'
                                        : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                }`}
                                required
                            />
                            {touched.email && !emailValidation.isValid && (
                                <p className="text-red-500 text-xs mt-1">{emailValidation.message}</p>
                            )}
                            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#0A2A1B] block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    markTouched('password');
                                    if (errors.password) setErrors((prev) => ({ ...prev, password: [] }));
                                }}
                                className={`w-full px-4 py-2.5 bg-white border rounded-full text-sm focus:outline-none text-[#0A2A1B] transition-colors ${
                                    touched.password && !passwordValidation.isValid
                                        ? 'border-amber-400 focus:border-amber-500'
                                        : touched.password && passwordValidation.isValid
                                        ? 'border-emerald-500/50 focus:border-emerald-600'
                                        : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                }`}
                                required
                            />
                            
                            {/* Realtime Password Strength Meter */}
                            {password.length > 0 && (
                                <div className="mt-2 space-y-1.5 p-2.5 bg-[#F7F4EB] rounded-xl border border-[#0A2A1B]/5">
                                    <div className="flex justify-between items-center text-[11px] font-semibold text-[#0A2A1B]/80">
                                        <span>Password Strength</span>
                                        <span style={{ color: passwordValidation.color }}>{passwordValidation.label}</span>
                                    </div>
                                    <div className="flex gap-1 h-1.5 w-full">
                                        {[1, 2, 3, 4].map((step) => (
                                            <div
                                                key={step}
                                                className="flex-1 h-full rounded-full transition-all duration-300"
                                                style={{
                                                    backgroundColor: step <= passwordValidation.score ? passwordValidation.color : '#E5E7EB',
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {/* Criteria Checklist */}
                                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                                        <div className={`flex items-center gap-1 ${passwordValidation.criteria.minLength ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                                            <span>{passwordValidation.criteria.minLength ? '✓' : '•'}</span> At least 8 chars
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordValidation.criteria.hasUppercase ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                                            <span>{passwordValidation.criteria.hasUppercase ? '✓' : '•'}</span> Uppercase letter
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordValidation.criteria.hasLowercase ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                                            <span>{passwordValidation.criteria.hasLowercase ? '✓' : '•'}</span> Lowercase letter
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordValidation.criteria.hasNumberOrSpecial ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                                            <span>{passwordValidation.criteria.hasNumberOrSpecial ? '✓' : '•'}</span> Number / Special
                                        </div>
                                    </div>
                                </div>
                            )}

                            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password[0]}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-[#0A2A1B] block">Confirm Password</label>
                                {touched.confirmPassword && confirmPassword.length > 0 && (
                                    <span className={`text-[11px] font-semibold ${confirmPasswordValidation.isValid ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {confirmPasswordValidation.isValid ? '✓ Passwords match' : '✗ Passwords match'}
                                    </span>
                                )}
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                placeholder="Re-enter your password"
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    markTouched('confirmPassword');
                                    if (errors.password) setErrors((prev) => ({ ...prev, password: [] }));
                                }}
                                className={`w-full px-4 py-2.5 bg-white border rounded-full text-sm focus:outline-none text-[#0A2A1B] transition-colors ${
                                    touched.confirmPassword && !confirmPasswordValidation.isValid
                                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                                        : touched.confirmPassword && confirmPasswordValidation.isValid
                                        ? 'border-emerald-500/50 focus:border-emerald-600'
                                        : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                }`}
                                required
                            />
                            {touched.confirmPassword && !confirmPasswordValidation.isValid && (
                                <p className="text-red-500 text-xs mt-1">{confirmPasswordValidation.message}</p>
                            )}
                        </div>

                        {/* Agreement & Terms Checkbox */}
                        <div className="space-y-1">
                            <label className="flex items-start gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => {
                                        setAgreedToTerms(e.target.checked);
                                        if (errors.terms) setErrors((prev) => ({ ...prev, terms: [] }));
                                    }}
                                    className="mt-0.5 shrink-0 accent-[#0A2A1B]"
                                />
                                <span className="text-xs text-[#0A2A1B]/70 leading-relaxed">
                                    I agree to the{' '}
                                    <button
                                        type="button"
                                        onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                                        className="text-[#D97706] hover:underline font-semibold cursor-pointer"
                                    >
                                        Terms and Conditions
                                    </button>
                                    {' '}and{' '}
                                    <button
                                        type="button"
                                        onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                                        className="text-[#D97706] hover:underline font-semibold cursor-pointer"
                                    >
                                        Privacy Policy
                                    </button>
                                    .
                                </span>
                            </label>
                            {errors.terms && (
                                <p className="text-red-600 text-xs mt-1 ml-5">{errors.terms[0]}</p>
                            )}
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
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-[#0A2A1B] block">Email Address</label>
                                    {touched.email && emailValidation.isValid && (
                                        <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            Valid email
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        markTouched('email');
                                    }}
                                    onBlur={() => markTouched('email')}
                                    className={`w-full px-4 py-2.5 bg-white border rounded-full text-sm focus:outline-none text-[#0A2A1B] transition-colors ${
                                        touched.email && !emailValidation.isValid
                                            ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                                            : touched.email && emailValidation.isValid
                                            ? 'border-emerald-500/50 focus:border-emerald-600'
                                            : 'border-[#0A2A1B]/15 focus:border-[#D97706]'
                                    }`}
                                    required
                                />
                                {touched.email && !emailValidation.isValid && (
                                    <p className="text-red-500 text-xs mt-1">{emailValidation.message}</p>
                                )}
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

                    {/* Embedded Legal Policy Modal */}
                    <LegalModal
                        isOpen={legalModal.isOpen}
                        type={legalModal.type}
                        onClose={() => setLegalModal({ isOpen: false, type: 'terms' })}
                    />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

