
import React, { useState, useMemo } from 'react';
import { Endpoint } from './types';
import EndpointCard from './EndpointCard';
import { Search, Filter, Download } from 'lucide-react';

interface EndpointListProps {
    endpoints: Endpoint[];
    onViewCallSites: (id: string) => void;
}

export default function EndpointList({ endpoints, onViewCallSites }: EndpointListProps) {
    const [filterText, setFilterText] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [methodFilter, setMethodFilter] = useState<string>('ALL');

    const filteredEndpoints = useMemo(() => {
        return endpoints.filter(ep => {
            const matchesSearch = ep.urlPattern.toLowerCase().includes(filterText.toLowerCase());
            const matchesMethod = methodFilter === 'ALL' || ep.method === methodFilter;
            return matchesSearch && matchesMethod;
        });
    }, [endpoints, filterText, methodFilter]);

    return (
        <div className="h-full flex flex-col space-y-4">

            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Filter endpoints..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <select
                            value={methodFilter}
                            onChange={(e) => setMethodFilter(e.target.value)}
                            className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg text-sm text-white pl-4 pr-10 py-2 focus:outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors font-medium"
                        >
                            <option value="ALL" className="bg-[#1a1a1a]">All Methods</option>
                            <option value="GET" className="bg-[#1a1a1a]">GET</option>
                            <option value="POST" className="bg-[#1a1a1a]">POST</option>
                            <option value="PUT" className="bg-[#1a1a1a]">PUT</option>
                            <option value="DELETE" className="bg-[#1a1a1a]">DELETE</option>
                            <option value="PATCH" className="bg-[#1a1a1a]">PATCH</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                            <Filter className="w-3 h-3" />
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            const data = JSON.stringify(endpoints, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'endpoints_export.json';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="p-2 text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                        title="Download JSON"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {filteredEndpoints.length > 0 ? (
                    filteredEndpoints.map(ep => (
                        <EndpointCard
                            key={ep.id}
                            endpoint={ep}
                            isExpanded={expandedId === ep.id}
                            onToggle={() => setExpandedId(expandedId === ep.id ? null : ep.id)}
                            onViewCallSites={() => onViewCallSites(ep.id)}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-white/30 italic">
                        No endpoints found matching your filter.
                    </div>
                )}
            </div>
        </div>
    );
}
