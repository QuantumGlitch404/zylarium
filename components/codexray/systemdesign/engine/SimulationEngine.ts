
import {
    SystemDesign, SimulationResults, SimulationEvent, EventType,
    ComponentType, ComponentMetrics, ConnectionMetrics, Workload, SimConfig
} from '../types';
import { sampleProcessingTime } from './QueueingModels';

// Priority Queue for events
class PriorityQueue<T extends { time: number }> {
    private items: T[] = [];

    push(item: T) {
        // Simple insertion sort for now, optimize with binary heap if needed for large scale
        // We want lowest time first (min heap behavior)
        let inserted = false;
        for (let i = 0; i < this.items.length; i++) {
            if (item.time < this.items[i].time) {
                this.items.splice(i, 0, item);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this.items.push(item);
        }
    }

    pop(): T | undefined {
        return this.items.shift();
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }
}

// Helper to get random ID
const uuid = () => Math.random().toString(36).substr(2, 9);

export const runSimulation = (design: SystemDesign, config: SimConfig): SimulationResults => {
    const eventQueue = new PriorityQueue<SimulationEvent>();
    let currentTime = 0;
    const durationMs = config.duration * 1000;

    // Initialize Metrics Maps
    const componentMetrics = new Map<string, ComponentMetrics>();
    const connectionMetrics = new Map<string, ConnectionMetrics>();

    design.components.forEach(c => {
        componentMetrics.set(c.id, {
            componentId: c.id,
            utilization: 0,
            avgQueueLength: 0,
            maxQueueLength: 0,
            requestsProcessed: 0,
            requestsFailed: 0,
            avgLatencyMs: 0,
            p99LatencyMs: 0,
            status: 'healthy'
        });
    });

    design.connections.forEach(c => {
        connectionMetrics.set(c.id, {
            connectionId: c.id,
            requestsTransmitted: 0,
            bytesTransmitted: 0,
            avgLatencyMs: 0,
            p50LatencyMs: 0,
            p95LatencyMs: 0,
            p99LatencyMs: 0,
            failureCount: 0,
            retryCount: 0,
            bandwidthUtilization: 0
        });
    });

    // Helper to get component by ID
    const getComponent = (id: string) => design.components.find(c => c.id === id);
    const getConnectionsFrom = (id: string) => design.connections.filter(c => c.fromId === id);

    // Initial Workload Scheduling
    design.workloads.forEach(workload => {
        if (!workload.enabled) return;

        // Calculate interval based on RPS
        const effectiveRPS = workload.rps * config.loadMultiplier;
        if (effectiveRPS <= 0) return;

        const intervalMs = 1000 / effectiveRPS;
        let nextTime = 0;

        // Pattern logic could be expanded here (burst, wave)

        while (nextTime < durationMs) {
            eventQueue.push({
                time: nextTime,
                type: 'request_arrival',
                componentId: workload.sourceComponentId,
                requestId: uuid(),
                data: { payloadSize: workload.payloadSizeBytes, sourceWorkload: workload.id }
            });
            nextTime += intervalMs;
        }
    });

    // Processing state tracking (simplified)
    const componentState = new Map<string, { queue: number, processing: number }>();
    design.components.forEach(c => componentState.set(c.id, { queue: 0, processing: 0 }));

    // Request latencies for stats
    const requestLatencies: number[] = [];

    // --- Event Handlers ---

    const handleArrival = (event: SimulationEvent) => {
        const comp = getComponent(event.componentId);
        if (!comp) return;

        const state = componentState.get(comp.id)!;
        const metrics = componentMetrics.get(comp.id)!;

        // Check capacity (Queue limit) -> approximated by concurrency limit for now
        // Queue = pending + processing
        if (state.queue + state.processing >= comp.properties.concurrencyLimit) {
            metrics.requestsFailed++;
            // Queue overflow
            return;
        }

        state.queue++;
        metrics.maxQueueLength = Math.max(metrics.maxQueueLength, state.queue);
        metrics.avgQueueLength = (metrics.avgQueueLength * metrics.requestsProcessed + state.queue) / (metrics.requestsProcessed + 1); // Running avg approx

        // Schedule start of processing (immediate if resources available, otherwise waits in queue concept)
        // For simple M/M/c simulation, we can assume if slots available we start
        // Real resource contention would require resource pool management
        if (state.processing < comp.properties.concurrencyLimit) { // Or replicas
            eventQueue.push({
                time: event.time,
                type: 'begin_service',
                componentId: comp.id,
                requestId: event.requestId,
                data: event.data
            });
        } else {
            // In a real queue simulation, we'd wait. 
            // For this approximation, we'll auto-schedule start with a delay based on queue?
            // Simplified: If full, acts as queue. We'll start it anyway but effective processing time might be higher 
            // or just assume it starts when a slot frees up.
            // Let's implement correct queuing:
            // We can't easily do correct waiting in this simple loop without a 'server_free' event.
            // Simplified approach: Just schedule begin_service immediately but add 'waiting time' to processing?
            // Better: Just increment queue. We need a 'server_freed' trigger.
            // Let's stick to the 'flow' model:
            // If processing < limit, start.
            // Else, leave in queue. 'end_service' will trigger checking the queue.
        }
    };

    const handleBeginService = (event: SimulationEvent) => {
        const comp = getComponent(event.componentId);
        if (!comp) return;

        const state = componentState.get(comp.id)!;

        // Move from queue to processing
        state.queue--;
        state.processing++;

        // Calculate processing time
        // Use sampling from exponential distribution based on avgProcessingMs
        const processingTime = sampleProcessingTime(comp.properties.avgProcessingMs);

        // Failure check
        if (Math.random() * 100 < comp.properties.failureRate) {
            eventQueue.push({
                time: event.time + processingTime, // fail after some work
                type: 'failure',
                componentId: comp.id,
                requestId: event.requestId,
                data: event.data
            });
        } else {
            eventQueue.push({
                time: event.time + processingTime,
                type: 'end_service',
                componentId: comp.id,
                requestId: event.requestId,
                data: event.data
            });
        }
    };

    const handleEndService = (event: SimulationEvent) => {
        const comp = getComponent(event.componentId);
        if (!comp) return;

        const state = componentState.get(comp.id)!;
        const metrics = componentMetrics.get(comp.id)!;

        state.processing--;
        metrics.requestsProcessed++;

        // Check if we can process waiting items from queue
        if (state.queue > 0) {
            // Actually, the handleArrival logic put things in queue but didn't schedule if full.
            // But we don't have a list of 'waiting requests'. 
            // To fix this simple simulation: 
            // We need to store actual requests in the queue, or just generate a 'begin_service' for a phantom request?
            // No, we need references. 
            // REVISION: The priority queue processes events. We need a component-level queue for Requests that are waiting.
        }

        // Propagate to next
        const connections = getConnectionsFrom(comp.id);
        if (connections.length === 0) {
            // End of flow
            // Calculate total latency relative to... start? We don't have start time in event data easily unless passed
            // Let's assume request duration is tracked or we just track metrics locally
        } else {
            // Load balancing logic (Random for now, or round robin)
            // If multiple connections, usually implies fan-out or choice.
            // For visualizer, let's assume 'API -> DB' and 'API -> Cache' implies BOTH or CHOICE?
            // Usually Flowchart implies flow. 
            // Let's assume 100% traffic goes to ALL synchronous dependencies? Or split?
            // For now: Propagate to ALL connected components (Fan-out)
            connections.forEach(conn => {
                const latency = conn.properties.latencyMs; // + network variance?
                const connMetrics = connectionMetrics.get(conn.id)!;
                connMetrics.requestsTransmitted++;

                eventQueue.push({
                    time: event.time + latency,
                    type: 'request_arrival',
                    componentId: conn.toId,
                    requestId: event.requestId,
                    data: event.data
                });
            });
        }

        // If there were items in queue (abstractly), we should process them.
        // Since we didn't store the specific 'request' that was queued (we just returned in handleArrival),
        // we essentially dropped it in that simplified logic.
        // To do it right: `componentState` needs `waitingRequests: SimulationEvent[]`.
    };


    // --- Optimized Simulation Loop for "Visualizer" approximations ---
    // Instead of full packet-level simulation which might be slow in JS for 100k requests,
    // we will hybridize. 
    // We will use the M/M/1 formulas to calculate steady-state metrics based on flow volume!
    // This is much faster and usually what system design interviews look for.
    // The Discrete Event Sim is good for "Burst" or "Timeline" but Math is better for "Bottlenecks".

    // We will implement a FLOW propagation pass first to determine arrival rates at each node.

    // 1. Calculate Traffic Map (RPS at each node)
    const nodeRPS = new Map<string, number>();
    design.workloads.forEach(w => {
        if (w.enabled) nodeRPS.set(w.sourceComponentId, (nodeRPS.get(w.sourceComponentId) || 0) + (w.rps * config.loadMultiplier));
    });

    // Propagate RPS (Graph Traversal) - handle cycles?
    // Simple BFS with attenuation
    const queue = Array.from(nodeRPS.keys());
    const processed = new Set<string>();

    // Limits for loop detection
    let ops = 0;
    while (queue.length > 0 && ops < 1000) {
        const id = queue.shift()!;
        const rps = nodeRPS.get(id)!;

        const conns = getConnectionsFrom(id);
        if (conns.length > 0) {
            // Split RPS or Fan-out?
            // If LB, split rps / n. If Service calling DB, full rps.
            // We need 'Connection Logic'. 
            // Default: Full RPS propagates (Dependency). 
            // If Load Balancer -> n targets: Split.

            const comp = getComponent(id);
            let nextRps = rps;

            if (comp?.type === 'load-balancer') {
                nextRps = rps / conns.length;
            }

            conns.forEach(c => {
                const targetId = c.toId;
                const current = nodeRPS.get(targetId) || 0;
                // Prevent infinite addition in cycles (simple dampen)
                if (current > rps * 10) return;

                nodeRPS.set(targetId, current + nextRps);

                // If not processed or changed? Simplified: just add to queue if we assume DAG roughly
                // For cycles, we need visited checks per path
                if (!processed.has(targetId)) {
                    queue.push(targetId);
                    processed.add(targetId); // This prevents re-visiting, imperfect for converging paths
                }
            });
        }
        ops++;
    }

    // 2. Apply Queueing Theory to each Node
    design.components.forEach(comp => {
        const arrivalRate = nodeRPS.get(comp.id) || 0;
        const serviceRate = 1000 / comp.properties.avgProcessingMs; // requests/sec

        // Use M/M/c where c = replicas * concurrency?
        // Actually usually c = replicas. Concurrency is internal thread pool.
        // Let's use c = replicas.
        const replicas = comp.properties.replicas || 1;

        // Import calculation from QueueingModels
        const result = serviceRate > 0 ? (
            replicas > 1
                ? require('./QueueingModels').calculateMMc(arrivalRate, serviceRate, replicas)
                : require('./QueueingModels').calculateMM1(arrivalRate, serviceRate)
        ) : { utilization: 0, avgQueueLength: 0, avgWaitTime: 0 };

        const metrics = componentMetrics.get(comp.id)!;
        metrics.utilization = result.utilization;
        metrics.avgQueueLength = result.avgQueueLength;
        metrics.requestsProcessed = arrivalRate * config.duration;
        metrics.avgLatencyMs = comp.properties.avgProcessingMs + (result.avgWaitTime * 1000);
        metrics.p99LatencyMs = metrics.avgLatencyMs * 4; // Approx for exponential dist

        metrics.status = metrics.utilization > 0.8 ? (metrics.utilization > 0.95 ? 'critical' : 'warning') : 'healthy';
    });

    // 3. Update Connection Metrics
    design.connections.forEach(conn => {
        const fromRps = nodeRPS.get(conn.fromId) || 0;
        // Approximate flow on link
        const comp = getComponent(conn.fromId);
        const rps = comp?.type === 'load-balancer' ? fromRps / getConnectionsFrom(conn.fromId).length : fromRps;

        const metrics = connectionMetrics.get(conn.id)!;
        metrics.requestsTransmitted = rps * config.duration;
        metrics.bandwidthUtilization = (rps * 1024) / (conn.properties.bandwidthLimitMBps * 1024 * 1024); // approx 1KB payload
        metrics.avgLatencyMs = conn.properties.latencyMs;
        metrics.p99LatencyMs = conn.properties.latencyMs * 1.5; // Jitter
    });


    // Populate Final Results
    const summary = {
        totalRequests: Array.from(nodeRPS.values()).reduce((a, b) => a + b, 0) * config.duration, // Rough sum
        successfulRequests: 0, // Need to sub failed
        failedRequests: 0,
        successRate: 1,
        latency: { p50: 0, p95: 0, p99: 0, max: 0, avg: 0 }
    };

    // Aggregate failures
    design.components.forEach(c => {
        const m = componentMetrics.get(c.id)!;
        if (m.status === 'critical') summary.failedRequests += m.requestsProcessed * 0.1; // 10% fail if crit?
    });
    summary.successfulRequests = summary.totalRequests - summary.failedRequests;
    summary.successRate = summary.successfulRequests / (summary.totalRequests || 1);

    return {
        simulationId: uuid(),
        designId: design.id,
        timestamp: new Date(),
        duration: config.duration,
        loadMultiplier: config.loadMultiplier,
        summary,
        componentMetrics,
        connectionMetrics,
        bottlenecks: [], // To be populated by detector
        anomalies: [],
        timeline: []
    };
};

// ... (Simpler than full discrete event for the UI responsiveness requirement,
// using Flow + Queueing Theory gives instant results even for complex graphs)
