import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2, AlertTriangle, Unlock, Eye, EyeOff } from 'lucide-react';

// Web Crypto AES-GCM decryption (must match AesEncrypt packing format)
async function aesDecrypt(ciphertextB64: string, password: string): Promise<string> {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const packed = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
    const salt = packed.slice(0, 16);
    const iv = packed.slice(16, 28);
    const ciphertext = packed.slice(28);
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);

    // Try all key lengths
    const lengths: number[] = [256, 192, 128];
    for (const length of lengths) {
        try {
            const key = await crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
                keyMaterial,
                { name: 'AES-GCM', length },
                false,
                ['decrypt']
            );
            const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
            return dec.decode(plainBuffer);
        } catch { /* try next key length */ }
    }
    throw new Error('Decryption failed — wrong key or corrupted data');
}

const AesDecrypt: React.FC = () => {
    const [ciphertext, setCiphertext] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleDecrypt = useCallback(async () => {
        if (!ciphertext.trim() || !password) { setError('Both encrypted text and key are required'); return; }
        if (typeof crypto === 'undefined' || !crypto.subtle) {
            setError('Decryption requires HTTPS or localhost (Web Crypto API unavailable).');
            return;
        }
        setLoading(true); setError(''); setOutput('');
        try {
            const result = await aesDecrypt(ciphertext.trim(), password);
            setOutput(result);
        } catch (e: any) {
            setError(e.message || 'Decryption failed — wrong key or invalid data');
        }
        setLoading(false);
    }, [ciphertext, password]);

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
                    <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">AES Decryption</span>
                    <button onClick={() => { setCiphertext(''); setPassword(''); setOutput(''); setError(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Key input */}
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 block">Secret Key</label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter the same key used for encryption..."
                                className="w-full pl-10 pr-10 py-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all" />
                            <Unlock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                            <button onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Ciphertext */}
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 block">Encrypted Text (Base64)</label>
                        <textarea value={ciphertext} onChange={(e) => setCiphertext(e.target.value)}
                            placeholder="Paste the encrypted Base64 string here..."
                            className="w-full h-40 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none transition-all" />
                    </div>

                    <button onClick={handleDecrypt} disabled={loading || !ciphertext.trim() || !password}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Decrypting...</>
                        ) : (
                            <><Unlock className="w-4 h-4" /> Decrypt</>
                        )}
                    </button>

                    {/* Output */}
                    {output && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Decrypted Text</label>
                                <button onClick={handleCopy}
                                    className="flex items-center gap-1.5 p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <textarea readOnly value={output}
                                className="w-full h-32 p-3 bg-green-500/5 border border-green-500/20 rounded-xl font-mono text-sm resize-none text-green-300 focus:outline-none" />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-300 text-xs rounded-lg border border-red-500/20 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />{error}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/20 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200">Auto-detects encryption strength (128/192/256-bit). Uses the same key entered during encryption.</p>
            </div>
        </div>
    );
};

export default AesDecrypt;
