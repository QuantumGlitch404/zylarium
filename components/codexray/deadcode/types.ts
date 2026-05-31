// Dead Code & Unused Asset Detector - Type Definitions

// ============================================================================
// CORE TYPES
// ============================================================================

export type AnalysisMode = 'conservative' | 'aggressive';

export type FileType =
    | 'js' | 'ts' | 'jsx' | 'tsx'
    | 'css' | 'scss' | 'less'
    | 'html' | 'vue' | 'svelte'
    | 'image' | 'font' | 'icon' | 'video' | 'audio' | 'document'
    | 'json' | 'other';

export type AssetType = 'image' | 'font' | 'icon' | 'video' | 'audio' | 'document' | 'other';

export type WarningType =
    | 'dynamic_import'
    | 'config_reference'
    | 'cdn_reference'
    | 'test_only'
    | 'external_usage'
    | 'low_confidence';

export type SelectorReachability = 'used' | 'unused' | 'maybe';

export type ImportType =
    | 'static_import'
    | 'dynamic_import'
    | 'require'
    | 'html_script'
    | 'html_link'
    | 'css_url'
    | 'css_import'
    | 'asset_reference';

export type ReferenceType = 'import' | 'url' | 'src' | 'href' | 'require' | 'dynamic';

export type EntryPointType =
    | 'html'
    | 'js'
    | 'ts'
    | 'package_main'
    | 'package_module'
    | 'framework_page'
    | 'build_config'
    | 'custom';

export type ScoreFactor =
    | 'dynamic_import'
    | 'external_usage'
    | 'test_reference'
    | 'config_reference'
    | 'string_reference'
    | 'no_references';

// ============================================================================
// FILE LOCATION
// ============================================================================

export interface FileLocation {
    fileId: string;
    filePath: string;
    line: number;
    column?: number;
}

// ============================================================================
// ENTRY POINTS
// ============================================================================

export interface EntryPoint {
    id: string;
    filePath: string;
    type: EntryPointType;
    autoDetected: boolean;
    enabled: boolean;
    description: string;
}

// ============================================================================
// IMPORT GRAPH
// ============================================================================

export interface ImportEdge {
    sourceFileId: string;
    targetFileId: string;
    importType: ImportType;
    importStatement: string;
    lineNumber: number;
    isDynamic: boolean;
    resolvedPath: string;
}

// ============================================================================
// SAFE DELETION SCORING
// ============================================================================

export interface SafeDeleteReason {
    factor: ScoreFactor;
    impact: number;  // How much this reduces score (0-50)
    description: string;
    location: FileLocation | null;
}

// ============================================================================
// FILE WARNINGS
// ============================================================================

export interface FileWarning {
    type: WarningType;
    message: string;
    location: FileLocation | null;
    severity: 'low' | 'medium' | 'high';
    details?: string;
}

// ============================================================================
// FILE REACHABILITY
// ============================================================================

export interface FileReachability {
    fileId: string;
    filePath: string;
    fileName: string;
    fileType: FileType;
    fileSize: number;  // bytes

    isReachable: boolean;
    reachableFrom: string[];  // entry point IDs that reach this file
    referencedBy: string[];   // file IDs that import/reference this
    references: string[];     // file IDs this file imports/references

    safeDeleteScore: number;  // 0-100
    safeDeleteReasons: SafeDeleteReason[];

    unreachableSince: string | null;  // version/date when became unreachable
    lastReferencedIn: string | null;  // version where last referenced

    warnings: FileWarning[];
}

// ============================================================================
// ASSET TYPES
// ============================================================================

export interface AssetReference {
    fileId: string;
    filePath: string;
    lineNumber: number;
    referenceType: ReferenceType;
    referenceCode: string;
}

export interface AssetInfo {
    fileId: string;
    filePath: string;
    assetType: AssetType;
    mimeType: string;
    fileSize: number;
    dimensions: { width: number; height: number } | null;  // for images

    referencedIn: AssetReference[];
    isReachable: boolean;
}

// ============================================================================
// CSS ANALYSIS
// ============================================================================

export interface HTMLMatch {
    htmlFileId: string;
    elementTag: string;
    lineNumber: number;
    className?: string;
    id?: string;
}

export interface CSSSelector {
    selector: string;
    fileId: string;
    filePath: string;
    lineNumber: number;

    reachability: SelectorReachability;
    matchedElements: HTMLMatch[];

    isDynamic: boolean;  // contains runtime classes
    dynamicReason?: string;
}

export interface CSSAnalysisResult {
    totalSelectors: number;
    usedSelectors: CSSSelector[];
    unusedSelectors: CSSSelector[];
    maybeSelectors: CSSSelector[];
    potentialSavingsBytes: number;
}

// ============================================================================
// CLEANUP & EXPORT
// ============================================================================

export interface CleanupFileEntry {
    path: string;
    size: number;
    safeScore: number;
    reason: string;
    type: FileType;
}

export interface CleanupManifest {
    generatedAt: string;
    projectPath: string;

    filesToDelete: CleanupFileEntry[];

    summary: {
        totalFiles: number;
        totalSize: number;
        averageSafeScore: number;
        byType: Record<FileType, { count: number; size: number }>;
    };

    warnings: string[];
}

// ============================================================================
// ANALYSIS PROGRESS
// ============================================================================

export type AnalysisPhase =
    | 'scanning'
    | 'building_graph'
    | 'computing_reachability'
    | 'calculating_scores'
    | 'analyzing_css'
    | 'complete';

export interface AnalysisProgress {
    phase: AnalysisPhase;
    phaseDescription: string;
    currentFile: string;
    filesProcessed: number;
    totalFiles: number;
    referencesFound: number;
    unreachableSoFar: number;
    percentage: number;
}

// ============================================================================
// ANALYSIS RESULT
// ============================================================================

export interface AnalysisSummary {
    totalFiles: number;
    reachableFiles: number;
    unreachableFiles: number;
    entryPointsUsed: number;
    importEdges: number;

    deadCodeSize: number;
    unusedAssetsSize: number;
    totalRemovableSize: number;
    estimatedBundleSavings: number;

    byType: {
        type: FileType;
        count: number;
        size: number;
        gzippedEstimate: number;
    }[];
}

export interface AnalysisResult {
    mode: AnalysisMode;
    entryPoints: EntryPoint[];

    allFiles: FileReachability[];
    unreachableFiles: FileReachability[];

    importGraph: ImportEdge[];

    assets: AssetInfo[];
    cssAnalysis: CSSAnalysisResult | null;

    summary: AnalysisSummary;

    warnings: {
        dynamicImports: FileWarning[];
        configReferences: FileWarning[];
        cdnReferences: FileWarning[];
        testOnly: FileWarning[];
    };

    analysisTime: number;  // ms
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface TabProps {
    result: AnalysisResult;
    onFileSelect?: (fileId: string) => void;
    onMarkAsUsed?: (fileId: string) => void;
    selectedFiles?: Set<string>;
    onSelectionChange?: (files: Set<string>) => void;
}

export interface FileCardProps {
    file: FileReachability;
    onViewFile?: () => void;
    onViewReferences?: () => void;
    onMarkAsUsed?: () => void;
    isSelected?: boolean;
    onSelect?: (selected: boolean) => void;
}

export interface ScoreBreakdownProps {
    score: number;
    reasons: SafeDeleteReason[];
    warnings: FileWarning[];
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface DeadCodeSettings {
    analysisMode: AnalysisMode;
    treatTestsAsEntries: boolean;
    includeNodeModules: boolean;
    followDynamicImports: boolean;

    autoDetectHTML: boolean;
    autoDetectPackageMain: boolean;
    autoDetectFrameworkEntries: boolean;
    customPatterns: string[];

    highConfidenceMin: number;  // default 90
    mediumConfidenceMin: number;  // default 60

    defaultTab: 'summary' | 'by-type' | 'by-folder' | 'impact' | 'cleanup';
    showFilePreviews: boolean;
    showSizeEstimates: boolean;
}

export const DEFAULT_SETTINGS: DeadCodeSettings = {
    analysisMode: 'conservative',
    treatTestsAsEntries: true,
    includeNodeModules: false,
    followDynamicImports: true,

    autoDetectHTML: true,
    autoDetectPackageMain: true,
    autoDetectFrameworkEntries: true,
    customPatterns: [],

    highConfidenceMin: 90,
    mediumConfidenceMin: 60,

    defaultTab: 'summary',
    showFilePreviews: true,
    showSizeEstimates: true,
};
