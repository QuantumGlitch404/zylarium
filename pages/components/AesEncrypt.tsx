import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';

// Web Crypto AES-GCM encryption
async function aesEncrypt(plaintext: string, password: string, bits: 128 | 192 | 256): Promise<string> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: bits },
        false,
        ['encrypt']
    );
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    // Pack: salt(16) + iv(12) + ciphertext
    const packed = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
    packed.set(salt, 0);
    packed.set(iv, salt.length);
    packed.set(new Uint8Array(ciphertext), salt.length + iv.length);
    return btoa(String.fromCharCode(...packed));
}

type Strength = 128 | 192 | 256;

const AesEncrypt: React.FC = () => {
    const [plaintext, setPlaintext] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [strength, setStrength] = useState<Strength>(256);
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleEncrypt = useCallback(async () => {
        if (!plaintext || !password) { setError('Both text and key are required'); return; }
        if (typeof crypto === 'undefined' || !crypto.subtle) {
            setError('Encryption requires HTTPS or localhost (Web Crypto API unavailable).');
            return;
        }
        setLoading(true); setError(''); setOutput('');
        try {
            const result = await aesEncrypt(plaintext, password, strength);
            setOutput(result);
        } catch (e: any) {
            setError(e.message || 'Encryption failed');
        }
        setLoading(false);
    }, [plaintext, password, strength]);

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
                    <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">AES Encryption</span>
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                        {([128, 192, 256] as Strength[]).map(b => (
                            <button key={b} onClick={() => setStrength(b)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${strength === b
                                    ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                AES-{b}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Key input */}
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 block">Secret Key</label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your secret key..."
                                className="w-full pl-10 pr-10 py-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all" />
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                            <button onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Plaintext */}
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 block">Plaintext</label>
                        <textarea value={plaintext} onChange={(e) => setPlaintext(e.target.value)}
                            placeholder="Enter text to encrypt..."
                            className="w-full h-40 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none transition-all" />
                    </div>

                    <button onClick={handleEncrypt} disabled={loading || !plaintext || !password}
                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Encrypting...</>
                        ) : (
                            <><Lock className="w-4 h-4" /> Encrypt</>
                        )}
                    </button>

                    {/* Output */}
                    {output && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Encrypted Output (Base64)</label>
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
        </div>
    );
};

export default AesEncrypt;
