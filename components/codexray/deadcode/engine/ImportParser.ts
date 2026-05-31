// Dead Code Detector - Import Parser
// Extracts import statements from JS/TS, HTML, and CSS files

import { ImportEdge, ImportType, FileLocation } from '../types';

// ============================================================================
// JAVASCRIPT / TYPESCRIPT PATTERNS
// ============================================================================

// Static imports: import x from './file', import { x } from './file', import * as x from './file'
const STATIC_IMPORT_REGEX = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;

// Dynamic imports: import('./file'), import(`./files/${name}`)
const DYNAMIC_IMPORT_REGEX = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

// Dynamic import with template literal variable parts (detect but flag as dynamic)
const DYNAMIC_IMPORT_TEMPLATE_REGEX = /import\s*\(\s*`([^`]+)`\s*\)/g;

// Require: require('./file'), require.resolve('./file')
const REQUIRE_REGEX = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const REQUIRE_RESOLVE_REGEX = /require\.resolve\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

// Re-exports: export { x } from './file', export * from './file'
const REEXPORT_REGEX = /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g;

// Side-effect imports: import './file'
const SIDE_EFFECT_IMPORT_REGEX = /import\s+['"]([^'"]+)['"]/g;

// Require.context (Webpack): require.context('./modules', true, /\.js$/)
const REQUIRE_CONTEXT_REGEX = /require\.context\s*\(\s*['"]([^'"]+)['"]/g;

// Import.meta.glob (Vite): import.meta.glob('./modules/*.js')
const IMPORT_META_GLOB_REGEX = /import\.meta\.glob\s*\(\s*['"]([^'"]+)['"]/g;

// Dynamic patterns that reduce confidence
const DYNAMIC_REQUIRE_PATTERN = /require\s*\(\s*[^'"]/;
const EVAL_REQUIRE_PATTERN = /eval\s*\([^)]*require/;
const DYNAMIC_VARIABLE_PATTERN = /import\s*\(\s*\w+\s*\)/;

// ============================================================================
// HTML PATTERNS
// ============================================================================

// Script tags: <script src="...">
const HTML_SCRIPT_SRC_REGEX = /<script[^>]*\ssrc\s*=\s*['"]([^'"]+)['"]/gi;

// Module scripts: <script type="module" src="...">
const HTML_MODULE_SCRIPT_REGEX = /<script[^>]*type\s*=\s*['"]module['"][^>]*src\s*=\s*['"]([^'"]+)['"]/gi;

// Stylesheets: <link rel="stylesheet" href="...">
const HTML_STYLESHEET_REGEX = /<link[^>]*rel\s*=\s*['"]stylesheet['"][^>]*href\s*=\s*['"]([^'"]+)['"]/gi;
const HTML_STYLESHEET_ALT_REGEX = /<link[^>]*href\s*=\s*['"]([^'"]+)['"][^>]*rel\s*=\s*['"]stylesheet['"]/gi;

// Images: <img src="...">, <source srcset="...">
const HTML_IMG_SRC_REGEX = /<img[^>]*\ssrc\s*=\s*['"]([^'"]+)['"]/gi;
const HTML_SRCSET_REGEX = /<(?:img|source)[^>]*\ssrcset\s*=\s*['"]([^'"]+)['"]/gi;

// Links: <a href="...">
const HTML_LINK_HREF_REGEX = /<a[^>]*\shref\s*=\s*['"]([^'"]+)['"]/gi;

// Favicons and icons: <link rel="icon" href="...">
const HTML_ICON_REGEX = /<link[^>]*rel\s*=\s*['"](?:icon|shortcut icon|apple-touch-icon)['"][^>]*href\s*=\s*['"]([^'"]+)['"]/gi;

// Preload: <link rel="preload" href="...">
const HTML_PRELOAD_REGEX = /<link[^>]*rel\s*=\s*['"]preload['"][^>]*href\s*=\s*['"]([^'"]+)['"]/gi;

// General link href (for other types)
const HTML_GENERAL_LINK_REGEX = /<link[^>]*href\s*=\s*['"]([^'"]+)['"]/gi;

// Background images in inline styles
const HTML_INLINE_STYLE_URL_REGEX = /style\s*=\s*['"][^'"]*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/gi;

// ============================================================================
// CSS PATTERNS
// ============================================================================

// URL function: url('./image.png'), url('../assets/bg.jpg')
const CSS_URL_REGEX = /url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/g;

// @import: @import './other.css', @import url('./other.css')
const CSS_IMPORT_REGEX = /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]/g;

// Font face src: src: url('./font.woff2')
const CSS_FONT_SRC_REGEX = /src\s*:\s*[^;]*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/g;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
}

function isExternalUrl(path: string): boolean {
    return path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('//') ||
        path.startsWith('data:');
}

function isNodeModules(path: string): boolean {
    return !path.startsWith('.') && !path.startsWith('/') && !path.startsWith('~');
}

function extractMatches(
    content: string,
    regex: RegExp,
    importType: ImportType,
    isDynamic: boolean = false
): { path: string; line: number; statement: string; type: ImportType; isDynamic: boolean }[] {
    const results: { path: string; line: number; statement: string; type: ImportType; isDynamic: boolean }[] = [];
    let match;

    // Reset regex lastIndex
    regex.lastIndex = 0;

    while ((match = regex.exec(content)) !== null) {
        const path = match[1];
        if (path && !isExternalUrl(path)) {
            results.push({
                path,
                line: getLineNumber(content, match.index),
                statement: match[0],
                type: importType,
                isDynamic
            });
        }
    }

    return results;
}

// ============================================================================
// MAIN EXTRACTION FUNCTIONS
// ============================================================================

export interface ExtractedImport {
    path: string;
    line: number;
    statement: string;
    type: ImportType;
    isDynamic: boolean;
    isNodeModule: boolean;
}

/**
 * Extract all imports from JavaScript/TypeScript content
 */
export function extractJSImports(content: string, filePath: string): ExtractedImport[] {
    const imports: ExtractedImport[] = [];

    // Static imports
    imports.push(...extractMatches(content, STATIC_IMPORT_REGEX, 'static_import').map(m => ({
        ...m,
        isNodeModule: isNodeModules(m.path)
    })));

    // Side-effect imports
    imports.push(...extractMatches(content, SIDE_EFFECT_IMPORT_REGEX, 'static_import').map(m => ({
        ...m,
        isNodeModule: isNodeModules(m.path)
    })));

    // Dynamic imports (static path)
    imports.push(...extractMatches(content, DYNAMIC_IMPORT_REGEX, 'dynamic_import', true).map(m => ({
        ...m,
        isNodeModule: isNodeModules(m.path)
    })));

    // Require
    imports.push(...extractMatches(content, REQUIRE_REGEX, 'require').map(m => ({
        ...m,
        isNodeModule: isNodeModules(m.path)
    })));

    // Require.resolve
    imports.push(...extractMatches(content, REQUIRE_RESOLVE_REGEX, 'require').map(m => ({
        ...m,
        isNodeModule: isNodeModules(m.path)
    })));

    // Re-exports
    imports.push(...extractMatches(content, REEXPORT_REGEX, 'static_import').map(m => ({
        ...m,
        isNodeModule: isNodeModules(m.path)
    })));

    // Require.context (Webpack patterns)
    imports.push(...extractMatches(content, REQUIRE_CONTEXT_REGEX, 'dynamic_import', true).map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Import.meta.glob (Vite patterns)
    imports.push(...extractMatches(content, IMPORT_META_GLOB_REGEX, 'dynamic_import', true).map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Deduplicate by path
    const seen = new Set<string>();
    return imports.filter(imp => {
        const key = `${imp.path}:${imp.line}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Extract all references from HTML content
 */
export function extractHTMLReferences(content: string, filePath: string): ExtractedImport[] {
    const imports: ExtractedImport[] = [];

    // Script src
    imports.push(...extractMatches(content, HTML_SCRIPT_SRC_REGEX, 'html_script').map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Stylesheet links
    imports.push(...extractMatches(content, HTML_STYLESHEET_REGEX, 'html_link').map(m => ({
        ...m,
        isNodeModule: false
    })));
    imports.push(...extractMatches(content, HTML_STYLESHEET_ALT_REGEX, 'html_link').map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Images
    imports.push(...extractMatches(content, HTML_IMG_SRC_REGEX, 'asset_reference').map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Srcset (parse individual URLs)
    let srcsetMatch;
    HTML_SRCSET_REGEX.lastIndex = 0;
    while ((srcsetMatch = HTML_SRCSET_REGEX.exec(content)) !== null) {
        const srcset = srcsetMatch[1];
        // Parse srcset: "image1.jpg 1x, image2.jpg 2x"
        const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
        for (const url of urls) {
            if (url && !isExternalUrl(url)) {
                imports.push({
                    path: url,
                    line: getLineNumber(content, srcsetMatch.index),
                    statement: srcsetMatch[0],
                    type: 'asset_reference',
                    isDynamic: false,
                    isNodeModule: false
                });
            }
        }
    }

    // Icons
    imports.push(...extractMatches(content, HTML_ICON_REGEX, 'asset_reference').map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Preload
    imports.push(...extractMatches(content, HTML_PRELOAD_REGEX, 'html_link').map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Inline style URLs
    imports.push(...extractMatches(content, HTML_INLINE_STYLE_URL_REGEX, 'css_url').map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Deduplicate
    const seen = new Set<string>();
    return imports.filter(imp => {
        const key = `${imp.path}:${imp.line}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Extract all references from CSS content
 */
export function extractCSSReferences(content: string, filePath: string): ExtractedImport[] {
    const imports: ExtractedImport[] = [];

    // @import
    imports.push(...extractMatches(content, CSS_IMPORT_REGEX, 'css_import').map(m => ({
        ...m,
        isNodeModule: isNodeModules(m.path)
    })));

    // url() - general
    imports.push(...extractMatches(content, CSS_URL_REGEX, 'css_url').map(m => ({
        ...m,
        isNodeModule: false
    })));

    // Deduplicate
    const seen = new Set<string>();
    return imports.filter(imp => {
        const key = `${imp.path}:${imp.line}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ============================================================================
// DYNAMIC PATTERN DETECTION
// ============================================================================

export interface DynamicPattern {
    type: 'dynamic_require' | 'eval_require' | 'dynamic_import_variable' | 'template_import';
    line: number;
    code: string;
    description: string;
}

/**
 * Detect dynamic import patterns that reduce safe deletion confidence
 */
export function detectDynamicPatterns(content: string): DynamicPattern[] {
    const patterns: DynamicPattern[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Dynamic require with variable
        if (DYNAMIC_REQUIRE_PATTERN.test(line) && !REQUIRE_REGEX.test(line)) {
            patterns.push({
                type: 'dynamic_require',
                line: lineNum,
                code: line.trim(),
                description: 'require() with variable path'
            });
        }

        // eval with require
        if (EVAL_REQUIRE_PATTERN.test(line)) {
            patterns.push({
                type: 'eval_require',
                line: lineNum,
                code: line.trim(),
                description: 'eval() containing require()'
            });
        }

        // Dynamic import with variable
        if (DYNAMIC_VARIABLE_PATTERN.test(line)) {
            patterns.push({
                type: 'dynamic_import_variable',
                line: lineNum,
                code: line.trim(),
                description: 'import() with variable path'
            });
        }

        // Template literal import
        if (/import\s*\(\s*`[^`]*\$\{/.test(line)) {
            patterns.push({
                type: 'template_import',
                line: lineNum,
                code: line.trim(),
                description: 'import() with template literal containing variables'
            });
        }
    });

    return patterns;
}

// ============================================================================
// PATH RESOLUTION
// ============================================================================

/**
 * Resolve a relative import path to absolute path
 */
export function resolveImportPath(
    importPath: string,
    currentFilePath: string,
    extensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss']
): string | null {
    // Skip node_modules (for now)
    if (isNodeModules(importPath)) {
        return null;
    }

    // Handle relative paths
    if (importPath.startsWith('.')) {
        // Get directory of current file
        const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));

        // Resolve the path
        const parts = importPath.split('/');
        const dirParts = currentDir.split('/');

        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') {
                dirParts.pop();
            } else {
                dirParts.push(part);
            }
        }

        return dirParts.join('/');
    }

    // Handle absolute paths (starting with /)
    if (importPath.startsWith('/')) {
        return importPath;
    }

    // Handle aliases (e.g., @/components) - return as-is for now
    // Proper alias resolution would need tsconfig/webpack config
    return importPath;
}

/**
 * Get file type from extension
 */
export function getFileTypeFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';

    const typeMap: Record<string, string> = {
        'js': 'js',
        'jsx': 'jsx',
        'ts': 'ts',
        'tsx': 'tsx',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'html': 'html',
        'htm': 'html',
        'vue': 'vue',
        'svelte': 'svelte',
        'json': 'json',
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'gif': 'image',
        'svg': 'image',
        'webp': 'image',
        'ico': 'icon',
        'woff': 'font',
        'woff2': 'font',
        'ttf': 'font',
        'eot': 'font',
        'otf': 'font',
        'mp4': 'video',
        'webm': 'video',
        'mp3': 'audio',
        'wav': 'audio',
        'pdf': 'document',
    };

    return typeMap[ext] || 'other';
}

/**
 * Check if file is a JavaScript/TypeScript file
 */
export function isJSFile(filePath: string): boolean {
    const type = getFileTypeFromPath(filePath);
    return ['js', 'jsx', 'ts', 'tsx'].includes(type);
}

/**
 * Check if file is an HTML file
 */
export function isHTMLFile(filePath: string): boolean {
    const type = getFileTypeFromPath(filePath);
    return ['html', 'vue', 'svelte'].includes(type);
}

/**
 * Check if file is a CSS file
 */
export function isCSSFile(filePath: string): boolean {
    const type = getFileTypeFromPath(filePath);
    return ['css', 'scss', 'less'].includes(type);
}

/**
 * Check if file is an asset
 */
export function isAssetFile(filePath: string): boolean {
    const type = getFileTypeFromPath(filePath);
    return ['image', 'icon', 'font', 'video', 'audio', 'document'].includes(type);
}
