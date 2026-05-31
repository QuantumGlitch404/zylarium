// Component Details Panel - Right sidebar with component information

import React from 'react';
import { X, Edit3, Merge, Split, Download, Box, Layers, Star } from 'lucide-react';
import { DetectedComponent, ExportConfig, DEFAULT_EXPORT_CONFIG } from '../types';
import { exportComponent } from '../engine/ExportGenerator';

interface ComponentDetailsPanelProps {
    component: DetectedComponent | null;
    onClose: () => void;
    onExport: (component: DetectedComponent) => void;
}

// Liquid Glass Panel
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

const ScoreBar: React.FC<{ score: number; label: string; description: string }> = ({ score, label, description }) => {
    const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className={`font-medium text-${color}-400`}>{score}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all bg-${color}-500`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    );
};

export const ComponentDetailsPanel: React.FC<ComponentDetailsPanelProps> = ({
    component,
    onClose,
    onExport,
}) => {
    if (!component) return null;

    const typeIcons = {
        repeated: <Box className="w-5 h-5 text-blue-400" />,
        layout: <Layers className="w-5 h-5 text-green-400" />,
        unique: <Star className="w-5 h-5 text-purple-400" />,
    };

    const typeLabels = {
        repeated: 'Repeated Pattern',
        layout: 'Layout Component',
        unique: 'Unique Section',
    };

    return (
        <GlassPanel className="w-80 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-white">Component Details</h3>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* Name & Type */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {typeIcons[component.type]}
                        <h4 className="text-lg font-bold text-white">{component.name}</h4>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${component.type === 'repeated' ? 'bg-blue-500/20 text-blue-400' :
                            component.type === 'layout' ? 'bg-green-500/20 text-green-400' :
                                'bg-purple-500/20 text-purple-400'
                        }`}>
                        {typeLabels[component.type]}
                    </span>
                </div>

                {/* Metrics */}
                <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Metrics</h5>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-lg">
                            <div className="text-xl font-bold text-white">{component.metrics.instanceCount}</div>
                            <div className="text-xs text-gray-500">Instances</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                            <div className="text-xl font-bold text-white">{component.metrics.variantCount}</div>
                            <div className="text-xs text-gray-500">Variants</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                            <div className="text-xl font-bold text-white">{Math.round(component.metrics.averageSize)}</div>
                            <div className="text-xs text-gray-500">Avg. Bytes</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                            <div className="text-xl font-bold text-white">{component.metrics.nestingDepth}</div>
                            <div className="text-xs text-gray-500">Nesting Depth</div>
                        </div>
                    </div>
                </div>

                {/* Scores */}
                <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Scores</h5>
                    <div className="space-y-4">
                        <ScoreBar
                            score={component.metrics.stabilityScore}
                            label="Stability"
                            description="Consistent structure across uses"
                        />
                        <ScoreBar
                            score={component.metrics.refactorReadinessScore}
                            label="Refactor Readiness"
                            description="Clean separation, few deps"
                        />
                    </div>

                    {/* Stability Factors */}
                    {component.metrics.stabilityFactors.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {component.metrics.stabilityFactors.slice(0, 3).map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className={f.impact >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {f.impact >= 0 ? '✓' : '⚠'}
                                    </span>
                                    <span className="text-gray-400">{f.description}</span>
                                    <span className={`ml-auto ${f.impact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {f.impact > 0 ? '+' : ''}{f.impact}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Structure */}
                <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Structure</h5>
                    <div className="bg-white/5 p-3 rounded-lg font-mono text-xs text-gray-400 space-y-1">
                        <div className="text-indigo-400">{component.structure.tag}.{component.structure.classes.join('.')}</div>
                        {component.structure.children.slice(0, 5).map((child, i) => (
                            <div key={i} className="pl-3 border-l border-white/10">
                                {child.tag}
                                {child.classes.length > 0 && `.${child.classes[0]}`}
                            </div>
                        ))}
                        {component.structure.children.length > 5 && (
                            <div className="pl-3 text-gray-600">... +{component.structure.children.length - 5} more</div>
                        )}
                    </div>
                </div>

                {/* Nested Components */}
                {component.containedComponents.length > 0 && (
                    <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nested Components</h5>
                        <div className="space-y-1">
                            {component.containedComponents.map((id, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-indigo-400">
                                    <Box className="w-3 h-3" />
                                    {id}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Variants */}
                {component.variants.length > 1 && (
                    <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Variants</h5>
                        <div className="space-y-2">
                            {component.variants.map((variant, i) => (
                                <div key={i} className="bg-white/5 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-white">{variant.name}</div>
                                    <div className="text-xs text-gray-500">{variant.instanceCount} instances</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CSS Classes */}
                <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">CSS Classes Used</h5>
                    <div className="flex flex-wrap gap-1">
                        {component.cssClasses.slice(0, 10).map((cls, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400 font-mono">
                                .{cls}
                            </span>
                        ))}
                        {component.cssClasses.length > 10 && (
                            <span className="px-2 py-0.5 text-xs text-gray-500">
                                +{component.cssClasses.length - 10} more
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10 space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/20 transition-colors">
                    <Edit3 className="w-4 h-4" />
                    Edit Boundary
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/20 transition-colors">
                    <Merge className="w-4 h-4" />
                    Merge with...
                </button>
                <button
                    onClick={() => onExport(component)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-sm text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export This
                </button>
            </div>
        </GlassPanel>
    );
};

export default ComponentDetailsPanel;
