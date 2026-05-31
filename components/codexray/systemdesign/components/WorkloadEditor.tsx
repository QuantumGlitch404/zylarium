
import React, { useState } from 'react';
import { Workload, Component } from '../types';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';

interface WorkloadEditorProps {
    workloads: Workload[];
    components: Component[];
    onUpdateWorkloads: (workloads: Workload[]) => void;
}

export const WorkloadEditor: React.FC<WorkloadEditorProps> = ({
    workloads,
    components,
    onUpdateWorkloads
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Workload>>({});

    const handleAdd = () => {
        const newWorkload: Workload = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Workload',
            sourceComponentId: components[0]?.id || '',
            rps: 100,
            payloadSizeBytes: 1024,
            pattern: 'constant',
            enabled: true
        };
        onUpdateWorkloads([...workloads, newWorkload]);
        setEditingId(newWorkload.id);
        setEditForm(newWorkload);
    };

    const handleSave = () => {
        if (!editingId) return;
        const updated = workloads.map(w => w.id === editingId ? { ...w, ...editForm } as Workload : w);
        onUpdateWorkloads(updated);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        onUpdateWorkloads(workloads.filter(w => w.id !== id));
    };

    return (
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase">Workloads</h3>
                <button onClick={handleAdd} className="p-1 hover:bg-gray-800 rounded text-indigo-400">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
                {workloads.map(w => (
                    <div key={w.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                        {editingId === w.id ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                    placeholder="Name"
                                />
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Source</label>
                                    <select
                                        value={editForm.sourceComponentId}
                                        onChange={e => setEditForm({ ...editForm, sourceComponentId: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                    >
                                        {components.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">RPS</label>
                                        <input
                                            type="number"
                                            value={editForm.rps}
                                            onChange={e => setEditForm({ ...editForm, rps: parseInt(e.target.value) })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Payload (B)</label>
                                        <input
                                            type="number"
                                            value={editForm.payloadSizeBytes}
                                            onChange={e => setEditForm({ ...editForm, payloadSizeBytes: parseInt(e.target.value) })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setEditingId(null)} className="p-1 bg-gray-700 hover:bg-gray-600 rounded">
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button onClick={handleSave} className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded">
                                        <Check className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-white">{w.name}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingId(w.id); setEditForm(w); }} className="hover:text-indigo-400 p-1">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDelete(w.id)} className="hover:text-red-400 p-1">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    Source: {components.find(c => c.id === w.sourceComponentId)?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-indigo-400 mt-1">
                                    {w.rps} RPS • {w.pattern}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
