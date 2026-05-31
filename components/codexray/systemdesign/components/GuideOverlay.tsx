
import React from 'react';
import { X, MousePointer2 } from 'lucide-react';

interface GuideOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GuideOverlay: React.FC<GuideOverlayProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={onClose}>
            <div className="relative w-full h-full pointer-events-none">

                {/* Palette Guide */}
                <div className="absolute top-20 left-64 animate-bounce">
                    <div className="bg-indigo-600 text-white p-3 rounded-lg shadow-xl max-w-xs relative ml-4">
                        <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-indigo-600 border-b-[8px] border-b-transparent"></div>
                        <h4 className="font-bold mb-1">Component Palette</h4>
                        <p className="text-xs">
                            Drag & drop items onto the canvas, or <b>click</b> an item to quickly add it to the center.
                        </p>
                    </div>
                </div>

                {/* Canvas Guide */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-pulse">
                    <MousePointer2 className="w-12 h-12 text-white mx-auto mb-2 opacity-80" />
                    <div className="bg-gray-800/90 text-white p-4 rounded-xl shadow-2xl backdrop-blur border border-white/10 max-w-sm mx-auto">
                        <h4 className="font-bold text-lg mb-2">Interactive Canvas</h4>
                        <ul className="text-sm text-left list-disc list-inside space-y-1 text-gray-300">
                            <li><b>Drag</b> to move components / Pan view</li>
                            <li><b>Scroll</b> to Zoom In/Out</li>
                            <li><b>Right Click</b> for context menu (if available)</li>
                            <li><b>Shift + Drag</b> between nodes to Connect</li>
                        </ul>
                    </div>
                </div>

                {/* Toolbar Guide */}
                <div className="absolute top-16 right-40">
                    <div className="bg-indigo-600 text-white p-3 rounded-lg shadow-xl max-w-xs relative mb-4">
                        <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-indigo-600 border-r-[8px] border-r-transparent"></div>
                        <h4 className="font-bold mb-1">Tools & Templates</h4>
                        <p className="text-xs">
                            Use "Templates" to load pre-built systems like Uber or Twitter. Use "Layout" to auto-arrange messy diagrams.
                        </p>
                    </div>
                </div>

                {/* Controls Guide */}
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
                    <div className="bg-indigo-600 text-white p-3 rounded-lg shadow-xl max-w-md relative mt-4">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-indigo-600 border-r-[8px] border-r-transparent"></div>
                        <h4 className="font-bold mb-1">Simulation Engine</h4>
                        <p className="text-xs">
                            Define workloads in the right panel, then click <b>Run</b>. Watch nodes change color based on load (Green → Yellow → Red). Use "Stress" multiplier to find breaking points.
                        </p>
                    </div>
                </div>

                <div className="absolute top-4 right-4 pointer-events-auto">
                    <button
                        onClick={onClose}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute bottom-8 w-full text-center">
                    <p className="text-gray-400 text-sm">Click anywhere to close guide</p>
                </div>
            </div>
        </div>
    );
};
