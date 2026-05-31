// Timeline Tab - Time range selector and activity graph

import React, { useState, useMemo } from 'react';
import { Clock, ZoomIn, ZoomOut, Filter } from 'lucide-react';
import { AnalysisResult, LogEntry, LogLevel } from '../types';

interface TimelineTabProps {
    result: AnalysisResult;
    onSelectEntry: (entry: LogEntry) => void;
}

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

const LEVEL_COLORS: Record<LogLevel, string> = {
    'ERROR': 'bg-red-500',
    'FATAL': 'bg-red-600',
    'WARN': 'bg-yellow-500',
    'INFO': 'bg-blue-500',
    'DEBUG': 'bg-gray-500',
    'TRACE': 'bg-gray-400',
    'UNKNOWN': 'bg-gray-600',
};

export const TimelineTab: React.FC<TimelineTabProps> = ({ result, onSelectEntry }) => {
    const [rangeStart, setRangeStart] = useState(0);
    const [rangeEnd, setRangeEnd] = useState(100);
    const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
    const [page, setPage] = useState(0);
    const pageSize = 50;

    const entriesWithTimestamp = useMemo(() =>
        result.entries.filter(e => e.timestamp).sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime()),
        [result.entries]
    );

    const timeRange = result.summary.timeRange;

    // Calculate visible range
    const visibleEntries = useMemo(() => {
        if (!timeRange || entriesWithTimestamp.length === 0) return entriesWithTimestamp;

        const duration = timeRange.end.getTime() - timeRange.start.getTime();
        const startTime = timeRange.start.getTime() + (duration * rangeStart / 100);
        const endTime = timeRange.start.getTime() + (duration * rangeEnd / 100);

        return entriesWithTimestamp.filter(e => {
            const ts = e.timestamp!.getTime();
            return ts >= startTime && ts <= endTime;
        });
    }, [entriesWithTimestamp, timeRange, rangeStart, rangeEnd]);

    // Apply level filter
    const filteredEntries = useMemo(() =>
        levelFilter === 'ALL' ? visibleEntries : visibleEntries.filter(e => e.level === levelFilter),
        [visibleEntries, levelFilter]
    );

    // Paginate
    const pagedEntries = filteredEntries.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(filteredEntries.length / pageSize);

    // Build histogram data
    const histogram = useMemo(() => {
        if (!timeRange) return [];

        const bucketCount = 48;
        const duration = timeRange.end.getTime() - timeRange.start.getTime();
        const bucketSize = duration / bucketCount;

        const buckets: { time: Date; counts: Record<string, number>; total: number }[] = [];

        for (let i = 0; i < bucketCount; i++) {
            const bucketStart = timeRange.start.getTime() + (i * bucketSize);
            const bucketEnd = bucketStart + bucketSize;

            const counts: Record<string, number> = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
            let total = 0;

            for (const entry of entriesWithTimestamp) {
                const ts = entry.timestamp!.getTime();
                if (ts >= bucketStart && ts < bucketEnd) {
                    if (entry.level === 'ERROR' || entry.level === 'FATAL') counts.ERROR++;
                    else if (entry.level === 'WARN') counts.WARN++;
                    else if (entry.level === 'INFO') counts.INFO++;
                    else counts.DEBUG++;
                    total++;
                }
            }

            buckets.push({ time: new Date(bucketStart), counts, total });
        }

        return buckets;
    }, [entriesWithTimestamp, timeRange]);

    const maxCount = Math.max(...histogram.map(b => b.total), 1);

    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-4">
            {/* Time Range Selector */}
            <GlassPanel className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Time Range</h3>
                    <div className="flex gap-2">
                        {[['1h', 90, 100], ['6h', 75, 100], ['12h', 50, 100], ['All', 0, 100]].map(([label, start, end]) => (
                            <button
                                key={label as string}
                                onClick={() => { setRangeStart(start as number); setRangeEnd(end as number); }}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${rangeStart === start && rangeEnd === end
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                        : 'text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {timeRange && (
                    <>
                        {/* Range slider */}
                        <div className="relative h-8 mb-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full h-1 bg-white/20 rounded-full">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ marginLeft: `${rangeStart}%`, width: `${rangeEnd - rangeStart}%` }}
                                    />
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(Math.min(parseInt(e.target.value), rangeEnd - 5))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>

                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{formatTime(timeRange.start)}</span>
                            <span className="text-indigo-400">
                                Selected: {formatTime(new Date(timeRange.start.getTime() + (timeRange.end.getTime() - timeRange.start.getTime()) * rangeStart / 100))}
                                {' - '}
                                {formatTime(new Date(timeRange.start.getTime() + (timeRange.end.getTime() - timeRange.start.getTime()) * rangeEnd / 100))}
                            </span>
                            <span>{formatTime(timeRange.end)}</span>
                        </div>
                    </>
                )}
            </GlassPanel>

            {/* Activity Graph */}
            <GlassPanel className="p-4">
                <h3 className="font-semibold text-white mb-4">Activity Over Time</h3>

                <div className="h-32 flex items-end gap-0.5">
                    {histogram.map((bucket, i) => {
                        const height = (bucket.total / maxCount) * 100;
                        const inRange = i >= (rangeStart / 100 * 48) && i <= (rangeEnd / 100 * 48);

                        return (
                            <div
                                key={i}
                                className="flex-1 flex flex-col justify-end"
                                style={{ height: '100%' }}
                                title={`${formatTime(bucket.time)}: ${bucket.total} events`}
                            >
                                <div
                                    className={`w-full rounded-t transition-all ${inRange ? '' : 'opacity-30'}`}
                                    style={{ height: `${height}%` }}
                                >
                                    {/* Stacked bars */}
                                    <div className="h-full flex flex-col-reverse">
                                        {bucket.counts.DEBUG > 0 && (
                                            <div className="bg-gray-500" style={{ height: `${(bucket.counts.DEBUG / bucket.total) * 100}%` }} />
                                        )}
                                        {bucket.counts.INFO > 0 && (
                                            <div className="bg-blue-500" style={{ height: `${(bucket.counts.INFO / bucket.total) * 100}%` }} />
                                        )}
                                        {bucket.counts.WARN > 0 && (
                                            <div className="bg-yellow-500" style={{ height: `${(bucket.counts.WARN / bucket.total) * 100}%` }} />
                                        )}
                                        {bucket.counts.ERROR > 0 && (
                                            <div className="bg-red-500" style={{ height: `${(bucket.counts.ERROR / bucket.total) * 100}%` }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs">
                    <span className="text-gray-500">Legend:</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> ERROR</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded" /> WARN</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> INFO</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-500 rounded" /> DEBUG</span>
                </div>
            </GlassPanel>

            {/* Events List */}
            <GlassPanel className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">
                        Events in Range ({filteredEntries.length.toLocaleString()})
                    </h3>

                    <select
                        value={levelFilter}
                        onChange={(e) => { setLevelFilter(e.target.value as any); setPage(0); }}
                        className="bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="ALL">All Levels</option>
                        <option value="ERROR">ERROR</option>
                        <option value="WARN">WARN</option>
                        <option value="INFO">INFO</option>
                        <option value="DEBUG">DEBUG</option>
                    </select>
                </div>

                <div className="space-y-1 max-h-96 overflow-auto">
                    {pagedEntries.map(entry => (
                        <div
                            key={entry.id}
                            onClick={() => onSelectEntry(entry)}
                            className="flex items-start gap-3 p-2 hover:bg-white/5 rounded cursor-pointer group"
                        >
                            <span className="text-xs text-gray-500 font-mono w-20 flex-shrink-0">
                                {entry.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${entry.level === 'ERROR' || entry.level === 'FATAL' ? 'bg-red-500/20 text-red-400' :
                                    entry.level === 'WARN' ? 'bg-yellow-500/20 text-yellow-400' :
                                        entry.level === 'INFO' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-gray-500/20 text-gray-400'
                                }`}>
                                {entry.level}
                            </span>
                            <span className="flex-1 text-sm text-gray-300 truncate group-hover:text-white">
                                {entry.message}
                            </span>
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

export default TimelineTab;
