
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    SystemDesign, Component, Connection, Workload, ComponentType,
    SimulationResults, SimConfig, InterviewSession
} from './types';

// Engines
import { runSimulation } from './engine/SimulationEngine';
import { runStressTest } from './engine/StressTestRunner';
import { detectBottlenecks } from './engine/BottleneckDetector';
import { autoLayout } from './engine/AutoLayoutEngine';
import { snapToGrid } from './utils/canvasHelpers';

// Components
import { ComponentPalette } from './components/ComponentPalette';
import { DesignerCanvas } from './components/DesignerCanvas';
import { PropertiesInspector } from './components/PropertiesInspector';
import { SimulationControls } from './components/SimulationControls';
import { WorkloadEditor } from './components/WorkloadEditor';
import { VersionHistory } from './components/VersionHistory';
import { InterviewMode } from './components/InterviewMode';
import { SettingsPanel } from './components/SettingsPanel';
import { ExportDialog } from './components/ExportDialog';
import { TemplateSelector } from './components/TemplateSelector';
import { GuidePanel } from './components/GuidePanel';

// Icons
import { Layout, Settings, Share, Clock, History, FileText, Maximize, HelpCircle, Minimize } from 'lucide-react';

const INITIAL_DESIGN: SystemDesign = {
    id: '1',
    name: 'New Design',
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    components: [],
    connections: [],
    workloads: [],
    canvas: { zoom: 1, panX: 0, panY: 0, gridEnabled: true, snapToGrid: true },
    notes: '',
    tags: []
};

// Main Component
export default function SystemDesignVisualizer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [design, setDesign] = useState<SystemDesign>(INITIAL_DESIGN);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectionType, setSelectionType] = useState<'component' | 'connection' | null>(null);
    const [activeRightPanel, setActiveRightPanel] = useState<'properties' | 'workloads' | 'history' | 'interview'>('properties');

    // Simulation State
    const [simConfig, setSimConfig] = useState<SimConfig>({ duration: 30, loadMultiplier: 1 });
    const [isSimulating, setIsSimulating] = useState(false);
    const [simResults, setSimResults] = useState<SimulationResults | null>(null);

    // Modals & Modes
    const [showSettings, setShowSettings] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Feature State
    const [interviewSession, setInterviewSession] = useState<InterviewSession>({
        problem: 'Design a scalable URL shortener like TinyURL.',
        timeLimit: 45,
        elapsedTime: 0,
        status: 'paused',
        checkpoints: [
            { name: 'Requirements', time: 5, completed: false },
            { name: 'High Level Design', time: 10, completed: false },
            { name: 'Detailed Design', time: 25, completed: false },
            { name: 'Bottlenecks', time: 35, completed: false }
        ],
        hints: ['Consider generating unique IDs', 'How to handle 100:1 read ratio?', 'Cache strategy?'],
        evaluationChecklist: []
    });

    // Helpers
    const updateComponent = (id: string, updates: Partial<Component>) => {
        setDesign(d => ({
            ...d,
            components: d.components.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
    };

    const updateConnection = (id: string, updates: Partial<Connection>) => {
        setDesign(d => ({
            ...d,
            connections: d.connections.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
    };

    const deleteItem = (id: string, type: 'component' | 'connection') => {
        if (type === 'component') {
            setDesign(d => ({
                ...d,
                components: d.components.filter(c => c.id !== id),
                connections: d.connections.filter(c => c.fromId !== id && c.toId !== id)
            }));
        } else {
            setDesign(d => ({
                ...d,
                connections: d.connections.filter(c => c.id !== id)
            }));
        }
        setSelectedId(null);
        setSelectionType(null);
    };

    const handleAutoLayout = () => {
        const layouted = autoLayout(design.components, design.connections);
        setDesign(d => ({ ...d, components: layouted }));
    };

    const loadTemplate = (tpl: SystemDesign) => {
        setDesign({
            ...tpl,
            id: Math.random().toString(),
            version: 1,
            canvas: INITIAL_DESIGN.canvas // Keep current canvas settings
        });
        setShowTemplates(false);
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch(err => console.error(err));
        } else {
            document.exitFullscreen()
                .then(() => setIsFullscreen(false))
                .catch(err => console.error(err));
        }
    };

    const handleComponentDropClick = (type: ComponentType) => {
        // Add to center of view
        const newComp: Component = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            name: `New ${type}`,
            description: '',
            position: { x: 500, y: 300 }, // Approximate center
            size: { width: 120, height: 80 },
            properties: {
                maxRPS: 1000,
                concurrencyLimit: 100,
                avgProcessingMs: 50,
                replicas: 1,
                autoScale: true,
                scaleThreshold: 70,
                minReplicas: 1,
                maxReplicas: 5,
                failureRate: 0,
                healthCheckIntervalMs: 30,
                timeoutMs: 30000
            },
            visual: { icon: '', color: '#1F2937', size: 'medium' }
        };
        setDesign(d => ({ ...d, components: [...d.components, newComp] }));
    };

    // --- Simulation Logic ---

    const startSimulation = () => {
        setIsSimulating(true);
        // Reset metrics
        setDesign(d => ({
            ...d,
            components: d.components.map(c => ({ ...c, metrics: undefined })),
            connections: d.connections.map(c => ({ ...c, metrics: undefined }))
        }));

        // Run Sim (Async to not block UI if heavy, though our engine is fast logic now)
        setTimeout(() => {
            const results = runSimulation(design, simConfig);
            const bottlenecks = detectBottlenecks(results, design);
            results.bottlenecks = bottlenecks;

            setSimResults(results);

            // Map metrics back to design elements for Canvas visualization
            setDesign(d => ({
                ...d,
                components: d.components.map(c => ({
                    ...c,
                    metrics: results.componentMetrics.get(c.id)
                })),
                connections: d.connections.map(c => ({
                    ...c,
                    metrics: results.connectionMetrics.get(c.id)
                }))
            }));

            setIsSimulating(false);
        }, 100);
    };

    return (
        <div
            ref={containerRef}
            className={`flex flex-col h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden relative ${isFullscreen ? 'bg-gray-900' : 'w-full h-full'}`}
        >
            {/* Force Cursor Global Override for Fullscreen - The "Nuclear" Option */}
            <style>{`
                :fullscreen { cursor: auto !important; }
                :fullscreen * { cursor: auto !important; }
                button { cursor: pointer !important; }
                /* Re-enable appropriate cursors for canvas interaction */
                :fullscreen .cursor-grab { cursor: grab !important; }
                :fullscreen .cursor-grabbing { cursor: grabbing !important; }
                :fullscreen .cursor-pointer { cursor: pointer !important; }
                :fullscreen .cursor-crosshair { cursor: crosshair !important; }
            `}</style>

            {/* Background Effects (Liquid Glass) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/30 blur-[150px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/30 blur-[150px] animate-pulse-slow" />
                <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[180px]" />
            </div>

            {/* HEADER - Nexora Style */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/10 backdrop-blur-xl border-b border-white/20 z-50 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="font-bold text-2xl text-white tracking-tight font-heading">System Design</h1>
                        <p className="text-lg text-indigo-200/90 font-signature leading-3 relative top-1">Precision Architecture Simulator</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowTemplates(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-200 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <FileText className="w-4 h-4" /> Templates
                    </button>
                    <button
                        onClick={handleAutoLayout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-200 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Layout className="w-4 h-4" /> Auto Layout
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    <button
                        onClick={() => setShowExport(true)}
                        className="p-2.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                        title="Export"
                    >
                        <Share className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowGuide(true)}
                        className="p-2.5 hover:bg-white/10 rounded-xl text-indigo-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                        title="Help Guide"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <button
                        onClick={toggleFullScreen}
                        className="p-2.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                        title="Fullscreen"
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden z-10 relative">

                {/* Left Palette */}
                <ComponentPalette
                    onDragStart={(e, type) => e.dataTransfer.setData('componentType', type)}
                    onItemClick={handleComponentDropClick}
                />

                {/* Center Canvas */}
                <div className="flex-1 flex flex-col relative w-full h-full bg-black/20 shadow-inner" id="designer-canvas-svg">
                    <DesignerCanvas
                        components={design.components}
                        connections={design.connections}
                        selectedId={selectedId}
                        onComponentsChange={(comps) => setDesign(d => ({ ...d, components: comps }))}
                        onConnectionsChange={(conns) => setDesign(d => ({ ...d, connections: conns }))}
                        onSelectionChange={(id, type) => {
                            setSelectedId(id);
                            setSelectionType(type);
                            if (id) setActiveRightPanel('properties');
                        }}
                    />

                    {/* Bottom Controls */}
                    <div className="bg-white/5 backdrop-blur-xl border-t border-white/10">
                        <SimulationControls
                            isRunning={isSimulating}
                            config={simConfig}
                            results={simResults}
                            onStart={startSimulation}
                            onPause={() => setIsSimulating(false)}
                            onReset={() => {
                                setSimResults(null);
                                setDesign(d => ({
                                    ...d,
                                    components: d.components.map(c => ({ ...c, metrics: undefined })),
                                    connections: d.connections.map(c => ({ ...c, metrics: undefined }))
                                }));
                            }}
                            onConfigChange={setSimConfig}
                        />
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col border-l border-white/10 bg-white/5 backdrop-blur-xl w-80 shadow-2xl z-20">
                    <div className="flex border-b border-white/10 bg-white/5">
                        <button
                            onClick={() => setActiveRightPanel('properties')}
                            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeRightPanel === 'properties' ? 'border-indigo-500 text-white bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                        >
                            PROPS
                        </button>
                        <button
                            onClick={() => setActiveRightPanel('workloads')}
                            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeRightPanel === 'workloads' ? 'border-indigo-500 text-white bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                        >
                            LOAD
                        </button>
                        <button
                            onClick={() => setActiveRightPanel('history')}
                            className={`flex-1 py-3 border-b-2 transition-colors ${activeRightPanel === 'history' ? 'border-indigo-500 text-white bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                            title="Version History"
                        >
                            <History className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                            onClick={() => setActiveRightPanel('interview')}
                            className={`flex-1 py-3 border-b-2 transition-colors ${activeRightPanel === 'interview' ? 'border-indigo-500 text-white bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                            title="Interview Mode"
                        >
                            <Clock className="w-4 h-4 mx-auto" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {activeRightPanel === 'properties' && (
                            <PropertiesInspector
                                design={design}
                                selectedId={selectedId}
                                selectionType={selectionType}
                                onUpdateComponent={updateComponent}
                                onUpdateConnection={updateConnection}
                                onDelete={deleteItem}
                            />
                        )}
                        {activeRightPanel === 'workloads' && (
                            <WorkloadEditor
                                workloads={design.workloads}
                                components={design.components}
                                onUpdateWorkloads={(w) => setDesign(d => ({ ...d, workloads: w }))}
                            />
                        )}
                        {activeRightPanel === 'history' && (
                            <VersionHistory
                                currentVersion={design.version}
                                onSaveSnapshot={() => { }}
                                onRestoreVersion={() => { }}
                            />
                        )}
                        {activeRightPanel === 'interview' && (
                            <InterviewMode
                                session={interviewSession}
                                onUpdateSession={setInterviewSession}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showSettings && (
                <SettingsPanel
                    config={simConfig}
                    onUpdateConfig={setSimConfig}
                    onClose={() => setShowSettings(false)}
                />
            )}
            {showExport && (
                <ExportDialog
                    design={design}
                    isOpen={showExport}
                    onClose={() => setShowExport(false)}
                />
            )}
            {showTemplates && (
                <TemplateSelector
                    isOpen={showTemplates}
                    onSelect={loadTemplate}
                    onClose={() => setShowTemplates(false)}
                />
            )}
            {showGuide && (
                <GuidePanel
                    onClose={() => setShowGuide(false)}
                />
            )}
        </div>
    );
};
