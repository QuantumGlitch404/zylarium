// Impact Tab - Size impact analysis
import React, { useMemo } from 'react';
import { TabProps } from '../types';
import { TrendingDown, Archive, Zap, FileX2 } from 'lucide-react';

export default function ImpactTab({ result }: TabProps) {
    const { summary, unreachableFiles } = result;

    // Calculate total project size (approximation from reachable + unreachable)
    const totalProjectSize = useMemo(() => {
        return result.allFiles.reduce((sum, f) => sum + f.fileSize, 0);
    }, [result.allFiles]);

    const afterCleanupSize = totalProjectSize - summary.totalRemovableSize;
    const savingsPercent = (summary.totalRemovableSize / totalProjectSize) * 100;

    // Category breakdown
    const categoryBreakdown = useMemo(() => {
        return summary.byType.map(t => ({
            type: t.type,
            count: t.count,
            rawSize: t.size,
            gzippedEstimate: t.gzippedEstimate,
            percentOfUnused: (t.size / summary.totalRemovableSize) * 100
        })).sort((a, b) => b.rawSize - a.rawSize);
    }, [summary]);

    // Top 10 largest unused files
    const topUnused = useMemo(() => {
        return [...unreachableFiles]
            .sort((a, b) => b.fileSize - a.fileSize)
            .slice(0, 10);
    }, [unreachableFiles]);

    // Bundle impact (only JS/CSS)
    const bundleFiles = useMemo(() => {
        return unreachableFiles.filter(f =>
            ['js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'less'].includes(f.fileType)
        );
    }, [unreachableFiles]);

    const jsDeadCode = bundleFiles.filter(f => ['js', 'jsx', 'ts', 'tsx'].includes(f.fileType));
    const cssDeadCode = bundleFiles.filter(f => ['css', 'scss', 'less'].includes(f.fileType));

    const jsSize = jsDeadCode.reduce((sum, f) => sum + f.fileSize, 0);
    const cssSize = cssDeadCode.reduce((sum, f) => sum + f.fileSize, 0);
    const jsGzip = Math.round(jsSize * 0.3);
    const cssGzip = Math.round(cssSize * 0.25);

    return (
        <div className="space-y-6">
            {/* Size Impact Visualization */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-orange-400" />
                    Size Impact
                </h3>

                <div className="space-y-6">
                    {/* Before/After Bars */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Current Project Size</span>
                                <span className="text-white font-medium">
                                    {(totalProjectSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                            <div className="h-8 bg-gray-800 rounded-lg overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg w-full" />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">After Cleanup</span>
                                <span className="text-green-400 font-medium">
                                    {(afterCleanupSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                            <div className="h-8 bg-gray-800 rounded-lg overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg"
                                    style={{ width: `${100 - savingsPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Savings Highlight */}
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-orange-300">Potential Savings</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-orange-400">
                                    {(summary.totalRemovableSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                                <span className="text-orange-300 text-sm ml-2">
                                    ({savingsPercent.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Archive className="w-5 h-5 text-purple-400" />
                    Category Breakdown
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-800">
                                <th className="text-left py-2 font-medium">Type</th>
                                <th className="text-right py-2 font-medium">Count</th>
                                <th className="text-right py-2 font-medium">Raw Size</th>
                                <th className="text-right py-2 font-medium">Gzip Est.</th>
                                <th className="text-right py-2 font-medium">% of Unused</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryBreakdown.map((row) => (
                                <tr key={row.type} className="border-b border-gray-800/50">
                                    <td className="py-2 text-white capitalize">{row.type}</td>
                                    <td className="py-2 text-right text-gray-400">{row.count}</td>
                                    <td className="py-2 text-right text-gray-400">
                                        {(row.rawSize / 1024).toFixed(0)} KB
                                    </td>
                                    <td className="py-2 text-right text-gray-400">
                                        {(row.gzippedEstimate / 1024).toFixed(0)} KB
                                    </td>
                                    <td className="py-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500"
                                                    style={{ width: `${row.percentOfUnused}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-400 w-12">
                                                {row.percentOfUnused.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bundle Impact */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Estimated Bundle Impact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1">Dead JavaScript</div>
                        <div className="text-xl font-bold text-yellow-400">
                            {(jsSize / 1024).toFixed(0)} KB
                        </div>
                        <div className="text-xs text-gray-500">
                            ~{(jsGzip / 1024).toFixed(0)} KB gzipped
                        </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1">Dead CSS</div>
                        <div className="text-xl font-bold text-blue-400">
                            {(cssSize / 1024).toFixed(0)} KB
                        </div>
                        <div className="text-xs text-gray-500">
                            ~{(cssGzip / 1024).toFixed(0)} KB gzipped
                        </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border border-green-500/30">
                        <div className="text-xs text-gray-500 mb-1">Total Bundle Reduction</div>
                        <div className="text-xl font-bold text-green-400">
                            ~{((jsGzip + cssGzip) / 1024).toFixed(0)} KB
                        </div>
                        <div className="text-xs text-gray-500">
                            gzipped estimate
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    Note: Images and other assets don't reduce bundle size directly but may reduce deployment/CDN costs.
                </p>
            </div>

            {/* Top 10 Largest Unused Files */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileX2 className="w-5 h-5 text-red-400" />
                    Top 10 Largest Unused Files
                </h3>

                <div className="space-y-2">
                    {topUnused.map((file, index) => (
                        <div
                            key={file.fileId}
                            className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                        >
                            <span className="text-gray-500 text-sm w-6">#{index + 1}</span>
                            <span className="flex-1 text-sm text-white font-mono truncate">
                                {file.filePath}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${file.safeDeleteScore >= 90 ? 'bg-green-500/20 text-green-400' :
                                    file.safeDeleteScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {file.safeDeleteScore}
                            </span>
                            <span className="text-sm font-medium text-orange-400 w-24 text-right">
                                {(file.fileSize / 1024).toFixed(0)} KB
                            </span>
                        </div>
                    ))}

                    {topUnused.length === 0 && (
                        <p className="text-center py-8 text-gray-500">No unreachable files found! 🎉</p>
                    )}
                </div>
            </div>
        </div>
    );
}
