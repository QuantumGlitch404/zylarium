import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Download, RefreshCw, Type, AlignLeft, Grid, FileImage } from 'lucide-react';
import GlassSelect from '../../components/ui/GlassSelect';
// We'll load fonts via Google Fonts in the style tag or main document
// For this component, we'll assume a few handwriting fonts are available or fallback to cursive

const FONTS = [
    { name: 'Caveat', url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap' },
    { name: 'Dancing Script', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap' },
    { name: 'Homemade Apple', url: 'https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap' },
    { name: 'Indie Flower', url: 'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap' },
    { name: 'Shadows Into Light', url: 'https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap' },
];

const TextToHandwriting: React.FC = () => {
    const [text, setText] = useState('This is a sample text converted into handwriting. You can customize the font, ink color, and paper type to make it look realistic.');
    const [font, setFont] = useState('Caveat');
    const [inkColor, setInkColor] = useState('#1e40af'); // Blue ink default
    const [paperType, setPaperType] = useState<'plain' | 'lined' | 'grid'>('lined');
    const [fontSize, setFontSize] = useState(24);
    const [lineHeight, setLineHeight] = useState(1.5);
    const [letterSpacing, setLetterSpacing] = useState(0);
    const [randomness, setRandomness] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load fonts dynamically
    useEffect(() => {
        const link = document.createElement('link');
        link.href = FONTS.map(f => f.url).join('&').replace(/&/g, '|').replace('css2?', 'css2?');
        // Simple hack to load all google fonts in one go
        link.href = 'https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Homemade+Apple&family=Indie+Flower&family=Shadows+Into+Light&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        }
    }, []);

    useEffect(() => {
        draw();
    }, [text, font, inkColor, paperType, fontSize, lineHeight, letterSpacing, randomness]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions (A4 ratio-ish)
        canvas.width = 800;
        canvas.height = 1131;

        // Draw Paper Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (paperType === 'lined') {
            ctx.strokeStyle = '#e5e7eb'; // Light gray lines
            ctx.lineWidth = 1;
            const spacing = fontSize * lineHeight;
            for (let y = 100; y < canvas.height; y += spacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            // Margin line
            ctx.strokeStyle = '#fca5a5'; // Red margin
            ctx.beginPath();
            ctx.moveTo(80, 0);
            ctx.lineTo(80, canvas.height);
            ctx.stroke();
        } else if (paperType === 'grid') {
            ctx.strokeStyle = '#f3f4f6';
            ctx.lineWidth = 1;
            const gridSize = 20;
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }

        // Draw Text
        ctx.font = `${fontSize}px "${font}", cursive`;
        ctx.fillStyle = inkColor;
        ctx.textBaseline = 'bottom';

        const marginLeft = paperType === 'lined' ? 100 : 50;
        const marginTop = 100;
        const maxWidth = canvas.width - marginLeft - 50;

        const words = text.split(/(\s+)/); // Split by whitespace but keep delimiters to preserve spaces
        let x = marginLeft;
        let y = marginTop;
        const lineHeightPx = fontSize * lineHeight;

        for (const word of words) {
            // Measure word width
            const metrics = ctx.measureText(word);
            let wordWidth = metrics.width;

            // randomness logic for word-level jitter could go here, but simple logic for now

            if (word === '\n') {
                x = marginLeft;
                y += lineHeightPx;
                continue;
            }

            if (x + wordWidth > marginLeft + maxWidth && word.trim() !== '') {
                x = marginLeft;
                y += lineHeightPx;
            }

            // Draw character by character for "randomness" effect
            if (randomness > 0) {
                for (let i = 0; i < word.length; i++) {
                    const char = word[i];
                    const charWidth = ctx.measureText(char).width;

                    // Random jitter
                    const rY = (Math.random() - 0.5) * randomness * 5;
                    const rX = (Math.random() - 0.5) * randomness * 2;

                    ctx.fillText(char, x + rX, y + rY);
                    x += charWidth + letterSpacing;
                }
            } else {
                ctx.fillText(word, x, y);
                x += wordWidth + (word.trim() === '' ? 0 : letterSpacing); // Apply letterSpacing only to chars? simpler to just add to X
            }
        }
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'handwriting.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mb-3 shadow-lg shadow-indigo-500/20">
                    <PenTool className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Text to Handwriting</h1>
                <p className="text-gray-400">Convert digital text into realistic handwriting.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls & Input */}
                <div className="space-y-6">
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5 space-y-6">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full h-40 p-4 bg-black/20 border border-white/10 rounded-lg text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-500"
                            placeholder="Type your text here..."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                                    <Type className="w-4 h-4 mr-2" /> Font Style
                                </label>
                                <GlassSelect
                                    value={font}
                                    onChange={(val) => setFont(val)}
                                    options={FONTS.map(f => ({ value: f.name, label: f.name }))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                                    <Grid className="w-4 h-4 mr-2" /> Paper Type
                                </label>
                                <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                                    {['plain', 'lined', 'grid'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setPaperType(type as any)}
                                            className={`flex-1 py-1.5 text-sm rounded-md capitalize transition-colors ${paperType === type
                                                ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/30'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                                    <span>Ink Color</span>
                                    <span className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: inkColor }}></span>
                                </label>
                                <div className="flex gap-2">
                                    {['#1e40af', '#000000', '#dc2626', '#166534'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setInkColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 ${inkColor === color ? 'border-indigo-500 scale-110' : 'border-transparent ring-1 ring-white/10'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Font Size ({fontSize}px)</label>
                                    <input type="range" min="12" max="48" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Spacing</label>
                                    <input type="range" min="-2" max="5" value={letterSpacing} onChange={(e) => setLetterSpacing(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Human Randomness</label>
                                    <input type="range" min="0" max="100" value={randomness * 100} onChange={(e) => setRandomness(parseInt(e.target.value) / 100)} className="w-full accent-indigo-500" />
                                    <p className="text-xs text-gray-500 mt-1">Simulates natural variation in character placement</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-sm text-yellow-200 text-center backdrop-blur-sm">
                        Generated handwriting is artificial and should be used ethically.
                    </div>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                        <span className="font-medium text-white flex items-center">
                            <FileImage className="w-4 h-4 mr-2" /> Live Preview
                        </span>
                        <button
                            onClick={handleDownload}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Download className="w-4 h-4 mr-2" /> Download Image
                        </button>
                    </div>

                    <div className="border border-white/20 rounded-xl overflow-hidden shadow-2xl bg-white/5 p-4 flex justify-center backdrop-blur-xl">
                        <canvas
                            ref={canvasRef}
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextToHandwriting;
