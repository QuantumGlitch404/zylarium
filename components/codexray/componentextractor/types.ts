// Component Extraction Engine - Type Definitions

// ============================================================================
// CORE TYPES
// ============================================================================

export type ComponentType = 'repeated' | 'layout' | 'unique';
export type AntiPatternType = 'deep-nesting' | 'div-soup' | 'inline-styles' | 'duplicate-styles' | 'non-semantic' | 'brittle-selectors';
export type LayoutPatternType = 'grid' | 'flex-row' | 'flex-column' | 'navbar' | 'sidebar' | 'card-grid' | 'list' | 'form' | 'hero' | 'footer';
export type ExportFormat = 'html' | 'react' | 'vue' | 'svelte' | 'angular' | 'webcomponent';
export type CSSStrategy = 'bem' | 'css-modules' | 'tailwind' | 'styled-components';
export type Severity = 'warning' | 'error';

// ============================================================================
// DOM STRUCTURES
// ============================================================================

export interface DOMNodeReference {
    id: string;
    xpath: string;
    element: string; // tag.class#id format
}

export interface DOMStructure {
    tag: string;
    classes: string[];
    id: string | null;
    attributes: Record<string, string>;
    children: DOMStructure[];
    isComponentSlot: boolean;
    isTextSlot: boolean;
    componentRef: string | null;
    textContent?: string;
}

export interface ParsedDOM {
    root: DOMStructure;
    nodeCount: number;
    maxDepth: number;
    allNodes: Map<string, DOMStructure>;
}

// ============================================================================
// CSS STRUCTURES
// ============================================================================

export interface CSSRule {
    selector: string;
    properties: Record<string, string>;
    specificity: number;
    source: 'embedded' | 'inline' | 'external';
}

export interface ParsedCSS {
    rules: CSSRule[];
    selectorMap: Map<string, CSSRule[]>;
    classUsage: Map<string, number>;
}

// ============================================================================
// COMPONENT STRUCTURES
// ============================================================================

export interface AttributeDiff {
    attribute: string;
    expected: string;
    actual: string;
}

export interface InstanceDifference {
    type: 'missing_element' | 'extra_element' | 'class_difference' | 'attribute_difference' | 'text_difference';
    path: string;
    details: string;
}

export interface ComponentInstance {
    id: string;
    componentId: string;
    domNode: DOMNodeReference;
    xpath: string;
    htmlContent: string;
    textContent: string;
    boundingBox: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
    variantId: string;
    differences: InstanceDifference[];
}

export interface ComponentVariant {
    id: string;
    componentId: string;
    name: string;
    instanceCount: number;
    structuralDifferences: {
        addedElements: string[];
        removedElements: string[];
        differentAttributes: AttributeDiff[];
    };
    representativeInstance: string;
}

export interface StabilityFactor {
    factor: 'missing_element' | 'extra_element' | 'class_difference' | 'attribute_difference';
    impact: number;
    instances: string[];
    description: string;
}

export interface RefactorFactor {
    type: 'dependency' | 'coupling' | 'complexity' | 'inline' | 'hardcoded';
    impact: number;
    description: string;
    location: string;
    suggestion: string;
}

export interface ComponentMetrics {
    instanceCount: number;
    variantCount: number;
    averageSize: number;
    nestingDepth: number;
    stabilityScore: number;
    stabilityFactors: StabilityFactor[];
    refactorReadinessScore: number;
    refactorFactors: RefactorFactor[];
    complexity: number;
}

export interface ComponentWarning {
    type: string;
    message: string;
    severity: Severity;
    location?: string;
}

export interface DetectedComponent {
    id: string;
    name: string;
    type: ComponentType;
    instances: ComponentInstance[];
    variants: ComponentVariant[];
    rootSelector: string;
    structure: DOMStructure;
    containedComponents: string[];
    parentComponent: string | null;
    cssClasses: string[];
    inlineStyles: string[];
    metrics: ComponentMetrics;
    warnings: ComponentWarning[];
}

// ============================================================================
// PATTERN STRUCTURES
// ============================================================================

export interface LayoutPattern {
    type: LayoutPatternType;
    confidence: number;
    detectedAt: DOMNodeReference;
    properties: {
        columns?: number;
        rows?: number;
        gap?: string;
        alignment?: string;
        hasLogo?: boolean;
        itemCount?: number;
        hasCTA?: boolean;
        fieldCount?: number;
        hasSubmit?: boolean;
    };
}

export interface AntiPattern {
    type: AntiPatternType;
    severity: Severity;
    location: DOMNodeReference;
    description: string;
    suggestion: string;
    affectedElements: number;
}

// ============================================================================
// ANALYSIS STRUCTURES
// ============================================================================

export interface AnalysisSettings {
    minInstancesForPattern: number;
    similarityThreshold: number;
    includeSingleInstanceLayouts: boolean;
    detectNestedComponents: boolean;
    parseEmbeddedCSS: boolean;
    parseInlineStyles: boolean;
    analyzeClassCoUsage: boolean;
    detectLayoutPatterns: boolean;
    detectAntiPatterns: boolean;
    namingStyle: 'PascalCase' | 'camelCase' | 'kebab-case';
    useClassNamesAsHints: boolean;
    semanticElementNames: boolean;
    maxNestingDepth: number;
}

export const DEFAULT_SETTINGS: AnalysisSettings = {
    minInstancesForPattern: 2,
    similarityThreshold: 0.8,
    includeSingleInstanceLayouts: true,
    detectNestedComponents: true,
    parseEmbeddedCSS: true,
    parseInlineStyles: false,
    analyzeClassCoUsage: true,
    detectLayoutPatterns: true,
    detectAntiPatterns: true,
    namingStyle: 'PascalCase',
    useClassNamesAsHints: true,
    semanticElementNames: true,
    maxNestingDepth: 10,
};

export interface AnalysisProgress {
    phase: 'parsing' | 'detecting' | 'analyzing' | 'scoring' | 'complete';
    phaseDescription: string;
    percentage: number;
    nodesProcessed: number;
    totalNodes: number;
    patternsFound: number;
    layoutsDetected: number;
}

export interface AnalysisResult {
    components: DetectedComponent[];
    layoutPatterns: LayoutPattern[];
    antiPatterns: AntiPattern[];
    summary: {
        totalNodes: number;
        uniqueComponents: number;
        totalInstances: number;
        repeatedPatterns: number;
        layoutComponents: number;
        uniqueSections: number;
        warningCount: number;
        errorCount: number;
    };
    parsedDOM: ParsedDOM;
    parsedCSS: ParsedCSS | null;
}

// ============================================================================
// EXPORT STRUCTURES
// ============================================================================

export interface ExportConfig {
    format: ExportFormat;
    cssStrategy: CSSStrategy;
    includeStyles: boolean;
    generatePropTypes: boolean;
    addPlaceholderComments: boolean;
    inlineStyles: boolean;
    includeSampleUsage: boolean;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
    format: 'html',
    cssStrategy: 'bem',
    includeStyles: true,
    generatePropTypes: true,
    addPlaceholderComments: true,
    inlineStyles: false,
    includeSampleUsage: false,
};

export interface ExportedComponent {
    name: string;
    html: string;
    css: string;
    props?: string[];
    usage?: string;
}

// ============================================================================
// APP STATE
// ============================================================================

export type AppState = 'idle' | 'analyzing' | 'results' | 'error' | 'no-components';
export type TabId = 'visual-preview' | 'dom-tree' | 'component-list' | 'export';
export type InputMethod = 'paste' | 'upload' | 'url' | 'folder';

export interface InputState {
    method: InputMethod;
    htmlContent: string;
    cssContent: string;
    fileName?: string;
    url?: string;
}
