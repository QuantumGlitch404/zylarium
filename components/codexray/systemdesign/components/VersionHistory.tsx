
import React from 'react';
import { DesignVersion, SystemDesign } from '../types';
import { History, RotateCcw, Save } from 'lucide-react';

interface VersionHistoryProps {
    currentVersion: number;
    onSaveSnapshot: () => void;
    onRestoreVersion: (version: SystemDesign) => void;
}

// Mock versions for UI since we don't have real backend persistence yet
const MOCK_VERSIONS: DesignVersion[] = [
    {
        id: 'v1',
        designId: '1',
        version: 1,
        createdAt: new Date(Date.now() - 86400000),
        name: 'Initial Design',
        description: 'Basic setup',
        snapshot: {} as any,
        changes: []
    }
];

export const VersionHistory: React.FC<VersionHistoryProps> = ({
    currentVersion,
    onSaveSnapshot,
    onRestoreVersion
}) => {
    return (
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase">Version History</h3>
                <button
                    onClick={onSaveSnapshot}
                    className="flex items-center gap-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white"
                >
                    <Save className="w-3 h-3" /> Snapshot
                </button>
            </div>

            <div className="space-y-4">
                {MOCK_VERSIONS.map((v) => (
                    <div key={v.id} className="relative pl-4 border-l-2 border-gray-700">
                        <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${v.version === currentVersion ? 'bg-indigo-500 ring-4 ring-indigo-900' : 'bg-gray-600'}`} />

                        <div className="mb-1 flex justify-between items-start">
                            <span className="text-sm font-medium text-white">v{v.version} - {v.name}</span>
                            {v.version !== currentVersion && (
                                <button title="Restore" className="text-gray-500 hover:text-white">
                                    <RotateCcw className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                            {v.createdAt.toLocaleDateString()} {v.createdAt.toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-gray-400 italic">
                            {v.description}
                        </div>
                    </div>
                ))}

                {/* Current Unsaved Indicator */}
                <div className="relative pl-4 border-l-2 border-indigo-500/50">
                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <div className="text-sm font-bold text-indigo-400">Current (Unsaved)</div>
                    <div className="text-xs text-gray-500">Just now</div>
                </div>
            </div>
        </div>
    );
};
