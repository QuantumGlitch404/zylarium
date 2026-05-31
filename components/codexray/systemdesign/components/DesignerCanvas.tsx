
import React, { useRef, useState, useEffect } from 'react';
import { Component, Connection, ComponentType } from '../types';
import { ComponentNode } from './ComponentNode';
import { ConnectionLine } from './ConnectionLine';
import { getBestConnectionPoints, snapToGrid } from '../utils/canvasHelpers';
import { ZoomIn, ZoomOut, Maximize, Grid } from 'lucide-react';

interface DesignerCanvasProps {
    components: Component[];
    connections: Connection[];
    onComponentsChange: (components: Component[]) => void;
    onConnectionsChange: (connections: Connection[]) => void;
    onSelectionChange: (selectedId: string | null, type: 'component' | 'connection' | null) => void;
    selectedId: string | null;
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
    components,
    connections,
    onComponentsChange,
    onConnectionsChange,
    onSelectionChange,
    selectedId
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDraggingPan, setIsDraggingPan] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showGrid, setShowGrid] = useState(true);

    // Component Drag State
    const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
    const [componentDragOffset, setComponentDragOffset] = useState({ x: 0, y: 0 });

    // Connection Creation State (Drag to Connect)
    const [connectingStartId, setConnectingStartId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // --- Interaction Handlers ---

    // 1. Pan / Zoom
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            setZoom(z => Math.min(Math.max(0.1, z + delta), 5));
        } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left
            setIsDraggingPan(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        } else if (e.button === 0 && !draggedComponentId) {
            // Deselect if clicking canvas empty space
            onSelectionChange(null, null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Calculate SVG coordinates
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        const x = (e.clientX - svgRect.left - pan.x) / zoom;
        const y = (e.clientY - svgRect.top - pan.y) / zoom;
        setMousePos({ x, y });

        if (isDraggingPan) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (draggedComponentId) {
            // Move Component
            const updated = components.map(c => {
                if (c.id === draggedComponentId) {
                    return {
                        ...c,
                        position: {
                            x: snapToGrid(x - componentDragOffset.x),
                            y: snapToGrid(y - componentDragOffset.y)
                        }
                    };
                }
                return c;
            });
            onComponentsChange(updated);
        }
    };

    const handleMouseUp = () => {
        setIsDraggingPan(false);
        setDraggedComponentId(null);

        // Finalize Connection
        if (connectingStartId) {
            // Check if dropped on another component
            const target = components.find(c =>
                mousePos.x >= c.position.x &&
                mousePos.x <= c.position.x + c.size.width &&
                mousePos.y >= c.position.y &&
                mousePos.y <= c.position.y + c.size.height &&
                c.id !== connectingStartId
            );

            if (target) {
                // Create Connection
                const newConn: Connection = {
                    id: Math.random().toString(36).substr(2, 9),
                    fromId: connectingStartId,
                    toId: target.id,
                    type: 'sync',
                    properties: {
                        bandwidthLimitMBps: 1000,
                        latencyMs: 10,
                        timeoutMs: 30000,
                        retryPolicy: 'none',
                        maxRetries: 3,
                        failureRate: 0
                    },
                    visual: {
                        label: '',
                        lineStyle: 'solid',
                        arrowPosition: 'end',
                        color: '#6366F1'
                    },
                    controlPoints: []
                };
                onConnectionsChange([...connections, newConn]);
            }
            setConnectingStartId(null);
        }
    };

    // Component Handlers
    const handleComponentMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (e.shiftKey) {
            // Start Connecting
            setConnectingStartId(id);
        } else {
            // Start Dragging
            const comp = components.find(c => c.id === id);
            if (comp && svgRef.current) {
                const svgRect = svgRef.current.getBoundingClientRect();
                const mouseX = (e.clientX - svgRect.left - pan.x) / zoom;
                const mouseY = (e.clientY - svgRect.top - pan.y) / zoom;

                setDraggedComponentId(id);
                setComponentDragOffset({
                    x: mouseX - comp.position.x,
                    y: mouseY - comp.position.y
                });
                onSelectionChange(id, 'component');
            }
        }
    };

    // Drop Handler for Palette
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('componentType') as ComponentType;
        if (!type || !svgRef.current) return;

        const svgRect = svgRef.current.getBoundingClientRect();
        const x = snapToGrid((e.clientX - svgRect.left - pan.x) / zoom);
        const y = snapToGrid((e.clientY - svgRect.top - pan.y) / zoom);

        const newComp: Component = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            name: `New ${type}`,
            description: '',
            position: { x, y },
            size: { width: 120, height: 80 },
            properties: {
                maxRPS: 1000,
                concurrencyLimit: 100,
                avgProcessingMs: 50,
                replicas: 1,
                autoScale: true,
                scaleThreshold: 70,
                minReplicas: 1,
                maxReplicas: 5,
                failureRate: 0,
                healthCheckIntervalMs: 30,
                timeoutMs: 30000
            },
            visual: { icon: '', color: '#1F2937', size: 'medium' }
        };

        onComponentsChange([...components, newComp]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    return (
        <div className="flex-1 h-full relative overflow-hidden bg-transparent">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex gap-2 bg-gray-800/80 backdrop-blur rounded-lg p-1 border border-gray-700">
                <button onClick={() => setZoom(z => z + 0.1)} className="p-2 hover:bg-gray-700 rounded"><ZoomIn className="w-4 h-4 text-white" /></button>
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 hover:bg-gray-700 rounded"><ZoomOut className="w-4 h-4 text-white" /></button>
                <div className="w-px bg-gray-700 mx-1" />
                <button onClick={() => setShowGrid(!showGrid)} className={`p-2 hover:bg-gray-700 rounded ${showGrid ? 'bg-gray-700' : ''}`} title="Toggle Grid"><Grid className="w-4 h-4 text-white" /></button>
            </div>

            {/* Canvas */}
            <svg
                ref={svgRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
                    </marker>
                    {/* Grid Pattern */}
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" className={showGrid ? 'opacity-100' : 'opacity-0'} />
                    </pattern>
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />

                    {/* Components */}
                    {components.map(comp => (
                        <ComponentNode
                            key={comp.id}
                            component={comp}
                            selected={selectedId === comp.id}
                            onClick={(e) => { e.stopPropagation(); onSelectionChange(comp.id, 'component'); }}
                            onMouseDown={(e) => handleComponentMouseDown(e, comp.id)}
                            onConnectStart={(e, id) => {
                                setConnectingStartId(id);
                                // Set initial mouse pos to avoid jump
                                const svgRect = svgRef.current?.getBoundingClientRect();
                                if (svgRect) {
                                    setMousePos({
                                        x: (e.clientX - svgRect.left - pan.x) / zoom,
                                        y: (e.clientY - svgRect.top - pan.y) / zoom
                                    });
                                }
                            }}
                        />
                    ))}

                    {/* Connections */}
                    {connections.map(conn => {
                        const startComp = components.find(c => c.id === conn.fromId);
                        const endComp = components.find(c => c.id === conn.toId);
                        if (!startComp || !endComp) return null;

                        const { start, end } = getBestConnectionPoints(
                            { ...startComp.position, w: startComp.size.width, h: startComp.size.height },
                            { ...endComp.position, w: endComp.size.width, h: endComp.size.height }
                        );

                        return (
                            <ConnectionLine
                                key={conn.id}
                                connection={conn}
                                start={start}
                                end={end}
                                selected={selectedId === conn.id}
                                onClick={(e) => { e.stopPropagation(); onSelectionChange(conn.id, 'connection'); }}
                            />
                        );
                    })}

                    {/* Drag Line (Creating Connection) */}
                    {connectingStartId && (
                        <line
                            x1={components.find(c => c.id === connectingStartId)?.position.x! + 60}
                            y1={components.find(c => c.id === connectingStartId)?.position.y! + 40}
                            x2={mousePos.x}
                            y2={mousePos.y}
                            stroke="#6366F1"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                    )}
                </g>
            </svg>
        </div>
    );
};
