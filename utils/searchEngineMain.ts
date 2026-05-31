
// --- Types ---
export type TokenType = 'identifier' | 'string' | 'property' | 'declaration' | 'comment';

export interface Occurrence {
    fileId: string;
    filePath: string;
    line: number;
    charStart: number;
    charEnd: number;
    snippet: string;
    tokenType: TokenType;
}

export interface FileData {
    id: string;
    path: string;
    content: string;
}

export interface SearchResult {
    matches: Occurrence[];
    totalFiles: number;
    durationMs: number;
}

// --- Search Options Interface ---
export interface SearchOptions {
    mode: 'exact' | 'regex' | 'fuzzy';
    scope?: 'all' | 'folder' | 'custom';
    extensions?: string[];
    regexFlags?: string[];
}

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
        string: /(["'])(?:(?=(\\?))\2.)*?\1/g,
        comment: [/#.*$/gm],
        declarationKeywords: ['def', 'class', 'lambda']
    },
    // Go
    'go': {
        identifier: COMMON_IDENTIFIER,
        string: COMMON_STRING,
        comment: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        declarationKeywords: ['func', 'type', 'var', 'const', 'struct', 'interface']
    }
};

const getLanguageProfile = (ext: string): LanguageProfile => {
    return LANGUAGES[ext] || LANGUAGES['default'];
};

// --- Search Engine Class ---
export class SearchEngineMain {
    private tokenIndex = new Map<string, Occurrence[]>();
    private filesMap = new Map<string, FileData>();

    public reset() {
        this.tokenIndex.clear();
        this.filesMap.clear();
    }

    public getStats() {
        return {
            totalTokens: this.tokenIndex.size,
            totalFiles: this.filesMap.size
        };
    }

    public async indexFiles(files: FileData[], onProgress?: (file: string) => void) {
        for (const file of files) {
            this.filesMap.set(file.id, file);
            const ext = file.path.split('.').pop()?.toLowerCase() || 'default';
            const profile = getLanguageProfile(ext);

            this.indexFile(file, profile);

            if (onProgress) onProgress(file.path);

            // Yield to main thread to keep UI responsive
            await new Promise(r => setTimeout(r, 0));
        }
    }

    private indexFile(file: FileData, profile: LanguageProfile) {
        const content = file.content;
        const lines = content.split(/\r?\n/);
        const declarationLines = new Set<number>();

        // Pre-scan for declarations
        profile.declarationKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)`, 'g');
            let match;
            while ((match = regex.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                declarationLines.add(lineNumber);
            }
        });

        lines.forEach((lineContent, lineIndex) => {
            const lineNum = lineIndex + 1;
            if (!lineContent.trim()) return;

            const idRegex = new RegExp(profile.identifier.source, 'g');
            let match;

            while ((match = idRegex.exec(lineContent)) !== null) {
                const token = match[0];
                if (token.length < 2 || /^\d+$/.test(token)) continue;

                const charStart = match.index;
                const charEnd = charStart + token.length;

                // Simple declaration check
                let isDeclaration = false;
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

                if (!this.tokenIndex.has(token)) {
                    this.tokenIndex.set(token, []);
                }
                this.tokenIndex.get(token)!.push(occurrence);
            }
        });
    }

    public getAllFiles(): SearchResult {
        const matches: Occurrence[] = [];
        for (const file of this.filesMap.values()) {
            matches.push({
                fileId: file.id,
                filePath: file.path,
                line: 1,
                charStart: 0,
                charEnd: 0,
                snippet: "(File Overview)",
                tokenType: 'identifier'
            });
        }
        return {
            matches,
            totalFiles: this.filesMap.size,
            durationMs: 0
        };
    }

    public search(query: string, options: SearchOptions): SearchResult {
        const { mode, scope = 'all', extensions = [], regexFlags = ['i'] } = options;

        // Browse Mode
        if (!query || query.trim() === '') {
            return this.getAllFiles();
        }

        const matches: Occurrence[] = [];
        const tStart = performance.now();
        const limit = 2000;

        // Filter helper
        const isFileAllowed = (file: FileData): boolean => {
            if (scope === 'custom' && extensions.length > 0) {
                const ext = file.path.split('.').pop()?.toLowerCase();
                if (!ext || !extensions.includes('.' + ext) && !extensions.includes(ext)) {
                    return false;
                }
            }
            // 'folder' scope would require knowing the "active" folder, skipping for now or assumed root
            return true;
        };

        if (mode === 'exact') {
            const result = this.tokenIndex.get(query);
            if (result) {
                // Filter results
                for (const match of result) {
                    if (extensions.length > 0 && scope === 'custom') {
                        // Check file extension
                        const ext = match.filePath.split('.').pop()?.toLowerCase();
                        if (ext && (extensions.includes(ext) || extensions.includes('.' + ext))) {
                            matches.push(match);
                        }
                    } else {
                        matches.push(match);
                    }
                }
            }
        } else if (mode === 'regex') {
            try {
                // Construct flags string
                const flagsStr = (regexFlags || []).join('') || 'i';
                const regex = new RegExp(query, flagsStr);

                let count = 0;
                for (const [token, occurrences] of this.tokenIndex.entries()) {
                    if (regex.test(token)) {
                        for (const occ of occurrences) {
                            if (extensions.length > 0 && scope === 'custom') {
                                const ext = occ.filePath.split('.').pop()?.toLowerCase();
                                if (!ext || (!extensions.includes(ext) && !extensions.includes('.' + ext))) continue;
                            }
                            matches.push(occ);
                            count++;
                        }
                        if (count > limit) break;
                    }
                }
            } catch (e) {
                console.error("Invalid Regex");
            }
        } else if (mode === 'fuzzy') {
            const lowerQuery = query.toLowerCase();
            let count = 0;
            for (const [token, occurrences] of this.tokenIndex.entries()) {
                if (Math.abs(token.length - query.length) > 3) continue;
                if (token.toLowerCase().includes(lowerQuery)) {
                    for (const occ of occurrences) {
                        if (extensions.length > 0 && scope === 'custom') {
                            const ext = occ.filePath.split('.').pop()?.toLowerCase();
                            if (!ext || (!extensions.includes(ext) && !extensions.includes('.' + ext))) continue;
                        }
                        matches.push(occ);
                        count++;
                    }
                    if (count > limit) break;
                }
            }
        }

        const duration = performance.now() - tStart;
        return {
            matches: matches.slice(0, limit),
            totalFiles: new Set(matches.map(m => m.fileId)).size,
            durationMs: Math.round(duration)
        };
    }

    public analyzeDeadCode(): SearchResult {
        const deadCodeMatches: Occurrence[] = [];
        const limit = 2000;

        // 1. Gather all declarations
        const allDeclarations: Occurrence[] = [];
        for (const [token, occurrences] of this.tokenIndex.entries()) {
            occurrences.forEach(occ => {
                if (occ.tokenType === 'declaration') {
                    // Check if this token is used elsewhere
                    const totalUsages = occurrences.length;
                    // If the token appears only ONCE and it is the declaration itself -> DEAD CODE
                    if (totalUsages === 1) {
                        deadCodeMatches.push(occ);
                    }
                }
            });
        }

        return {
            matches: deadCodeMatches.slice(0, limit),
            totalFiles: new Set(deadCodeMatches.map(m => m.fileId)).size,
            durationMs: 0 // instantaneous lookup
        };
    }

    // --- Rename Simulation ---
    public simulateRename(oldName: string, newName: string): RenameDiff {
        const changes: DiffChange[] = [];
        let fileCount = 0;
        const filesAffected = new Set<string>();

        const occurrences = this.tokenIndex.get(oldName);
        if (!occurrences || occurrences.length === 0) {
            return { filesAffected: 0, totalChanges: 0, changes: [] };
        }

        // Group by file
        const byFile = new Map<string, Occurrence[]>();
        occurrences.forEach(occ => {
            if (!byFile.has(occ.fileId)) byFile.set(occ.fileId, []);
            byFile.get(occ.fileId)!.push(occ);
        });

        byFile.forEach((occs, fileId) => {
            filesAffected.add(fileId);
            const fileData = this.filesMap.get(fileId);
            if (!fileData) return;

            const uniqueLines = new Set(occs.map(o => o.line));

            uniqueLines.forEach(lineNum => {
                const content = fileData.content;
                const lines = content.split(/\r?\n/);
                const lineContent = lines[lineNum - 1];

                let newLineContent = "";
                let lastIndex = 0;

                const lineOccs = occs.filter(o => o.line === lineNum).sort((a, b) => a.charStart - b.charStart);

                lineOccs.forEach(occ => {
                    newLineContent += lineContent.substring(lastIndex, occ.charStart);
                    newLineContent += newName;
                    lastIndex = occ.charEnd;
                });
                newLineContent += lineContent.substring(lastIndex);

                changes.push({
                    fileId,
                    filePath: fileData.path,
                    line: lineNum,
                    originalContent: lineContent,
                    newContent: newLineContent
                });
            });
        });

        return {
            filesAffected: filesAffected.size,
            totalChanges: occurrences.length,
            changes
        };
    }
}

export interface DiffChange {
    fileId: string;
    filePath: string;
    line: number;
    originalContent: string;
    newContent: string;
}

export interface RenameDiff {
    filesAffected: number;
    totalChanges: number;
    changes: DiffChange[];
}
