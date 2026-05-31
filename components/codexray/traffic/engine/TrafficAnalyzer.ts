
import {
    AnalysisStats,
    CallSite,
    Endpoint,
    FileLocation,
    HttpMethod,
    NetworkApiType,
    EnvironmentUrl,
    AuthInfo,
    DependencyGraphData
} from '../types';
import { FETCH_PATTERNS, AXIOS_PATTERNS, AUTH_PATTERNS } from './TrafficPatterns';
import { UrlResolver } from './UrlResolver';
import { SchemaInference } from './SchemaInference';

interface FileData {
    path: string;
    content: string;
}

export class TrafficAnalyzer {
    private urlResolver: UrlResolver;
    private schemaInference: SchemaInference;

    private callSites: CallSite[] = [];
    private endpoints: Map<string, Endpoint> = new Map();
    private authPatterns: AuthInfo[] = [];

    constructor() {
        this.urlResolver = new UrlResolver();
        this.schemaInference = new SchemaInference();
    }

    public async analyzeProject(files: FileData[]): Promise<{
        callSites: CallSite[];
        endpoints: Endpoint[];
        stats: AnalysisStats;
        graph: DependencyGraphData;
        auth: AuthInfo[];
    }> {
        // Reset state
        this.callSites = [];
        this.endpoints.clear();
        this.authPatterns = [];

        // 1. First pass: Build constants map and detect Auth patterns
        files.forEach(file => {
            this.urlResolver.buildConstantsMap(file.content);
            this.detectAuthPatterns(file);
            if (file.path.endsWith('.env')) {
                this.urlResolver.loadEnvFile(file.content);
            }
        });

        // 2. Second pass: Scan for API calls
        files.forEach(file => {
            this.scanFile(file);
        });

        // 3. Group call sites into endpoints
        this.groupEndpoints();

        return {
            callSites: this.callSites,
            endpoints: Array.from(this.endpoints.values()),
            stats: this.calculateStats(files.length),
            graph: this.buildDependencyGraph(),
            auth: this.authPatterns
        };
    }

    private detectAuthPatterns(file: FileData) {
        // Check for local storage usage
        let match;
        while ((match = AUTH_PATTERNS.storageSet.exec(file.content)) !== null) {
            // Just simpler tracking for now
            this.authPatterns.push({
                type: 'bearer', // assumption
                tokenSource: {
                    storage: 'localStorage',
                    key: match[3],
                    retrievalCode: match[0],
                    locations: [{ fileId: file.path, filePath: file.path, line: this.getLineNumber(file.content, match.index), column: 0 }]
                },
                endpointsUsing: []
            });
        }
    }

    private scanFile(file: FileData) {
        // Scan Fetch
        this.findMatches(file, FETCH_PATTERNS.simple, 'fetch', 'GET');
        this.findMatches(file, FETCH_PATTERNS.template, 'fetch', 'GET');

        // Scan Axios
        // Simplified scanning for speed - in production would iterate all patterns
        this.findMatches(file, AXIOS_PATTERNS.methods, 'axios', 'GET'); // Method is overwritten by regex group 1
    }

    private findMatches(file: FileData, regex: RegExp, apiType: NetworkApiType, defaultMethod: HttpMethod) {
        let match;
        const lines = file.content.split('\n');

        // Reset regex index
        regex.lastIndex = 0;

        while ((match = regex.exec(file.content)) !== null) {
            const rawUrl = match[2] || match[1]; // Adjust based on capture group
            const methodCapture = match[1]?.toUpperCase();
            const method = (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(methodCapture) ? methodCapture : defaultMethod) as HttpMethod;

            const { url: resolvedUrl, confidence } = this.urlResolver.resolveTemplateUrl(rawUrl);
            const normalizedUrl = this.urlResolver.normalizeUrl(resolvedUrl);

            const lineNum = this.getLineNumber(file.content, match.index);

            const callSite: CallSite = {
                id: Math.random().toString(36).substr(2, 9),
                fileId: file.path,
                filePath: file.path,
                lineNumber: lineNum,
                columnStart: match.index,
                columnEnd: match.index + match[0].length,
                codeSnippet: match[0],
                context: lines.slice(Math.max(0, lineNum - 2), Math.min(lines.length, lineNum + 2)),
                networkApi: apiType,
                extractedUrl: rawUrl,
                resolvedUrl: resolvedUrl,
                urlConfidence: confidence,
                method: method,
                payloadExpression: null,
                inferredPayload: null,
                componentName: this.extractComponentName(file.path)
            };

            this.callSites.push(callSite);
        }
    }

    private groupEndpoints() {
        this.callSites.forEach(site => {
            const pattern = site.resolvedUrl ? this.urlResolver.normalizeUrl(site.resolvedUrl) : site.extractedUrl;
            const key = `${site.method}:${pattern}`;

            if (!this.endpoints.has(key)) {
                this.endpoints.set(key, {
                    id: Math.random().toString(36).substr(2, 9),
                    method: site.method,
                    urlPattern: pattern,
                    fullUrl: site.resolvedUrl,
                    confidence: site.urlConfidence,
                    callSites: [],
                    requestSchema: null,
                    responseSchema: null,
                    queryParams: [],
                    pathParams: [],
                    headers: [],
                    authRequired: false, // Update logic later
                    authType: null,
                    errorHandlers: [],
                    retryLogic: null,
                    environments: []
                });
            }

            const endpoint = this.endpoints.get(key)!;
            endpoint.callSites.push(site);

            // Merge confidence (keep lowest)
            if (site.urlConfidence === 'low') endpoint.confidence = 'low';
            else if (site.urlConfidence === 'medium' && endpoint.confidence === 'high') endpoint.confidence = 'medium';
        });
    }

    private buildDependencyGraph(): DependencyGraphData {
        const nodes: any[] = [];
        const edges: any[] = [];
        const componentSet = new Set<string>();

        this.endpoints.forEach(ep => {
            // Endpoint Node
            nodes.push({
                id: ep.id,
                type: 'endpoint',
                label: `${ep.method} ${ep.urlPattern}`,
                metrics: { callers: ep.callSites.length }
            });

            ep.callSites.forEach(cs => {
                if (cs.componentName) {
                    if (!componentSet.has(cs.componentName)) {
                        nodes.push({
                            id: cs.componentName,
                            type: 'component',
                            label: cs.componentName,
                            metrics: { calls: 1 }
                        });
                        componentSet.add(cs.componentName);
                    }

                    edges.push({
                        source: cs.componentName,
                        target: ep.id,
                        weight: 1,
                        methods: [ep.method]
                    });
                }
            });
        });

        return { nodes, edges, clusters: [] };
    }

    private calculateStats(fileCount: number): AnalysisStats {
        const methods: Record<HttpMethod, number> = { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0, OPTIONS: 0, HEAD: 0, CONNECT: 0, TRACE: 0 };
        this.endpoints.forEach(ep => {
            if (methods[ep.method] !== undefined) methods[ep.method]++;
        });

        return {
            filesAnalyzed: fileCount,
            apiCallsFound: this.callSites.length,
            uniqueEndpoints: this.endpoints.size,
            endpointsByMethod: methods,
            authRequiredCount: 0, // Implement auth counting logic
            publicCount: 0,
            withRetryCount: 0,
            withErrorHandlingCount: 0
        };
    }

    private getLineNumber(content: string, index: number): number {
        return content.substring(0, index).split('\n').length;
    }

    private extractComponentName(path: string): string {
        const parts = path.split(/[\\/]/);
        const filename = parts[parts.length - 1];
        return filename.replace(/\.(tsx|jsx|ts|js)$/, '');
    }
}
