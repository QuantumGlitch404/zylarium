import React, { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Code, ImageIcon, Shield } from 'lucide-react';

interface ConvertedImage {
    id: string;
    name: string;
    pngUrl: string;
    pngSize: number;
    width: number;
    height: number;
}

const SVGToPNG: React.FC = () => {
    const [svgSource, setSvgSource] = useState<'file' | 'code'>('file');
    const [svgFile, setSvgFile] = useState<File | null>(null);
    const [svgCode, setSvgCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<ConvertedImage | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Settings
    const [resolutionPreset, setResolutionPreset] = useState<'512' | '1024' | '2048' | 'custom'>('1024');
    const [customWidth, setCustomWidth] = useState(1024);
    const [customHeight, setCustomHeight] = useState(1024);
    const [backgroundColor, setBackgroundColor] = useState<'transparent' | 'solid'>('transparent');
    const [solidColor, setSolidColor] = useState('#ffffff');
    const [scaleFactor, setScaleFactor] = useState<1 | 2 | 4>(1);

    const sanitizeSVG = (svgString: string): string => {
        // Remove script tags and event handlers
        let sanitized = svgString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
        sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');

        // Remove external references (except data URLs)
        sanitized = sanitized.replace(/xlink:href="(?!data:)[^"]*"/gi, 'xlink:href=""');
        sanitized = sanitized.replace(/href="(?!data:)[^"]*"/gi, 'href=""');

        return sanitized;
    };

    const handleFileSelect = (file: File | null) => {
        if (!file) return;

        if (!file.type.includes('svg') && !file.name.endsWith('.svg')) {
            setError('Please select an SVG file');
            return;
        }

        setSvgFile(file);
        setError(null);
    };

    const convertToPNG = async () => {
        setProcessing(true);
        setError(null);
        setResult(null);

        try {
            let svgContent = '';
            let fileName = 'converted';

            if (svgSource === 'file') {
                if (!svgFile) {
                    throw new Error('Please select an SVG file');
                }
                svgContent = await svgFile.text();
                fileName = svgFile.name.replace(/\.svg$/i, '');
            } else {
                if (!svgCode.trim()) {
                    throw new Error('Please paste SVG code');
                }
                svgContent = svgCode;
            }

            // Sanitize SVG
            const sanitizedSVG = sanitizeSVG(svgContent);

            // Create a blob from SVG
            const svgBlob = new Blob([sanitizedSVG], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Load SVG into an image
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Failed to load SVG'));
                img.src = url;
            });

            // Calculate dimensions
            let width: number;
            let height: number;

            if (resolutionPreset === 'custom') {
                width = customWidth * scaleFactor;
                height = customHeight * scaleFactor;
            } else {
                const size = parseInt(resolutionPreset) * scaleFactor;
                // Maintain aspect ratio
                const aspectRatio = img.width / img.height;
                if (aspectRatio > 1) {
                    width = size;
                    height = size / aspectRatio;
                } else {
                    height = size;
                    width = size * aspectRatio;
                }
            }

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;

            // Apply background
            if (backgroundColor === 'solid') {
                ctx.fillStyle = solidColor;
                ctx.fillRect(0, 0, width, height);
            }

            // Draw SVG
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to PNG
            const pngBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Conversion failed')),
                    'image/png'
                );
            });

            const pngUrl = URL.createObjectURL(pngBlob);

            setResult({
                id: Date.now().toString(),
                name: `${fileName}.png`,
                pngUrl,
                pngSize: pngBlob.size,
                width,
                height
            });

            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Conversion failed');
        } finally {
            setProcessing(false);
        }
    };

    const downloadPNG = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = result.pngUrl;
        a.download = result.name;
        a.click();
    };

    const reset = () => {
        if (result) URL.revokeObjectURL(result.pngUrl);
        setSvgFile(null);
        setSvgCode('');
        setResult(null);
        setError(null);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20">
                    <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">SVG to PNG Converter</h2>
                <p className="text-gray-400 mb-4">Convert vector graphics to raster PNG</p>

                {/* Purpose */}
                <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-gray-400">
                    <span>✓ Presentations</span>
                    <span>✓ Thumbnails</span>
                    <span>✓ App assets</span>
                </div>
            </div>

            {/* Security Badge */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-green-200">Security Protection</p>
                    <p className="text-sm text-green-300/80">SVG is automatically sanitized. Scripts and external references are blocked for your safety.</p>
                </div>
            </div>

            {!result && (
                <>
                    {/* Input Method Selection */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                        <h3 className="font-semibold text-white">SVG Input</h3>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setSvgSource('file')}
                                className={`flex-1 p-3 rounded-lg border transition-all ${svgSource === 'file' ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                            >
                                <Upload className="w-5 h-5 mx-auto mb-1" />
                                <div className="font-medium">Upload SVG File</div>
                            </button>
                            <button
                                onClick={() => setSvgSource('code')}
                                className={`flex-1 p-3 rounded-lg border transition-all ${svgSource === 'code' ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                            >
                                <Code className="w-5 h-5 mx-auto mb-1" />
                                <div className="font-medium">Paste SVG Code</div>
                            </button>
                        </div>

                        {/* File Upload */}
                        {svgSource === 'file' && (
                            <div
                                onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
                                onDragOver={(e) => e.preventDefault()}
                                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-indigo-400/50 transition-all bg-white/5 backdrop-blur-xl"
                            >
                                {svgFile ? (
                                    <div className="space-y-2">
                                        <p className="font-medium text-white">{svgFile.name}</p>
                                        <p className="text-sm text-gray-400">{(svgFile.size / 1024).toFixed(1)} KB</p>
                                        <button onClick={() => setSvgFile(null)} className="text-sm text-red-400 hover:text-red-300">
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-white/70 mx-auto mb-3" />
                                        <p className="text-gray-300 mb-3">Drop SVG file here or</p>
                                        <input
                                            type="file"
                                            accept=".svg,image/svg+xml"
                                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="svg-input"
                                        />
                                        <label
                                            htmlFor="svg-input"
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-500/20"
                                        >
                                            Select SVG File
                                        </label>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Code Paste */}
                        {svgSource === 'code' && (
                            <div>
                                <textarea
                                    value={svgCode}
                                    onChange={(e) => setSvgCode(e.target.value)}
                                    placeholder="Paste your SVG code here..."
                                    className="w-full h-48 p-4 border border-white/20 rounded-lg font-mono text-sm resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-black/20 text-gray-200 placeholder-gray-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Render Settings */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                        <h3 className="font-semibold text-white">Render Settings</h3>

                        {/* Resolution */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['512', '1024', '2048', 'custom'] as const).map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setResolutionPreset(preset)}
                                        className={`p-3 rounded-lg border transition-all ${resolutionPreset === preset ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <div className="font-medium">{preset === 'custom' ? 'Custom' : `${preset}px`}</div>
                                    </button>
                                ))}
                            </div>

                            {resolutionPreset === 'custom' && (
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Width (px)</label>
                                        <input
                                            type="number"
                                            value={customWidth}
                                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                                            min="1"
                                            className="w-full p-2 border border-white/10 rounded-lg bg-black/20 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Height (px)</label>
                                        <input
                                            type="number"
                                            value={customHeight}
                                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                                            min="1"
                                            className="w-full p-2 border border-white/10 rounded-lg bg-black/20 text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Background */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Background</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setBackgroundColor('transparent')}
                                    className={`p-3 rounded-lg border transition-all ${backgroundColor === 'transparent' ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="font-medium">Transparent</div>
                                </button>
                                <button
                                    onClick={() => setBackgroundColor('solid')}
                                    className={`p-3 rounded-lg border transition-all ${backgroundColor === 'solid' ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="font-medium">Solid Color</div>
                                </button>
                            </div>

                            {backgroundColor === 'solid' && (
                                <div className="mt-3">
                                    <label className="block text-sm text-gray-400 mb-1">Background Color</label>
                                    <input
                                        type="color"
                                        value={solidColor}
                                        onChange={(e) => setSolidColor(e.target.value)}
                                        className="w-full h-12 rounded border border-white/10 cursor-pointer bg-transparent"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Scale Factor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Scale Factor</label>
                            <div className="grid grid-cols-3 gap-2">
                                {([1, 2, 4] as const).map((factor) => (
                                    <button
                                        key={factor}
                                        onClick={() => setScaleFactor(factor)}
                                        className={`p-3 rounded-lg border transition-all ${scaleFactor === factor ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <div className="font-medium">{factor}×</div>
                                        <div className="text-xs text-gray-500">
                                            {resolutionPreset !== 'custom' ? `${parseInt(resolutionPreset) * factor}px` : `${customWidth * factor}×${customHeight * factor}`}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Convert Button */}
                    {!processing && (
                        <button
                            onClick={convertToPNG}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            <ImageIcon className="w-5 h-5" />
                            Convert to PNG
                        </button>
                    )}
                </>
            )}

            {/* Processing */}
            {processing && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
                    <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                        <span className="font-medium text-white">Converting SVG to PNG...</span>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <p className="font-medium text-green-100">Conversion Complete!</p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={downloadPNG}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                            >
                                <Download className="w-4 h-4" />
                                Download PNG
                            </button>
                            <button
                                onClick={reset}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                            >
                                Convert Another
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
                        <h4 className="font-medium text-white mb-3">Preview</h4>
                        <div className="bg-black/20 rounded-lg p-8 flex items-center justify-center min-h-[300px] border border-white/10">
                            <img
                                src={result.pngUrl}
                                alt="Converted PNG"
                                className="max-w-full max-h-[500px] object-contain"
                                style={{ imageRendering: 'high-quality' }}
                            />
                        </div>
                        <div className="mt-3 text-sm text-gray-400">
                            <p>{result.width} × {result.height} pixels</p>
                            <p>{(result.pngSize / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-200">Error</p>
                        <p className="text-sm text-red-300/80">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SVGToPNG;
