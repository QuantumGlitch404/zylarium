import React, { useState, useEffect, useMemo } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Info, Zap, Terminal } from 'lucide-react';

// --- internal analysis engine ---

interface AnalysisResult {
    score: number; // 0-100
    entropy: number;
    label: string;
    crackTime: string;
    patterns: string[];
    suggestions: string[];
    isCommon: boolean;
}

const COMMON_PASSWORDS = new Set([
    'password', '123456', '12345678', '1234', 'qwerty', '12345', 'dragon', 'p@ssword', 'admin', '123456789',
    'letmeout', 'football', 'monkey', 'princess', 'trustno1', 'iloveyou', 'master', 'welcome', 'login'
]);

const SEQUENCES = [
    '1234567890', '0987654321',
    'abcdefghijklmnopqrstuvwxyz', 'zyxwvutsrqponmlkjihgfedcba',
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
];

const analyzePassword = (pwd: string): AnalysisResult => {
    if (!pwd) return { score: 0, entropy: 0, label: 'Empty', crackTime: '0s', patterns: [], suggestions: [], isCommon: false };

    // 1. Initial Checks
    const length = pwd.length;
    let score = 0;
    const suggestions: string[] = [];
    const patterns: string[] = [];
    let entropy = 0;

    // 2. Entropy Calculation
    let poolSize = 0;
    if (/[a-z]/.test(pwd)) poolSize += 26;
    if (/[A-Z]/.test(pwd)) poolSize += 26;
    if (/[0-9]/.test(pwd)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) poolSize += 32;

    if (poolSize > 0) {
        entropy = Math.round(length * Math.log2(poolSize));
    }

    // 3. Pattern Detection

    // Common Passwords
    const isCommon = COMMON_PASSWORDS.has(pwd.toLowerCase());
    if (isCommon) {
        patterns.push('Common dictionary password detected');
        suggestions.push('Avoid using common words or sequences');
        score = 10; // Cap score
    }

    // Repeated Characters (e.g., "aaa")
    if (/(.)\1{2,}/.test(pwd)) {
        patterns.push('Repeated characters detected');
        score -= 10;
    }

    // Sequences (e.g., "abc", "123")
    const lowerPwd = pwd.toLowerCase();
    for (const seq of SEQUENCES) {
        for (let i = 0; i < seq.length - 2; i++) {
            const sub = seq.substring(i, i + 3);
            if (lowerPwd.includes(sub)) {
                patterns.push(`Sequence detected: "...${sub}..."`);
                score -= 10;
                break;
            }
        }
    }

    // 4. Scoring Algorithm (0-100)
    if (!isCommon) {
        // Base score from entropy (up to 60 points)
        score += Math.min(60, entropy);

        // Length bonus (up to 20 points)
        if (length >= 12) score += 10;
        if (length >= 16) score += 10;

        // Variety bonus (up to 20 points)
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 5;
        if (/[0-9]/.test(pwd)) score += 5;
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 10;
    }

    // Penalties
    if (length < 8) {
        score = Math.min(score, 40);
        suggestions.push('Increase length to at least 12 characters');
    }
    if (!/[^a-zA-Z0-9]/.test(pwd)) suggestions.push('Add special symbols (e.g., !@#$)');
    if (!/[0-9]/.test(pwd)) suggestions.push('Add numbers');
    if (!/[A-Z]/.test(pwd)) suggestions.push('Add uppercase letters');

    // Clamp Score
    score = Math.max(0, Math.min(100, score));

    // 5. Labeling
    let label = 'Weak';
    if (score >= 90) label = 'Excellent';
    else if (score >= 70) label = 'Strong';
    else if (score >= 50) label = 'Moderate';

    // 6. Crack Time Estimation (Approximation for UI)
    // t = 2^H / guess_rate
    const rate = 1e10; // 10 billion/sec (fast GPU)
    const seconds = Math.pow(2, entropy) / rate;

    let crackTime = 'Instant';
    if (seconds >= 1) {
        if (seconds < 60) crackTime = `${Math.round(seconds)} seconds`;
        else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutes`;
        else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} hours`;
        else if (seconds < 31536000) crackTime = `${Math.round(seconds / 86400)} days`;
        else if (seconds < 3153600000) crackTime = `${Math.round(seconds / 31536000)} years`;
        else crackTime = 'Centuries';
    }

    return { score, entropy, label, crackTime, patterns, suggestions, isCommon };
};


const ProPasswordStrength: React.FC = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [result, setResult] = useState<AnalysisResult>(analyzePassword(''));

    useEffect(() => {
        setResult(analyzePassword(password));
    }, [password]);

    const getScoreColor = (score: number) => {
        if (score < 40) return 'bg-red-500';
        if (score < 70) return 'bg-yellow-500';
        if (score < 90) return 'bg-green-500';
        return 'bg-emerald-500';
    };

    const getScoreText = (score: number) => {
        if (score < 40) return 'text-red-400';
        if (score < 70) return 'text-yellow-400';
        if (score < 90) return 'text-green-400';
        return 'text-emerald-400';
    };

    return (
        <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-8">

            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl mb-4 shadow-2xl text-white transform rotate-3 hover:rotate-6 transition-transform">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">Password Strength Analyzer</h2>
                <p className="text-gray-400 mt-2">Professional auditing tool. No data is ever sent to a server.</p>
            </div>

            {/* Main Input & Meter */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 space-y-6 relative overflow-hidden">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Test Password</label>
                    <div className="relative group">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password to analyze..."
                            className="w-full text-xl p-4 pr-12 bg-black/30 border-2 border-transparent focus:border-blue-500/50 rounded-2xl outline-none transition-all font-mono text-white placeholder-gray-500"
                        />
                        <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors p-1"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Input is processed locally in your browser.
                    </p>
                </div>

                {/* Strength Meter */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className={`text-3xl font-bold ${getScoreText(result.score)}`}>{result.label}</span>
                        <span className="text-sm font-semibold text-gray-400">{result.score}/100</span>
                    </div>
                    <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full transition-all duration-700 ease-out ${getScoreColor(result.score)} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
                            style={{ width: `${result.score}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Analysis Grid */}
            {password && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Attack Simulation */}
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 space-y-4">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-purple-400" /> Attack Simulation
                        </h3>

                        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                            <div className="text-xs text-purple-300 font-semibold uppercase mb-1">Brute Force Time</div>
                            <div className="text-2xl font-bold text-white">{result.crackTime}</div>
                            <div className="text-xs text-gray-400 mt-1">@ 10 billion guesses/sec</div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Dictionary Match</span>
                                {result.isCommon ? (
                                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg font-medium text-xs border border-red-500/20">DETECTED</span>
                                ) : (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-lg font-medium text-xs border border-green-500/20">SAFE</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Complexity (Entropy)</span>
                                <span className="font-mono text-white">{result.entropy} bits</span>
                            </div>
                        </div>
                    </div>

                    {/* Security Breakdown */}
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 space-y-4">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-400" /> Analysis Breakdown
                        </h3>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                {password.length >= 12 ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                <span className="text-gray-300">Length Check ({password.length} chars)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {/[0-9]/.test(password) && /[a-zA-Z]/.test(password) && /[^a-zA-Z0-9]/.test(password)
                                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                                    : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                <span className="text-gray-300">Character Variety</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {result.patterns.length === 0
                                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                                    : <AlertTriangle className="w-4 h-4 text-red-400" />}
                                <span className="text-gray-300">Patterns & Sequences</span>
                            </div>
                        </div>

                        {result.patterns.length > 0 && (
                            <div className="bg-red-500/10 rounded-xl p-3 text-sm text-red-300 space-y-1 border border-red-500/20">
                                {result.patterns.map((p, i) => <div key={i}>• {p}</div>)}
                            </div>
                        )}
                    </div>

                    {/* Improving Suggestions */}
                    {result.suggestions.length > 0 && (
                        <div className="md:col-span-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="font-semibold text-blue-300 flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4" /> Improvement Suggestions
                            </h3>
                            <div className="grid md:grid-cols-2 gap-3">
                                {result.suggestions.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-blue-200 bg-white/5 p-3 rounded-xl text-sm border border-white/5 hover:bg-white/10 transition-colors">
                                        <Info className="w-4 h-4 flex-shrink-0" /> {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default ProPasswordStrength;
