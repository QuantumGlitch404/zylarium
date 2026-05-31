import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';

type EncodeType = 'component' | 'full';

const UrlEncode: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [encodeType, setEncodeType] = useState<EncodeType>('component');
    const [copied, setCopied] = useState(false);

    const encode = useCallback((text: string, type: EncodeType) => {
        setInput(text);
        if (!text) { setOutput(''); return; }
        try {
            setOutput(type === 'component' ? encodeURIComponent(text) : encodeURI(text));
        } catch {
            setOutput('Encoding error');
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
                <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap gap-3 justify-between items-center">
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                        {(['component', 'full'] as EncodeType[]).map(t => (
                            <button key={t} onClick={() => { setEncodeType(t); encode(input, t); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${encodeType === t
                                    ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                {t === 'component' ? 'Component' : 'Full URL'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => { setInput(''); setOutput(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-4 space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Input URL / String</label>
                        <textarea value={input} onChange={(e) => encode(e.target.value, encodeType)}
                            placeholder="https://example.com/path?q=hello world&lang=en"
                            className="w-full h-64 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none text-white placeholder-gray-500 transition-all" />
                    </div>

                    <div className="p-4 space-y-2 bg-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Encoded Output</label>
                            <button onClick={handleCopy} disabled={!output}
                                className="flex items-center gap-1.5 p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-30">
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <textarea readOnly value={output}
                            className="w-full h-64 p-3 bg-transparent border border-white/10 rounded-xl font-mono text-sm resize-none text-white focus:outline-none" />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <h3 className="text-blue-400 font-bold mb-1">encodeURIComponent</h3>
                    <p className="text-gray-400 text-sm">Encodes everything except: <code className="text-primary-300">A-Z a-z 0-9 - _ . ! ~ * ' ( )</code></p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <h3 className="text-purple-400 font-bold mb-1">encodeURI</h3>
                    <p className="text-gray-400 text-sm">Preserves URL structure characters: <code className="text-primary-300">: / ? # [ ] @ ! $ & ' ( ) * + , ; =</code></p>
                </div>
            </div>
        </div>
    );
};

export default UrlEncode;
