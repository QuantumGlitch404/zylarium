"use client"
import React, { useEffect, useRef } from "react"

export function LiquidEffectAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const appRef = useRef<any>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        // Load the script dynamically
        const script = document.createElement("script")
        script.type = "module"
        script.textContent = `
      import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';
      const canvas = document.getElementById('liquid-canvas');
      if (canvas) {
        const app = LiquidBackground(canvas);
        // Using a dark, subtle purple/black gradient - easier on eyes while matching theme
        app.loadImage('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');
        app.liquidPlane.material.metalness = 0.6;
        app.liquidPlane.material.roughness = 0.4;
        app.liquidPlane.uniforms.displacementScale.value = 3;
        app.setRain(false);
        window.__liquidApp = app;
      }
    `
        document.body.appendChild(script)

        return () => {
            if (window.__liquidApp && window.__liquidApp.dispose) {
                window.__liquidApp.dispose()
            }
            if (document.body.contains(script)) {
                document.body.removeChild(script)
            }
        }
    }, [])

    return (
        <div
            className="fixed inset-0 m-0 w-full h-full touch-none overflow-hidden -z-10"
            style={{ fontFamily: '"Montserrat", serif', zIndex: -1 }}
        >
            <canvas ref={canvasRef} id="liquid-canvas" className="fixed inset-0 w-full h-full" />
        </div>
    )
}

declare global {
    interface Window {
        __liquidApp?: any
    }
}
