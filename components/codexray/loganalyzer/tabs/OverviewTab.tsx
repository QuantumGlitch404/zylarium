// Overview Tab - Summary, health score, top errors

import React from 'react';
import { BarChart2, Clock, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AnalysisResult, LogLevel } from '../types';
import { interpretHealthScore, generateSuggestions } from '../engine/HealthScorer';
import { formatDuration } from '../engine/SessionReconstructor';

interface OverviewTabProps {
    result: AnalysisResult;
    onViewErrors: () => void;
    onViewSessions: () => void;
}

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

const LevelBar: React.FC<{ level: string; count: number; total: number; color: string }> = ({ level, count, total, color }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-16 text-gray-400">{level}</span>
            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
            </div>
            <span className="w-20 text-right text-gray-300">{count.toLocaleString()} ({percentage.toFixed(0)}%)</span>
        </div>
    );
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ result, onViewErrors, onViewSessions }) => {
    const { healthScore, summary, anomalies } = result;
    const interpretation = interpretHealthScore(healthScore.overall);
    const suggestions = generateSuggestions(healthScore);

    const topErrors = Array.from(result.fingerprints.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Health Score Card */}
            <GlassPanel className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Log Health Score</h3>
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <div className={`text-5xl font-bold ${healthScore.overall >= 70 ? 'text-green-400' :
                                healthScore.overall >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {healthScore.overall}
                        </div>
                        <div className="text-sm text-gray-500">out of 100</div>
                    </div>

                    <div className="flex-1">
                        <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-4">
                            <div
                                className={`h-full rounded-full transition-all ${healthScore.overall >= 70 ? 'bg-green-500' :
                                        healthScore.overall >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${healthScore.overall}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Parseable lines:</span>
                                <span className={healthScore.components.parseability >= 90 ? 'text-green-400' : 'text-yellow-400'}>
                                    {healthScore.components.parseability.toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Timestamp coverage:</span>
                                <span className={healthScore.components.timestampCoverage >= 95 ? 'text-green-400' : 'text-yellow-400'}>
                                    {healthScore.components.timestampCoverage.toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Noise ratio:</span>
                                <span className={healthScore.components.noiseRatio <= 15 ? 'text-green-400' : 'text-yellow-400'}>
                                    {healthScore.components.noiseRatio.toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Duplicate ratio:</span>
                                <span className={healthScore.components.duplicateRatio <= 10 ? 'text-green-400' : 'text-yellow-400'}>
                                    {healthScore.components.duplicateRatio.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {suggestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-sm text-gray-400 mb-2">Suggestions:</div>
                        <ul className="space-y-1">
                            {suggestions.map((s, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                    <span className="text-yellow-400">•</span> {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </GlassPanel>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassPanel className="p-4">
                    <div className="text-3xl font-bold text-white">{summary.totalLines.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Total Lines</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Parsed: {summary.parsedLines.toLocaleString()} ({((summary.parsedLines / summary.totalLines) * 100).toFixed(0)}%)
                    </div>
                </GlassPanel>

                <GlassPanel className="p-4">
                    <div className="text-3xl font-bold text-white">
                        {summary.timeRange ? formatDuration(summary.duration) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-400">Time Range</div>
                    {summary.timeRange && (
                        <div className="text-xs text-gray-500 mt-1">
                            {summary.timeRange.start.toLocaleTimeString()} - {summary.timeRange.end.toLocaleTimeString()}
                        </div>
                    )}
                </GlassPanel>

                <GlassPanel className="p-4">
                    <div className="text-3xl font-bold text-white">{summary.uniqueErrors}</div>
                    <div className="text-sm text-gray-400">Unique Errors</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {summary.totalOccurrences.toLocaleString()} total occurrences
                    </div>
                </GlassPanel>

                <GlassPanel className="p-4">
                    <div className="text-3xl font-bold text-white">{summary.sessionCount}</div>
                    <div className="text-sm text-gray-400">Sessions</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {result.anomalies.filter(a => a.type === 'unusual_session').length} anomalous
                    </div>
                </GlassPanel>
            </div>

            {/* By Level */}
            <GlassPanel className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">By Log Level</h3>
                <div className="space-y-3">
                    <LevelBar level="ERROR" count={summary.byLevel.ERROR + (summary.byLevel.FATAL || 0)} total={summary.totalLines} color="bg-red-500" />
                    <LevelBar level="WARN" count={summary.byLevel.WARN} total={summary.totalLines} color="bg-yellow-500" />
                    <LevelBar level="INFO" count={summary.byLevel.INFO} total={summary.totalLines} color="bg-blue-500" />
                    <LevelBar level="DEBUG" count={summary.byLevel.DEBUG + (summary.byLevel.TRACE || 0)} total={summary.totalLines} color="bg-gray-500" />
                </div>
            </GlassPanel>

            {/* Top Errors */}
            <GlassPanel className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Top Errors</h3>
                    <button
                        onClick={onViewErrors}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        View All →
                    </button>
                </div>

                {topErrors.length > 0 ? (
                    <div className="space-y-3">
                        {topErrors.map((fp, i) => (
                            <div key={fp.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <span className="text-lg font-bold text-gray-500">{i + 1}.</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white truncate">{fp.template}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {fp.count.toLocaleString()} occurrences • {fp.affectedSessionCount} sessions
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs ${fp.level === 'ERROR' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {fp.level}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        No errors detected
                    </div>
                )}
            </GlassPanel>

            {/* Anomalies */}
            {anomalies.length > 0 && (
                <GlassPanel className="p-6 border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-bold text-white">Anomalies Detected: {anomalies.length}</h3>
                    </div>

                    <div className="space-y-2">
                        {anomalies.slice(0, 3).map(anomaly => (
                            <div key={anomaly.id} className={`flex items-center gap-3 p-3 rounded-lg ${anomaly.severity === 'HIGH' ? 'bg-red-500/10 border border-red-500/30' :
                                    anomaly.severity === 'MEDIUM' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                        'bg-blue-500/10 border border-blue-500/30'
                                }`}>
                                <span className={`text-lg ${anomaly.severity === 'HIGH' ? 'text-red-400' :
                                        anomaly.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-blue-400'
                                    }`}>⚠</span>
                                <div className="flex-1">
                                    <div className="text-sm text-white">{anomaly.description}</div>
                                    <div className="text-xs text-gray-500">{anomaly.details}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs ${anomaly.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                        anomaly.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {anomaly.severity}
                                </span>
                            </div>
                        ))}
                    </div>
                </GlassPanel>
            )}
        </div>
    );
};

export default OverviewTab;
