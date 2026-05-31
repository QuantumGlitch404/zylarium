// Pattern Detector Engine - Detect repeated patterns and group variants

import { DOMStructure, DetectedComponent, ComponentInstance, ComponentVariant, ComponentMetrics, DOMNodeReference, InstanceDifference, StabilityFactor, RefactorFactor, ComponentWarning, AnalysisSettings } from '../types';
import { getElementSelector, calculateDepth, serializeToHTML } from './HTMLParser';

let componentIdCounter = 0;
let instanceIdCounter = 0;
let variantIdCounter = 0;

function generateComponentId(): string {
    return `component_${++componentIdCounter}`;
}

function generateInstanceId(): string {
    return `instance_${++instanceIdCounter}`;
}

function generateVariantId(): string {
    return `variant_${++variantIdCounter}`;
}

/**
 * Compute structural hash for a DOM subtree
 * Used to find identical/similar patterns
 */
export function computeStructuralHash(structure: DOMStructure): string {
    const parts: string[] = [structure.tag];

    // Include sorted classes
    parts.push(structure.classes.slice().sort().join(','));

    // Include child hashes
    const childHashes = structure.children.map(c => computeStructuralHash(c)).sort();
    parts.push(childHashes.join('|'));

    return parts.join(':');
}

/**
 * Calculate structural similarity between two DOM structures
 */
export function calculateStructuralSimilarity(a: DOMStructure, b: DOMStructure): number {
    if (a.tag !== b.tag) return 0;

    let score = 1; // Same tag
    let totalChecks = 1;

    // Class similarity
    const aClasses = new Set(a.classes);
    const bClasses = new Set(b.classes);
    const unionClasses = new Set([...aClasses, ...bClasses]);
    const intersectClasses = new Set([...aClasses].filter(c => bClasses.has(c)));

    if (unionClasses.size > 0) {
        score += intersectClasses.size / unionClasses.size;
        totalChecks++;
    }

    // Children similarity
    if (a.children.length === b.children.length) {
        score += 1;
        totalChecks++;

        // Compare children recursively
        for (let i = 0; i < a.children.length; i++) {
            score += calculateStructuralSimilarity(a.children[i], b.children[i]);
            totalChecks++;
        }
    } else {
        // Partial credit for similar child count
        const maxChildren = Math.max(a.children.length, b.children.length);
        const minChildren = Math.min(a.children.length, b.children.length);
        if (maxChildren > 0) {
            score += minChildren / maxChildren;
            totalChecks++;
        }
    }

    return score / totalChecks;
}

/**
 * Calculate overall similarity score
 */
export function calculateOverallSimilarity(a: DOMStructure, b: DOMStructure): number {
    const structural = calculateStructuralSimilarity(a, b);

    // Class similarity
    const aClasses = new Set(a.classes);
    const bClasses = new Set(b.classes);
    const unionClasses = new Set([...aClasses, ...bClasses]);
    const intersectClasses = new Set([...aClasses].filter(c => bClasses.has(c)));
    const classSimilarity = unionClasses.size > 0 ? intersectClasses.size / unionClasses.size : 1;

    // Layout similarity (same number of children at top level)
    const layoutSimilarity = a.children.length === b.children.length ? 1 : 0.5;

    // Weighted combination
    return 0.5 * structural + 0.3 * classSimilarity + 0.2 * layoutSimilarity;
}

/**
 * Find all repeated patterns in DOM tree
 */
export function findRepeatedPatterns(root: DOMStructure, settings: AnalysisSettings): Map<string, DOMStructure[]> {
    const hashMap = new Map<string, DOMStructure[]>();

    function traverse(node: DOMStructure) {
        const hash = computeStructuralHash(node);

        if (!hashMap.has(hash)) {
            hashMap.set(hash, []);
        }
        hashMap.get(hash)!.push(node);

        for (const child of node.children) {
            traverse(child);
        }
    }

    traverse(root);

    // Filter to only patterns with minimum instances
    const filtered = new Map<string, DOMStructure[]>();
    for (const [hash, nodes] of hashMap) {
        if (nodes.length >= settings.minInstancesForPattern) {
            filtered.set(hash, nodes);
        }
    }

    return filtered;
}

/**
 * Group similar patterns as variants of the same component
 */
export function groupVariants(patterns: Map<string, DOMStructure[]>, settings: AnalysisSettings): Map<string, DOMStructure[][]> {
    const groups = new Map<string, DOMStructure[][]>();
    const processed = new Set<string>();

    const hashes = Array.from(patterns.keys());

    for (let i = 0; i < hashes.length; i++) {
        const hash = hashes[i];
        if (processed.has(hash)) continue;

        const nodes = patterns.get(hash)!;
        const group: DOMStructure[][] = [nodes];
        processed.add(hash);

        // Find similar patterns
        for (let j = i + 1; j < hashes.length; j++) {
            const otherHash = hashes[j];
            if (processed.has(otherHash)) continue;

            const otherNodes = patterns.get(otherHash)!;

            // Compare first node of each group
            const similarity = calculateOverallSimilarity(nodes[0], otherNodes[0]);

            if (similarity >= settings.similarityThreshold) {
                group.push(otherNodes);
                processed.add(otherHash);
            }
        }

        groups.set(hash, group);
    }

    return groups;
}

/**
 * Infer component name from structure
 */
export function inferComponentName(structure: DOMStructure, settings: AnalysisSettings): string {
    // Try to get name from class
    if (settings.useClassNamesAsHints && structure.classes.length > 0) {
        // Find the most meaningful class (shortest, non-utility)
        const utilityPrefixes = ['p-', 'm-', 'w-', 'h-', 'bg-', 'text-', 'flex-', 'grid-', 'col-', 'row-'];
        const meaningfulClasses = structure.classes.filter(c =>
            !utilityPrefixes.some(p => c.startsWith(p)) && c.length > 2
        );

        if (meaningfulClasses.length > 0) {
            // Convert to PascalCase
            const className = meaningfulClasses[0];
            return formatName(className, settings.namingStyle);
        }
    }

    // Try semantic element names
    if (settings.semanticElementNames) {
        const semanticNames: Record<string, string> = {
            'nav': 'Navbar',
            'header': 'Header',
            'footer': 'Footer',
            'aside': 'Sidebar',
            'main': 'Main',
            'section': 'Section',
            'article': 'Article',
            'form': 'Form',
            'button': 'Button',
            'a': 'Link',
            'ul': 'List',
            'ol': 'List',
            'li': 'ListItem',
            'table': 'Table',
            'img': 'Image',
        };

        if (semanticNames[structure.tag]) {
            return semanticNames[structure.tag];
        }
    }

    // Fallback to generic name
    return `Component${componentIdCounter}`;
}

function formatName(name: string, style: 'PascalCase' | 'camelCase' | 'kebab-case'): string {
    // Split by common separators
    const parts = name.split(/[-_\s]+/);

    switch (style) {
        case 'PascalCase':
            return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
        case 'camelCase':
            return parts.map((p, i) =>
                i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
            ).join('');
        case 'kebab-case':
            return parts.map(p => p.toLowerCase()).join('-');
    }
}

/**
 * Calculate stability score for a component
 */
export function calculateStabilityScore(instances: DOMStructure[]): { score: number; factors: StabilityFactor[] } {
    if (instances.length < 2) {
        return { score: 100, factors: [] };
    }

    const canonical = instances[0];
    let score = 100;
    const factors: StabilityFactor[] = [];

    for (let i = 1; i < instances.length; i++) {
        const instance = instances[i];

        // Check for missing elements
        if (instance.children.length < canonical.children.length) {
            const missing = canonical.children.length - instance.children.length;
            score -= missing * 15;
            factors.push({
                factor: 'missing_element',
                impact: -missing * 15,
                instances: [`instance_${i}`],
                description: `Missing ${missing} child element(s)`,
            });
        }

        // Check for extra elements
        if (instance.children.length > canonical.children.length) {
            const extra = instance.children.length - canonical.children.length;
            score -= extra * 10;
            factors.push({
                factor: 'extra_element',
                impact: -extra * 10,
                instances: [`instance_${i}`],
                description: `Has ${extra} extra child element(s)`,
            });
        }

        // Check for class differences
        const canonicalClasses = new Set(canonical.classes);
        const instanceClasses = new Set(instance.classes);
        const classDiff = [...canonicalClasses].filter(c => !instanceClasses.has(c)).length +
            [...instanceClasses].filter(c => !canonicalClasses.has(c)).length;

        if (classDiff > 0) {
            score -= classDiff * 5;
            factors.push({
                factor: 'class_difference',
                impact: -classDiff * 5,
                instances: [`instance_${i}`],
                description: `${classDiff} class difference(s)`,
            });
        }
    }

    return { score: Math.max(0, Math.min(100, score)), factors };
}

/**
 * Calculate refactor readiness score
 */
export function calculateRefactorReadiness(structure: DOMStructure): { score: number; factors: RefactorFactor[] } {
    let score = 100;
    const factors: RefactorFactor[] = [];

    // Check for inline styles
    if (structure.attributes['style']) {
        score -= 10;
        factors.push({
            type: 'inline',
            impact: -10,
            description: 'Has inline styles',
            location: getElementSelector(structure),
            suggestion: 'Move inline styles to CSS class',
        });
    }

    // Check for deep nesting
    const depth = calculateDepth(structure);
    if (depth > 4) {
        score -= 15;
        factors.push({
            type: 'complexity',
            impact: -15,
            description: `Deep nesting (${depth} levels)`,
            location: getElementSelector(structure),
            suggestion: 'Flatten structure to max 3-4 levels',
        });
    }

    // Check for hardcoded content
    if (structure.textContent && structure.textContent.length > 20) {
        score -= 5;
        factors.push({
            type: 'hardcoded',
            impact: -5,
            description: 'Has hardcoded text content',
            location: getElementSelector(structure),
            suggestion: 'Make text content configurable via props',
        });
    }

    // Check for event handlers
    for (const attr of Object.keys(structure.attributes)) {
        if (attr.startsWith('on')) {
            score -= 20;
            factors.push({
                type: 'dependency',
                impact: -20,
                description: `Has inline event handler: ${attr}`,
                location: getElementSelector(structure),
                suggestion: 'Move event handler to component logic',
            });
            break;
        }
    }

    // Bonuses
    const semanticTags = ['nav', 'header', 'footer', 'main', 'article', 'section', 'aside', 'button', 'form'];
    if (semanticTags.includes(structure.tag)) {
        score += 5;
        factors.push({
            type: 'complexity',
            impact: 5,
            description: 'Uses semantic HTML',
            location: getElementSelector(structure),
            suggestion: '',
        });
    }

    // BEM-style naming
    const hasBEM = structure.classes.some(c => c.includes('__') || c.includes('--'));
    if (hasBEM) {
        score += 5;
        factors.push({
            type: 'complexity',
            impact: 5,
            description: 'Uses BEM naming convention',
            location: getElementSelector(structure),
            suggestion: '',
        });
    }

    return { score: Math.max(0, Math.min(100, score)), factors };
}

/**
 * Create DetectedComponent from a group of similar structures
 */
export function createDetectedComponent(
    structures: DOMStructure[],
    settings: AnalysisSettings
): DetectedComponent {
    const id = generateComponentId();
    const canonical = structures[0];
    const name = inferComponentName(canonical, settings);

    // Create instances
    const instances: ComponentInstance[] = structures.map((s, i) => ({
        id: generateInstanceId(),
        componentId: id,
        domNode: {
            id: `node_${i}`,
            xpath: '',
            element: getElementSelector(s),
        },
        xpath: '',
        htmlContent: serializeToHTML(s),
        textContent: s.textContent || '',
        boundingBox: { top: 0, left: 0, width: 0, height: 0 },
        variantId: '',
        differences: [],
    }));

    // Create single variant for now
    const variant: ComponentVariant = {
        id: generateVariantId(),
        componentId: id,
        name: 'Default',
        instanceCount: instances.length,
        structuralDifferences: {
            addedElements: [],
            removedElements: [],
            differentAttributes: [],
        },
        representativeInstance: instances[0].id,
    };

    // Calculate metrics
    const { score: stabilityScore, factors: stabilityFactors } = calculateStabilityScore(structures);
    const { score: refactorScore, factors: refactorFactors } = calculateRefactorReadiness(canonical);

    const metrics: ComponentMetrics = {
        instanceCount: instances.length,
        variantCount: 1,
        averageSize: instances.reduce((sum, i) => sum + i.htmlContent.length, 0) / instances.length,
        nestingDepth: calculateDepth(canonical),
        stabilityScore,
        stabilityFactors,
        refactorReadinessScore: refactorScore,
        refactorFactors,
        complexity: calculateDepth(canonical) * canonical.children.length,
    };

    // Collect CSS classes
    const cssClasses = new Set<string>();
    function collectClasses(s: DOMStructure) {
        s.classes.forEach(c => cssClasses.add(c));
        s.children.forEach(collectClasses);
    }
    collectClasses(canonical);

    // Collect inline styles
    const inlineStyles: string[] = [];
    if (canonical.attributes['style']) {
        inlineStyles.push(canonical.attributes['style']);
    }

    // Determine type
    const type = instances.length > 1 ? 'repeated' : 'unique';

    return {
        id,
        name,
        type,
        instances,
        variants: [variant],
        rootSelector: getElementSelector(canonical),
        structure: canonical,
        containedComponents: [],
        parentComponent: null,
        cssClasses: Array.from(cssClasses),
        inlineStyles,
        metrics,
        warnings: [],
    };
}

/**
 * Reset counters (for testing)
 */
export function resetCounters(): void {
    componentIdCounter = 0;
    instanceIdCounter = 0;
    variantIdCounter = 0;
}
