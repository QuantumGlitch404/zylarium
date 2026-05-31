// DOM Tree Tab - Collapsible tree view of DOM structure

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, Eye, EyeOff, FileCode } from 'lucide-react';
import { DOMStructure, DetectedComponent, AnalysisResult } from '../types';
import { getElementSelector } from '../engine/HTMLParser';

interface DOMTreeTabProps {
    result: AnalysisResult;
    selectedComponent: DetectedComponent | null;
    onSelectComponent: (component: DetectedComponent | null) => void;
}

// Liquid Glass Panel
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

interface TreeNodeProps {
    node: DOMStructure;
    depth: number;
    expandedNodes: Set<string>;
    toggleExpand: (id: string) => void;
    showAttributes: boolean;
    hideTextNodes: boolean;
    showComponentMarkers: boolean;
    components: DetectedComponent[];
    searchTerm: string;
    selectedComponent: DetectedComponent | null;
    onSelectComponent: (component: DetectedComponent | null) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
    node,
    depth,
    expandedNodes,
    toggleExpand,
    showAttributes,
    hideTextNodes,
    showComponentMarkers,
    components,
    searchTerm,
    selectedComponent,
    onSelectComponent,
}) => {
    const nodeId = `${node.tag}-${node.classes.join('-')}-${depth}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children.length > 0;

    // Check if this node matches a component
    const matchingComponent = components.find(c =>
        c.rootSelector === getElementSelector(node)
    );

    // Check if matches search
    const matchesSearch = searchTerm && (
        node.tag.includes(searchTerm.toLowerCase()) ||
        node.classes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (node.id && node.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Skip text-only nodes if hideTextNodes is true
    if (hideTextNodes && node.children.length === 0 && !node.classes.length && node.tag === '#text') {
        return null;
    }

    const selector = getElementSelector(node);

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-1 py-1 px-2 rounded-lg cursor-pointer transition-colors ${matchesSearch ? 'bg-yellow-500/20' : ''
                    } ${matchingComponent && selectedComponent?.id === matchingComponent.id
                        ? 'bg-indigo-500/20 ring-1 ring-indigo-500/50'
                        : 'hover:bg-white/10'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => {
                    if (hasChildren) toggleExpand(nodeId);
                    if (matchingComponent) onSelectComponent(matchingComponent);
                }}
            >
                {/* Expand/Collapse icon */}
                {hasChildren ? (
                    isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )
                ) : (
                    <span className="w-4 flex-shrink-0" />
                )}

                {/* Tag name */}
                <span className="text-purple-400 font-mono text-sm">{node.tag}</span>

                {/* ID */}
                {node.id && (
                    <span className="text-blue-400 font-mono text-sm">#{node.id}</span>
                )}

                {/* Classes */}
                {node.classes.length > 0 && (
                    <span className="text-green-400 font-mono text-sm">
                        .{node.classes.slice(0, 3).join('.')}
                        {node.classes.length > 3 && <span className="text-gray-500">+{node.classes.length - 3}</span>}
                    </span>
                )}

                {/* Attributes */}
                {showAttributes && Object.keys(node.attributes).length > 0 && (
                    <span className="text-gray-500 font-mono text-xs ml-2">
                        [{Object.keys(node.attributes).slice(0, 2).join(', ')}]
                    </span>
                )}

                {/* Component marker */}
                {showComponentMarkers && matchingComponent && (
                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${matchingComponent.type === 'repeated'
                            ? 'bg-blue-500/20 text-blue-400'
                            : matchingComponent.type === 'layout'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-purple-500/20 text-purple-400'
                        }`}>
                        [Component: {matchingComponent.name}]
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {node.children.map((child, i) => (
                        <TreeNode
                            key={`${nodeId}-${i}`}
                            node={child}
                            depth={depth + 1}
                            expandedNodes={expandedNodes}
                            toggleExpand={toggleExpand}
                            showAttributes={showAttributes}
                            hideTextNodes={hideTextNodes}
                            showComponentMarkers={showComponentMarkers}
                            components={components}
                            searchTerm={searchTerm}
                            selectedComponent={selectedComponent}
                            onSelectComponent={onSelectComponent}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const DOMTreeTab: React.FC<DOMTreeTabProps> = ({
    result,
    selectedComponent,
    onSelectComponent,
}) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['body-0', 'html-0']));
    const [searchTerm, setSearchTerm] = useState('');
    const [showComponentMarkers, setShowComponentMarkers] = useState(true);
    const [showAttributes, setShowAttributes] = useState(false);
    const [hideTextNodes, setHideTextNodes] = useState(false);

    const toggleExpand = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const expandAll = () => {
        const allIds = new Set<string>();
        function collect(node: DOMStructure, depth: number) {
            const id = `${node.tag}-${node.classes.join('-')}-${depth}`;
            allIds.add(id);
            node.children.forEach(c => collect(c, depth + 1));
        }
        collect(result.parsedDOM.root, 0);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    return (
        <div className="flex flex-col h-full">
            {/* Controls */}
            <GlassPanel className="p-4 mb-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showComponentMarkers}
                                onChange={(e) => setShowComponentMarkers(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-400">Component markers</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showAttributes}
                                onChange={(e) => setShowAttributes(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-400">Attributes</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hideTextNodes}
                                onChange={(e) => setHideTextNodes(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-400">Hide text</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={expandAll}
                            className="px-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:bg-white/20 transition-colors"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>
            </GlassPanel>

            {/* Tree View */}
            <GlassPanel className="flex-1 overflow-auto p-4">
                <TreeNode
                    node={result.parsedDOM.root}
                    depth={0}
                    expandedNodes={expandedNodes}
                    toggleExpand={toggleExpand}
                    showAttributes={showAttributes}
                    hideTextNodes={hideTextNodes}
                    showComponentMarkers={showComponentMarkers}
                    components={result.components}
                    searchTerm={searchTerm}
                    selectedComponent={selectedComponent}
                    onSelectComponent={onSelectComponent}
                />
            </GlassPanel>
        </div>
    );
};

export default DOMTreeTab;
