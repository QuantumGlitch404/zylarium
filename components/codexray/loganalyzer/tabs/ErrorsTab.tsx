// Errors Tab - Grouped by fingerprint with filters

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, AlertTriangle, Clock, Users, Copy } from 'lucide-react';
import { AnalysisResult, ErrorFingerprint } from '../types';

interface ErrorsTabProps {
    result: AnalysisResult;
    onViewSession: (sessionId: string) => void;
}

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

type SortBy = 'frequency' | 'first' | 'last' | 'sessions';

const ErrorCard: React.FC<{
    fingerprint: ErrorFingerprint;
    totalErrors: number;
    onViewSession: (sessionId: string) => void;
}> = ({ fingerprint, totalErrors, onViewSession }) => {
    const [expanded, setExpanded] = useState(false);
    const percentage = (fingerprint.count / totalErrors) * 100;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <GlassPanel className={`overflow-hidden ${fingerprint.isAnomalous ? 'border-yellow-500/30' : ''}`}>
            <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3">
                    <span className={`text-xl ${fingerprint.level === 'ERROR' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {fingerprint.level === 'ERROR' ? '🔴' : '🟡'}
                    </span>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{fingerprint.template}</h4>
                        <div className="text-xs text-gray-500 mt-1">
                            Fingerprint: {fingerprint.id}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span>Occurrences: <strong className="text-white">{fingerprint.count.toLocaleString()}</strong></span>
                            <span>First: {fingerprint.firstSeen.toLocaleTimeString()}</span>
                            <span>Last: {fingerprint.lastSeen.toLocaleTimeString()}</span>
                            <span>Sessions: {fingerprint.affectedSessionCount}</span>
                        </div>

                        {/* Frequency bar */}
                        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${fingerprint.level === 'ERROR' ? 'bg-red-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min(100, percentage * 2)}%` }}
                            />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of all errors</div>

                        {/* Sparkline */}
                        {fingerprint.frequencyOverTime.length > 0 && (
                            <div className="flex items-end gap-0.5 h-8 mt-2">
                                {fingerprint.frequencyOverTime.map((d, i) => {
                                    const max = Math.max(...fingerprint.frequencyOverTime.map(x => x.value), 1);
                                    return (
                                        <div
                                            key={i}
                                            className={`flex-1 rounded-t ${fingerprint.level === 'ERROR' ? 'bg-red-500/50' : 'bg-yellow-500/50'}`}
                                            style={{ height: `${(d.value / max) * 100}%` }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* Anomaly warning */}
                        {fingerprint.isAnomalous && (
                            <div className="mt-2 flex items-center gap-2 text-yellow-400 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {fingerprint.anomalyReason}
                            </div>
                        )}
                    </div>

                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="p-4 pt-0 border-t border-white/10 mt-2">
                    {/* Sample messages */}
                    <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-300 mb-2">Sample Messages:</h5>
                        <div className="space-y-1">
                            {fingerprint.sampleMessages.slice(0, 3).map((msg, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className="text-gray-500">•</span>
                                    <code className="text-gray-400 font-mono">{msg}</code>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stack trace */}
                    {fingerprint.stackTrace && (
                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Stack Trace:</h5>
                            <pre className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg overflow-x-auto font-mono">
                                {fingerprint.stackTrace.split('\n').slice(0, 5).join('\n')}
                            </pre>
                        </div>
                    )}

                    {/* Affected sessions */}
                    {fingerprint.affectedSessions.length > 0 && (
                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Affected Sessions:</h5>
                            <div className="flex flex-wrap gap-2">
                                {fingerprint.affectedSessions.slice(0, 5).map(sessionId => (
                                    <button
                                        key={sessionId}
                                        onClick={(e) => { e.stopPropagation(); onViewSession(sessionId); }}
                                        className="px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30"
                                    >
                                        {sessionId.substring(0, 8)}...
                                    </button>
                                ))}
                                {fingerprint.affectedSessions.length > 5 && (
                                    <span className="text-xs text-gray-500">+{fingerprint.affectedSessions.length - 5} more</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => copyToClipboard(fingerprint.template)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/10 rounded hover:bg-white/20"
                        >
                            <Copy className="w-3 h-3" /> Copy Pattern
                        </button>
                    </div>
                </div>
            )}
        </GlassPanel>
    );
};

export const ErrorsTab: React.FC<ErrorsTabProps> = ({ result, onViewSession }) => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('frequency');
    const [levelFilter, setLevelFilter] = useState<'ALL' | 'ERROR' | 'WARN'>('ALL');

    const fingerprints = useMemo(() => {
        let arr = Array.from(result.fingerprints.values());

        // Filter by level
        if (levelFilter !== 'ALL') {
            arr = arr.filter(fp => fp.level === levelFilter);
        }

        // Filter by search
        if (search) {
            const lower = search.toLowerCase();
            arr = arr.filter(fp =>
                fp.template.toLowerCase().includes(lower) ||
                fp.sampleMessages.some(m => m.toLowerCase().includes(lower))
            );
        }

        // Sort
        switch (sortBy) {
            case 'frequency': arr.sort((a, b) => b.count - a.count); break;
            case 'first': arr.sort((a, b) => a.firstSeen.getTime() - b.firstSeen.getTime()); break;
            case 'last': arr.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()); break;
            case 'sessions': arr.sort((a, b) => b.affectedSessionCount - a.affectedSessionCount); break;
        }

        return arr;
    }, [result.fingerprints, search, sortBy, levelFilter]);

    const totalErrors = result.summary.totalOccurrences;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <GlassPanel className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search errors..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Level filter */}
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="ALL">All Levels</option>
                        <option value="ERROR">ERROR</option>
                        <option value="WARN">WARN</option>
                    </select>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Sort by:</span>
                        {(['frequency', 'first', 'last', 'sessions'] as SortBy[]).map(option => (
                            <button
                                key={option}
                                onClick={() => setSortBy(option)}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${sortBy === option
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {option === 'frequency' ? 'Frequency' :
                                    option === 'first' ? 'First Seen' :
                                        option === 'last' ? 'Last Seen' : 'Sessions'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-2 text-sm text-gray-500">
                    Found {fingerprints.length} unique error patterns ({totalErrors.toLocaleString()} total occurrences)
                </div>
            </GlassPanel>

            {/* Error list */}
            <div className="space-y-4">
                {fingerprints.map(fp => (
                    <ErrorCard
                        key={fp.id}
                        fingerprint={fp}
                        totalErrors={totalErrors}
                        onViewSession={onViewSession}
                    />
                ))}

                {fingerprints.length === 0 && (
                    <GlassPanel className="p-8 text-center">
                        <div className="text-4xl mb-2">✨</div>
                        <div className="text-gray-400">No errors matching your filters</div>
                    </GlassPanel>
                )}
            </div>
        </div>
    );
};

export default ErrorsTab;
