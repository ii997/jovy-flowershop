import { useReducedMotion } from 'motion/react';

// Custom premium organic spring physics presets
export const SPRING_PRESETS = {
    elegant: { type: 'spring' as const, stiffness: 120, damping: 20 },
    snappy: { type: 'spring' as const, stiffness: 200, damping: 15 },
    gentle: { type: 'spring' as const, stiffness: 80, damping: 18 },
};

export function useAnimationTransition(preset: keyof typeof SPRING_PRESETS = 'elegant') {
    const shouldReduceMotion = useReducedMotion();
    
    if (shouldReduceMotion) {
        return { type: 'tween' as const, duration: 0.1 };
    }
    
    return SPRING_PRESETS[preset];
}
