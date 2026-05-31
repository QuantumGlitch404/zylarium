import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FinderTopBar } from './FinderTopBar';
import { FinderResults } from './FinderResults';
import { FinderSidebar } from './FinderSidebar';
import { GuideModal } from './GuideModal';
import { RenamePreviewModal } from './RenamePreviewModal';
import { SearchState, SearchResult, Occurrence } from '../types/codexray';
import { FolderOpen, Loader2, UploadCloud } from 'lucide-react';
import { SearchEngineMain, FileData, RenameDiff } from '../../utils/searchEngineMain';

export const CodeUsageFinder: React.FC = () => {
    // ---- State ----
    const [searchState, setSearchState] = useState<SearchState>({
        query: '',
        mode: 'exact',
        scope: 'all',
        regexFlags: ['i'],
        extensions: []
    });

    const [isSearching, setIsSearching] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexProgress, setIndexProgress] = useState(0);
    const [currentFile, setCurrentFile] = useState('');

    // Modals
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [renameDiff, setRenameDiff] = useState<RenameDiff | null>(null);
    const [pendingRename, setPendingRename] = useState<{ old: string, new: string } | null>(null);

    const [results, setResults] = useState<SearchResult>({
        matches: [],
        totalFiles: 0,
        durationMs: 0
    });

    // Engine Reference (Main Thread)
    const engineRef = useRef<SearchEngineMain>(new SearchEngineMain());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ---- Handlers ----

    // Failsafe: Standard Input Upload
    const handleLegacyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsIndexing(true);
        setIndexProgress(0);
        setCurrentFile("Starting upload...");
        engineRef.current.reset();

        const ALLOWED_EXTENSIONS = new Set([
            'ts', 'tsx', 'js', 'jsx', 'json', 'css', 'scss', 'html', 'md', 'txt',
            'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sql', 'xml', 'yaml', 'yml'
        ]);

        const files = Array.from(e.target.files);
        let validFiles: FileData[] = [];
        let processedCount = 0;

        try {
            // 1. Read all files first (or in chunks)
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); // Yield

                const ext = file.name.split('.').pop()?.toLowerCase();
                // @ts-ignore
                const path = file.webkitRelativePath || file.name;

                if (!ext || !ALLOWED_EXTENSIONS.has(ext)) continue;
                if (file.name.includes(".min.") || path.includes("/node_modules/")) continue;
                if (file.size > 2 * 1024 * 1024) continue;

                try {
                    const text = await file.text();
                    validFiles.push({
                        id: crypto.randomUUID(),
                        path: path,
                        content: text
                    });
                    processedCount++;
                    setCurrentFile(`Reading: ${file.name}`);
                } catch (e) { console.warn(e); }
            }

            if (validFiles.length === 0) {
                alert("No compatible code files found.");
                setIsIndexing(false);
                return;
            }

            // 2. Index files
            setCurrentFile(`Indexing ${validFiles.length} files...`);
            await engineRef.current.indexFiles(validFiles, (fname) => {
                setCurrentFile(`Indexing: ${fname}`);
            });

            setIsIndexing(false);
            setResults(engineRef.current.getAllFiles());
            // alert(`Successfully indexed ${validFiles.length} files! You can now search.`);

        } catch (err: any) {
            console.error(err);
            alert(`Error: ${err.message || err}`);
            setIsIndexing(false);
        }
    };

    const handleDirectorySelect = async () => {
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            setIsIndexing(true);
            setIndexProgress(0);
            engineRef.current.reset();

            const ALLOWED_EXTENSIONS = new Set([
                'ts', 'tsx', 'js', 'jsx', 'json', 'css', 'scss', 'html', 'md', 'txt',
                'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sql', 'xml', 'yaml', 'yml'
            ]);

            let validFiles: FileData[] = [];

            // Recursive reader
            async function readDirectory(handle: any, path: string = '') {
                for await (const entry of handle.values()) {
                    await new Promise(r => setTimeout(r, 0)); // Yield

                    if (entry.kind === 'file') {
                        // @ts-ignore
                        const name = entry.name;
                        const ext = name.split('.').pop()?.toLowerCase();
                        if (ext && ALLOWED_EXTENSIONS.has(ext)) {
                            // @ts-ignore
                            const file = await entry.getFile();
                            if (file.size < 5 * 1024 * 1024) {
                                const text = await file.text();
                                validFiles.push({
                                    id: crypto.randomUUID(),
                                    path: path + name,
                                    content: text
                                });
                                setCurrentFile(`Reading: ${name}`);
                            }
                        }
                    } else if (entry.kind === 'directory') {
                        // @ts-ignore
                        if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) continue;
                        // @ts-ignore
                        await readDirectory(entry, path + entry.name + '/');
                    }
                }
            }

            await readDirectory(dirHandle);

            if (validFiles.length === 0) {
                alert("No compatible files found.");
                setIsIndexing(false);
                return;
            }

            // Index
            await engineRef.current.indexFiles(validFiles, (fname) => {
                setCurrentFile(`Indexing: ${fname}`);
            });

            setIsIndexing(false);
            setResults(engineRef.current.getAllFiles());
            // alert(`Successfully indexed ${validFiles.length} files!`);

        } catch (err) {
            console.error(err);
            setIsIndexing(false);
        }
    };

    // Auto-Search Effect (Debounced)
    useEffect(() => {
        if (isIndexing) return;

        const timeoutId = setTimeout(() => {
            const res = engineRef.current.search(searchState.query, {
                mode: searchState.mode,
                scope: searchState.scope,
                extensions: searchState.extensions,
                regexFlags: searchState.regexFlags
            });
            setResults(res);
        }, 200); // 200ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchState, isIndexing]);

    const handleSearch = useCallback(() => {
        if (isIndexing) return;
        setIsSearching(true);
        // Instant trigger 
        setTimeout(() => {
            const res = engineRef.current.search(searchState.query, {
                mode: searchState.mode,
                scope: searchState.scope,
                extensions: searchState.extensions,
                regexFlags: searchState.regexFlags
            });
            setResults(res);
            setIsSearching(false);
        }, 10);
    }, [searchState, isIndexing]);

    const handleOpenFile = (fileId: string, line: number) => {
        console.log(`Opening file ${fileId} at line ${line}`);
    };

    const handleSelectMatch = (match: Occurrence) => {
        console.log("Selected match:", match);
    };

    // Global Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                switch (e.code) {
                    case 'KeyE':
                        setSearchState(prev => ({ ...prev, mode: 'exact' }));
                        break;
                    case 'KeyR':
                        setSearchState(prev => ({ ...prev, mode: 'regex' }));
                        break;
                    case 'KeyF':
                        setSearchState(prev => ({ ...prev, mode: 'fuzzy' }));
                        break;
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // ---- Render ----
    // ---- Render ----
    return (
        <div className="flex flex-col h-full w-full bg-transparent text-gray-200 overflow-hidden relative font-sans">
            {/* Top Bar */}
            <FinderTopBar
                searchState={searchState}
                setSearchState={setSearchState}
                onSearch={handleSearch}
                isSearching={isSearching}
                onOpenGuide={() => setIsGuideOpen(true)}
            />

            {/* Indexing Process Bar */}
            {isIndexing && (
                <div className="absolute inset-x-0 top-[88px] z-20 bg-primary-600/20 backdrop-blur-md border-b border-primary-500/30 px-4 py-2 flex items-center justify-between text-xs text-primary-200">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Indexing project... {indexProgress === -1 ? '' : `${indexProgress}%`}</span>
                    </div>
                    <span className="font-mono opacity-70 truncate max-w-[300px]">{currentFile}</span>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Results or Empty State */}
                {results.totalFiles === 0 && !isIndexing ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a]/50">
                        {/* Hidden Input for Fallback */}
                        <input
                            type="file"
                            // @ts-ignore
                            webkitdirectory=""
                            directory=""
                            multiple
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleLegacyUpload}
                        />

                        <div className="flex gap-8">
                            {/* Primary Button (Advanced) */}
                            <button
                                onClick={handleDirectorySelect}
                                className="flex flex-col items-center gap-4 group"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:border-primary-500/50 group-hover:bg-primary-500/10">
                                    <FolderOpen className="w-10 h-10 text-gray-400 group-hover:text-primary-400" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-gray-200 mb-2">Open Project Folder</h3>
                                    <p className="text-sm text-gray-500">Fast Mode (Experimental)</p>
                                </div>
                            </button>

                            {/* Secondary Button (Legacy) */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-4 group"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:border-green-500/50 group-hover:bg-green-500/10">
                                    <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-green-400" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-gray-200 mb-2">Standard Upload</h3>
                                    <p className="text-sm text-gray-500">Reliable Mode (Use if Fast fails)</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <FinderResults
                        results={results}
                        onSelectMatch={handleSelectMatch}
                        onOpenFile={handleOpenFile}
                    />
                )}

                {/* Right Sidebar */}
                <FinderSidebar
                    results={results}
                    onRename={(newName) => {
                        if (!newName) return;
                        // Use current query as the "Old Name" target
                        const target = searchState.query;
                        if (!target) {
                            alert("Please search for a symbol first before simulating a rename.");
                            return;
                        }
                        const diff = engineRef.current.simulateRename(target, newName);
                        setRenameDiff(diff);
                        setPendingRename({ old: target, new: newName });
                    }}
                    onRunDeadCodeAnalysis={() => {
                        setIsSearching(true);
                        setTimeout(() => {
                            const res = engineRef.current.analyzeDeadCode();
                            setResults(res);
                            setIsSearching(false);
                            if (res.matches.length === 0) {
                                alert("Great news! No dead code detected (based on internal zero-reference check).");
                            }
                        }, 50);
                    }}
                />
            </div>

            {/* Modals */}
            <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

            {renameDiff && pendingRename && (
                <RenamePreviewModal
                    diff={renameDiff}
                    oldName={pendingRename.old}
                    newName={pendingRename.new}
                    onClose={() => {
                        setRenameDiff(null);
                        setPendingRename(null);
                    }}
                />
            )}
        </div>
    );
};
