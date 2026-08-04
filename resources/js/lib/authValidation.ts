/**
 * Realtime Authentication Validation Utilities & RegEx Patterns
 */
import { useState, useEffect } from 'react';

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;

export interface PasswordCriteria {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumberOrSpecial: boolean;
}

export interface PasswordValidationResult {
    score: number; // 0 to 4
    label: 'Weak' | 'Fair' | 'Good' | 'Strong';
    color: string;
    criteria: PasswordCriteria;
    isValid: boolean;
}

/**
 * Validate email format with RegEx
 */
export function validateEmail(email: string): { isValid: boolean; message: string } {
    if (!email) {
        return { isValid: false, message: 'Email address is required.' };
    }
    if (!EMAIL_REGEX.test(email.trim())) {
        return { isValid: false, message: 'Please enter a valid email address (e.g. name@domain.com).' };
    }
    return { isValid: true, message: '' };
}

/**
 * Validate full name with RegEx
 */
export function validateName(name: string): { isValid: boolean; message: string } {
    if (!name.trim()) {
        return { isValid: false, message: 'Full name is required.' };
    }
    if (name.trim().length < 2) {
        return { isValid: false, message: 'Name must be at least 2 characters long.' };
    }
    if (!NAME_REGEX.test(name.trim())) {
        return { isValid: false, message: 'Name should contain only letters, spaces, hyphens, and apostrophes.' };
    }
    return { isValid: true, message: '' };
}

/**
 * Evaluate password strength and regex criteria
 */
export function validatePassword(password: string): PasswordValidationResult {
    const criteria: PasswordCriteria = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    let score = 0;
    if (criteria.minLength) score += 1;
    if (criteria.hasUppercase) score += 1;
    if (criteria.hasLowercase) score += 1;
    if (criteria.hasNumberOrSpecial) score += 1;

    let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
    let color = '#EF4444'; // Red

    if (score === 2) {
        label = 'Fair';
        color = '#F59E0B'; // Amber
    } else if (score === 3) {
        label = 'Good';
        color = '#3B82F6'; // Blue
    } else if (score === 4) {
        label = 'Strong';
        color = '#10B981'; // Emerald
    }

    const isValid = criteria.minLength; // Minimum length requirement

    return {
        score,
        label,
        color,
        criteria,
        isValid,
    };
}

/**
 * React hook: debounce a value by `delay` ms
 * The returned value only updates after the source value has stopped changing for `delay` ms.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

/**
 * Validate password match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): { isValid: boolean; message: string } {
    if (!confirmPassword) {
        return { isValid: false, message: 'Please confirm your password.' };
    }
    if (password !== confirmPassword) {
        return { isValid: false, message: 'Passwords do not match.' };
    }
    return { isValid: true, message: '' };
}
