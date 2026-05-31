// Component Extraction Engine - Main Component with Liquid Glass UI
// Tool 6 of Code X-Ray

import React, { useState, useCallback, useEffect } from 'react';
import {
    Boxes, Loader2, HelpCircle, Settings, RefreshCw, X,
    Eye, GitBranch, List, Download, AlertTriangle, BookOpen
} from 'lucide-react';

// Types
import {
    AppState, TabId, DetectedComponent, AnalysisResult, AnalysisSettings,
    AnalysisProgress, DEFAULT_SETTINGS, ExportConfig, DEFAULT_EXPORT_CONFIG
} from './types';

// Engine
import { parseHTML, parseHTMLLenient } from './engine/HTMLParser';
import { findRepeatedPatterns, groupVariants, createDetectedComponent, resetCounters } from './engine/PatternDetector';
import { detectAllLayoutPatterns } from './engine/LayoutPatternRecognizer';
import { detectAllAntiPatterns } from './engine/AntiPatternDetector';
import { exportComponent } from './engine/ExportGenerator';

// Tabs
import { VisualPreviewTab } from './tabs/VisualPreviewTab';
import { DOMTreeTab } from './tabs/DOMTreeTab';
import { ComponentListTab } from './tabs/ComponentListTab';
import { ExportTab } from './tabs/ExportTab';

// Components
import { InputSection } from './components/InputSection';
import { ComponentDetailsPanel } from './components/ComponentDetailsPanel';
import { SettingsPanel } from './components/SettingsPanel';

// Liquid Glass Panel Component
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

// Tab definition
interface TabInfo {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabInfo[] = [
    { id: 'visual-preview', label: 'Visual Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'dom-tree', label: 'DOM Tree', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'component-list', label: 'Component List', icon: <List className="w-4 h-4" /> },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
];

// Guide Panel Component
const GuidePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-xl">
                        <BookOpen className="w-6 h-6 text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Component Extraction Engine Guide</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6 text-gray-300">
                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">What This Tool Does</h3>
                    <p className="leading-relaxed">
                        The Component Extraction Engine analyzes HTML/CSS to automatically detect and extract reusable UI components.
                        It finds repeated patterns (cards, buttons, navbars, lists) across the page and helps you convert
                        legacy HTML into component-based architecture.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">How To Use</h3>
                    <ol className="space-y-3 list-decimal list-inside">
                        <li><strong>Input HTML:</strong> Paste HTML code, upload files, enter a URL, or upload a folder with HTML/CSS files.</li>
                        <li><strong>Analyze:</strong> Click "Analyze Components" to start the detection process.</li>
                        <li><strong>Review Results:</strong> Browse detected components in Visual Preview, DOM Tree, or Component List views.</li>
                        <li><strong>Export:</strong> Select components and export as HTML, React, Vue, Svelte, or other formats.</li>
                    </ol>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Understanding Scores</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <span className="font-bold text-green-400">Stability 80-100:</span>
                            <span>Consistent structure, easy to extract</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <span className="font-bold text-yellow-400">Stability 60-79:</span>
                            <span>Some variations, review recommended</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <span className="font-bold text-red-400">Stability 0-59:</span>
                            <span>High variation, manual review needed</span>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-green-400">1-4</kbd> Switch tabs</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-green-400">/</kbd> Focus search</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-green-400">O</kbd> Toggle overlays</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-green-400">Esc</kbd> Close panels</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-green-400">+/-</kbd> Zoom preview</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-green-400">?</kbd> Open this guide</div>
                    </div>
                </section>
            </div>
        </div>
    </div>
);

// Main Component
export default function ComponentExtractionEngine() {
    // State
    const [appState, setAppState] = useState<AppState>('idle');
    const [activeTab, setActiveTab] = useState<TabId>('visual-preview');
    const [settings, setSettings] = useState<AnalysisSettings>(DEFAULT_SETTINGS);
    const [progress, setProgress] = useState<AnalysisProgress | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [htmlContent, setHtmlContent] = useState('');

    // UI State
    const [selectedComponent, setSelectedComponent] = useState<DetectedComponent | null>(null);
    const [selectedComponentsForExport, setSelectedComponentsForExport] = useState<Set<string>>(new Set());
    const [showSettings, setShowSettings] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Run analysis
    const runAnalysis = useCallback(async (html: string, css: string) => {
        setAppState('analyzing');
        setError(null);
        setHtmlContent(html);
        resetCounters();

        try {
            // Phase 1: Parse HTML
            setProgress({
                phase: 'parsing',
                phaseDescription: 'Parsing HTML structure...',
                percentage: 10,
                nodesProcessed: 0,
                totalNodes: 0,
                patternsFound: 0,
                layoutsDetected: 0,
            });

            await new Promise(r => setTimeout(r, 100)); // Allow UI update

            const { dom: parsedDOM, warnings } = parseHTMLLenient(html, settings.maxNestingDepth);

            // Phase 2: Find patterns
            setProgress(p => ({
                ...p!,
                phase: 'detecting',
                phaseDescription: 'Detecting repeated patterns...',
                percentage: 30,
                totalNodes: parsedDOM.nodeCount,
            }));

            await new Promise(r => setTimeout(r, 100));

            const patterns = findRepeatedPatterns(parsedDOM.root, settings);
            const variantGroups = groupVariants(patterns, settings);

            // Phase 3: Create components
            setProgress(p => ({
                ...p!,
                phase: 'analyzing',
                phaseDescription: 'Analyzing component boundaries...',
                percentage: 50,
                patternsFound: patterns.size,
            }));

            await new Promise(r => setTimeout(r, 100));

            const components: DetectedComponent[] = [];
            for (const [hash, groups] of variantGroups) {
                for (const group of groups) {
                    const component = createDetectedComponent(group, settings);
                    components.push(component);
                }
            }

            // Phase 4: Detect layout patterns
            setProgress(p => ({
                ...p!,
                phase: 'scoring',
                phaseDescription: 'Detecting layout patterns...',
                percentage: 70,
            }));

            await new Promise(r => setTimeout(r, 100));

            const layoutPatterns = settings.detectLayoutPatterns
                ? detectAllLayoutPatterns(parsedDOM.root)
                : [];

            // Phase 5: Detect anti-patterns
            setProgress(p => ({
                ...p!,
                phaseDescription: 'Checking for anti-patterns...',
                percentage: 85,
                layoutsDetected: layoutPatterns.length,
            }));

            await new Promise(r => setTimeout(r, 100));

            const antiPatterns = settings.detectAntiPatterns
                ? detectAllAntiPatterns(parsedDOM.root, 4)
                : [];

            // Complete
            setProgress(p => ({
                ...p!,
                phase: 'complete',
                phaseDescription: 'Analysis complete!',
                percentage: 100,
            }));

            // Build result
            const analysisResult: AnalysisResult = {
                components,
                layoutPatterns,
                antiPatterns,
                summary: {
                    totalNodes: parsedDOM.nodeCount,
                    uniqueComponents: components.length,
                    totalInstances: components.reduce((sum, c) => sum + c.metrics.instanceCount, 0),
                    repeatedPatterns: components.filter(c => c.type === 'repeated').length,
                    layoutComponents: components.filter(c => c.type === 'layout').length,
                    uniqueSections: components.filter(c => c.type === 'unique').length,
                    warningCount: antiPatterns.filter(a => a.severity === 'warning').length,
                    errorCount: antiPatterns.filter(a => a.severity === 'error').length,
                },
                parsedDOM,
                parsedCSS: null, // CSS parsing would go here
            };

            setResult(analysisResult);

            if (components.length === 0) {
                setAppState('no-components');
            } else {
                setAppState('results');
                setActiveTab('component-list');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            setAppState('error');
        }
    }, [settings]);

    // Reset
    const reset = () => {
        setAppState('idle');
        setResult(null);
        setError(null);
        setProgress(null);
        setSelectedComponent(null);
        setSelectedComponentsForExport(new Set());
        setHtmlContent('');
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowSettings(false);
                setShowGuide(false);
                setSelectedComponent(null);
            }
            if (e.key === '?' && !showGuide) setShowGuide(true);

            if (appState === 'results') {
                if (e.key >= '1' && e.key <= '4') {
                    setActiveTab(TABS[parseInt(e.key) - 1].id);
                }
                if (e.key === 'o' || e.key === 'O') {
                    // Toggle overlays would go here
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [appState, showGuide]);

    // Handle export
    const handleExportComponent = (component: DetectedComponent) => {
        const exported = exportComponent(component, DEFAULT_EXPORT_CONFIG);

        const blob = new Blob([`${exported.html}\n\n${exported.css}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${component.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Render idle state
    const renderIdleState = () => (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <div className="max-w-3xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-green-500/20 backdrop-blur-md rounded-full ring-1 ring-green-500/30">
                        <Boxes className="w-12 h-12 text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Component Extraction Engine</h2>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Turn messy HTML into reusable UI components. Detect repeated patterns,
                        extract clean code, and export to React, Vue, or Svelte.
                    </p>
                    <button
                        onClick={() => setShowGuide(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" /> View Guide
                    </button>
                </div>

                <InputSection
                    onAnalyze={runAnalysis}
                    isAnalyzing={appState === 'analyzing'}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: '🔄', text: 'Detect repeated patterns' },
                        { icon: '📐', text: 'Identify layout structures' },
                        { icon: '🎯', text: 'Extract clean components' },
                        { icon: '⚠️', text: 'Find anti-patterns' },
                    ].map((f, i) => (
                        <GlassPanel key={i} className="flex items-center gap-3 p-4">
                            <span className="text-2xl">{f.icon}</span>
                            <span className="text-sm text-gray-400">{f.text}</span>
                        </GlassPanel>
                    ))}
                </div>
            </div>
        </div>
    );

    // Render analyzing state
    const renderAnalyzingState = () => (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <GlassPanel className="max-w-md w-full p-8 space-y-8 text-center">
                <Loader2 className="w-16 h-16 text-green-400 mx-auto animate-spin" />
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {progress?.phaseDescription || 'Analyzing...'}
                    </h2>
                    <p className="text-gray-400">Please wait</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-green-500 to-cyan-500 h-full rounded-full transition-all"
                        style={{ width: `${progress?.percentage || 0}%` }}
                    />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-2xl font-bold text-white">{progress?.totalNodes || 0}</div>
                        <div className="text-xs text-gray-500">Nodes</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-2xl font-bold text-white">{progress?.patternsFound || 0}</div>
                        <div className="text-xs text-gray-500">Patterns</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-2xl font-bold text-green-400">{progress?.layoutsDetected || 0}</div>
                        <div className="text-xs text-gray-500">Layouts</div>
                    </div>
                </div>
                <button onClick={reset} className="text-gray-500 hover:text-white transition-colors">Cancel</button>
            </GlassPanel>
        </div>
    );

    // Render results state
    const renderResultsState = () => {
        if (!result) return null;

        return (
            <div className="flex h-full">
                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Tab Bar */}
                    <GlassPanel className="m-2 mb-0 rounded-b-none flex items-center gap-1 p-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {tab.icon}
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                        <div className="flex-1" />
                        <button
                            onClick={() => setShowGuide(true)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg"
                            title="Guide"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg"
                            title="Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={reset}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </GlassPanel>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-auto p-4">
                        {activeTab === 'visual-preview' && (
                            <VisualPreviewTab
                                result={result}
                                htmlContent={htmlContent}
                                selectedComponent={selectedComponent}
                                onSelectComponent={setSelectedComponent}
                            />
                        )}
                        {activeTab === 'dom-tree' && (
                            <DOMTreeTab
                                result={result}
                                selectedComponent={selectedComponent}
                                onSelectComponent={setSelectedComponent}
                            />
                        )}
                        {activeTab === 'component-list' && (
                            <ComponentListTab
                                result={result}
                                selectedComponent={selectedComponent}
                                onSelectComponent={setSelectedComponent}
                                onExportComponent={handleExportComponent}
                            />
                        )}
                        {activeTab === 'export' && (
                            <ExportTab
                                result={result}
                                selectedComponents={selectedComponentsForExport}
                                onSelectionChange={setSelectedComponentsForExport}
                            />
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Component Details */}
                {selectedComponent && (
                    <ComponentDetailsPanel
                        component={selectedComponent}
                        onClose={() => setSelectedComponent(null)}
                        onExport={handleExportComponent}
                    />
                )}
            </div>
        );
    };

    // Render no components state
    const renderNoComponentsState = () => (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <GlassPanel className="max-w-md text-center p-8 space-y-6">
                <div className="text-6xl">🤔</div>
                <h2 className="text-2xl font-bold text-white">No Clear Patterns Detected</h2>
                <p className="text-gray-400">
                    The HTML doesn't have obvious repeated structures.
                </p>
                <div className="text-left text-sm text-gray-500 space-y-2">
                    <p>This could mean:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>The page is already well-componentized</li>
                        <li>The HTML is too simple</li>
                        <li>The structure is too inconsistent</li>
                    </ul>
                </div>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:bg-white/20"
                    >
                        Adjust Settings
                    </button>
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 hover:bg-green-500/30"
                    >
                        Try Different HTML
                    </button>
                </div>
            </GlassPanel>
        </div>
    );

    // Render error state
    const renderErrorState = () => (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <GlassPanel className="max-w-md text-center p-8 space-y-6">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Analysis Error</h2>
                <p className="text-gray-400">{error}</p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => runAnalysis(htmlContent, '')}
                        className="px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 hover:bg-green-500/30"
                    >
                        Retry
                    </button>
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:bg-white/20"
                    >
                        Start Over
                    </button>
                </div>
            </GlassPanel>
        </div>
    );

    return (
        <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-white/10">
            {appState === 'idle' && renderIdleState()}
            {appState === 'analyzing' && renderAnalyzingState()}
            {appState === 'results' && renderResultsState()}
            {appState === 'no-components' && renderNoComponentsState()}
            {appState === 'error' && renderErrorState()}

            {showGuide && <GuidePanel onClose={() => setShowGuide(false)} />}
            {showSettings && (
                <SettingsPanel
                    settings={settings}
                    onUpdate={setSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}
