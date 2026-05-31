
import { JsonSchema } from '../types';

export class SchemaInference {

    /**
     * Infers a JSON Schema from a JavaScript object literal code snippet.
     * e.g. "{ name: 'John', age: 25 }" -> Schema
     */
    public inferRequestSchema(objectLiteralSnippet: string): JsonSchema | null {
        try {
            // Very basic parser for object literals
            // In a real generic tool, we'd need a proper AST parser. 
            // Here we use regex heuristics for performance and simplicity in this scope.

            const properties: Record<string, JsonSchema> = {};

            // Match key: value patterns
            // Name: 'John'
            // age: 25
            const keyValRegex = /(\w+)\s*:\s*([^,{}]+)/g;
            let match;

            while ((match = keyValRegex.exec(objectLiteralSnippet)) !== null) {
                const key = match[1];
                const valueExpr = match[2].trim();

                properties[key] = this.inferTypeFromExpression(valueExpr);
            }

            if (Object.keys(properties).length === 0) return null;

            return {
                type: 'object',
                properties,
                required: Object.keys(properties) // Assume all observed properties are required for now
            };

        } catch (e) {
            console.warn('Failed to infer schema', e);
            return null;
        }
    }

    private inferTypeFromExpression(expr: string): JsonSchema {
        if (/^['"`]/.test(expr)) return { type: 'string' };
        if (/^(true|false)$/.test(expr)) return { type: 'boolean' };
        if (/^\d+(\.\d+)?$/.test(expr)) return { type: 'number' };
        if (/^\[.*\]$/.test(expr)) return { type: 'array' };
        return { type: 'string', description: 'inferred from variable' };
    }

    /**
     * Infers response schema by looking at how the response variable is used.
     * Scans for patterns like `response.data.id` or `const { name } = data`.
     */
    public inferResponseSchema(variableName: string, surroundingCode: string): JsonSchema | null {
        const properties: Record<string, JsonSchema> = {};

        // 1. Check for dot notation: data.email
        const dotRegex = new RegExp(`${variableName}\\.(\\w+)`, 'g');
        let match;
        while ((match = dotRegex.exec(surroundingCode)) !== null) {
            properties[match[1]] = { type: 'string' }; // Default to string
        }

        // 2. Check for destructuring: const { id, name } = data
        const destructureRegex = new RegExp(`const\\s*\\{\\s*([^}]+)\\s*\\}\\s*=\\s*${variableName}`, 'g');
        if ((match = destructureRegex.exec(surroundingCode)) !== null) {
            const vars = match[1].split(',').map(v => v.trim().split(':')[0].trim());
            vars.forEach(v => {
                properties[v] = { type: 'string' };
            });
        }

        if (Object.keys(properties).length === 0) return null;

        return {
            type: 'object',
            properties
        };
    }

    /**
     * Extracts expected response shape from a GraphQL query string.
     */
    public parseGraphqlQuery(query: string): { operationName: string, schema: JsonSchema } | null {
        // Determine operation name
        const opMatch = /query\s+(\w+)/.exec(query) || /mutation\s+(\w+)/.exec(query);
        const operationName = opMatch ? opMatch[1] : 'AnonymousOperation';

        // Simple heuristic: extract fields inside the first brace set
        const fieldRegex = /\{([\s\S]*?)\}/;
        const innerMatch = fieldRegex.exec(query);

        if (!innerMatch) return null;

        // This is a naive extraction, a real parser would be recursive.
        const fields = innerMatch[1]
            .split(/\s+/)
            .filter(f => f && !f.includes('{') && !f.includes('}') && !f.startsWith('$'))
            .map(f => f.trim())
            .filter(f => f.length > 0);

        const properties: Record<string, JsonSchema> = {};
        fields.forEach(f => {
            properties[f] = { type: 'string' };
        });

        return {
            operationName,
            schema: {
                type: 'object',
                properties
            }
        };
    }
}
