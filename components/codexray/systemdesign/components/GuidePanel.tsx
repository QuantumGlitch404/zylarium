
import React from 'react';
import { X, BookOpen, MousePointer2, Layout, Sliders, Zap, Share } from 'lucide-react';

interface GuidePanelProps {
    onClose: () => void;
}

export const GuidePanel: React.FC<GuidePanelProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white/10 backdrop-blur-3xl rounded-2xl border border-white/20 max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col shadow-indigo-900/50">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                            <BookOpen className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">System Design Visualizer Guide</h2>
                            <p className="text-sm text-gray-400">Interactive architecture diagramming & simulation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-12">

                    {/* Section 1: Basics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <MousePointer2 className="w-5 h-5 text-indigo-400" /> Canvas Interaction
                            </h3>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="bg-white/10 p-1 rounded text-xs font-mono text-white">Drag</span>
                                    <span>Move components or pan the canvas view.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-white/10 p-1 rounded text-xs font-mono text-white">Click</span>
                                    <span>Select a component to edit its properties in the right panel.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-white/10 p-1 rounded text-xs font-mono text-white">Shift + Drag</span>
                                    <span>Draw a connection line between two components.</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Layout className="w-5 h-5 text-indigo-400" /> Component Palette
                            </h3>
                            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                                The left sidebar contains a categorized list of system components (Servers, Databases, Queues, etc.).
                            </p>
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-sm text-indigo-200">
                                <strong>Tip:</strong> You can either <u>drag & drop</u> items onto the canvas OR <u>click</u> them to instantly add to the center of your view.
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Section 2: Simulation */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" /> Traffic Simulation Engine
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-white font-bold mb-2">1. Define Workload</div>
                                <p className="text-xs text-gray-400">Open the "LOAD" tab in the right panel to define Request Per Second (RPS) sources.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-white font-bold mb-2">2. Properties</div>
                                <p className="text-xs text-gray-400">Select components to adjust capacity, processing time, and replicas to handle the load.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-white font-bold mb-2">3. Run & Analyze</div>
                                <p className="text-xs text-gray-400">Click "Run" in the bottom bar. Watch components change color (Green→Red) as they saturate.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Features */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-green-400" /> Advanced Tools
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                            <ul className="space-y-2">
                                <li><strong>Templates:</strong> Start with pre-built architectures like Uber or Twitter.</li>
                                <li><strong>Auto Layout:</strong> Automatically organize messy diagrams into layers.</li>
                            </ul>
                            <ul className="space-y-2">
                                <li><strong>Interview Mode:</strong> Timer and checklist for practicing system design interviews.</li>
                                <li><strong>Export:</strong> Save your design as PNG for presentations or JSON for backup.</li>
                            </ul>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Shortcuts */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Keyboard Shortcuts</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center">
                                <kbd className="text-indigo-400 font-mono">Del</kbd>
                                <div className="text-xs text-gray-500 mt-1">Delete Selected</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center">
                                <kbd className="text-indigo-400 font-mono">Shift + Click</kbd>
                                <div className="text-xs text-gray-500 mt-1">Multi Select</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center">
                                <kbd className="text-indigo-400 font-mono">Ctrl + Scroll</kbd>
                                <div className="text-xs text-gray-500 mt-1">Zoom Canvas</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center">
                                <kbd className="text-indigo-400 font-mono">?</kbd>
                                <div className="text-xs text-gray-500 mt-1">Open Guide</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
