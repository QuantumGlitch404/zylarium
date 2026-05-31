
import React from 'react';
import { X, Activity, Shield, Share2, Play, FileText, Globe } from 'lucide-react';

interface TrafficGuideModalProps {
    onClose: () => void;
}

export default function TrafficGuideModal({ onClose }: TrafficGuideModalProps) {
    // The parent controls the positioning/overlay now. We just render the card.
    // The parent controls the positioning/overlay now. We just render the card.
    return (
        <div className="w-full max-w-5xl h-[85vh] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">

            {/* Header */}
            <div className="p-6 border-b border-white/20 flex items-center justify-between bg-white/10 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg shadow-inner shadow-indigo-500/20">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">How to Use API Traffic Reconstructor</h2>
                        <p className="text-sm text-white/50">Master the art of static traffic analysis</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 text-white/80 custom-scrollbar scroll-smooth">

                {/* Introduction */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
                        <Globe className="w-4 h-4" /> Core Concept
                    </div>
                    <h3 className="text-2xl font-bold text-white">What is this tool?</h3>
                    <p className="leading-relaxed text-white/70">
                        The **API Traffic Reconstructor** uses advanced static analysis (RegEx and AST-like pattern matching) to read your source code and "reconstruct" the API traffic that your application *would* generate if it were running.
                    </p>
                    <p className="leading-relaxed text-white/70">
                        It does this entirely in your browser, without ever sending your code to a server. It's like an X-Ray for your network layer.
                    </p>
                </section>

                <div className="h-px bg-white/10" />

                {/* Tab Guide */}
                <section className="space-y-6">
                    <h3 className="text-xl font-bold text-white">The Four Pillars of Analysis</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Endpoints */}
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                <h4 className="font-bold text-white">1. Endpoints</h4>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed">
                                A comprehensive list of every API route detected. We analyze `fetch`, `axios`, and other clients to find URLs.
                                <br /><br />
                                <span className="text-indigo-300 font-semibold">Pro Tip:</span> Click on a card to see the inferred JSON payload schema and headers.
                            </p>
                        </div>

                        {/* Call Sites */}
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <Play className="w-5 h-5 text-emerald-400" />
                                <h4 className="font-bold text-white">2. Call Sites</h4>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed">
                                See exactly *where* in your code these calls happen. We show you the filename and the exact snippet of code triggering the request.
                            </p>
                        </div>

                        {/* Graph */}
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <Share2 className="w-5 h-5 text-blue-400" />
                                <h4 className="font-bold text-white">3. Dependency Graph</h4>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed">
                                Visualize the relationship between your UI components (files) and your API endpoints.
                                <br /><br />
                                <span className="text-blue-300 font-semibold">Left Side:</span> Your React/Vue Components.
                                <br />
                                <span className="text-emerald-300 font-semibold">Right Side:</span> The API Endpoints they call.
                            </p>
                        </div>

                        {/* Auth */}
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <Shield className="w-5 h-5 text-amber-400" />
                                <h4 className="font-bold text-white">4. Auth Patterns</h4>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed">
                                We trace how tokens are stored (localStorage, cookies) and used (Authorization headers). This helps verify security implementation.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-white/10" />

                {/* FAQ / Tips */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
                        <Activity className="w-4 h-4" /> Power User Tips
                    </div>
                    <ul className="space-y-3 text-white/70 list-disc list-inside">
                        <li>
                            <strong className="text-white">Dynamic URLs:</strong> If you see `{`{variable}`} ` in a URL, it means we detected a template literal. We try to resolve constants where possible.
                        </li>
                        <li>
                            <strong className="text-white">Exporting:</strong> Use the button in the bottom right of the sidebar to export an **OpenAPI (Swagger)** file. You can import this into Postman!
                        </li>
                        <li>
                            <strong className="text-white">Privacy:</strong> Your code never leaves your computer. All processing is done in-memory within this browser tab.
                        </li>
                    </ul>
                </section>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end shrink-0">
                <button onClick={onClose} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors">
                    Got it, let's analyze!
                </button>
            </div>
        </div>
    );
}
