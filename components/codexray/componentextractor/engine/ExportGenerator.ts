// Export Generator Engine - Generate component code in various formats

import { DetectedComponent, ExportConfig, ExportedComponent, DOMStructure } from '../types';
import { serializeToHTML } from './HTMLParser';

/**
 * Convert structure to placeholder-enhanced HTML
 */
function structureToPlaceholderHTML(structure: DOMStructure, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    const attrs: string[] = [];

    if (structure.id) {
        attrs.push(`id="${structure.id}"`);
    }

    if (structure.classes.length > 0) {
        attrs.push(`class="${structure.classes.join(' ')}"`);
    }

    // Replace src, href with placeholders
    for (const [key, value] of Object.entries(structure.attributes)) {
        if (key === 'src') {
            attrs.push(`src="{{imageSrc}}"`);
        } else if (key === 'href') {
            attrs.push(`href="{{href}}"`);
        } else if (key === 'alt') {
            attrs.push(`alt="{{imageAlt}}"`);
        } else if (key !== 'style') {
            attrs.push(`${key}="${value}"`);
        }
    }

    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

    // Self-closing tags
    const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
    if (selfClosing.includes(structure.tag)) {
        return `${spaces}<${structure.tag}${attrStr} />`;
    }

    if (structure.children.length === 0) {
        // Text content becomes placeholder
        if (structure.textContent && structure.textContent.length > 0) {
            return `${spaces}<${structure.tag}${attrStr}>{{${inferPropName(structure)}}}</${structure.tag}>`;
        }
        return `${spaces}<${structure.tag}${attrStr}></${structure.tag}>`;
    }

    const childrenHTML = structure.children.map(c => structureToPlaceholderHTML(c, indent + 1)).join('\n');
    return `${spaces}<${structure.tag}${attrStr}>\n${childrenHTML}\n${spaces}</${structure.tag}>`;
}

/**
 * Infer prop name from structure
 */
function inferPropName(structure: DOMStructure): string {
    // Try tag-based names
    const tagNames: Record<string, string> = {
        'h1': 'title',
        'h2': 'title',
        'h3': 'title',
        'h4': 'title',
        'p': 'text',
        'span': 'text',
        'button': 'buttonText',
        'a': 'linkText',
        'label': 'label',
    };

    if (tagNames[structure.tag]) {
        return tagNames[structure.tag];
    }

    // Try class-based names
    if (structure.classes.length > 0) {
        const className = structure.classes[0];
        if (className.includes('title')) return 'title';
        if (className.includes('desc')) return 'description';
        if (className.includes('text')) return 'text';
        if (className.includes('name')) return 'name';
        if (className.includes('label')) return 'label';
    }

    return 'content';
}

/**
 * Extract props from structure
 */
function extractProps(structure: DOMStructure): string[] {
    const props = new Set<string>();

    function traverse(s: DOMStructure) {
        // Check for image
        if (s.tag === 'img') {
            props.add('imageSrc');
            props.add('imageAlt');
        }

        // Check for links
        if (s.tag === 'a' || s.attributes['href']) {
            props.add('href');
        }

        // Text content
        if (s.textContent && s.textContent.length > 0) {
            props.add(inferPropName(s));
        }

        s.children.forEach(traverse);
    }

    traverse(structure);
    return Array.from(props);
}

/**
 * Generate BEM CSS class names
 */
function generateBEMCSS(component: DetectedComponent): string {
    const blockName = component.name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
    const lines: string[] = [];

    lines.push(`/* ${component.name} Component Styles */`);
    lines.push(`.${blockName} {`);
    lines.push('  display: flex;');
    lines.push('  flex-direction: column;');
    lines.push('}');
    lines.push('');

    // Generate element classes
    function generateChildCSS(structure: DOMStructure, parentName: string) {
        for (const child of structure.children) {
            const elementName = child.classes[0] || child.tag;
            const bemClass = `${parentName}__${elementName.replace(/^[^a-zA-Z]+/, '')}`;

            lines.push(`.${bemClass} {`);
            lines.push('  /* Add styles */');
            lines.push('}');
            lines.push('');
        }
    }

    generateChildCSS(component.structure, blockName);

    return lines.join('\n');
}

/**
 * Export as plain HTML/CSS
 */
export function exportPlainHTML(component: DetectedComponent, config: ExportConfig): ExportedComponent {
    const html = structureToPlaceholderHTML(component.structure);
    const css = config.includeStyles ? generateBEMCSS(component) : '';
    const props = extractProps(component.structure);

    let result = `<!-- ${component.name} Component -->\n${html}`;

    if (config.addPlaceholderComments) {
        result = `<!--\n  ${component.name} Component\n  Props: ${props.join(', ')}\n-->\n${html}`;
    }

    return {
        name: component.name,
        html: result,
        css,
        props,
    };
}

/**
 * Export as React JSX
 */
export function exportReact(component: DetectedComponent, config: ExportConfig): ExportedComponent {
    const props = extractProps(component.structure);
    const propsInterface = props.map(p => `  ${p}: string;`).join('\n');
    const propsDestructure = props.join(', ');

    // Convert HTML to JSX
    function toJSX(structure: DOMStructure, indent: number = 2): string {
        const spaces = '  '.repeat(indent);
        const attrs: string[] = [];

        if (structure.classes.length > 0) {
            attrs.push(`className="${structure.classes.join(' ')}"`);
        }

        if (structure.id) {
            attrs.push(`id="${structure.id}"`);
        }

        for (const [key, value] of Object.entries(structure.attributes)) {
            if (key === 'class') continue;
            if (key === 'for') {
                attrs.push(`htmlFor="${value}"`);
            } else if (key === 'src') {
                attrs.push(`src={imageSrc}`);
            } else if (key === 'href') {
                attrs.push(`href={href}`);
            } else if (key === 'alt') {
                attrs.push(`alt={imageAlt}`);
            } else {
                attrs.push(`${key}="${value}"`);
            }
        }

        const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

        const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
        if (selfClosing.includes(structure.tag)) {
            return `${spaces}<${structure.tag}${attrStr} />`;
        }

        if (structure.children.length === 0) {
            if (structure.textContent) {
                return `${spaces}<${structure.tag}${attrStr}>{${inferPropName(structure)}}</${structure.tag}>`;
            }
            return `${spaces}<${structure.tag}${attrStr} />`;
        }

        const children = structure.children.map(c => toJSX(c, indent + 1)).join('\n');
        return `${spaces}<${structure.tag}${attrStr}>\n${children}\n${spaces}</${structure.tag}>`;
    }

    const jsxContent = toJSX(component.structure);

    const typescript = config.generatePropTypes ? `
interface ${component.name}Props {
${propsInterface}
}

` : '';

    const propsType = config.generatePropTypes ? `: React.FC<${component.name}Props>` : '';

    const html = `// ${component.name}.tsx
import React from 'react';
${config.cssStrategy === 'css-modules' ? `import styles from './${component.name}.module.css';` : ''}
${typescript}
export const ${component.name}${propsType} = ({ ${propsDestructure} }) => {
  return (
${jsxContent}
  );
};

export default ${component.name};
`;

    const css = config.includeStyles ? generateBEMCSS(component) : '';

    return {
        name: component.name,
        html,
        css,
        props,
    };
}

/**
 * Export as Vue SFC
 */
export function exportVue(component: DetectedComponent, config: ExportConfig): ExportedComponent {
    const props = extractProps(component.structure);

    // Convert to Vue template syntax
    function toVueTemplate(structure: DOMStructure, indent: number = 2): string {
        const spaces = '  '.repeat(indent);
        const attrs: string[] = [];

        if (structure.classes.length > 0) {
            attrs.push(`class="${structure.classes.join(' ')}"`);
        }

        if (structure.id) {
            attrs.push(`id="${structure.id}"`);
        }

        for (const [key, value] of Object.entries(structure.attributes)) {
            if (key === 'class') continue;
            if (key === 'src') {
                attrs.push(`:src="imageSrc"`);
            } else if (key === 'href') {
                attrs.push(`:href="href"`);
            } else if (key === 'alt') {
                attrs.push(`:alt="imageAlt"`);
            } else {
                attrs.push(`${key}="${value}"`);
            }
        }

        const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

        const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
        if (selfClosing.includes(structure.tag)) {
            return `${spaces}<${structure.tag}${attrStr} />`;
        }

        if (structure.children.length === 0) {
            if (structure.textContent) {
                return `${spaces}<${structure.tag}${attrStr}>{{ ${inferPropName(structure)} }}</${structure.tag}>`;
            }
            return `${spaces}<${structure.tag}${attrStr}></${structure.tag}>`;
        }

        const children = structure.children.map(c => toVueTemplate(c, indent + 1)).join('\n');
        return `${spaces}<${structure.tag}${attrStr}>\n${children}\n${spaces}</${structure.tag}>`;
    }

    const template = toVueTemplate(component.structure);
    const propsDefinition = props.map(p => `    ${p}: String`).join(',\n');

    const html = `<!-- ${component.name}.vue -->
<template>
${template}
</template>

<script>
export default {
  name: '${component.name}',
  props: {
${propsDefinition}
  }
}
</script>

<style scoped>
${config.includeStyles ? generateBEMCSS(component) : '/* Add styles */'}
</style>
`;

    return {
        name: component.name,
        html,
        css: '',
        props,
    };
}

/**
 * Export as Svelte component
 */
export function exportSvelte(component: DetectedComponent, config: ExportConfig): ExportedComponent {
    const props = extractProps(component.structure);

    function toSvelteTemplate(structure: DOMStructure, indent: number = 0): string {
        const spaces = '  '.repeat(indent);
        const attrs: string[] = [];

        if (structure.classes.length > 0) {
            attrs.push(`class="${structure.classes.join(' ')}"`);
        }

        if (structure.id) {
            attrs.push(`id="${structure.id}"`);
        }

        for (const [key, value] of Object.entries(structure.attributes)) {
            if (key === 'class') continue;
            if (key === 'src') {
                attrs.push(`src={imageSrc}`);
            } else if (key === 'href') {
                attrs.push(`href={href}`);
            } else if (key === 'alt') {
                attrs.push(`alt={imageAlt}`);
            } else {
                attrs.push(`${key}="${value}"`);
            }
        }

        const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

        const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
        if (selfClosing.includes(structure.tag)) {
            return `${spaces}<${structure.tag}${attrStr} />`;
        }

        if (structure.children.length === 0) {
            if (structure.textContent) {
                return `${spaces}<${structure.tag}${attrStr}>{${inferPropName(structure)}}</${structure.tag}>`;
            }
            return `${spaces}<${structure.tag}${attrStr}></${structure.tag}>`;
        }

        const children = structure.children.map(c => toSvelteTemplate(c, indent + 1)).join('\n');
        return `${spaces}<${structure.tag}${attrStr}>\n${children}\n${spaces}</${structure.tag}>`;
    }

    const template = toSvelteTemplate(component.structure);
    const propsExports = props.map(p => `  export let ${p} = '';`).join('\n');

    const html = `<!-- ${component.name}.svelte -->
<script>
${propsExports}
</script>

${template}

<style>
${config.includeStyles ? generateBEMCSS(component) : '/* Add styles */'}
</style>
`;

    return {
        name: component.name,
        html,
        css: '',
        props,
    };
}

/**
 * Export component in specified format
 */
export function exportComponent(component: DetectedComponent, config: ExportConfig): ExportedComponent {
    switch (config.format) {
        case 'react':
            return exportReact(component, config);
        case 'vue':
            return exportVue(component, config);
        case 'svelte':
            return exportSvelte(component, config);
        case 'html':
        default:
            return exportPlainHTML(component, config);
    }
}

/**
 * Export all components
 */
export function exportAllComponents(components: DetectedComponent[], config: ExportConfig): ExportedComponent[] {
    return components.map(c => exportComponent(c, config));
}
