export type SearchMode = 'exact' | 'regex' | 'fuzzy';
export type ScopeType = 'all' | 'folder' | 'custom';

export interface SearchState {
    query: string;
    mode: SearchMode;
    scope: ScopeType;
    regexFlags?: string[]; // 'i', 'm', 'g'
    extensions?: string[];
}

export interface Occurrence {
    fileId: string;
    filePath: string;
    line: number; // 1-indexed
    charStart: number;
    charEnd: number;
    snippet: string;
    tokenType: 'identifier' | 'string' | 'property' | 'declaration';
}

export interface SearchResult {
    matches: Occurrence[];
    totalFiles: number;
    durationMs: number;
}
