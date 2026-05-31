
import React from 'react';
import { SimulationResults, Bottleneck, SimConfig } from '../types';
import { Play, Pause, Square, RefreshCcw, Activity, AlertTriangle } from 'lucide-react';

interface SimulationControlsProps {
    isRunning: boolean;
    config: SimConfig;
    results: SimulationResults | null;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
    onConfigChange: (config: SimConfig) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
    isRunning,
    config,
    results,
    onStart,
    onPause,
    onReset,
    onConfigChange
}) => {
    return (
        <div className="bg-transparent border-t border-white/10 p-4">
            <div className={`flex items-center justify-between ${results && results.bottlenecks.length > 0 ? 'mb-4' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/10 backdrop-blur-2xl rounded-xl p-1 border border-white/20 shadow-lg">
                        {!isRunning ? (
                            <button onClick={onStart} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/80 backdrop-blur-sm hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
                                <Play className="w-3 h-3 fill-current" /> Run
                            </button>
                        ) : (
                            <button onClick={onPause} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/80 backdrop-blur-sm hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-yellow-500/20">
                                <Pause className="w-3 h-3 fill-current" /> Pause
                            </button>
                        )}
                        <button onClick={onReset} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg ml-1 transition-all">
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-700" />

                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <label>Load:</label>
                        <select
                            value={config.loadMultiplier}
                            onChange={(e) => onConfigChange({ ...config, loadMultiplier: parseFloat(e.target.value) })}
                            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:border-indigo-400/80 shadow-inner"
                        >
                            <option value="0.5">0.5x</option>
                            <option value="1">1x</option>
                            <option value="2">2x</option>
                            <option value="5">5x</option>
                            <option value="10">10x (Stress)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <label>Duration:</label>
                        <select
                            value={config.duration}
                            onChange={(e) => onConfigChange({ ...config, duration: parseInt(e.target.value) })}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-indigo-400/50 transition-all"
                        >
                            <option value="30">30s</option>
                            <option value="60">60s</option>
                            <option value="300">5 mins</option>
                        </select>
                    </div>
                </div>

                {results && (
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase">Latency (P99)</div>
                            <div className={`font-mono font-bold ${results.summary.latency.p99 > 500 ? 'text-red-400' : 'text-green-400'}`}>
                                {Math.round(results.summary.latency.p99)}ms
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase">Success Rate</div>
                            <div className={`font-mono font-bold ${results.summary.successRate < 0.99 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {(results.summary.successRate * 100).toFixed(1)}%
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase">Bottlenecks</div>
                            <div className={`font-mono font-bold ${results.bottlenecks.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {results.bottlenecks.length}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results / Bottlenecks Panel */}
            {results && results.bottlenecks.length > 0 && (
                <div className="bg-red-500/10 backdrop-blur-2xl border border-red-500/30 rounded-xl p-4 shadow-xl shadow-red-900/20">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-2 uppercase">
                        <AlertTriangle className="w-4 h-4" /> Detected Bottlenecks
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {results.bottlenecks.map((b, i) => (
                            <div key={i} className="flex-shrink-0 bg-white/10 backdrop-blur-xl border border-red-500/40 rounded-xl p-3 w-64 shadow-md">
                                <div className="text-xs font-bold text-white mb-1">{b.componentName}</div>
                                <div className="text-[10px] text-gray-400 mb-1">{b.description}</div>
                                <div className="text-[10px] text-indigo-400">{b.recommendation}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
