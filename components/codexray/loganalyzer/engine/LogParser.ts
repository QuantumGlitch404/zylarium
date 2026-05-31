// Log Parser Engine - Parse multiple log formats

import { LogEntry, LogLevel, LogFormat, UploadedFile, AnalysisSettings } from '../types';

let entryIdCounter = 0;

function generateEntryId(): string {
    return `entry_${++entryIdCounter}`;
}

// ============================================================================
// FORMAT DETECTION
// ============================================================================

export function detectFormat(content: string): LogFormat {
    const lines = content.split('\n').slice(0, 10).filter(l => l.trim());

    if (lines.length === 0) return 'text';

    // Check for JSON array
    if (content.trim().startsWith('[')) {
        try {
            JSON.parse(content);
            return 'json';
        } catch { }
    }

    // Check for JSONL
    try {
        JSON.parse(lines[0]);
        return 'jsonl';
    } catch { }

    // Check for CSV (has comma-separated header-like first line)
    const firstLine = lines[0];
    if (firstLine.includes(',') && !firstLine.includes(' ') && firstLine.split(',').length >= 3) {
        const potentialHeaders = firstLine.toLowerCase();
        if (potentialHeaders.includes('timestamp') || potentialHeaders.includes('level') || potentialHeaders.includes('message')) {
            return 'csv';
        }
    }

    return 'text';
}

// ============================================================================
// TIMESTAMP PARSING
// ============================================================================

const TIMESTAMP_PATTERNS = [
    // ISO 8601
    { regex: /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:?\d{2})?)/, format: 'iso' },
    // ISO without T
    { regex: /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/, format: 'iso-space' },
    // Epoch milliseconds (13 digits)
    { regex: /^(\d{13})\b/, format: 'epoch-ms' },
    // Epoch seconds (10 digits)
    { regex: /^(\d{10})\b/, format: 'epoch-s' },
    // Common format
    { regex: /(\w{3}\s+\d{1,2},?\s+\d{4}\s+\d{2}:\d{2}:\d{2})/, format: 'common' },
    // Apache format
    { regex: /\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s[+-]\d{4})\]/, format: 'apache' },
    // Syslog format
    { regex: /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/, format: 'syslog' },
];

export function parseTimestamp(line: string): { timestamp: Date | null; raw: string | null; format: string | null } {
    for (const pattern of TIMESTAMP_PATTERNS) {
        const match = line.match(pattern.regex);
        if (match) {
            const raw = match[1];
            let timestamp: Date | null = null;

            try {
                if (pattern.format === 'epoch-ms') {
                    timestamp = new Date(parseInt(raw));
                } else if (pattern.format === 'epoch-s') {
                    timestamp = new Date(parseInt(raw) * 1000);
                } else {
                    timestamp = new Date(raw);
                }

                if (isNaN(timestamp.getTime())) {
                    timestamp = null;
                }
            } catch {
                timestamp = null;
            }

            return { timestamp, raw, format: pattern.format };
        }
    }

    return { timestamp: null, raw: null, format: null };
}

// ============================================================================
// LOG LEVEL PARSING
// ============================================================================

const LEVEL_MAP: Record<string, LogLevel> = {
    'error': 'ERROR', 'err': 'ERROR', 'e': 'ERROR',
    'warn': 'WARN', 'warning': 'WARN', 'w': 'WARN',
    'info': 'INFO', 'information': 'INFO', 'i': 'INFO',
    'debug': 'DEBUG', 'd': 'DEBUG',
    'trace': 'TRACE', 't': 'TRACE',
    'fatal': 'FATAL', 'critical': 'FATAL', 'crit': 'FATAL',
};

export function parseLogLevel(line: string): { level: LogLevel; raw: string | null } {
    const levelRegex = /\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL|CRITICAL|CRIT|ERR)\b/i;
    const match = line.match(levelRegex);

    if (match) {
        const raw = match[1];
        const level = LEVEL_MAP[raw.toLowerCase()] || 'UNKNOWN';
        return { level, raw };
    }

    return { level: 'UNKNOWN', raw: null };
}

// ============================================================================
// METADATA EXTRACTION
// ============================================================================

export function extractMetadata(message: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Key=value patterns
    const kvPattern = /(\w+)=("[^"]*"|'[^']*'|\S+)/g;
    let match;
    while ((match = kvPattern.exec(message)) !== null) {
        const key = match[1];
        let value = match[2];
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        metadata[key] = value;
    }

    // Key: value patterns
    const colonPattern = /(\w+):\s*([^\s,]+)/g;
    while ((match = colonPattern.exec(message)) !== null) {
        const key = match[1];
        if (!metadata[key]) {
            metadata[key] = match[2];
        }
    }

    return metadata;
}

// ============================================================================
// SESSION ID EXTRACTION
// ============================================================================

export function extractSessionId(entry: LogEntry, settings: AnalysisSettings): string | null {
    // Check metadata for session fields
    for (const field of settings.sessionIdFields) {
        if (entry.metadata[field]) {
            return entry.metadata[field];
        }
    }

    // Check for session ID pattern in message
    const pattern = new RegExp(settings.sessionIdPattern, 'i');
    const match = entry.message.match(pattern);
    if (match) {
        return match[1] || match[0];
    }

    return null;
}

// ============================================================================
// STACK TRACE DETECTION
// ============================================================================

export function extractStackTrace(lines: string[], startIndex: number): string | null {
    const stackLines: string[] = [];

    for (let i = startIndex + 1; i < lines.length && i < startIndex + 30; i++) {
        const line = lines[i];
        // Common stack trace patterns
        if (line.match(/^\s+at\s+/) ||
            line.match(/^\s+\w+\.\w+\(/) ||
            line.match(/^\s+File\s+"/) ||
            line.match(/^\s+\d+:/)) {
            stackLines.push(line);
        } else if (stackLines.length > 0) {
            // Stack trace ended
            break;
        }
    }

    return stackLines.length > 0 ? stackLines.join('\n') : null;
}

// ============================================================================
// PLAIN TEXT PARSER
// ============================================================================

export function parseTextLog(content: string, fileName: string, settings: AnalysisSettings): LogEntry[] {
    const lines = content.split('\n');
    const entries: LogEntry[] = [];

    for (let i = 0; i < Math.min(lines.length, settings.maxLinesPerFile); i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const { timestamp, raw: timestampRaw, format: timestampFormat } = parseTimestamp(line);
        const { level, raw: levelRaw } = parseLogLevel(line);

        // Extract message (remove timestamp and level)
        let message = line;
        if (timestampRaw) {
            message = message.replace(timestampRaw, '').trim();
        }
        if (levelRaw) {
            message = message.replace(new RegExp(`\\[?${levelRaw}\\]?`, 'i'), '').trim();
        }

        const metadata = extractMetadata(message);
        const stackTrace = level === 'ERROR' || level === 'FATAL' ? extractStackTrace(lines, i) : null;

        const entry: LogEntry = {
            id: generateEntryId(),
            lineNumber: i + 1,
            sourceFile: fileName,
            rawContent: line,
            timestamp,
            timestampRaw,
            timestampFormat,
            level,
            levelRaw,
            message,
            messageNormalized: '', // Will be set by fingerprinter
            fingerprint: '', // Will be set by fingerprinter
            metadata,
            sessionId: null, // Will be set later
            requestId: metadata['requestId'] || metadata['request_id'] || null,
            userId: metadata['userId'] || metadata['user_id'] || metadata['user'] || null,
            stackTrace,
            isParsed: true,
            parseErrors: [],
            isNoise: false,
            isDuplicate: false,
            duplicateOf: null,
        };

        entries.push(entry);
    }

    return entries;
}

// ============================================================================
// JSON LINES PARSER
// ============================================================================

export function parseJSONLLog(content: string, fileName: string, settings: AnalysisSettings): LogEntry[] {
    const lines = content.split('\n');
    const entries: LogEntry[] = [];

    const fieldMappings = {
        timestamp: ['time', 'timestamp', 'ts', '@timestamp', 'date', 'datetime'],
        level: ['level', 'severity', 'lvl', 'log_level', 'loglevel'],
        message: ['message', 'msg', 'log', 'text', 'content'],
    };

    for (let i = 0; i < Math.min(lines.length, settings.maxLinesPerFile); i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        let parsed: any;
        try {
            parsed = JSON.parse(line);
        } catch {
            // Try to repair common JSON issues
            if (settings.attemptJsonRepair) {
                try {
                    // Fix trailing commas
                    let fixed = line.replace(/,\s*([}\]])/g, '$1');
                    // Fix single quotes
                    fixed = fixed.replace(/'/g, '"');
                    parsed = JSON.parse(fixed);
                } catch {
                    entries.push(createUnparsedEntry(line, i + 1, fileName, 'Invalid JSON'));
                    continue;
                }
            } else {
                entries.push(createUnparsedEntry(line, i + 1, fileName, 'Invalid JSON'));
                continue;
            }
        }

        // Extract timestamp
        let timestamp: Date | null = null;
        let timestampRaw: string | null = null;
        for (const field of fieldMappings.timestamp) {
            if (parsed[field]) {
                timestampRaw = String(parsed[field]);
                const result = parseTimestamp(timestampRaw);
                timestamp = result.timestamp;
                if (timestamp) break;
            }
        }

        // Extract level
        let level: LogLevel = 'UNKNOWN';
        let levelRaw: string | null = null;
        for (const field of fieldMappings.level) {
            if (parsed[field]) {
                levelRaw = String(parsed[field]);
                const result = parseLogLevel(levelRaw);
                level = result.level;
                if (level !== 'UNKNOWN') break;
            }
        }

        // Extract message
        let message = '';
        for (const field of fieldMappings.message) {
            if (parsed[field]) {
                message = String(parsed[field]);
                break;
            }
        }

        const entry: LogEntry = {
            id: generateEntryId(),
            lineNumber: i + 1,
            sourceFile: fileName,
            rawContent: line,
            timestamp,
            timestampRaw,
            timestampFormat: 'json',
            level,
            levelRaw,
            message,
            messageNormalized: '',
            fingerprint: '',
            metadata: parsed,
            sessionId: parsed.sessionId || parsed.session_id || null,
            requestId: parsed.requestId || parsed.request_id || parsed.traceId || null,
            userId: parsed.userId || parsed.user_id || parsed.user || null,
            stackTrace: parsed.stack || parsed.stackTrace || parsed.error?.stack || null,
            isParsed: true,
            parseErrors: [],
            isNoise: false,
            isDuplicate: false,
            duplicateOf: null,
        };

        entries.push(entry);
    }

    return entries;
}

// ============================================================================
// CSV PARSER
// ============================================================================

export function parseCSVLog(content: string, fileName: string, settings: AnalysisSettings): LogEntry[] {
    const lines = content.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const entries: LogEntry[] = [];

    const timestampIdx = headers.findIndex(h => ['timestamp', 'time', 'date', 'datetime'].includes(h));
    const levelIdx = headers.findIndex(h => ['level', 'severity', 'loglevel'].includes(h));
    const messageIdx = headers.findIndex(h => ['message', 'msg', 'log', 'text'].includes(h));

    for (let i = 1; i < Math.min(lines.length, settings.maxLinesPerFile); i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = parseCSVLine(line);

        let timestamp: Date | null = null;
        let timestampRaw: string | null = null;
        if (timestampIdx >= 0 && values[timestampIdx]) {
            timestampRaw = values[timestampIdx];
            const result = parseTimestamp(timestampRaw);
            timestamp = result.timestamp;
        }

        let level: LogLevel = 'UNKNOWN';
        let levelRaw: string | null = null;
        if (levelIdx >= 0 && values[levelIdx]) {
            levelRaw = values[levelIdx];
            const result = parseLogLevel(levelRaw);
            level = result.level;
        }

        const message = messageIdx >= 0 ? values[messageIdx] || '' : values.slice(Math.max(messageIdx, levelIdx, timestampIdx) + 1).join(' ');

        // Build metadata from remaining columns
        const metadata: Record<string, any> = {};
        headers.forEach((h, idx) => {
            if (values[idx]) metadata[h] = values[idx];
        });

        const entry: LogEntry = {
            id: generateEntryId(),
            lineNumber: i + 1,
            sourceFile: fileName,
            rawContent: line,
            timestamp,
            timestampRaw,
            timestampFormat: 'csv',
            level,
            levelRaw,
            message,
            messageNormalized: '',
            fingerprint: '',
            metadata,
            sessionId: null,
            requestId: null,
            userId: null,
            stackTrace: null,
            isParsed: true,
            parseErrors: [],
            isNoise: false,
            isDuplicate: false,
            duplicateOf: null,
        };

        entries.push(entry);
    }

    return entries;
}

function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

// ============================================================================
// HELPERS
// ============================================================================

function createUnparsedEntry(line: string, lineNumber: number, fileName: string, error: string): LogEntry {
    return {
        id: generateEntryId(),
        lineNumber,
        sourceFile: fileName,
        rawContent: line,
        timestamp: null,
        timestampRaw: null,
        timestampFormat: null,
        level: 'UNKNOWN',
        levelRaw: null,
        message: line,
        messageNormalized: '',
        fingerprint: '',
        metadata: {},
        sessionId: null,
        requestId: null,
        userId: null,
        stackTrace: null,
        isParsed: false,
        parseErrors: [error],
        isNoise: false,
        isDuplicate: false,
        duplicateOf: null,
    };
}

export function parseLogFile(content: string, fileName: string, settings: AnalysisSettings): { entries: LogEntry[]; format: LogFormat } {
    const format = detectFormat(content);
    let entries: LogEntry[];

    switch (format) {
        case 'jsonl':
            entries = parseJSONLLog(content, fileName, settings);
            break;
        case 'json':
            try {
                const arr = JSON.parse(content);
                entries = Array.isArray(arr) ? arr.map((item, i) => {
                    const line = JSON.stringify(item);
                    return parseJSONLLog(line, fileName, settings)[0] || createUnparsedEntry(line, i + 1, fileName, 'Invalid entry');
                }) : [];
            } catch {
                entries = parseTextLog(content, fileName, settings);
            }
            break;
        case 'csv':
            entries = parseCSVLog(content, fileName, settings);
            break;
        default:
            entries = parseTextLog(content, fileName, settings);
    }

    return { entries, format };
}

export function resetParser(): void {
    entryIdCounter = 0;
}
