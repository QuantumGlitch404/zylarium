// HTML Parser Engine - Parse HTML and build DOM tree

import { DOMStructure, ParsedDOM, DOMNodeReference } from '../types';

let nodeIdCounter = 0;

/**
 * Generate unique node ID
 */
function generateNodeId(): string {
    return `node_${++nodeIdCounter}`;
}

/**
 * Calculate XPath for a DOM element
 */
function calculateXPath(element: Element, root: Element): string {
    if (element === root) return '/';

    const parts: string[] = [];
    let current: Element | null = element;

    while (current && current !== root) {
        const parent = current.parentElement;
        if (!parent) break;

        const siblings = Array.from(parent.children).filter(c => c.tagName === current!.tagName);
        const index = siblings.indexOf(current) + 1;
        const tagName = current.tagName.toLowerCase();

        if (siblings.length > 1) {
            parts.unshift(`${tagName}[${index}]`);
        } else {
            parts.unshift(tagName);
        }

        current = parent;
    }

    return '/' + parts.join('/');
}

/**
 * Build DOMStructure from an HTML element
 */
function buildDOMStructureFromElement(element: Element, depth: number, maxDepth: number): DOMStructure {
    const classes = Array.from(element.classList);
    const attributes: Record<string, string> = {};

    for (const attr of element.attributes) {
        if (attr.name !== 'class' && attr.name !== 'id') {
            attributes[attr.name] = attr.value;
        }
    }

    const children: DOMStructure[] = [];

    if (depth < maxDepth) {
        for (const child of element.children) {
            children.push(buildDOMStructureFromElement(child, depth + 1, maxDepth));
        }
    }

    // Get direct text content (not from children)
    let textContent = '';
    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            textContent += node.textContent?.trim() || '';
        }
    }

    return {
        tag: element.tagName.toLowerCase(),
        classes,
        id: element.id || null,
        attributes,
        children,
        isComponentSlot: false,
        isTextSlot: textContent.length > 0,
        componentRef: null,
        textContent: textContent || undefined,
    };
}

/**
 * Parse HTML string and build DOM tree
 */
export function parseHTML(htmlString: string, maxDepth: number = 10): ParsedDOM {
    nodeIdCounter = 0;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Find the root element (body content or the whole thing)
    let rootElement: Element;

    if (doc.body && doc.body.children.length > 0) {
        // If there's a single root element, use it; otherwise use body
        if (doc.body.children.length === 1) {
            rootElement = doc.body.children[0];
        } else {
            rootElement = doc.body;
        }
    } else {
        rootElement = doc.documentElement;
    }

    const allNodes = new Map<string, DOMStructure>();
    let maxFoundDepth = 0;
    let nodeCount = 0;

    function traverse(structure: DOMStructure, depth: number) {
        const id = generateNodeId();
        allNodes.set(id, structure);
        nodeCount++;
        maxFoundDepth = Math.max(maxFoundDepth, depth);

        for (const child of structure.children) {
            traverse(child, depth + 1);
        }
    }

    const root = buildDOMStructureFromElement(rootElement, 0, maxDepth);
    traverse(root, 0);

    return {
        root,
        nodeCount,
        maxDepth: maxFoundDepth,
        allNodes,
    };
}

/**
 * Handle malformed HTML with lenient parsing
 */
export function parseHTMLLenient(htmlString: string, maxDepth: number = 10): { dom: ParsedDOM; warnings: string[] } {
    const warnings: string[] = [];

    // Fix common issues
    let fixed = htmlString;

    // Check for unclosed tags
    const unclosedTagRegex = /<(\w+)(?:\s[^>]*)?>(?![\s\S]*<\/\1>)/gi;
    const matches = htmlString.match(unclosedTagRegex);
    if (matches && matches.length > 0) {
        warnings.push(`Found ${matches.length} potentially unclosed tags`);
    }

    // Self-closing tags that HTML doesn't require closing
    const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];

    try {
        const dom = parseHTML(fixed, maxDepth);
        return { dom, warnings };
    } catch (error) {
        warnings.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Return minimal structure
        return {
            dom: {
                root: { tag: 'div', classes: [], id: null, attributes: {}, children: [], isComponentSlot: false, isTextSlot: false, componentRef: null },
                nodeCount: 1,
                maxDepth: 0,
                allNodes: new Map(),
            },
            warnings,
        };
    }
}

/**
 * Extract text content from DOM structure
 */
export function extractTextContent(structure: DOMStructure): string {
    let text = structure.textContent || '';

    for (const child of structure.children) {
        text += ' ' + extractTextContent(child);
    }

    return text.trim();
}

/**
 * Get element selector string (tag.class#id)
 */
export function getElementSelector(structure: DOMStructure): string {
    let selector = structure.tag;

    if (structure.id) {
        selector += `#${structure.id}`;
    }

    if (structure.classes.length > 0) {
        selector += '.' + structure.classes.join('.');
    }

    return selector;
}

/**
 * Create DOMNodeReference from structure
 */
export function createNodeReference(structure: DOMStructure, xpath: string): DOMNodeReference {
    return {
        id: generateNodeId(),
        xpath,
        element: getElementSelector(structure),
    };
}

/**
 * Find all elements matching a tag name
 */
export function findByTag(root: DOMStructure, tagName: string): DOMStructure[] {
    const results: DOMStructure[] = [];

    function traverse(node: DOMStructure) {
        if (node.tag === tagName) {
            results.push(node);
        }
        for (const child of node.children) {
            traverse(child);
        }
    }

    traverse(root);
    return results;
}

/**
 * Find all elements with a specific class
 */
export function findByClass(root: DOMStructure, className: string): DOMStructure[] {
    const results: DOMStructure[] = [];

    function traverse(node: DOMStructure) {
        if (node.classes.includes(className)) {
            results.push(node);
        }
        for (const child of node.children) {
            traverse(child);
        }
    }

    traverse(root);
    return results;
}

/**
 * Calculate nesting depth of a structure
 */
export function calculateDepth(structure: DOMStructure): number {
    if (structure.children.length === 0) return 0;

    let maxChildDepth = 0;
    for (const child of structure.children) {
        maxChildDepth = Math.max(maxChildDepth, calculateDepth(child));
    }

    return 1 + maxChildDepth;
}

/**
 * Serialize structure back to HTML
 */
export function serializeToHTML(structure: DOMStructure, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    const attrs: string[] = [];

    if (structure.id) {
        attrs.push(`id="${structure.id}"`);
    }

    if (structure.classes.length > 0) {
        attrs.push(`class="${structure.classes.join(' ')}"`);
    }

    for (const [key, value] of Object.entries(structure.attributes)) {
        attrs.push(`${key}="${value}"`);
    }

    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

    if (structure.children.length === 0 && !structure.textContent) {
        // Self-closing or empty
        const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
        if (selfClosing.includes(structure.tag)) {
            return `${spaces}<${structure.tag}${attrStr} />`;
        }
        return `${spaces}<${structure.tag}${attrStr}></${structure.tag}>`;
    }

    let content = '';

    if (structure.textContent) {
        content = structure.textContent;
    }

    if (structure.children.length > 0) {
        content = '\n' + structure.children.map(c => serializeToHTML(c, indent + 1)).join('\n') + '\n' + spaces;
    }

    return `${spaces}<${structure.tag}${attrStr}>${content}</${structure.tag}>`;
}
