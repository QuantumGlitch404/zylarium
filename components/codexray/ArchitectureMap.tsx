import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    ZoomIn, ZoomOut, Move, Layers, Activity, Folder,
    FileCode, AlertTriangle, ChevronRight, ChevronDown,
    Upload, Search, Loader2, X, Maximize2, Minimize2,
    Code, Database, Box, HelpCircle, BookOpen, Grid3X3, GitBranch, Share2,
    PanelLeftClose, PanelRightClose, PanelLeft, PanelRight
} from 'lucide-react';
import { processRepoZip, DependencyGraph, FileNode } from '../../utils/codeProcessor';
// @ts-ignore
import GraphWorker from '../../workers/graphLayout.worker?worker';

// --- Helpers ---
function formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// --- Types ---
interface SimulationNode extends FileNode {
    x: number;
    y: number;
    centrality: number;
    inDegree: number;
    outDegree: number;
    risk: 'low' | 'medium' | 'high';
    folder?: string;
}

interface TreeNode {
    name: string;
    path: string;
    type: 'folder' | 'file';
    children?: TreeNode[];
    fileId?: string;
}

type ViewMode = 'graph' | 'blueprint' | 'unity' | 'erd';

// --- Helper: Build File Tree ---
function buildFileTree(nodes: FileNode[]): TreeNode {
    const root: TreeNode = { name: 'root', path: '', type: 'folder', children: [] };
    nodes.forEach(node => {
        const parts = node.path.split('/');
        let current = root;
        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            let child = current.children?.find(c => c.name === part);
            if (!child) {
                child = { name: part, path: parts.slice(0, index + 1).join('/'), type: isFile ? 'file' : 'folder', children: isFile ? undefined : [], fileId: isFile ? node.id : undefined };
                current.children?.push(child);
            }
            current.children?.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1);
            if (!isFile) current = child;
        });
    });
    return root;
}

// --- File Tree Item ---
const FileTreeItem: React.FC<{ item: TreeNode; depth: number; onSelect: (id: string) => void; selectedId: string | null }> = ({ item, depth, onSelect, selectedId }) => {
    const [expanded, setExpanded] = useState(depth < 2);
    if (item.type === 'file') {
        return (
            <div onClick={() => item.fileId && onSelect(item.fileId)} className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-white/10 rounded ${item.fileId === selectedId ? 'bg-primary-500/20 text-primary-200' : 'text-gray-400'}`} style={{ paddingLeft: `${depth * 12 + 4}px` }}>
                <FileCode className="w-3 h-3" />
                <span className="truncate text-xs font-mono">{item.name}</span>
            </div>
        );
    }
    return (
        <div>
            <div onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-white/10 rounded text-gray-300" style={{ paddingLeft: `${depth * 12}px` }}>
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <Folder className={`w-3 h-3 ${expanded ? 'text-primary-400' : 'text-gray-500'}`} />
                <span className="truncate text-xs font-medium">{item.name}</span>
            </div>
            {expanded && item.children?.map((child, i) => <FileTreeItem key={child.path + i} item={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />)}
        </div>
    );
};

// --- View Mode Selector ---
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
                <button key={m.id} onClick={() => onChange(m.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${mode === m.id ? `bg-${m.color}-500/20 text-${m.color}-300 ring-1 ring-${m.color}-500/50` : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    {m.icon}
                    <span className="hidden lg:inline">{m.label}</span>
                </button>
            ))}
        </div>
    );
};

// --- Guide Modal ---
const GuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose} style={{ cursor: 'default' }}>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-primary-600/20 to-purple-600/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary-400" /> Interactive Architecture Map - Complete Guide</h2>
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-70px)] space-y-6 text-gray-300 text-sm">

                {/* Introduction */}
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Share2 className="w-4 h-4 text-primary-400" /> What is the Architecture Map?</h3>
                    <p>The Interactive Architecture Map visualizes your entire codebase as a connected graph. It shows how files depend on each other through imports and exports, helping you understand the structure and identify potential issues like circular dependencies or overly complex modules.</p>
                </div>

                {/* Getting Started */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">📁 Getting Started</h3>
                    <div className="space-y-2">
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="font-medium text-white mb-1">Upload ZIP Button</p>
                            <p>Click this button to upload a ZIP file containing your project. The tool will scan all supported files (JavaScript, TypeScript, Python, Java, Go) and build a dependency graph automatically. Large projects may take a few seconds to process.</p>
                        </div>
                    </div>
                </div>

                {/* View Modes */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">🎨 Visualization Modes</h3>
                    <p className="mb-3">Choose how your codebase is displayed. Each mode offers a different perspective:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg p-3 border-l-4 border-primary-500">
                            <p className="font-medium text-primary-300 mb-1">Graph View</p>
                            <p className="text-xs">A force-directed layout where connected files naturally cluster together. Files with many connections appear larger. Best for seeing the overall structure and identifying central modules.</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border-l-4 border-blue-500">
                            <p className="font-medium text-blue-300 mb-1">Unreal Blueprint</p>
                            <p className="text-xs">Displays files as blueprint-style nodes arranged in a grid. Each node shows the file name, extension, and connection counts. Similar to how Unreal Engine displays visual scripts.</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border-l-4 border-green-500">
                            <p className="font-medium text-green-300 mb-1">Unity Visual</p>
                            <p className="text-xs">A left-to-right flow layout organized by folder depth. Files at the same directory level appear in columns. Useful for understanding project hierarchy and data flow.</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border-l-4 border-orange-500">
                            <p className="font-medium text-orange-300 mb-1">ERD Diagram</p>
                            <p className="text-xs">Entity-Relationship style boxes showing detailed file information including folder location, import count, and export count. Ideal for documentation and presentations.</p>
                        </div>
                    </div>
                </div>

                {/* Analysis Tools */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">🔍 Analysis Tools</h3>
                    <div className="space-y-2">
                        <div className="bg-white/5 rounded-lg p-3 flex gap-3">
                            <div className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-medium shrink-0 h-fit">Impact</div>
                            <div>
                                <p className="font-medium text-white mb-1">Dependency Impact Analysis</p>
                                <p className="text-xs">When enabled, click any file to see its impact radius. All files that depend on it (directly or indirectly) will be highlighted in red. This helps you understand how changes to one file might affect the rest of your project. Non-affected files become dimmed.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 flex gap-3">
                            <div className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs font-medium shrink-0 h-fit">Heat</div>
                            <div>
                                <p className="font-medium text-white mb-1">Heatmap Mode</p>
                                <p className="text-xs">Colors nodes based on their connectivity (centrality). Files with many connections appear in warmer colors (red/orange), while isolated files appear in cooler colors (yellow/green). Helps identify potential bottlenecks or overly complex modules.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 flex gap-3">
                            <div className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs font-medium shrink-0 h-fit">Cycles</div>
                            <div>
                                <p className="font-medium text-white mb-1">Circular Dependency Detection</p>
                                <p className="text-xs">Filters the view to show only files involved in circular dependencies. Circular imports can cause runtime issues and make code harder to maintain. These files are marked as high-risk and have a red glow effect.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 flex gap-3">
                            <div className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded text-xs font-medium shrink-0 h-fit">Search</div>
                            <div>
                                <p className="font-medium text-white mb-1">File Search</p>
                                <p className="text-xs">Type any text to filter files by name or path. Only matching files will be displayed. Clear the search to show all files again.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">🎮 Navigation Controls</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl mb-1">🖱️</div>
                            <p className="text-xs font-medium text-white">Click & Drag</p>
                            <p className="text-xs">Pan the view</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl mb-1">🔲</div>
                            <p className="text-xs font-medium text-white">Scroll Wheel</p>
                            <p className="text-xs">Zoom in/out</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl mb-1">👆</div>
                            <p className="text-xs font-medium text-white">Click Node</p>
                            <p className="text-xs">Select & inspect</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl mb-1">⛶</div>
                            <p className="text-xs font-medium text-white">Fit to View</p>
                            <p className="text-xs">Reset viewport</p>
                        </div>
                    </div>
                </div>

                {/* Panels */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">📊 Side Panels</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="font-medium text-white mb-1">Left Panel - File Tree</p>
                            <p className="text-xs">Shows your project structure as a navigable tree. Click on any file to select it on the graph. Folders can be expanded or collapsed. The count shows total files detected.</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="font-medium text-white mb-1">Right Panel - Inspector</p>
                            <p className="text-xs">Displays detailed information about the selected file including: file path, extension, incoming dependencies (files that import this), outgoing dependencies (files this imports), and risk indicators. Use "Show Impact" to visualize dependencies.</p>
                        </div>
                    </div>
                </div>

                {/* Visual Elements */}
                <div>
                    <h3 className="text-white font-bold mb-3 text-base">🎯 Understanding Visual Elements</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                            <span className="text-xs"><strong className="text-yellow-300">Yellow nodes:</strong> JavaScript files (.js, .jsx, .mjs)</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                            <span className="text-xs"><strong className="text-blue-300">Blue nodes:</strong> TypeScript files (.ts, .tsx)</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                            <div className="w-4 h-4 rounded-full bg-green-500"></div>
                            <span className="text-xs"><strong className="text-green-300">Green nodes:</strong> Python files (.py)</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                            <span className="text-xs"><strong className="text-orange-300">Orange nodes:</strong> Java files (.java, .kt)</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                            <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                            <span className="text-xs"><strong className="text-cyan-300">Cyan nodes:</strong> Go files (.go)</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                            <div className="w-6 h-0.5 bg-indigo-400"></div>
                            <span className="text-xs"><strong className="text-indigo-300">Purple lines:</strong> Import/dependency connections between files</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                            <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]\"></div>
                            <span className="text-xs"><strong className="text-red-300">Red glow:</strong> File is part of a circular dependency (high risk)</span>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-2">💡 Tips for Effective Analysis</h3>
                    <ul className="space-y-1 text-xs">
                        <li>• Start with <strong>Graph view</strong> to get an overview, then switch to other modes for details</li>
                        <li>• Large, central nodes often indicate core modules - review them for potential refactoring</li>
                        <li>• Use <strong>Impact mode</strong> before making changes to understand the blast radius</li>
                        <li>• <strong>Cycles</strong> detection helps maintain clean architecture - aim for zero circular dependencies</li>
                        <li>• Click <strong>Fit to View</strong> if you get lost in the graph</li>
                        <li>• Use the <strong>File Tree</strong> to quickly navigate to specific files</li>
                    </ul>
                </div>

            </div>
        </div>
    </div>
);

// --- Main Component ---
const ArchitectureMap: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'processing' | 'simulating' | 'ready'>('idle');
    const [progressMsg, setProgressMsg] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('graph');
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    const [graphData, setGraphData] = useState<DependencyGraph | null>(null);
    const [nodes, setNodes] = useState<SimulationNode[]>([]);
    const tickCount = useRef(0);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    // ViewBox state for proper SVG viewport control
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
    const canvasRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
    const [clickedNode, setClickedNode] = useState<SimulationNode | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    const [depthLimit, setDepthLimit] = useState(5);
    const [showCyclesOnly, setShowCyclesOnly] = useState(false);
    const [impactMode, setImpactMode] = useState(false);
    const [heatmapMode, setHeatmapMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fileTree = useMemo(() => graphData ? buildFileTree(graphData.nodes) : null, [graphData]);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        workerRef.current = new GraphWorker();
        workerRef.current.onmessage = (e: MessageEvent) => {
            if (e.data.nodes) {
                tickCount.current++;
                setNodes(e.data.nodes);
                if (tickCount.current >= 80) {
                    workerRef.current?.postMessage({ type: 'STOP' });
                    setStatus('ready');
                    tickCount.current = 0;
                }
            }
        };
        return () => workerRef.current?.terminate();
    }, []);

    const handleFileUpload = useCallback(async (file: File) => {
        setStatus('processing');
        setProgressMsg('Scanning files...');
        tickCount.current = 0;
        try {
            const data = await processRepoZip(file);
            setGraphData(data);
            setStatus('simulating');
            setProgressMsg('Organizing layout...');
            const baseSize = Math.max(2500, Math.sqrt(data.nodes.length) * 200);
            setPan({ x: (canvasRef.current?.offsetWidth || 800) / 2, y: (canvasRef.current?.offsetHeight || 600) / 2 });
            workerRef.current?.postMessage({ type: 'INIT', nodes: data.nodes, edges: data.edges, width: baseSize, height: baseSize });
        } catch (err) {
            console.error(err);
            setStatus('idle');
            alert('Error parsing repository.');
        }
    }, []);

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

    const filteredNodes = useMemo(() => {
        let result = nodes;
        if (showCyclesOnly) result = result.filter(n => n.risk === 'high');
        if (searchTerm) result = result.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()) || n.path.toLowerCase().includes(searchTerm.toLowerCase()));
        return result;
    }, [nodes, showCyclesOnly, searchTerm]);

    const impactSet = useMemo(() => {
        if (!impactMode || !clickedNode || !graphData) return new Set<string>();
        const impacted = new Set<string>();
        const queue: { id: string; depth: number }[] = [{ id: clickedNode.id, depth: 0 }];
        while (queue.length) {
            const { id, depth } = queue.shift()!;
            if (depth >= depthLimit) continue;
            graphData.edges.filter(e => e.source === id).forEach(e => {
                if (!impacted.has(e.target)) { impacted.add(e.target); queue.push({ id: e.target, depth: depth + 1 }); }
            });
        }
        return impacted;
    }, [impactMode, clickedNode, graphData, depthLimit]);

    const getNodeColor = useCallback((node: SimulationNode) => {
        if (impactMode && clickedNode) {
            if (node.id === clickedNode.id) return '#fff';
            if (impactSet.has(node.id)) return '#f87171';
            return '#374151';
        }
        if (heatmapMode) return `hsl(${Math.max(0, 60 - node.centrality * 6)}, 80%, 50%)`;
        const colors: Record<string, string> = { JS: '#facc15', TS: '#3b82f6', PY: '#22c55e', JAVA: '#f97316', GO: '#06b6d4' };
        return colors[node.language] || '#9ca3af';
    }, [impactMode, clickedNode, impactSet, heatmapMode]);

    const getNodeOpacity = useCallback((node: SimulationNode) => {
        if (impactMode && clickedNode) return node.id === clickedNode.id || impactSet.has(node.id) ? 1 : 0.15;
        return 1;
    }, [impactMode, clickedNode, impactSet]);

    // AUTO-FIT: Calculate bounds and fit all nodes in viewport - FIXED VERSION
    const fitToView = useCallback(() => {
        if (filteredNodes.length === 0 || !canvasRef.current) {
            console.log('fitToView: No nodes or canvas');
            return;
        }

        const canvasWidth = canvasRef.current.offsetWidth || 800;
        const canvasHeight = canvasRef.current.offsetHeight || 600;

        console.log('fitToView called:', { nodeCount: filteredNodes.length, canvasWidth, canvasHeight, viewMode });

        // Calculate bounding box of all nodes
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        filteredNodes.forEach((node, index) => {
            let pos: { x: number; y: number };

            if (viewMode === 'graph') {
                pos = { x: node.x || 0, y: node.y || 0 };
            } else if (viewMode === 'blueprint') {
                const cols = Math.max(4, Math.ceil(Math.sqrt(filteredNodes.length)));
                const row = Math.floor(index / cols);
                const col = index % cols;
                pos = { x: col * 220 + 150, y: row * 120 + 100 };
            } else if (viewMode === 'unity') {
                const depth = node.path.split('/').length;
                let indexAtDepth = 0;
                for (let i = 0; i < index; i++) {
                    if (filteredNodes[i].path.split('/').length === depth) indexAtDepth++;
                }
                pos = { x: depth * 320 + 150, y: indexAtDepth * 80 + 60 };
            } else if (viewMode === 'erd') {
                const cols = Math.max(3, Math.ceil(Math.sqrt(filteredNodes.length) * 0.7));
                const row = Math.floor(index / cols);
                const col = index % cols;
                pos = { x: col * 300 + 180, y: row * 160 + 100 };
            } else {
                pos = { x: node.x || 0, y: node.y || 0 };
            }

            // Validate position
            if (isNaN(pos.x) || isNaN(pos.y)) {
                pos = { x: 0, y: 0 };
            }

            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        });

        // Add padding for node sizes
        const nodePadding = viewMode === 'erd' ? 150 : viewMode === 'blueprint' ? 100 : viewMode === 'unity' ? 120 : 60;
        minX -= nodePadding;
        maxX += nodePadding;
        minY -= nodePadding;
        maxY += nodePadding;

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        console.log('Content bounds:', { minX, maxX, minY, maxY, contentWidth, contentHeight });

        // Calculate zoom to fit all content
        const margin = 40;
        const availableWidth = canvasWidth - margin * 2;
        const availableHeight = canvasHeight - margin * 2;

        const scaleX = availableWidth / contentWidth;
        const scaleY = availableHeight / contentHeight;
        let newZoom = Math.min(scaleX, scaleY);

        // Clamp zoom between 0.1 and 2
        newZoom = Math.max(0.1, Math.min(newZoom, 2));

        // Calculate pan to center the content
        // The content's center point
        const contentCenterX = (minX + maxX) / 2;
        const contentCenterY = (minY + maxY) / 2;

        // The canvas center (where we want the content center to appear)
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;

        // Pan = canvas_center - (content_center * zoom)
        const newPanX = canvasCenterX - (contentCenterX * newZoom);
        const newPanY = canvasCenterY - (contentCenterY * newZoom);

        console.log('New transform:', { newZoom, newPanX, newPanY });

        // Instead of pan/zoom transforms, update the viewBox
        setViewBox({
            x: minX - 20,
            y: minY - 20,
            width: contentWidth + 40,
            height: contentHeight + 40
        });
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
    }, [filteredNodes, viewMode]);

    // Auto-fit when view mode changes or when graph becomes ready
    useEffect(() => {
        if (status === 'ready' && filteredNodes.length > 0) {
            // Delay to ensure canvas is measured correctly
            const timer = setTimeout(() => {
                console.log('Auto-fit triggered');
                fitToView();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [viewMode, status, filteredNodes.length, fitToView]);

    // Position calculators for different view modes - FIXED for proper layout matching DataRelationshipExplorer
    const getNodePosition = useCallback((node: SimulationNode, index: number) => {
        if (viewMode === 'graph') {
            // Match Force-directed or simple node position
            return { x: node.x, y: node.y };
        }

        const nodeCount = filteredNodes.length;

        if (viewMode === 'blueprint') {
            // Unreal Blueprint: Grid layout with proper spacing (Matched to DataRelationshipExplorer)
            const cols = Math.max(4, Math.ceil(Math.sqrt(nodeCount)));
            const row = Math.floor(index / cols);
            const col = index % cols;
            const spacing = 180;
            return {
                x: col * spacing + 100,
                y: row * spacing + 80
            };
        }

        if (viewMode === 'unity') {
            // Unity: Flow layout grouped by folder depth (Matched to DataRelationshipExplorer)
            const depth = node.path.split('/').length;
            // Count how many nodes are at this depth and before this node
            let indexAtDepth = 0;
            for (let i = 0; i < index; i++) {
                if (filteredNodes[i].path.split('/').length === depth) {
                    indexAtDepth++;
                }
            }
            return {
                x: depth * 250,
                y: indexAtDepth * 80 + 50
            };
        }

        if (viewMode === 'erd') {
            // ERD: Larger boxes in wider grid (Matched to DataRelationshipExplorer)
            const cols = Math.max(3, Math.ceil(Math.sqrt(nodeCount) * 0.7));
            const row = Math.floor(index / cols);
            const col = index % cols;
            const spacing = 240;
            return {
                x: col * spacing + 120,
                y: row * 140 + 80
            };
        }

        return { x: node.x, y: node.y };
    }, [viewMode, filteredNodes]);

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
            // Convert screen pixels to viewBox units
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

    const glassPanel = "bg-white/10 backdrop-blur-xl border border-white/20";


    // --- Node Renderer (Advanced Views) ---
    const renderNode = (node: SimulationNode, index: number) => {
        const isSelected = selectedNode?.id === node.id;
        const color = getNodeColor(node);
        const pos = getNodePosition(node, index);
        const opacity = getNodeOpacity(node);

        // Heatmap override
        const displayColor = heatmapMode
            ? `hsl(${Math.max(0, 60 - (node.inDegree + node.outDegree) * 2)}, 80%, 50%)`
            : color;

        if (viewMode === 'blueprint') {
            // Blueprint Style - Matched to DataRelationshipExplorer (150 width, no side pins)
            return (
                <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: 'pointer', opacity }}
                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node); if (impactMode) setClickedNode(node); }}
                    onMouseEnter={() => !clickedNode && setSelectedNode(node)}
                    onMouseLeave={() => !clickedNode && setSelectedNode(null)}
                >
                    <rect x="-75" y="-30" width="150" height="60" rx="4" fill="#1a1a2e" stroke={isSelected ? '#fff' : displayColor} strokeWidth={isSelected ? 3 : 2} />
                    <rect x="-75" y="-30" width="150" height="18" fill={displayColor} rx="4" />
                    <rect x="-75" y="-12" width="150" height="4" fill={displayColor} />
                    <text x="0" y="-15" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">{node.name.slice(0, 18)}</text>
                    <text x="-65" y="5" fill="#fff" fontSize="8">{node.extension}</text>
                    <text x="-65" y="18" fill="#888" fontSize="7">In:{node.inDegree} Out:{node.outDegree}</text>
                </g>
            );
        }

        if (viewMode === 'unity') {
            // Unity Style - Matched to DataRelationshipExplorer (Circles instead of triangles)
            return (
                <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: 'pointer', opacity }}
                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node); if (impactMode) setClickedNode(node); }}
                    onMouseEnter={() => !clickedNode && setSelectedNode(node)}
                    onMouseLeave={() => !clickedNode && setSelectedNode(null)}
                >
                    <rect x="-80" y="-25" width="160" height="50" rx="8" fill="rgba(15,23,42,0.9)" stroke={isSelected ? '#fff' : displayColor} strokeWidth={isSelected ? 3 : 2} />
                    <circle cx="-90" cy="0" r="6" fill={displayColor} />
                    <circle cx="90" cy="0" r="6" fill={displayColor} />
                    <text x="0" y="-5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">{node.name.slice(0, 16)}</text>
                    <text x="0" y="12" textAnchor="middle" fill="#888" fontSize="8">{node.extension} • {formatBytes(node.size)}</text>
                </g>
            );
        }

        if (viewMode === 'erd') {
            return (
                <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: 'pointer', opacity }}
                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node); if (impactMode) setClickedNode(node); }}
                    onMouseEnter={() => !clickedNode && setSelectedNode(node)}
                    onMouseLeave={() => !clickedNode && setSelectedNode(null)}
                >
                    <rect x="-100" y="-50" width="200" height="100" rx="4" fill="#1e1e1e" stroke={isSelected ? '#fff' : displayColor} strokeWidth={isSelected ? 3 : 2} />
                    <rect x="-100" y="-50" width="200" height="28" fill={displayColor} rx="4" />
                    <rect x="-100" y="-22" width="200" height="6" fill={displayColor} />
                    <text x="0" y="-30" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">{node.name.slice(0, 20)}</text>
                    <line x1="-100" y1="-22" x2="100" y2="-22" stroke="#444" />
                    <text x="-90" y="-5" fill="#888" fontSize="9">📁 {node.path.split('/').slice(0, -1).pop() || 'root'}</text>
                    <text x="-90" y="12" fill="#aaa" fontSize="9">↓ {node.inDegree} refs</text>
                    <text x="-90" y="28" fill="#aaa" fontSize="9">↑ {node.outDegree} links</text>
                    <text x="-90" y="44" fill="#666" fontSize="8">{formatBytes(node.size)}</text>
                </g>
            );
        }

        // Default Graph View
        const size = Math.max(12, Math.min(node.centrality * 3 + 14, 50));
        return (
            <g
                key={node.id}
                className="transition-all duration-300"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setSelectedNode(node); if (impactMode) setClickedNode(node); }}
                onMouseEnter={() => !clickedNode && setSelectedNode(node)}
                onMouseLeave={() => !clickedNode && setSelectedNode(null)}
            >
                <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size / 2}
                    fill={displayColor}
                    opacity={opacity}
                    stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={isSelected ? 3 : 2}
                    style={{ filter: node.risk === 'high' ? 'drop-shadow(0 0 10px #ef4444)' : undefined }}
                />
                <text
                    x={pos.x}
                    y={pos.y + size / 2 + 12}
                    textAnchor="middle"
                    fill="#ddd"
                    fontSize="9"
                    opacity={opacity}
                    pointerEvents="none"
                >
                    {node.name.length > 20 ? node.name.slice(0, 17) + '...' : node.name}
                </text>
            </g>
        );
    };

    return (
        <div
            ref={containerRef}
            data-fullscreen={isFullscreen}
            className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-[9998] h-screen w-screen bg-black/90 backdrop-blur-3xl' : 'h-[calc(100vh-140px)] bg-transparent'} rounded-2xl overflow-hidden shadow-2xl`}
            style={{ cursor: 'auto' }}
        >
            {/* Fullscreen cursor fix - explicit CSS override */}
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
                    [data-fullscreen="true"] [class*="cursor-pointer"] {
                        cursor: pointer !important;
                    }
                    [data-fullscreen="true"] input[type="text"] {
                        cursor: text !important;
                    }
                `}</style>
            )}
            {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

            {/* Top Bar */}
            <div className={`h-14 ${glassPanel} border-b border-white/20 flex items-center justify-between px-4 z-20 shrink-0`} style={{ cursor: 'auto' }}>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg">
                        <Upload className="w-3 h-3" />
                        {status === 'processing' ? 'Scanning...' : status === 'simulating' ? 'Layouting...' : 'Upload ZIP'}
                        <input type="file" accept=".zip" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} disabled={status === 'processing' || status === 'simulating'} />
                    </label>

                    {status === 'ready' && <ViewModeSelector mode={viewMode} onChange={setViewMode} />}
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setImpactMode(!impactMode)} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium cursor-pointer ${impactMode ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                        <Activity className="w-3 h-3" /> Impact
                    </button>
                    <button onClick={() => setHeatmapMode(!heatmapMode)} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium cursor-pointer ${heatmapMode ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                        <Layers className="w-3 h-3" /> Heat
                    </button>
                    <button onClick={() => setShowCyclesOnly(!showCyclesOnly)} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium cursor-pointer ${showCyclesOnly ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                        <AlertTriangle className="w-3 h-3" /> Cycles
                    </button>

                    <div className="relative ml-2">
                        <Search className="w-3 h-3 text-gray-500 absolute left-2 top-2" />
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 text-gray-300 text-xs rounded-lg pl-7 pr-2 py-1.5 focus:outline-none focus:border-primary-500/50 w-28 placeholder-gray-600" style={{ cursor: 'text' }} />
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
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
                    <button onClick={() => setShowGuide(true)} className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white cursor-pointer"><HelpCircle className="w-4 h-4" /></button>
                    <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white cursor-pointer">{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane (Collapsible) */}
                {showLeftSidebar && (
                    <div className={`w-56 ${glassPanel} border-r border-white/10 flex flex-col z-10 shrink-0`}>
                        <div className="p-2 border-b border-white/10 text-xs font-bold text-gray-400 uppercase flex justify-between items-center">
                            <span>Files ({filteredNodes.length})</span>
                            <button onClick={() => setShowLeftSidebar(false)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
                                <X className="w-3 h-3 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1">
                            {fileTree?.children?.map((child, i) => <FileTreeItem key={i} item={child} depth={0} onSelect={(id) => { const n = nodes.find(x => x.id === id); if (n) { setSelectedNode(n); setClickedNode(n); } }} selectedId={selectedNode?.id || null} />) || <div className="text-gray-600 text-xs italic p-4 text-center">No files</div>}
                        </div>
                    </div>
                )}

                {/* Canvas - CHANGED TO BLUE FOR VISIBILITY */}
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
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: `${40 * zoom}px ${40 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }} />

                    {status === 'idle' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center opacity-50">
                                <Box className="w-16 h-16 text-primary-500/50 mx-auto mb-4" />
                                <p className="text-gray-500">Upload a ZIP to visualize</p>
                            </div>
                        </div>
                    )}

                    {(status === 'processing' || status === 'simulating') && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-md" style={{ cursor: 'wait' }}>
                            <div className={`text-center p-6 rounded-2xl ${glassPanel}`}>
                                <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-2" />
                                <p className="text-primary-300 text-sm">{progressMsg}</p>
                            </div>
                        </div>
                    )}

                    {/* SVG Canvas - Using viewBox for proper viewport control */}
                    <svg
                        className="absolute top-0 left-0 w-full h-full"
                        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ cursor: 'inherit' }}
                    >
                        {/* Debug: Show bounds rectangle */}
                        {status === 'ready' && (
                            <rect
                                x={viewBox.x + 5}
                                y={viewBox.y + 5}
                                width={viewBox.width - 10}
                                height={viewBox.height - 10}
                                fill="none"
                                stroke="rgba(100, 150, 255, 0.2)"
                                strokeWidth="2"
                                strokeDasharray="10,5"
                            />
                        )}
                        <defs>
                            {/* Edge glow filter for better visibility */}
                            <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            {/* Arrow marker for edges */}
                            <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                                <polygon points="0,0 12,6 0,12 3,6" fill="#a5b4fc" />
                            </marker>
                            <marker id="arrowImpact" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                                <polygon points="0,0 12,6 0,12 3,6" fill="#f87171" />
                            </marker>
                        </defs>

                        {/* Edges - FIXED with proper connection points and Bezier curves */}
                        {status === 'ready' && graphData?.edges.map((e, i) => {
                            const sIdx = filteredNodes.findIndex(n => n.id === e.source);
                            const tIdx = filteredNodes.findIndex(n => n.id === e.target);
                            const s = filteredNodes[sIdx];
                            const t = filteredNodes[tIdx];
                            if (!s || !t) return null;
                            const sPos = getNodePosition(s, sIdx);
                            const tPos = getNodePosition(t, tIdx);

                            let opacity = 0.5;
                            let stroke = '#818cf8';
                            if (impactMode && clickedNode) {
                                if (s.id === clickedNode.id || impactSet.has(s.id)) { opacity = 0.9; stroke = '#f87171'; }
                                else opacity = 0.08;
                            }

                            // Calculate connection points based on view mode
                            if (viewMode === 'graph') {
                                const isImpact = impactMode && clickedNode && (s.id === clickedNode.id || impactSet.has(s.id));
                                return (
                                    <line
                                        key={i}
                                        x1={sPos.x}
                                        y1={sPos.y}
                                        x2={tPos.x}
                                        y2={tPos.y}
                                        stroke={stroke}
                                        strokeWidth={isImpact ? 3 : 2.5}
                                        opacity={opacity}
                                        filter={isImpact ? undefined : 'url(#edgeGlow)'}
                                        markerEnd={isImpact ? 'url(#arrowImpact)' : 'url(#arrow)'}
                                        style={{ transition: 'all 0.3s ease' }}
                                    />
                                );
                            }

                            // For structured views, use Bezier curves with edge connection points
                            let x1 = sPos.x, y1 = sPos.y, x2 = tPos.x, y2 = tPos.y;

                            if (viewMode === 'blueprint') {
                                x1 = sPos.x + 70;  // Right pin of source
                                x2 = tPos.x - 70;  // Left pin of target
                            } else if (viewMode === 'unity') {
                                x1 = sPos.x + 86;  // Right triangle of source
                                x2 = tPos.x - 86;  // Left triangle of target
                            } else if (viewMode === 'erd') {
                                x1 = sPos.x + 100; // Right edge of source box
                                x2 = tPos.x - 100; // Left edge of target box
                            }

                            // Bezier curve control points
                            const ctrlOffset = Math.max(40, Math.abs(x2 - x1) * 0.4);

                            const isImpactEdge = impactMode && clickedNode && (s.id === clickedNode.id || impactSet.has(s.id));

                            return (
                                <path
                                    key={i}
                                    d={`M${x1},${y1} C${x1 + ctrlOffset},${y1} ${x2 - ctrlOffset},${y2} ${x2},${y2}`}
                                    stroke={stroke}
                                    strokeWidth={isImpactEdge ? 3 : 2.5}
                                    opacity={opacity}
                                    fill="none"
                                    filter={isImpactEdge ? undefined : 'url(#edgeGlow)'}
                                    markerEnd={isImpactEdge ? 'url(#arrowImpact)' : 'url(#arrow)'}
                                    style={{ transition: 'all 0.3s ease' }}
                                />
                            );
                        })}

                        {/* Nodes */}
                        {status === 'ready' && filteredNodes.map((node, i) => renderNode(node, i))}
                    </svg>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-4 right-4 flex gap-2" style={{ cursor: 'auto' }}>
                        <button onClick={() => setZoom(z => z * 1.2)} className={`p-2 ${glassPanel} rounded-xl hover:bg-white/10 cursor-pointer`}><ZoomIn className="w-4 h-4 text-gray-300" /></button>
                        <button onClick={() => setZoom(z => z * 0.8)} className={`p-2 ${glassPanel} rounded-xl hover:bg-white/10 cursor-pointer`}><ZoomOut className="w-4 h-4 text-gray-300" /></button>
                        <button onClick={fitToView} className={`p-2 ${glassPanel} rounded-xl hover:bg-white/10 cursor-pointer`} title="Fit to view"><Move className="w-4 h-4 text-gray-300" /></button>
                    </div>

                    {status === 'ready' && <div className={`absolute top-4 left-4 ${glassPanel} rounded-xl px-3 py-2 text-xs text-gray-400`}><span className="text-white font-bold">{filteredNodes.length}</span> files • <span className="text-white font-bold">{graphData?.edges.length || 0}</span> deps</div>}
                </div>

                {/* Right Pane (Collapsible) */}
                {showRightSidebar && (
                    <div className={`w-64 ${glassPanel} border-l border-white/10 flex flex-col z-20 shrink-0`}>
                        <div className="p-2 border-b border-white/10 font-bold text-gray-400 text-xs uppercase flex justify-between items-center">
                            <span>Inspector</span>
                            <div className="flex items-center gap-1">
                                {selectedNode && (
                                    <button onClick={() => setSelectedNode(null)} className="hover:text-white cursor-pointer p-1" title="Clear selection">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                                <button onClick={() => setShowRightSidebar(false)} className="hover:text-white cursor-pointer p-1" title="Close Inspector">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {selectedNode ? (
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                <div>
                                    <h3 className="text-sm font-bold text-white break-all leading-tight">{selectedNode.name}</h3>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 text-[9px] font-mono">{selectedNode.extension}</span>
                                        {selectedNode.risk === 'high' && <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">CYCLE</span>}
                                    </div>
                                </div>
                                <div className={`${glassPanel} p-2 rounded-lg`}>
                                    <div className="text-[9px] text-gray-500 uppercase mb-0.5">Path</div>
                                    <code className="text-[9px] text-gray-300 break-all">{selectedNode.path}</code>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`${glassPanel} p-2 rounded-lg text-center`}>
                                        <div className="text-lg font-bold text-white">{selectedNode.inDegree}</div>
                                        <div className="text-[8px] text-gray-500 uppercase">In</div>
                                    </div>
                                    <div className={`${glassPanel} p-2 rounded-lg text-center`}>
                                        <div className="text-lg font-bold text-white">{selectedNode.outDegree}</div>
                                        <div className="text-[8px] text-gray-500 uppercase">Out</div>
                                    </div>
                                </div>
                                <button onClick={() => { setImpactMode(true); setClickedNode(selectedNode); }} className="w-full py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer">Show Impact</button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                                <Activity className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs text-gray-400">Click a node to inspect</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );


};

export default ArchitectureMap;
