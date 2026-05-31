import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2, Info } from 'lucide-react';

const Sha256Hash: React.FC = () => {
    const [input, setInput] = useState('');
    const [hash, setHash] = useState('');
    const [copied, setCopied] = useState(false);

    const generateHash = useCallback(async (text: string) => {
        setInput(text);
        if (!text) { setHash(''); return; }
        if (typeof crypto === 'undefined' || !crypto.subtle) {
            setHash('Error: Web Crypto API requires HTTPS or localhost');
            return;
        }
        try {
            const msgBuffer = new TextEncoder().encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            setHash(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
        } catch {
            setHash('Error generating hash');
        }
    }, []);

    const handleCopy = () => {
        if (!hash) return;
        navigator.clipboard.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">SHA-256 Hash Generator</span>
                    <button onClick={() => { setInput(''); setHash(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 block">Input Text</label>
                        <textarea value={input} onChange={(e) => generateHash(e.target.value)}
                            placeholder="Type text to hash in real-time..."
                            className="w-full h-40 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none transition-all" />
                    </div>

                    {hash && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">SHA-256 Hash</label>
                                <button onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10">
                                    {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                                </button>
                            </div>
                            <div className="p-4 bg-black/30 border border-white/10 rounded-xl font-mono text-sm text-primary-300 break-all leading-relaxed select-all">
                                {hash}
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Info className="w-3 h-3" /> {hash.length} characters</span>
                                <span>{hash.length * 4} bits</span>
                                <span>Hex encoding</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <h3 className="text-blue-400 font-bold mb-1">About SHA-256</h3>
                <p className="text-gray-400 text-sm">Part of the SHA-2 family. Produces a fixed 256-bit (32-byte) hash. Widely used in blockchain, TLS certificates, and password hashing. Irreversible — you cannot recover the original text from the hash.</p>
            </div>
        </div>
    );
};

export default Sha256Hash;
