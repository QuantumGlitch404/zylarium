// File Upload Section - Drag & drop and file list

import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploadSectionProps {
    files: UploadedFile[];
    onFilesChange: (files: File[]) => void;
    onClearFiles: () => void;
    onAnalyze: () => void;
    isAnalyzing: boolean;
}

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
    files,
    onFilesChange,
    onClearFiles,
    onAnalyze,
    isAnalyzing,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
            f.name.endsWith('.log') ||
            f.name.endsWith('.txt') ||
            f.name.endsWith('.jsonl') ||
            f.name.endsWith('.json') ||
            f.name.endsWith('.csv')
        );

        if (droppedFiles.length > 0) {
            onFilesChange(droppedFiles);
        }
    }, [onFilesChange]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            onFilesChange(Array.from(selectedFiles));
        }
    };

    const totalLines = files.reduce((sum, f) => sum + f.lineCount, 0);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return (
        <GlassPanel className="p-6">
            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/20 hover:border-indigo-500/50 hover:bg-white/5'
                    }`}
            >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-indigo-400' : 'text-gray-500'}`} />
                <p className="text-gray-300 mb-2">
                    Drop log files here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                    Supports: .log, .txt, .jsonl, .json, .csv
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".log,.txt,.jsonl,.json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-300">UPLOADED FILES</h4>
                        <button
                            onClick={onClearFiles}
                            className="text-xs text-gray-500 hover:text-white"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-auto">
                        {files.map(file => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                            >
                                {file.status === 'parsed' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                                {file.status === 'pending' && <File className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                {file.status === 'parsing' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />}
                                {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}

                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white truncate">{file.name}</div>
                                    {file.error && (
                                        <div className="text-xs text-red-400">{file.error}</div>
                                    )}
                                </div>

                                <div className="text-xs text-gray-500 text-right">
                                    <div>{formatBytes(file.size)}</div>
                                    {file.lineCount > 0 && <div>{file.lineCount.toLocaleString()} lines</div>}
                                </div>

                                <span className={`px-2 py-0.5 rounded text-xs ${file.format === 'jsonl' ? 'bg-green-500/20 text-green-400' :
                                        file.format === 'json' ? 'bg-blue-500/20 text-blue-400' :
                                            file.format === 'csv' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {file.format.toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-400">
                        Total: {totalLines.toLocaleString()} lines across {files.length} file(s) ({formatBytes(totalSize)})
                    </div>
                </div>
            )}

            {/* Analyze button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={onAnalyze}
                    disabled={files.length === 0 || isAnalyzing}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Upload className="w-5 h-5" />
                            Analyze Logs
                        </>
                    )}
                </button>
            </div>
        </GlassPanel>
    );
};

export default FileUploadSection;
