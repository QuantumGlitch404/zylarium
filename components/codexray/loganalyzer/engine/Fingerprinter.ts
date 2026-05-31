// Fingerprinter Engine - Normalize messages and group by fingerprint

import { LogEntry, ErrorFingerprint, AnalysisSettings, TimeSeriesData } from '../types';

// ============================================================================
// MESSAGE NORMALIZATION
// ============================================================================

export function normalizeMessage(message: string, settings: AnalysisSettings): string {
    let normalized = message;

    // Strip UUIDs
    if (settings.stripUUIDs) {
        normalized = normalized.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '{uuid}');
        normalized = normalized.replace(/[a-f0-9]{32}/gi, '{uuid}');
    }

    // Strip hex IDs
    normalized = normalized.replace(/0x[a-f0-9]+/gi, '{hex}');

    // Strip IPs
    if (settings.stripIPs) {
        normalized = normalized.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '{ip}');
        normalized = normalized.replace(/[a-f0-9:]{10,}/gi, '{ipv6}');
    }

    // Strip file paths
    if (settings.stripFilePaths) {
        normalized = normalized.replace(/[\/\\][\w\-\.\/\\]+\.[a-z]+/gi, '{path}');
        normalized = normalized.replace(/[A-Z]:\\[\w\-\.\\]+/gi, '{path}');
    }

    // Strip URLs
    normalized = normalized.replace(/https?:\/\/[^\s]+/gi, '{url}');

    // Strip email addresses
    normalized = normalized.replace(/[\w\.-]+@[\w\.-]+\.\w+/gi, '{email}');

    // Strip timestamps
    normalized = normalized.replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\s]*/g, '{timestamp}');

    // Strip durations
    normalized = normalized.replace(/\d+\s*(ms|s|seconds?|minutes?|hours?|milliseconds?)/gi, '{duration}');

    // Strip memory sizes
    normalized = normalized.replace(/\d+(\.\d+)?\s*(KB|MB|GB|TB|bytes?)/gi, '{memory}');

    // Strip numbers (last, to not interfere with other patterns)
    if (settings.stripNumbers) {
        normalized = normalized.replace(/\b\d+\b/g, '{n}');
    }

    // Apply custom patterns
    for (const pattern of settings.customStripPatterns) {
        try {
            const regex = new RegExp(pattern, 'gi');
            normalized = normalized.replace(regex, '{custom}');
        } catch { }
    }

    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
}

// ============================================================================
// FINGERPRINT GENERATION
// ============================================================================

function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 16);
}

export function generateFingerprint(normalizedMessage: string, level: string): string {
    const input = `${level}:${normalizedMessage}`;
    return simpleHash(input);
}

// ============================================================================
// GROUP BY FINGERPRINT
// ============================================================================

export function fingerprintEntries(entries: LogEntry[], settings: AnalysisSettings): Map<string, ErrorFingerprint> {
    const fingerprints = new Map<string, ErrorFingerprint>();

    // First pass: normalize and fingerprint all entries
    for (const entry of entries) {
        entry.messageNormalized = normalizeMessage(entry.message, settings);
        entry.fingerprint = generateFingerprint(entry.messageNormalized, entry.level);
    }

    // Second pass: group errors/warnings by fingerprint
    const errorEntries = entries.filter(e => e.level === 'ERROR' || e.level === 'WARN' || e.level === 'FATAL');

    for (const entry of errorEntries) {
        const fp = entry.fingerprint;

        if (fingerprints.has(fp)) {
            const existing = fingerprints.get(fp)!;
            existing.occurrences.push(entry);
            existing.count++;

            if (entry.timestamp && entry.timestamp > existing.lastSeen) {
                existing.lastSeen = entry.timestamp;
            }

            if (entry.sessionId && !existing.affectedSessions.includes(entry.sessionId)) {
                existing.affectedSessions.push(entry.sessionId);
                existing.affectedSessionCount++;
            }

            // Add sample message if unique (up to 5)
            if (existing.sampleMessages.length < 5 && !existing.sampleMessages.includes(entry.message)) {
                existing.sampleMessages.push(entry.message);
            }
        } else {
            const newFp: ErrorFingerprint = {
                id: fp,
                template: entry.messageNormalized,
                occurrences: [entry],
                count: 1,
                firstSeen: entry.timestamp || new Date(),
                lastSeen: entry.timestamp || new Date(),
                affectedSessions: entry.sessionId ? [entry.sessionId] : [],
                affectedSessionCount: entry.sessionId ? 1 : 0,
                level: entry.level as 'ERROR' | 'WARN',
                sampleMessages: [entry.message],
                stackTrace: entry.stackTrace,
                frequencyOverTime: [],
                burstEvents: [],
                isAnomalous: false,
                anomalyReason: null,
            };

            fingerprints.set(fp, newFp);
        }
    }

    // Calculate frequency over time for each fingerprint
    for (const [id, fp] of fingerprints) {
        fp.frequencyOverTime = calculateFrequencyOverTime(fp.occurrences);
    }

    return fingerprints;
}

// ============================================================================
// FREQUENCY CALCULATION
// ============================================================================

function calculateFrequencyOverTime(entries: LogEntry[]): TimeSeriesData[] {
    if (entries.length === 0) return [];

    const withTimestamps = entries.filter(e => e.timestamp);
    if (withTimestamps.length === 0) return [];

    // Sort by timestamp
    withTimestamps.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());

    const first = withTimestamps[0].timestamp!;
    const last = withTimestamps[withTimestamps.length - 1].timestamp!;
    const duration = last.getTime() - first.getTime();

    // Create buckets (max 24 buckets)
    const bucketCount = Math.min(24, Math.max(1, Math.floor(duration / (1000 * 60 * 60))));
    const bucketSize = duration / bucketCount;

    const buckets: TimeSeriesData[] = [];

    for (let i = 0; i < bucketCount; i++) {
        const bucketStart = first.getTime() + (i * bucketSize);
        const bucketEnd = bucketStart + bucketSize;

        const count = withTimestamps.filter(e => {
            const ts = e.timestamp!.getTime();
            return ts >= bucketStart && ts < bucketEnd;
        }).length;

        buckets.push({
            timestamp: new Date(bucketStart),
            value: count,
        });
    }

    return buckets;
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

export function detectDuplicates(entries: LogEntry[], timeWindowSeconds: number): void {
    const sortedEntries = [...entries].sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return a.timestamp.getTime() - b.timestamp.getTime();
    });

    for (let i = 1; i < sortedEntries.length; i++) {
        const current = sortedEntries[i];
        const previous = sortedEntries[i - 1];

        if (!current.timestamp || !previous.timestamp) continue;

        const timeDiff = current.timestamp.getTime() - previous.timestamp.getTime();

        if (timeDiff <= timeWindowSeconds * 1000) {
            // Check similarity
            if (current.fingerprint === previous.fingerprint) {
                current.isDuplicate = true;
                current.duplicateOf = previous.id;
            }
        }
    }
}
