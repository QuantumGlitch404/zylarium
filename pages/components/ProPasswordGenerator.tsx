import React, { useState, useEffect, useCallback } from 'react';
import { Lock, RefreshCw, Copy, Check, Shield, Circle, Settings, Eye, EyeOff, Save, Key } from 'lucide-react';

const ProPasswordGenerator: React.FC = () => {
    // --- State ---
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [useUpper, setUseUpper] = useState(true);
    const [useLower, setUseLower] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Entropy & Strength
    const [entropy, setEntropy] = useState(0);
    const [strengthLabel, setStrengthLabel] = useState('Weak');
    const [crackTime, setCrackTime] = useState('Instant');

    // --- Logic ---

    const calculateEntropy = useCallback((pwd: string) => {
        if (!pwd) return 0;
        let poolSize = 0;
        if (useLower) poolSize += 26;
        if (useUpper) poolSize += 26;
        if (useNumbers) poolSize += 10;
        if (useSymbols) poolSize += 32;
        if (poolSize === 0) return 0;

        const ent = pwd.length * Math.log2(poolSize);
        return Math.round(ent);
    }, [useLower, useUpper, useNumbers, useSymbols]);

    const estimateCrackTime = (bits: number) => {
        // Assume attacker can guess 100 billion passwords per second (fast GPU array)
        // 100e9 guesses/sec
        // Time = 2^bits / 100e9
        if (bits <= 0) return 'Instant';
        const seconds = Math.pow(2, bits) / 100e9;

        if (seconds < 1) return 'Instant';
        if (seconds < 60) return `${Math.round(seconds)} seconds`;
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
        if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
        if (seconds < 315360000000) return `${Math.round(seconds / 3153600000)} centuries`;
        return 'Eons';
    };

    const generatePassword = useCallback(() => {
        let charset = '';
        if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (useNumbers) charset += '0123456789';
        if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (charset === '') {
            setPassword('');
            setEntropy(0);
            return;
        }

        // Cryptographically secure generation
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        let newPassword = '';
        for (let i = 0; i < length; i++) {
            newPassword += charset[array[i] % charset.length];
        }

        setPassword(newPassword);
        const ent = calculateEntropy(newPassword);
        setEntropy(ent);
        setCrackTime(estimateCrackTime(ent));

        // Strength label
        if (ent < 28) setStrengthLabel('Very Weak');
        else if (ent < 36) setStrengthLabel('Weak');
        else if (ent < 60) setStrengthLabel('Reasonable');
        else if (ent < 80) setStrengthLabel('Strong');
        else if (ent < 120) setStrengthLabel('Very Strong');
        else setStrengthLabel('Overkill');

    }, [length, useUpper, useLower, useNumbers, useSymbols, calculateEntropy]);

    // Initial generate
    useEffect(() => {
        generatePassword();
    }, [generatePassword]);

    // Copy handler
    const handleCopy = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Preset handlers
    const applyPreset = (preset: 'banking' | 'corporate' | 'dev' | 'max') => {
        switch (preset) {
            case 'banking':
                setLength(12);
                setUseUpper(true); setUseLower(true); setUseNumbers(true); setUseSymbols(false);
                break;
            case 'corporate':
                setLength(10);
                setUseUpper(true); setUseLower(true); setUseNumbers(true); setUseSymbols(false);
                break;
            case 'dev':
                setLength(20);
                setUseUpper(true); setUseLower(true); setUseNumbers(true); setUseSymbols(true);
                break;
            case 'max':
                setLength(64);
                setUseUpper(true); setUseLower(true); setUseNumbers(true); setUseSymbols(true);
                break;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-4 shadow-2xl text-white transform rotate-3 hover:rotate-6 transition-transform">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">Password Generator</h2>
                <p className="text-gray-400">Generate strong, cryptographically secure passwords locally.</p>
            </div>

            {/* Main Generator Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Configuration Panel */}
                <div className="lg:col-span-1 bg-white/10 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 space-y-6">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-400" /> Configuration
                    </h3>

                    {/* Length */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-gray-300">Length</label>
                            <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 rounded font-mono">{length}</span>
                        </div>
                        <input
                            type="range"
                            min="8"
                            max="128"
                            value={length}
                            onChange={(e) => setLength(parseInt(e.target.value))}
                            className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Character Sets */}
                    <div className="space-y-3">
                        {[
                            { label: "Uppercase (A-Z)", checked: useUpper, set: setUseUpper },
                            { label: "Lowercase (a-z)", checked: useLower, set: setUseLower },
                            { label: "Numbers (0-9)", checked: useNumbers, set: setUseNumbers },
                            { label: "Symbols (!@#$)", checked: useSymbols, set: setUseSymbols },
                        ].map((opt, i) => (
                            <label key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 cursor-pointer transition-all">
                                <span className="text-sm font-medium text-gray-300">{opt.label}</span>
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${opt.checked ? 'bg-blue-600' : 'bg-white/10 ring-1 ring-white/30'}`}>
                                    {opt.checked && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input type="checkbox" checked={opt.checked} onChange={(e) => opt.set(e.target.checked)} className="hidden" />
                            </label>
                        ))}
                    </div>

                    {/* Presets */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Quick Presets</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { name: 'Banking', action: 'banking', color: 'bg-white/5' },
                                { name: 'Corporate', action: 'corporate', color: 'bg-white/5' },
                                { name: 'Developer', action: 'dev', color: 'bg-white/5' },
                                { name: 'High-Entropy', action: 'max', color: 'bg-purple-500/20 text-purple-300' }
                            ].map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset.action as any)}
                                    className={`px-3 py-2 text-xs font-medium ${preset.color} hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-white/5`}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Output & Analysis */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Password Display */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <div className="w-full relative z-10">
                            <div className="font-mono text-3xl md:text-4xl text-white break-all py-8 px-4 drop-shadow-lg">
                                {showPassword ? password : '•'.repeat(Math.min(password.length, 24))}
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                <button
                                    onClick={generatePassword}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-all hover:scale-105 shadow-lg active:scale-95"
                                >
                                    <RefreshCw className="w-4 h-4" /> Regenerate
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-sm border border-white/10 active:scale-95 ${copied ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-colors border border-white/10"
                                    title={showPassword ? "Hide" : "Show"}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* Entropy */}
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full mb-3">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className="text-2xl font-bold text-white">{entropy} <span className="text-sm font-normal text-gray-400">bits</span></div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Entropy</div>
                        </div>

                        {/* Strength */}
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                            <div className={`p-3 rounded-full mb-3 ${strengthLabel === 'Very Weak' ? 'bg-red-500/20 text-red-400' :
                                strengthLabel === 'Weak' ? 'bg-orange-500/20 text-orange-400' :
                                    strengthLabel === 'Reasonable' ? 'bg-yellow-500/20 text-yellow-400' :
                                        strengthLabel === 'Strong' ? 'bg-green-500/20 text-green-400' :
                                            'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                <Key className="w-6 h-6" />
                            </div>
                            <div className="text-2xl font-bold text-white">{strengthLabel}</div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Strength</div>
                        </div>

                        {/* Crack Time */}
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-full mb-3">
                                <Save className="w-6 h-6" />
                            </div>
                            <div className="text-xl font-bold text-white break-words w-full px-2">{crackTime}</div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Brute Force Time</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm text-blue-300 max-w-4xl mx-auto backdrop-blur-sm">
                <Shield className="w-5 h-5 flex-shrink-0" />
                <p>
                    Passwords are generated using the <strong>Web Crypto API</strong>, ensuring cryptographic randomness suitable for high-security applications. No data leaves your browser.
                </p>
            </div>
        </div>
    );
};

export default ProPasswordGenerator;
