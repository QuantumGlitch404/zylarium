// Health Scorer Engine - Calculate log health score

import { LogEntry, LogHealthScore, NoisePattern, BUILT_IN_NOISE_PATTERNS } from '../types';

// ============================================================================
// NOISE DETECTION
// ============================================================================

export function applyNoisePatterns(entries: LogEntry[], patterns: NoisePattern[]): number {
    let noiseCount = 0;
    const activePatterns = patterns.filter(p => p.isActive);

    for (const entry of entries) {
        for (const pattern of activePatterns) {
            try {
                const regex = new RegExp(pattern.pattern, 'i');
                if (regex.test(entry.message)) {
                    entry.isNoise = true;
                    pattern.matchCount++;
                    noiseCount++;
                    break;
                }
            } catch { }
        }
    }

    return noiseCount;
}

// ============================================================================
// HEALTH SCORE CALCULATION
// ============================================================================

export function calculateHealthScore(entries: LogEntry[]): LogHealthScore {
    const totalLines = entries.length;

    if (totalLines === 0) {
        return {
            overall: 0,
            components: {
                parseability: 0,
                timestampCoverage: 0,
                noiseRatio: 0,
                duplicateRatio: 0,
            },
            penalties: {
                unparsedLines: 0,
                missingTimestamps: 0,
                highNoiseRatio: 0,
                manyDuplicates: 0,
            },
            explanation: 'No log entries to analyze',
        };
    }

    // Calculate components
    const parsedLines = entries.filter(e => e.isParsed).length;
    const linesWithTimestamp = entries.filter(e => e.timestamp !== null).length;
    const noiseLines = entries.filter(e => e.isNoise).length;
    const duplicateLines = entries.filter(e => e.isDuplicate).length;

    const parseability = (parsedLines / totalLines) * 100;
    const timestampCoverage = (linesWithTimestamp / totalLines) * 100;
    const noiseRatio = noiseLines / totalLines;
    const duplicateRatio = duplicateLines / totalLines;

    // Calculate penalties
    const unparsedPenalty = ((totalLines - parsedLines) / totalLines) * 40;
    const timestampPenalty = ((totalLines - linesWithTimestamp) / totalLines) * 30;
    const noisePenalty = noiseRatio * 20;
    const duplicatePenalty = duplicateRatio * 10;

    const totalPenalty = unparsedPenalty + timestampPenalty + noisePenalty + duplicatePenalty;
    const overall = Math.max(0, Math.min(100, 100 - totalPenalty));

    // Build explanation
    const explanations: string[] = [];

    if (parseability < 90) {
        explanations.push(`${(100 - parseability).toFixed(1)}% of lines could not be parsed`);
    }

    if (timestampCoverage < 95) {
        explanations.push(`${(100 - timestampCoverage).toFixed(1)}% of lines missing timestamps`);
    }

    if (noiseRatio > 0.15) {
        explanations.push(`${(noiseRatio * 100).toFixed(0)}% of lines appear to be noise`);
    }

    if (duplicateRatio > 0.10) {
        explanations.push(`${(duplicateRatio * 100).toFixed(0)}% of lines are duplicates`);
    }

    if (explanations.length === 0) {
        explanations.push('Logs are well-structured and clean');
    }

    return {
        overall: Math.round(overall),
        components: {
            parseability,
            timestampCoverage,
            noiseRatio: noiseRatio * 100,
            duplicateRatio: duplicateRatio * 100,
        },
        penalties: {
            unparsedLines: Math.round(unparsedPenalty),
            missingTimestamps: Math.round(timestampPenalty),
            highNoiseRatio: Math.round(noisePenalty),
            manyDuplicates: Math.round(duplicatePenalty),
        },
        explanation: explanations.join('. ') + '.',
    };
}

// ============================================================================
// HEALTH SCORE INTERPRETATION
// ============================================================================

export function interpretHealthScore(score: number): { label: string; color: string } {
    if (score >= 90) return { label: 'Excellent', color: 'green' };
    if (score >= 70) return { label: 'Good', color: 'teal' };
    if (score >= 50) return { label: 'Fair', color: 'yellow' };
    return { label: 'Poor', color: 'red' };
}

// ============================================================================
// SUGGESTIONS
// ============================================================================

export function generateSuggestions(healthScore: LogHealthScore): string[] {
    const suggestions: string[] = [];

    if (healthScore.components.noiseRatio > 15) {
        suggestions.push('Add noise filters for repetitive log patterns');
    }

    if (healthScore.components.duplicateRatio > 10) {
        suggestions.push('Consider reducing verbose debug logging');
    }

    if (healthScore.components.parseability < 90) {
        suggestions.push('Review unparseable lines for format consistency');
    }

    if (healthScore.components.timestampCoverage < 95) {
        suggestions.push('Ensure all log entries include timestamps');
    }

    return suggestions;
}

// ============================================================================
// INITIALIZE NOISE PATTERNS
// ============================================================================

export function initializeNoisePatterns(): NoisePattern[] {
    return BUILT_IN_NOISE_PATTERNS.map(p => ({ ...p, matchCount: 0 }));
}
