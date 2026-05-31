// Dead Code Detector - Reachability Engine
// Core analysis logic for detecting unreachable code

import {
    FileReachability,
    EntryPoint,
    ImportEdge,
    SafeDeleteReason,
    FileWarning,
    AnalysisResult,
    AnalysisSummary,
    AnalysisProgress,
    AnalysisMode,
    FileType,
    ScoreFactor,
    DeadCodeSettings,
    DEFAULT_SETTINGS,
    CleanupManifest
} from '../types';

import {
    extractJSImports,
    extractHTMLReferences,
    extractCSSReferences,
    detectDynamicPatterns,
    resolveImportPath,
    getFileTypeFromPath,
    isJSFile,
    isHTMLFile,
    isCSSFile,
    isAssetFile,
    ExtractedImport,
    DynamicPattern
} from './ImportParser';

// ============================================================================
// FILE ENTRY TYPE
// ============================================================================

export interface FileEntry {
    path: string;
    content: string;
    size: number;
}

// ============================================================================
// ENTRY POINT DETECTION
// ============================================================================

const HTML_ENTRY_PATTERNS = [
    'index.html',
    'public/index.html',
    'src/index.html',
    'static/index.html'
];

const JS_ENTRY_PATTERNS = [
    'src/index.js',
    'src/index.ts',
    'src/index.tsx',
    'src/index.jsx',
    'src/main.js',
    'src/main.ts',
    'src/main.tsx',
    'src/app.js',
    'src/app.ts',
    'src/App.js',
    'src/App.tsx',
    'index.js',
    'index.ts',
    'main.js',
    'main.ts'
];

const NEXT_PAGE_PATTERN = /^(?:src\/)?pages\/.*\.(js|jsx|ts|tsx)$/;
const NEXT_APP_PATTERN = /^(?:src\/)?app\/.*\.(js|jsx|ts|tsx)$/;
const BUILD_CONFIG_PATTERNS = [
    'webpack.config.js',
    'webpack.config.ts',
    'vite.config.js',
    'vite.config.ts',
    'rollup.config.js',
    'rollup.config.ts',
    'next.config.js',
    'next.config.mjs'
];
const TEST_FILE_PATTERNS = [
    /\.test\.(js|jsx|ts|tsx)$/,
    /\.spec\.(js|jsx|ts|tsx)$/,
    /__tests__\//,
    /test\//,
    /tests\//
];

/**
 * Auto-detect entry points from project files
 */
export function detectEntryPoints(files: FileEntry[], settings: DeadCodeSettings): EntryPoint[] {
    const entries: EntryPoint[] = [];
    const filePaths = files.map(f => f.path);

    // 1. HTML Entry Points
    if (settings.autoDetectHTML) {
        for (const pattern of HTML_ENTRY_PATTERNS) {
            const found = filePaths.find(p => p.endsWith(pattern) || p === pattern);
            if (found) {
                entries.push({
                    id: `entry-${entries.length}`,
                    filePath: found,
                    type: 'html',
                    autoDetected: true,
                    enabled: true,
                    description: 'HTML entry point'
                });
            }
        }
    }

    // 2. Package.json main/module
    if (settings.autoDetectPackageMain) {
        const packageJson = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json'));
        if (packageJson) {
            try {
                const pkg = JSON.parse(packageJson.content);
                if (pkg.main) {
                    const mainPath = pkg.main.startsWith('./') ? pkg.main.slice(2) : pkg.main;
                    if (filePaths.some(p => p.endsWith(mainPath))) {
                        entries.push({
                            id: `entry-${entries.length}`,
                            filePath: mainPath,
                            type: 'package_main',
                            autoDetected: true,
                            enabled: true,
                            description: 'package.json main field'
                        });
                    }
                }
                if (pkg.module) {
                    const modulePath = pkg.module.startsWith('./') ? pkg.module.slice(2) : pkg.module;
                    if (filePaths.some(p => p.endsWith(modulePath))) {
                        entries.push({
                            id: `entry-${entries.length}`,
                            filePath: modulePath,
                            type: 'package_module',
                            autoDetected: true,
                            enabled: true,
                            description: 'package.json module field'
                        });
                    }
                }
            } catch (e) {
                // Invalid JSON, skip
            }
        }
    }

    // 3. Common JS entry points
    for (const pattern of JS_ENTRY_PATTERNS) {
        const found = filePaths.find(p => p.endsWith(pattern) || p === pattern);
        if (found && !entries.some(e => e.filePath === found)) {
            entries.push({
                id: `entry-${entries.length}`,
                filePath: found,
                type: 'js',
                autoDetected: true,
                enabled: true,
                description: 'Common JS entry point'
            });
        }
    }

    // 4. Framework Pages (Next.js, etc.)
    if (settings.autoDetectFrameworkEntries) {
        for (const path of filePaths) {
            if (NEXT_PAGE_PATTERN.test(path) || NEXT_APP_PATTERN.test(path)) {
                // Only add page files, not components within
                const fileName = path.split('/').pop() || '';
                if (!fileName.startsWith('_') && !fileName.includes('.module.')) {
                    entries.push({
                        id: `entry-${entries.length}`,
                        filePath: path,
                        type: 'framework_page',
                        autoDetected: true,
                        enabled: true,
                        description: 'Next.js page'
                    });
                }
            }
        }
    }

    // 5. Build config files (optional, for reference detection)
    for (const pattern of BUILD_CONFIG_PATTERNS) {
        const found = filePaths.find(p => p.endsWith(pattern));
        if (found) {
            entries.push({
                id: `entry-${entries.length}`,
                filePath: found,
                type: 'build_config',
                autoDetected: true,
                enabled: settings.analysisMode === 'conservative',
                description: 'Build configuration file'
            });
        }
    }

    return entries;
}

/**
 * Check if a file is a test file
 */
export function isTestFile(filePath: string): boolean {
    return TEST_FILE_PATTERNS.some(pattern => pattern.test(filePath));
}

// ============================================================================
// IMPORT GRAPH BUILDING
// ============================================================================

interface FileImports {
    fileId: string;
    filePath: string;
    imports: ExtractedImport[];
    dynamicPatterns: DynamicPattern[];
}

/**
 * Extract imports from all files
 */
export function extractAllImports(
    files: FileEntry[],
    onProgress?: (current: string, processed: number) => void
): FileImports[] {
    const results: FileImports[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (onProgress) {
            onProgress(file.path, i + 1);
        }

        let imports: ExtractedImport[] = [];
        let dynamicPatterns: DynamicPattern[] = [];

        if (isJSFile(file.path)) {
            imports = extractJSImports(file.content, file.path);
            dynamicPatterns = detectDynamicPatterns(file.content);
        } else if (isHTMLFile(file.path)) {
            imports = extractHTMLReferences(file.content, file.path);
        } else if (isCSSFile(file.path)) {
            imports = extractCSSReferences(file.content, file.path);
        }

        results.push({
            fileId: file.path,
            filePath: file.path,
            imports,
            dynamicPatterns
        });
    }

    return results;
}

/**
 * Build adjacency list from imports
 */
export function buildImportGraph(
    files: FileEntry[],
    fileImports: FileImports[]
): { edges: ImportEdge[]; adjacencyList: Map<string, Set<string>> } {
    const edges: ImportEdge[] = [];
    const adjacencyList = new Map<string, Set<string>>();
    const filePathSet = new Set(files.map(f => f.path));

    // Initialize adjacency list
    for (const file of files) {
        adjacencyList.set(file.path, new Set());
    }

    for (const fileData of fileImports) {
        for (const imp of fileData.imports) {
            // Resolve the import path
            let resolvedPath = resolveImportPath(imp.path, fileData.filePath);

            // Skip node_modules
            if (!resolvedPath) continue;

            // Try to find the actual file (with extensions)
            let targetPath = resolvedPath;
            if (!filePathSet.has(targetPath)) {
                // Try common extensions
                const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx', '.css', '.scss'];
                for (const ext of extensions) {
                    if (filePathSet.has(resolvedPath + ext)) {
                        targetPath = resolvedPath + ext;
                        break;
                    }
                }
            }

            // Only add edge if target exists
            if (filePathSet.has(targetPath)) {
                edges.push({
                    sourceFileId: fileData.filePath,
                    targetFileId: targetPath,
                    importType: imp.type,
                    importStatement: imp.statement,
                    lineNumber: imp.line,
                    isDynamic: imp.isDynamic,
                    resolvedPath: targetPath
                });

                const neighbors = adjacencyList.get(fileData.filePath);
                if (neighbors) {
                    neighbors.add(targetPath);
                }
            }
        }
    }

    return { edges, adjacencyList };
}

// ============================================================================
// REACHABILITY COMPUTATION (BFS)
// ============================================================================

/**
 * Compute reachable files from entry points using BFS
 */
export function computeReachability(
    entryPoints: EntryPoint[],
    adjacencyList: Map<string, Set<string>>,
    allFilePaths: string[]
): { reachable: Set<string>; reachableFrom: Map<string, string[]> } {
    const reachable = new Set<string>();
    const reachableFrom = new Map<string, string[]>();

    // Initialize reachableFrom
    for (const path of allFilePaths) {
        reachableFrom.set(path, []);
    }

    // BFS from each enabled entry point
    for (const entry of entryPoints) {
        if (!entry.enabled) continue;

        const queue: string[] = [entry.filePath];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (visited.has(current)) continue;
            visited.add(current);
            reachable.add(current);

            // Track which entry point reaches this file
            const entries = reachableFrom.get(current) || [];
            if (!entries.includes(entry.id)) {
                entries.push(entry.id);
                reachableFrom.set(current, entries);
            }

            // Add all neighbors to queue
            const neighbors = adjacencyList.get(current);
            if (neighbors) {
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            }
        }
    }

    return { reachable, reachableFrom };
}

// ============================================================================
// SAFE DELETION SCORE CALCULATION
// ============================================================================

/**
 * Calculate safe deletion score for a file
 * Score = 100 minus risk factors
 */
export function calculateSafeScore(
    filePath: string,
    fileImports: FileImports | undefined,
    edges: ImportEdge[],
    allFiles: FileEntry[],
    settings: DeadCodeSettings
): { score: number; reasons: SafeDeleteReason[] } {
    let score = 100;
    const reasons: SafeDeleteReason[] = [];

    // Factor 1: Dynamic import patterns (max -50)
    if (fileImports && fileImports.dynamicPatterns.length > 0) {
        const impact = Math.min(50, fileImports.dynamicPatterns.length * 25);
        score -= impact;
        reasons.push({
            factor: 'dynamic_import',
            impact,
            description: `File may be loaded dynamically (${fileImports.dynamicPatterns.length} pattern(s) detected)`,
            location: {
                fileId: filePath,
                filePath,
                line: fileImports.dynamicPatterns[0]?.line || 0
            }
        });
    }

    // Factor 2: String reference check (max -25)
    // Check if file path appears in other files as a string
    const fileName = filePath.split('/').pop() || '';
    const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, '');
    let stringReferences = 0;

    for (const file of allFiles) {
        if (file.path !== filePath && isJSFile(file.path)) {
            // Check if the filename appears as a string reference
            const filenameRegex = new RegExp(`['"\`].*${fileNameWithoutExt}.*['"\`]`, 'gi');
            if (filenameRegex.test(file.content)) {
                stringReferences++;
            }
        }
    }

    if (stringReferences > 0) {
        const impact = Math.min(25, stringReferences * 10);
        score -= impact;
        reasons.push({
            factor: 'string_reference',
            impact,
            description: `File path appears in ${stringReferences} other file(s) as string literal`,
            location: null
        });
    }

    // Factor 3: External usage (exports without internal imports) (max -30)
    const hasExports = fileImports?.imports.some(i => i.statement.includes('export')) ?? false;
    const isImportedBy = edges.filter(e => e.targetFileId === filePath).length;

    if (hasExports && isImportedBy === 0) {
        score -= 30;
        reasons.push({
            factor: 'external_usage',
            impact: 30,
            description: 'File exports but has no internal imports (may be used externally)',
            location: null
        });
    }

    // Factor 4: Test file reference (max -20)
    if (isTestFile(filePath)) {
        score -= 20;
        reasons.push({
            factor: 'test_reference',
            impact: 20,
            description: 'File is a test file',
            location: null
        });
    }

    // Factor 5: Config file reference check (max -15)
    const isInConfig = edges.some(e =>
        BUILD_CONFIG_PATTERNS.some(p => e.sourceFileId.includes(p)) &&
        e.targetFileId === filePath
    );

    if (isInConfig) {
        score -= 15;
        reasons.push({
            factor: 'config_reference',
            impact: 15,
            description: 'File is referenced in build configuration',
            location: null
        });
    }

    // If no reasons found, add "no references" as a positive
    if (reasons.length === 0) {
        reasons.push({
            factor: 'no_references',
            impact: 0,
            description: 'No risky patterns detected - safe to delete',
            location: null
        });
    }

    return { score: Math.max(0, score), reasons };
}

// ============================================================================
// SIZE ESTIMATION
// ============================================================================

function estimateGzippedSize(size: number, fileType: FileType): number {
    switch (fileType) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return Math.round(size * 0.3);
        case 'css':
        case 'scss':
        case 'less':
            return Math.round(size * 0.25);
        case 'html':
            return Math.round(size * 0.35);
        case 'font':
            return Math.round(size * 0.7);
        case 'image':
        case 'video':
        case 'audio':
            return size; // Already compressed
        default:
            return Math.round(size * 0.5);
    }
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Run full dead code analysis
 */
export async function runAnalysis(
    files: FileEntry[],
    settings: DeadCodeSettings = DEFAULT_SETTINGS,
    onProgress?: (progress: AnalysisProgress) => void
): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Phase 1: Detect entry points
    if (onProgress) {
        onProgress({
            phase: 'scanning',
            phaseDescription: 'Detecting entry points...',
            currentFile: '',
            filesProcessed: 0,
            totalFiles: files.length,
            referencesFound: 0,
            unreachableSoFar: 0,
            percentage: 5
        });
    }

    const entryPoints = detectEntryPoints(files, settings);

    // Add test files as entries in conservative mode
    if (settings.treatTestsAsEntries) {
        for (const file of files) {
            if (isTestFile(file.path)) {
                entryPoints.push({
                    id: `test-${entryPoints.length}`,
                    filePath: file.path,
                    type: 'custom',
                    autoDetected: true,
                    enabled: true,
                    description: 'Test file'
                });
            }
        }
    }

    // Phase 2: Extract all imports
    if (onProgress) {
        onProgress({
            phase: 'building_graph',
            phaseDescription: 'Building import graph...',
            currentFile: '',
            filesProcessed: 0,
            totalFiles: files.length,
            referencesFound: 0,
            unreachableSoFar: 0,
            percentage: 15
        });
    }

    let processedCount = 0;
    const fileImports = extractAllImports(files, (current, processed) => {
        processedCount = processed;
        if (onProgress && processed % 10 === 0) {
            onProgress({
                phase: 'building_graph',
                phaseDescription: 'Building import graph...',
                currentFile: current,
                filesProcessed: processed,
                totalFiles: files.length,
                referencesFound: 0,
                unreachableSoFar: 0,
                percentage: 15 + Math.round((processed / files.length) * 30)
            });
        }
    });

    // Phase 3: Build graph and compute reachability
    if (onProgress) {
        onProgress({
            phase: 'computing_reachability',
            phaseDescription: 'Computing file reachability...',
            currentFile: '',
            filesProcessed: files.length,
            totalFiles: files.length,
            referencesFound: 0,
            unreachableSoFar: 0,
            percentage: 50
        });
    }

    const { edges, adjacencyList } = buildImportGraph(files, fileImports);
    const { reachable, reachableFrom } = computeReachability(
        entryPoints.filter(e => e.enabled),
        adjacencyList,
        files.map(f => f.path)
    );

    // Phase 4: Calculate safe scores and build results
    if (onProgress) {
        onProgress({
            phase: 'calculating_scores',
            phaseDescription: 'Calculating safe deletion scores...',
            currentFile: '',
            filesProcessed: files.length,
            totalFiles: files.length,
            referencesFound: edges.length,
            unreachableSoFar: files.length - reachable.size,
            percentage: 70
        });
    }

    const fileImportsMap = new Map(fileImports.map(fi => [fi.filePath, fi]));

    const allFileResults: FileReachability[] = [];
    const unreachableFiles: FileReachability[] = [];
    const warnings = {
        dynamicImports: [] as FileWarning[],
        configReferences: [] as FileWarning[],
        cdnReferences: [] as FileWarning[],
        testOnly: [] as FileWarning[]
    };

    let deadCodeSize = 0;
    let unusedAssetsSize = 0;

    const byType: Map<FileType, { count: number; size: number }> = new Map();

    for (const file of files) {
        const isReachableFile = reachable.has(file.path);
        const fileType = getFileTypeFromPath(file.path) as FileType;
        const fileImportsData = fileImportsMap.get(file.path);

        const { score, reasons } = calculateSafeScore(
            file.path,
            fileImportsData,
            edges,
            files,
            settings
        );

        // Build references
        const referencedBy = edges.filter(e => e.targetFileId === file.path).map(e => e.sourceFileId);
        const references = (adjacencyList.get(file.path) || new Set());

        // Generate warnings
        const fileWarnings: FileWarning[] = [];

        if (fileImportsData && fileImportsData.dynamicPatterns.length > 0) {
            const warning: FileWarning = {
                type: 'dynamic_import',
                message: `Contains ${fileImportsData.dynamicPatterns.length} dynamic import pattern(s)`,
                location: { fileId: file.path, filePath: file.path, line: fileImportsData.dynamicPatterns[0].line },
                severity: 'high'
            };
            fileWarnings.push(warning);
            warnings.dynamicImports.push(warning);
        }

        const fileResult: FileReachability = {
            fileId: file.path,
            filePath: file.path,
            fileName: file.path.split('/').pop() || '',
            fileType,
            fileSize: file.size,

            isReachable: isReachableFile,
            reachableFrom: reachableFrom.get(file.path) || [],
            referencedBy,
            references: Array.from(references),

            safeDeleteScore: score,
            safeDeleteReasons: reasons,

            unreachableSince: null,
            lastReferencedIn: null,

            warnings: fileWarnings
        };

        allFileResults.push(fileResult);

        if (!isReachableFile) {
            unreachableFiles.push(fileResult);

            if (isAssetFile(file.path)) {
                unusedAssetsSize += file.size;
            } else {
                deadCodeSize += file.size;
            }

            // Update by-type stats
            const current = byType.get(fileType) || { count: 0, size: 0 };
            current.count++;
            current.size += file.size;
            byType.set(fileType, current);
        }
    }

    // Build summary
    const summary: AnalysisSummary = {
        totalFiles: files.length,
        reachableFiles: reachable.size,
        unreachableFiles: unreachableFiles.length,
        entryPointsUsed: entryPoints.filter(e => e.enabled).length,
        importEdges: edges.length,

        deadCodeSize,
        unusedAssetsSize,
        totalRemovableSize: deadCodeSize + unusedAssetsSize,
        estimatedBundleSavings: 0,

        byType: Array.from(byType.entries()).map(([type, data]) => ({
            type,
            count: data.count,
            size: data.size,
            gzippedEstimate: estimateGzippedSize(data.size, type)
        }))
    };

    // Calculate estimated bundle savings (JS + CSS gzipped)
    for (const typeData of summary.byType) {
        if (['js', 'jsx', 'ts', 'tsx', 'css', 'scss'].includes(typeData.type)) {
            summary.estimatedBundleSavings += typeData.gzippedEstimate;
        }
    }

    // Phase 5: Complete
    if (onProgress) {
        onProgress({
            phase: 'complete',
            phaseDescription: 'Analysis complete!',
            currentFile: '',
            filesProcessed: files.length,
            totalFiles: files.length,
            referencesFound: edges.length,
            unreachableSoFar: unreachableFiles.length,
            percentage: 100
        });
    }

    return {
        mode: settings.analysisMode,
        entryPoints,
        allFiles: allFileResults,
        unreachableFiles,
        importGraph: edges,
        assets: [],
        cssAnalysis: null,
        summary,
        warnings,
        analysisTime: Date.now() - startTime
    };
}

// ============================================================================
// EXPORT GENERATION
// ============================================================================

/**
 * Generate cleanup manifest JSON
 */
export function generateCleanupManifest(
    selectedFiles: FileReachability[],
    projectPath: string
): CleanupManifest {
    const byType: Record<string, { count: number; size: number }> = {};
    let totalSize = 0;
    let totalScore = 0;

    const filesToDelete = selectedFiles.map(file => {
        totalSize += file.fileSize;
        totalScore += file.safeDeleteScore;

        const type = file.fileType;
        if (!byType[type]) {
            byType[type] = { count: 0, size: 0 };
        }
        byType[type].count++;
        byType[type].size += file.fileSize;

        return {
            path: file.filePath,
            size: file.fileSize,
            safeScore: file.safeDeleteScore,
            reason: file.safeDeleteReasons[0]?.description || 'Unreachable from entry points',
            type: file.fileType
        };
    });

    const warnings = selectedFiles
        .filter(f => f.safeDeleteScore < 60)
        .map(f => `${f.filePath} has low safe score (${f.safeDeleteScore}) - review manually`);

    return {
        generatedAt: new Date().toISOString(),
        projectPath,
        filesToDelete,
        summary: {
            totalFiles: selectedFiles.length,
            totalSize,
            averageSafeScore: selectedFiles.length > 0 ? Math.round(totalScore / selectedFiles.length) : 0,
            byType: byType as Record<FileType, { count: number; size: number }>
        },
        warnings
    };
}

/**
 * Generate Git patch for file deletion
 */
export function generateGitPatch(selectedFiles: FileReachability[]): string {
    let patch = '';

    for (const file of selectedFiles) {
        patch += `diff --git a/${file.filePath} b/${file.filePath}\n`;
        patch += `deleted file mode 100644\n`;
        patch += `index 0000000..0000000\n`;
        patch += `--- a/${file.filePath}\n`;
        patch += `+++ /dev/null\n`;

        // For binary files
        if (isAssetFile(file.filePath)) {
            patch += `Binary files a/${file.filePath} and /dev/null differ\n`;
        } else {
            patch += `@@ -1,0 +0,0 @@\n`;
            patch += `# File deleted by Dead Code Detector\n`;
        }

        patch += '\n';
    }

    return patch;
}

/**
 * Generate shell script for file deletion
 */
export function generateShellScript(selectedFiles: FileReachability[]): string {
    let script = '#!/bin/bash\n';
    script += '# Dead Code Cleanup Script\n';
    script += `# Generated: ${new Date().toISOString()}\n`;
    script += `# Files to delete: ${selectedFiles.length}\n`;

    const totalSize = selectedFiles.reduce((sum, f) => sum + f.fileSize, 0);
    script += `# Space to free: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n\n`;

    script += '# WARNING: This script will permanently delete files.\n';
    script += '# Review before running!\n\n';

    for (const file of selectedFiles) {
        script += `rm "${file.filePath}"\n`;
    }

    script += `\necho "Cleanup complete. Removed ${selectedFiles.length} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)"\n`;

    return script;
}

/**
 * Generate plain file list
 */
export function generateFileList(selectedFiles: FileReachability[]): string {
    return selectedFiles.map(f => f.filePath).join('\n');
}
