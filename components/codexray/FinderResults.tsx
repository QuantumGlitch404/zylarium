import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Copy, ExternalLink, Code2, Clock, Check } from 'lucide-react';
import { Occurrence, SearchResult } from '../types/codexray';
import { ContextPreview } from './ContextPreview';

interface FileGroup {
    fileId: string;
    filePath: string;
    matches: Occurrence[];
}

interface FinderResultsProps {
    results: SearchResult;
    onSelectMatch: (match: Occurrence) => void;
    onOpenFile: (fileId: string, line: number) => void;
    query?: string;
}

const SearchIllustration = () => (
    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
            <Code2 className="w-8 h-8 text-gray-500" />
        </div>
    </div>
);

export const FinderResults: React.FC<FinderResultsProps> = ({ results, onSelectMatch, onOpenFile, query }) => {
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    // Toggle expand/collapse for a file group
    const toggleFile = (fileId: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(fileId)) {
            newExpanded.delete(fileId);
        } else {
            newExpanded.add(fileId);
        }
        setExpandedFiles(newExpanded);
    };

    // Helper to render inline code snippet with highlighting
    const renderSnippet = (snippet: string, charStart: number, charEnd: number) => {
        // Simple manual slice for visual verification - in production use proper syntax highlighter
        const before = snippet.slice(0, Math.max(0, charStart));
        const match = snippet.slice(Math.max(0, charStart), charEnd);
        const after = snippet.slice(charEnd);

        return (
            <code className="text-xs font-mono text-gray-400 whitespace-pre overflow-hidden text-ellipsis block">
                {before}
                <span className="bg-yellow-500/30 text-yellow-200 rounded px-0.5 border border-yellow-500/20">{match}</span>
                {after}
            </code>
        );
    };

    if (results.matches.length === 0) {
        // Differentiate between "Not searched yet" and "No results found"
        if (!query || query.trim() === '') {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <Code2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-300">Project Indexed</h3>
                    <p className="mt-2 text-sm text-center max-w-xs">
                        {results.totalFiles} files are ready to search. <br />
                        Type a symbol or function name above.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                <SearchIllustration />
                <p className="mt-4 text-sm">No matches found for <span className="text-gray-300">"{query}"</span></p>
                <p className="text-xs text-gray-600 mt-1">Try changing your search options or scope</p>
            </div>
        );
    }

    // Group results by file
    const groupedResults = results.matches.reduce((acc, match) => {
        if (!acc[match.fileId]) {
            acc[match.fileId] = {
                fileId: match.fileId,
                filePath: match.filePath,
                matches: []
            };
        }
        acc[match.fileId].matches.push(match);
        return acc;
    }, {} as Record<string, FileGroup>);

    const fileGroups = Object.values(groupedResults);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
            {/* Header Stats */}
            <div className="px-4 py-2 border-b border-white/5 bg-white/5 backdrop-blur-sm flex justify-between items-center text-xs text-gray-400">
                <span>Found <strong className="text-white">{results.matches.length}</strong> matches in <strong className="text-white">{fileGroups.length}</strong> files</span>
                <span>{results.durationMs}ms</span>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {fileGroups.map((group) => {
                    const isExpanded = expandedFiles.has(group.fileId);
                    return (
                        <div key={group.fileId} className="rounded-lg border border-white/5 bg-white/5 overflow-hidden transition-all duration-200 hover:border-white/10">
                            {/* File Header */}
                            <div
                                onClick={() => toggleFile(group.fileId)}
                                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/5 select-none"
                            >
                                {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs text-gray-300 font-medium truncate flex-1 block" title={group.filePath}>
                                    {group.filePath}
                                </span>
                                <span className="bg-white/10 text-gray-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                                    {group.matches.length}
                                </span>
                            </div>

                            {/* Matches Body */}
                            {isExpanded && (
                                <div className="border-t border-white/5 bg-black/20">
                                    {group.matches.map((match, idx) => (
                                        <div
                                            key={`${match.fileId}-${match.line}-${idx}`}
                                            onClick={() => onSelectMatch(match)}
                                            onDoubleClick={() => onOpenFile(match.fileId, match.line)}
                                            className="group flex gap-3 px-3 py-1.5 cursor-pointer hover:bg-primary-500/10 border-l-2 border-transparent hover:border-primary-500 transition-colors"
                                        >
                                            <span className="text-[10px] font-mono text-gray-600 w-8 text-right shrink-0 pt-0.5 select-none">
                                                {match.line}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                {renderSnippet(match.snippet, match.charStart, match.charEnd)}
                                            </div>
                                            {/* Quick Actions on Hover */}
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                                <button
                                                    title="Copy Snippet"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(match.snippet);
                                                        // toast or subtle feedback?
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white active:scale-95"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                                <button
                                                    title="Copy File Path"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(match.filePath);
                                                        // onOpenFile(match.fileId, match.line); 
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white active:scale-95"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
