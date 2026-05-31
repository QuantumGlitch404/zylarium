import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string; // Additional classes for the wrapper
    animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale';
    staggerIndex?: number;
    threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
    children,
    className = '',
    animation = 'fade-up',
    staggerIndex = 0,
    threshold = 0.1
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            { threshold, rootMargin: '0px 0px -50px 0px' }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    // Map animation types to CSS classes defined in index.css
    const getAnimationClass = () => {
        switch (animation) {
            case 'fade-up': return 'scroll-animate';
            case 'fade-down': return 'scroll-animate-down'; // Need to ensure this exists or use generic
            case 'fade-left': return 'scroll-animate-left';
            case 'fade-right': return 'scroll-animate-right';
            case 'scale': return 'scroll-animate-scale';
            default: return 'scroll-animate';
        }
    };

    const staggerDelay = staggerIndex > 0 ? `stagger-${Math.min(staggerIndex, 10)}` : '';

    return (
        <div
            ref={ref}
            className={`${getAnimationClass()} ${staggerDelay} ${isVisible ? 'visible' : ''} ${className}`}
        >
            {children}
        </div>
    );
};
