// Anti-Pattern Detector Engine - Detect HTML/CSS anti-patterns

import { DOMStructure, AntiPattern, AntiPatternType, DOMNodeReference, Severity } from '../types';
import { getElementSelector, calculateDepth } from './HTMLParser';

/**
 * Create DOMNodeReference from structure
 */
function createRef(structure: DOMStructure): DOMNodeReference {
    return {
        id: `ref_${Math.random().toString(36).substr(2, 9)}`,
        xpath: '',
        element: getElementSelector(structure),
    };
}

/**
 * Detect deep nesting anti-pattern (>4-5 levels)
 */
export function detectDeepNesting(structure: DOMStructure, maxAllowedDepth: number = 4): AntiPattern[] {
    const patterns: AntiPattern[] = [];

    function traverse(node: DOMStructure, path: string[], depth: number) {
        if (depth > maxAllowedDepth && node.tag === 'div') {
            patterns.push({
                type: 'deep-nesting',
                severity: depth > 6 ? 'error' : 'warning',
                location: createRef(node),
                description: `Nesting depth of ${depth} levels exceeds recommended maximum of ${maxAllowedDepth}`,
                suggestion: 'Flatten the structure or extract intermediate components. Consider using semantic HTML elements instead of nested divs.',
                affectedElements: 1,
            });
        }

        for (const child of node.children) {
            traverse(child, [...path, getElementSelector(node)], depth + 1);
        }
    }

    traverse(structure, [], 0);
    return patterns;
}

/**
 * Detect "div soup" anti-pattern (too many non-semantic divs)
 */
export function detectDivSoup(structure: DOMStructure): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    let divCount = 0;
    let totalElements = 0;

    function countElements(node: DOMStructure) {
        totalElements++;
        if (node.tag === 'div') divCount++;
        node.children.forEach(countElements);
    }

    countElements(structure);

    const divRatio = divCount / totalElements;

    if (divRatio > 0.6 && totalElements > 10) {
        patterns.push({
            type: 'div-soup',
            severity: 'warning',
            location: createRef(structure),
            description: `${Math.round(divRatio * 100)}% of elements are divs (${divCount}/${totalElements})`,
            suggestion: 'Use semantic HTML5 elements like <nav>, <header>, <main>, <section>, <article>, <aside>, <footer> instead of generic divs.',
            affectedElements: divCount,
        });
    }

    return patterns;
}

/**
 * Detect inline styles overuse
 */
export function detectInlineStyles(structure: DOMStructure): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    const elementsWithInline: DOMStructure[] = [];

    function findInlineStyles(node: DOMStructure) {
        if (node.attributes['style']) {
            elementsWithInline.push(node);
        }
        node.children.forEach(findInlineStyles);
    }

    findInlineStyles(structure);

    if (elementsWithInline.length >= 3) {
        patterns.push({
            type: 'inline-styles',
            severity: 'warning',
            location: createRef(elementsWithInline[0]),
            description: `${elementsWithInline.length} elements have inline styles`,
            suggestion: 'Move inline styles to CSS classes for better maintainability and reusability. Example: style="margin-top: 20px" → class="mt-5"',
            affectedElements: elementsWithInline.length,
        });
    }

    return patterns;
}

/**
 * Detect non-semantic markup (divs used as buttons, links, etc.)
 */
export function detectNonSemanticMarkup(structure: DOMStructure): AntiPattern[] {
    const patterns: AntiPattern[] = [];

    function check(node: DOMStructure) {
        // Div or span with button-like classes
        if ((node.tag === 'div' || node.tag === 'span') &&
            node.classes.some(c => c.includes('btn') || c.includes('button'))) {
            patterns.push({
                type: 'non-semantic',
                severity: 'error',
                location: createRef(node),
                description: `Using <${node.tag}> with button styling instead of <button>`,
                suggestion: 'Use <button> element for clickable actions. This improves accessibility and keyboard navigation.',
                affectedElements: 1,
            });
        }

        // Div with onclick but not a button
        if (node.tag !== 'button' && node.tag !== 'a' && node.attributes['onclick']) {
            patterns.push({
                type: 'non-semantic',
                severity: 'error',
                location: createRef(node),
                description: `Using onclick on non-interactive <${node.tag}> element`,
                suggestion: 'Use <button> for actions or <a> for navigation. Add proper role and tabindex if semantic elements cannot be used.',
                affectedElements: 1,
            });
        }

        node.children.forEach(check);
    }

    check(structure);
    return patterns;
}

/**
 * Detect non-descriptive class names
 */
export function detectNonDescriptiveClasses(structure: DOMStructure): AntiPattern[] {
    const patterns: AntiPattern[] = [];
    const badClasses: string[] = [];

    // Patterns for non-descriptive classes
    const badPatterns = [
        /^[a-z]$/i,           // Single letter
        /^[a-z]{1,2}\d+$/i,   // a1, x2, ab3
        /^\d+$/,              // Just numbers
        /^wrapper\d*$/i,      // wrapper1, wrapper2
        /^container\d+$/i,    // container1, container2
        /^div\d*$/i,          // div1, div2
    ];

    function check(node: DOMStructure) {
        for (const cls of node.classes) {
            if (badPatterns.some(p => p.test(cls))) {
                if (!badClasses.includes(cls)) {
                    badClasses.push(cls);
                }
            }
        }
        node.children.forEach(check);
    }

    check(structure);

    if (badClasses.length >= 3) {
        patterns.push({
            type: 'non-semantic',
            severity: 'warning',
            location: createRef(structure),
            description: `Found ${badClasses.length} non-descriptive class names: ${badClasses.slice(0, 5).join(', ')}${badClasses.length > 5 ? '...' : ''}`,
            suggestion: 'Use meaningful, descriptive class names that indicate purpose. Example: .wrapper1 → .product-card-container',
            affectedElements: badClasses.length,
        });
    }

    return patterns;
}

/**
 * Detect brittle selectors (overly specific or position-based)
 */
export function detectBrittleSelectors(structure: DOMStructure): AntiPattern[] {
    const patterns: AntiPattern[] = [];

    // This would normally analyze CSS selectors, but since we're working with DOM structure,
    // we check for anti-patterns that would lead to brittle selectors

    // Elements with no class that are targeted by position
    function checkPositionDependence(node: DOMStructure, index: number, siblings: number) {
        if (node.classes.length === 0 && !node.id && siblings > 1) {
            // This element would need nth-child or position-based selector
            const depth = calculateDepth(node);
            if (depth > 2) {
                patterns.push({
                    type: 'brittle-selectors',
                    severity: 'warning',
                    location: createRef(node),
                    description: `Element <${node.tag}> has no class/id and relies on position (child ${index + 1} of ${siblings})`,
                    suggestion: 'Add a descriptive class to make the element targetable without relying on DOM position.',
                    affectedElements: 1,
                });
            }
        }

        node.children.forEach((child, i) => checkPositionDependence(child, i, node.children.length));
    }

    structure.children.forEach((child, i) => checkPositionDependence(child, i, structure.children.length));

    return patterns;
}

/**
 * Detect all anti-patterns in a DOM structure
 */
export function detectAllAntiPatterns(root: DOMStructure, maxNestingDepth: number = 4): AntiPattern[] {
    const allPatterns: AntiPattern[] = [];

    allPatterns.push(...detectDeepNesting(root, maxNestingDepth));
    allPatterns.push(...detectDivSoup(root));
    allPatterns.push(...detectInlineStyles(root));
    allPatterns.push(...detectNonSemanticMarkup(root));
    allPatterns.push(...detectNonDescriptiveClasses(root));
    allPatterns.push(...detectBrittleSelectors(root));

    // Sort by severity (errors first) then by affected elements
    allPatterns.sort((a, b) => {
        if (a.severity !== b.severity) {
            return a.severity === 'error' ? -1 : 1;
        }
        return b.affectedElements - a.affectedElements;
    });

    return allPatterns;
}

/**
 * Get anti-pattern display name
 */
export function getAntiPatternDisplayName(type: AntiPatternType): string {
    const names: Record<AntiPatternType, string> = {
        'deep-nesting': 'Deep Nesting',
        'div-soup': 'Div Soup',
        'inline-styles': 'Inline Styles Overuse',
        'duplicate-styles': 'Duplicate Styles',
        'non-semantic': 'Non-Semantic Markup',
        'brittle-selectors': 'Brittle Selectors',
    };

    return names[type] || type;
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: Severity): string {
    return severity === 'error' ? 'red' : 'yellow';
}
