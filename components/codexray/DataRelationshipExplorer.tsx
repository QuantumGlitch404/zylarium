import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    FolderOpen, Search, Loader2, X, Maximize2, Minimize2,
    FileText, Image, Video, Music, Code, Database, File, AlertTriangle,
    Copy, Link, Eye, EyeOff, HelpCircle, BookOpen, Share2, Filter,
    Trash2, CheckCircle, XCircle, BarChart3, Shield, Zap, Hash,
    ChevronRight, ChevronDown, Folder, RefreshCw, Download,
    Grid3X3, GitBranch, Layers, Activity, PanelLeftClose, PanelRightClose,
    PanelLeft, PanelRight
} from 'lucide-react';

// --- View Mode Type ---
type ViewMode = 'graph' | 'blueprint' | 'unity' | 'erd';

// --- Types ---
interface FileData {
    id: string;
    name: string;
    path: string;
    relativePath: string;
    size: number;
    type: 'document' | 'code' | 'image' | 'video' | 'audio' | 'binary' | 'other';
    mimeType: string;
    extension: string;
    hash?: string;
    chunkHashes?: string[];
    lastModified: number;
    content?: string;
    references: string[];
    referencedBy: string[];
    similarTo: { fileId: string; score: number }[];
}

interface DuplicateGroup {
    hash: string;
    files: FileData[];
    totalSize: number;
    savingsIfMerged: number;
}

interface ClusterData {
    id: string;
    files: FileData[];
    color: string;
}

interface FolderHealth {
    score: number;
    duplicateRatio: number;
    orphanRatio: number;
    heavyBinaryRatio: number;
    totalFiles: number;
    totalSize: number;
}

type FileTypeFilter = 'all' | 'document' | 'code' | 'image' | 'video' | 'audio' | 'binary' | 'other';

// --- Helper: Compute SHA-256 hash ---
async function computeHash(content: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', content);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Helper: Get file type from extension ---
function getFileType(extension: string): FileData['type'] {
    const ext = extension.toLowerCase();
    const docExts = ['.txt', '.md', '.pdf', '.doc', '.docx', '.rtf', '.odt', '.csv', '.json', '.xml', '.yaml', '.yml', '.html', '.htm'];
    const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rb', '.php', '.swift', '.kt', '.rs', '.vue', '.svelte'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico', '.tiff'];
    const videoExts = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'];
    const binaryExts = ['.exe', '.dll', '.so', '.dylib', '.zip', '.tar', '.gz', '.7z', '.rar'];

    if (docExts.includes(ext)) return 'document';
    if (codeExts.includes(ext)) return 'code';
    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (binaryExts.includes(ext)) return 'binary';
    return 'other';
}

// --- Helper: Get file type icon ---
const FileTypeIcon: React.FC<{ type: FileData['type']; className?: string }> = ({ type, className = "w-4 h-4" }) => {
    switch (type) {
        case 'document': return <FileText className={className} />;
        case 'code': return <Code className={className} />;
        case 'image': return <Image className={className} />;
        case 'video': return <Video className={className} />;
        case 'audio': return <Music className={className} />;
        case 'binary': return <Database className={className} />;
        default: return <File className={className} />;
    }
};

// --- Helper: Format file size ---
function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- Reference extraction patterns ---
const REFERENCE_PATTERNS = [
    // File references with extensions
    /(?:["'`])([\w\-./\\]+\.(png|jpg|jpeg|gif|svg|pdf|md|html|css|js|ts|jsx|tsx|json|xml|yaml|yml))(?:["'`])/gi,
    // Markdown image/link patterns
    /!\[.*?\]\((.*?)\)/g,
    /\[.*?\]\((.*?)\)/g,
    // HTML src/href patterns
    /<(?:img|script|link|a)[^>]+(?:src|href)=["']([^"']+)["']/gi,
    // Relative path patterns
    /(?:\.\.?\/)[\w\-./\\]+\.\w+/g,
];

// --- Extract references from text content ---
function extractReferences(content: string, currentPath: string): string[] {
    const refs = new Set<string>();

    for (const pattern of REFERENCE_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const ref = match[1] || match[0];
            if (ref && !ref.startsWith('http') && !ref.startsWith('//')) {
                refs.add(ref.replace(/\\/g, '/'));
            }
        }
    }

    return Array.from(refs);
}

// --- Compute n-gram similarity (Jaccard) ---
function computeSimilarity(text1: string, text2: string, n: number = 5): number {
    if (!text1 || !text2) return 0;

    const normalize = (t: string) => t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const ngrams = (t: string) => {
        const normalized = normalize(t);
        const grams = new Set<string>();
        for (let i = 0; i <= normalized.length - n; i++) {
            grams.add(normalized.slice(i, i + n));
        }
        return grams;
    };

    const grams1 = ngrams(text1);
    const grams2 = ngrams(text2);

    if (grams1.size === 0 || grams2.size === 0) return 0;

    let intersection = 0;
    for (const g of grams1) {
        if (grams2.has(g)) intersection++;
    }

    const union = grams1.size + grams2.size - intersection;
    return union > 0 ? intersection / union : 0;
}

// --- Tree Node for file tree ---
interface TreeNode {
    name: string;
    path: string;
    type: 'folder' | 'file';
    children?: TreeNode[];
    fileData?: FileData;
}

// --- Build file tree from flat list ---
function buildFileTree(files: FileData[]): TreeNode {
    const root: TreeNode = { name: 'root', path: '', type: 'folder', children: [] };

    files.forEach(file => {
        const parts = file.relativePath.split('/').filter(Boolean);
        let current = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            let child = current.children?.find(c => c.name === part);

            if (!child) {
                child = {
                    name: part,
                    path: parts.slice(0, index + 1).join('/'),
                    type: isFile ? 'file' : 'folder',
                    children: isFile ? undefined : [],
                    fileData: isFile ? file : undefined
                };
                current.children?.push(child);
            }

            current.children?.sort((a, b) =>
                a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1
            );

            if (!isFile) current = child;
        });
    });

    return root;
}

// --- File Tree Item Component ---
const FileTreeItem: React.FC<{
    item: TreeNode;
    depth: number;
    onSelect: (file: FileData) => void;
    selectedId: string | null;
    duplicateIds: Set<string>;
    orphanIds: Set<string>;
}> = ({ item, depth, onSelect, selectedId, duplicateIds, orphanIds }) => {
    const [expanded, setExpanded] = useState(depth < 2);

    if (item.type === 'file' && item.fileData) {
        const isDuplicate = duplicateIds.has(item.fileData.id);
        const isOrphan = orphanIds.has(item.fileData.id);

        return (
            <div
                onClick={() => item.fileData && onSelect(item.fileData)}
                className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-white/10 rounded ${item.fileData.id === selectedId ? 'bg-primary-500/20 text-primary-200' : 'text-gray-400'
                    }`}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
                <FileTypeIcon type={item.fileData.type} className="w-3 h-3" />
                <span className="truncate text-xs font-mono flex-1">{item.name}</span>
                {isDuplicate && <Copy className="w-3 h-3 text-yellow-400" title="Duplicate" />}
                {isOrphan && <AlertTriangle className="w-3 h-3 text-orange-400" title="Orphan" />}
            </div>
        );
    }

    return (
        <div>
            <div
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-white/10 rounded text-gray-300"
                style={{ paddingLeft: `${depth * 12}px` }}
            >
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <Folder className={`w-3 h-3 ${expanded ? 'text-primary-400' : 'text-gray-500'}`} />
                <span className="truncate text-xs font-medium">{item.name}</span>
            </div>
            {expanded && item.children?.map((child, i) => (
                <FileTreeItem
                    key={child.path + i}
                    item={child}
                    depth={depth + 1}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    duplicateIds={duplicateIds}
                    orphanIds={orphanIds}
                />
            ))}
        </div>
    );
};

// --- View Mode Selector (matching Architecture Map) ---
const ViewModeSelector: React.FC<{ mode: ViewMode; onChange: (m: ViewMode) => void }> = ({ mode, onChange }) => {
    const modes: { id: ViewMode; label: string; icon: React.ReactNode; color: string }[] = [
        { id: 'graph', label: 'Graph', icon: <Share2 className="w-4 h-4" />, color: 'primary' },
        { id: 'blueprint', label: 'Unreal Blueprint', icon: <Grid3X3 className="w-4 h-4" />, color: 'blue' },
        { id: 'unity', label: 'Unity Visual', icon: <GitBranch className="w-4 h-4" />, color: 'green' },
        { id: 'erd', label: 'ERD Diagram', icon: <Database className="w-4 h-4" />, color: 'orange' },
    ];
    return (
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {modes.map(m => (
                <button
                    key={m.id}
                    onClick={() => onChange(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${mode === m.id
                        ? `bg-${m.color}-500/20 text-${m.color}-300 ring-1 ring-${m.color}-500/50`
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    {m.icon}
                    <span className="hidden lg:inline">{m.label}</span>
                </button>
            ))}
        </div>
    );
};

// --- Guide Modal ---
const GuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" /> Data Relationship Explorer - Complete Guide
                </h2>
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer">
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-70px)] space-y-6 text-gray-300 text-sm">

                {/* Introduction */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-cyan-400" /> What is the Data Relationship Explorer?
                    </h3>
                    <p>This tool reveals hidden relationships between files in any folder. It detects duplicates, cross-file references, orphaned files, and similar content. Unlike code-specific tools, this works with any file type - documents, images, configs, and more.</p>
                </div>

                {/* Core Features */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">🔍 Core Capabilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg p-3 border-l-4 border-yellow-500">
                            <p className="font-medium text-yellow-300 mb-1">Duplicate Detection</p>
                            <p className="text-xs">Finds exact duplicates using SHA-256 hashing. Large files are efficiently processed using chunked fingerprinting (first, middle, last 1MB).</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border-l-4 border-blue-500">
                            <p className="font-medium text-blue-300 mb-1">Reference Tracking</p>
                            <p className="text-xs">Scans text files for references to other files - filenames, relative paths, URLs, markdown links, HTML attributes, and config values.</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border-l-4 border-orange-500">
                            <p className="font-medium text-orange-300 mb-1">Orphan Detection</p>
                            <p className="text-xs">Identifies files with zero incoming and outgoing references. Entry points (index.html, README.md) are automatically excluded from orphan classification.</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border-l-4 border-purple-500">
                            <p className="font-medium text-purple-300 mb-1">Similarity Analysis</p>
                            <p className="text-xs">For text files, computes content similarity using n-gram comparison. Adjustable threshold slider lets you tune sensitivity.</p>
                        </div>
                    </div>
                </div>

                {/* File Type Filters */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">📁 File Type Filters</h3>
                    <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                        {[
                            { type: 'document', label: 'Docs', icon: FileText },
                            { type: 'code', label: 'Code', icon: Code },
                            { type: 'image', label: 'Images', icon: Image },
                            { type: 'video', label: 'Video', icon: Video },
                            { type: 'audio', label: 'Audio', icon: Music },
                            { type: 'binary', label: 'Binary', icon: Database },
                            { type: 'other', label: 'Other', icon: File },
                        ].map(({ type, label, icon: Icon }) => (
                            <div key={type} className="bg-white/5 rounded-lg p-2 text-center">
                                <Icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                                <p className="text-xs">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Health Metrics */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">📊 Folder Health Score</h3>
                    <p className="mb-3 text-xs">The health score (0-100) is calculated based on:</p>
                    <div className="space-y-2">
                        <div className="bg-white/5 rounded-lg p-2 flex justify-between items-center">
                            <span className="text-xs">Duplicate Ratio (50% weight)</span>
                            <span className="text-yellow-300 text-xs">Files with identical content</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 flex justify-between items-center">
                            <span className="text-xs">Orphan Ratio (30% weight)</span>
                            <span className="text-orange-300 text-xs">Unreferenced files</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 flex justify-between items-center">
                            <span className="text-xs">Heavy Binary Ratio (20% weight)</span>
                            <span className="text-purple-300 text-xs">Large binary files</span>
                        </div>
                    </div>
                </div>

                {/* Change Sensitivity */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-red-400" /> Change Sensitivity Index
                    </h3>
                    <p className="text-xs">Files referenced by many other files are marked as "fragile". Changes to these files could break multiple dependents. The sensitivity score factors in both reference count and cluster spread.</p>
                </div>

                {/* Tips */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-2">💡 Tips</h3>
                    <ul className="space-y-1 text-xs">
                        <li>• Enable <strong>Duplicates toggle</strong> to highlight identical files</li>
                        <li>• Use <strong>the similarity slider</strong> to find near-duplicate content</li>
                        <li>• Review <strong>orphan files</strong> - they may be unused and safe to delete</li>
                        <li>• Check <strong>fragile files</strong> before refactoring to understand impact</li>
                        <li>• Export results as CSV for documentation or cleanup scripts</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

// --- Main Component ---
const DataRelationshipExplorer: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'processing' | 'ready'>('idle');
    const [progressMsg, setProgressMsg] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('graph');
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    const [files, setFiles] = useState<FileData[]>([]);
    const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
    const [clusters, setClusters] = useState<ClusterData[]>([]);
    const [folderHealth, setFolderHealth] = useState<FolderHealth | null>(null);

    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
    const [showOrphansOnly, setShowOrphansOnly] = useState(false);
    const [heatmapMode, setHeatmapMode] = useState(false);
    const [similarityThreshold, setSimilarityThreshold] = useState(70);
    const [searchTerm, setSearchTerm] = useState('');

    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Computed values ---
    const fileTree = useMemo(() => buildFileTree(files), [files]);

    const duplicateIds = useMemo(() => {
        const ids = new Set<string>();
        duplicateGroups.forEach(group => {
            group.files.forEach(f => ids.add(f.id));
        });
        return ids;
    }, [duplicateGroups]);

    const orphanIds = useMemo(() => {
        const ids = new Set<string>();
        const entryPatterns = ['index.html', 'index.htm', 'readme.md', 'readme.txt', 'main.js', 'main.ts', 'app.js', 'app.ts'];

        files.forEach(f => {
            const isEntry = entryPatterns.some(p => f.name.toLowerCase() === p);
            const hasNoRefs = f.references.length === 0 && f.referencedBy.length === 0;
            if (hasNoRefs && !isEntry) {
                ids.add(f.id);
            }
        });
        return ids;
    }, [files]);

    const filteredFiles = useMemo(() => {
        let result = files;

        if (fileTypeFilter !== 'all') {
            result = result.filter(f => f.type === fileTypeFilter);
        }
        if (showDuplicatesOnly) {
            result = result.filter(f => duplicateIds.has(f.id));
        }
        if (showOrphansOnly) {
            result = result.filter(f => orphanIds.has(f.id));
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(f =>
                f.name.toLowerCase().includes(term) ||
                f.path.toLowerCase().includes(term)
            );
        }

        return result;
    }, [files, fileTypeFilter, showDuplicatesOnly, showOrphansOnly, searchTerm, duplicateIds, orphanIds]);

    // --- Handle folder selection ---
    const handleFolderSelect = useCallback(async () => {
        try {
            // @ts-ignore - showDirectoryPicker is experimental
            const dirHandle = await window.showDirectoryPicker();
            await processDirectory(dirHandle);
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Error selecting folder:', err);
                alert('Error accessing folder. Please try again.');
            }
        }
    }, []);

    // --- Process directory recursively ---
    const processDirectory = async (dirHandle: FileSystemDirectoryHandle, basePath: string = '') => {
        setStatus('processing');
        setProgressMsg('Scanning files...');
        setProgressPercent(0);

        const allFiles: FileData[] = [];
        const fileContents: Map<string, string> = new Map();

        // Step 1: Enumerate files
        const entries: { handle: FileSystemFileHandle; path: string }[] = [];

        async function collectEntries(handle: FileSystemDirectoryHandle, path: string) {
            // @ts-ignore - File System Access API
            for await (const entry of (handle as any).values()) {
                if (entry.kind === 'file') {
                    entries.push({ handle: entry, path: path + '/' + entry.name });
                } else if (entry.kind === 'directory') {
                    // Skip common ignore directories
                    if (!['node_modules', '.git', 'dist', 'build', '__pycache__', 'venv', '.vscode'].includes(entry.name)) {
                        await collectEntries(entry, path + '/' + entry.name);
                    }
                }
            }
        }

        await collectEntries(dirHandle, basePath);

        // Step 2: Process each file
        for (let i = 0; i < entries.length; i++) {
            const { handle, path } = entries[i];
            setProgressMsg(`Processing: ${handle.name}`);
            setProgressPercent(Math.round((i / entries.length) * 50));

            try {
                const file = await handle.getFile();
                const extension = '.' + handle.name.split('.').pop()?.toLowerCase();
                const type = getFileType(extension);

                let hash: string | undefined;
                let content: string | undefined;

                // Read file for hashing and content
                const arrayBuffer = await file.arrayBuffer();

                // Compute hash
                if (file.size <= 5 * 1024 * 1024) { // 5MB
                    hash = await computeHash(arrayBuffer);
                } else {
                    // Chunked hashing for large files
                    const firstChunk = arrayBuffer.slice(0, 1024 * 1024);
                    const middleStart = Math.floor(arrayBuffer.byteLength / 2) - 512 * 1024;
                    const middleChunk = arrayBuffer.slice(middleStart, middleStart + 1024 * 1024);
                    const lastChunk = arrayBuffer.slice(-1024 * 1024);

                    const combined = new Uint8Array(firstChunk.byteLength + middleChunk.byteLength + lastChunk.byteLength);
                    combined.set(new Uint8Array(firstChunk), 0);
                    combined.set(new Uint8Array(middleChunk), firstChunk.byteLength);
                    combined.set(new Uint8Array(lastChunk), firstChunk.byteLength + middleChunk.byteLength);

                    hash = await computeHash(combined.buffer);
                }

                // Read text content for text-based files
                if (['document', 'code', 'other'].includes(type) && file.size <= 1024 * 1024) {
                    try {
                        content = new TextDecoder().decode(arrayBuffer);
                        fileContents.set(path, content);
                    } catch (e) {
                        // Binary file, skip content
                    }
                }

                const fileData: FileData = {
                    id: crypto.randomUUID(),
                    name: handle.name,
                    path: path,
                    relativePath: path.startsWith('/') ? path.slice(1) : path,
                    size: file.size,
                    type,
                    mimeType: file.type || 'application/octet-stream',
                    extension,
                    hash,
                    lastModified: file.lastModified,
                    content: content?.slice(0, 5000), // Store preview
                    references: [],
                    referencedBy: [],
                    similarTo: []
                };

                allFiles.push(fileData);
            } catch (err) {
                console.error(`Error processing ${path}:`, err);
            }
        }

        // Step 3: Extract references
        setProgressMsg('Analyzing references...');
        setProgressPercent(60);

        for (const file of allFiles) {
            const content = fileContents.get(file.path);
            if (content) {
                file.references = extractReferences(content, file.path);
            }
        }

        // Build referencedBy relationships
        const pathToId = new Map(allFiles.map(f => [f.relativePath, f.id]));
        const idToFile = new Map(allFiles.map(f => [f.id, f]));

        for (const file of allFiles) {
            for (const ref of file.references) {
                // Try to resolve the reference
                const normalizedRef = ref.replace(/\\/g, '/');
                for (const [path, id] of pathToId) {
                    if (path.endsWith(normalizedRef) || path.includes(normalizedRef)) {
                        const targetFile = idToFile.get(id);
                        if (targetFile && targetFile.id !== file.id) {
                            if (!targetFile.referencedBy.includes(file.id)) {
                                targetFile.referencedBy.push(file.id);
                            }
                        }
                    }
                }
            }
        }

        // Step 4: Find duplicates
        setProgressMsg('Finding duplicates...');
        setProgressPercent(70);

        const hashGroups = new Map<string, FileData[]>();
        for (const file of allFiles) {
            if (file.hash) {
                const existing = hashGroups.get(file.hash) || [];
                existing.push(file);
                hashGroups.set(file.hash, existing);
            }
        }

        const dupes: DuplicateGroup[] = [];
        for (const [hash, groupFiles] of hashGroups) {
            if (groupFiles.length > 1) {
                const totalSize = groupFiles.reduce((s, f) => s + f.size, 0);
                dupes.push({
                    hash,
                    files: groupFiles,
                    totalSize,
                    savingsIfMerged: totalSize - groupFiles[0].size
                });
            }
        }

        // Step 5: Compute similarity (simplified for performance)
        setProgressMsg('Computing similarity...');
        setProgressPercent(80);

        const textFiles = allFiles.filter(f => fileContents.has(f.path));
        for (let i = 0; i < textFiles.length && i < 100; i++) { // Limit for performance
            const file1 = textFiles[i];
            const content1 = fileContents.get(file1.path) || '';

            for (let j = i + 1; j < textFiles.length && j < 100; j++) {
                const file2 = textFiles[j];
                const content2 = fileContents.get(file2.path) || '';

                const similarity = computeSimilarity(content1, content2);
                if (similarity >= similarityThreshold / 100) {
                    file1.similarTo.push({ fileId: file2.id, score: similarity });
                    file2.similarTo.push({ fileId: file1.id, score: similarity });
                }
            }
        }

        // Step 6: Compute health score
        setProgressMsg('Computing health score...');
        setProgressPercent(90);

        const totalSize = allFiles.reduce((s, f) => s + f.size, 0);
        const duplicateCount = dupes.reduce((c, g) => c + g.files.length - 1, 0);
        const orphanCount = allFiles.filter(f => {
            const isEntry = ['index.html', 'readme.md', 'main.js', 'app.js'].some(p =>
                f.name.toLowerCase() === p
            );
            return f.references.length === 0 && f.referencedBy.length === 0 && !isEntry;
        }).length;
        const binaryBytes = allFiles.filter(f => f.type === 'binary').reduce((s, f) => s + f.size, 0);

        const dupRatio = allFiles.length > 0 ? duplicateCount / allFiles.length : 0;
        const orphanRatio = allFiles.length > 0 ? orphanCount / allFiles.length : 0;
        const heavyBinaryRatio = totalSize > 0 ? binaryBytes / totalSize : 0;

        const health: FolderHealth = {
            score: Math.max(0, 100 - (dupRatio * 50 + orphanRatio * 30 + heavyBinaryRatio * 20) * 100),
            duplicateRatio: dupRatio,
            orphanRatio: orphanRatio,
            heavyBinaryRatio: heavyBinaryRatio,
            totalFiles: allFiles.length,
            totalSize
        };

        // Update state
        setFiles(allFiles);
        setDuplicateGroups(dupes);
        setFolderHealth(health);
        setStatus('ready');
        setProgressPercent(100);

        // Fit view
        fitToView(allFiles);
    };

    // --- Fit view to show all nodes ---
    const fitToView = useCallback((fileList: FileData[]) => {
        if (fileList.length === 0 || !canvasRef.current) return;

        const canvasWidth = canvasRef.current.offsetWidth || 800;
        const canvasHeight = canvasRef.current.offsetHeight || 600;

        // Simple grid layout for now
        const cols = Math.max(4, Math.ceil(Math.sqrt(fileList.length)));
        const spacing = 100;

        const maxX = cols * spacing + 100;
        const maxY = Math.ceil(fileList.length / cols) * spacing + 100;

        setViewBox({
            x: -50,
            y: -50,
            width: Math.max(maxX, canvasWidth),
            height: Math.max(maxY, canvasHeight)
        });
    }, []);

    // --- Get node position based on view mode ---
    const getNodePosition = useCallback((file: FileData, index: number) => {
        const cols = Math.max(4, Math.ceil(Math.sqrt(filteredFiles.length)));
        const row = Math.floor(index / cols);
        const col = index % cols;

        if (viewMode === 'graph') {
            // Force-directed style - use grid with some variation
            const angle = (index * 137.508) * Math.PI / 180; // Golden angle
            const radius = Math.sqrt(index) * 60;
            return {
                x: 400 + Math.cos(angle) * radius,
                y: 300 + Math.sin(angle) * radius
            };
        }

        if (viewMode === 'blueprint') {
            // Grid layout like Unreal Blueprint
            const spacing = 180;
            return { x: col * spacing + 100, y: row * spacing + 80 };
        }

        if (viewMode === 'unity') {
            // Left-to-right flow by folder depth
            const depth = file.relativePath.split('/').length;
            const filesAtDepth = filteredFiles.filter(f => f.relativePath.split('/').length === depth);
            const indexAtDepth = filesAtDepth.findIndex(f => f.id === file.id);
            return { x: depth * 250, y: indexAtDepth * 80 + 50 };
        }

        if (viewMode === 'erd') {
            // ERD style - larger boxes in grid
            const spacing = 240;
            return { x: col * spacing + 120, y: row * 140 + 80 };
        }

        return { x: col * 100 + 50, y: row * 80 + 50 };
    }, [filteredFiles, viewMode]);

    // --- Mouse handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && canvasRef.current) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            const canvasWidth = canvasRef.current.offsetWidth || 800;
            const canvasHeight = canvasRef.current.offsetHeight || 600;
            const scaleX = viewBox.width / canvasWidth;
            const scaleY = viewBox.height / canvasHeight;
            setViewBox(vb => ({
                x: vb.x - dx * scaleX,
                y: vb.y - dy * scaleY,
                width: vb.width,
                height: vb.height
            }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    // --- Toggle fullscreen ---
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) containerRef.current.requestFullscreen();
        else document.exitFullscreen();
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const glassPanel = "bg-white/10 backdrop-blur-xl border border-white/20";

    // --- Get node color based on type and status ---
    const getNodeColor = (file: FileData) => {
        if (duplicateIds.has(file.id)) return '#eab308'; // yellow
        if (orphanIds.has(file.id)) return '#f97316'; // orange

        const colors: Record<string, string> = {
            document: '#3b82f6',
            code: '#22c55e',
            image: '#ec4899',
            video: '#8b5cf6',
            audio: '#14b8a6',
            binary: '#6b7280',
            other: '#9ca3af'
        };
        return colors[file.type] || '#9ca3af';
    };

    // --- Export functions ---
    const exportCSV = () => {
        const rows = [
            ['Name', 'Path', 'Type', 'Size', 'Hash', 'Is Duplicate', 'Is Orphan', 'References', 'Referenced By'].join(','),
            ...files.map(f => [
                f.name,
                f.path,
                f.type,
                f.size,
                f.hash || '',
                duplicateIds.has(f.id) ? 'Yes' : 'No',
                orphanIds.has(f.id) ? 'Yes' : 'No',
                f.references.length,
                f.referencedBy.length
            ].join(','))
        ];

        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data-relationships.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            ref={containerRef}
            data-fullscreen={isFullscreen}
            className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-[9998] h-screen w-screen bg-black/90 backdrop-blur-3xl' : 'h-[calc(100vh-140px)] bg-transparent'} rounded-2xl overflow-hidden shadow-2xl`}
            style={{ cursor: 'auto' }}
        >
            {/* Fullscreen cursor fix - explicit CSS override (matching Architecture Map) */}
            {isFullscreen && (
                <style>{`
                    [data-fullscreen="true"],
                    [data-fullscreen="true"] * {
                        cursor: auto !important;
                    }
                    [data-fullscreen="true"] .canvas-area {
                        cursor: grab !important;
                    }
                    [data-fullscreen="true"] .canvas-area:active {
                        cursor: grabbing !important;
                    }
                    [data-fullscreen="true"] button,
                    [data-fullscreen="true"] input,
                    [data-fullscreen="true"] select,
                    [data-fullscreen="true"] [class*="cursor-pointer"] {
                        cursor: pointer !important;
                    }
                    [data-fullscreen="true"] input[type="text"] {
                        cursor: text !important;
                    }
                `}</style>
            )}
            {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

            {/* Top Bar - Responsive */}
            <div className={`min-h-[56px] ${glassPanel} border-b border-white/20 flex flex-wrap items-center justify-between px-3 gap-2 z-20 shrink-0 py-2`} style={{ cursor: 'auto' }}>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleFolderSelect}
                        disabled={status === 'processing'}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg disabled:opacity-50 whitespace-nowrap"
                    >
                        <FolderOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">{status === 'processing' ? 'Scanning...' : 'Select Folder'}</span>
                        <span className="sm:hidden">{status === 'processing' ? '...' : 'Folder'}</span>
                    </button>

                    {status === 'ready' && <ViewModeSelector mode={viewMode} onChange={setViewMode} />}

                    {status === 'ready' && folderHealth && (
                        <div className={`px-2 py-1 rounded-lg text-xs font-medium hidden md:flex ${folderHealth.score >= 80 ? 'bg-green-500/20 text-green-300' :
                            folderHealth.score >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-red-500/20 text-red-300'
                            }`}>
                            {Math.round(folderHealth.score)}%
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* File type filter - styled to match Unitoolbox dropdowns */}
                    <select
                        value={fileTypeFilter}
                        onChange={(e) => setFileTypeFilter(e.target.value as FileTypeFilter)}
                        className="bg-gray-900/90 border border-white/20 text-gray-200 text-xs rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:border-primary-500/50 backdrop-blur-sm"
                        style={{ cursor: 'pointer' }}
                    >
                        <option value="all" className="bg-gray-900 text-gray-200">All Types</option>
                        <option value="document" className="bg-gray-900 text-gray-200">Documents</option>
                        <option value="code" className="bg-gray-900 text-gray-200">Code</option>
                        <option value="image" className="bg-gray-900 text-gray-200">Images</option>
                        <option value="video" className="bg-gray-900 text-gray-200">Video</option>
                        <option value="audio" className="bg-gray-900 text-gray-200">Audio</option>
                        <option value="binary" className="bg-gray-900 text-gray-200">Binary</option>
                        <option value="other" className="bg-gray-900 text-gray-200">Other</option>
                    </select>

                    <button
                        onClick={() => setHeatmapMode(!heatmapMode)}
                        className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium cursor-pointer ${heatmapMode ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                        <Layers className="w-3 h-3" /> Heat
                    </button>

                    <button
                        onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                        className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium cursor-pointer ${showDuplicatesOnly ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                        <Copy className="w-3 h-3" /> Dups
                    </button>

                    <button
                        onClick={() => setShowOrphansOnly(!showOrphansOnly)}
                        className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium cursor-pointer ${showOrphansOnly ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                        <AlertTriangle className="w-3 h-3" /> Orphans
                    </button>

                    <div className="relative ml-2">
                        <Search className="w-3 h-3 text-gray-500 absolute left-2 top-2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 text-gray-200 text-xs rounded-lg pl-7 pr-2 py-1.5 focus:outline-none focus:border-primary-500/50 w-28 placeholder-gray-500"
                            style={{ cursor: 'text' }}
                        />
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

                    {status === 'ready' && (
                        <button onClick={exportCSV} className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white cursor-pointer hidden sm:flex" title="Export CSV">
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                        className={`p-2 rounded-lg cursor-pointer ${showLeftSidebar ? 'bg-primary-500/20 text-primary-300' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        title={showLeftSidebar ? 'Hide Files Panel' : 'Show Files Panel'}
                    >
                        {showLeftSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setShowRightSidebar(!showRightSidebar)}
                        className={`p-2 rounded-lg cursor-pointer ${showRightSidebar ? 'bg-primary-500/20 text-primary-300' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        title={showRightSidebar ? 'Hide Inspector' : 'Show Inspector'}
                    >
                        {showRightSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setShowGuide(true)} className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white cursor-pointer">
                        <HelpCircle className="w-4 h-4" />
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white cursor-pointer">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane - File Tree (Collapsible) */}
                {showLeftSidebar && (
                    <div className={`w-56 ${glassPanel} border-r border-white/10 flex flex-col z-10 shrink-0`}>
                        <div className="p-2 border-b border-white/10 text-xs font-bold text-gray-300 uppercase flex justify-between items-center">
                            <span>Files ({filteredFiles.length})</span>
                            <button onClick={() => setShowLeftSidebar(false)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
                                <X className="w-3 h-3 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1">
                            {fileTree.children?.map((child, i) => (
                                <FileTreeItem
                                    key={i}
                                    item={child}
                                    depth={0}
                                    onSelect={setSelectedFile}
                                    selectedId={selectedFile?.id || null}
                                    duplicateIds={duplicateIds}
                                    orphanIds={orphanIds}
                                />
                            )) || <div className="text-gray-600 text-xs italic p-4 text-center">No files</div>}
                        </div>
                    </div>
                )}

                {/* Canvas - Matching Architecture Map styling */}
                <div
                    ref={canvasRef}
                    className="canvas-area flex-1 relative overflow-hidden"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab', background: 'transparent' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onWheel={(e) => {
                        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
                        setViewBox(vb => ({
                            x: vb.x,
                            y: vb.y,
                            width: vb.width * zoomFactor,
                            height: vb.height * zoomFactor
                        }));
                    }}
                >
                    {/* Grid pattern - matching Architecture Map */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }} />

                    {status === 'idle' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center opacity-50">
                                <FolderOpen className="w-16 h-16 text-cyan-500/50 mx-auto mb-4" />
                                <p className="text-gray-500">Select a folder to explore</p>
                            </div>
                        </div>
                    )}

                    {status === 'processing' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-md">
                            <div className={`text-center p-6 rounded-2xl ${glassPanel}`}>
                                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-2" />
                                <p className="text-cyan-300 text-sm mb-2">{progressMsg}</p>
                                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SVG Canvas */}
                    <svg
                        className="absolute top-0 left-0 w-full h-full"
                        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Defs for glow effects */}
                        <defs>
                            <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>

                        {/* Edges - References */}
                        {status === 'ready' && filteredFiles.map((file, i) => {
                            const sourcePos = getNodePosition(file, i);
                            return file.referencedBy.map((refId, j) => {
                                const refIndex = filteredFiles.findIndex(f => f.id === refId);
                                if (refIndex === -1) return null;
                                const refFile = filteredFiles[refIndex];
                                const targetPos = getNodePosition(refFile, refIndex);
                                return (
                                    <line
                                        key={`${file.id}-${refId}-${j}`}
                                        x1={targetPos.x}
                                        y1={targetPos.y}
                                        x2={sourcePos.x}
                                        y2={sourcePos.y}
                                        stroke="#818cf8"
                                        strokeWidth={2}
                                        opacity={0.5}
                                        filter="url(#edgeGlow)"
                                    />
                                );
                            });
                        })}

                        {/* Edges - Duplicates */}
                        {status === 'ready' && duplicateGroups.map(group => {
                            const groupFiles = group.files.filter(f => filteredFiles.some(ff => ff.id === f.id));
                            if (groupFiles.length < 2) return null;

                            return groupFiles.slice(1).map((file, i) => {
                                const sourceIndex = filteredFiles.findIndex(f => f.id === groupFiles[0].id);
                                const targetIndex = filteredFiles.findIndex(f => f.id === file.id);
                                if (sourceIndex === -1 || targetIndex === -1) return null;

                                const sourceFile = filteredFiles[sourceIndex];
                                const targetFile = filteredFiles[targetIndex];
                                const sourcePos = getNodePosition(sourceFile, sourceIndex);
                                const targetPos = getNodePosition(targetFile, targetIndex);

                                return (
                                    <line
                                        key={`dup-${group.hash}-${i}`}
                                        x1={sourcePos.x}
                                        y1={sourcePos.y}
                                        x2={targetPos.x}
                                        y2={targetPos.y}
                                        stroke="#eab308"
                                        strokeWidth={2.5}
                                        strokeDasharray="8,4"
                                        opacity={0.7}
                                        filter="url(#edgeGlow)"
                                    />
                                );
                            });
                        })}

                        {/* Nodes - view mode specific rendering */}
                        {status === 'ready' && filteredFiles.map((file, i) => {
                            const pos = getNodePosition(file, i);
                            const isSelected = selectedFile?.id === file.id;
                            const isDup = duplicateIds.has(file.id);
                            const isOrphan = orphanIds.has(file.id);
                            let color = getNodeColor(file);

                            // Heatmap mode - color by reference count
                            if (heatmapMode) {
                                const refCount = file.referencedBy.length + file.references.length;
                                const intensity = Math.min(1, refCount / 10);
                                color = `hsl(${60 - intensity * 60}, 80%, ${50 + intensity * 20}%)`;
                            }

                            // Blueprint style
                            if (viewMode === 'blueprint') {
                                return (
                                    <g key={file.id} transform={`translate(${pos.x}, ${pos.y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedFile(file)}>
                                        <rect x="-75" y="-30" width="150" height="60" rx="4" fill="#1a1a2e" stroke={isSelected ? '#fff' : color} strokeWidth={isSelected ? 3 : 2} />
                                        <rect x="-75" y="-30" width="150" height="18" fill={color} rx="4" />
                                        <rect x="-75" y="-12" width="150" height="4" fill={color} />
                                        <text x="0" y="-15" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">{file.name.slice(0, 18)}</text>
                                        <text x="-65" y="5" fill="#fff" fontSize="8">{file.extension}</text>
                                        <text x="-65" y="18" fill="#888" fontSize="7">↓{file.referencedBy.length} ↑{file.references.length}</text>
                                        {isDup && <circle cx="60" cy="-20" r="6" fill="#eab308" />}
                                        {isOrphan && <circle cx="60" cy="20" r="6" fill="#f97316" />}
                                    </g>
                                );
                            }

                            // Unity style
                            if (viewMode === 'unity') {
                                return (
                                    <g key={file.id} transform={`translate(${pos.x}, ${pos.y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedFile(file)}>
                                        <rect x="-80" y="-25" width="160" height="50" rx="8" fill="rgba(15,23,42,0.9)" stroke={isSelected ? '#fff' : color} strokeWidth={isSelected ? 3 : 2} />
                                        <circle cx="-90" cy="0" r="6" fill={color} />
                                        <circle cx="90" cy="0" r="6" fill={color} />
                                        <text x="0" y="-5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">{file.name.slice(0, 16)}</text>
                                        <text x="0" y="12" textAnchor="middle" fill="#888" fontSize="8">{file.type} • {formatSize(file.size)}</text>
                                    </g>
                                );
                            }

                            // ERD style
                            if (viewMode === 'erd') {
                                return (
                                    <g key={file.id} transform={`translate(${pos.x}, ${pos.y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedFile(file)}>
                                        <rect x="-100" y="-50" width="200" height="100" rx="4" fill="#1e1e1e" stroke={isSelected ? '#fff' : color} strokeWidth={isSelected ? 3 : 2} />
                                        <rect x="-100" y="-50" width="200" height="28" fill={color} rx="4" />
                                        <rect x="-100" y="-22" width="200" height="6" fill={color} />
                                        <text x="0" y="-30" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">{file.name.slice(0, 20)}</text>
                                        <line x1="-100" y1="-22" x2="100" y2="-22" stroke="#444" />
                                        <text x="-90" y="-5" fill="#888" fontSize="9">📁 {file.relativePath.split('/').slice(0, -1).pop() || 'root'}</text>
                                        <text x="-90" y="12" fill="#aaa" fontSize="9">↓ {file.referencedBy.length} refs</text>
                                        <text x="-90" y="28" fill="#aaa" fontSize="9">↑ {file.references.length} links</text>
                                        <text x="-90" y="44" fill="#666" fontSize="8">{formatSize(file.size)}</text>
                                    </g>
                                );
                            }

                            // Default Graph style - circular nodes
                            const size = Math.max(14, Math.min(file.referencedBy.length * 2 + 14, 40));
                            return (
                                <g key={file.id} transform={`translate(${pos.x}, ${pos.y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedFile(file)}>
                                    <circle
                                        r={isSelected ? size + 4 : size}
                                        fill={color}
                                        stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.3)'}
                                        strokeWidth={isSelected ? 3 : 2}
                                        style={{ filter: isDup || isOrphan ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : undefined }}
                                    />
                                    <text y={size + 14} textAnchor="middle" fill="#fff" fontSize="9">
                                        {file.name.length > 15 ? file.name.slice(0, 12) + '...' : file.name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    {/* Stats overlay */}
                    {status === 'ready' && (
                        <div className={`absolute top-4 left-4 ${glassPanel} rounded-xl px-3 py-2 text-xs text-gray-400`}>
                            <span className="text-white font-bold">{filteredFiles.length}</span> files •
                            <span className="text-yellow-300 font-bold ml-1">{duplicateGroups.length}</span> duplicate groups •
                            <span className="text-orange-300 font-bold ml-1">{orphanIds.size}</span> orphans
                        </div>
                    )}
                </div>

                {/* Right Pane - Inspector (Collapsible) */}
                {showRightSidebar && (
                    <div className={`w-64 ${glassPanel} border-l border-white/10 flex flex-col z-20 shrink-0`}>
                        <div className="p-2 border-b border-white/10 font-bold text-gray-300 text-xs uppercase flex justify-between items-center">
                            <span>Inspector</span>
                            <div className="flex items-center gap-1">
                                {selectedFile && (
                                    <button onClick={() => setSelectedFile(null)} className="hover:text-white cursor-pointer p-1" title="Clear selection">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                                <button onClick={() => setShowRightSidebar(false)} className="hover:text-white cursor-pointer p-1" title="Close Inspector">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {selectedFile ? (
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileTypeIcon type={selectedFile.type} className="w-5 h-5" style={{ color: getNodeColor(selectedFile) }} />
                                        <h3 className="text-sm font-bold text-white break-all leading-tight">{selectedFile.name}</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 text-[9px] font-mono">{selectedFile.extension}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-300 text-[9px]">{formatSize(selectedFile.size)}</span>
                                        {duplicateIds.has(selectedFile.id) && (
                                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[9px] font-bold">DUPLICATE</span>
                                        )}
                                        {orphanIds.has(selectedFile.id) && (
                                            <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[9px] font-bold">ORPHAN</span>
                                        )}
                                    </div>
                                </div>

                                <div className={`${glassPanel} p-2 rounded-lg`}>
                                    <div className="text-[9px] text-gray-500 uppercase mb-0.5">Path</div>
                                    <code className="text-[9px] text-gray-300 break-all">{selectedFile.relativePath}</code>
                                </div>

                                {selectedFile.hash && (
                                    <div className={`${glassPanel} p-2 rounded-lg`}>
                                        <div className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center gap-1">
                                            <Hash className="w-3 h-3" /> SHA-256
                                        </div>
                                        <code className="text-[8px] text-gray-400 break-all">{selectedFile.hash.slice(0, 32)}...</code>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`${glassPanel} p-2 rounded-lg text-center`}>
                                        <div className="text-lg font-bold text-cyan-300">{selectedFile.referencedBy.length}</div>
                                        <div className="text-[8px] text-gray-500 uppercase">Referenced By</div>
                                    </div>
                                    <div className={`${glassPanel} p-2 rounded-lg text-center`}>
                                        <div className="text-lg font-bold text-blue-300">{selectedFile.references.length}</div>
                                        <div className="text-[8px] text-gray-500 uppercase">References</div>
                                    </div>
                                </div>

                                {selectedFile.similarTo.length > 0 && (
                                    <div className={`${glassPanel} p-2 rounded-lg`}>
                                        <div className="text-[9px] text-gray-500 uppercase mb-1">Similar Files</div>
                                        <div className="space-y-1">
                                            {selectedFile.similarTo.slice(0, 3).map(sim => {
                                                const simFile = files.find(f => f.id === sim.fileId);
                                                return simFile ? (
                                                    <div key={sim.fileId} className="flex justify-between items-center text-[9px]">
                                                        <span className="text-gray-300 truncate flex-1">{simFile.name}</span>
                                                        <span className="text-purple-300 ml-2">{Math.round(sim.score * 100)}%</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Change Sensitivity */}
                                {selectedFile.referencedBy.length > 3 && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                                        <div className="text-[9px] text-red-400 font-bold uppercase flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> Fragile File
                                        </div>
                                        <p className="text-[8px] text-red-300/80 mt-1">
                                            This file is referenced by {selectedFile.referencedBy.length} other files. Changes may have wide impact.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                                <Eye className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-xs text-gray-400">Click a node to inspect</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataRelationshipExplorer;
