// By Type Tab - Files grouped by type
import React, { useState, useMemo } from 'react';
import { TabProps, FileReachability, FileType } from '../types';
import { ChevronDown, ChevronRight, FileCode, Image, FileType as FileTypeIcon, Eye, Link2, Check, AlertTriangle, Search } from 'lucide-react';

// Score color helper
const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
};

const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
};

const getTypeIcon = (type: FileType) => {
    switch (type) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return <FileCode className="w-4 h-4 text-yellow-400" />;
        case 'css':
        case 'scss':
        case 'less':
            return <FileTypeIcon className="w-4 h-4 text-blue-400" />;
        case 'image':
        case 'icon':
            return <Image className="w-4 h-4 text-purple-400" />;
        default:
            return <FileTypeIcon className="w-4 h-4 text-gray-400" />;
    }
};

// File Card Component
function FileCard({ file, onMarkAsUsed }: { file: FileReachability; onMarkAsUsed?: () => void }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-start gap-3">
                <div className="mt-1">{getTypeIcon(file.fileType)}</div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white truncate" title={file.filePath}>
                            {file.filePath}
                        </span>
                        {file.warnings.length > 0 && (
                            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        )}
                    </div>

                    {/* Score Bar */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">Safe Score:</span>
                        <div className={`text-sm font-medium ${getScoreColor(file.safeDeleteScore)}`}>
                            {file.safeDeleteScore}/100
                        </div>
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-32">
                            <div
                                className={`h-full rounded-full ${getScoreBarColor(file.safeDeleteScore)}`}
                                style={{ width: `${file.safeDeleteScore}%` }}
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-gray-500 mt-1">
                        {file.safeDeleteReasons[0]?.description || 'No references found'}
                    </p>

                    {/* Expanded Details */}
                    {expanded && (
                        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                            <div className="text-xs">
                                <span className="text-gray-500">Size: </span>
                                <span className="text-gray-300">{(file.fileSize / 1024).toFixed(1)} KB</span>
                            </div>
                            {file.safeDeleteReasons.length > 1 && (
                                <div className="text-xs">
                                    <span className="text-gray-500">All factors:</span>
                                    <ul className="mt-1 space-y-1">
                                        {file.safeDeleteReasons.map((reason, i) => (
                                            <li key={i} className="text-gray-400 flex items-center gap-1">
                                                <span className="text-red-400">-{reason.impact}</span>
                                                <span>{reason.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-gray-500">
                        {(file.fileSize / 1024).toFixed(0)} KB
                    </span>

                    <div className="flex gap-1">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            title="View References"
                        >
                            <Link2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onMarkAsUsed}
                            className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                            title="Mark as Used"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Type Section Component
function TypeSection({
    type,
    files,
    totalSize
}: {
    type: string;
    files: FileReachability[];
    totalSize: number;
}) {
    const [expanded, setExpanded] = useState(true);

    const displayType = type.toUpperCase();
    const typeNames: Record<string, string> = {
        'js': 'JavaScript',
        'jsx': 'JavaScript (JSX)',
        'ts': 'TypeScript',
        'tsx': 'TypeScript (TSX)',
        'css': 'CSS',
        'scss': 'SCSS',
        'image': 'Images',
        'font': 'Fonts',
        'icon': 'Icons',
        'other': 'Other'
    };

    return (
        <div className="mb-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-white">{typeNames[type] || type.toUpperCase()}</span>
                <span className="text-gray-500">({files.length} files, {(totalSize / 1024 / 1024).toFixed(2)} MB)</span>
            </button>

            {expanded && (
                <div className="mt-2 space-y-2 pl-4">
                    {files.map((file) => (
                        <FileCard key={file.fileId} file={file} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ByTypeTab({ result }: TabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    // Group files by type
    const groupedFiles = useMemo(() => {
        const groups = new Map<string, FileReachability[]>();

        for (const file of result.unreachableFiles) {
            // Apply filters
            if (searchTerm && !file.filePath.toLowerCase().includes(searchTerm.toLowerCase())) {
                continue;
            }
            if (scoreFilter === 'high' && file.safeDeleteScore < 90) continue;
            if (scoreFilter === 'medium' && (file.safeDeleteScore < 60 || file.safeDeleteScore >= 90)) continue;
            if (scoreFilter === 'low' && file.safeDeleteScore >= 60) continue;

            const type = file.fileType;
            if (!groups.has(type)) {
                groups.set(type, []);
            }
            groups.get(type)!.push(file);
        }

        // Sort by size within each group
        for (const files of groups.values()) {
            files.sort((a, b) => b.fileSize - a.fileSize);
        }

        return groups;
    }, [result.unreachableFiles, searchTerm, scoreFilter]);

    // Calculate total size per type
    const typeSizes = useMemo(() => {
        const sizes = new Map<string, number>();
        for (const [type, files] of groupedFiles) {
            sizes.set(type, files.reduce((sum, f) => sum + f.fileSize, 0));
        }
        return sizes;
    }, [groupedFiles]);

    // Sort types by size
    const sortedTypes = useMemo(() => {
        return Array.from(groupedFiles.keys()).sort((a, b) =>
            (typeSizes.get(b) || 0) - (typeSizes.get(a) || 0)
        );
    }, [groupedFiles, typeSizes]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="flex-1 min-w-48 relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                </div>

                <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value as any)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                    <option value="all">All Scores</option>
                    <option value="high">High (90+)</option>
                    <option value="medium">Medium (60-89)</option>
                    <option value="low">Low (0-59)</option>
                </select>
            </div>

            {/* Type Sections */}
            {sortedTypes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    {searchTerm || scoreFilter !== 'all'
                        ? 'No files match your filters'
                        : 'No unreachable files found! 🎉'}
                </div>
            ) : (
                sortedTypes.map((type) => (
                    <TypeSection
                        key={type}
                        type={type}
                        files={groupedFiles.get(type) || []}
                        totalSize={typeSizes.get(type) || 0}
                    />
                ))
            )}
        </div>
    );
}
