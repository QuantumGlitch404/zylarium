// Session Reconstructor Engine - Group log entries by session

import { LogEntry, LogSession, AnalysisSettings } from '../types';
import { extractSessionId } from './LogParser';

// ============================================================================
// SESSION RECONSTRUCTION
// ============================================================================

export function reconstructSessions(entries: LogEntry[], settings: AnalysisSettings): Map<string, LogSession> {
    const sessions = new Map<string, LogSession>();

    // First pass: extract session IDs
    for (const entry of entries) {
        if (!entry.sessionId) {
            entry.sessionId = extractSessionId(entry, settings);
        }
    }

    // Second pass: group by session ID
    for (const entry of entries) {
        if (!entry.sessionId) continue;

        const sessionId = entry.sessionId;

        if (sessions.has(sessionId)) {
            const session = sessions.get(sessionId)!;
            session.entries.push(entry);
            session.entryCount++;

            // Update time range
            if (entry.timestamp) {
                if (entry.timestamp < session.startTime) {
                    session.startTime = entry.timestamp;
                }
                if (entry.timestamp > session.endTime) {
                    session.endTime = entry.timestamp;
                }
            }

            // Update level counts
            switch (entry.level) {
                case 'ERROR':
                case 'FATAL':
                    session.eventsByLevel.error++;
                    break;
                case 'WARN':
                    session.eventsByLevel.warn++;
                    break;
                case 'INFO':
                    session.eventsByLevel.info++;
                    break;
                case 'DEBUG':
                case 'TRACE':
                    session.eventsByLevel.debug++;
                    break;
            }

            // Track error fingerprints
            if ((entry.level === 'ERROR' || entry.level === 'FATAL') && entry.fingerprint) {
                if (!session.errorFingerprints.includes(entry.fingerprint)) {
                    session.errorFingerprints.push(entry.fingerprint);
                }
            }

            // Update user info if available
            if (!session.userId && entry.userId) {
                session.userId = entry.userId;
            }
            if (!session.ipAddress && entry.metadata.ip) {
                session.ipAddress = entry.metadata.ip;
            }
            if (!session.userAgent && entry.metadata.userAgent) {
                session.userAgent = entry.metadata.userAgent;
            }
        } else {
            const newSession: LogSession = {
                id: sessionId,
                entries: [entry],
                entryCount: 1,
                startTime: entry.timestamp || new Date(),
                endTime: entry.timestamp || new Date(),
                duration: 0,
                userId: entry.userId,
                userAgent: entry.metadata.userAgent || entry.metadata.user_agent || null,
                ipAddress: entry.metadata.ip || entry.metadata.ipAddress || entry.metadata.ip_address || null,
                eventsByLevel: {
                    error: entry.level === 'ERROR' || entry.level === 'FATAL' ? 1 : 0,
                    warn: entry.level === 'WARN' ? 1 : 0,
                    info: entry.level === 'INFO' ? 1 : 0,
                    debug: entry.level === 'DEBUG' || entry.level === 'TRACE' ? 1 : 0,
                },
                errorFingerprints: (entry.level === 'ERROR' || entry.level === 'FATAL') && entry.fingerprint
                    ? [entry.fingerprint]
                    : [],
                isAnomaly: false,
                anomalyReason: null,
                zScore: null,
            };

            sessions.set(sessionId, newSession);
        }
    }

    // Third pass: calculate duration and sort entries
    for (const [id, session] of sessions) {
        session.duration = session.endTime.getTime() - session.startTime.getTime();
        session.entries.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return a.timestamp.getTime() - b.timestamp.getTime();
        });
    }

    return sessions;
}

// ============================================================================
// SESSION ANOMALY DETECTION
// ============================================================================

export function detectSessionAnomalies(sessions: Map<string, LogSession>): void {
    const sessionArr = Array.from(sessions.values());

    if (sessionArr.length < 3) return; // Need at least 3 sessions for statistics

    // Calculate error count statistics
    const errorCounts = sessionArr.map(s => s.eventsByLevel.error);
    const mean = errorCounts.reduce((a, b) => a + b, 0) / errorCounts.length;
    const variance = errorCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / errorCounts.length;
    const stdDev = Math.sqrt(variance);

    // Flag outlier sessions
    for (const session of sessionArr) {
        if (stdDev > 0) {
            const zScore = (session.eventsByLevel.error - mean) / stdDev;
            session.zScore = zScore;

            if (Math.abs(zScore) > 3) {
                session.isAnomaly = true;
                session.anomalyReason = `Error count (${session.eventsByLevel.error}) is ${Math.abs(zScore).toFixed(1)} standard deviations from average (${mean.toFixed(0)})`;
            }
        }
    }
}

// ============================================================================
// SESSION STATS
// ============================================================================

export function getSessionStats(sessions: Map<string, LogSession>): {
    totalSessions: number;
    avgDuration: number;
    avgEvents: number;
    avgErrors: number;
    sessionsWithErrors: number;
    anomalySessions: number;
} {
    const sessionArr = Array.from(sessions.values());

    if (sessionArr.length === 0) {
        return {
            totalSessions: 0,
            avgDuration: 0,
            avgEvents: 0,
            avgErrors: 0,
            sessionsWithErrors: 0,
            anomalySessions: 0,
        };
    }

    const totalDuration = sessionArr.reduce((sum, s) => sum + s.duration, 0);
    const totalEvents = sessionArr.reduce((sum, s) => sum + s.entryCount, 0);
    const totalErrors = sessionArr.reduce((sum, s) => sum + s.eventsByLevel.error, 0);
    const withErrors = sessionArr.filter(s => s.eventsByLevel.error > 0).length;
    const anomalies = sessionArr.filter(s => s.isAnomaly).length;

    return {
        totalSessions: sessionArr.length,
        avgDuration: totalDuration / sessionArr.length,
        avgEvents: totalEvents / sessionArr.length,
        avgErrors: totalErrors / sessionArr.length,
        sessionsWithErrors: withErrors,
        anomalySessions: anomalies,
    };
}

// ============================================================================
// FORMAT DURATION
// ============================================================================

export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;

    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${mins}m`;
}
