// Anomaly Detector Engine - Detect bursts, spikes, and outliers

import { LogEntry, ErrorFingerprint, Anomaly, BurstEvent, AnomalySeverity, AnalysisSettings } from '../types';

let anomalyIdCounter = 0;
let burstIdCounter = 0;

function generateAnomalyId(): string {
    return `anomaly_${++anomalyIdCounter}`;
}

function generateBurstId(): string {
    return `burst_${++burstIdCounter}`;
}

// ============================================================================
// ERROR BURST DETECTION
// ============================================================================

export function detectErrorBursts(entries: LogEntry[], settings: AnalysisSettings): BurstEvent[] {
    const bursts: BurstEvent[] = [];

    // Filter to errors only with timestamps
    const errorEntries = entries.filter(e =>
        (e.level === 'ERROR' || e.level === 'FATAL') && e.timestamp
    ).sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());

    if (errorEntries.length < 10) return bursts;

    const windowSize = settings.burstWindowSize * 1000; // Convert to ms
    const slidingStep = windowSize / 6; // Slide by 1/6 of window

    if (errorEntries.length === 0) return bursts;

    const firstTime = errorEntries[0].timestamp!.getTime();
    const lastTime = errorEntries[errorEntries.length - 1].timestamp!.getTime();

    // Count errors per window
    const windowCounts: { start: number; end: number; count: number; fingerprints: Map<string, number> }[] = [];

    for (let windowStart = firstTime; windowStart < lastTime; windowStart += slidingStep) {
        const windowEnd = windowStart + windowSize;
        const inWindow = errorEntries.filter(e => {
            const ts = e.timestamp!.getTime();
            return ts >= windowStart && ts < windowEnd;
        });

        const fingerprints = new Map<string, number>();
        for (const entry of inWindow) {
            fingerprints.set(entry.fingerprint, (fingerprints.get(entry.fingerprint) || 0) + 1);
        }

        windowCounts.push({
            start: windowStart,
            end: windowEnd,
            count: inWindow.length,
            fingerprints,
        });
    }

    if (windowCounts.length < 3) return bursts;

    // Calculate mean and stdDev
    const counts = windowCounts.map(w => w.count);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    const threshold = mean + (settings.burstThresholdZScore * stdDev);

    // Find bursts
    let inBurst = false;
    let burstStart: number | null = null;
    let burstFingerprints = new Map<string, number>();
    let burstCount = 0;

    for (const window of windowCounts) {
        if (window.count > threshold) {
            if (!inBurst) {
                inBurst = true;
                burstStart = window.start;
                burstFingerprints = new Map(window.fingerprints);
                burstCount = window.count;
            } else {
                // Merge fingerprints
                for (const [fp, count] of window.fingerprints) {
                    burstFingerprints.set(fp, (burstFingerprints.get(fp) || 0) + count);
                }
                burstCount += window.count;
            }
        } else if (inBurst) {
            // End of burst
            const burstEnd = window.start;

            // Find primary fingerprint
            let primaryFp = '';
            let maxCount = 0;
            for (const [fp, count] of burstFingerprints) {
                if (count > maxCount) {
                    maxCount = count;
                    primaryFp = fp;
                }
            }

            const normalRate = mean * (60000 / windowSize); // per minute
            const burstRate = burstCount * (60000 / (burstEnd - burstStart!)); // per minute
            const spikeFactor = burstRate / normalRate;

            const severity: AnomalySeverity = spikeFactor >= 20 ? 'HIGH' : spikeFactor >= 5 ? 'MEDIUM' : 'LOW';

            bursts.push({
                id: generateBurstId(),
                startTime: new Date(burstStart!),
                endTime: new Date(burstEnd),
                duration: burstEnd - burstStart!,
                eventCount: burstCount,
                normalRate,
                burstRate,
                spikeFactor,
                primaryFingerprint: primaryFp,
                affectedFingerprints: Array.from(burstFingerprints.keys()),
                affectedSessions: [],
                severity,
            });

            inBurst = false;
            burstStart = null;
            burstFingerprints.clear();
            burstCount = 0;
        }
    }

    return bursts;
}

// ============================================================================
// FREQUENCY SPIKE DETECTION
// ============================================================================

export function detectFrequencySpikes(
    fingerprints: Map<string, ErrorFingerprint>,
    settings: AnalysisSettings
): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const threshold = settings.frequencySpikeThreshold / 100; // Convert percentage to ratio

    for (const [id, fp] of fingerprints) {
        const timeSeries = fp.frequencyOverTime;
        if (timeSeries.length < 2) continue;

        for (let i = 1; i < timeSeries.length; i++) {
            const prev = timeSeries[i - 1].value;
            const curr = timeSeries[i].value;

            if (prev === 0) continue;

            const change = (curr - prev) / prev;

            if (change >= threshold) {
                const severity: AnomalySeverity = change >= 10 ? 'HIGH' : change >= 5 ? 'MEDIUM' : 'LOW';

                anomalies.push({
                    id: generateAnomalyId(),
                    type: 'frequency_spike',
                    severity,
                    timestamp: timeSeries[i].timestamp,
                    timeRange: {
                        start: timeSeries[i - 1].timestamp,
                        end: timeSeries[i].timestamp,
                    },
                    description: `Frequency spike in "${fp.template.substring(0, 50)}..."`,
                    details: `Rate increased by ${(change * 100).toFixed(0)}% (from ${prev} to ${curr})`,
                    relatedFingerprint: id,
                    relatedSession: null,
                    metrics: {
                        observed: curr,
                        expected: prev,
                        deviation: curr - prev,
                        zScore: change,
                    },
                });

                fp.isAnomalous = true;
                fp.anomalyReason = `Frequency spike detected: ${(change * 100).toFixed(0)}% increase`;
            }
        }
    }

    return anomalies;
}

// ============================================================================
// CONVERT BURSTS TO ANOMALIES
// ============================================================================

export function burstsToAnomalies(bursts: BurstEvent[]): Anomaly[] {
    return bursts.map(burst => ({
        id: generateAnomalyId(),
        type: 'error_burst' as const,
        severity: burst.severity,
        timestamp: burst.startTime,
        timeRange: {
            start: burst.startTime,
            end: burst.endTime,
        },
        description: `Error burst: ${burst.eventCount} errors in ${Math.round(burst.duration / 1000)} seconds`,
        details: `Normal rate: ${burst.normalRate.toFixed(1)}/min, Burst rate: ${burst.burstRate.toFixed(1)}/min, Spike factor: ${burst.spikeFactor.toFixed(1)}x`,
        relatedFingerprint: burst.primaryFingerprint,
        relatedSession: null,
        metrics: {
            observed: burst.eventCount,
            expected: burst.normalRate * (burst.duration / 60000),
            deviation: burst.eventCount - (burst.normalRate * (burst.duration / 60000)),
            zScore: burst.spikeFactor,
        },
    }));
}

// ============================================================================
// PATTERN CHANGE DETECTION
// ============================================================================

export function detectPatternChanges(
    fingerprints: Map<string, ErrorFingerprint>
): Anomaly[] {
    const anomalies: Anomaly[] = [];

    for (const [id, fp] of fingerprints) {
        const timeSeries = fp.frequencyOverTime;
        if (timeSeries.length < 3) continue;

        // Check if error suddenly appeared (first half empty, second half active)
        const midpoint = Math.floor(timeSeries.length / 2);
        const firstHalf = timeSeries.slice(0, midpoint);
        const secondHalf = timeSeries.slice(midpoint);

        const firstSum = firstHalf.reduce((sum, d) => sum + d.value, 0);
        const secondSum = secondHalf.reduce((sum, d) => sum + d.value, 0);

        if (firstSum === 0 && secondSum > 10) {
            anomalies.push({
                id: generateAnomalyId(),
                type: 'pattern_change',
                severity: 'MEDIUM',
                timestamp: timeSeries[midpoint].timestamp,
                timeRange: {
                    start: timeSeries[0].timestamp,
                    end: timeSeries[timeSeries.length - 1].timestamp,
                },
                description: `New error pattern appeared: "${fp.template.substring(0, 50)}..."`,
                details: `No occurrences in first half, ${secondSum} occurrences in second half`,
                relatedFingerprint: id,
                relatedSession: null,
                metrics: {
                    observed: secondSum,
                    expected: 0,
                    deviation: secondSum,
                    zScore: 0,
                },
            });
        }
    }

    return anomalies;
}

// ============================================================================
// AGGREGATE ALL ANOMALIES
// ============================================================================

export function detectAllAnomalies(
    entries: LogEntry[],
    fingerprints: Map<string, ErrorFingerprint>,
    settings: AnalysisSettings
): Anomaly[] {
    const allAnomalies: Anomaly[] = [];

    // Detect bursts
    const bursts = detectErrorBursts(entries, settings);
    allAnomalies.push(...burstsToAnomalies(bursts));

    // Link bursts to fingerprints
    for (const burst of bursts) {
        const fp = fingerprints.get(burst.primaryFingerprint);
        if (fp) {
            fp.burstEvents.push(burst);
        }
    }

    // Detect frequency spikes
    allAnomalies.push(...detectFrequencySpikes(fingerprints, settings));

    // Detect pattern changes
    allAnomalies.push(...detectPatternChanges(fingerprints));

    // Sort by severity then timestamp
    allAnomalies.sort((a, b) => {
        const severityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
    });

    return allAnomalies;
}

export function resetAnomalyDetector(): void {
    anomalyIdCounter = 0;
    burstIdCounter = 0;
}
