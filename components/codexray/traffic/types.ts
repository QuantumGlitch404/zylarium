
export interface FileLocation {
    fileId: string;
    filePath: string;
    line: number;
    column: number;
}

export interface JsonSchema {
    type: string;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    enum?: (string | number)[];
    description?: string;
    required?: string[];
}

export type NetworkApiType = 'fetch' | 'axios' | 'xhr' | 'jquery' | 'graphql' | 'superagent' | 'other';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE';
export type AuthType = 'bearer' | 'cookie' | 'apiKey' | 'basic' | 'custom' | null;
export type ParamType = 'path' | 'query' | 'body';

export interface ParamInfo {
    name: string;
    type: ParamType;
    required: boolean;
    schema?: JsonSchema;
    description?: string;
}

export interface HeaderInfo {
    name: string;
    value: string | null; // null if dynamic
    required: boolean;
    source?: string; // e.g., "Authorization header"
}

export interface EnvironmentUrl {
    environment: 'development' | 'staging' | 'production' | 'test' | 'custom';
    baseUrl: string;
    fullUrl: string;
    source: {
        type: 'envFile' | 'configJs' | 'hardcoded' | 'inferred';
        file?: string;
        variable?: string;
    };
    confidence: 'high' | 'medium' | 'low';
}

export interface AuthInfo {
    type: AuthType;
    tokenSource?: {
        storage: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory' | 'env';
        key: string;
        retrievalCode: string;
        locations: FileLocation[];
    };
    headerName?: string;
    headerPattern?: string; // e.g. "Bearer {token}"
    endpointsUsing: string[]; // IDs of endpoints
}

export interface ErrorHandler {
    endpointId: string;
    callSiteId: string;
    statusCode: number | 'network' | 'timeout' | 'unknown';
    action: 'redirect' | 'retry' | 'toast' | 'modal' | 'logout' | 'throw' | 'ignore';
    actionDetail?: string; // e.g. "redirect to /login"
    codeLocation: FileLocation;
    codeSnippet: string;
}

export interface RetryInfo {
    endpointId: string;
    callSiteId: string;
    maxRetries: number | 'unknown';
    backoffType: 'none' | 'linear' | 'exponential' | 'unknown';
    backoffDelay: number | 'unknown';
    retryCondition: string;
    codeSnippet: string;
}

export interface CallSite {
    id: string;
    fileId: string;
    filePath: string;
    lineNumber: number;
    columnStart: number;
    columnEnd: number;

    codeSnippet: string;
    context: string[]; // Surrounding lines

    networkApi: NetworkApiType;

    extractedUrl: string; // As seen in code (e.g., `${API}/users`)
    resolvedUrl: string | null; // Best guess (e.g., `https://api.com/users`)
    urlConfidence: 'high' | 'medium' | 'low';

    method: HttpMethod;

    payloadExpression: string | null;
    inferredPayload: object | null;

    componentName: string | null;
}

export interface Endpoint {
    id: string;
    method: HttpMethod;
    urlPattern: string; // e.g. "/api/users/:id"
    fullUrl: string | null;
    confidence: 'high' | 'medium' | 'low';

    callSites: CallSite[];

    requestSchema: JsonSchema | null;
    responseSchema: JsonSchema | null;

    queryParams: ParamInfo[];
    pathParams: ParamInfo[];

    headers: HeaderInfo[];

    authRequired: boolean;
    authType: AuthType;

    errorHandlers: ErrorHandler[];
    retryLogic: RetryInfo | null;

    environments: EnvironmentUrl[];

    description?: string; // Auto-generated summary
}

export interface AnalysisStats {
    filesAnalyzed: number;
    apiCallsFound: number;
    uniqueEndpoints: number;
    endpointsByMethod: Record<HttpMethod, number>;
    authRequiredCount: number;
    publicCount: number;
    withRetryCount: number;
    withErrorHandlingCount: number;
}

export interface DependencyGraphNode {
    id: string;
    type: 'component' | 'endpoint';
    label: string;
    metrics: {
        calls?: number; // for component
        callers?: number; // for endpoint
    };
}

export interface DependencyGraphEdge {
    source: string;
    target: string;
    weight: number;
    methods?: HttpMethod[];
}

export interface DependencyGraphData {
    nodes: DependencyGraphNode[];
    edges: DependencyGraphEdge[];
    clusters: {
        id: string;
        label: string,
        nodes: string[]
    }[];
}
