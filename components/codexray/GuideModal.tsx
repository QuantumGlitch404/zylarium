import React from 'react';
import { X, FileCode, Search, Edit2, ShieldAlert, BarChart, Settings, Sliders, Play, Keyboard } from 'lucide-react';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[85vh] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/20 bg-white/10 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center border border-primary-500/30">
                            <FileCode className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Code Usage Finder Documentation</h2>
                            <p className="text-sm text-gray-400">Comprehensive guide to static analysis & refactoring</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-16 text-gray-300">

                    {/* Introduction */}
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h3 className="text-3xl font-bold text-white mb-4">Introduction</h3>
                        <p className="text-lg leading-relaxed text-gray-300">
                            Code Usage Finder (Code X-Ray) is a next-generation static analysis tool running entirely in your browser. Unlike traditional server-based search tools, X-Ray indexes your project locally, providing instant zero-latency searches, refactoring simulations, and dead code detection.
                        </p>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex gap-4 items-start">
                            <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                                <Settings className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-300 mb-2">How it works</h4>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    When you upload your project, the engine tokenizes every file into an inverted index. This allows searching millions of lines of code in milliseconds. All data resides in your RAM; nothing is uploaded to the cloud.
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Feature: Search & Filters */}
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Search className="w-6 h-6 text-primary-400" />
                            Search & Filtering
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-white font-bold border-b border-white/10 pb-2">Search Modes</h4>
                                <ul className="space-y-4">
                                    <li className="flex gap-4">
                                        <div className="mt-1"><div className="w-2 h-2 rounded-full bg-blue-500" /></div>
                                        <div>
                                            <strong className="text-blue-300 block mb-1">Exact Match</strong>
                                            Faster and deeper. It looks for whole tokens (variables, strings). Use this for finding precise references to a class or function.
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="mt-1"><div className="w-2 h-2 rounded-full bg-orange-500" /></div>
                                        <div>
                                            <strong className="text-orange-300 block mb-1">Regex Mode</strong>
                                            Advanced pattern matching. Supports standard JS Regex.
                                            <br />
                                            <code className="text-xs bg-black/40 px-2 py-1 rounded mt-2 block w-fit">{'console\\.(log|error)'}</code>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="mt-1"><div className="w-2 h-2 rounded-full bg-purple-500" /></div>
                                        <div>
                                            <strong className="text-purple-300 block mb-1">Fuzzy Search (Levenshtein)</strong>
                                            Approximation algorithms help you find symbols even if you make typo mistakes.
                                            <br />
                                            <em>"functin" → matches "function"</em>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-white font-bold border-b border-white/10 pb-2">Filters & Scopes</h4>
                                <p className="text-sm">Use the top bar filters to narrow down large codebases.</p>
                                <ul className="space-y-3 text-sm">
                                    <li className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <strong className="text-white">Scope:</strong> Limit search to specific folders or exclude library files.
                                    </li>
                                    <li className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <strong className="text-white">Extensions:</strong> Search only `.css` or `.tsx` files. Comma-separated list.
                                    </li>
                                    <li className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <strong className="text-white">Regex Flags:</strong>
                                        <div className="flex gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs uppercase font-bold">i (Case Insensitive)</span>
                                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs uppercase font-bold">m (Multiline)</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Feature: Refactoring */}
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Edit2 className="w-6 h-6 text-green-400" />
                            Refactoring Engine (Rename)
                        </h3>
                        <p className="text-lg text-gray-300">
                            The "Rename" tab in the sidebar allows you to simulate changing a variable/function name across the entire project.
                        </p>

                        <div className="bg-[#151515] rounded-xl border border-white/10 overflow-hidden">
                            <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between">
                                <span className="font-mono text-sm text-gray-400">Simulation Workflow</span>
                                <Play className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl text-white">1</div>
                                    <h5 className="font-bold text-white mb-2">Search Target</h5>
                                    <p className="text-sm text-gray-400">First, search for the symbol you want to rename (e.g. "oldVar") in the main search bar.</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl text-white">2</div>
                                    <h5 className="font-bold text-white mb-2">Input New Name</h5>
                                    <p className="text-sm text-gray-400">Open the Rename sidebar tab and type the new name (e.g. "newVar").</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl text-white">3</div>
                                    <h5 className="font-bold text-white mb-2">Visual Diff</h5>
                                    <p className="text-sm text-gray-400">Click "Simulate". A modal will open showing a git-style diff of every affected line.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Feature: Dead Code */}
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-red-400" />
                            Dead Code Detection
                        </h3>
                        <div className="flex gap-6 flex-col md:flex-row">
                            <div className="flex-1 space-y-4">
                                <p className="text-gray-300 leading-relaxed">
                                    This advanced feature scans your codebase for "Declaration Tokens" (like <code>function</code>, <code>class</code>, <code>const</code>) that appear exactly once in the entire project token index.
                                </p>
                                <p className="text-gray-300">
                                    If a token appears only once (at its definition), it implies it is never 'called' or 'referenced' anywhere else.
                                </p>
                            </div>
                            <div className="flex-1 bg-red-500/5 border border-red-500/20 p-6 rounded-xl">
                                <h4 className="text-red-300 font-bold mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Usage Warning</h4>
                                <p className="text-xs text-red-200/70 mb-2">This is a heuristic analysis.</p>
                                <ul className="list-disc list-inside text-sm text-red-200/70 space-y-1">
                                    <li>False positives may occur with dynamic property access (e.g. <code>data[prop]</code>).</li>
                                    <li>Library exports might be flagged if not used internally.</li>
                                    <li>Always review before deleting.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Shortcuts */}
                    <div className="space-y-6 max-w-4xl mx-auto pb-10">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Keyboard className="w-6 h-6 text-yellow-400" />
                            Keyboard Shortcuts
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                                <kbd className="px-3 py-1.5 bg-black/40 rounded-lg text-white font-mono mb-2 border border-white/10">Enter</kbd>
                                <span className="text-xs text-gray-400">Trigger Search</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                                <kbd className="px-3 py-1.5 bg-black/40 rounded-lg text-white font-mono mb-2 border border-white/10">Alt + E</kbd>
                                <span className="text-xs text-gray-400">Exact Mode</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                                <kbd className="px-3 py-1.5 bg-black/40 rounded-lg text-white font-mono mb-2 border border-white/10">Alt + R</kbd>
                                <span className="text-xs text-gray-400">Regex Mode</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                                <kbd className="px-3 py-1.5 bg-black/40 rounded-lg text-white font-mono mb-2 border border-white/10">Alt + F</kbd>
                                <span className="text-xs text-gray-400">Fuzzy Mode</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
