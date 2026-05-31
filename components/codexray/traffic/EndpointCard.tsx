
import React from 'react';
import { Endpoint, HttpMethod } from './types';
import { Lock, Globe, ChevronDown, ChevronRight, Activity } from 'lucide-react';

interface EndpointCardProps {
    endpoint: Endpoint;
    isExpanded: boolean;
    onToggle: () => void;
    onViewCallSites: () => void;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    POST: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PUT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    DELETE: 'bg-red-500/20 text-red-300 border-red-500/30',
    PATCH: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    OPTIONS: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    HEAD: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    CONNECT: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    TRACE: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export default function EndpointCard({ endpoint, isExpanded, onToggle, onViewCallSites }: EndpointCardProps) {
    return (
        <div className={`group rounded-xl border transition-all duration-200 ${isExpanded ? 'bg-white/5 border-white/20 shadow-lg' : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10'}`}>

            {/* Card Header (Always Visible) */}
            <div
                onClick={onToggle}
                className="flex items-center gap-4 p-4 cursor-pointer select-none"
            >
                <div className={`p-1 rounded-full text-white/50 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-4 h-4" />
                </div>

                {/* Method Badge */}
                <div className={`px-2.5 py-1 rounded-md border text-xs font-bold font-mono ${METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET}`}>
                    {endpoint.method}
                </div>

                {/* URL Pattern */}
                <div className="flex-1 font-mono text-sm text-white/90 truncate">
                    <span className="opacity-50">/</span>
                    {endpoint.urlPattern.replace(/^\//, '')}
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-white/50" title="Number of call sites">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{endpoint.callSites.length}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${endpoint.authRequired ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                        {endpoint.authRequired ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        <span>{endpoint.authRequired ? 'Auth' : 'Public'}</span>
                    </div>
                </div>
            </div>

            {/* Expanded Details Panel */}
            {isExpanded && (
                <div className="border-t border-white/10 p-4 bg-black/20 rounded-b-xl animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Grid Layout for Details */}
                    <div className="grid grid-cols-2 gap-6">

                        {/* Left Col: Info */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs uppercase tracking-wider text-white/40 mb-2 font-semibold">Base URL</h4>
                                <code className="block p-3 rounded-lg bg-black/40 border border-white/5 text-xs font-mono text-white/80 break-all">
                                    {endpoint.fullUrl || 'Dynamic / Unknown'}
                                </code>
                            </div>

                            {endpoint.headers.length > 0 && (
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-white/40 mb-2 font-semibold">Headers</h4>
                                    <div className="space-y-1">
                                        {endpoint.headers.map((h, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-black/20 border border-white/5">
                                                <span className="font-mono text-indigo-300">{h.name}</span>
                                                <span className="font-mono text-white/60">{h.value || '{dynamic}'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Col: Schema */}
                        <div>
                            <h4 className="text-xs uppercase tracking-wider text-white/40 mb-2 font-semibold">Inferred Payload</h4>
                            {endpoint.requestSchema ? (
                                <pre className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs font-mono text-blue-300 overflow-auto max-h-40 custom-scrollbar">
                                    {JSON.stringify(endpoint.requestSchema, null, 2)}
                                </pre>
                            ) : (
                                <div className="p-3 rounded-lg border border-white/5 border-dashed text-xs text-white/30 italic text-center">
                                    No payload detected (GET request or simple body)
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Call Sites Link */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                        <button onClick={onViewCallSites} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            View {endpoint.callSites.length} Call Sites <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
