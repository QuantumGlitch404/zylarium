// Layout Pattern Recognizer Engine - Detect common layout patterns

import { DOMStructure, LayoutPattern, DOMNodeReference, LayoutPatternType } from '../types';
import { getElementSelector } from './HTMLParser';

/**
 * Create a DOMNodeReference from structure
 */
function createRef(structure: DOMStructure, xpath: string = ''): DOMNodeReference {
    return {
        id: `ref_${Math.random().toString(36).substr(2, 9)}`,
        xpath,
        element: getElementSelector(structure),
    };
}

/**
 * Detect navbar/navigation pattern
 */
export function detectNavbar(structure: DOMStructure): LayoutPattern | null {
    // Check for nav element or common navbar classes
    const isNav = structure.tag === 'nav' ||
        structure.tag === 'header' ||
        structure.classes.some(c =>
            c.includes('nav') || c.includes('header') || c.includes('menu')
        );

    if (!isNav) return null;

    // Check for navigation items
    const hasLinks = structure.children.some(c =>
        c.tag === 'a' ||
        c.tag === 'ul' ||
        c.children.some(cc => cc.tag === 'a')
    );

    if (!hasLinks) return null;

    // Count nav items
    let itemCount = 0;
    let hasLogo = false;
    let hasCTA = false;

    function countItems(s: DOMStructure) {
        if (s.tag === 'a') itemCount++;
        if (s.tag === 'img' || s.classes.some(c => c.includes('logo'))) hasLogo = true;
        if (s.tag === 'button' || s.classes.some(c => c.includes('btn') || c.includes('cta'))) hasCTA = true;
        s.children.forEach(countItems);
    }

    countItems(structure);

    return {
        type: 'navbar',
        confidence: itemCount >= 2 ? 0.9 : 0.6,
        detectedAt: createRef(structure),
        properties: {
            itemCount,
            hasLogo,
            hasCTA,
        },
    };
}

/**
 * Detect card grid pattern
 */
export function detectCardGrid(structure: DOMStructure): LayoutPattern | null {
    // Need at least 2 similar children
    if (structure.children.length < 2) return null;

    // Check if children have similar structure
    const childTags = structure.children.map(c => c.tag);
    const childClasses = structure.children.map(c => c.classes.join(','));

    const allSameTag = childTags.every(t => t === childTags[0]);
    const similarClasses = childClasses.filter(c => c === childClasses[0]).length >= structure.children.length * 0.8;

    if (!allSameTag && !similarClasses) return null;

    // Check for card-like structure (has image + text + button)
    const hasCardFeatures = structure.children.some(c => {
        const hasImage = c.children.some(cc => cc.tag === 'img');
        const hasText = c.children.some(cc => ['h1', 'h2', 'h3', 'h4', 'p'].includes(cc.tag));
        return hasImage && hasText;
    });

    // Check for grid/flex styling classes
    const isGrid = structure.classes.some(c =>
        c.includes('grid') || c.includes('cards') || c.includes('list')
    );

    if (!hasCardFeatures && !isGrid) return null;

    // Estimate columns
    let columns = 3; // Default assumption
    if (structure.classes.some(c => c.includes('col-2') || c.includes('two'))) columns = 2;
    if (structure.classes.some(c => c.includes('col-4') || c.includes('four'))) columns = 4;

    return {
        type: 'card-grid',
        confidence: hasCardFeatures ? 0.85 : 0.65,
        detectedAt: createRef(structure),
        properties: {
            columns,
            itemCount: structure.children.length,
        },
    };
}

/**
 * Detect form pattern
 */
export function detectForm(structure: DOMStructure): LayoutPattern | null {
    const isForm = structure.tag === 'form' ||
        structure.classes.some(c => c.includes('form'));

    if (!isForm) return null;

    let fieldCount = 0;
    let hasSubmit = false;

    function countFields(s: DOMStructure) {
        if (['input', 'textarea', 'select'].includes(s.tag)) fieldCount++;
        if (s.tag === 'button' || (s.tag === 'input' && s.attributes['type'] === 'submit')) hasSubmit = true;
        s.children.forEach(countFields);
    }

    countFields(structure);

    if (fieldCount === 0) return null;

    return {
        type: 'form',
        confidence: hasSubmit ? 0.95 : 0.75,
        detectedAt: createRef(structure),
        properties: {
            fieldCount,
            hasSubmit,
        },
    };
}

/**
 * Detect hero section pattern
 */
export function detectHeroSection(structure: DOMStructure): LayoutPattern | null {
    const isHero = structure.classes.some(c =>
        c.includes('hero') || c.includes('banner') || c.includes('jumbotron')
    );

    if (!isHero) {
        // Check for hero-like structure: large heading + text + CTA
        const hasLargeHeading = structure.children.some(c => c.tag === 'h1');
        const hasText = structure.children.some(c => c.tag === 'p');
        const hasButton = structure.children.some(c => c.tag === 'button' || c.tag === 'a');

        if (!(hasLargeHeading && hasText && hasButton)) return null;
    }

    return {
        type: 'hero',
        confidence: isHero ? 0.9 : 0.7,
        detectedAt: createRef(structure),
        properties: {},
    };
}

/**
 * Detect sidebar pattern
 */
export function detectSidebar(structure: DOMStructure): LayoutPattern | null {
    const isSidebar = structure.tag === 'aside' ||
        structure.classes.some(c => c.includes('sidebar') || c.includes('aside'));

    if (!isSidebar) return null;

    return {
        type: 'sidebar',
        confidence: 0.85,
        detectedAt: createRef(structure),
        properties: {},
    };
}

/**
 * Detect footer pattern
 */
export function detectFooter(structure: DOMStructure): LayoutPattern | null {
    const isFooter = structure.tag === 'footer' ||
        structure.classes.some(c => c.includes('footer'));

    if (!isFooter) return null;

    return {
        type: 'footer',
        confidence: 0.9,
        detectedAt: createRef(structure),
        properties: {},
    };
}

/**
 * Detect list pattern
 */
export function detectList(structure: DOMStructure): LayoutPattern | null {
    const isList = structure.tag === 'ul' || structure.tag === 'ol' ||
        structure.classes.some(c => c.includes('list'));

    if (!isList) return null;

    const itemCount = structure.children.filter(c => c.tag === 'li').length;

    if (itemCount < 2) return null;

    return {
        type: 'list',
        confidence: 0.9,
        detectedAt: createRef(structure),
        properties: {
            itemCount,
        },
    };
}

/**
 * Detect CSS Grid layout
 */
export function detectGridLayout(structure: DOMStructure): LayoutPattern | null {
    const hasGridClass = structure.classes.some(c =>
        c.includes('grid') && !c.includes('card')
    );

    if (!hasGridClass) return null;

    // Try to detect columns from class
    let columns: number | undefined;
    for (const cls of structure.classes) {
        const match = cls.match(/grid-cols-(\d+)/);
        if (match) {
            columns = parseInt(match[1]);
            break;
        }
    }

    return {
        type: 'grid',
        confidence: 0.85,
        detectedAt: createRef(structure),
        properties: {
            columns,
        },
    };
}

/**
 * Detect all layout patterns in a DOM structure
 */
export function detectAllLayoutPatterns(root: DOMStructure): LayoutPattern[] {
    const patterns: LayoutPattern[] = [];

    function traverse(structure: DOMStructure) {
        // Try all detectors
        const detectors = [
            detectNavbar,
            detectCardGrid,
            detectForm,
            detectHeroSection,
            detectSidebar,
            detectFooter,
            detectList,
            detectGridLayout,
        ];

        for (const detector of detectors) {
            const pattern = detector(structure);
            if (pattern) {
                patterns.push(pattern);
                // Don't break - one element might match multiple patterns
            }
        }

        // Traverse children
        for (const child of structure.children) {
            traverse(child);
        }
    }

    traverse(root);

    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);

    return patterns;
}

/**
 * Get pattern display name
 */
export function getPatternDisplayName(type: LayoutPatternType): string {
    const names: Record<LayoutPatternType, string> = {
        'grid': 'CSS Grid Layout',
        'flex-row': 'Flexbox Row',
        'flex-column': 'Flexbox Column',
        'navbar': 'Navigation Bar',
        'sidebar': 'Sidebar',
        'card-grid': 'Card Grid',
        'list': 'List',
        'form': 'Form',
        'hero': 'Hero Section',
        'footer': 'Footer',
    };

    return names[type] || type;
}
