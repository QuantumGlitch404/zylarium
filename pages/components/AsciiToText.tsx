import React, { useState } from 'react';
import { Binary, ArrowRight, Copy, AlertTriangle, RefreshCcw } from 'lucide-react';
import GlassSelect from '../../components/ui/GlassSelect';

const AsciiToText: React.FC = () => {
    const [input, setInput] = useState('');
    const [inputMode, setInputMode] = useState<'ascii' | 'text'>('ascii');
    const [format, setFormat] = useState<'decimal' | 'hex' | 'binary'>('decimal');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');

    const processConversion = (val: string, mode: 'ascii' | 'text', fmt: 'decimal' | 'hex' | 'binary') => {
        setError('');
        if (!val.trim()) {
            setOutput('');
            return;
        }

        try {
            if (mode === 'ascii') {
                // Converting codes to text
                const delimiter = /[,\s]+/;
                const tokens = val.trim().split(delimiter).filter(t => t);

                let result = '';
                for (const token of tokens) {
                    let code = NaN;
                    if (fmt === 'decimal') code = parseInt(token, 10);
                    if (fmt === 'hex') code = parseInt(token, 16);
                    if (fmt === 'binary') code = parseInt(token, 2);

                    if (isNaN(code)) throw new Error(`Invalid ${fmt} value: ${token}`);
                    if (code < 0 || code > 65535) throw new Error(`Value out of range: ${token}`);

                    result += String.fromCharCode(code);
                }
                setOutput(result);
            } else {
                // Converting text to codes
                const codes = [];
                for (let i = 0; i < val.length; i++) {
                    const code = val.charCodeAt(i);
                    if (fmt === 'decimal') codes.push(code.toString(10));
                    if (fmt === 'hex') codes.push(code.toString(16).toUpperCase());
                    if (fmt === 'binary') codes.push(code.toString(2).padStart(8, '0'));
                }
                setOutput(codes.join(' '));
            }
        } catch (err: any) {
            setError(err.message || 'Conversion error');
            setOutput('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);
        processConversion(val, inputMode, format);
    };

    const handleModeToggle = () => {
        const newMode = inputMode === 'ascii' ? 'text' : 'ascii';
        setInputMode(newMode);
        setInput(output); // Swap input/output for quick toggle
        setOutput(input);
        // Note: Swapping might fail if input was invalid, but generally useful UX
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-green-500/20 backdrop-blur-md rounded-full mb-3 ring-1 ring-green-500/50">
                    <Binary className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">ASCII Converter</h1>
                <p className="text-gray-300 max-w-lg mx-auto">Decode or encode text to ASCII values (Decimal, Hex, Binary) instantly.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => { setInputMode('ascii'); processConversion(input, 'ascii', format); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'ascii'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            ASCII to Text
                        </button>
                        <button
                            onClick={() => { setInputMode('text'); processConversion(input, 'text', format); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'text'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Text to ASCII
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-300 font-medium">Format:</label>
                        <GlassSelect
                            value={format}
                            onChange={(val) => {
                                setFormat(val);
                                processConversion(input, inputMode, val);
                            }}
                            options={[
                                { value: "decimal", label: "Decimal" },
                                { value: "hex", label: "Hexadecimal" },
                                { value: "binary", label: "Binary" }
                            ]}
                            className="min-w-[150px]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-4 space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                            {inputMode === 'ascii' ? `Input (${format})` : 'Input Text'}
                        </label>
                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            placeholder={inputMode === 'ascii' ? "e.g. 72 101 108 108 111" : "Type something..."}
                            className="w-full h-64 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500/50 focus:border-transparent resize-none text-white placeholder-gray-500 transition-all"
                        />
                    </div>

                    <div className="p-4 space-y-2 bg-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                                {inputMode === 'ascii' ? 'Decoded Text' : `Output (${format})`}
                            </label>
                            <button
                                onClick={() => navigator.clipboard.writeText(output)}
                                disabled={!output}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                title="Copy Result"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative">
                            <textarea
                                readOnly
                                value={output}
                                className="w-full h-64 p-3 bg-transparent border border-white/10 rounded-xl font-mono text-sm resize-none text-white focus:outline-none"
                            />
                            {!output && !error && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                    <div className="text-center">
                                        <ArrowRight className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                        <span className="text-xs text-gray-500">Result will appear here</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-x-2 bottom-2 p-3 bg-red-500/10 backdrop-blur-md text-red-300 text-xs rounded-lg border border-red-500/20 flex items-center shadow-lg">
                                    <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {[
                    { title: "Decimal", desc: "Base-10 standard. 0-127 for standard ASCII.", color: "text-blue-400" },
                    { title: "Hexadecimal", desc: "Base-16. Range 00-7F. Compact representation.", color: "text-purple-400" },
                    { title: "Binary", desc: "Base-2. 0s and 1s. The raw machine language.", color: "text-green-400" },
                ].map((info) => (
                    <div key={info.title} className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <h3 className={`${info.color} font-bold mb-1`}>{info.title}</h3>
                        <p className="text-gray-400 text-sm">{info.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AsciiToText;
