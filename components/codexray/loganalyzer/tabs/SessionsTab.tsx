// Sessions Tab - Session list and detail view

import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Clock, User, Activity } from 'lucide-react';
import { AnalysisResult, LogSession, LogEntry } from '../types';
import { formatDuration } from '../engine/SessionReconstructor';

interface SessionsTabProps {
    result: AnalysisResult;
    selectedSession: string | null;
    onSelectSession: (sessionId: string | null) => void;
}

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

type SortBy = 'events' | 'duration' | 'errors';

const SessionCard: React.FC<{
    session: LogSession;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ session, isSelected, onSelect }) => {
    const totalEvents = session.entryCount;
    const errorPercent = totalEvents > 0 ? (session.eventsByLevel.error / totalEvents) * 100 : 0;

    return (
        <div
            onClick={onSelect}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                    ? 'bg-indigo-500/20 border-indigo-500/50 ring-2 ring-indigo-500/30'
                    : session.isAnomaly
                        ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h4 className="font-medium text-white font-mono">{session.id.substring(0, 16)}...</h4>
                </div>
                {session.isAnomaly && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                        <AlertTriangle className="w-3 h-3" /> ANOMALY
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                    <span className="text-gray-500">Duration:</span>
                    <div className="text-white">{formatDuration(session.duration)}</div>
                </div>
                <div>
                    <span className="text-gray-500">Events:</span>
                    <div className="text-white">{session.entryCount.toLocaleString()}</div>
                </div>
                <div>
                    <span className="text-gray-500">Errors:</span>
                    <div className={session.eventsByLevel.error > 0 ? 'text-red-400' : 'text-green-400'}>
                        {session.eventsByLevel.error}
                    </div>
                </div>
            </div>

            {/* Timeline dots */}
            <div className="flex items-center gap-1 mb-2">
                {session.entries.slice(0, 20).map((entry, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${entry.level === 'ERROR' || entry.level === 'FATAL' ? 'bg-red-500' :
                                entry.level === 'WARN' ? 'bg-yellow-500' :
                                    'bg-blue-500/50'
                            }`}
                        title={entry.message.substring(0, 50)}
                    />
                ))}
                {session.entries.length > 20 && (
                    <span className="text-xs text-gray-500">+{session.entries.length - 20}</span>
                )}
            </div>

            {/* User info */}
            {(session.userId || session.ipAddress) && (
                <div className="text-xs text-gray-500 flex items-center gap-3">
                    {session.userId && <span>User: {session.userId}</span>}
                    {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                </div>
            )}

            {session.isAnomaly && session.anomalyReason && (
                <div className="mt-2 text-xs text-yellow-400">
                    ⚠ {session.anomalyReason}
                </div>
            )}
        </div>
    );
};

const SessionDetail: React.FC<{
    session: LogSession;
    onClose: () => void;
}> = ({ session, onClose }) => {
    const [levelFilter, setLevelFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');

    const filteredEntries = useMemo(() => {
        let entries = session.entries;

        if (levelFilter !== 'ALL') {
            entries = entries.filter(e => e.level === levelFilter);
        }

        if (search) {
            const lower = search.toLowerCase();
            entries = entries.filter(e => e.message.toLowerCase().includes(lower));
        }

        return entries;
    }, [session.entries, levelFilter, search]);

    return (
        <GlassPanel className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Session: {session.id.substring(0, 16)}...</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            {/* Session info */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-white/5 rounded-lg">
                <div><span className="text-gray-500">Start:</span> <span className="text-white">{session.startTime.toLocaleString()}</span></div>
                <div><span className="text-gray-500">End:</span> <span className="text-white">{session.endTime.toLocaleString()}</span></div>
                <div><span className="text-gray-500">Duration:</span> <span className="text-white">{formatDuration(session.duration)}</span></div>
                <div><span className="text-gray-500">Total Events:</span> <span className="text-white">{session.entryCount}</span></div>
                {session.userId && <div><span className="text-gray-500">User:</span> <span className="text-white">{session.userId}</span></div>}
                {session.ipAddress && <div><span className="text-gray-500">IP:</span> <span className="text-white">{session.ipAddress}</span></div>}
            </div>

            {/* Level breakdown */}
            <div className="flex gap-4 mb-4 text-sm">
                <span className="text-gray-400">INFO: <strong className="text-blue-400">{session.eventsByLevel.info}</strong></span>
                <span className="text-gray-400">WARN: <strong className="text-yellow-400">{session.eventsByLevel.warn}</strong></span>
                <span className="text-gray-400">ERROR: <strong className="text-red-400">{session.eventsByLevel.error}</strong></span>
                <span className="text-gray-400">DEBUG: <strong className="text-gray-300">{session.eventsByLevel.debug}</strong></span>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-sm text-white"
                >
                    <option value="ALL">All Levels</option>
                    <option value="ERROR">ERROR</option>
                    <option value="WARN">WARN</option>
                    <option value="INFO">INFO</option>
                    <option value="DEBUG">DEBUG</option>
                </select>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-sm text-white placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Event list */}
            <div className="space-y-1 max-h-96 overflow-auto">
                {filteredEntries.map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded">
                        <span className="text-xs text-gray-500 font-mono w-24 flex-shrink-0">
                            {entry.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${entry.level === 'ERROR' || entry.level === 'FATAL' ? 'bg-red-500/20 text-red-400' :
                                entry.level === 'WARN' ? 'bg-yellow-500/20 text-yellow-400' :
                                    entry.level === 'INFO' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-gray-500/20 text-gray-400'
                            }`}>
                            {entry.level}
                        </span>
                        <span className="flex-1 text-sm text-gray-300">{entry.message}</span>
                    </div>
                ))}
            </div>
        </GlassPanel>
    );
};

export const SessionsTab: React.FC<SessionsTabProps> = ({ result, selectedSession, onSelectSession }) => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('events');
    const [hasErrorsOnly, setHasErrorsOnly] = useState(false);

    const sessions = useMemo(() => {
        let arr = Array.from(result.sessions.values());

        if (hasErrorsOnly) {
            arr = arr.filter(s => s.eventsByLevel.error > 0);
        }

        if (search) {
            const lower = search.toLowerCase();
            arr = arr.filter(s =>
                s.id.toLowerCase().includes(lower) ||
                s.userId?.toLowerCase().includes(lower)
            );
        }

        switch (sortBy) {
            case 'events': arr.sort((a, b) => b.entryCount - a.entryCount); break;
            case 'duration': arr.sort((a, b) => b.duration - a.duration); break;
            case 'errors': arr.sort((a, b) => b.eventsByLevel.error - a.eventsByLevel.error); break;
        }

        return arr;
    }, [result.sessions, search, sortBy, hasErrorsOnly]);

    const selectedSessionData = selectedSession ? result.sessions.get(selectedSession) : null;

    return (
        <div className="flex gap-4 h-full">
            {/* Session list */}
            <div className={`space-y-4 ${selectedSessionData ? 'w-1/2' : 'w-full'}`}>
                {/* Filters */}
                <GlassPanel className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasErrorsOnly}
                                onChange={(e) => setHasErrorsOnly(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-400">Has Errors</span>
                        </label>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort:</span>
                            {(['events', 'duration', 'errors'] as SortBy[]).map(option => (
                                <button
                                    key={option}
                                    onClick={() => setSortBy(option)}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${sortBy === option
                                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            : 'text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-500">
                        Found {sessions.length} sessions
                    </div>
                </GlassPanel>

                {/* Session cards */}
                <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-auto">
                    {sessions.map(session => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            isSelected={selectedSession === session.id}
                            onSelect={() => onSelectSession(selectedSession === session.id ? null : session.id)}
                        />
                    ))}

                    {sessions.length === 0 && (
                        <GlassPanel className="p-8 text-center">
                            <div className="text-4xl mb-2">📋</div>
                            <div className="text-gray-400">No sessions found</div>
                        </GlassPanel>
                    )}
                </div>
            </div>

            {/* Session detail */}
            {selectedSessionData && (
                <div className="w-1/2">
                    <SessionDetail
                        session={selectedSessionData}
                        onClose={() => onSelectSession(null)}
                    />
                </div>
            )}
        </div>
    );
};

export default SessionsTab;
