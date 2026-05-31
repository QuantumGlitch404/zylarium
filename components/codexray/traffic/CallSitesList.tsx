
import React, { useState } from 'react';
import { CallSite } from './types';
import { ChevronRight, ChevronDown, FileText, Code } from 'lucide-react';

interface CallSitesListProps {
    callSites: CallSite[];
}

export default function CallSitesList({ callSites }: CallSitesListProps) {
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    // Group by file
    const groupedHelper = () => {
        const groups: Record<string, CallSite[]> = {};
        callSites.forEach(site => {
            if (!groups[site.filePath]) groups[site.filePath] = [];
            groups[site.filePath].push(site);
        });
        return groups;
    };

    const grouped = groupedHelper();
    const filePaths = Object.keys(grouped).sort();

    const toggleFile = (path: string) => {
        const next = new Set(expandedFiles);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        setExpandedFiles(next);
    };

    const toggleAll = () => {
        if (expandedFiles.size === filePaths.length) setExpandedFiles(new Set());
        else setExpandedFiles(new Set(filePaths));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-white font-medium flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-400" />
                    Detected Call Sites
                    <span className="text-white/40 text-sm font-normal">({callSites.length} across {filePaths.length} files)</span>
                </h3>
                <button onClick={toggleAll} className="text-xs text-indigo-300 hover:text-white transition-colors">
                    {expandedFiles.size === filePaths.length ? 'Collapse All' : 'Expand All'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {filePaths.map(path => {
                    const sites = grouped[path];
                    const isExpanded = expandedFiles.has(path);

                    return (
                        <div key={path} className="border border-white/10 rounded-xl bg-black/20 overflow-hidden">
                            {/* File Header */}
                            <div
                                onClick={() => toggleFile(path)}
                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors select-none"
                            >
                                <button className={`text-white/50 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-mono text-white/80 truncate leading-tight">
                                    {path}
                                </span>
                                <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded text-white/50">
                                    {sites.length}
                                </span>
                            </div>

                            {/* Snippets List */}
                            {isExpanded && (
                                <div className="border-t border-white/10 divide-y divide-white/5 bg-black/40">
                                    {sites.map(site => (
                                        <div key={site.id} className="p-4 hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 ${site.method === 'GET' ? 'text-emerald-400 bg-emerald-500/10' :
                                                            site.method === 'POST' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400'
                                                        }`}>
                                                        {site.method}
                                                    </span>
                                                    <code className="text-xs text-white/70 font-mono">{site.resolvedUrl || site.extractedUrl}</code>
                                                </div>
                                                <span className="text-xs text-white/30 font-mono">L{site.lineNumber}</span>
                                            </div>

                                            {/* Code Snippet */}
                                            <div className="relative font-mono text-xs bg-black/50 p-3 rounded-lg border border-white/5 overflow-x-auto">
                                                {/* Use a simple mapping for basic highlighting - in prod use Prism or Shiki */}
                                                <pre className="text-gray-300">
                                                    {site.context.map((line, i) => {
                                                        const actualLineNum = site.lineNumber - 2 + i;
                                                        const isMatchLine = actualLineNum === site.lineNumber;
                                                        return (
                                                            <div key={i} className={`${isMatchLine ? 'bg-indigo-500/20 -mx-3 px-3 text-white' : 'opacity-60'}`}>
                                                                <span className="inline-block w-8 text-right mr-3 text-white/20 select-none border-r border-white/10 pr-2">{actualLineNum}</span>
                                                                {line}
                                                            </div>
                                                        )
                                                    })}
                                                </pre>
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
}
