import React, { useState, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react';

const HtmlDecode: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const decoderRef = useRef(document.createElement('textarea'));

    const decode = useCallback((text: string) => {
        setInput(text);
        if (!text) { setOutput(''); return; }
        // Use textarea trick to decode HTML entities safely — handles nested encoding too
        let decoded = text;
        let prev = '';
        let iterations = 0;
        while (decoded !== prev && iterations < 5) {
            prev = decoded;
            decoderRef.current.innerHTML = decoded;
            decoded = decoderRef.current.value;
            iterations++;
        }
        setOutput(decoded);
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
                    <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">HTML Entities → Decoded</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showPreview ? 'Raw' : 'Render Preview'}
                        </button>
                        <button onClick={() => { setInput(''); setOutput(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> Clear
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-4 space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Encoded HTML Input</label>
                        <textarea value={input} onChange={(e) => decode(e.target.value)}
                            placeholder="&lt;p&gt;Hello &amp; World&lt;/p&gt;"
                            className="w-full h-64 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none text-white placeholder-gray-500 transition-all" />
                    </div>

                    <div className="p-4 space-y-2 bg-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                                {showPreview ? 'Rendered Preview' : 'Decoded Output'}
                            </label>
                            <button onClick={handleCopy} disabled={!output}
                                className="flex items-center gap-1.5 p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-30">
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        {showPreview ? (
                            <div className="w-full h-64 p-3 bg-white rounded-xl text-sm overflow-auto text-gray-900"
                                dangerouslySetInnerHTML={{ __html: output }} />
                        ) : (
                            <textarea readOnly value={output}
                                className="w-full h-64 p-3 bg-transparent border border-white/10 rounded-xl font-mono text-sm resize-none text-white focus:outline-none" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HtmlDecode;
