"use client";
import React, { useEffect, useState } from "react";

interface CustomCursorProps {
    size?: number;
    color?: string;
    borderWidth?: number;
}

export function CustomCursor({
    size = 24,
    color = "rgba(147, 51, 234, 0.8)", // Purple-600 with transparency
    borderWidth = 2,
}: CustomCursorProps) {
    const [position, setPosition] = useState({ x: -100, y: -100 });
    const [isVisible, setIsVisible] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const handleMouseEnter = () => {
            setIsVisible(true);
        };

        const handleMouseDown = () => {
            setIsClicking(true);
        };

        const handleMouseUp = () => {
            setIsClicking(false);
        };

        // Check for hoverable elements
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('a') ||
                target.closest('button') ||
                target.getAttribute('role') === 'button' ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isClickable);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mouseover", handleMouseOver);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mouseenter", handleMouseEnter);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mouseover", handleMouseOver);
        };
    }, []);

    const currentSize = isClicking ? size * 0.8 : isHovering ? size * 1.5 : size;

    return (
        <div
            className="fixed pointer-events-none z-[9999] transition-all duration-150 ease-out"
            style={{
                left: position.x,
                top: position.y,
                width: currentSize,
                height: currentSize,
                transform: "translate(-50%, -50%)",
                opacity: isVisible ? 1 : 0,
            }}
        >
            {/* Outer ring */}
            <div
                className="absolute inset-0 rounded-full transition-all duration-150"
                style={{
                    border: `${borderWidth}px solid ${color}`,
                    boxShadow: isHovering
                        ? `0 0 20px ${color}, 0 0 40px rgba(6, 182, 212, 0.4)`
                        : `0 0 10px ${color}`,
                }}
            />

            {/* Center dot */}
            <div
                className="absolute rounded-full transition-all duration-150"
                style={{
                    width: 4,
                    height: 4,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: isHovering ? "#22d3ee" : color,
                    boxShadow: `0 0 6px ${isHovering ? "#22d3ee" : color}`,
                }}
            />
        </div>
    );
}
