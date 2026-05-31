// Export Tab - Select components and export in various formats

import React, { useState, useMemo } from 'react';
import { Download, Copy, Check, FileCode, Package, ChevronDown } from 'lucide-react';
import { DetectedComponent, ExportConfig, ExportFormat, CSSStrategy, DEFAULT_EXPORT_CONFIG, AnalysisResult } from '../types';
import { exportComponent, exportAllComponents } from '../engine/ExportGenerator';

interface ExportTabProps {
    result: AnalysisResult;
    selectedComponents: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
}

// Liquid Glass Panel
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string }[] = [
    { value: 'html', label: 'Plain HTML/CSS', desc: 'Framework-neutral' },
    { value: 'react', label: 'React', desc: 'JSX + CSS Modules' },
    { value: 'vue', label: 'Vue', desc: 'Single File Components' },
    { value: 'svelte', label: 'Svelte', desc: '.svelte files' },
    { value: 'angular', label: 'Angular', desc: 'Component + Template' },
    { value: 'webcomponent', label: 'Web Components', desc: 'Custom Elements' },
];

const CSS_STRATEGIES: { value: CSSStrategy; label: string }[] = [
    { value: 'bem', label: 'Scoped classes (BEM-style)' },
    { value: 'css-modules', label: 'CSS Modules' },
    { value: 'tailwind', label: 'Tailwind utility classes' },
    { value: 'styled-components', label: 'Styled-components template' },
];

export const ExportTab: React.FC<ExportTabProps> = ({
    result,
    selectedComponents,
    onSelectionChange,
}) => {
    const [config, setConfig] = useState<ExportConfig>(DEFAULT_EXPORT_CONFIG);
    const [copied, setCopied] = useState(false);
    const [previewComponent, setPreviewComponent] = useState<DetectedComponent | null>(
        result.components[0] || null
    );

    // Selection helpers
    const selectAll = () => {
        onSelectionChange(new Set(result.components.map(c => c.id)));
    };

    const selectRepeated = () => {
        onSelectionChange(new Set(result.components.filter(c => c.type === 'repeated').map(c => c.id)));
    };

    const selectLayout = () => {
        onSelectionChange(new Set(result.components.filter(c => c.type === 'layout').map(c => c.id)));
    };

    const clearSelection = () => {
        onSelectionChange(new Set());
    };

    const toggleComponent = (id: string) => {
        const newSelection = new Set(selectedComponents);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        onSelectionChange(newSelection);
    };

    // Generate preview
    const preview = useMemo(() => {
        if (!previewComponent) return { html: '// Select a component to preview', css: '' };
        return exportComponent(previewComponent, config);
    }, [previewComponent, config]);

    // Download handlers
    const downloadAll = () => {
        const selected = result.components.filter(c => selectedComponents.has(c.id));
        const exported = exportAllComponents(selected, config);

        // Create and download a text file with all components
        const content = exported.map(e =>
            `// ${e.name}\n\n${e.html}\n\n${e.css ? `/* CSS */\n${e.css}` : ''}`
        ).join('\n\n---\n\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `components-${config.format}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        const selected = result.components.filter(c => selectedComponents.has(c.id));
        const exported = exportAllComponents(selected, config);

        const content = exported.map(e => e.html).join('\n\n');
        navigator.clipboard.writeText(content);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex gap-4 h-full">
            {/* Left Panel - Selection & Options */}
            <div className="w-1/3 flex flex-col gap-4">
                {/* Component Selection */}
                <GlassPanel className="p-4">
                    <h3 className="font-semibold text-white mb-3">Select Components to Export</h3>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <button onClick={selectAll} className="px-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors">
                            Select All
                        </button>
                        <button onClick={selectRepeated} className="px-3 py-1.5 text-xs bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors">
                            Select Repeated
                        </button>
                        <button onClick={selectLayout} className="px-3 py-1.5 text-xs bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors">
                            Select Layout
                        </button>
                        <button onClick={clearSelection} className="px-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors">
                            Clear
                        </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-auto">
                        {result.components.map(component => (
                            <label key={component.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedComponents.has(component.id)}
                                    onChange={() => toggleComponent(component.id)}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm text-gray-300">{component.name}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                    ({component.metrics.instanceCount} instances)
                                </span>
                            </label>
                        ))}
                    </div>
                </GlassPanel>

                {/* Export Format */}
                <GlassPanel className="p-4">
                    <h3 className="font-semibold text-white mb-3">Export Format</h3>

                    <div className="space-y-2">
                        {FORMAT_OPTIONS.map(option => (
                            <label key={option.value} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${config.format === option.value
                                    ? 'bg-indigo-500/20 border-indigo-500/50'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}>
                                <input
                                    type="radio"
                                    checked={config.format === option.value}
                                    onChange={() => setConfig({ ...config, format: option.value })}
                                    className="mt-1"
                                />
                                <div>
                                    <span className="text-sm font-medium text-white">{option.label}</span>
                                    <span className="text-xs text-gray-500 ml-2">({option.desc})</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </GlassPanel>

                {/* Export Options */}
                <GlassPanel className="p-4">
                    <h3 className="font-semibold text-white mb-3">Export Options</h3>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.includeStyles}
                                onChange={(e) => setConfig({ ...config, includeStyles: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-300">Include CSS styles</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.generatePropTypes}
                                onChange={(e) => setConfig({ ...config, generatePropTypes: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-300">Generate prop types</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.addPlaceholderComments}
                                onChange={(e) => setConfig({ ...config, addPlaceholderComments: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-300">Add placeholder comments</span>
                        </label>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                        <label className="text-sm text-gray-400 mb-2 block">CSS Strategy</label>
                        <select
                            value={config.cssStrategy}
                            onChange={(e) => setConfig({ ...config, cssStrategy: e.target.value as CSSStrategy })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {CSS_STRATEGIES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </GlassPanel>
            </div>

            {/* Right Panel - Preview & Download */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Preview Component Selector */}
                <GlassPanel className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">Preview</h3>
                        <select
                            value={previewComponent?.id || ''}
                            onChange={(e) => setPreviewComponent(result.components.find(c => c.id === e.target.value) || null)}
                            className="bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {result.components.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </GlassPanel>

                {/* Code Preview */}
                <GlassPanel className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto p-4">
                        <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                            <code>{preview.html}</code>
                        </pre>

                        {preview.css && (
                            <>
                                <hr className="border-white/10 my-4" />
                                <pre className="text-sm font-mono text-gray-400 whitespace-pre-wrap">
                                    <code>{preview.css}</code>
                                </pre>
                            </>
                        )}
                    </div>
                </GlassPanel>

                {/* Download Actions */}
                <GlassPanel className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                            {selectedComponents.size} component(s) selected
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={downloadAll}
                                disabled={selectedComponents.size === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Download All
                            </button>

                            <button
                                onClick={copyToClipboard}
                                disabled={selectedComponents.size === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy to Clipboard'}
                            </button>
                        </div>
                    </div>
                </GlassPanel>
            </div>
        </div>
    );
};

export default ExportTab;
