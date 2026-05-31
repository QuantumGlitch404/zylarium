// Settings Panel - Analysis and export settings

import React from 'react';
import { X, Settings, RefreshCw } from 'lucide-react';
import { AnalysisSettings, DEFAULT_SETTINGS } from '../types';

interface SettingsPanelProps {
    settings: AnalysisSettings;
    onUpdate: (settings: AnalysisSettings) => void;
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    settings,
    onUpdate,
    onClose,
}) => {
    const resetToDefaults = () => {
        onUpdate(DEFAULT_SETTINGS);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                            <Settings className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Analysis Settings</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-6">
                    {/* Detection Settings */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Detection</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">
                                    Minimum instances for pattern
                                </label>
                                <select
                                    value={settings.minInstancesForPattern}
                                    onChange={(e) => onUpdate({ ...settings, minInstancesForPattern: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="2">2 (Default)</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-2">
                                    Similarity threshold: {Math.round(settings.similarityThreshold * 100)}%
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.similarityThreshold * 100}
                                    onChange={(e) => onUpdate({ ...settings, similarityThreshold: parseInt(e.target.value) / 100 })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>50% (Loose)</span>
                                    <span>100% (Strict)</span>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.includeSingleInstanceLayouts}
                                    onChange={(e) => onUpdate({ ...settings, includeSingleInstanceLayouts: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <div>
                                    <span className="text-sm text-white">Include single-instance layouts</span>
                                    <p className="text-xs text-gray-500">Detect navbar, footer, etc. even if they appear once</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.detectNestedComponents}
                                    onChange={(e) => onUpdate({ ...settings, detectNestedComponents: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <div>
                                    <span className="text-sm text-white">Detect nested components</span>
                                    <p className="text-xs text-gray-500">Find components inside other components</p>
                                </div>
                            </label>
                        </div>
                    </section>

                    {/* Analysis Settings */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Analysis</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.parseEmbeddedCSS}
                                    onChange={(e) => onUpdate({ ...settings, parseEmbeddedCSS: e.target.checked })}
                                />
                                <span className="text-sm text-gray-300">Parse embedded CSS</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.parseInlineStyles}
                                    onChange={(e) => onUpdate({ ...settings, parseInlineStyles: e.target.checked })}
                                />
                                <span className="text-sm text-gray-300">Parse inline styles</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.analyzeClassCoUsage}
                                    onChange={(e) => onUpdate({ ...settings, analyzeClassCoUsage: e.target.checked })}
                                />
                                <span className="text-sm text-gray-300">Analyze class co-usage</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.detectLayoutPatterns}
                                    onChange={(e) => onUpdate({ ...settings, detectLayoutPatterns: e.target.checked })}
                                />
                                <span className="text-sm text-gray-300">Detect layout patterns</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.detectAntiPatterns}
                                    onChange={(e) => onUpdate({ ...settings, detectAntiPatterns: e.target.checked })}
                                />
                                <span className="text-sm text-gray-300">Detect anti-patterns</span>
                            </label>
                        </div>
                    </section>

                    {/* Naming Settings */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Naming</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Naming style</label>
                                <select
                                    value={settings.namingStyle}
                                    onChange={(e) => onUpdate({ ...settings, namingStyle: e.target.value as any })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="PascalCase">PascalCase</option>
                                    <option value="camelCase">camelCase</option>
                                    <option value="kebab-case">kebab-case</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.useClassNamesAsHints}
                                    onChange={(e) => onUpdate({ ...settings, useClassNamesAsHints: e.target.checked })}
                                />
                                <span className="text-sm text-gray-300">Use class names as hints</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={settings.semanticElementNames}
                                    onChange={(e) => onUpdate({ ...settings, semanticElementNames: e.target.checked })}
                                />
                                <span className="text-sm text-gray-300">Semantic element names</span>
                            </label>
                        </div>
                    </section>

                    {/* Display Settings */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Display</h3>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">
                                Max nesting depth: {settings.maxNestingDepth}
                            </label>
                            <input
                                type="range"
                                min="4"
                                max="20"
                                value={settings.maxNestingDepth}
                                onChange={(e) => onUpdate({ ...settings, maxNestingDepth: parseInt(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>4</span>
                                <span>20</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-between">
                    <button
                        onClick={resetToDefaults}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset to Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
