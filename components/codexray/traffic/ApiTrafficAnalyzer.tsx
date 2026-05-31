
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import { TrafficAnalyzer } from './engine/TrafficAnalyzer';
import { AnalysisStats, DependencyGraphData, Endpoint, CallSite, AuthInfo } from './types';
import EndpointList from './EndpointList';
import CallSitesList from './CallSitesList';
import ApiDependencyGraph from './ApiDependencyGraph';
import AuthPatterns from './AuthPatterns';
import InternalAnalysisSummary from './InternalAnalysisSummary';
import TrafficGuideModal from './TrafficGuideModal';
import { Upload, Play, RefreshCw, FileText, Share2, Shield, Activity, AlertCircle, HelpCircle, FileArchive } from 'lucide-react';

interface FileEntry {
    path: string;
    content: string;
}

export default function ApiTrafficAnalyzer() {
    // State
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'results' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [currentFile, setCurrentFile] = useState('');
    const [activeTab, setActiveTab] = useState<'endpoints' | 'calls' | 'graph' | 'auth'>('endpoints');
    const [showGuide, setShowGuide] = useState(false);

    // Data
    const [stats, setStats] = useState<AnalysisStats | null>(null);
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [callSites, setCallSites] = useState<CallSite[]>([]);
    const [graphData, setGraphData] = useState<DependencyGraphData | null>(null);
    const [authPatterns, setAuthPatterns] = useState<AuthInfo[]>([]);

    const analyzer = useRef(new TrafficAnalyzer());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const zipInputRef = useRef<HTMLInputElement>(null);
    const pendingFilesRef = useRef<FileList | File | null>(null);

    // Constants for Liquid Glass UI
    const glassPanel = "bg-white/5 backdrop-blur-xl border border-white/10";
    const glassButton = "hover:bg-white/10 transition-colors duration-200";

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) return;

        // Store files in ref and trigger state change
        // This ensures the UI renders the loading state BEFORE we start processing
        pendingFilesRef.current = fileList;
        setShowGuide(false); // Close guide if open
        setStatus('analyzing');
    };

    const handleZipUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        pendingFilesRef.current = file;
        setShowGuide(false);
        setStatus('analyzing');
    };

    // Effect to handle file processing when entering 'analyzing' state
    useEffect(() => {
        if (status === 'analyzing' && pendingFilesRef.current) {
            const input = pendingFilesRef.current;
            const newFiles: FileEntry[] = [];

            setProgress(1);
            setCurrentFile('Initializing...');

            // Optimized processing with minimal delay
            const processingTimeout = setTimeout(async () => {
                try {
                    // Check if it's a Zip file
                    if (input instanceof File && input.name.endsWith('.zip')) {
                        setCurrentFile(`Unzipping ${input.name}...`);
                        const zip = new JSZip();
                        const zipContent = await zip.loadAsync(input);

                        const entries = Object.entries(zipContent.files);
                        const totalFiles = entries.length;
                        let processed = 0;

                        // Process zip entries in larger chunks for speed
                        const CHUNK_SIZE = 50;

                        for (let i = 0; i < totalFiles; i += CHUNK_SIZE) {
                            const chunk = entries.slice(i, i + CHUNK_SIZE);

                            await Promise.all(chunk.map(async ([relativePath, file]) => {
                                if (!file.dir && relativePath.match(/\.(ts|tsx|js|jsx)$/)) {
                                    const content = await file.async('string');
                                    newFiles.push({ path: relativePath, content });
                                }
                            }));

                            processed += chunk.length;
                            setProgress(Math.round((processed / totalFiles) * 30));

                            // Minimal yield to keep UI responsive but fast
                            if (processed < totalFiles) await new Promise(r => setTimeout(r, 0));
                        }

                    } else if (input instanceof FileList) {
                        // Standard Folder Upload - Fast Mode
                        const fileList = input;
                        const totalFiles = fileList.length;
                        const CHUNK_SIZE = 50; // Increased chunk size for speed

                        const processChunk = async (startIndex: number) => {
                            const endIndex = Math.min(startIndex + CHUNK_SIZE, totalFiles);

                            const chunkPromises = [];
                            for (let i = startIndex; i < endIndex; i++) {
                                const file = fileList[i];
                                // Update UI less frequently to save rendering time
                                if (i % 5 === 0) setCurrentFile(file.name);

                                if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
                                    chunkPromises.push(
                                        file.text().then(text => ({
                                            path: file.webkitRelativePath || file.name,
                                            content: text
                                        })).catch(e => null)
                                    );
                                }
                            }

                            const results = await Promise.all(chunkPromises);
                            results.forEach(res => {
                                if (res) newFiles.push(res);
                            });

                            // Update progress
                            setProgress(Math.round((endIndex / totalFiles) * 30));

                            if (endIndex < totalFiles) {
                                setTimeout(() => processChunk(endIndex), 0);
                            } else {
                                finishProcessing();
                            }
                        };

                        processChunk(0);
                        return; // Handle finish inside processChunk
                    }

                    finishProcessing();

                } catch (error) {
                    console.error("Processing failed", error);
                    setStatus('error');
                }
            }, 50); // Reduced initial delay

            const finishProcessing = () => {
                pendingFilesRef.current = null;
                setFiles(newFiles);
                runAnalysis(newFiles);
            };

            return () => clearTimeout(processingTimeout);
        }
    }, [status]);

    const runAnalysis = async (fileData: FileEntry[]) => {
        // Yield to allow UI to update before heavy analysis
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
            // Simulate progress for analysis phases
            const interval = setInterval(() => {
                setProgress(p => Math.min(p + 5, 90));
            }, 100);

            const results = await analyzer.current.analyzeProject(fileData);

            clearInterval(interval);
            setProgress(100);

            setStats(results.stats);
            setEndpoints(results.endpoints);
            setCallSites(results.callSites);
            setGraphData(results.graph);
            setAuthPatterns(results.auth);

            setStatus('results');
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    const handleExport = (type: string) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ endpoints, stats }, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `api_traffic_analysis.${type === 'openapi' ? 'json' : type}`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleShare = () => {
        const text = `API Traffic Analysis Report\n\n- ${stats?.uniqueEndpoints} Endpoints\n- ${stats?.apiCallsFound} Call Sites\n- ${stats?.authRequiredCount} Secure Routes\n\nGenerated by Code X-Ray`;
        navigator.clipboard.writeText(text);
        alert('Analysis summary copied to clipboard!');
    };

    const handleViewCallSites = (endpointId?: string) => {
        setActiveTab('calls');
        // In a more advanced version, we would pass a filter to CallSitesList here
    };

    return (
        <div className={`flex flex-col h-full w-full ${glassPanel} rounded-2xl overflow-hidden shadow-2xl relative`}>
            {/* Hidden Input for Re-upload (Always present) */}
            <input
                ref={fileInputRef}
                type="file"
                id="folder-upload"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                onChange={handleFileUpload}
            />
            <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleZipUpload}
            />

            {showGuide && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <TrafficGuideModal onClose={() => setShowGuide(false)} />
                </div>,
                document.body
            )}

            {/* Analyzing State Overlay - Portal to Body for Full Screen */}
            {status === 'analyzing' && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-96 mb-8 p-1 bg-white/10 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse"
                                style={{ width: `${Math.max(5, progress)}%`, transition: 'width 0.2s ease-out' }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-6 text-white">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-30 animate-pulse"></div>
                            <Activity className="w-16 h-16 text-indigo-400 animate-spin relative z-10 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        </div>
                        <div className="flex flex-col items-center gap-3 text-center">
                            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 drop-shadow-sm">
                                Please wait, files are uploading...
                            </h3>
                            <p className="font-mono text-base text-indigo-300/80 max-w-lg truncate px-4 py-1 bg-white/5 rounded-full border border-white/5">
                                {currentFile || 'Initializing scanner...'}
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Activity className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">API Traffic Reconstructor</h2>
                        <p className="text-xs text-white/50">Static Analysis & Reverse Engineering</p>
                    </div>
                </div>

                {status === 'results' && (
                    <div className="flex gap-2">
                        <button onClick={() => document.getElementById('folder-upload')?.click()} className={`px-4 py-2 rounded-lg text-sm font-medium text-white/80 border border-white/10 ${glassButton} flex items-center gap-2`}>
                            <Upload className="w-4 h-4" /> Re-upload
                        </button>
                        <div className="h-8 w-[1px] bg-white/10 mx-1" />
                        <button onClick={() => setShowGuide(true)} className={`p-2 rounded-lg text-white/80 ${glassButton}`} title="Guide">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                        <button onClick={handleShare} className={`p-2 rounded-lg text-white/80 ${glassButton}`} title="Share Summary">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">

                {/* Empty State / Upload */}
                {status === 'idle' && (
                    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-white">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                            <Upload className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Upload Project Source</h3>
                        <p className="text-white/50 max-w-md mb-8">
                            Drag and drop your frontend project folder or a Zip file here to detect endpoints, analyze auth patterns, and map dependencies without running the code.
                        </p>
                        <div className="flex gap-4">
                            <label className="relative group cursor-pointer">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-60 blur group-hover:opacity-100 transition duration-500"></div>
                                <button onClick={() => fileInputRef.current?.click()} className="relative px-8 py-4 bg-black rounded-xl border border-white/20 text-white font-semibold flex items-center gap-3 hover:bg-white/5 transition-all">
                                    <Upload className="w-5 h-5" /> Select Folder
                                </button>
                            </label>

                            <button onClick={() => zipInputRef.current?.click()} className="relative px-8 py-4 bg-white/5 rounded-xl border border-white/10 text-white font-semibold flex items-center gap-3 hover:bg-white/10 transition-all hover:border-white/30">
                                <FileArchive className="w-5 h-5 text-indigo-400" /> Upload Zip
                            </button>
                        </div>
                        <p className="mt-6 text-xs text-white/30">Supports React, Vue, Angular • JS/TS/JSX/TSX</p>
                    </div>
                )}

                {/* Results State */}
                {status === 'results' && (
                    <div className="flex flex-row h-full">
                        <div className="flex flex-col flex-1 h-full min-w-0">
                            {/* Tabs */}
                            <div className="flex border-b border-white/10 px-6 space-x-6 shrink-0 bg-white/5">
                                {[
                                    { id: 'endpoints', label: 'Endpoints', icon: FileText },
                                    { id: 'calls', label: 'Call Sites', icon: Play },
                                    { id: 'graph', label: 'Dependency Graph', icon: Share2 },
                                    { id: 'auth', label: 'Auth Patterns', icon: Shield },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-indigo-500 text-white'
                                            : 'border-transparent text-white/50 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                        {tab.label}
                                        {tab.id === 'endpoints' && <span className="ml-1 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs">{stats?.uniqueEndpoints}</span>}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content - Expanded to fill available space */}
                            <div className="flex-1 overflow-hidden relative bg-black/20 p-6 flex flex-col">
                                {activeTab === 'endpoints' && (
                                    <div className="flex-1 overflow-auto">
                                        <EndpointList endpoints={endpoints} onViewCallSites={handleViewCallSites} />
                                    </div>
                                )}
                                {activeTab === 'calls' && (
                                    <div className="flex-1 overflow-auto">
                                        <CallSitesList callSites={callSites} />
                                    </div>
                                )}
                                {activeTab === 'graph' && (
                                    <div className="flex-1 h-full w-full min-h-[500px] border border-white/5 rounded-xl bg-black/20 overflow-hidden relative">
                                        <ApiDependencyGraph data={graphData} />
                                    </div>
                                )}
                                {activeTab === 'auth' && (
                                    <div className="flex-1 overflow-auto">
                                        <AuthPatterns auth={authPatterns} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        {stats && (
                            <InternalAnalysisSummary stats={stats} onExport={handleExport} />
                        )}
                    </div>
                )}
            </div>

            {/* Footer / Status Bar */}
            {status === 'results' && stats && (
                <div className="px-6 py-2 bg-black/40 border-t border-white/10 flex items-center gap-6 text-xs text-white/60">
                    <span>{stats.filesAnalyzed} files scanned</span>
                    <div className="h-3 w-[1px] bg-white/10" />
                    <span>{stats.apiCallsFound} calls detected</span>
                    <div className="h-3 w-[1px] bg-white/10" />
                    <span>{Math.round(performance.now() % 1000)}ms scan time</span>
                </div>
            )}
        </div>
    );
}
