import React, { useState, lazy, Suspense, useRef, useEffect, useMemo } from 'react';
import {
    Activity, Layers, Shield,
    Search, ArrowLeft, FolderSearch, Code2, Trash2, Blocks, FileText
} from 'lucide-react';
import { Button, Badge } from '../components/CommonUI';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- Parallax Code X-Ray Grid ---
const ParallaxCodeXRayGrid = ({ tools, onSelect }: { tools: Tool[], onSelect: (id: string | null) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            if (window.innerWidth >= 1024) setColumns(3);
            else if (window.innerWidth >= 768) setColumns(2);
            else setColumns(1);
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Parallax transforms (3 cols)
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
    const y2 = useTransform(scrollYProgress, [0, 1], [-100, 50]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -100]);

    // Parallax transforms (2 cols)
    const y2_1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const y2_2 = useTransform(scrollYProgress, [0, 1], [-50, 0]);

    const distributedTools = useMemo(() => {
        const cols: Tool[][] = Array.from({ length: columns }, () => []);
        tools.forEach((t, i) => {
            cols[i % columns].push(t);
        });
        return cols;
    }, [tools, columns]);

    const ToolCard = ({ tool }: { tool: Tool }) => {
        const isLaunchable = tool.id !== 'coming-soon';
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div
                    onClick={() => isLaunchable && onSelect(tool.id)}
                    className={`group relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.06] hover:border-white/20 cursor-pointer ${!isLaunchable && 'opacity-60 cursor-not-allowed'}`}
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl transition-colors shadow-lg ${isLaunchable ? 'bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/30 group-hover:text-white' : 'bg-gray-800 text-gray-500'}`}>
                                {tool.icon}
                            </div>
                            {tool.beta && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded border border-indigo-500/30">Beta</span>}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors font-heading tracking-wide">
                            {tool.name}
                        </h3>

                        <p className="text-sm text-gray-400 leading-relaxed mb-6 h-12 overflow-hidden font-light">
                            {tool.desc}
                        </p>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">{tool.category}</span>
                            {isLaunchable && (
                                <span className="text-indigo-400 text-sm font-medium group-hover:translate-x-1 transition-transform font-signature text-lg">
                                    Launch →
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div ref={containerRef} className={`grid gap-8 ${columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {distributedTools.map((colTools, colIndex) => {
                let style = {};
                let className = "flex flex-col gap-8";

                if (columns === 3) {
                    if (colIndex === 0) style = { y: y1 };
                    if (colIndex === 1) { style = { y: y2 }; className += " pt-24"; }
                    if (colIndex === 2) { style = { y: y3 }; className += " pt-12"; }
                } else if (columns === 2) {
                    if (colIndex === 0) style = { y: y2_1 };
                    if (colIndex === 1) { style = { y: y2_2 }; className += " pt-12"; }
                }

                return (
                    <motion.div key={colIndex} style={style} className={className}>
                        {colTools.map(t => <ToolCard key={t.id} tool={t} />)}
                    </motion.div>
                );
            })}
        </div>
    );
};

// Lazy load heavy components to prevent module-level crashes
const ArchitectureMap = lazy(() => import('../components/codexray/ArchitectureMap'));
const DataRelationshipExplorer = lazy(() => import('../components/codexray/DataRelationshipExplorer'));
const CodeUsageFinder = lazy(() => import('../components/codexray/CodeUsageFinder').then(m => ({ default: m.CodeUsageFinder })));
const ApiTrafficAnalyzer = lazy(() => import('../components/codexray/traffic/ApiTrafficAnalyzer'));
const DeadCodeDetector = lazy(() => import('../components/codexray/deadcode/DeadCodeDetector'));
const ComponentExtractionEngine = lazy(() => import('../components/codexray/componentextractor/ComponentExtractionEngine'));
const LogAnalyzer = lazy(() => import('../components/codexray/loganalyzer/LogAnalyzer'));
const SystemDesignVisualizer = lazy(() => import('../components/codexray/systemdesign/SystemDesignVisualizer'));

// Error Boundary Component
interface ErrorBoundaryProps {
    children: React.ReactNode;
}
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-red-400 bg-red-900/20 rounded-xl m-4">
                    <h2 className="text-2xl font-bold mb-4">⚠️ Component Error</h2>
                    <pre className="whitespace-pre-wrap text-sm">{this.state.error?.message}</pre>
                    <pre className="whitespace-pre-wrap text-xs text-gray-500 mt-4">{this.state.error?.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// Loading Fallback
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
);

// Tool Definition
type Tool = {
    id: string;
    name: string;
    icon: React.ReactNode;
    desc: string;
    category: 'Analysis' | 'Visualization' | 'Utility';
    beta?: boolean;
};

const TOOLS: Tool[] = [
    { id: 'arch-map', name: 'Interactive Architecture Map', icon: <Layers className="w-6 h-6" />, desc: 'Offline dependency graph visualization.', category: 'Visualization', beta: true },
    { id: 'data-explorer', name: 'Data Relationship Explorer', icon: <FolderSearch className="w-6 h-6" />, desc: 'Reveal hidden relationships in any folder.', category: 'Analysis', beta: true },
    { id: 'code-finder', name: 'Code Usage Finder', icon: <Code2 className="w-6 h-6" />, desc: 'Instant "Where is this used?" search.', category: 'Analysis', beta: true },
    { id: 'traffic-analyzer', name: 'API Traffic Reconstructor', icon: <Activity className="w-6 h-6" />, desc: 'Static traffic analysis.', category: 'Analysis', beta: true },
    { id: 'dead-code', name: 'Dead Code Detector', icon: <Trash2 className="w-6 h-6" />, desc: 'Find unreachable code.', category: 'Analysis', beta: true },
    { id: 'component-extractor', name: 'Component Extraction Engine', icon: <Blocks className="w-6 h-6" />, desc: 'Analyze HTML/CSS to detect reusable components.', category: 'Analysis', beta: true },
    { id: 'log-analyzer', name: 'Client-Side Log Analyzer', icon: <FileText className="w-6 h-6" />, desc: 'Transform raw logs into structured insights.', category: 'Analysis', beta: true },
    { id: 'system-design', name: 'System Design Visualizer', icon: <Blocks className="w-6 h-6" />, desc: 'Drag & drop architecture diagrams.', category: 'Analysis', beta: true },
    { id: 'coming-soon', name: 'Coming Soon: Security Scan', icon: <Shield className="w-6 h-6" />, desc: 'Client-side pattern matching.', category: 'Utility' }
];

const CodeXRay: React.FC = () => {
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTools = TOOLS.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render Active Tool with Lazy Loading and Error Boundary
    const renderActiveTool = () => {
        const toolComponents: Record<string, React.ReactNode> = {
            'arch-map': <ArchitectureMap />,
            'data-explorer': <DataRelationshipExplorer />,
            'code-finder': <CodeUsageFinder />,
            'traffic-analyzer': <ApiTrafficAnalyzer />,
            'dead-code': <DeadCodeDetector />,
            'component-extractor': <ComponentExtractionEngine />,
            'log-analyzer': <LogAnalyzer />,
            'system-design': <SystemDesignVisualizer />
        };

        if (activeTool && toolComponents[activeTool]) {
            return (
                <div className="container mx-auto px-4 py-6 min-h-screen flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Tools
                        </Button>
                        <h1 className="text-xl font-bold text-white">{TOOLS.find(t => t.id === activeTool)?.name}</h1>
                        <Badge color="purple">Offline Mode</Badge>
                    </div>
                    <div className="flex-1 min-h-[600px]">
                        <ErrorBoundary>
                            <Suspense fallback={<LoadingFallback />}>
                                {toolComponents[activeTool]}
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                </div>
            );
        }
        return null;
    };

    // If a tool is active, render it
    if (activeTool) {
        return renderActiveTool();
    }

    // Hub View
    return (
        <div className="container mx-auto px-4 py-12 min-h-screen">
            <div className="mb-12 text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-full mb-4 ring-1 ring-indigo-500/30 animate-pulse">
                    <Activity className="w-12 h-12 text-indigo-400" />
                </div>
                <h1 className="text-5xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Code <span className="font-signature text-6xl">X-Ray</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    <span className="font-signature text-2xl text-indigo-300">Client-side</span> architectural intelligence. No servers, no data leaks.
                </p>
            </div>

            <div className="max-w-xl mx-auto mb-12 relative">
                <Search className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                />
            </div>

            <div className="max-w-6xl mx-auto">
                <ParallaxCodeXRayGrid tools={filteredTools} onSelect={setActiveTool} />
            </div>
        </div>
    );
};

export default CodeXRay;
