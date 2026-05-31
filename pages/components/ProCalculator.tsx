import React, { useState, useEffect, useRef } from 'react';
import { Calculator, RotateCcw, Copy, Delete, Info, History, BookOpen, Settings, Check } from 'lucide-react';
import * as math from 'mathjs';

// --- Constants ---
const HISTORY_LIMIT = 20;

type Mode = 'standard' | 'scientific';

interface HistoryItem {
    id: string;
    expression: string;
    result: string;
    timestamp: number;
}

const ProCalculator: React.FC = () => {
    // --- State ---
    const [display, setDisplay] = useState<string>('0');
    const [resultPreview, setResultPreview] = useState<string>('');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [mode, setMode] = useState<Mode>('scientific');
    const [angleUnit, setAngleUnit] = useState<'deg' | 'rad'>('deg');
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // --- References ---
    const displayRef = useRef<HTMLInputElement>(null);

    // --- Math Configuration ---
    // Configure mathjs to not be too aggressive with implicit handling
    const mathConfig = {
        number: 'BigNumber',
        precision: 64,
    } as any;

    // --- Main Calculation Logic ---
    const calculate = (expression: string): string => {
        try {
            // Pre-process expression for better UX
            let expr = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/π/g, 'pi')
                .replace(/√/g, 'sqrt')
                .replace(/\^2/g, '^2');

            // Handle Deg/Rad for trig functions
            // MathJS defaults to rad. We need to convert inputs if in deg mode.
            // A simple regex approach to wrap values might be complex, so we'll use mathjs scope or transform.
            // Easier approach: define custom trig functions in scope that handle conversion.

            const scope = {
                sin: (x: any) => angleUnit === 'deg' ? math.sin(math.unit(x, 'deg')) : math.sin(x),
                cos: (x: any) => angleUnit === 'deg' ? math.cos(math.unit(x, 'deg')) : math.cos(x),
                tan: (x: any) => angleUnit === 'deg' ? math.tan(math.unit(x, 'deg')) : math.tan(x),
                // Add inverse trig if needed, or handle via buttons directly inserting 'asin(...)'
                asin: (x: any) => angleUnit === 'deg' ? math.prod(math.asin(x), 180 / Math.PI) : math.asin(x),
                acos: (x: any) => angleUnit === 'deg' ? math.prod(math.acos(x), 180 / Math.PI) : math.acos(x),
                atan: (x: any) => angleUnit === 'deg' ? math.prod(math.atan(x), 180 / Math.PI) : math.atan(x),
            };

            const result = math.evaluate(expr, scope);

            // Format result
            if (math.typeOf(result) === 'Complex') {
                return result.toString();
            }

            // Handle BigNumber or generic number
            let final = math.format(result, { precision: 14 });

            // Remove floating point artifacts mostly
            if (final === 'NaN') return 'Error';
            return final;
        } catch (err) {
            // Don't return error string immediately for preview, just empty or partial
            throw err;
        }
    };

    // --- Effects ---

    // Live Preview
    useEffect(() => {
        if (!display || display === '0' || display === 'Error') {
            setResultPreview('');
            return;
        }

        const timer = setTimeout(() => {
            try {
                // Only preview if it looks like a complete-ish expression
                if (/[\+\-\*\/]$/.test(display)) return; // Ends in operator

                const res = calculate(display);
                setResultPreview(res !== display ? res : '');
                setError(null);
            } catch (e) {
                // Silent fail for preview
                setResultPreview('');
            }
        }, 100); // 100ms debounce

        return () => clearTimeout(timer);
    }, [display, angleUnit]);

    // --- Handlers ---

    const handleInput = (val: string) => {
        setError(null);
        setDisplay(prev => {
            if (prev === '0' || prev === 'Error') return val;
            return prev + val;
        });
    };

    const handleOperator = (op: string) => {
        setError(null);
        setDisplay(prev => {
            if (prev === 'Error') return '0' + op;
            // Prevent double operators
            if (/[\+\-\*\/]$/.test(prev)) {
                return prev.slice(0, -1) + op;
            }
            return prev + op;
        });
    };

    const handleClear = () => {
        setDisplay('0');
        setResultPreview('');
        setError(null);
    };

    const handleDelete = () => {
        setDisplay(prev => {
            if (prev.length <= 1 || prev === 'Error') return '0';
            return prev.slice(0, -1);
        });
    };

    const handleEqual = () => {
        try {
            const res = calculate(display);

            // Add to history
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                expression: display,
                result: res,
                timestamp: Date.now()
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, HISTORY_LIMIT));

            setDisplay(res);
            setResultPreview('');
        } catch (err) {
            setError('Invalid Expression');
            // Shake effect or similar could be added here
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(display);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const loadHistory = (item: HistoryItem) => {
        setDisplay(item.result); // Or item.expression if preferred
        setShowHistory(false);
    };

    // --- Render Helpers ---

    const Button = ({
        label,
        onClick,
        variant = 'default',
        className = ''
    }: {
        label: React.ReactNode,
        onClick: () => void,
        variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger',
        className?: string
    }) => {
        const baseClass = "h-14 rounded-xl font-medium text-lg transition-all active:scale-95 flex items-center justify-center select-none shadow-sm";
        const variants = {
            default: "bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600",
            primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
            secondary: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
            accent: "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 border border-indigo-200 dark:border-indigo-800",
            danger: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800"
        };

        return (
            <button
                onClick={onClick}
                className={`${baseClass} ${variants[variant]} ${className}`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 lg:p-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row min-h-[600px] relative">

                {/* Main Calculator Section */}
                <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Calculator className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Pro Calculator</h2>
                        </div>
                        <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                            <button
                                onClick={() => setMode('standard')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'standard'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Standard
                            </button>
                            <button
                                onClick={() => setMode('scientific')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'scientific'
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Scientific
                            </button>
                        </div>
                    </div>

                    {/* Display */}
                    <div className="bg-black/40 rounded-2xl p-6 mb-6 text-right relative overflow-hidden group border border-white/5 min-h-[160px] flex flex-col justify-end">
                        {/* Toolbar inside display */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                title="History"
                            >
                                <History className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setAngleUnit(angleUnit === 'deg' ? 'rad' : 'deg')}
                                className="px-2 py-1 rounded bg-white/10 text-xs font-bold text-gray-300 hover:text-white border border-white/5"
                            >
                                {angleUnit.toUpperCase()}
                            </button>
                        </div>

                        <div className="absolute top-4 right-4">
                            <button
                                onClick={handleCopy}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="text-gray-400 text-sm h-6 mb-1 font-mono tracking-wider overflow-x-auto whitespace-nowrap scrollbar-hide">
                            {resultPreview && `= ${resultPreview}`}
                        </div>
                        <div className={`text-4xl sm:text-5xl font-light tracking-tight break-all font-mono ${error ? 'text-red-400' : 'text-white'}`}>
                            {error || display}
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {/* Keypad */}
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {/* Scientific Row 1 */}
                            {mode === 'scientific' && (
                                <>
                                    <Button label="rad/deg" onClick={() => setAngleUnit(angleUnit === 'deg' ? 'rad' : 'deg')} variant="secondary" className="text-xs" />
                                    <Button label="sin" onClick={() => handleInput('sin(')} variant="secondary" />
                                    <Button label="cos" onClick={() => handleInput('cos(')} variant="secondary" />
                                    <Button label="tan" onClick={() => handleInput('tan(')} variant="secondary" />
                                    <Button label="π" onClick={() => handleInput('π')} variant="secondary" />
                                </>
                            )}

                            {/* Scientific Row 2 */}
                            {mode === 'scientific' && (
                                <>
                                    <Button label="x²" onClick={() => handleInput('^2')} variant="secondary" />
                                    <Button label="xʸ" onClick={() => handleInput('^')} variant="secondary" />
                                    <Button label="√" onClick={() => handleInput('√(')} variant="secondary" />
                                    <Button label="(" onClick={() => handleInput('(')} variant="secondary" />
                                    <Button label=")" onClick={() => handleInput(')')} variant="secondary" />
                                </>
                            )}

                            {/* Scientific Row 3 / Standard Row 1 */}
                            <Button label="AC" onClick={handleClear} variant="danger" />
                            <Button label={<Delete className="w-5 h-5" />} onClick={handleDelete} variant="danger" />
                            <Button label="%" onClick={() => handleInput('%')} variant="secondary" />
                            <Button label="÷" onClick={() => handleOperator('÷')} variant="accent" className="col-span-2 sm:col-span-1" />
                            {mode === 'scientific' && <Button label="log" onClick={() => handleInput('log(')} variant="secondary" />}

                            {/* Numbers & Ops */}
                            <Button label="7" onClick={() => handleInput('7')} />
                            <Button label="8" onClick={() => handleInput('8')} />
                            <Button label="9" onClick={() => handleInput('9')} />
                            <Button label="×" onClick={() => handleOperator('×')} variant="accent" />
                            {mode === 'scientific' && <Button label="ln" onClick={() => handleInput('log(')} variant="secondary" />}

                            <Button label="4" onClick={() => handleInput('4')} />
                            <Button label="5" onClick={() => handleInput('5')} />
                            <Button label="6" onClick={() => handleInput('6')} />
                            <Button label="-" onClick={() => handleOperator('-')} variant="accent" />
                            {mode === 'scientific' && <Button label="e" onClick={() => handleInput('e')} variant="secondary" />}

                            <Button label="1" onClick={() => handleInput('1')} />
                            <Button label="2" onClick={() => handleInput('2')} />
                            <Button label="3" onClick={() => handleInput('3')} />
                            <Button label="+" onClick={() => handleOperator('+')} variant="accent" />
                            {mode === 'scientific' && <Button label="^" onClick={() => handleInput('^')} variant="secondary" />}

                            <Button label="0" onClick={() => handleInput('0')} className="col-span-2" />
                            <Button label="." onClick={() => handleInput('.')} />
                            <Button label="=" onClick={handleEqual} variant="primary" className="col-span-2 sm:col-span-1" />
                        </div>
                    </div>
                </div>

                {/* History Sidebar */}
                <div className={`
                    absolute inset-y-0 right-0 w-full md:w-80 bg-black/95 md:bg-black/40 backdrop-blur-2xl border-l border-white/10 transform transition-transform duration-300 z-20 flex flex-col
                    ${showHistory ? 'translate-x-0' : 'translate-x-full'}
                    md:relative md:translate-x-0 md:w-0 ${showHistory ? 'md:!w-72' : 'md:!w-0'} md:overflow-hidden
                `}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="text-white font-medium flex items-center gap-2">
                            <History className="w-4 h-4 text-blue-400" />
                            History
                        </h3>
                        <div className="flex items-center gap-2">
                            {history.length > 0 && (
                                <button
                                    onClick={() => setHistory([])}
                                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                            <button onClick={() => setShowHistory(false)} className="md:hidden text-gray-400">
                                <Delete className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                                <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">No recent calculations</p>
                            </div>
                        ) : (
                            history.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => loadHistory(item)}
                                    className="w-full text-left bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group border border-white/5"
                                >
                                    <div className="text-gray-400 text-xs mb-1 font-mono break-all line-clamp-2">{item.expression} =</div>
                                    <div className="text-white text-lg font-bold font-mono text-right group-hover:text-blue-400 transition-colors">
                                        {item.result}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProCalculator;
