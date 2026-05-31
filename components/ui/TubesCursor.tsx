import React, { useEffect, useRef } from 'react';

// TubesCursor - Premium 3D flowing tubes that follow the cursor
// Customized with purple/cyan colors to match the website theme
export default function TubesCursor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<any>(null);

    // Generate random colors in the purple/cyan spectrum for variety
    const generateThemedColors = (count: number, type: 'tubes' | 'lights') => {
        if (type === 'tubes') {
            // Purple tube colors
            const purpleShades = [
                '#9333ea', '#7c3aed', '#a855f7', '#8b5cf6',
                '#6d28d9', '#581c87', '#c084fc', '#a78bfa'
            ];
            return new Array(count).fill(0).map(() =>
                purpleShades[Math.floor(Math.random() * purpleShades.length)]
            );
        } else {
            // Cyan/purple light colors for glow
            const lightShades = [
                '#06b6d4', '#22d3ee', '#67e8f9', '#0891b2',
                '#9333ea', '#a855f7', '#c084fc', '#7c3aed'
            ];
            return new Array(count).fill(0).map(() =>
                lightShades[Math.floor(Math.random() * lightShades.length)]
            );
        }
    };

    useEffect(() => {
        // Delay initialization to ensure DOM is ready
        const initTimer = setTimeout(() => {
            import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
                .then((module: any) => {
                    const TubesCursorLib = module.default;

                    if (canvasRef.current) {
                        // Initialize with premium purple/cyan theme colors
                        const app = TubesCursorLib(canvasRef.current, {
                            tubes: {
                                // Deep purple tube colors matching the theme
                                colors: ['#9333ea', '#7c3aed', '#a855f7'],
                                lights: {
                                    intensity: 180,
                                    // Cyan and purple lights for premium glow effect
                                    colors: ['#06b6d4', '#22d3ee', '#9333ea', '#c084fc']
                                }
                            }
                        });

                        appRef.current = app;
                    }
                })
                .catch((err: any) => console.error("Failed to load TubesCursor:", err));
        }, 100);

        return () => {
            clearTimeout(initTimer);
            if (appRef.current && typeof appRef.current.dispose === 'function') {
                appRef.current.dispose();
            }
        };
    }, []);

    // Optional: Change colors on click for interactive effect
    const handleClick = () => {
        if (appRef.current) {
            const newTubeColors = generateThemedColors(3, 'tubes');
            const newLightColors = generateThemedColors(4, 'lights');

            appRef.current.tubes.setColors(newTubeColors);
            appRef.current.tubes.setLightsColors(newLightColors);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 9999 }}
        />
    );
}

export { TubesCursor };
