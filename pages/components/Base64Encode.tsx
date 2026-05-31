import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2, AlertTriangle } from 'lucide-react';

const Base64Encode: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const encode = useCallback((text: string) => {
        setInput(text);
        setError('');
        if (!text) { setOutput(''); return; }
        try {
            // Check for characters that can't be encoded
            const encoded = btoa(unescape(encodeURIComponent(text)));
            setOutput(encoded);
        } catch (e: any) {
            setError('Invalid characters detected');
            setOutput('');
        }
    }, []);

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">Text → Base64</span>
                    <button
                        onClick={() => { setInput(''); setOutput(''); setError(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-4 space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Input Text</label>
                        <textarea
                            value={input}
                            onChange={(e) => encode(e.target.value)}
                            placeholder="Type or paste text here..."
                            className="w-full h-64 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none text-white placeholder-gray-500 transition-all"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{input.length} characters</span>
                            <span>{new Blob([input]).size} bytes</span>
                        </div>
                    </div>

                    <div className="p-4 space-y-2 bg-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Base64 Output</label>
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                className="flex items-center gap-1.5 p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                                title="Copy"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={output}
                            className="w-full h-64 p-3 bg-transparent border border-white/10 rounded-xl font-mono text-sm resize-none text-white focus:outline-none"
                        />
                        {error && (
                            <div className="p-3 bg-red-500/10 backdrop-blur-md text-red-300 text-xs rounded-lg border border-red-500/20 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                                {error}
                            </div>
                        )}
                        {output && (
                            <div className="text-xs text-gray-500">{output.length} characters encoded</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Base64Encode;
