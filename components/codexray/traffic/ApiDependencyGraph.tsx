import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DependencyGraphData, DependencyGraphNode } from './types';
import { ZoomIn, ZoomOut, Maximize, RefreshCw, Smartphone, Globe } from 'lucide-react';

interface GraphProps {
    data: DependencyGraphData | null;
}

interface Point { x: number; y: number }

// Robust width calculator
const calculateNodeWidth = (label: string | undefined | null) => {
    if (!label) return 250;
    // 10px per char + 80px padding, min 250px, max 1000px
    return Math.max(250, Math.min(label.length * 10 + 80, 1000));
};

export default function ApiDependencyGraph({ data }: GraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [zoom, setZoom] = useState(0.8);
    const [offset, setOffset] = useState<Point>({ x: 50, y: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    // Track window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Layout computation with Paranoid Safety
    const layout = useMemo(() => {
        console.log("Graph: calculating layout", { data });

        if (!data || !data.nodes || !Array.isArray(data.nodes)) {
            return { nodes: [], edges: [], height: 600 };
        }

        const nodes = [...data.nodes];
        const edges = Array.isArray(data.edges) ? [...data.edges] : [];

        const components = nodes.filter(n => n && n.type === 'component');
        const endpoints = nodes.filter(n => n && n.type === 'endpoint');

        // Fallback for weird nodes
        const others = nodes.filter(n => n && n.type !== 'component' && n.type !== 'endpoint');

        const maxNodes = Math.max(components.length, endpoints.length);
        const minHeight = 600;
        const spacing = 120;
        const totalHeight = Math.max(minHeight, (components.length + endpoints.length + others.length) * 80 + 200);

        const computedNodes = nodes.map((node, i) => {
            if (!node) return null;

            // Safe Label
            const safeLabel = node.label || `Node ${node.id || i}`;
            const width = calculateNodeWidth(safeLabel);

            let x = 100;
            let y = 100;

            if (node.type === 'component') {
                const idx = components.findIndex(n => n.id === node.id);
                // Left Side
                x = 100 + (width / 2);
                y = (totalHeight * ((idx + 1) / (components.length + 1)));
            } else if (node.type === 'endpoint') {
                const idx = endpoints.findIndex(n => n.id === node.id);
                // Right Side
                const targetWidth = isFullScreen ? Math.min(windowWidth - 400, 1400) : 600;
                x = targetWidth + (width / 2);
                y = (totalHeight * ((idx + 1) / (endpoints.length + 1)));
            } else {
                // Fallback for unknown types
                x = 400;
                y = 100 + (i * 100);
            }

            // Safety check for NaN
            if (isNaN(x)) x = 100;
            if (isNaN(y)) y = 100;

            return { ...node, x, y, width, label: safeLabel };
        }).filter(Boolean); // Remove nulls

        console.log("Graph: layout computed", { nodes: computedNodes.length, edges: edges.length });
        return { nodes: computedNodes as (DependencyGraphNode & { x: number, y: number, width: number })[], edges, height: totalHeight };

    }, [data, isFullScreen, windowWidth]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoom = (delta: number) => {
        setZoom(z => Math.max(0.1, Math.min(3, z + delta)));
    };

    // If no nodes, show placeholder
    if (!layout.nodes || layout.nodes.length === 0) {
        return (
            <div className={`h-full w-full flex flex-col items-center justify-center text-white/30 bg-black/20 rounded-xl border border-white/10 ${isFullScreen ? 'fixed inset-0 z-[9999] bg-black' : ''}`}>
                <Globe className="w-12 h-12 mb-4 opacity-20" />
                <p>No connections found to visualize.</p>
                {isFullScreen && <button onClick={() => setIsFullScreen(false)} className="mt-4 px-4 py-2 bg-white/10 rounded">Exit Fullscreen</button>}
            </div>
        );
    }

    const containerClasses = isFullScreen
        ? "fixed inset-0 z-[9999] h-full w-full bg-black flex flex-col"
        : "h-full w-full relative overflow-hidden bg-black/20 rounded-xl border border-white/10";

    const containerStyle = isFullScreen
        ? { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0 }
        : {};

    const toggleFullScreen = () => {
        if (!isFullScreen) {
            setIsFullScreen(true);
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => { });
            }
        } else {
            setIsFullScreen(false);
            if (document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        }
    };

    useEffect(() => {
        const handleEsc = () => {
            if (!document.fullscreenElement && isFullScreen) setIsFullScreen(false);
        };
        document.addEventListener('fullscreenchange', handleEsc);
        return () => document.removeEventListener('fullscreenchange', handleEsc);
    }, [isFullScreen]);

    return (
        <div
            className={`${containerClasses} select-none transition-all duration-300`}
            style={containerStyle}
            data-fullscreen={isFullScreen}
        >
            {isFullScreen && (
                <style>{`
                    [data-fullscreen="true"] { cursor: auto !important; }
                    [data-fullscreen="true"] svg { cursor: grab !important; }
                    [data-fullscreen="true"] svg:active { cursor: grabbing !important; }
                    [data-fullscreen="true"] button { cursor: pointer !important; }
                `}</style>
            )}

            {/* Controls - Moved to Bottom Right to avoid Node Overlap */}
            <div className={`absolute bottom-4 right-4 flex flex-col gap-2 z-10 ${isFullScreen ? 'fixed bottom-6 right-6' : ''}`}>
                <button onClick={() => handleZoom(0.1)} className="p-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 shadow-lg backdrop-blur-md transition-all active:scale-95"><ZoomIn className="w-5 h-5" /></button>
                <button onClick={() => handleZoom(-0.1)} className="p-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 shadow-lg backdrop-blur-md transition-all active:scale-95"><ZoomOut className="w-5 h-5" /></button>
                <button onClick={toggleFullScreen} className={`p-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 shadow-lg backdrop-blur-md transition-all active:scale-95 ${isFullScreen ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : ''}`}><Maximize className="w-5 h-5" /></button>
            </div>

            {/* Legend */}
            <div className={`absolute bottom-4 left-4 p-3 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md ${isFullScreen ? 'fixed bottom-6 left-6' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                    <span className="text-xs text-white/70">Component</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-white/70">Endpoint</span>
                </div>
            </div>

            {/* Canvas */}
            <svg
                ref={svgRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" fillOpacity="1" />
                    </marker>
                </defs>

                <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
                    {/* Edges */}
                    {layout.edges.map((edge, i) => {
                        const source = layout.nodes.find(n => n.id === edge.source);
                        const target = layout.nodes.find(n => n.id === edge.target);
                        if (!source || !target) return null;

                        const sourceWidth = source.width || 250;
                        const targetWidth = target.width || 250;

                        // Connect: Source Right to Target Left
                        const startX = source.x + (sourceWidth / 2);
                        const startY = source.y;
                        const endX = target.x - (targetWidth / 2);
                        const endY = target.y;

                        const isHighlighted = selectedNode && (edge.source === selectedNode || edge.target === selectedNode);
                        const strokeColor = isHighlighted ? '#22d3ee' : '#ffffff';
                        const opacity = isHighlighted ? 1 : selectedNode ? 0.3 : 1.0;

                        return (
                            <path
                                key={i}
                                d={`M ${startX} ${startY} C ${startX + 80} ${startY}, ${endX - 80} ${endY}, ${endX} ${endY}`}
                                stroke={strokeColor}
                                strokeOpacity={opacity}
                                strokeWidth={isHighlighted ? 4 : 2.5}
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                style={{ transition: 'all 0.2s' }}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {layout.nodes.map(node => {
                        const isComponent = node.type === 'component';
                        const isSelected = selectedNode === node.id;
                        const isDimmed = selectedNode && !isSelected && !layout.edges.some(e =>
                            (e.source === selectedNode && e.target === node.id) ||
                            (e.target === selectedNode && e.source === node.id)
                        );

                        const width = node.width || 250;
                        const halfWidth = width / 2;

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                onClick={(e) => { e.stopPropagation(); setSelectedNode(isSelected ? null : node.id); }}
                                className="cursor-pointer transition-opacity duration-300"
                                style={{ opacity: isDimmed ? 0.3 : 1 }}
                            >
                                {isComponent ? (
                                    <rect
                                        x={-halfWidth} y="-18" width={width} height="36" rx="6"
                                        fill="#60a5fa" fillOpacity="1"
                                        stroke="#ffffff" strokeWidth="2"
                                    />
                                ) : (
                                    <rect
                                        x={-halfWidth} y="-18" width={width} height="36" rx="18"
                                        fill="#34d399" fillOpacity="1"
                                        stroke="#ffffff" strokeWidth="2"
                                    />
                                )}

                                <text
                                    y="5"
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="12"
                                    fontWeight="900"
                                    pointerEvents="none"
                                >
                                    {node.label}
                                </text>
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    );
}
