
export const FETCH_PATTERNS = {
    // fetch('url') or fetch("url")
    simple: /fetch\s*\(\s*(['"`])([^'"`]+)\1/g,

    // fetch(`url`) with template literal
    template: /fetch\s*\(\s*`([^`]+)`/g,

    // fetch(variable)
    variable: /fetch\s*\(\s*(\w+)/g,

    // fetch('url', { ... }) - checks for options object start
    options: /fetch\s*\(\s*[^,]+,\s*(\{)/g,
};

export const AXIOS_PATTERNS = {
    // axios.get('url'), axios.post('url'), etc.
    methods: /axios\.(get|post|put|delete|patch|head|options)\s*\(\s*(['"`])([^'"`]+)\2/g,

    // axios.get(`url`)
    methodsTemplate: /axios\.(get|post|put|delete|patch|head|options)\s*\(\s*`([^`]+)`/g,

    // axios.get(variable)
    methodsVariable: /axios\.(get|post|put|delete|patch|head|options)\s*\(\s*(\w+)/g,

    // axios({ url: '...' })
    config: /axios\s*\(\s*\{[^}]*url\s*:\s*(['"`])([^'"`]+)\1/g,

    // axios({ url: `...` })
    configTemplate: /axios\s*\(\s*\{[^}]*url\s*:\s*`([^`]+)`/g,

    // api.get(), client.post() - generic instance matching
    instanceMethods: /(\w+)\.(get|post|put|delete|patch)\s*\(\s*(['"`])([^'"`]+)\3/g,
};

export const XHR_PATTERNS = {
    // xhr.open('GET', 'url')
    open: /\.open\s*\(\s*(['"`])(\w+)\1\s*,\s*(['"`])([^'"`]+)\3/g,
};

export const JQUERY_PATTERNS = {
    // $.ajax({ url: '...' }), $.get('...'), $.post('...')
    methods: /\$\.(ajax|get|post|getJSON)\s*\(\s*(['"`])([^'"`]+)\2/g,

    // $.ajax({ url: '...' }) specific
    ajaxConfig: /\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*(['"`])([^'"`]+)\1/g,
};

export const GRAPHQL_PATTERNS = {
    // gql`query { ... }`
    gqlTag: /gql\s*`([^`]+)`/g,

    // useQuery(QUERY_VAR)
    useQuery: /useQuery\s*\(\s*(\w+)/g,

    // useMutation(MUTATION_VAR)
    useMutation: /useMutation\s*\(\s*(\w+)/g,

    // client.query({ query: ... })
    clientQuery: /\.(query|mutate)\s*\(\s*\{[^}]*(query|mutation)\s*:/g,
};

export const SUPERAGENT_PATTERNS = {
    // superagent.get('url')
    methods: /superagent\.(get|post|put|delete)\s*\(\s*(['"`])([^'"`]+)\2/g,
};

export const AUTH_PATTERNS = {
    // localStorage.setItem('token', ...)
    storageSet: /(localStorage|sessionStorage)\.setItem\s*\(\s*(['"`])([^'"`]+)\2/g,

    // localStorage.getItem('token')
    storageGet: /(localStorage|sessionStorage)\.getItem\s*\(\s*(['"`])([^'"`]+)\2/g,

    // cookies.set('name', ...)
    cookieSet: /(?:cookies?|Cookie)\.set\s*\(\s*(['"`])([^'"`]+)\1/g,

    // headers: { Authorization: ... }
    authHeader: /['"]?Authorization['"]?\s*:\s*['"`](Bearer|Basic)\s+([^'"`]+)/g,

    // headers['Authorization'] = ...
    setHeader: /(?:headers|config\.headers)\[['"]Authorization['"]\]\s*=/g,
};

export const RETRY_PATTERNS = {
    // Loop with try/catch and await
    loopRetry: /for\s*\([^)]*\)\s*\{[^}]*try\s*\{[^}]*await[^}]*\}\s*catch/g,

    // Retry libraries
    axiosRetry: /axiosRetry\s*\(/g,
    fetchRetry: /fetchRetry\s*\(/g,

    // setTimeout inside catch
    setTimeoutRetry: /\.catch\s*\([^)]*\)\s*=>\s*\{[^}]*setTimeout/g,
};

export const ERROR_PATTERNS = {
    // .catch(err => ...)
    promiseCatch: /\.catch\s*\(\s*(?:\(?\w+\)?)/g,

    // catch (err) { ... }
    tryCatch: /try\s*\{[^}]*\}\s*catch\s*\(\s*\w+\s*\)/g,

    // axios.interceptors.response.use(..., err => ...)
    interceptor: /interceptors\.response\.use\s*\([^,]*,\s*(?:async\s*)?\(?\w+\)?\s*=>/g,
};
