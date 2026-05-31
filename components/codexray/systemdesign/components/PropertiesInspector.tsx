
import React from 'react';
import { Component, Connection, SystemDesign } from '../types';
import { Trash2, Copy, Settings } from 'lucide-react';

interface PropertiesInspectorProps {
    design: SystemDesign;
    selectedId: string | null;
    selectionType: 'component' | 'connection' | null;
    onUpdateComponent: (id: string, updates: Partial<Component>) => void;
    onUpdateConnection: (id: string, updates: Partial<Connection>) => void;
    onDelete: (id: string, type: 'component' | 'connection') => void;
}

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = ({
    design,
    selectedId,
    selectionType,
    onUpdateComponent,
    onUpdateConnection,
    onDelete
}) => {
    if (!selectedId) {
        return (
            <div className="p-4 overflow-y-auto">
                <h3 className="text-2xl font-signature text-gray-300 mb-4 text-center">Design Overview</h3>

                <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-lg shadow-black/20">
                        <div className="text-sm text-gray-400 mb-1">Total Stats</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-2xl font-bold text-white">{design.components.length}</div>
                                <div className="text-xs text-gray-500">Components</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{design.connections.length}</div>
                                <div className="text-xs text-gray-500">Connections</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-lg shadow-black/20">
                        <h4 className="text-xs font-semibold text-gray-300 mb-2">Workloads</h4>
                        {design.workloads.length === 0 ? (
                            <div className="text-xs text-gray-500 italic">No workloads defined</div>
                        ) : (
                            <ul className="space-y-2">
                                {design.workloads.map(w => (
                                    <li key={w.id} className="text-xs text-gray-400 flex justify-between">
                                        <span>{w.name}</span>
                                        <span className="text-indigo-400">{w.rps} RPS</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (selectionType === 'component') {
        const component = design.components.find(c => c.id === selectedId);
        if (!component) return null;

        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-white/20 bg-white/10 backdrop-blur-2xl flex justify-between items-center shadow-md">
                    <h3 className="text-xl font-signature text-white tracking-wide">Component Properties</h3>
                    <button
                        onClick={() => onDelete(selectedId, 'component')}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* General */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">General</label>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={component.name}
                                    onChange={(e) => onUpdateComponent(selectedId, { name: e.target.value })}
                                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/80 focus:ring-2 focus:ring-indigo-500/40 transition-all focus:outline-none shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Description</label>
                                <textarea
                                    value={component.description}
                                    onChange={(e) => onUpdateComponent(selectedId, { description: e.target.value })}
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30 transition-all focus:outline-none focus:border-indigo-500 h-16 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Capacity */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Capacity</label>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Max Throughput (RPS)</label>
                                <input
                                    type="number"
                                    value={component.properties.maxRPS}
                                    onChange={(e) => onUpdateComponent(selectedId, { properties: { ...component.properties, maxRPS: parseInt(e.target.value) } })}
                                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/80 focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Concurrency Limit</label>
                                <input
                                    type="number"
                                    value={component.properties.concurrencyLimit}
                                    onChange={(e) => onUpdateComponent(selectedId, { properties: { ...component.properties, concurrencyLimit: parseInt(e.target.value) } })}
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Avg Processing (ms)</label>
                                <input
                                    type="number"
                                    value={component.properties.avgProcessingMs}
                                    onChange={(e) => onUpdateComponent(selectedId, { properties: { ...component.properties, avgProcessingMs: parseInt(e.target.value) } })}
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scaling */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Scaling</label>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Replicas</label>
                                <input
                                    type="number"
                                    value={component.properties.replicas}
                                    min={1}
                                    onChange={(e) => onUpdateComponent(selectedId, { properties: { ...component.properties, replicas: parseInt(e.target.value) } })}
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/50 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={component.properties.autoScale}
                                    onChange={(e) => onUpdateComponent(selectedId, { properties: { ...component.properties, autoScale: e.target.checked } })}
                                    className="bg-gray-800 border-gray-700 rounded"
                                />
                                <label className="text-sm text-gray-300">Enable Auto-scale</label>
                            </div>
                        </div>
                    </div>

                    {/* Type Specific */}
                    {component.type.includes('database') && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Database</label>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Replication Factor</label>
                                    <input
                                        type="number"
                                        value={component.properties.replicationFactor || 1}
                                        onChange={(e) => onUpdateComponent(selectedId, { properties: { ...component.properties, replicationFactor: parseInt(e.target.value) } })}
                                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (selectionType === 'connection') {
        const connection = design.connections.find(c => c.id === selectedId);
        if (!connection) return null;

        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-white/20 bg-white/10 backdrop-blur-2xl flex justify-between items-center shadow-md">
                    <h3 className="text-xl font-signature text-white tracking-wide">Connection Properties</h3>
                    <button
                        onClick={() => onDelete(selectedId, 'connection')}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Performance</label>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Network Latency (ms)</label>
                                <input
                                    type="number"
                                    value={connection.properties.latencyMs}
                                    onChange={(e) => onUpdateConnection(selectedId, { properties: { ...connection.properties, latencyMs: parseInt(e.target.value) } })}
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Bandwidth Limit (MB/s)</label>
                                <input
                                    type="number"
                                    value={connection.properties.bandwidthLimitMBps}
                                    onChange={(e) => onUpdateConnection(selectedId, { properties: { ...connection.properties, bandwidthLimitMBps: parseInt(e.target.value) } })}
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Visual</label>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Style</label>
                                <select
                                    value={connection.visual.lineStyle}
                                    onChange={(e) => onUpdateConnection(selectedId, { visual: { ...connection.visual, lineStyle: e.target.value as any } })}
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-400/50 transition-all"
                                >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
