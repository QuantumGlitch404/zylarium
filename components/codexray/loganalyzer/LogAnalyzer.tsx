// Client-Side Log Analyzer - Main Component with Liquid Glass UI
// Tool 7 of Code X-Ray

import React, { useState, useCallback, useEffect } from 'react';
import {
    FileText, Loader2, HelpCircle, Settings, X,
    BarChart2, Clock, AlertTriangle, Users, Zap, List, BookOpen
} from 'lucide-react';

// Types
import {
    AppState, TabId, AnalysisResult, AnalysisSettings, AnalysisProgress, UploadedFile,
    LogEntry, LogLevel, NoisePattern, DEFAULT_SETTINGS, BUILT_IN_NOISE_PATTERNS,
    ErrorFingerprint, LogSession
} from './types';

// Engine
import { parseLogFile, resetParser, detectFormat } from './engine/LogParser';
import { fingerprintEntries, detectDuplicates } from './engine/Fingerprinter';
import { reconstructSessions, detectSessionAnomalies } from './engine/SessionReconstructor';
import { detectAllAnomalies, resetAnomalyDetector } from './engine/AnomalyDetector';
import { calculateHealthScore, applyNoisePatterns, initializeNoisePatterns } from './engine/HealthScorer';

// Tabs
import { OverviewTab } from './tabs/OverviewTab';
import { TimelineTab } from './tabs/TimelineTab';
import { ErrorsTab } from './tabs/ErrorsTab';
import { SessionsTab } from './tabs/SessionsTab';
import { AnomaliesTab } from './tabs/AnomaliesTab';
import { RawLogsTab } from './tabs/RawLogsTab';

// Components
import { FileUploadSection } from './components/FileUploadSection';
import { QuickStatsSidebar } from './components/QuickStatsSidebar';

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
    { id: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'errors', label: 'Errors', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'sessions', label: 'Sessions', icon: <Users className="w-4 h-4" /> },
    { id: 'anomalies', label: 'Anomalies', icon: <Zap className="w-4 h-4" /> },
    { id: 'raw', label: 'Raw Logs', icon: <List className="w-4 h-4" /> },
];

// Guide Panel Component
const GuidePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <BookOpen className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Client-Side Log Analyzer Guide</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6 text-gray-300">
                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">What This Tool Does</h3>
                    <p className="leading-relaxed">
                        Transform raw log files into structured, grouped, and navigable insights.
                        Parses multiple log formats, groups errors by fingerprint, reconstructs user sessions,
                        and detects anomalies. All processing happens locally.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Supported Formats</h3>
                    <ul className="space-y-2 list-disc list-inside">
                        <li><strong>.log, .txt</strong> - Plain text logs</li>
                        <li><strong>.jsonl</strong> - JSON Lines (one JSON per line)</li>
                        <li><strong>.json</strong> - JSON array of log entries</li>
                        <li><strong>.csv</strong> - CSV formatted logs</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-indigo-400">1-6</kbd> Switch tabs</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-indigo-400">/</kbd> Focus search</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-indigo-400">N</kbd> Toggle noise filter</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-indigo-400">Esc</kbd> Close panels</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-indigo-400">R</kbd> Refresh analysis</div>
                        <div className="p-2 bg-white/5 rounded"><kbd className="text-indigo-400">?</kbd> Open this guide</div>
                    </div>
                </section>
            </div>
        </div>
    </div>
);

// Main Component
export default function LogAnalyzer() {
    // State
    const [appState, setAppState] = useState<AppState>('idle');
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [settings, setSettings] = useState<AnalysisSettings>(DEFAULT_SETTINGS);
    const [progress, setProgress] = useState<AnalysisProgress | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [noisePatterns, setNoisePatterns] = useState<NoisePattern[]>(initializeNoisePatterns());

    // File state
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [rawFiles, setRawFiles] = useState<File[]>([]);

    // UI State
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    // Handle file selection
    const handleFilesChange = useCallback((files: File[]) => {
        const uploaded: UploadedFile[] = files.map((f, i) => ({
            id: `file_${i}_${Date.now()}`,
            name: f.name,
            size: f.size,
            lineCount: 0,
            format: 'text' as const,
            status: 'pending' as const,
        }));

        setUploadedFiles(uploaded);
        setRawFiles(files);
    }, []);

    // Clear files
    const clearFiles = () => {
        setUploadedFiles([]);
        setRawFiles([]);
    };

    // Run analysis
    const runAnalysis = useCallback(async () => {
        if (rawFiles.length === 0) return;

        setAppState('analyzing');
        setError(null);
        resetParser();
        resetAnomalyDetector();

        try {
            // Phase 1: Read and parse files
            setProgress({
                phase: 'parsing',
                phaseDescription: 'Parsing log files...',
                percentage: 10,
                currentFile: '',
                linesParsed: 0,
                totalLines: 0,
                timestampsFound: 0,
                errorsDetected: 0,
                sessionsFound: 0,
                uniquePatterns: 0,
            });

            await new Promise(r => setTimeout(r, 50));

            let allEntries: LogEntry[] = [];
            const updatedFiles: UploadedFile[] = [];

            for (let i = 0; i < rawFiles.length; i++) {
                const file = rawFiles[i];
                setProgress(p => ({ ...p!, currentFile: file.name, percentage: 10 + (i / rawFiles.length) * 20 }));

                try {
                    const content = await file.text();
                    const lines = content.split('\n').length;
                    const { entries, format } = parseLogFile(content, file.name, settings);

                    allEntries = [...allEntries, ...entries];

                    updatedFiles.push({
                        ...uploadedFiles[i],
                        lineCount: lines,
                        format,
                        status: 'parsed',
                    });
                } catch (err) {
                    updatedFiles.push({
                        ...uploadedFiles[i],
                        status: 'error',
                        error: err instanceof Error ? err.message : 'Parse failed',
                    });
                }
            }

            setUploadedFiles(updatedFiles);

            if (allEntries.length === 0) {
                setAppState('no-logs');
                return;
            }

            // Phase 2: Apply noise patterns
            setProgress(p => ({
                ...p!,
                phase: 'normalizing',
                phaseDescription: 'Applying noise filters...',
                percentage: 35,
                linesParsed: allEntries.length,
            }));

            await new Promise(r => setTimeout(r, 50));
            applyNoisePatterns(allEntries, noisePatterns);

            // Phase 3: Fingerprint
            setProgress(p => ({
                ...p!,
                phase: 'fingerprinting',
                phaseDescription: 'Fingerprinting error patterns...',
                percentage: 45,
            }));

            await new Promise(r => setTimeout(r, 50));
            const fingerprints = fingerprintEntries(allEntries, settings);

            // Phase 4: Detect duplicates
            if (settings.autoCollapseDuplicates) {
                detectDuplicates(allEntries, settings.duplicateTimeWindow);
            }

            // Phase 5: Reconstruct sessions
            setProgress(p => ({
                ...p!,
                phase: 'sessions',
                phaseDescription: 'Reconstructing sessions...',
                percentage: 60,
                uniquePatterns: fingerprints.size,
            }));

            await new Promise(r => setTimeout(r, 50));
            const sessions = reconstructSessions(allEntries, settings);
            detectSessionAnomalies(sessions);

            // Phase 6: Detect anomalies
            setProgress(p => ({
                ...p!,
                phase: 'anomalies',
                phaseDescription: 'Detecting anomalies...',
                percentage: 75,
                sessionsFound: sessions.size,
            }));

            await new Promise(r => setTimeout(r, 50));
            const anomalies = detectAllAnomalies(allEntries, fingerprints, settings);

            // Phase 7: Calculate health score
            setProgress(p => ({
                ...p!,
                phase: 'scoring',
                phaseDescription: 'Calculating health score...',
                percentage: 90,
            }));

            await new Promise(r => setTimeout(r, 50));
            const healthScore = calculateHealthScore(allEntries);

            // Build summary
            const entriesWithTimestamp = allEntries.filter(e => e.timestamp);
            const sortedByTime = entriesWithTimestamp.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
            const timeRange = sortedByTime.length > 0 ? {
                start: sortedByTime[0].timestamp!,
                end: sortedByTime[sortedByTime.length - 1].timestamp!,
            } : null;

            const byLevel: Record<LogLevel, number> = {
                ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0, FATAL: 0, UNKNOWN: 0
            };
            for (const entry of allEntries) {
                byLevel[entry.level]++;
            }

            // Complete
            setProgress(p => ({
                ...p!,
                phase: 'complete',
                phaseDescription: 'Analysis complete!',
                percentage: 100,
            }));

            const analysisResult: AnalysisResult = {
                files: updatedFiles,
                entries: allEntries,
                fingerprints,
                sessions,
                anomalies,
                healthScore,
                summary: {
                    totalLines: allEntries.length,
                    parsedLines: allEntries.filter(e => e.isParsed).length,
                    failedLines: allEntries.filter(e => !e.isParsed).length,
                    timeRange,
                    duration: timeRange ? timeRange.end.getTime() - timeRange.start.getTime() : 0,
                    byLevel,
                    uniqueErrors: fingerprints.size,
                    totalOccurrences: Array.from(fingerprints.values()).reduce((sum, fp) => sum + fp.count, 0),
                    sessionCount: sessions.size,
                    anomalyCount: anomalies.length + Array.from(sessions.values()).filter(s => s.isAnomaly).length,
                },
                noisePatterns,
            };

            setResult(analysisResult);
            setAppState('results');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            setAppState('error');
        }
    }, [rawFiles, uploadedFiles, settings, noisePatterns]);

    // Reset
    const reset = () => {
        setAppState('idle');
        setResult(null);
        setError(null);
        setProgress(null);
        setUploadedFiles([]);
        setRawFiles([]);
        setSelectedSession(null);
    };

    const exportReport = () => {
        if (!result) return;
        const fingerprintValues: ErrorFingerprint[] = Array.from(result.fingerprints.values());
        const report = {
            generatedAt: new Date().toISOString(),
            summary: result.summary,
            healthScore: result.healthScore,
            errors: fingerprintValues.map((fp) => ({
                fingerprint: fp.id,
                template: fp.template,
                count: fp.count,
                firstSeen: fp.firstSeen.toISOString(),
                lastSeen: fp.lastSeen.toISOString(),
                sessionsAffected: fp.affectedSessionCount,
            })),
            anomalies: result.anomalies,
        };
        downloadJSON(report, 'log-analysis-report.json');
    };

    const exportErrors = () => {
        if (!result) return;
        const fingerprintValues: ErrorFingerprint[] = Array.from(result.fingerprints.values());
        const csv = 'fingerprint,template,count,first_seen,last_seen,sessions_affected\n' +
            fingerprintValues.map((fp) =>
                `${fp.id},"${fp.template.replace(/"/g, '""')}",${fp.count},${fp.firstSeen.toISOString()},${fp.lastSeen.toISOString()},${fp.affectedSessionCount}`
            ).join('\n');
        downloadFile(csv, 'errors.csv', 'text/csv');
    };

    const exportSessions = () => {
        if (!result) return;
        const sessionValues: LogSession[] = Array.from(result.sessions.values());
        const csv = 'session_id,start_time,end_time,duration_ms,event_count,error_count,is_anomaly\n' +
            sessionValues.map((s) =>
                `${s.id},${s.startTime.toISOString()},${s.endTime.toISOString()},${s.duration},${s.entryCount},${s.eventsByLevel.error},${s.isAnomaly}`
            ).join('\n');
        downloadFile(csv, 'sessions.csv', 'text/csv');
    };

    const downloadFiltered = () => {
        if (!result) return;
        const content = result.entries.filter(e => !e.isNoise && !e.isDuplicate).map(e => e.rawContent).join('\n');
        downloadFile(content, 'filtered-logs.log', 'text/plain');
    };

    const downloadJSON = (data: any, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowGuide(false);
            }
            if (e.key === '?' && !showGuide) setShowGuide(true);

            if (appState === 'results') {
                if (e.key >= '1' && e.key <= '6') {
                    setActiveTab(TABS[parseInt(e.key) - 1].id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [appState, showGuide]);

    // Render idle state
    const renderIdleState = () => (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <div className="max-w-3xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-indigo-500/20 backdrop-blur-md rounded-full ring-1 ring-indigo-500/30">
                        <FileText className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Client-Side Log Analyzer</h2>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Transform raw logs into structured insights. Detect patterns,
                        reconstruct sessions, and find anomalies — all locally.
                    </p>
                    <button
                        onClick={() => setShowGuide(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" /> View Guide
                    </button>
                </div>

                <FileUploadSection
                    files={uploadedFiles}
                    onFilesChange={handleFilesChange}
                    onClearFiles={clearFiles}
                    onAnalyze={runAnalysis}
                    isAnalyzing={appState === 'analyzing'}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: '📊', text: 'Auto format detection' },
                        { icon: '🔍', text: 'Error fingerprinting' },
                        { icon: '👤', text: 'Session reconstruction' },
                        { icon: '⚡', text: 'Anomaly detection' },
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
                <Loader2 className="w-16 h-16 text-indigo-400 mx-auto animate-spin" />
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {progress?.phaseDescription || 'Analyzing...'}
                    </h2>
                    {progress?.currentFile && (
                        <p className="text-gray-400">Current file: {progress.currentFile}</p>
                    )}
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${progress?.percentage || 0}%` }}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 p-3 rounded-xl">
                        <div className="text-xl font-bold text-white">{progress?.linesParsed || 0}</div>
                        <div className="text-xs text-gray-500">Lines Parsed</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl">
                        <div className="text-xl font-bold text-white">{progress?.uniquePatterns || 0}</div>
                        <div className="text-xs text-gray-500">Patterns</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl">
                        <div className="text-xl font-bold text-white">{progress?.sessionsFound || 0}</div>
                        <div className="text-xs text-gray-500">Sessions</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl">
                        <div className="text-xl font-bold text-indigo-400">{progress?.percentage || 0}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
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
            <div className="flex h-full gap-4">
                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Tab Bar */}
                    <GlassPanel className="mb-4 flex items-center gap-1 p-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
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
                            onClick={reset}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </GlassPanel>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-auto">
                        {activeTab === 'overview' && (
                            <OverviewTab
                                result={result}
                                onViewErrors={() => setActiveTab('errors')}
                                onViewSessions={() => setActiveTab('sessions')}
                            />
                        )}
                        {activeTab === 'timeline' && (
                            <TimelineTab
                                result={result}
                                onSelectEntry={() => { }}
                            />
                        )}
                        {activeTab === 'errors' && (
                            <ErrorsTab
                                result={result}
                                onViewSession={(id) => { setSelectedSession(id); setActiveTab('sessions'); }}
                            />
                        )}
                        {activeTab === 'sessions' && (
                            <SessionsTab
                                result={result}
                                selectedSession={selectedSession}
                                onSelectSession={setSelectedSession}
                            />
                        )}
                        {activeTab === 'anomalies' && (
                            <AnomaliesTab
                                result={result}
                                onViewFingerprint={() => setActiveTab('errors')}
                                onViewSession={(id) => { setSelectedSession(id); setActiveTab('sessions'); }}
                            />
                        )}
                        {activeTab === 'raw' && (
                            <RawLogsTab
                                result={result}
                                noisePatterns={noisePatterns}
                                onUpdateNoisePatterns={setNoisePatterns}
                            />
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <QuickStatsSidebar
                    result={result}
                    noisePatterns={noisePatterns}
                    onExportReport={exportReport}
                    onExportErrors={exportErrors}
                    onExportSessions={exportSessions}
                    onDownloadFiltered={downloadFiltered}
                    onEditNoisePatterns={() => setActiveTab('raw')}
                />
            </div>
        );
    };

    // Render no logs state
    const renderNoLogsState = () => (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <GlassPanel className="max-w-md text-center p-8 space-y-6">
                <div className="text-6xl">❌</div>
                <h2 className="text-2xl font-bold text-white">Could Not Parse Logs</h2>
                <p className="text-gray-400">
                    The uploaded files don't appear to contain valid log data.
                </p>
                <div className="text-left text-sm text-gray-500 space-y-2">
                    <p>Expected formats:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Plain text with one log entry per line</li>
                        <li>JSON Lines (one JSON object per line)</li>
                        <li>CSV with headers</li>
                    </ul>
                </div>
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 hover:bg-indigo-500/30"
                >
                    Try Different Files
                </button>
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
                        onClick={runAnalysis}
                        className="px-6 py-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 hover:bg-indigo-500/30"
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
        <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-white/10 p-4">
            {appState === 'idle' && renderIdleState()}
            {appState === 'analyzing' && renderAnalyzingState()}
            {appState === 'results' && renderResultsState()}
            {appState === 'no-logs' && renderNoLogsState()}
            {appState === 'error' && renderErrorState()}

            {showGuide && <GuidePanel onClose={() => setShowGuide(false)} />}
        </div>
    );
}
