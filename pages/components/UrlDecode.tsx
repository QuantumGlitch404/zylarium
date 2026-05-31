import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2, AlertTriangle } from 'lucide-react';

const UrlDecode: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [params, setParams] = useState<[string, string][]>([]);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const decode = useCallback((text: string) => {
        setInput(text);
        setError('');
        setParams([]);
        if (!text.trim()) { setOutput(''); return; }
        try {
            const decoded = decodeURIComponent(text.trim());
            setOutput(decoded);
            // Extract query params if URL
            try {
                const urlObj = new URL(decoded.startsWith('http') ? decoded : 'http://x.com?' + decoded);
                const p: [string, string][] = [];
                urlObj.searchParams.forEach((v, k) => p.push([k, v]));
                if (p.length > 0) setParams(p);
            } catch { /* not a valid URL, that's fine */ }
        } catch {
            setError('Malformed URL encoding — some characters could not be decoded');
            // Try partial decode
            try { setOutput(unescape(text.trim())); } catch { setOutput(text); }
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
                    <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">URL Decode</span>
                    <button onClick={() => { setInput(''); setOutput(''); setError(''); setParams([]); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-4 space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Encoded Input</label>
                        <textarea value={input} onChange={(e) => decode(e.target.value)}
                            placeholder="Paste encoded URL here... e.g. hello%20world%21"
                            className="w-full h-64 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none text-white placeholder-gray-500 transition-all" />
                    </div>

                    <div className="p-4 space-y-2 bg-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Decoded Output</label>
                            <button onClick={handleCopy} disabled={!output}
                                className="flex items-center gap-1.5 p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-30">
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <textarea readOnly value={output}
                            className="w-full h-64 p-3 bg-transparent border border-white/10 rounded-xl font-mono text-sm resize-none text-white focus:outline-none" />
                        {error && (
                            <div className="p-3 bg-yellow-500/10 backdrop-blur-md text-yellow-300 text-xs rounded-lg border border-yellow-500/20 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />{error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {params.length > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/10">
                        <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">Query Parameters</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {params.map(([key, val], i) => (
                            <div key={i} className="flex items-center px-4 py-3 hover:bg-white/5 transition-colors">
                                <span className="text-primary-300 font-mono text-sm font-semibold min-w-[120px]">{key}</span>
                                <span className="text-gray-500 mx-2">=</span>
                                <span className="text-white font-mono text-sm flex-1 break-all">{val}</span>
                                <button onClick={() => navigator.clipboard.writeText(val)}
                                    className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors ml-2">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UrlDecode;
