import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

export interface FileNode {
    id: string;
    name: string;
    path: string;
    size: number;
    content?: string; // Preview content (first 200 lines)
    imports: string[];
    type: 'file' | 'module';
    extension: string;
    language: string;
    lineCount: number;
    weight: number; // For heatmap
}

export interface DependencyGraph {
    nodes: FileNode[];
    edges: { source: string; target: string; weight: number }[];
}

// --- language profiles ---
interface LanguageProfile {
    type: string;
    regex: RegExp[];
    comments: RegExp[];
}

const LANGUAGES: Record<string, LanguageProfile> = {
    javascript: {
        type: 'JS',
        regex: [
            /(?:^|\s)import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/gm,
            /(?:^|\s)require\s*\(\s*['"]([^'"]+)['"]\s*\)/gm,
            /(?:^|\s)export\s+.*from\s+['"]([^'"]+)['"]/gm,
            /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gm
        ],
        comments: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm]
    },
    typescript: {
        type: 'TS',
        regex: [
            /(?:^|\s)import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/gm,
            /(?:^|\s)require\s*\(\s*['"]([^'"]+)['"]\s*\)/gm,
            /(?:^|\s)export\s+.*from\s+['"]([^'"]+)['"]/gm
        ],
        comments: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm]
    },
    python: {
        type: 'PY',
        regex: [
            /(?:^|\s)from\s+([a-zA-Z0-9_\.]+)\s+import/gm,
            /(?:^|\s)import\s+([a-zA-Z0-9_\.]+)/gm
        ],
        comments: [/(#.*$)|("""[\s\S]*?""")|('''[\s\S]*?''')/gm]
    },
    java: {
        type: 'JAVA',
        regex: [
            /import\s+([\w\.]+)\s*;/gm
        ],
        comments: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm]
    },
    go: {
        type: 'GO',
        regex: [
            /import\s+\(\s*([\s\S]*?)\s*\)/gm, // Go block import
            /import\s+"([^"]+)"/gm // Single line
        ],
        comments: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm]
    }
};

const EXT_MAP: Record<string, string> = {
    '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java', '.kt': 'java', // Kotlin treated as Java for simple import logic often
    '.go': 'go'
};

const IGNORED = ['node_modules', '.git', 'dist', 'build', '.vscode', 'coverage', '__pycache__', 'venv'];

export const processRepoZip = async (file: File): Promise<DependencyGraph> => {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    const nodes: FileNode[] = [];
    const pathToIdMap: Record<string, string> = {};

    // 1. Scan & Classify
    for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
        if (zipEntry.dir) continue;
        if (IGNORED.some(dir => relativePath.includes(dir + '/'))) continue;

        const ext = '.' + relativePath.split('.').pop()?.toLowerCase();
        const langKey = EXT_MAP[ext];
        if (!langKey) continue; // Skip unsupported

        // Optimization: Large files check
        // If > 5MB, we might skip logic or partial scan. For now, we assume reasonable sizes or simplistic read.
        // zipEntry.async('string') might be slow for huge files, but for client-side tool we assume typical repo size.

        // We only need content for analysis.
        // Let's read it.
        const content = await zipEntry.async('string');

        const node: FileNode = {
            id: uuidv4(),
            name: relativePath.split('/').pop() || relativePath,
            path: relativePath,
            size: content.length,
            lineCount: content.split('\n').length,
            content: content.slice(0, 8000), // Preview ~200 lines roughly
            imports: [],
            type: 'file',
            extension: ext,
            language: LANGUAGES[langKey].type,
            weight: 1
        };

        // Parse Imports
        node.imports = parseImports(content, langKey, relativePath);

        nodes.push(node);
        pathToIdMap[relativePath] = node.id;
    }

    // 2. Build Graph (Adjacency)
    const edges: { source: string; target: string; weight: number }[] = [];

    // Helper to resolve paths
    const resolve = (fromPath: string, importToken: string): string | null => {
        // 1. Handle External
        if (!importToken.startsWith('.')) return null; // Treat as external/package for now (orphaned edge or special "External" node?)

        // 2. Handle Relative
        // fromPath: src/components/Button.tsx
        // importToken: ../utils/helper
        // Expected: src/utils/helper.ts

        const currentDirItems = fromPath.split('/');
        currentDirItems.pop(); // Remove filename

        const parts = importToken.split('/');

        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') {
                if (currentDirItems.length > 0) currentDirItems.pop();
            } else {
                currentDirItems.push(part);
            }
        }

        const resolvedBase = currentDirItems.join('/');

        // Fuzzy match against known paths
        // We look for a file that starts with `resolvedBase` AND has a matching extension logic?
        // actually imports often drop extension.
        // So we look for any node where node.path (minus ext) == resolvedBase

        return resolvedBase;
    };

    nodes.forEach(source => {
        source.imports.forEach(imp => {
            const resolved = resolve(source.path, imp);
            if (resolved) {
                // Exact match or partial match check
                // Try to find a node.path that starts with resolved AND extension match?
                // The resolved path usually lacks extension. 
                const targetNode = nodes.find(n => {
                    const nNoExt = n.path.substring(0, n.path.lastIndexOf('.'));
                    return nNoExt === resolved || n.path === resolved;
                });

                if (targetNode) {
                    // Check if edge exists
                    const existing = edges.find(e => e.source === source.id && e.target === targetNode.id);
                    if (existing) {
                        existing.weight++;
                    } else {
                        edges.push({ source: source.id, target: targetNode.id, weight: 1 });
                    }
                }
            }
        });
    });

    return { nodes, edges };
};

function parseImports(content: string, langKey: string, filePath: string): string[] {
    const profile = LANGUAGES[langKey];
    if (!profile) return [];

    let cleanContent = content;
    // Strip comments
    profile.comments.forEach(regex => {
        cleanContent = cleanContent.replace(regex, '');
    });

    const imports = new Set<string>();

    // Go special case for block parsing? 
    // Simplify for now: If Go, we might need improved regex, but user provided generic ones.

    profile.regex.forEach(regex => {
        let match;
        // Reset regex state just in case
        regex.lastIndex = 0;

        while ((match = regex.exec(cleanContent)) !== null) {
            // Group 1 usually holds the path
            // For Python: "from x import y" -> x
            // For Go block: we might catch multiple lines.

            if (langKey === 'go' && match[0].includes('(')) {
                // Handle Go block import extraction manually from the block
                const block = match[1];
                const cleanBlock = block.replace(/"/g, '').trim();
                cleanBlock.split('\n').forEach(line => {
                    const cleanLine = line.trim();
                    if (cleanLine) imports.add(cleanLine);
                });
            } else {
                if (match[1]) imports.add(match[1]);
                if (match[2]) imports.add(match[2]);
            }
        }
    });

    return Array.from(imports);
}
