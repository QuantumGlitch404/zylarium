/* eslint-disable no-restricted-globals */

// --- Types ---
type TokenType = 'identifier' | 'string' | 'property' | 'declaration' | 'comment';

interface Occurrence {
    fileId: string;
    filePath: string;
    line: number;
    charStart: number;
    charEnd: number;
    snippet: string;
    tokenType: TokenType;
}

interface FileData {
    id: string;
    path: string;
    content: string;
}

// --- State ---
const tokenIndex = new Map<string, Occurrence[]>();
const filesMap = new Map<string, FileData>();

// --- Tokenization Patterns by Language ---
interface LanguageProfile {
    identifier: RegExp;
    string: RegExp;
    comment: RegExp[];
    declarationKeywords: string[];
}

const COMMON_IDENTIFIER = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
const COMMON_STRING = /(["'`])(?:(?=(\\?))\2.)*?\1/g;

const LANGUAGES: Record<string, LanguageProfile> = {
    // TypeScript / JavaScript / Java / C# / C++
    'default': {
        identifier: COMMON_IDENTIFIER,
        string: COMMON_STRING,
        comment: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        declarationKeywords: ['class', 'function', 'const', 'let', 'var', 'interface', 'type', 'enum', 'public', 'private', 'protected']
    },
    // Python
    'py': {
        identifier: COMMON_IDENTIFIER,
        string: /(["'])(?:(?=(\\?))\2.)*?\1/g, // Simplified
        comment: [/#.*$/gm],
        declarationKeywords: ['def', 'class', 'lambda']
    },
    // Go
    'go': {
        identifier: COMMON_IDENTIFIER,
        string: COMMON_STRING,
        comment: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        declarationKeywords: ['func', 'type', 'var', 'const', 'struct', 'interface']
    },
    // Rust
    'rs': {
        identifier: COMMON_IDENTIFIER,
        string: COMMON_STRING,
        comment: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        declarationKeywords: ['fn', 'struct', 'enum', 'trait', 'impl', 'let', 'const', 'static']
    },
    // Ruby
    'rb': {
        identifier: /[a-zA-Z_$@][a-zA-Z0-9_$]*/g, // Allow @ for instance vars
        string: COMMON_STRING,
        comment: [/#.*$/gm],
        declarationKeywords: ['def', 'class', 'module']
    },
    // PHP
    'php': {
        identifier: /[a-zA-Z_$][a-zA-Z0-9_$]*/g,
        string: COMMON_STRING,
        comment: [/\/\/.*$/gm, /#.*$/gm, /\/\*[\s\S]*?\*\//g],
        declarationKeywords: ['function', 'class', 'interface', 'trait', 'const', 'public', 'private', 'protected']
    }
};

const getLanguageProfile = (ext: string): LanguageProfile => {
    return LANGUAGES[ext] || LANGUAGES['default'];
};

// --- Worker Message Handler ---
self.onmessage = async (e: MessageEvent) => {
    const { type, payload, id } = e.data;

    try {
        switch (type) {
            case 'RESET':
                tokenIndex.clear();
                filesMap.clear();
                self.postMessage({ type: 'RESET_COMPLETE', id });
                break;

            case 'INDEX_CHUNK':
                // Payload: { files: FileData[] }
                await handleIndexChunk(payload.files);
                // We don't send COMPLETE here, just maybe a progress acknowledgment if needed
                // But handleIndexChunk handles progress emission
                break;

            case 'INDEX_FINISH':
                self.postMessage({ type: 'COMPLETE', id, stats: { totalTokens: tokenIndex.size, totalFiles: filesMap.size } });
                break;

            case 'SEARCH':
                const results = await handleSearch(payload.query, payload.mode, payload.options);
                self.postMessage({ type: 'RESULTS', id, data: results });
                break;

            case 'DEAD_CODE':
                const deadCode = await handleDeadCodeAnalysis(payload.files || []);
                self.postMessage({ type: 'RESULTS', id, data: { matches: deadCode, totalFiles: 0, durationMs: 0 } });
                break;

            default:
                console.warn('Unknown worker message type:', type);
        }
    } catch (error: any) {
        self.postMessage({ type: 'ERROR', id, error: error.message });
    }
};

// --- Core Functions ---

async function handleIndexChunk(files: FileData[]) {
    // Process a batch of files
    for (const file of files) {
        filesMap.set(file.id, file);

        // 1. Detect Language
        const ext = file.path.split('.').pop()?.toLowerCase() || 'default';
        const profile = getLanguageProfile(ext);

        indexFile(file, profile);

        // Report specific file being processed
        self.postMessage({
            type: 'PROGRESS',
            payload: { percent: -1, file: file.path } // -1 indicates "indeterminate" or "processing"
        });
    }
}

function indexFile(file: FileData, profile: LanguageProfile) {
    const content = file.content;
    const lines = content.split(/\r?\n/);

    // Pre-calculate declaration lines (heuristic)
    // We look for patterns like "class MyClass" or "function myFunc"
    // This is a naive declaration detector
    const declarationLines = new Set<number>();

    // We can run a quick pass for declarations keywords
    profile.declarationKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)`, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
            // Find which line this match is on
            const lineNumber = content.substring(0, match.index).split('\n').length;
            declarationLines.add(lineNumber);
        }
    });

    lines.forEach((lineContent, lineIndex) => {
        const lineNum = lineIndex + 1;
        if (!lineContent.trim()) return;

        // 1. Find all identifiers
        // Use a clean regex instance for every line to avoid state issues with global flag
        const idRegex = new RegExp(profile.identifier.source, 'g');
        let match;

        while ((match = idRegex.exec(lineContent)) !== null) {
            const token = match[0];
            const charStart = match.index;
            const charEnd = match.index + token.length;

            // Skip short tokens or numbers only
            if (token.length < 2 || /^\d+$/.test(token)) continue;

            // Determine if declaration
            // Naive check: if line lineNum is in declarationLines, mark as potential declaration
            // Better check: check if preceded by declaration keyword on same line
            let isDeclaration = false;
            // Immediate check: look at words before this token on this line
            const preceding = lineContent.substring(0, charStart).trim();
            const words = preceding.split(/\s+/);
            const lastWord = words[words.length - 1];
            if (profile.declarationKeywords.includes(lastWord)) {
                isDeclaration = true;
            }

            const occurrence: Occurrence = {
                fileId: file.id,
                filePath: file.path,
                line: lineNum,
                charStart,
                charEnd,
                snippet: lineContent.trim(),
                tokenType: isDeclaration ? 'declaration' : 'identifier'
            };

            if (!tokenIndex.has(token)) {
                tokenIndex.set(token, []);
            }
            tokenIndex.get(token)!.push(occurrence);
        }
    });
}

async function handleSearch(query: string, mode: 'exact' | 'regex' | 'fuzzy', options: any) {
    const results: Occurrence[] = [];
    const tStart = performance.now();
    const limit = 5000; // Hard limit for safety

    if (mode === 'exact') {
        const matches = tokenIndex.get(query);
        if (matches) {
            results.push(...matches);
        }
    }
    else if (mode === 'regex') {
        try {
            const regex = new RegExp(query, options?.flags || 'i');
            let count = 0;
            for (const [token, occurrences] of tokenIndex.entries()) {
                if (regex.test(token)) {
                    results.push(...occurrences);
                    count += occurrences.length;
                    if (count > limit) break;
                }
            }
        } catch (e) {
            throw new Error(`Invalid Regex: ${e}`);
        }
    }
    else if (mode === 'fuzzy') {
        const maxDist = options?.maxDistance || 2;
        const lowerQuery = query.toLowerCase();
        let count = 0;

        for (const [token, occurrences] of tokenIndex.entries()) {
            if (Math.abs(token.length - query.length) > maxDist + 1) continue;

            const dist = levenshteinBase(token.toLowerCase(), lowerQuery);
            if (dist <= maxDist) {
                results.push(...occurrences);
                count += occurrences.length;
                if (count > limit) break;
            }
        }
    }

    const duration = performance.now() - tStart;

    return {
        matches: results.slice(0, limit),
        totalFiles: new Set(results.map(r => r.fileId)).size,
        durationMs: Math.round(duration)
    };
}

function levenshteinBase(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// --- Dead Code Analysis ---
async function handleDeadCodeAnalysis(files: FileData[]) {
    // 1. Identify all exported symbols (Export map)
    // 2. Scan for usages of these symbols in other files
    // 3. Return symbols with 0 usages (excluding self)

    // Simplification for this iteration:
    // Find declarations that are NOT used in any other file

    const deadCandidates: Occurrence[] = [];
    const allTokens = new Set(tokenIndex.keys());

    // Iterate all tokens, find 'declaration' types
    for (const [token, occurrences] of tokenIndex.entries()) {
        const declarations = occurrences.filter(o => o.tokenType === 'declaration');

        if (declarations.length > 0) {
            // Check if this token appears anywhere else as non-declaration
            // or as declaration in another file (re-export?)
            // If total occurrences == declarations.length, it means it's ONLY declared, never used

            // Refinement: Usage means tokenType == 'identifier' (or 'property' etc)
            const usages = occurrences.filter(o => o.tokenType !== 'declaration');

            if (usages.length === 0) {
                deadCandidates.push(...declarations);
            }
        }
    }

    return deadCandidates;
}
