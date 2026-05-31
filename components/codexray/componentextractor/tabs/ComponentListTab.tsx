// Component List Tab - Grouped list of detected components

import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, Layers, Box, Star, ChevronDown, ChevronUp, Eye, Code, Download } from 'lucide-react';
import { DetectedComponent, AntiPattern, AnalysisResult } from '../types';

interface ComponentListTabProps {
    result: AnalysisResult;
    selectedComponent: DetectedComponent | null;
    onSelectComponent: (component: DetectedComponent | null) => void;
    onExportComponent: (component: DetectedComponent) => void;
}

// Liquid Glass Panel
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

type SortBy = 'frequency' | 'name' | 'size' | 'score';

const ComponentCard: React.FC<{
    component: DetectedComponent;
    isSelected: boolean;
    onSelect: () => void;
    onExport: () => void;
}> = ({ component, isSelected, onSelect, onExport }) => {
    const typeColors = {
        repeated: { icon: '🔄', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
        layout: { icon: '📐', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
        unique: { icon: '✨', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    };

    const colors = typeColors[component.type];

    return (
        <div
            className={`p-4 rounded-xl border transition-all cursor-pointer ${colors.bg} ${colors.border} ${isSelected ? 'ring-2 ring-white/30' : 'hover:ring-1 hover:ring-white/20'
                }`}
            onClick={onSelect}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{colors.icon}</span>
                    <h4 className="font-bold text-white">{component.name}</h4>
                </div>
                {component.type === 'repeated' && (
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-400">
                        {component.metrics.instanceCount}x
                    </span>
                )}
            </div>

            <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-4">
                    <span>Instances: <strong className="text-white">{component.metrics.instanceCount}</strong></span>
                    <span>Variants: <strong className="text-white">{component.metrics.variantCount}</strong></span>
                </div>

                {/* Stability Score Bar */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span>Stability</span>
                        <span className={component.metrics.stabilityScore >= 80 ? 'text-green-400' : component.metrics.stabilityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                            {component.metrics.stabilityScore}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${component.metrics.stabilityScore >= 80 ? 'bg-green-500' :
                                    component.metrics.stabilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${component.metrics.stabilityScore}%` }}
                        />
                    </div>
                </div>

                {/* Classes */}
                {component.cssClasses.length > 0 && (
                    <div className="text-xs text-gray-500">
                        Classes: {component.cssClasses.slice(0, 3).join(', ')}
                        {component.cssClasses.length > 3 && ` +${component.cssClasses.length - 3}`}
                    </div>
                )}

                {/* Nested components */}
                {component.containedComponents.length > 0 && (
                    <div className="text-xs text-indigo-400">
                        Contains: {component.containedComponents.length} nested component(s)
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                <button className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors text-gray-300">
                    <Eye className="w-3 h-3" /> Preview
                </button>
                <button className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors text-gray-300">
                    <Code className="w-3 h-3" /> Code
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onExport(); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-500/20 border border-indigo-500/30 rounded hover:bg-indigo-500/30 transition-colors text-indigo-300"
                >
                    <Download className="w-3 h-3" /> Export
                </button>
            </div>
        </div>
    );
};

const WarningCard: React.FC<{ antiPattern: AntiPattern }> = ({ antiPattern }) => (
    <div className={`p-4 rounded-xl border ${antiPattern.severity === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
        <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${antiPattern.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                }`} />
            <div className="flex-1">
                <h4 className="font-medium text-white mb-1">
                    {antiPattern.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </h4>
                <p className="text-sm text-gray-400 mb-2">{antiPattern.description}</p>
                <p className="text-xs text-gray-500">
                    <strong className={antiPattern.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}>
                        Suggestion:
                    </strong> {antiPattern.suggestion}
                </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${antiPattern.severity === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                {antiPattern.affectedElements} affected
            </span>
        </div>
    </div>
);

export const ComponentListTab: React.FC<ComponentListTabProps> = ({
    result,
    selectedComponent,
    onSelectComponent,
    onExportComponent,
}) => {
    const [sortBy, setSortBy] = useState<SortBy>('frequency');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['repeated', 'layout', 'unique', 'warnings']));

    // Group components by type
    const repeatedComponents = result.components.filter(c => c.type === 'repeated');
    const layoutComponents = result.components.filter(c => c.type === 'layout');
    const uniqueComponents = result.components.filter(c => c.type === 'unique');

    // Sort components
    const sortComponents = (components: DetectedComponent[]) => {
        return [...components].sort((a, b) => {
            switch (sortBy) {
                case 'frequency': return b.metrics.instanceCount - a.metrics.instanceCount;
                case 'name': return a.name.localeCompare(b.name);
                case 'size': return b.metrics.averageSize - a.metrics.averageSize;
                case 'score': return b.metrics.stabilityScore - a.metrics.stabilityScore;
                default: return 0;
            }
        });
    };

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const totalInstances = result.components.reduce((sum, c) => sum + c.metrics.instanceCount, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <GlassPanel className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">Detected Components</h3>
                        <p className="text-sm text-gray-400">
                            Found {result.components.length} unique components with {totalInstances} total instances
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Sort by:</span>
                        {(['frequency', 'name', 'size', 'score'] as SortBy[]).map(option => (
                            <button
                                key={option}
                                onClick={() => setSortBy(option)}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${sortBy === option
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassPanel>

            {/* Repeated Patterns Section */}
            {repeatedComponents.length > 0 && (
                <GlassPanel className="overflow-hidden">
                    <button
                        onClick={() => toggleSection('repeated')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-blue-400" />
                            <span className="font-semibold text-white">Repeated Patterns</span>
                            <span className="text-sm text-gray-500">
                                ({repeatedComponents.length} types, {repeatedComponents.reduce((s, c) => s + c.metrics.instanceCount, 0)} instances)
                            </span>
                        </div>
                        {expandedSections.has('repeated') ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {expandedSections.has('repeated') && (
                        <div className="p-4 pt-0 grid gap-4 md:grid-cols-2">
                            {sortComponents(repeatedComponents).map(component => (
                                <ComponentCard
                                    key={component.id}
                                    component={component}
                                    isSelected={selectedComponent?.id === component.id}
                                    onSelect={() => onSelectComponent(component)}
                                    onExport={() => onExportComponent(component)}
                                />
                            ))}
                        </div>
                    )}
                </GlassPanel>
            )}

            {/* Layout Components Section */}
            {layoutComponents.length > 0 && (
                <GlassPanel className="overflow-hidden">
                    <button
                        onClick={() => toggleSection('layout')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-green-400" />
                            <span className="font-semibold text-white">Layout Components</span>
                            <span className="text-sm text-gray-500">({layoutComponents.length} types)</span>
                        </div>
                        {expandedSections.has('layout') ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {expandedSections.has('layout') && (
                        <div className="p-4 pt-0 grid gap-4 md:grid-cols-2">
                            {sortComponents(layoutComponents).map(component => (
                                <ComponentCard
                                    key={component.id}
                                    component={component}
                                    isSelected={selectedComponent?.id === component.id}
                                    onSelect={() => onSelectComponent(component)}
                                    onExport={() => onExportComponent(component)}
                                />
                            ))}
                        </div>
                    )}
                </GlassPanel>
            )}

            {/* Unique Sections */}
            {uniqueComponents.length > 0 && (
                <GlassPanel className="overflow-hidden">
                    <button
                        onClick={() => toggleSection('unique')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-purple-400" />
                            <span className="font-semibold text-white">Unique Sections</span>
                            <span className="text-sm text-gray-500">({uniqueComponents.length})</span>
                        </div>
                        {expandedSections.has('unique') ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {expandedSections.has('unique') && (
                        <div className="p-4 pt-0 grid gap-4 md:grid-cols-2">
                            {sortComponents(uniqueComponents).map(component => (
                                <ComponentCard
                                    key={component.id}
                                    component={component}
                                    isSelected={selectedComponent?.id === component.id}
                                    onSelect={() => onSelectComponent(component)}
                                    onExport={() => onExportComponent(component)}
                                />
                            ))}
                        </div>
                    )}
                </GlassPanel>
            )}

            {/* Warnings Section */}
            {result.antiPatterns.length > 0 && (
                <GlassPanel className="overflow-hidden">
                    <button
                        onClick={() => toggleSection('warnings')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <span className="font-semibold text-white">Warnings</span>
                            <span className="text-sm text-gray-500">({result.antiPatterns.length} issues)</span>
                        </div>
                        {expandedSections.has('warnings') ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {expandedSections.has('warnings') && (
                        <div className="p-4 pt-0 space-y-3">
                            {result.antiPatterns.map((pattern, i) => (
                                <WarningCard key={i} antiPattern={pattern} />
                            ))}
                        </div>
                    )}
                </GlassPanel>
            )}
        </div>
    );
};

export default ComponentListTab;
