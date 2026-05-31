// Client-Side Log Analyzer - Type Definitions

// ============================================================================
// CORE TYPES
// ============================================================================

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 'FATAL' | 'UNKNOWN';
export type LogFormat = 'jsonl' | 'json' | 'csv' | 'text';
export type AnomalyType = 'error_burst' | 'frequency_spike' | 'unusual_session' | 'pattern_change';
export type AnomalySeverity = 'HIGH' | 'MEDIUM' | 'LOW';

// ============================================================================
// LOG ENTRY
// ============================================================================

export interface LogEntry {
    id: string;
    lineNumber: number;
    sourceFile: string;

    rawContent: string;

    timestamp: Date | null;
    timestampRaw: string | null;
    timestampFormat: string | null;

    level: LogLevel;
    levelRaw: string | null;

    message: string;
    messageNormalized: string;

    fingerprint: string;

    metadata: Record<string, any>;

    sessionId: string | null;
    requestId: string | null;
    userId: string | null;

    stackTrace: string | null;

    isParsed: boolean;
    parseErrors: string[];

    isNoise: boolean;
    isDuplicate: boolean;
    duplicateOf: string | null;
}

// ============================================================================
// ERROR FINGERPRINT
// ============================================================================

export interface TimeSeriesData {
    timestamp: Date;
    value: number;
    label?: string;
}

export interface BurstEvent {
    id: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    eventCount: number;
    normalRate: number;
    burstRate: number;
    spikeFactor: number;
    primaryFingerprint: string;
    affectedFingerprints: string[];
    affectedSessions: string[];
    severity: AnomalySeverity;
}

export interface ErrorFingerprint {
    id: string;
    template: string;

    occurrences: LogEntry[];
    count: number;

    firstSeen: Date;
    lastSeen: Date;

    affectedSessions: string[];
    affectedSessionCount: number;

    level: 'ERROR' | 'WARN';

    sampleMessages: string[];
    stackTrace: string | null;

    frequencyOverTime: TimeSeriesData[];

    burstEvents: BurstEvent[];

    isAnomalous: boolean;
    anomalyReason: string | null;
}

// ============================================================================
// SESSION
// ============================================================================

export interface LogSession {
    id: string;

    entries: LogEntry[];
    entryCount: number;

    startTime: Date;
    endTime: Date;
    duration: number;

    userId: string | null;
    userAgent: string | null;
    ipAddress: string | null;

    eventsByLevel: {
        error: number;
        warn: number;
        info: number;
        debug: number;
    };

    errorFingerprints: string[];

    isAnomaly: boolean;
    anomalyReason: string | null;
    zScore: number | null;
}

// ============================================================================
// ANOMALY
// ============================================================================

export interface Anomaly {
    id: string;
    type: AnomalyType;
    severity: AnomalySeverity;

    timestamp: Date;
    timeRange: { start: Date; end: Date };

    description: string;
    details: string;

    relatedFingerprint: string | null;
    relatedSession: string | null;

    metrics: {
        observed: number;
        expected: number;
        deviation: number;
        zScore: number;
    };
}

// ============================================================================
// LOG HEALTH
// ============================================================================

export interface LogHealthScore {
    overall: number;

    components: {
        parseability: number;
        timestampCoverage: number;
        noiseRatio: number;
        duplicateRatio: number;
    };

    penalties: {
        unparsedLines: number;
        missingTimestamps: number;
        highNoiseRatio: number;
        manyDuplicates: number;
    };

    explanation: string;
}

// ============================================================================
// NOISE PATTERN
// ============================================================================

export interface NoisePattern {
    id: string;
    pattern: string;
    description: string;
    matchCount: number;
    isActive: boolean;
    isBuiltIn: boolean;
}

// ============================================================================
// FILE INFO
// ============================================================================

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    lineCount: number;
    format: LogFormat;
    status: 'pending' | 'parsing' | 'parsed' | 'error';
    error?: string;
}

// ============================================================================
// ANALYSIS RESULT
// ============================================================================

export interface AnalysisProgress {
    phase: 'uploading' | 'parsing' | 'normalizing' | 'fingerprinting' | 'sessions' | 'anomalies' | 'scoring' | 'complete';
    phaseDescription: string;
    percentage: number;
    currentFile: string;
    linesParsed: number;
    totalLines: number;
    timestampsFound: number;
    errorsDetected: number;
    sessionsFound: number;
    uniquePatterns: number;
}

export interface AnalysisResult {
    files: UploadedFile[];
    entries: LogEntry[];
    fingerprints: Map<string, ErrorFingerprint>;
    sessions: Map<string, LogSession>;
    anomalies: Anomaly[];
    healthScore: LogHealthScore;

    summary: {
        totalLines: number;
        parsedLines: number;
        failedLines: number;
        timeRange: { start: Date; end: Date } | null;
        duration: number;
        byLevel: Record<LogLevel, number>;
        uniqueErrors: number;
        totalOccurrences: number;
        sessionCount: number;
        anomalyCount: number;
    };

    noisePatterns: NoisePattern[];
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface AnalysisSettings {
    // Parsing
    timezoneAssumption: 'local' | 'utc';
    maxLinesPerFile: number;
    attemptJsonRepair: boolean;
    parseStackTraces: boolean;

    // Fingerprinting
    stripNumbers: boolean;
    stripUUIDs: boolean;
    stripIPs: boolean;
    stripFilePaths: boolean;
    customStripPatterns: string[];

    // Session detection
    sessionIdFields: string[];
    sessionIdPattern: string;
    fallbackToIpUa: boolean;

    // Anomaly detection
    burstWindowSize: number;
    burstThresholdZScore: number;
    frequencySpikeThreshold: number;

    // Noise filtering
    autoCollapseDuplicates: boolean;
    duplicateTimeWindow: number;
    enableBuiltInPatterns: boolean;

    // Display
    defaultTab: TabId;
    entriesPerPage: number;
    showLineNumbers: boolean;
    highlightSyntax: boolean;
}

export const DEFAULT_SETTINGS: AnalysisSettings = {
    timezoneAssumption: 'local',
    maxLinesPerFile: 100000,
    attemptJsonRepair: true,
    parseStackTraces: true,

    stripNumbers: true,
    stripUUIDs: true,
    stripIPs: true,
    stripFilePaths: true,
    customStripPatterns: [],

    sessionIdFields: ['sessionId', 'session_id', 'requestId', 'request_id', 'traceId', 'trace_id'],
    sessionIdPattern: '([a-f0-9-]{8,})',
    fallbackToIpUa: true,

    burstWindowSize: 60,
    burstThresholdZScore: 3,
    frequencySpikeThreshold: 200,

    autoCollapseDuplicates: true,
    duplicateTimeWindow: 5,
    enableBuiltInPatterns: true,

    defaultTab: 'overview',
    entriesPerPage: 100,
    showLineNumbers: true,
    highlightSyntax: true,
};

// ============================================================================
// APP STATE
// ============================================================================

export type AppState = 'idle' | 'uploading' | 'analyzing' | 'results' | 'error' | 'no-logs';
export type TabId = 'overview' | 'timeline' | 'errors' | 'sessions' | 'anomalies' | 'raw';

export const BUILT_IN_NOISE_PATTERNS: NoisePattern[] = [
    { id: 'health-check', pattern: 'health\\s*check\\s*(ok|success|passed)', description: 'Health check OK', matchCount: 0, isActive: true, isBuiltIn: true },
    { id: 'heartbeat', pattern: 'heartbeat\\s*(received|sent)', description: 'Heartbeat received', matchCount: 0, isActive: true, isBuiltIn: true },
    { id: 'metrics', pattern: 'metrics\\s*(collected|reported)', description: 'Metrics collected', matchCount: 0, isActive: true, isBuiltIn: true },
    { id: 'liveness', pattern: 'liveness\\s*probe\\s*succeeded', description: 'Liveness probe', matchCount: 0, isActive: true, isBuiltIn: true },
    { id: 'gc-pause', pattern: 'gc\\s*pause.*\\d+\\s*ms', description: 'GC pause', matchCount: 0, isActive: false, isBuiltIn: true },
];
