
import React from 'react';
import { AnalysisStats } from './types';
import { AlertTriangle, Download, FileText, Globe, Code, Shield } from 'lucide-react';

interface InternalAnalysisSummaryProps {
    stats: AnalysisStats;
    onExport: (type: 'openapi' | 'json' | 'csv' | 'markdown') => void;
}

export default function InternalAnalysisSummary({ stats, onExport }: InternalAnalysisSummaryProps) {
    return (
        <div className="w-80 border-l border-white/10 bg-black/20 flex flex-col h-full overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Analysis Report</h3>
                <p className="text-xs text-white/40">Generated from source code</p>
            </div>

            {/* Key Metrics */}
            <div className="p-6 space-y-6 border-b border-white/10">

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-xs text-white/40 mb-1">Endpoints</div>
                        <div className="text-2xl font-bold text-white">{stats.uniqueEndpoints}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-xs text-white/40 mb-1">Call Sites</div>
                        <div className="text-2xl font-bold text-white">{stats.apiCallsFound}</div>
                    </div>
                </div>

                {/* Methods Distribution */}
                <div>
                    <h4 className="text-xs font-bold text-white/60 mb-3 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Method Distribution
                    </h4>
                    <div className="space-y-2">
                        {Object.entries(stats.endpointsByMethod).map(([method, count]) => {
                            if (count === 0) return null;
                            const percentage = Math.round((count / stats.uniqueEndpoints) * 100);
                            const color =
                                method === 'GET' ? 'bg-emerald-500' :
                                    method === 'POST' ? 'bg-blue-500' :
                                        method === 'DELETE' ? 'bg-red-500' : 'bg-gray-500';

                            return (
                                <div key={method} className="space-y-1">
                                    <div className="flex justify-between text-xs text-white/70">
                                        <span>{method}</span>
                                        <span>{count} ({percentage}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Auth Stats */}
                <div>
                    <h4 className="text-xs font-bold text-white/60 mb-3 flex items-center gap-2">
                        <Shield className="w-3 h-3" /> Security
                    </h4>
                    <div className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg mb-2">
                        <span className="text-white/70">Auth Required</span>
                        <span className="font-mono text-amber-400 font-bold">{stats.authRequiredCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg">
                        <span className="text-white/70">Public / Open</span>
                        <span className="font-mono text-emerald-400 font-bold">{stats.publicCount}</span>
                    </div>
                </div>
            </div>

            {/* Warnings (Mock for now or real if implemented) */}
            {(stats.withErrorHandlingCount < stats.uniqueEndpoints) && (
                <div className="p-6 border-b border-white/10 bg-amber-500/5">
                    <h4 className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" /> Insights & Warnings
                    </h4>
                    <ul className="space-y-2 text-xs text-amber-200/80">
                        <li className="flex gap-2">
                            <span className="text-amber-500">•</span>
                            {stats.uniqueEndpoints - stats.withErrorHandlingCount} endpoints lack explicit error handling.
                        </li>
                        {/* Add more insights here */}
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="p-6 mt-auto">
                <h4 className="text-xs font-bold text-white/60 mb-3 flex items-center gap-2">
                    <Download className="w-3 h-3" /> Export Data
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onExport('openapi')} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white transition-colors flex flex-col items-center gap-1 text-center">
                        <Code className="w-4 h-4 text-indigo-400" />
                        OpenAPI
                    </button>
                    <button onClick={() => onExport('markdown')} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white transition-colors flex flex-col items-center gap-1 text-center">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        Docs
                    </button>
                </div>
            </div>
        </div>
    );
}
