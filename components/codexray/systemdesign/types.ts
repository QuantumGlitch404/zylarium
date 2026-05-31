
export type ComponentType =
    | 'web-server'
    | 'api-service'
    | 'worker-service'
    | 'serverless'
    | 'load-balancer'
    | 'api-gateway'
    | 'sql-database'
    | 'nosql-database'
    | 'search-engine'
    | 'cache'
    | 'cdn'
    | 'message-queue'
    | 'pubsub'
    | 'stream'
    | 'object-storage'
    | 'block-storage'
    | 'client'
    | 'external-api'
    | 'auth-provider'
    | 'graphql-gateway'
    | 'data-lake'
    | 'spark-cluster'
    | 'monitoring'
    | 'dashboard'
    | 'k8s-cluster'
    | 'firewall'
    | 'vpn-gateway'
    | 'dns'
    | 'notification-service'
    | 'payment-gateway'
    | 'ml-model'
    | 'iot-device'
    | 'data-warehouse'
    | 'custom';

export interface ComponentMetrics {
    componentId: string;

    utilization: number;                 // 0-1
    avgQueueLength: number;
    maxQueueLength: number;

    requestsProcessed: number;
    requestsFailed: number;

    avgLatencyMs: number;
    p99LatencyMs: number;

    // For caches
    cacheHits?: number;
    cacheMisses?: number;
    hitRate?: number;

    // For queues
    messagesEnqueued?: number;
    messagesProcessed?: number;
    lag?: number;

    status: 'healthy' | 'warning' | 'critical';
}

export interface Component {
    id: string;
    type: ComponentType;
    name: string;
    description: string;

    position: { x: number; y: number };
    size: { width: number; height: number };

    properties: {
        // Capacity
        maxRPS: number;                    // requests per second
        concurrencyLimit: number;          // max concurrent requests
        avgProcessingMs: number;           // average processing time

        // Scaling
        replicas: number;
        autoScale: boolean;
        scaleThreshold: number;            // CPU percentage
        minReplicas: number;
        maxReplicas: number;

        // Reliability
        failureRate: number;               // percentage
        healthCheckIntervalMs: number;
        timeoutMs: number;

        // Type-specific
        cacheHitRate?: number;             // for caches
        replicationFactor?: number;        // for databases
        partitions?: number;               // for queues
        storageCapacity?: number;          // for storage
    };

    visual: {
        icon: string;
        color: string;
        size: 'small' | 'medium' | 'large';
    };

    // Simulation results
    metrics?: ComponentMetrics;
}

export interface ConnectionMetrics {
    connectionId: string;

    requestsTransmitted: number;
    bytesTransmitted: number;

    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;

    failureCount: number;
    retryCount: number;

    bandwidthUtilization: number;        // 0-1
}

export interface Connection {
    id: string;
    fromId: string;                      // source component ID
    toId: string;                        // target component ID

    type: 'sync' | 'async' | 'stream';

    properties: {
        bandwidthLimitMBps: number;        // MB per second
        latencyMs: number;                 // base latency
        timeoutMs: number;

        retryPolicy: 'none' | 'fixed' | 'exponential';
        maxRetries: number;

        failureRate: number;               // percentage
    };

    visual: {
        label: string;
        lineStyle: 'solid' | 'dashed' | 'dotted';
        arrowPosition: 'end' | 'both' | 'none';
        color: string;
    };

    // Control points for curved lines
    controlPoints: { x: number; y: number }[];

    // Simulation results
    metrics?: ConnectionMetrics;
}

export interface Workload {
    id: string;
    name: string;

    sourceComponentId: string;           // entry point

    rps: number;                         // requests per second
    payloadSizeBytes: number;

    pattern: 'constant' | 'burst' | 'wave' | 'custom';
    patternConfig?: {
        burstMultiplier?: number;
        burstDurationMs?: number;
        wavePeriodMs?: number;
        waveAmplitude?: number;
        customPattern?: number[];          // RPS values over time
    };

    enabled: boolean;
}

export interface SystemDesign {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;

    components: Component[];
    connections: Connection[];
    workloads: Workload[];

    canvas: {
        zoom: number;
        panX: number;
        panY: number;
        gridEnabled: boolean;
        snapToGrid: boolean;
    };

    notes: string;
    tags: string[];
}

export interface Bottleneck {
    componentId: string;
    componentName: string;

    severity: 'warning' | 'critical';

    type: 'capacity' | 'latency' | 'queue' | 'failure';

    metric: string;                      // e.g., "utilization"
    currentValue: number;
    threshold: number;

    description: string;
    recommendation: string;
}

export interface Anomaly {
    id: string;
    description: string;
    severity: 'warning' | 'critical';
    componentId?: string;
}

export interface TimeSeriesData {
    timestamp: number;
    metrics: Record<string, any>;
}

export interface SimulationResults {
    simulationId: string;
    designId: string;
    timestamp: Date;

    duration: number;                    // simulated seconds
    loadMultiplier: number;

    summary: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        successRate: number;

        latency: {
            p50: number;
            p95: number;
            p99: number;
            max: number;
            avg: number;
        };
    };

    componentMetrics: Map<string, ComponentMetrics>;
    connectionMetrics: Map<string, ConnectionMetrics>;

    bottlenecks: Bottleneck[];
    anomalies: Anomaly[];

    timeline: TimeSeriesData[];          // metrics over time
}

export type EventType =
    | 'request_arrival'      // new request enters system
    | 'begin_service'        // component starts processing
    | 'end_service'          // component finishes processing
    | 'queue_overflow'       // request rejected due to full queue
    | 'timeout'              // request timed out
    | 'failure'              // component failure
    | 'retry'                // retry attempt
    | 'propagate';           // request moves to next component

export interface SimulationEvent {
    time: number;                        // virtual time in ms
    type: EventType;
    componentId: string;
    requestId: string;
    data: any;
}

export interface DesignChange {
    type: 'add' | 'remove' | 'modify';
    entityType: 'component' | 'connection' | 'workload';
    entityId: string;

    before?: any;
    after?: any;
}

export interface DesignVersion {
    id: string;
    designId: string;
    version: number;

    createdAt: Date;
    name: string;
    description: string;

    snapshot: SystemDesign;              // full copy

    changes: DesignChange[];             // diff from previous
}

export interface StressTestResults {
    breakingPoint: number; // loadMultiplier
    componentLimits: { componentId: string; limitMultiplier: number; reason: string }[];
    chart: {
        loadMultiplier: number;
        successRate: number;
        p99Latency: number;
        bottlenecks: Bottleneck[];
    }[];
}

export interface FailureImpact {
    failedComponent: string;

    baseline: {
        successRate: number;
        p99Latency: number;
    };

    withFailure: {
        successRate: number;
        p99Latency: number;
    };

    impactedComponents: string[];
    cascadeDepth: number;

    recommendations: string[];
}

export interface LatencyOverlay {
    paths?: any;
    [connectionId: string]: {
        p50: number;
        p95: number;
        p99: number;
        avg: number;

        color: string;
        thickness: number;
    } | any;
}

export interface InterviewSession {
    problem: string;
    timeLimit: number; // minutes
    checkpoints: { name: string; time: number; completed: boolean }[];
    hints: string[];
    evaluationChecklist: { item: string; checked: boolean }[];
    status: 'active' | 'paused' | 'completed';
    elapsedTime: number;
}

export type SimulationMode = 'normal' | 'stress' | 'failure' | 'latency';

export interface SimConfig {
    duration: number; // seconds
    loadMultiplier: number;
    seed?: number;
}
