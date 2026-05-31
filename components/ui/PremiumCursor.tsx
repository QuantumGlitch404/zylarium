import React, { useEffect, useState, useCallback } from 'react';

// Premium Custom Cursor - World's Best
// Features: Smooth trailing, gradient glow, hover effects, pulse animations
export function PremiumCursor() {
    const [position, setPosition] = useState({ x: -100, y: -100 });
    const [trailPosition, setTrailPosition] = useState({ x: -100, y: -100 });
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    // Smooth lerp function for trailing effect
    const lerp = (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
    };

    // Update main cursor position immediately
    const handleMouseMove = useCallback((e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
        setIsVisible(true);
    }, []);

    // Smooth trailing animation
    useEffect(() => {
        let animationFrame: number;

        const animate = () => {
            setTrailPosition(prev => ({
                x: lerp(prev.x, position.x, 0.15),
                y: lerp(prev.y, position.y, 0.15)
            }));
            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [position]);

    useEffect(() => {
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        // Check for hoverable elements
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.closest('a') ||
                target.closest('button') ||
                target.getAttribute('role') === 'button' ||
                target.onclick !== null ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isClickable);
        };

        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mouseenter", handleMouseEnter);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mouseover", handleMouseOver);
        };
    }, [handleMouseMove]);

    const dotSize = isClicking ? 6 : isHovering ? 10 : 8;
    const ringSize = isClicking ? 32 : isHovering ? 48 : 40;

    return (
        <>
            {/* Main cursor dot - follows cursor exactly */}
            <div
                className="fixed pointer-events-none z-[99999] transition-all duration-75"
                style={{
                    left: position.x,
                    top: position.y,
                    width: dotSize,
                    height: dotSize,
                    transform: 'translate(-50%, -50%)',
                    opacity: isVisible ? 1 : 0,
                    background: isHovering
                        ? 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)'
                        : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    borderRadius: '50%',
                    boxShadow: isHovering
                        ? '0 0 20px #22d3ee, 0 0 40px rgba(6, 182, 212, 0.5)'
                        : '0 0 15px #a855f7, 0 0 30px rgba(147, 51, 234, 0.4)',
                }}
            />

            {/* Trailing ring - smoothly follows with delay */}
            <div
                className="fixed pointer-events-none z-[99998]"
                style={{
                    left: trailPosition.x,
                    top: trailPosition.y,
                    width: ringSize,
                    height: ringSize,
                    transform: 'translate(-50%, -50%)',
                    opacity: isVisible ? 1 : 0,
                    border: isHovering ? '2px solid #22d3ee' : '2px solid rgba(147, 51, 234, 0.6)',
                    borderRadius: '50%',
                    background: isHovering
                        ? 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
                    boxShadow: isHovering
                        ? '0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.1)'
                        : '0 0 25px rgba(147, 51, 234, 0.2), inset 0 0 15px rgba(147, 51, 234, 0.05)',
                    transition: 'width 0.3s ease, height 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
                }}
            />

            {/* Outer glow ring - most delayed for depth effect */}
            <div
                className="fixed pointer-events-none z-[99997]"
                style={{
                    left: trailPosition.x,
                    top: trailPosition.y,
                    width: ringSize * 1.5,
                    height: ringSize * 1.5,
                    transform: 'translate(-50%, -50%)',
                    opacity: isVisible ? (isHovering ? 0.6 : 0.3) : 0,
                    border: '1px solid rgba(147, 51, 234, 0.2)',
                    borderRadius: '50%',
                    transition: 'width 0.4s ease, height 0.4s ease, opacity 0.3s ease',
                }}
            />
        </>
    );
}

export default PremiumCursor;
