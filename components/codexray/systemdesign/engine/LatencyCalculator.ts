
import { SimulationResults, LatencyOverlay } from '../types';

export const calculateLatencyOverlay = (results: SimulationResults): LatencyOverlay => {
    const overlay: LatencyOverlay = {};

    results.connectionMetrics.forEach((metrics, connectionId) => {
        const p99 = metrics.p99LatencyMs;
        let color = 'green';
        let thickness = 1;

        if (p99 > 100) {
            color = 'yellow';
            thickness = 2;
        }
        if (p99 > 500) {
            color = 'red';
            thickness = 3;
        }

        overlay[connectionId] = {
            p50: metrics.p50LatencyMs,
            p95: metrics.p95LatencyMs,
            p99: p99,
            avg: metrics.avgLatencyMs,
            color,
            thickness
        };
    });

    return overlay;
};

// Simple critical path finder (Longest latency path)
// Requires graph traversal with weighted edges (latency)
export const findCriticalPath = (results: SimulationResults, connections: any[]) => {
    // TODO: Implement critical path logic
    return [];
};
