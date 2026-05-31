// Raw Logs Tab - Filtered log viewer with noise filtering

import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Copy, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { AnalysisResult, LogEntry, LogLevel, NoisePattern } from '../types';

interface RawLogsTabProps {
    result: AnalysisResult;
    noisePatterns: NoisePattern[];
    onUpdateNoisePatterns: (patterns: NoisePattern[]) => void;
}

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

const LEVEL_COLORS: Record<LogLevel, string> = {
    'ERROR': 'bg-red-500/20 text-red-400 border-red-500/30',
    'FATAL': 'bg-red-600/20 text-red-300 border-red-600/30',
    'WARN': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'INFO': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'DEBUG': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'TRACE': 'bg-gray-600/20 text-gray-500 border-gray-600/30',
    'UNKNOWN': 'bg-gray-700/20 text-gray-500 border-gray-700/30',
};

export const RawLogsTab: React.FC<RawLogsTabProps> = ({ result, noisePatterns, onUpdateNoisePatterns }) => {
    const [search, setSearch] = useState('');
    const [isRegex, setIsRegex] = useState(false);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
    const [fileFilter, setFileFilter] = useState<string>('ALL');
    const [hideNoise, setHideNoise] = useState(true);
    const [hideDuplicates, setHideDuplicates] = useState(true);
    const [page, setPage] = useState(0);
    const [showNoiseSettings, setShowNoiseSettings] = useState(false);
    const [expandedStack, setExpandedStack] = useState<Set<string>>(new Set());

    const pageSize = 100;

    const files = useMemo(() => {
        const fileSet = new Set(result.entries.map(e => e.sourceFile));
        return Array.from(fileSet);
    }, [result.entries]);

    const filteredEntries = useMemo(() => {
        let entries = result.entries;

        // Level filter
        if (levelFilter !== 'ALL') {
            entries = entries.filter(e => e.level === levelFilter);
        }

        // File filter
        if (fileFilter !== 'ALL') {
            entries = entries.filter(e => e.sourceFile === fileFilter);
        }

        // Hide noise
        if (hideNoise) {
            entries = entries.filter(e => !e.isNoise);
        }

        // Hide duplicates
        if (hideDuplicates) {
            entries = entries.filter(e => !e.isDuplicate);
        }

        // Search
        if (search) {
            if (isRegex) {
                try {
                    const flags = caseSensitive ? 'g' : 'gi';
                    const regex = new RegExp(search, flags);
                    entries = entries.filter(e => regex.test(e.message) || regex.test(e.rawContent));
                } catch { }
            } else {
                const term = caseSensitive ? search : search.toLowerCase();
                entries = entries.filter(e => {
                    const msg = caseSensitive ? e.message : e.message.toLowerCase();
                    const raw = caseSensitive ? e.rawContent : e.rawContent.toLowerCase();
                    return msg.includes(term) || raw.includes(term);
                });
            }
        }

        return entries;
    }, [result.entries, levelFilter, fileFilter, hideNoise, hideDuplicates, search, isRegex, caseSensitive]);

    const pagedEntries = filteredEntries.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(filteredEntries.length / pageSize);

    const exportFiltered = () => {
        const content = filteredEntries.map(e => e.rawContent).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'filtered-logs.log';
        a.click();
        URL.revokeObjectURL(url);
    };

    const copySelection = () => {
        const content = pagedEntries.map(e => e.rawContent).join('\n');
        navigator.clipboard.writeText(content);
    };

    const toggleNoisePattern = (id: string) => {
        const updated = noisePatterns.map(p =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
        );
        onUpdateNoisePatterns(updated);
    };

    const toggleStack = (id: string) => {
        const newExpanded = new Set(expandedStack);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedStack(newExpanded);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <GlassPanel className="p-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isRegex} onChange={(e) => setIsRegex(e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-400">Regex</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-400">Case Sensitive</span>
                    </label>

                    {/* Level filter */}
                    <select
                        value={levelFilter}
                        onChange={(e) => { setLevelFilter(e.target.value as any); setPage(0); }}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white"
                    >
                        <option value="ALL">All Levels</option>
                        <option value="ERROR">ERROR</option>
                        <option value="WARN">WARN</option>
                        <option value="INFO">INFO</option>
                        <option value="DEBUG">DEBUG</option>
                    </select>

                    {/* File filter */}
                    {files.length > 1 && (
                        <select
                            value={fileFilter}
                            onChange={(e) => { setFileFilter(e.target.value); setPage(0); }}
                            className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white"
                        >
                            <option value="ALL">All Files</option>
                            {files.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Noise filtering */}
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={hideDuplicates} onChange={(e) => setHideDuplicates(e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-400">Collapse duplicates</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={hideNoise} onChange={(e) => setHideNoise(e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-400">Hide noise patterns</span>
                    </label>

                    <button
                        onClick={() => setShowNoiseSettings(!showNoiseSettings)}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        [Edit Patterns]
                    </button>
                </div>

                {/* Noise pattern settings */}
                {showNoiseSettings && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Noise Patterns</h4>
                        <div className="space-y-2">
                            {noisePatterns.map(pattern => (
                                <label key={pattern.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                                    <input
                                        type="checkbox"
                                        checked={pattern.isActive}
                                        onChange={() => toggleNoisePattern(pattern.id)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="flex-1 text-sm text-gray-300">{pattern.description}</span>
                                    <code className="text-xs text-gray-500 font-mono">{pattern.pattern}</code>
                                    <span className="text-xs text-gray-500">({pattern.matchCount} matches)</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <span className="text-sm text-gray-500">
                        Showing {filteredEntries.length.toLocaleString()} of {result.entries.length.toLocaleString()} lines (after filtering)
                    </span>

                    <div className="flex gap-2">
                        <button onClick={exportFiltered} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/10 rounded hover:bg-white/20">
                            <Download className="w-3 h-3" /> Export Filtered
                        </button>
                        <button onClick={copySelection} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/10 rounded hover:bg-white/20">
                            <Copy className="w-3 h-3" /> Copy Page
                        </button>
                    </div>
                </div>
            </GlassPanel>

            {/* Log entries */}
            <GlassPanel className="p-4">
                <div className="space-y-0.5 font-mono text-sm max-h-[600px] overflow-auto">
                    {pagedEntries.map((entry, i) => (
                        <div key={entry.id} className="group hover:bg-white/5 rounded">
                            <div className="flex items-start gap-2 p-1">
                                <span className="text-xs text-gray-600 w-10 text-right flex-shrink-0">
                                    {entry.lineNumber}
                                </span>
                                <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                                    {entry.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '--:--:--'}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium w-14 text-center flex-shrink-0 border ${LEVEL_COLORS[entry.level]}`}>
                                    {entry.level}
                                </span>
                                <span className="flex-1 text-gray-300 break-all">
                                    {entry.message}
                                </span>
                                {entry.stackTrace && (
                                    <button
                                        onClick={() => toggleStack(entry.id)}
                                        className="text-xs text-gray-500 hover:text-white flex-shrink-0"
                                    >
                                        {expandedStack.has(entry.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>

                            {/* Metadata */}
                            {Object.keys(entry.metadata).length > 0 && entry.level !== 'UNKNOWN' && (
                                <div className="ml-32 text-xs text-gray-500 pb-1">
                                    {Object.entries(entry.metadata).slice(0, 5).map(([k, v]) => (
                                        <span key={k} className="mr-3">
                                            <span className="text-gray-600">{k}:</span> {String(v).substring(0, 30)}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Stack trace */}
                            {entry.stackTrace && expandedStack.has(entry.id) && (
                                <pre className="ml-32 text-xs text-gray-500 bg-white/5 p-2 rounded mt-1 mb-2 overflow-x-auto">
                                    {entry.stackTrace}
                                </pre>
                            )}
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <span className="text-sm text-gray-500">
                            Page {page + 1} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 text-sm bg-white/10 rounded disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1 text-sm bg-white/10 rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </GlassPanel>
        </div>
    );
};

export default RawLogsTab;
