
import React from 'react';
import { X } from 'lucide-react';
import { SimConfig } from '../types';

interface SettingsPanelProps {
    config: SimConfig;
    onUpdateConfig: (config: SimConfig) => void;
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onUpdateConfig, onClose }) => {
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end">
            <div className="w-80 bg-white/10 backdrop-blur-3xl border-l border-white/20 h-full p-6 animate-in slide-in-from-right duration-200 shadow-2xl shadow-indigo-900/50">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-lg font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-indigo-300/60 uppercase mb-3">Canvas</h3>
                        <div className="space-y-3 bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/10">
                            <label className="flex items-center justify-between text-sm text-gray-300">
                                Snap to Grid
                                <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/10 checked:bg-indigo-500" />
                            </label>
                            <label className="flex items-center justify-between text-sm text-gray-300">
                                Show Grid
                                <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/10 checked:bg-indigo-500" />
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-indigo-300/60 uppercase mb-3">Simulation Defaults</h3>
                        <div className="space-y-3 bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/10">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Default Duration (s)</label>
                                <input
                                    type="number"
                                    value={config.duration}
                                    onChange={(e) => onUpdateConfig({ ...config, duration: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-400/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Queue Model</label>
                                <select className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-400/50 transition-all">
                                    <option>M/M/1 (Approximation)</option>
                                    <option>M/M/c (Multi-Server)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <button onClick={onClose} className="w-full bg-indigo-500/80 backdrop-blur-sm hover:bg-indigo-500 py-3 rounded-xl text-white font-medium transition-all shadow-lg shadow-indigo-500/20">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
