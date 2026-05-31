
import React from 'react';
import { Connection } from '../types';
import { calculateBezierPath } from '../utils/canvasHelpers';

interface ConnectionLineProps {
    connection: Connection;
    start: { x: number; y: number };
    end: { x: number; y: number };
    selected: boolean;
    onClick: (e: React.MouseEvent) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ connection, start, end, selected, onClick }) => {
    const d = calculateBezierPath(start, end, connection.visual.arrowPosition);

    // Determine color based on metrics if available (latency) or selection
    let strokeColor = selected ? '#FFFFFF' : '#6366F1'; // Default Indigo
    let strokeWidth = 2;

    if (connection.metrics) {
        const latency = connection.metrics.p99LatencyMs;
        if (latency > 500) strokeColor = '#EF4444'; // Red
        else if (latency > 100) strokeColor = '#EAB308'; // Yellow
        else strokeColor = '#22C55E'; // Green

        // Traffic thickness
        if (connection.metrics.requestsTransmitted > 1000) strokeWidth = 3;
    }

    return (
        <g onClick={onClick} className="cursor-pointer group">
            {/* Invisible wide stroke for easier clicking */}
            <path d={d} stroke="transparent" strokeWidth={15} fill="none" />

            {/* Visible path */}
            <path
                d={d}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                className="transition-colors duration-300"
                strokeDasharray={connection.visual.lineStyle === 'dashed' ? '5,5' : connection.visual.lineStyle === 'dotted' ? '2,2' : undefined}
                markerEnd="url(#arrowhead)" // Assumes arrowhead defs in parent SVG
            />

            {/* Latency Label (Midpoint approx) */}
            {connection.metrics && (
                <g>
                    <rect
                        x={(start.x + end.x) / 2 - 20}
                        y={(start.y + end.y) / 2 - 10}
                        width={40}
                        height={20}
                        rx={4}
                        fill="#111827"
                        fillOpacity={0.8}
                    />
                    <text
                        x={(start.x + end.x) / 2}
                        y={(start.y + end.y) / 2 + 4}
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                    >
                        {Math.round(connection.metrics.avgLatencyMs)}ms
                    </text>
                </g>
            )}
        </g>
    );
};
