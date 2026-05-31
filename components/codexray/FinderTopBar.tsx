// ... imports ...
import { Search, X, Hash, Type, Regex, Filter, BookOpen } from 'lucide-react';

interface FinderTopBarProps {
    searchState: SearchState;
    setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;
    onSearch: () => void;
    isSearching: boolean;
    onOpenGuide: () => void;
}

export const FinderTopBar: React.FC<FinderTopBarProps> = ({ searchState, setSearchState, onSearch, isSearching, onOpenGuide }) => {

    const updateState = (updates: Partial<SearchState>) => {
        setSearchState(prev => ({ ...prev, ...updates }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="flex flex-col gap-3 p-4 border-b border-white/20 bg-white/10 backdrop-blur-xl shadow-sm transition-all duration-300">
            {/* Top Row: Search Input & Primary Actions */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-primary-400 animate-pulse' : 'text-gray-400 group-hover:text-gray-200'}`} />
                    <input
                        type="text"
                        value={searchState.query}
                        onChange={(e) => updateState({ query: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for symbol, function, variable..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all shadow-inner"
                        autoFocus
                    />
                    {searchState.query && (
                        <button
                            onClick={() => updateState({ query: '' })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Search Mode Toggles - Liquid Glass Style */}
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 backdrop-blur-sm shadow-inner">
                    <button
                        onClick={() => updateState({ mode: 'exact' })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${searchState.mode === 'exact'
                            ? 'bg-primary-500/20 text-primary-300 shadow-lg ring-1 ring-primary-500/50 scale-105'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        <Type className="w-3 h-3" /> Exact
                    </button>
                    <button
                        onClick={() => updateState({ mode: 'regex' })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${searchState.mode === 'regex'
                            ? 'bg-orange-500/20 text-orange-300 shadow-lg ring-1 ring-orange-500/50 scale-105'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        <Regex className="w-3 h-3" /> Regex
                    </button>
                    <button
                        onClick={() => updateState({ mode: 'fuzzy' })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${searchState.mode === 'fuzzy'
                            ? 'bg-purple-500/20 text-purple-300 shadow-lg ring-1 ring-purple-500/50 scale-105'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        <Hash className="w-3 h-3" /> Fuzzy
                    </button>
                </div>

                {/* Guide Button */}
                <button
                    onClick={onOpenGuide}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-primary-300 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary-500/10"
                    title="User Guide"
                >
                    <BookOpen className="w-4 h-4" />
                </button>
            </div>

            {/* Bottom Row: Filters & Options */}
            <div className="flex items-center justify-between gap-4 mt-0">

                {/* Left: Scope filters - Liquid Dropdown */}
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="flex items-center bg-black/30 rounded-lg px-3 py-1.5 border border-white/5 hover:border-white/20 transition-colors backdrop-blur-sm">
                            <Filter className="w-3 h-3 text-gray-500 mr-2 group-hover:text-primary-400 transition-colors" />
                            <select
                                value={searchState.scope}
                                onChange={(e) => updateState({ scope: e.target.value as ScopeType })}
                                className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer appearance-none pr-6 font-medium"
                                style={{ backgroundImage: 'none' }}
                            >
                                <option value="all" className="bg-[#1a1a1a]">All Files</option>
                                <option value="folder" className="bg-[#1a1a1a]">Current Folder</option>
                                <option value="custom" className="bg-[#1a1a1a]">Custom Extensions</option>
                            </select>
                            {/* Custom arrow to verify it's a dropdown */}
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    {searchState.scope === 'custom' && (
                        <input
                            type="text"
                            value={searchState.extensions?.join(', ')}
                            onChange={(e) => updateState({ extensions: e.target.value.split(',').map(s => s.trim()) })}
                            placeholder="e.g. ts, tsx, css"
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 w-40 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 placeholder-gray-600 animate-in fade-in slide-in-from-left-2"
                        />
                    )}
                </div>

                {/* Center: Regex Options (Conditional) */}
                {searchState.mode === 'regex' && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-200 bg-orange-500/5 px-3 py-1 rounded-lg border border-orange-500/10">
                        <label className="flex items-center gap-2 cursor-pointer group select-none">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${searchState.regexFlags?.includes('i')
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-gray-600 group-hover:border-orange-400'
                                }`}>
                                {searchState.regexFlags?.includes('i') && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                checked={searchState.regexFlags?.includes('i')}
                                onChange={(e) => {
                                    const flags = searchState.regexFlags || [];
                                    updateState({
                                        regexFlags: e.target.checked
                                            ? [...flags, 'i']
                                            : flags.filter(f => f !== 'i')
                                    });
                                }}
                                className="hidden"
                            />
                            <span className={`text-[10px] font-bold uppercase transition-colors ${searchState.regexFlags?.includes('i') ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'
                                }`}>Case (i)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group select-none">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${searchState.regexFlags?.includes('m')
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-gray-600 group-hover:border-orange-400'
                                }`}>
                                {searchState.regexFlags?.includes('m') && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                checked={searchState.regexFlags?.includes('m')}
                                onChange={(e) => {
                                    const flags = searchState.regexFlags || [];
                                    updateState({
                                        regexFlags: e.target.checked
                                            ? [...flags, 'm']
                                            : flags.filter(f => f !== 'm')
                                    });
                                }}
                                className="hidden"
                            />
                            <span className={`text-[10px] font-bold uppercase transition-colors ${searchState.regexFlags?.includes('m') ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'
                                }`}>Multiline (m)</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};
import { ChevronDown, Check } from 'lucide-react';
