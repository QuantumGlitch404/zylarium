// Dead Code & Unused Asset Detector - Main Component with Liquid Glass UI
import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
    Upload, Play, FolderOpen, Settings, Download, AlertTriangle,
    FileX2, Trash2, CheckCircle, XCircle, Loader2, RefreshCw,
    ChevronRight, FileCode, Image, FileType, Folder, BarChart3,
    Sparkles, HelpCircle, X, BookOpen
} from 'lucide-react';
import {
    AnalysisResult,
    AnalysisProgress,
    EntryPoint,
    DeadCodeSettings,
    DEFAULT_SETTINGS,
    AnalysisMode
} from './types';
import { runAnalysis, FileEntry } from './engine/ReachabilityEngine';
import SummaryTab from './tabs/SummaryTab';
import ByTypeTab from './tabs/ByTypeTab';
import ByFolderTab from './tabs/ByFolderTab';
import ImpactTab from './tabs/ImpactTab';
import CleanupTab from './tabs/CleanupTab';

type AppState = 'idle' | 'configuring' | 'analyzing' | 'results' | 'error';
type TabId = 'summary' | 'by-type' | 'by-folder' | 'impact' | 'cleanup';

interface TabInfo {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabInfo[] = [
    { id: 'summary', label: 'Summary', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'by-type', label: 'By Type', icon: <FileType className="w-4 h-4" /> },
    { id: 'by-folder', label: 'By Folder', icon: <Folder className="w-4 h-4" /> },
    { id: 'impact', label: 'Impact', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'cleanup', label: 'Cleanup', icon: <Trash2 className="w-4 h-4" /> },
];

// Liquid Glass Panel Component
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

// Guide Panel Component
const GuidePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-xl">
                        <BookOpen className="w-6 h-6 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Dead Code Detector Guide</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6 text-gray-300">
                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">What This Tool Does</h3>
                    <p className="leading-relaxed">
                        The Dead Code & Unused Asset Detector analyzes your project to find files that are never imported or referenced.
                        It builds a complete import graph starting from entry points, then identifies which files remain unreachable.
                        This helps you clean up your codebase and reduce bundle size.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">How To Use</h3>
                    <ol className="space-y-3 list-decimal list-inside">
                        <li><strong>Upload Project:</strong> Select a ZIP file or folder containing your source code. The tool ignores node_modules and build folders automatically.</li>
                        <li><strong>Configure Entry Points:</strong> Review the auto-detected entry points (index.html, main.js, etc.). Enable or disable as needed.</li>
                        <li><strong>Choose Analysis Mode:</strong> Conservative mode has fewer false positives. Aggressive mode finds more dead code but may flag files used dynamically.</li>
                        <li><strong>Run Analysis:</strong> Click the button and wait for the scan to complete.</li>
                        <li><strong>Review Results:</strong> Browse the tabs to see unreachable files, organized by type, folder, or impact.</li>
                        <li><strong>Export Cleanup:</strong> Select files and export a cleanup manifest, Git patch, or shell script.</li>
                    </ol>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Understanding Safe Scores</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <span className="font-bold text-green-400">90-100:</span>
                            <span>Safe to delete. No risky patterns detected.</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <span className="font-bold text-yellow-400">60-89:</span>
                            <span>Review recommended. Some patterns suggest possible usage.</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <span className="font-bold text-red-400">0-59:</span>
                            <span>Manual review needed. Dynamic imports or config references detected.</span>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Tab Explanations</h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium text-white">Summary Tab</h4>
                            <p className="text-sm mt-1">Overview of analysis results. Shows total files, reachable vs unreachable counts, potential savings, and breakdown by file type.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium text-white">By Type Tab</h4>
                            <p className="text-sm mt-1">Unreachable files grouped by type (JavaScript, CSS, Images, etc.). Each file shows its safe score and reasons.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium text-white">By Folder Tab</h4>
                            <p className="text-sm mt-1">Expandable folder tree view. Highlights entire folders that are completely unused.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium text-white">Impact Tab</h4>
                            <p className="text-sm mt-1">Size impact analysis. Shows before/after comparison, estimated bundle savings, and top 10 largest unused files.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium text-white">Cleanup Tab</h4>
                            <p className="text-sm mt-1">Select files and export cleanup manifests. Supports JSON, Git patch, shell script, and clipboard copy.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-red-400">1-5</kbd> Switch tabs</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-red-400">R</kbd> Re-run analysis</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-red-400">Esc</kbd> Close panels</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-red-400">?</kbd> Open this guide</div>
                    </div>
                </section>

                <section className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <h3 className="text-lg font-semibold text-yellow-300 mb-2">Important Notes</h3>
                    <ul className="space-y-1 text-sm text-yellow-200">
                        <li>• This tool performs static analysis only - it cannot detect runtime-determined imports.</li>
                        <li>• Files referenced in build configs or via CDN may be flagged incorrectly.</li>
                        <li>• Always review before deleting files, especially those with low safe scores.</li>
                        <li>• No files are deleted automatically - you must execute the exported script manually.</li>
                    </ul>
                </section>
            </div>
        </div>
    </div>
);

// Settings Panel Component
const SettingsPanel: React.FC<{
    settings: DeadCodeSettings;
    onUpdate: (settings: DeadCodeSettings) => void;
    onClose: () => void;
}> = ({ settings, onUpdate, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 max-w-lg w-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Settings className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Analysis Settings</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="p-5 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Analysis Mode</label>
                    <div className="space-y-2">
                        <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer border border-white/10">
                            <input type="radio" checked={settings.analysisMode === 'conservative'} onChange={() => onUpdate({ ...settings, analysisMode: 'conservative' })} className="mt-1" />
                            <div>
                                <span className="text-white font-medium">Conservative</span>
                                <p className="text-xs text-gray-400 mt-1">Fewer false positives. Treats dynamic imports and test files as reachable.</p>
                            </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer border border-white/10">
                            <input type="radio" checked={settings.analysisMode === 'aggressive'} onChange={() => onUpdate({ ...settings, analysisMode: 'aggressive' })} className="mt-1" />
                            <div>
                                <span className="text-white font-medium">Aggressive</span>
                                <p className="text-xs text-gray-400 mt-1">Finds more dead code. Higher chance of flagging dynamically-used files.</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Entry Point Detection</label>
                    <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer">
                        <input type="checkbox" checked={settings.autoDetectHTML} onChange={(e) => onUpdate({ ...settings, autoDetectHTML: e.target.checked })} />
                        <span className="text-gray-300 text-sm">Auto-detect HTML entry points</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer">
                        <input type="checkbox" checked={settings.autoDetectPackageMain} onChange={(e) => onUpdate({ ...settings, autoDetectPackageMain: e.target.checked })} />
                        <span className="text-gray-300 text-sm">Auto-detect package.json main/module</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer">
                        <input type="checkbox" checked={settings.treatTestsAsEntries} onChange={(e) => onUpdate({ ...settings, treatTestsAsEntries: e.target.checked })} />
                        <span className="text-gray-300 text-sm">Treat test files as entry points</span>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">High Confidence Threshold</label>
                    <input type="range" min="80" max="100" value={settings.highConfidenceMin} onChange={(e) => onUpdate({ ...settings, highConfidenceMin: parseInt(e.target.value) })} className="w-full" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>80</span>
                        <span className="text-green-400">{settings.highConfidenceMin}</span>
                        <span>100</span>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors">
                    Done
                </button>
            </div>
        </div>
    </div>
);

export default function DeadCodeDetector() {
    const [appState, setAppState] = useState<AppState>('idle');
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [projectName, setProjectName] = useState('');
    const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);
    const [settings, setSettings] = useState<DeadCodeSettings>(DEFAULT_SETTINGS);
    const [progress, setProgress] = useState<AnalysisProgress | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('summary');
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [showSettings, setShowSettings] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    const zipInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setAppState('analyzing');
            setProgress({ phase: 'scanning', phaseDescription: 'Extracting ZIP file...', currentFile: file.name, filesProcessed: 0, totalFiles: 0, referencesFound: 0, unreachableSoFar: 0, percentage: 0 });
            const zip = await JSZip.loadAsync(file);
            const fileEntries: FileEntry[] = [];
            const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir);
            const relevantFiles = fileNames.filter(name => !name.includes('node_modules/') && !name.includes('.git/') && !name.includes('dist/') && !name.includes('build/') && !name.includes('.next/') && !name.startsWith('__MACOSX/'));
            for (const name of relevantFiles) {
                try {
                    const content = await zip.files[name].async('string');
                    let normalizedPath = name;
                    const firstSlash = name.indexOf('/');
                    if (firstSlash > 0 && !name.startsWith('src/')) normalizedPath = name.substring(firstSlash + 1);
                    fileEntries.push({ path: normalizedPath, content, size: content.length });
                } catch { fileEntries.push({ path: name, content: '', size: 0 }); }
            }
            setFiles(fileEntries);
            setProjectName(file.name.replace('.zip', ''));
            setAppState('configuring');
            import('./engine/ReachabilityEngine').then(({ detectEntryPoints }) => setEntryPoints(detectEntryPoints(fileEntries, settings)));
        } catch (e) {
            setError(`Failed to process ZIP: ${e instanceof Error ? e.message : 'Unknown error'}`);
            setAppState('error');
        }
        if (event.target) event.target.value = '';
    };

    const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) return;
        try {
            setAppState('analyzing');
            const fileEntries: FileEntry[] = [];
            let projectRoot = '';
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                const path = (file as any).webkitRelativePath || file.name;
                if (!projectRoot && path.includes('/')) projectRoot = path.split('/')[0];
                if (path.includes('node_modules/') || path.includes('.git/')) continue;
                try {
                    const content = await file.text();
                    let normalizedPath = path;
                    if (projectRoot && path.startsWith(projectRoot + '/')) normalizedPath = path.substring(projectRoot.length + 1);
                    fileEntries.push({ path: normalizedPath, content, size: file.size });
                } catch { fileEntries.push({ path, content: '', size: file.size }); }
            }
            setFiles(fileEntries);
            setProjectName(projectRoot || 'Project');
            setAppState('configuring');
            import('./engine/ReachabilityEngine').then(({ detectEntryPoints }) => setEntryPoints(detectEntryPoints(fileEntries, settings)));
        } catch (e) {
            setError(`Failed to read folder: ${e instanceof Error ? e.message : 'Unknown error'}`);
            setAppState('error');
        }
        if (event.target) event.target.value = '';
    };

    const startAnalysis = async () => {
        if (files.length === 0) return;
        setAppState('analyzing');
        setError(null);
        try {
            const analysisResult = await runAnalysis(files, settings, (prog) => setProgress(prog));
            setEntryPoints(analysisResult.entryPoints);
            setResult(analysisResult);
            setActiveTab('summary');
            setAppState('results');
        } catch (e) {
            setError(`Analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
            setAppState('error');
        }
    };

    const resetAnalysis = () => {
        setAppState('idle');
        setFiles([]);
        setProjectName('');
        setEntryPoints([]);
        setResult(null);
        setError(null);
        setProgress(null);
        setSelectedFiles(new Set());
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setShowSettings(false); setShowGuide(false); }
            if (e.key === '?' && !showGuide) setShowGuide(true);
            if (appState !== 'results') return;
            if (e.key >= '1' && e.key <= '5') setActiveTab(TABS[parseInt(e.key) - 1].id);
            if (e.key === 'r' && !e.ctrlKey) startAnalysis();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [appState, showGuide]);

    const renderIdleState = () => (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-red-500/20 backdrop-blur-md rounded-full ring-1 ring-red-500/30">
                        <FileX2 className="w-12 h-12 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Dead Code & Unused Asset Detector</h2>
                    <p className="text-gray-400 max-w-md mx-auto">Find unreachable code and unreferenced assets without running the build pipeline.</p>
                    <button onClick={() => setShowGuide(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors">
                        <HelpCircle className="w-4 h-4" /> View Guide
                    </button>
                </div>
                <GlassPanel className="p-12 text-center cursor-pointer group hover:border-red-500/50 transition-colors" onClick={() => zipInputRef.current?.click()}>
                    <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4 group-hover:text-red-400 transition-colors" />
                    <p className="text-xl text-gray-400 mb-2">Drop project folder or ZIP here</p>
                    <p className="text-sm text-gray-600">or click to select</p>
                    <div className="flex gap-4 justify-center mt-6">
                        <button onClick={(e) => { e.stopPropagation(); zipInputRef.current?.click(); }} className="px-6 py-3 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl text-red-300 hover:bg-red-500/30 transition-all flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" /> Select ZIP
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }} className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-gray-300 hover:bg-white/20 transition-all flex items-center gap-2">
                            <Folder className="w-4 h-4" /> Select Folder
                        </button>
                    </div>
                </GlassPanel>
                <div className="grid grid-cols-2 gap-4">
                    {[{ icon: <FileCode className="w-5 h-5" />, text: 'JS/TS files never imported' }, { icon: <Image className="w-5 h-5" />, text: 'Images & assets never referenced' }, { icon: <FileType className="w-5 h-5" />, text: 'CSS with unused selectors' }, { icon: <Trash2 className="w-5 h-5" />, text: 'Safe deletion scores' }].map((f, i) => (
                        <GlassPanel key={i} className="flex items-center gap-3 p-4">
                            <div className="text-red-400">{f.icon}</div>
                            <span className="text-sm text-gray-400">{f.text}</span>
                        </GlassPanel>
                    ))}
                </div>
            </div>
            <input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipUpload} className="hidden" />
            <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFolderUpload} className="hidden" />
        </div>
    );

    const renderConfiguringState = () => (
        <div className="flex flex-col h-full p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><CheckCircle className="w-6 h-6 text-green-400" /> Project Loaded: {projectName}</h2>
                    <p className="text-gray-400 mt-1">Total files: {files.length.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowGuide(true)} className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-gray-400 hover:text-white"><HelpCircle className="w-5 h-5" /></button>
                    <button onClick={resetAnalysis} className="p-2 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
            </div>
            <GlassPanel className="flex-1 p-6 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Entry Points</h3>
                    <button className="text-sm text-red-400 hover:text-red-300">+ Add Custom</button>
                </div>
                <div className="space-y-2">
                    {entryPoints.length === 0 ? <p className="text-gray-500 text-center py-8">No entry points detected.</p> : entryPoints.map((entry) => (
                        <label key={entry.id} className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/10 cursor-pointer border border-white/10">
                            <input type="checkbox" checked={entry.enabled} onChange={(e) => setEntryPoints(prev => prev.map(ep => ep.id === entry.id ? { ...ep, enabled: e.target.checked } : ep))} className="w-4 h-4 rounded" />
                            <span className="flex-1 text-white font-mono text-sm">{entry.filePath}</span>
                            <span className="text-xs text-gray-500 px-2 py-1 bg-white/10 rounded">{entry.description}</span>
                        </label>
                    ))}
                </div>
            </GlassPanel>
            <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Analysis Mode</h3>
                <div className="grid grid-cols-2 gap-3">
                    <label className={`p-4 rounded-lg cursor-pointer border transition-all ${settings.analysisMode === 'conservative' ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                        <input type="radio" name="mode" checked={settings.analysisMode === 'conservative'} onChange={() => setSettings(s => ({ ...s, analysisMode: 'conservative' }))} className="hidden" />
                        <span className="text-white font-medium block">Conservative</span>
                        <p className="text-xs text-gray-400 mt-1">Fewer false positives</p>
                    </label>
                    <label className={`p-4 rounded-lg cursor-pointer border transition-all ${settings.analysisMode === 'aggressive' ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                        <input type="radio" name="mode" checked={settings.analysisMode === 'aggressive'} onChange={() => setSettings(s => ({ ...s, analysisMode: 'aggressive' }))} className="hidden" />
                        <span className="text-white font-medium block">Aggressive</span>
                        <p className="text-xs text-gray-400 mt-1">Find more dead code</p>
                    </label>
                </div>
            </GlassPanel>
            <button onClick={startAnalysis} disabled={entryPoints.filter(e => e.enabled).length === 0} className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Run Analysis
            </button>
        </div>
    );

    const renderAnalyzingState = () => (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <GlassPanel className="max-w-md w-full p-8 space-y-8 text-center">
                <Loader2 className="w-16 h-16 text-red-400 mx-auto animate-spin" />
                <div><h2 className="text-2xl font-bold text-white mb-2">{progress?.phaseDescription || 'Analyzing...'}</h2><p className="text-gray-400">{progress?.currentFile || 'Starting...'}</p></div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden"><div className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all" style={{ width: `${progress?.percentage || 0}%` }} /></div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10"><div className="text-2xl font-bold text-white">{progress?.filesProcessed || 0}</div><div className="text-xs text-gray-500">Processed</div></div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10"><div className="text-2xl font-bold text-white">{progress?.referencesFound || 0}</div><div className="text-xs text-gray-500">References</div></div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10"><div className="text-2xl font-bold text-red-400">{progress?.unreachableSoFar || 0}</div><div className="text-xs text-gray-500">Unreachable</div></div>
                </div>
                <button onClick={resetAnalysis} className="text-gray-500 hover:text-white transition-colors">Cancel</button>
            </GlassPanel>
        </div>
    );

    const renderResultsState = () => {
        if (!result) return null;
        return (
            <div className="flex h-full">
                <div className="flex-1 flex flex-col min-w-0">
                    <GlassPanel className="m-2 mb-0 rounded-b-none flex items-center gap-1 p-2">
                        {TABS.map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                {tab.icon}<span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                        <div className="flex-1" />
                        <button onClick={() => setShowGuide(true)} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg" title="Guide"><HelpCircle className="w-4 h-4" /></button>
                        <button onClick={startAnalysis} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg" title="Re-run (R)"><RefreshCw className="w-4 h-4" /></button>
                        <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg" title="Settings"><Settings className="w-4 h-4" /></button>
                        <button onClick={resetAnalysis} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
                    </GlassPanel>
                    <div className="flex-1 overflow-auto p-4">
                        {activeTab === 'summary' && <SummaryTab result={result} />}
                        {activeTab === 'by-type' && <ByTypeTab result={result} />}
                        {activeTab === 'by-folder' && <ByFolderTab result={result} />}
                        {activeTab === 'impact' && <ImpactTab result={result} />}
                        {activeTab === 'cleanup' && <CleanupTab result={result} selectedFiles={selectedFiles} onSelectionChange={setSelectedFiles} />}
                    </div>
                </div>
                <GlassPanel className="w-72 m-2 ml-0 p-4 space-y-4 overflow-auto">
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Quick Stats</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Total Files</span><span className="text-white font-medium">{result.summary.totalFiles.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Reachable</span><span className="text-green-400 font-medium">{result.summary.reachableFiles.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Unreachable</span><span className="text-red-400 font-medium">{result.summary.unreachableFiles.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Savings</span><span className="text-orange-400 font-medium">{(result.summary.totalRemovableSize / 1024 / 1024).toFixed(1)} MB</span></div>
                        </div>
                    </div>
                    <hr className="border-white/10" />
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Safe Scores</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-green-400">High (90+)</span><span className="text-white">{result.unreachableFiles.filter(f => f.safeDeleteScore >= 90).length}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-yellow-400">Medium (60-89)</span><span className="text-white">{result.unreachableFiles.filter(f => f.safeDeleteScore >= 60 && f.safeDeleteScore < 90).length}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-red-400">Low (0-59)</span><span className="text-white">{result.unreachableFiles.filter(f => f.safeDeleteScore < 60).length}</span></div>
                        </div>
                    </div>
                    {(result.warnings.dynamicImports.length > 0) && (<><hr className="border-white/10" /><div className="flex items-center gap-2 text-sm text-yellow-400"><AlertTriangle className="w-4 h-4" /><span>{result.warnings.dynamicImports.length} warnings</span></div></>)}
                    <button onClick={() => setActiveTab('cleanup')} className="w-full py-2 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-lg text-red-300 text-sm hover:bg-red-500/30">Export Cleanup</button>
                </GlassPanel>
            </div>
        );
    };

    const renderErrorState = () => (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <GlassPanel className="max-w-md text-center p-8 space-y-6">
                <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Analysis Error</h2>
                <p className="text-gray-400">{error}</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={startAnalysis} className="px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-500/30">Retry</button>
                    <button onClick={resetAnalysis} className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:bg-white/20">Start Over</button>
                </div>
            </GlassPanel>
        </div>
    );

    return (
        <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-white/10">
            {appState === 'idle' && renderIdleState()}
            {appState === 'configuring' && renderConfiguringState()}
            {appState === 'analyzing' && renderAnalyzingState()}
            {appState === 'results' && renderResultsState()}
            {appState === 'error' && renderErrorState()}
            {showGuide && <GuidePanel onClose={() => setShowGuide(false)} />}
            {showSettings && <SettingsPanel settings={settings} onUpdate={setSettings} onClose={() => setShowSettings(false)} />}
        </div>
    );
}
