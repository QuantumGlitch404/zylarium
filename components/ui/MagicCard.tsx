import React, { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

interface MagicCardProps {
    children: React.ReactNode;
    className?: string;
    gradientColor?: string;
    onClick?: () => void;
}

export const MagicCard: React.FC<MagicCardProps> = ({ children, className = '', gradientColor = '#8b5cf6', onClick }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const background = useMotionTemplate`radial-gradient(
    650px circle at ${mouseX}px ${mouseY}px,
    ${gradientColor}20,
    transparent 80%
  )`;

    return (
        <motion.div
            className={`relative group rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
            onClick={onClick}
            whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`radial-gradient(
            650px circle at ${mouseX}px ${mouseY}px,
            ${gradientColor}40,
            transparent 80%
          )`,
                }}
            />
            <div className="relative h-full">{children}</div>
        </motion.div>
    );
};
