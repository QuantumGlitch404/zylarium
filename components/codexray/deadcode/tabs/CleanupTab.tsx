// Cleanup Tab - Selection and export functionality
import React, { useMemo, useState } from 'react';
import { TabProps, FileReachability, CleanupManifest } from '../types';
import {
    generateCleanupManifest,
    generateGitPatch,
    generateShellScript,
    generateFileList
} from '../engine/ReachabilityEngine';
import {
    Trash2, Download, FileJson, GitBranch, Terminal, Copy,
    CheckSquare, Square, AlertTriangle, Check, Sparkles
} from 'lucide-react';

interface CleanupTabProps extends TabProps {
    selectedFiles: Set<string>;
    onSelectionChange: (files: Set<string>) => void;
}

export default function CleanupTab({
    result,
    selectedFiles,
    onSelectionChange
}: CleanupTabProps) {
    const { unreachableFiles } = result;
    const [exportMessage, setExportMessage] = useState<string | null>(null);

    // Selection helpers
    const toggleFile = (fileId: string) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(fileId)) {
            newSet.delete(fileId);
        } else {
            newSet.add(fileId);
        }
        onSelectionChange(newSet);
    };

    const selectAll = () => {
        onSelectionChange(new Set(unreachableFiles.map(f => f.fileId)));
    };

    const selectHighConfidence = () => {
        onSelectionChange(new Set(
            unreachableFiles.filter(f => f.safeDeleteScore >= 95).map(f => f.fileId)
        ));
    };

    const selectByType = (type: string) => {
        onSelectionChange(new Set(
            unreachableFiles.filter(f => f.fileType === type).map(f => f.fileId)
        ));
    };

    const clearSelection = () => {
        onSelectionChange(new Set());
    };

    // Selected files data
    const selectedFilesList = useMemo(() => {
        return unreachableFiles.filter(f => selectedFiles.has(f.fileId));
    }, [unreachableFiles, selectedFiles]);

    const selectionStats = useMemo(() => {
        const files = selectedFilesList;
        return {
            count: files.length,
            size: files.reduce((sum, f) => sum + f.fileSize, 0),
            avgScore: files.length > 0
                ? Math.round(files.reduce((sum, f) => sum + f.safeDeleteScore, 0) / files.length)
                : 0,
            lowConfidence: files.filter(f => f.safeDeleteScore < 60).length
        };
    }, [selectedFilesList]);

    // Export functions
    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        setExportMessage(`Downloaded ${filename}`);
        setTimeout(() => setExportMessage(null), 3000);
    };

    const exportJSON = () => {
        const manifest = generateCleanupManifest(selectedFilesList, 'project');
        downloadFile(
            JSON.stringify(manifest, null, 2),
            'cleanup-manifest.json',
            'application/json'
        );
    };

    const exportGitPatch = () => {
        const patch = generateGitPatch(selectedFilesList);
        downloadFile(patch, 'cleanup.patch', 'text/plain');
    };

    const exportShellScript = () => {
        const script = generateShellScript(selectedFilesList);
        downloadFile(script, 'cleanup.sh', 'text/plain');
    };

    const copyFileList = async () => {
        const list = generateFileList(selectedFilesList);
        await navigator.clipboard.writeText(list);
        setExportMessage('File list copied to clipboard!');
        setTimeout(() => setExportMessage(null), 3000);
    };

    return (
        <div className="space-y-6">
            {/* Warning Banner */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-yellow-200 text-sm">
                        <strong>No files will be deleted automatically.</strong> This tool generates manifests
                        for you to review and execute manually.
                    </p>
                </div>
            </div>

            {/* Quick Select */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Select</h4>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={selectHighConfidence}
                        className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm hover:bg-green-500/30 transition-colors"
                    >
                        High Confidence (95+)
                    </button>
                    <button
                        onClick={() => selectByType('image')}
                        className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
                    >
                        All Images
                    </button>
                    <button
                        onClick={() => selectByType('css')}
                        className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm hover:bg-blue-500/30 transition-colors"
                    >
                        All CSS
                    </button>
                    <button
                        onClick={selectAll}
                        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 text-sm hover:bg-gray-600 transition-colors"
                    >
                        Select All
                    </button>
                    <button
                        onClick={clearSelection}
                        className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm hover:bg-gray-700 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* File Selection List */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">
                        Select Files to Export ({unreachableFiles.length} available)
                    </h4>
                    <span className="text-xs text-gray-500">
                        {selectedFiles.size} selected
                    </span>
                </div>

                <div className="max-h-80 overflow-auto">
                    {unreachableFiles.map((file) => {
                        const isSelected = selectedFiles.has(file.fileId);
                        const isLowConfidence = file.safeDeleteScore < 60;

                        return (
                            <label
                                key={file.fileId}
                                className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/50 last:border-0 ${isSelected ? 'bg-red-500/10' : ''
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleFile(file.fileId)}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-gray-600'
                                    }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>

                                <span className="flex-1 text-sm text-gray-300 font-mono truncate">
                                    {file.filePath}
                                </span>

                                {isLowConfidence && (
                                    <AlertTriangle className="w-4 h-4 text-yellow-400" title="Low confidence" />
                                )}

                                <span className={`text-xs font-medium ${file.safeDeleteScore >= 90 ? 'text-green-400' :
                                        file.safeDeleteScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                    {file.safeDeleteScore}
                                </span>

                                <span className="text-xs text-gray-500 w-16 text-right">
                                    {(file.fileSize / 1024).toFixed(0)} KB
                                </span>
                            </label>
                        );
                    })}

                    {unreachableFiles.length === 0 && (
                        <p className="text-center py-8 text-gray-500">No unreachable files found! 🎉</p>
                    )}
                </div>
            </div>

            {/* Selection Summary */}
            {selectedFiles.size > 0 && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Selection Summary</h4>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <span className="text-2xl font-bold text-white">{selectionStats.count}</span>
                            <span className="text-xs text-gray-500 block">Files</span>
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-orange-400">
                                {(selectionStats.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="text-xs text-gray-500 block">To Remove</span>
                        </div>
                        <div>
                            <span className={`text-2xl font-bold ${selectionStats.avgScore >= 90 ? 'text-green-400' :
                                    selectionStats.avgScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {selectionStats.avgScore}
                            </span>
                            <span className="text-xs text-gray-500 block">Avg Score</span>
                        </div>
                        <div>
                            {selectionStats.lowConfidence > 0 ? (
                                <>
                                    <span className="text-2xl font-bold text-yellow-400">
                                        {selectionStats.lowConfidence}
                                    </span>
                                    <span className="text-xs text-yellow-500 block">Low Confidence</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-2xl font-bold text-green-400">✓</span>
                                    <span className="text-xs text-green-500 block">All Safe</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Export Options */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-400" />
                    Export Options
                </h4>

                {exportMessage && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {exportMessage}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={exportJSON}
                        disabled={selectedFiles.size === 0}
                        className="flex flex-col items-center p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileJson className="w-8 h-8 text-blue-400 mb-2" />
                        <span className="text-sm text-white font-medium">JSON Manifest</span>
                        <span className="text-xs text-gray-500 mt-1">Full details</span>
                    </button>

                    <button
                        onClick={exportGitPatch}
                        disabled={selectedFiles.size === 0}
                        className="flex flex-col items-center p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GitBranch className="w-8 h-8 text-orange-400 mb-2" />
                        <span className="text-sm text-white font-medium">Git Patch</span>
                        <span className="text-xs text-gray-500 mt-1">git apply</span>
                    </button>

                    <button
                        onClick={exportShellScript}
                        disabled={selectedFiles.size === 0}
                        className="flex flex-col items-center p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Terminal className="w-8 h-8 text-green-400 mb-2" />
                        <span className="text-sm text-white font-medium">Shell Script</span>
                        <span className="text-xs text-gray-500 mt-1">rm commands</span>
                    </button>

                    <button
                        onClick={copyFileList}
                        disabled={selectedFiles.size === 0}
                        className="flex flex-col items-center p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Copy className="w-8 h-8 text-purple-400 mb-2" />
                        <span className="text-sm text-white font-medium">Copy List</span>
                        <span className="text-xs text-gray-500 mt-1">To clipboard</span>
                    </button>
                </div>
            </div>

            {/* Simulated Preview (if selection exists) */}
            {selectedFiles.size > 0 && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        Simulated Project After Cleanup
                    </h4>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                            <div className="text-3xl font-bold text-white">
                                {result.summary.totalFiles}
                            </div>
                            <div className="text-sm text-gray-500">Files Before</div>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                            <div className="text-3xl font-bold text-green-400">
                                {result.summary.totalFiles - selectedFiles.size}
                            </div>
                            <div className="text-sm text-green-500">Files After</div>
                        </div>
                    </div>

                    {selectionStats.lowConfidence > 0 && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm">
                            ⚠️ {selectionStats.lowConfidence} file(s) have low confidence scores.
                            Review manually before deleting.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
