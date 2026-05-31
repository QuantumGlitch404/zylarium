
import { EnvironmentUrl } from '../types';

export class UrlResolver {
    private constantsMap: Map<string, string>;
    private envVariables: Map<string, string>;

    constructor() {
        this.constantsMap = new Map();
        this.envVariables = new Map();
    }

    /**
     * Scans file content for const/let definitions and imports to build a map of potential URL constants.
     */
    public buildConstantsMap(fileContent: string) {
        // 1. Match const/let CAPS_VAR = 'string_literal';
        const constRegex = /(?:const|let|var)\s+([A-Z0-9_]+)\s*=\s*(['"`])([^'"`]+)\2/g;
        let match;
        while ((match = constRegex.exec(fileContent)) !== null) {
            this.constantsMap.set(match[1], match[3]);
        }

        // 2. Scan for process.env usage to seed env variables
        const envRegex = /process\.env\.([A-Z0-9_]+)/g;
        while ((match = envRegex.exec(fileContent)) !== null) {
            if (!this.envVariables.has(match[1])) {
                // Placeholder until we parse real .env files
                this.envVariables.set(match[1], `{${match[1]}}`);
            }
        }
    }

    /**
     * Loads environment variables from parsed .env content
     */
    public loadEnvFile(content: string) {
        const lines = content.split('\n');
        for (const line of lines) {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                if (key && !key.startsWith('#')) {
                    this.envVariables.set(key, val);
                }
            }
        }
    }

    /**
     * Resolves a template literal string like `https://api.com/${resource}/${id}`
     */
    public resolveTemplateUrl(template: string): { url: string; confidence: 'high' | 'medium' | 'low' } {
        let resolved = template;
        let confidence: 'high' | 'medium' | 'low' = 'high';

        // Replace ${VAR} with constant value if known, or :param if unknown
        resolved = resolved.replace(/\$\{([^}]+)\}/g, (_, expr) => {
            const varName = expr.trim();

            // Check constants
            if (this.constantsMap.has(varName)) {
                return this.constantsMap.get(varName)!;
            }

            // Check process.env
            if (varName.startsWith('process.env.')) {
                const envKey = varName.replace('process.env.', '');
                if (this.envVariables.has(envKey)) {
                    return this.envVariables.get(envKey)!;
                }
                return `{${envKey}}`;
            }

            // Check known variables that imply IDs
            if (/id|Id|uuid|slug/i.test(varName)) {
                confidence = 'medium';
                return ':id';
            }

            confidence = 'low';
            return `{${varName}}`; // Mark as dynamic
        });

        return { url: resolved, confidence };
    }

    /**
     * Resolves simple concatenation: BASE_URL + '/users'
     */
    public resolveConcatenation(expression: string): { url: string; confidence: 'high' | 'medium' | 'low' } {
        const parts = expression.split('+').map(p => p.trim());
        let resolved = '';
        let confidence: 'high' | 'medium' | 'low' = 'high';

        for (const part of parts) {
            // Remove quotes if string literal
            if (/^['"`].*['"`]$/.test(part)) {
                resolved += part.slice(1, -1);
            }
            // Look up variable
            else if (this.constantsMap.has(part)) {
                resolved += this.constantsMap.get(part);
            }
            // Env var
            else if (part.startsWith('process.env.')) {
                const envKey = part.replace('process.env.', '');
                resolved += this.envVariables.get(envKey) || `{${envKey}}`;
            }
            else {
                confidence = 'low';
                resolved += `{${part}}`;
            }
        }

        return { url: resolved, confidence };
    }

    /**
     * converts specific values like /users/123 to /users/:id
     */
    public normalizeUrl(url: string): string {
        return url
            // Replace numeric segments
            .replace(/\/\d+(?=\/|$)/g, '/:id')
            // Replace UUIDs
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i, '/:id')
            .replace(/\/$/, ''); // Trim trailing slash
    }
}
