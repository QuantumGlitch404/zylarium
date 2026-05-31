// Quick Stats Sidebar - Summary and actions

import React from 'react';
import { Download, FileText, AlertTriangle, Users, Filter } from 'lucide-react';
import { AnalysisResult, NoisePattern } from '../types';
import { interpretHealthScore } from '../engine/HealthScorer';
import { formatDuration } from '../engine/SessionReconstructor';

interface QuickStatsSidebarProps {
    result: AnalysisResult;
    noisePatterns: NoisePattern[];
    onExportReport: () => void;
    onExportErrors: () => void;
    onExportSessions: () => void;
    onDownloadFiltered: () => void;
    onEditNoisePatterns: () => void;
}

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

export const QuickStatsSidebar: React.FC<QuickStatsSidebarProps> = ({
    result,
    noisePatterns,
    onExportReport,
    onExportErrors,
    onExportSessions,
    onDownloadFiltered,
    onEditNoisePatterns,
}) => {
    const { healthScore, summary, entries } = result;
    const interpretation = interpretHealthScore(healthScore.overall);

    const activePatterns = noisePatterns.filter(p => p.isActive);
    const filteredCount = entries.filter(e => e.isNoise).length;

    return (
        <GlassPanel className="w-72 p-4 space-y-4 h-fit sticky top-4">
            {/* Health Score */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Log Health</h4>
                <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold ${healthScore.overall >= 70 ? 'text-green-400' :
                            healthScore.overall >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                        {healthScore.overall}
                    </div>
                    <div className="flex-1">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${healthScore.overall >= 70 ? 'bg-green-500' :
                                        healthScore.overall >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${healthScore.overall}%` }}
                            />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{interpretation.label}</div>
                    </div>
                </div>
            </div>

            {/* Files */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Files</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Total files:</span>
                        <span className="text-white">{result.files.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Total lines:</span>
                        <span className="text-white">{summary.totalLines.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Parsing */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Parsing</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Parsed:</span>
                        <span className="text-green-400">{((summary.parsedLines / summary.totalLines) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Failed:</span>
                        <span className="text-red-400">{((summary.failedLines / summary.totalLines) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">With timestamp:</span>
                        <span className="text-white">{healthScore.components.timestampCoverage.toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* Time Range */}
            {summary.timeRange && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Time Range</h4>
                    <div className="space-y-1 text-sm">
                        <div className="text-gray-400">From: <span className="text-white">{summary.timeRange.start.toLocaleString()}</span></div>
                        <div className="text-gray-400">To: <span className="text-white">{summary.timeRange.end.toLocaleString()}</span></div>
                        <div className="text-gray-400">Duration: <span className="text-white">{formatDuration(summary.duration)}</span></div>
                    </div>
                </div>
            )}

            {/* By Level */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">By Level</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-red-400">ERROR:</span>
                        <span className="text-white">{(summary.byLevel.ERROR + (summary.byLevel.FATAL || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-yellow-400">WARN:</span>
                        <span className="text-white">{summary.byLevel.WARN.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-blue-400">INFO:</span>
                        <span className="text-white">{summary.byLevel.INFO.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">DEBUG:</span>
                        <span className="text-white">{(summary.byLevel.DEBUG + (summary.byLevel.TRACE || 0)).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Patterns */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Patterns</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Unique errors:</span>
                        <span className="text-white">{summary.uniqueErrors}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Sessions:</span>
                        <span className="text-white">{summary.sessionCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Anomalies:</span>
                        <span className="text-yellow-400">{summary.anomalyCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Noise filtered:</span>
                        <span className="text-white">{((filteredCount / summary.totalLines) * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-white/10">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h4>
                <div className="space-y-2">
                    <button onClick={onExportReport} className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-sm text-indigo-300 hover:bg-indigo-500/30">
                        <Download className="w-4 h-4" /> Export Full Report
                    </button>
                    <button onClick={onExportErrors} className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/20">
                        <AlertTriangle className="w-4 h-4" /> Export Errors Only
                    </button>
                    <button onClick={onExportSessions} className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/20">
                        <Users className="w-4 h-4" /> Export Sessions
                    </button>
                    <button onClick={onDownloadFiltered} className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/20">
                        <FileText className="w-4 h-4" /> Download Filtered
                    </button>
                </div>
            </div>

            {/* Noise Patterns */}
            <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Noise Patterns</h4>
                    <button onClick={onEditNoisePatterns} className="text-xs text-indigo-400 hover:text-indigo-300">
                        Edit
                    </button>
                </div>
                <div className="text-sm text-gray-400">
                    Currently filtering:
                </div>
                <div className="mt-2 space-y-1">
                    {activePatterns.slice(0, 3).map(p => (
                        <div key={p.id} className="text-xs text-gray-500">• {p.description}</div>
                    ))}
                    {activePatterns.length > 3 && (
                        <div className="text-xs text-gray-600">+{activePatterns.length - 3} more</div>
                    )}
                </div>
            </div>
        </GlassPanel>
    );
};

export default QuickStatsSidebar;
