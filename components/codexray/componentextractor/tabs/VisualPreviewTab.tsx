// Visual Preview Tab - Render HTML with component overlays

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ZoomIn, ZoomOut, Crosshair, Palette } from 'lucide-react';
import { DetectedComponent, AnalysisResult } from '../types';

interface VisualPreviewTabProps {
    result: AnalysisResult;
    htmlContent: string;
    selectedComponent: DetectedComponent | null;
    onSelectComponent: (component: DetectedComponent | null) => void;
}

// Liquid Glass Panel
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

// Color coding for component types
const COMPONENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    'repeated': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
    'layout': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
    'unique': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
};

export const VisualPreviewTab: React.FC<VisualPreviewTabProps> = ({
    result,
    htmlContent,
    selectedComponent,
    onSelectComponent,
}) => {
    const [showOverlays, setShowOverlays] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [colorByType, setColorByType] = useState(true);
    const [showNestingDepth, setShowNestingDepth] = useState(false);
    const [zoom, setZoom] = useState(100);
    const previewRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setZoom(z => Math.min(200, z + 10));
    const handleZoomOut = () => setZoom(z => Math.max(50, z - 10));

    return (
        <div className="flex flex-col h-full">
            {/* Controls */}
            <GlassPanel className="p-4 mb-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-300">Overlay Options:</span>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showOverlays}
                                onChange={(e) => setShowOverlays(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-400">Show boundaries</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showLabels}
                                onChange={(e) => setShowLabels(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-400">Show labels</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={colorByType}
                                onChange={(e) => setColorByType(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-400">Color by type</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showNestingDepth}
                                onChange={(e) => setShowNestingDepth(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-400">Show depth</span>
                        </label>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Zoom out"
                        >
                            <ZoomOut className="w-4 h-4 text-gray-400" />
                        </button>
                        <span className="text-sm text-gray-400 w-12 text-center">{zoom}%</span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Zoom in"
                        >
                            <ZoomIn className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs text-gray-500">Legend:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500/50" />
                        <span className="text-xs text-gray-400">Repeated Pattern</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
                        <span className="text-xs text-gray-400">Layout Component</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-500/30 border border-purple-500/50" />
                        <span className="text-xs text-gray-400">Unique Section</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
                        <span className="text-xs text-gray-400">Anti-Pattern Warning</span>
                    </div>
                </div>
            </GlassPanel>

            {/* Preview Area */}
            <GlassPanel className="flex-1 overflow-hidden">
                <div
                    ref={previewRef}
                    className="h-full overflow-auto p-6"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                >
                    {/* Rendered preview with overlays */}
                    <div className="relative bg-white rounded-lg p-4 min-h-[400px]">
                        {/* HTML Content */}
                        <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />

                        {/* Component Overlays */}
                        {showOverlays && result.components.map((component) => (
                            <div
                                key={component.id}
                                className={`absolute border-2 rounded-lg cursor-pointer transition-all hover:border-opacity-100 ${colorByType
                                        ? COMPONENT_COLORS[component.type]?.border || 'border-gray-400/50'
                                        : 'border-indigo-500/50'
                                    } ${selectedComponent?.id === component.id
                                        ? 'ring-2 ring-white/50 border-opacity-100'
                                        : 'border-opacity-50'
                                    }`}
                                style={{
                                    top: '10%',
                                    left: '5%',
                                    width: '90%',
                                    minHeight: '50px',
                                }}
                                onClick={() => onSelectComponent(component)}
                            >
                                {showLabels && (
                                    <div className={`absolute -top-6 left-2 px-2 py-0.5 rounded text-xs font-medium ${colorByType
                                            ? COMPONENT_COLORS[component.type]?.bg || 'bg-gray-500/20'
                                            : 'bg-indigo-500/20'
                                        } ${colorByType
                                            ? COMPONENT_COLORS[component.type]?.text || 'text-gray-300'
                                            : 'text-indigo-300'
                                        }`}>
                                        {component.name}
                                        {showNestingDepth && ` (d:${component.metrics.nestingDepth})`}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </GlassPanel>

            {/* Footer hint */}
            <div className="mt-2 text-center text-xs text-gray-500">
                Click any component to see details • Double-click to zoom • Right-click for options
            </div>
        </div>
    );
};

export default VisualPreviewTab;
