// Input Section - HTML input methods (paste, upload, URL, folder)

import React, { useState, useRef } from 'react';
import { Code, Upload, Globe, FolderOpen, Play, FileCode, Link2 } from 'lucide-react';
import { InputMethod, InputState } from '../types';

interface InputSectionProps {
    onAnalyze: (htmlContent: string, cssContent: string) => void;
    isAnalyzing: boolean;
}

// Liquid Glass Panel
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

const INPUT_METHODS: { id: InputMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'paste', label: 'Paste HTML', icon: <Code className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload File', icon: <Upload className="w-4 h-4" /> },
    { id: 'url', label: 'Enter URL', icon: <Globe className="w-4 h-4" /> },
    { id: 'folder', label: 'Upload Folder', icon: <FolderOpen className="w-4 h-4" /> },
];

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
    const [method, setMethod] = useState<InputMethod>('paste');
    const [htmlContent, setHtmlContent] = useState('');
    const [cssContent, setCssContent] = useState('');
    const [url, setUrl] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);

    const [parseEmbeddedStyles, setParseEmbeddedStyles] = useState(true);
    const [parseLinkedStylesheets, setParseLinkedStylesheets] = useState(true);
    const [includeInlineStyles, setIncludeInlineStyles] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const content = await file.text();
        setHtmlContent(content);
        setFileName(file.name);
    };

    const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        let html = '';
        let css = '';

        for (const file of files) {
            const content = await file.text();
            if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
                html += content + '\n';
            } else if (file.name.endsWith('.css')) {
                css += content + '\n';
            }
        }

        setHtmlContent(html);
        setCssContent(css);
        setFileName(`${files.length} files`);
    };

    const handleUrlFetch = async () => {
        if (!url) return;

        try {
            // Note: This will only work for CORS-enabled URLs
            const response = await fetch(url);
            const content = await response.text();
            setHtmlContent(content);
            setFileName(url);
        } catch (error) {
            alert('Failed to fetch URL. The server may not allow CORS requests.');
        }
    };

    const handleAnalyze = () => {
        if (!htmlContent.trim()) {
            alert('Please provide HTML content to analyze');
            return;
        }
        onAnalyze(htmlContent, cssContent);
    };

    const lineCount = htmlContent.split('\n').length;
    const charCount = htmlContent.length;

    return (
        <GlassPanel className="p-6">
            {/* Method Tabs */}
            <div className="flex gap-2 mb-6">
                {INPUT_METHODS.map(m => (
                    <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${method === m.id
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {m.icon}
                        <span className="text-sm font-medium">{m.label}</span>
                    </button>
                ))}
            </div>

            {/* Paste HTML */}
            {method === 'paste' && (
                <div className="space-y-4">
                    <div className="relative">
                        <textarea
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                            placeholder={`Paste your HTML here...

<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <div class="card">...</div>
  </body>
</html>`}
                            className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                            {lineCount} lines • {charCount.toLocaleString()} characters
                        </div>
                    </div>

                    {/* Optional CSS */}
                    <details className="group">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white flex items-center gap-2">
                            <FileCode className="w-4 h-4" />
                            Add CSS (optional)
                        </summary>
                        <textarea
                            value={cssContent}
                            onChange={(e) => setCssContent(e.target.value)}
                            placeholder="Paste CSS styles here..."
                            className="mt-2 w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                        />
                    </details>
                </div>
            )}

            {/* Upload File */}
            {method === 'upload' && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all"
                >
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                        {fileName || 'Drop HTML/CSS files here or click to browse'}
                    </p>
                    <p className="text-xs text-gray-600">Accepts .html, .htm, .css files</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".html,.htm,.css"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>
            )}

            {/* Enter URL */}
            {method === 'url' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link2 className="absolute left-4 top-3 w-4 h-4 text-gray-500" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/page.html"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <button
                            onClick={handleUrlFetch}
                            className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:bg-white/20 transition-colors"
                        >
                            Fetch
                        </button>
                    </div>

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <p className="text-sm text-yellow-300">
                            ⚠️ URL fetching only works for pages with CORS enabled. For most websites, please copy the page source manually.
                        </p>
                    </div>

                    {htmlContent && (
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                            <p className="text-sm text-green-300">
                                ✓ Fetched {charCount.toLocaleString()} characters from {fileName}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Folder */}
            {method === 'folder' && (
                <div
                    onClick={() => folderInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all"
                >
                    <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                        {fileName || 'Select a folder with HTML/CSS files'}
                    </p>
                    <p className="text-xs text-gray-600">All .html and .css files will be analyzed</p>
                    <input
                        ref={folderInputRef}
                        type="file"
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFolderUpload}
                        className="hidden"
                    />
                </div>
            )}

            {/* CSS Options */}
            <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Include CSS</h4>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={parseEmbeddedStyles}
                            onChange={(e) => setParseEmbeddedStyles(e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-400">Parse embedded &lt;style&gt; tags</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={parseLinkedStylesheets}
                            onChange={(e) => setParseLinkedStylesheets(e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-400">Parse linked stylesheets</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeInlineStyles}
                            onChange={(e) => setIncludeInlineStyles(e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-400">Include inline styles</span>
                    </label>
                </div>
            </div>

            {/* Analyze Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !htmlContent.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play className="w-5 h-5" />
                    Analyze Components
                </button>
            </div>
        </GlassPanel>
    );
};

export default InputSection;
