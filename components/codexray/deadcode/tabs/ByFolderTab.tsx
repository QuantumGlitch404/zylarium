// By Folder Tab - Folder tree view with unused indicators
import React, { useState, useMemo } from 'react';
import { TabProps, FileReachability } from '../types';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, AlertTriangle, X } from 'lucide-react';

// Tree node structure
interface TreeNode {
    name: string;
    path: string;
    isFolder: boolean;
    children: TreeNode[];
    file?: FileReachability;
    unreachableCount: number;
    totalCount: number;
    unreachableSize: number;
}

// Build tree from flat file list
function buildTree(files: FileReachability[]): TreeNode {
    const root: TreeNode = {
        name: 'root',
        path: '',
        isFolder: true,
        children: [],
        unreachableCount: 0,
        totalCount: 0,
        unreachableSize: 0
    };

    for (const file of files) {
        const parts = file.filePath.split('/');
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            const currentPath = parts.slice(0, i + 1).join('/');

            if (isLast) {
                // File
                current.children.push({
                    name: part,
                    path: currentPath,
                    isFolder: false,
                    children: [],
                    file,
                    unreachableCount: 1,
                    totalCount: 1,
                    unreachableSize: file.fileSize
                });
            } else {
                // Folder
                let folder = current.children.find(c => c.isFolder && c.name === part);
                if (!folder) {
                    folder = {
                        name: part,
                        path: currentPath,
                        isFolder: true,
                        children: [],
                        unreachableCount: 0,
                        totalCount: 0,
                        unreachableSize: 0
                    };
                    current.children.push(folder);
                }
                current = folder;
            }
        }
    }

    // Calculate counts recursively
    function calculateCounts(node: TreeNode): void {
        if (!node.isFolder) return;

        node.unreachableCount = 0;
        node.totalCount = 0;
        node.unreachableSize = 0;

        for (const child of node.children) {
            calculateCounts(child);
            node.unreachableCount += child.unreachableCount;
            node.totalCount += child.totalCount;
            node.unreachableSize += child.unreachableSize;
        }
    }

    calculateCounts(root);

    // Sort children (folders first, then alphabetically)
    function sortChildren(node: TreeNode): void {
        node.children.sort((a, b) => {
            if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        for (const child of node.children) {
            if (child.isFolder) sortChildren(child);
        }
    }

    sortChildren(root);

    return root;
}

// Tree Node Component
function TreeNodeComponent({
    node,
    depth = 0,
    onFileClick
}: {
    node: TreeNode;
    depth?: number;
    onFileClick?: (file: FileReachability) => void;
}) {
    const [expanded, setExpanded] = useState(depth < 2);

    const isEntirelyUnused = node.isFolder && node.unreachableCount === node.totalCount && node.totalCount > 0;

    if (node.isFolder) {
        return (
            <div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 transition-colors text-left ${isEntirelyUnused ? 'bg-red-500/10' : ''
                        }`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    {expanded
                        ? <ChevronDown className="w-4 h-4 text-gray-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-500" />
                    }
                    {expanded
                        ? <FolderOpen className="w-4 h-4 text-yellow-400" />
                        : <Folder className="w-4 h-4 text-yellow-400" />
                    }
                    <span className="text-white text-sm">{node.name}</span>

                    <span className="ml-auto flex items-center gap-2">
                        {isEntirelyUnused && (
                            <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                                Entire folder unused
                            </span>
                        )}
                        {node.unreachableCount > 0 && (
                            <span className="text-xs text-red-400">
                                {node.unreachableCount} unused
                            </span>
                        )}
                        <span className="text-xs text-gray-500">
                            ({(node.unreachableSize / 1024).toFixed(0)} KB)
                        </span>
                    </span>
                </button>

                {expanded && (
                    <div>
                        {node.children.map((child, i) => (
                            <TreeNodeComponent
                                key={child.path || i}
                                node={child}
                                depth={depth + 1}
                                onFileClick={onFileClick}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // File node
    const file = node.file!;
    const hasWarnings = file.warnings.length > 0;

    return (
        <button
            onClick={() => onFileClick?.(file)}
            className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 transition-colors text-left group"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
            <span className="w-4" /> {/* Indent placeholder */}
            <File className="w-4 h-4 text-red-400" />
            <span className="text-gray-300 text-sm group-hover:text-white">{node.name}</span>

            <span className="ml-auto flex items-center gap-2">
                {hasWarnings && (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                )}
                <span className={`text-xs font-medium ${file.safeDeleteScore >= 90 ? 'text-green-400' :
                        file.safeDeleteScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                    {file.safeDeleteScore}
                </span>
                <span className="text-xs text-gray-600">
                    {(file.fileSize / 1024).toFixed(0)} KB
                </span>
            </span>
        </button>
    );
}

// File Detail Panel
function FileDetailPanel({
    file,
    onClose
}: {
    file: FileReachability;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-800 p-6 overflow-auto z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">File Details</h3>
                <button onClick={onClose} className="p-1 text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="text-xs text-gray-500">Path</span>
                    <p className="text-sm text-white font-mono break-all">{file.filePath}</p>
                </div>

                <div>
                    <span className="text-xs text-gray-500">Size</span>
                    <p className="text-sm text-white">{(file.fileSize / 1024).toFixed(2)} KB</p>
                </div>

                <div>
                    <span className="text-xs text-gray-500">Safe Score</span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${file.safeDeleteScore >= 90 ? 'bg-green-500' :
                                        file.safeDeleteScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${file.safeDeleteScore}%` }}
                            />
                        </div>
                        <span className={`text-sm font-medium ${file.safeDeleteScore >= 90 ? 'text-green-400' :
                                file.safeDeleteScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {file.safeDeleteScore}/100
                        </span>
                    </div>
                </div>

                <div>
                    <span className="text-xs text-gray-500">Score Factors</span>
                    <ul className="mt-1 space-y-1">
                        {file.safeDeleteReasons.map((reason, i) => (
                            <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                                <span className="text-red-400 text-xs">-{reason.impact}</span>
                                <span>{reason.description}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {file.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <span className="text-xs text-yellow-400 font-medium">Warnings</span>
                        <ul className="mt-1 space-y-1">
                            {file.warnings.map((warning, i) => (
                                <li key={i} className="text-sm text-yellow-200">{warning.message}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ByFolderTab({ result }: TabProps) {
    const [selectedFile, setSelectedFile] = useState<FileReachability | null>(null);

    // Build tree
    const tree = useMemo(() => {
        return buildTree(result.unreachableFiles);
    }, [result.unreachableFiles]);

    // Find entirely unused folders
    const unusedFolders = useMemo(() => {
        const folders: TreeNode[] = [];

        function findUnused(node: TreeNode) {
            if (node.isFolder && node.unreachableCount === node.totalCount && node.totalCount >= 2) {
                folders.push(node);
            } else if (node.isFolder) {
                for (const child of node.children) {
                    findUnused(child);
                }
            }
        }

        for (const child of tree.children) {
            findUnused(child);
        }

        return folders;
    }, [tree]);

    return (
        <div className="space-y-4">
            {/* Insights */}
            {unusedFolders.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-red-300 mb-2">Entirely Unused Folders</h4>
                    <div className="flex flex-wrap gap-2">
                        {unusedFolders.slice(0, 5).map((folder) => (
                            <span
                                key={folder.path}
                                className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded font-mono"
                            >
                                {folder.path} ({folder.totalCount} files)
                            </span>
                        ))}
                        {unusedFolders.length > 5 && (
                            <span className="text-xs text-gray-500">
                                +{unusedFolders.length - 5} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Tree View */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                {tree.children.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No unreachable files found! 🎉</p>
                ) : (
                    <div className="font-mono text-sm">
                        {tree.children.map((child, i) => (
                            <TreeNodeComponent
                                key={child.path || i}
                                node={child}
                                onFileClick={setSelectedFile}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* File Detail Panel */}
            {selectedFile && (
                <FileDetailPanel file={selectedFile} onClose={() => setSelectedFile(null)} />
            )}
        </div>
    );
}
