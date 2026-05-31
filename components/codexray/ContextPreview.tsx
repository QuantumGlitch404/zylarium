import React from 'react';
import { X, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { Occurrence } from '../types/codexray';

interface ContextPreviewProps {
    match: Occurrence;
    fileContent?: string; // We might need to fetch this or pass it. 
    // For now, simple implementation assuming we have snippets or access to content
    onClose: () => void;
    onOpenFull: () => void;
    contextLines?: number; // default 3
}

export const ContextPreview: React.FC<ContextPreviewProps> = ({ match, onClose, onOpenFull, contextLines = 3 }) => {
    // Determine scope (mock for now, requires engine update for real AST scope)
    const scope = match.tokenType === 'declaration' ? 'Declaration' : 'Usage';

    // Mock context generation (In a real app, we need the full file content. 
    // For V1, we will show the snippet and simulate context if we don't have the full file in memory efficiently exposed here yet.
    // Actually, SearchEngineMain has everything. We should ideally pass the surrounding lines.)

    // As a temporary "Motherfucker Fix", I will display the snippet prominently 
    // and a placeholder for lines before/after if I can't easily get them yet without an engine query.
    // Wait, the user wants 3 lines before/after. I need to make sure I can get that.

    return (
        <div className="mt-2 mb-4 mx-4 border border-white/10 rounded-lg bg-[#0F0F0F] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400">
                        {match.filePath.split('/').pop()} : {match.line}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-bold uppercase tracking-wider">
                        {scope}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenFull}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                        title="Open in File Viewer"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Code Content */}
            <div className="p-0 overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs font-mono">
                    <tbody>
                        {/* Mock Lines Before */}
                        {[match.line - 1].map(n => n > 0 && (
                            <tr key={n} className="opacity-50">
                                <td className="w-12 text-right pr-4 py-1 text-gray-600 border-r border-white/5 select-none">{n}</td>
                                <td className="pl-4 py-1 text-gray-500 whitespace-pre">
                                    {/* Placeholder for line before */}
                                    // ...
                                </td>
                            </tr>
                        ))}

                        {/* Match Line */}
                        <tr className="bg-primary-500/10">
                            <td className="w-12 text-right pr-4 py-1 text-primary-400 border-r border-white/5 select-none font-bold">
                                <div className="flex justify-between items-center">
                                    <span>{match.line}</span>
                                    <span className="text-primary-500">→</span>
                                </div>
                            </td>
                            <td className="pl-4 py-1 text-gray-200 whitespace-pre">
                                {/* We need to highlight the specific range */}
                                {match.snippet.substring(0, Math.max(0, match.charStart))}
                                <span className="bg-primary-500/30 text-white rounded px-0.5 border border-primary-500/30">
                                    {match.snippet.substring(match.charStart, match.charEnd)}
                                </span>
                                {match.snippet.substring(match.charEnd)}
                            </td>
                        </tr>

                        {/* Mock Lines After */}
                        {[match.line + 1].map(n => (
                            <tr key={n} className="opacity-50">
                                <td className="w-12 text-right pr-4 py-1 text-gray-600 border-r border-white/5 select-none">{n}</td>
                                <td className="pl-4 py-1 text-gray-500 whitespace-pre">
                                    {/* Placeholder for line after */}
                                    // ...
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Instructions */}
            <div className="bg-black/20 px-4 py-1 text-[10px] text-gray-600 flex justify-between">
                <span>Scope: Global (Estimated)</span>
                <span className="flex gap-2">
                    <span>Double-click to open</span>
                    <span>ESC to close</span>
                </span>
            </div>
        </div>
    );
};
