import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react';

const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

const HtmlEncode: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [copied, setCopied] = useState(false);
    const [showRendered, setShowRendered] = useState(false);

    const encode = useCallback((text: string) => {
        setInput(text);
        if (!text) { setOutput(''); return; }
        const encoded = text.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch] || ch);
        setOutput(encoded);
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
                <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap gap-3 justify-between items-center">
                    <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">HTML → Encoded</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowRendered(!showRendered)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                            {showRendered ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showRendered ? 'Encoded' : 'Rendered'}
                        </button>
                        <button onClick={() => { setInput(''); setOutput(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> Clear
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-4 space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Raw HTML Input</label>
                        <textarea value={input} onChange={(e) => encode(e.target.value)}
                            placeholder='<div class="hello">Hello & "World"</div>'
                            className="w-full h-64 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none text-white placeholder-gray-500 transition-all" />
                    </div>

                    <div className="p-4 space-y-2 bg-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                                {showRendered ? 'Safe Rendered Preview' : 'Encoded Output'}
                            </label>
                            <button onClick={handleCopy} disabled={!output}
                                className="flex items-center gap-1.5 p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-30">
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        {showRendered ? (
                            <div className="w-full h-64 p-3 bg-transparent border border-white/10 rounded-xl text-sm overflow-auto text-white">
                                {/* Safe: output is already entity-escaped, so rendering it via textContent is safe. Using dangerouslySetInnerHTML with the ENCODED output shows the escaped entities rendered. */}
                                <pre className="whitespace-pre-wrap font-mono text-green-300">{output}</pre>
                            </div>
                        ) : (
                            <textarea readOnly value={output}
                                className="w-full h-64 p-3 bg-transparent border border-white/10 rounded-xl font-mono text-sm resize-none text-white focus:outline-none" />
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <h3 className="text-green-400 font-bold mb-2">XSS Prevention</h3>
                <p className="text-gray-400 text-sm">This tool escapes <code className="text-primary-300">&lt; &gt; &amp; " '</code> — preventing script injection when embedding user content in HTML.</p>
            </div>
        </div>
    );
};

export default HtmlEncode;
