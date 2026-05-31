import React, { useState } from 'react';
import { Pencil, BarChart2, AlertTriangle, FileOutput, Copy, Download, Trash2, ShieldAlert } from 'lucide-react';
import { SearchResult } from '../types/codexray';

interface FinderSidebarProps {
    results: SearchResult;
    onRename: (newName: string) => void;
    onRunDeadCodeAnalysis?: () => void;
}

export const FinderSidebar: React.FC<FinderSidebarProps> = ({ results, onRename, onRunDeadCodeAnalysis }) => {
    const [activeTab, setActiveTab] = useState<'rename' | 'stats' | 'dead'>('stats');
    const [newName, setNewName] = useState('');

    const glassPanel = "bg-white/5 backdrop-blur-xl border-l border-white/10";

    return (
        <div className="w-80 bg-white/10 backdrop-blur-xl border-l border-white/20 flex flex-col h-full shadow-2xl z-10 transition-all duration-300">
            {/* Sidebar Tabs */}
            <div className="flex bg-black/20 border-b border-white/5 p-1 gap-1">
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${activeTab === 'stats'
                        ? 'bg-white/10 text-primary-300 shadow-lg shadow-black/20'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <BarChart2 className="w-4 h-4" />
                    Stats
                </button>
                <button
                    onClick={() => setActiveTab('rename')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${activeTab === 'rename'
                        ? 'bg-orange-500/10 text-orange-300 shadow-lg shadow-orange-500/5'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <Pencil className="w-4 h-4" />
                    Rename
                </button>
                <button
                    onClick={() => setActiveTab('dead')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${activeTab === 'dead'
                        ? 'bg-red-500/10 text-red-300 shadow-lg shadow-red-500/5'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <Trash2 className="w-4 h-4" />
                    Dead
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">

                {/* STATS PANEL */}
                {activeTab === 'stats' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5 shadow-inner relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative text-4xl font-black text-white mb-2 tracking-tighter">{results.matches.length}</div>
                            <div className="relative text-[10px] text-primary-300/70 font-bold uppercase tracking-[0.2em]">Occurrences</div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase px-1">Quick Actions</h3>
                            <button
                                onClick={() => {
                                    const paths = results.matches.map(m => `${m.filePath}:${m.line}`).join('\n');
                                    navigator.clipboard.writeText(paths);
                                    alert("Copied all file paths to clipboard!");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-medium text-gray-300 hover:text-white hover:scale-[1.02] active:scale-95 shadow-sm"
                            >
                                <Copy className="w-3.5 h-3.5 text-blue-400" /> Copy All Paths
                            </button>
                            <button
                                onClick={() => {
                                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results.matches, null, 2));
                                    const downloadAnchorNode = document.createElement('a');
                                    downloadAnchorNode.setAttribute("href", dataStr);
                                    downloadAnchorNode.setAttribute("download", "search_results.json");
                                    document.body.appendChild(downloadAnchorNode);
                                    downloadAnchorNode.click();
                                    downloadAnchorNode.remove();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-medium text-gray-300 hover:text-white hover:scale-[1.02] active:scale-95 shadow-sm"
                            >
                                <FileOutput className="w-3.5 h-3.5 text-green-400" /> Export JSON
                            </button>
                            <button
                                onClick={() => {
                                    const csvContent = "data:text/csv;charset=utf-8,"
                                        + "File,Line,Snippet\n"
                                        + results.matches.map(m => `"${m.filePath}",${m.line},"${m.snippet.replace(/"/g, '""')}"`).join("\n");
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", "search_results.csv");
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-medium text-gray-300 hover:text-white hover:scale-[1.02] active:scale-95 shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5 text-purple-400" /> Export CSV
                            </button>
                        </div>
                    </div>
                )}

                {/* RENAME PANEL */}
                {activeTab === 'rename' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 p-4 rounded-2xl relative overflow-hidden">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-orange-200 mb-2 relative z-10">
                                <ShieldAlert className="w-4 h-4" /> Simulation Mode
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed relative z-10">
                                This will generate a preview of changes. No files are modified until you confirm manually.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold uppercase ml-1">New Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all placeholder-gray-600 shadow-inner"
                                placeholder="Enter variable name..."
                            />
                        </div>

                        <button
                            disabled={!newName?.trim()}
                            onClick={() => onRename(newName)}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] ring-1 ring-white/10"
                        >
                            Simulate Impact
                        </button>
                    </div>
                )}

                {/* DEAD CODE PANEL */}
                {activeTab === 'dead' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 p-4 rounded-2xl">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-red-200 mb-2">
                                <AlertTriangle className="w-4 h-4" /> Dead Code Detection
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Scans for exported functions or variables that have <strong className="text-white">zero</strong> internal usages.
                            </p>
                        </div>

                        <div className="text-center py-4">
                            <button
                                onClick={onRunDeadCodeAnalysis}
                                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold text-gray-200 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Run Deep Analysis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
