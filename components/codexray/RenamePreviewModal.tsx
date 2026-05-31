import React from 'react';
import { X, Save, Copy, AlertTriangle } from 'lucide-react';
import { RenameDiff } from '../../utils/searchEngineMain';

interface RenamePreviewModalProps {
    diff: RenameDiff;
    oldName: string;
    newName: string;
    onClose: () => void;
}

export const RenamePreviewModal: React.FC<RenamePreviewModalProps> = ({ diff, oldName, newName, onClose }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[90vh] bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Rename Simulation</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded">{oldName}</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded">{newName}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 p-6 bg-black/20 border-b border-white/5">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="text-xs text-gray-400 uppercase font-bold">Files Affected</div>
                        <div className="text-2xl font-bold text-white mt-1">{diff.filesAffected}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="text-xs text-gray-400 uppercase font-bold">Total Changes</div>
                        <div className="text-2xl font-bold text-white mt-1">{diff.totalChanges}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="text-xs text-gray-400 uppercase font-bold">Additions</div>
                        <div className="text-2xl font-bold text-green-400 mt-1">+{diff.totalChanges} lines</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="text-xs text-gray-400 uppercase font-bold">Deletions</div>
                        <div className="text-2xl font-bold text-red-400 mt-1">-{diff.totalChanges} lines</div>
                    </div>
                </div>

                {/* Diff Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                    {diff.changes.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            No occurrences found to rename.
                        </div>
                    ) : (
                        diff.changes.map((change, idx) => (
                            <div key={idx} className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-mono text-gray-400">{change.filePath}</span>
                                    <span className="text-xs text-gray-600">Line {change.line}</span>
                                </div>
                                <div className="p-0 text-xs font-mono">
                                    <div className="flex bg-red-900/10">
                                        <div className="w-8 text-right pr-3 py-1 text-red-700 select-none border-r border-red-500/10">-</div>
                                        <div className="flex-1 px-3 py-1 text-red-200 whitespace-pre">{change.originalContent}</div>
                                    </div>
                                    <div className="flex bg-green-900/10">
                                        <div className="w-8 text-right pr-3 py-1 text-green-700 select-none border-r border-green-500/10">+</div>
                                        <div className="flex-1 px-3 py-1 text-green-200 whitespace-pre">{change.newContent}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
                    <div className="mr-auto flex items-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 px-3 py-1.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Preview Mode. No files will be modified on disk.
                    </div>
                    <button
                        onClick={() => onClose()}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-primary-500 hover:bg-primary-400 rounded-lg transition-colors shadow-lg shadow-primary-500/20">
                        <Save className="w-4 h-4" />
                        Download Patch
                    </button>
                </div>
            </div>
        </div>
    );
};
