
import React from 'react';
import { Component, ComponentType } from '../types';
import { Server, Database, Globe, Layers, MessageSquare, Box, Users, Shield, Cpu, AlertTriangle } from 'lucide-react';

interface ComponentNodeProps {
    component: Component;
    selected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void; // For dragging
    onConnectStart: (e: React.MouseEvent, nodeId: string) => void;
}

export const getComponentIcon = (type: ComponentType) => {
    switch (type) {
        case 'web-server': return Globe;
        case 'api-service': return Server;
        case 'worker-service': return Cpu;
        case 'serverless': return Box;
        case 'sql-database': return Database;
        case 'nosql-database': return Database;
        case 'cache': return Layers;
        case 'message-queue': return MessageSquare;
        case 'load-balancer': return Layers;
        case 'cdn': return Globe;
        case 'client': return Users;
        case 'auth-provider': return Shield;
        default: return Box;
    }
};

export const ComponentNode: React.FC<ComponentNodeProps> = ({ component, selected, onClick, onMouseDown, onConnectStart }) => {
    const Icon = getComponentIcon(component.type);

    // Status color
    let statusColor = 'stroke-indigo-500';
    let bgColor = 'fill-gray-900';

    if (component.metrics) {
        if (component.metrics.status === 'critical') {
            statusColor = 'stroke-red-500';
            bgColor = 'fill-red-900/20';
        } else if (component.metrics.status === 'warning') {
            statusColor = 'stroke-yellow-500';
            bgColor = 'fill-yellow-900/20';
        } else if (component.metrics.status === 'healthy') {
            statusColor = 'stroke-green-500';
        }
    }

    const handlePortMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onConnectStart(e, component.id);
    };

    return (
        <g
            transform={`translate(${component.position.x}, ${component.position.y})`}
            onClick={onClick}
            onMouseDown={onMouseDown}
            className="cursor-pointer group"
        >
            {/* Main Box */}
            <rect
                width={component.size.width}
                height={component.size.height}
                rx={8}
                className={`${bgColor} ${selected ? 'stroke-white stroke-2' : statusColor} transition-colors`}
                fillOpacity={0.8}
                strokeWidth={selected ? 2 : 1}
            />

            {/* Header / Name */}
            <foreignObject x={0} y={0} width={component.size.width} height={component.size.height}>
                <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                    <div className={`mb-1 p-1 rounded-full bg-gray-800 ${selected ? 'text-white' : 'text-gray-300'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-white truncate w-full px-1">
                        {component.name}
                    </div>
                    <div className="text-[10px] text-gray-400 capitalize">
                        {component.type.replace('-', ' ')}
                    </div>
                </div>
            </foreignObject>

            {/* Metrics Overlay (Optional: only if metrics exist) */}
            {component.metrics && (
                <g transform={`translate(${component.size.width - 20}, -10)`}>
                    {component.metrics.status !== 'healthy' && (
                        <circle r={10} fill={component.metrics.status === 'critical' ? '#EF4444' : '#EAB308'} />
                    )}
                    {component.metrics.status !== 'healthy' && (
                        <text x={0} y={4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
                    )}
                </g>
            )}

            {/* Connection Handles (Visible on Hover or Select) */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Top */}
                <circle cx={component.size.width / 2} cy={0} r={6} fill="#6366F1" className="cursor-crosshair hover:r-8 transition-all" onMouseDown={handlePortMouseDown} />
                {/* Right */}
                <circle cx={component.size.width} cy={component.size.height / 2} r={6} fill="#6366F1" className="cursor-crosshair hover:r-8 transition-all" onMouseDown={handlePortMouseDown} />
                {/* Bottom */}
                <circle cx={component.size.width / 2} cy={component.size.height} r={6} fill="#6366F1" className="cursor-crosshair hover:r-8 transition-all" onMouseDown={handlePortMouseDown} />
                {/* Left */}
                <circle cx={0} cy={component.size.height / 2} r={6} fill="#6366F1" className="cursor-crosshair hover:r-8 transition-all" onMouseDown={handlePortMouseDown} />
            </g>

            {/* Selection Corners */}
            {selected && (
                <>
                    <circle cx={0} cy={0} r={4} fill="white" stroke="none" />
                    <circle cx={component.size.width} cy={0} r={4} fill="white" stroke="none" />
                    <circle cx={component.size.width} cy={component.size.height} r={4} fill="white" stroke="none" />
                    <circle cx={0} cy={component.size.height} r={4} fill="white" stroke="none" />
                </>
            )}
        </g>
    );
};
