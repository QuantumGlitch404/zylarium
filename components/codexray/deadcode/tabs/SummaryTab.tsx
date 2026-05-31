// Summary Tab - Overview statistics with Liquid Glass UI
import React from 'react';
import { TabProps } from '../types';
import { BarChart3, AlertTriangle, TrendingDown, FileX2, Layers } from 'lucide-react';

// Liquid Glass Panel
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

export default function SummaryTab({ result }: TabProps) {
    const { summary, warnings } = result;

    const reachablePercent = (summary.reachableFiles / summary.totalFiles) * 100;
    const unreachablePercent = (summary.unreachableFiles / summary.totalFiles) * 100;

    return (
        <div className="space-y-6">
            {/* Reachability Overview */}
            <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" />
                    Reachability Overview
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div>
                        <div className="text-2xl font-bold text-white">{summary.totalFiles.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Total Files</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-400">{summary.reachableFiles.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Reachable ({reachablePercent.toFixed(1)}%)</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-400">{summary.unreachableFiles.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Unreachable ({unreachablePercent.toFixed(1)}%)</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-blue-400">{summary.entryPointsUsed}</div>
                        <div className="text-xs text-gray-500">Entry Points</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-400">{summary.importEdges.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Import Edges</div>
                    </div>
                </div>

                {/* Visual Bars */}
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-400">Reachable</span>
                            <span className="text-gray-500">{reachablePercent.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all" style={{ width: `${reachablePercent}%` }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-red-400">Unreachable</span>
                            <span className="text-gray-500">{unreachablePercent.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all" style={{ width: `${unreachablePercent}%` }} />
                        </div>
                    </div>
                </div>
            </GlassPanel>

            {/* Potential Savings */}
            <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-orange-400" />
                    Potential Savings
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                        <div className="text-2xl font-bold text-orange-400">{(summary.deadCodeSize / 1024 / 1024).toFixed(2)} MB</div>
                        <div className="text-xs text-gray-500">Dead Code</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                        <div className="text-2xl font-bold text-orange-400">{(summary.unusedAssetsSize / 1024 / 1024).toFixed(2)} MB</div>
                        <div className="text-xs text-gray-500">Unused Assets</div>
                    </div>
                    <div className="bg-orange-500/10 backdrop-blur-sm p-4 rounded-xl border border-orange-500/30">
                        <div className="text-2xl font-bold text-orange-300">{(summary.totalRemovableSize / 1024 / 1024).toFixed(2)} MB</div>
                        <div className="text-xs text-gray-500">Total Removable</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                        <div className="text-2xl font-bold text-green-400">~{(summary.estimatedBundleSavings / 1024).toFixed(0)} KB</div>
                        <div className="text-xs text-gray-500">Est. Bundle Savings (gzip)</div>
                    </div>
                </div>
            </GlassPanel>

            {/* Breakdown by Type */}
            <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileX2 className="w-5 h-5 text-red-400" />
                    Unreachable by Type
                </h3>

                {summary.byType.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No unreachable files found! 🎉</p>
                ) : (
                    <div className="space-y-3">
                        {summary.byType.map((typeData) => (
                            <div key={typeData.type} className="flex items-center gap-4">
                                <div className="w-32 text-sm text-gray-400 capitalize">{typeData.type}</div>
                                <div className="flex-1">
                                    <div className="h-6 bg-white/10 rounded overflow-hidden">
                                        <div
                                            className="h-full bg-red-500/50 rounded flex items-center px-2"
                                            style={{ width: `${Math.max(10, (typeData.size / summary.totalRemovableSize) * 100)}%`, minWidth: '60px' }}
                                        >
                                            <span className="text-xs text-white font-medium">{typeData.count} files</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-24 text-right text-sm text-gray-400">{(typeData.size / 1024).toFixed(0)} KB</div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassPanel>

            {/* Warnings */}
            {(warnings.dynamicImports.length > 0 || warnings.configReferences.length > 0 || warnings.testOnly.length > 0) && (
                <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-yellow-300 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Warnings
                    </h3>

                    <div className="space-y-2 text-sm">
                        {warnings.dynamicImports.length > 0 && (
                            <div className="flex items-center gap-2 text-yellow-200">
                                <span>•</span>
                                <span>{warnings.dynamicImports.length} files have dynamic import patterns (review manually)</span>
                            </div>
                        )}
                        {warnings.configReferences.length > 0 && (
                            <div className="flex items-center gap-2 text-yellow-200">
                                <span>•</span>
                                <span>{warnings.configReferences.length} files referenced only in build config</span>
                            </div>
                        )}
                        {warnings.testOnly.length > 0 && (
                            <div className="flex items-center gap-2 text-yellow-200">
                                <span>•</span>
                                <span>{warnings.testOnly.length} files used only by tests</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
