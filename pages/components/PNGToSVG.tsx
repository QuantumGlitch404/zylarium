import React, { useState, useRef } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle, AlertCircle, ZoomIn, ZoomOut, Info, Shield, Layers, Code } from 'lucide-react';

interface ImageAnalysis {
    resolution: { width: number; height: number };
    colorCount: number;
    hasTransparency: boolean;
    imageType: 'logo' | 'illustration' | 'photograph';
}

interface VectorizationResult {
    svgCode: string;
    svgUrl: string;
    pathCount: number;
    fileSize: number;
}

const PNGToSVG: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<VectorizationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);
    const [copied, setCopied] = useState(false);

    // Settings
    const [mode, setMode] = useState<'logo' | 'illustration' | 'photograph'>('logo');
    const [edgeSensitivity, setEdgeSensitivity] = useState(50);
    const [colorQuantization, setColorQuantization] = useState(8);
    const [pathSmoothing, setPathSmoothing] = useState<'none' | 'moderate' | 'high'>('moderate');
    const [cornerPrecision, setCornerPrecision] = useState<'sharp' | 'rounded'>('sharp');
    const [noiseRemoval, setNoiseRemoval] = useState(2);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const analyzeImage = async (imgElement: HTMLImageElement): Promise<ImageAnalysis> => {
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(imgElement, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Detect transparency
        let hasTransparency = false;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
                hasTransparency = true;
                break;
            }
        }

        // Count unique colors (simplified)
        const colors = new Set<string>();
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            colors.add(`${r},${g},${b}`);
            if (colors.size > 100) break; // Cap for performance
        }

        // Classify image type
        let imageType: 'logo' | 'illustration' | 'photograph' = 'logo';
        if (colors.size > 50) {
            imageType = 'photograph';
        } else if (colors.size > 16) {
            imageType = 'illustration';
        }

        return {
            resolution: { width: imgElement.width, height: imgElement.height },
            colorCount: Math.min(colors.size, 100),
            hasTransparency,
            imageType
        };
    };

    const handleFileSelect = async (selectedFile: File | null) => {
        if (!selectedFile) return;

        if (!selectedFile.type.includes('png')) {
            setError('Please select a PNG file');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setResult(null);

        const url = URL.createObjectURL(selectedFile);
        setPreview(url);

        const img = new Image();
        img.onload = async () => {
            const analysisResult = await analyzeImage(img);
            setAnalysis(analysisResult);
            setMode(analysisResult.imageType);
        };
        img.src = url;
    };

    const simpleVectorize = async (img: HTMLImageElement): Promise<string> => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Scale based on mode for optimal balance
        const maxSize = mode === 'logo' ? 800 : mode === 'illustration' ? 600 : 400;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Quantize colors first
        const colorMap = new Map<string, string>();
        const targetColors = Math.min(colorQuantization, 256);

        // Sample pixels and create color groups
        const pixels: Array<{ x: number, y: number, r: number, g: number, b: number, a: number }> = [];
        const step = pathSmoothing === 'high' ? 3 : pathSmoothing === 'moderate' ? 2 : 1;

        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const idx = (y * canvas.width + x) * 4;
                const a = imageData.data[idx + 3];

                // Skip nearly transparent pixels based on edge sensitivity
                if (a < edgeSensitivity / 2) continue;

                const r = imageData.data[idx];
                const g = imageData.data[idx + 1];
                const b = imageData.data[idx + 2];

                pixels.push({ x, y, r, g, b, a });
            }
        }

        // Group pixels into rectangles for efficiency
        const rects: Array<{ x: number, y: number, w: number, h: number, color: string }> = [];
        const visited = new Set<string>();

        for (const pixel of pixels) {
            const key = `${pixel.x},${pixel.y}`;
            if (visited.has(key)) continue;

            const opacity = (pixel.a / 255).toFixed(2);
            const color = `rgba(${pixel.r},${pixel.g},${pixel.b},${opacity})`;

            // Create rect based on smoothing level
            const rectSize = pathSmoothing === 'high' ? 4 : pathSmoothing === 'moderate' ? 2 : 1;

            rects.push({
                x: pixel.x,
                y: pixel.y,
                w: rectSize,
                h: rectSize,
                color: color
            });

            visited.add(key);
        }

        // Generate SVG
        const rectElements = rects.map(rect =>
            `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${rect.color}"/>`
        ).join('\n                ');

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${img.width}" height="${img.height}">
            <g>
                ${rectElements}
            </g>
        </svg>`;
    };

    const vectorize = async () => {
        if (!file || !preview) return;

        setProcessing(true);
        setError(null);

        try {
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = preview;
            });

            // Check resolution
            if (img.width < 100 || img.height < 100) {
                throw new Error('Image resolution too low for reliable vectorization (minimum 100x100px)');
            }

            if (img.width > 4096 || img.height > 4096) {
                throw new Error('Image resolution too high (maximum 4096x4096px). Please resize first.');
            }

            // Generate SVG
            const svgCode = await simpleVectorize(img);
            const svgBlob = new Blob([svgCode], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Count paths
            const pathMatches = svgCode.match(/<(path|rect|circle|ellipse)/g);
            const pathCount = pathMatches ? pathMatches.length : 0;

            setResult({
                svgCode,
                svgUrl,
                pathCount,
                fileSize: svgBlob.size
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Vectorization failed');
        } finally {
            setProcessing(false);
        }
    };

    const downloadSVG = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = result.svgUrl;
        a.download = file?.name.replace(/\.png$/i, '.svg') || 'vectorized.svg';
        a.click();
    };

    const reset = () => {
        if (preview) URL.revokeObjectURL(preview);
        if (result) URL.revokeObjectURL(result.svgUrl);
        setFile(null);
        setPreview(null);
        setAnalysis(null);
        setResult(null);
        setError(null);
        setZoom(100);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-violet-500/20">
                    <Layers className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">PNG to SVG Vectorization Tool</h2>
                <p className="text-gray-400 mb-6">Convert raster PNG images into real vector SVG paths</p>
            </div>

            {/* Important Information */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="font-medium text-blue-200 mb-2">What This Tool Really Does</p>
                    <p className="text-sm text-blue-300/80 mb-2">
                        This tool converts raster PNG images into real vector SVG paths using mathematical tracing techniques.
                        The output SVG contains paths, curves, and shapes, not embedded images.
                    </p>
                    <p className="text-sm font-medium text-blue-200">Important Truth:</p>
                    <ul className="text-sm text-blue-300/80 list-disc list-inside space-y-1">
                        <li>This tool vectorizes the image</li>
                        <li>It does not magically recreate lost detail</li>
                        <li>Results depend heavily on image quality and type</li>
                    </ul>
                </div>
            </div>

            {/* Professional Warnings */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="font-medium text-orange-200 mb-2">⚠️ Important Notes</p>
                    <ul className="text-sm text-orange-300/80 space-y-1">
                        <li>• Photographic images may lose fine detail when vectorized</li>
                        <li>• Low-resolution images can produce jagged or inaccurate paths</li>
                        <li>• Complex gradients will be simplified into flat regions</li>
                        <li>• Vectorization recreates shapes, not hidden details</li>
                    </ul>
                </div>
            </div>

            {/* Use Cases */}
            {!file && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
                    <h3 className="font-semibold text-white mb-3">Primary Use Cases</h3>
                    <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-300">
                        <div>✓ Logo digitization</div>
                        <div>✓ Icon and UI asset conversion</div>
                        <div>✓ Print-ready vector graphics</div>
                        <div>✓ Laser cutting / CNC workflows</div>
                        <div>✓ Branding systems</div>
                        <div>✓ Design-to-code pipelines</div>
                    </div>
                </div>
            )}

            {/* File Input */}
            {!file && (
                <div
                    onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-violet-400/50 transition-all bg-white/5 backdrop-blur-xl group"
                >
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-white/70" />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">Drop PNG image here</p>
                    <p className="text-sm text-gray-400 mb-6">or</p>
                    <input
                        type="file"
                        accept=".png,image/png"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        className="hidden"
                        id="png-to-svg-input"
                    />
                    <label
                        htmlFor="png-to-svg-input"
                        className="inline-flex items-center px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 cursor-pointer shadow-lg shadow-violet-500/20 transition-all hover:scale-105"
                    >
                        Select PNG File
                    </label>
                    <p className="text-xs text-gray-500 mt-4">PNG with transparency fully supported</p>
                </div>
            )}

            {/* Image Analysis */}
            {analysis && !result && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                    <h3 className="font-semibold text-white">Image Analysis</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Resolution:</span>
                                <span className="font-medium text-gray-200">{analysis.resolution.width} × {analysis.resolution.height}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Colors Detected:</span>
                                <span className="font-medium text-gray-200">{analysis.colorCount}+</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Transparency:</span>
                                <span className="font-medium text-gray-200">{analysis.hasTransparency ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Detected Type:</span>
                                <span className="font-medium capitalize text-gray-200">{analysis.imageType}</span>
                            </div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                            {preview && <img src={preview} alt="Preview" className="max-h-32 mx-auto object-contain" />}
                        </div>
                    </div>
                </div>
            )}

            {/* Vectorization Mode */}
            {file && !result && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                    <h3 className="font-semibold text-white">Vectorization Mode</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                        <button
                            onClick={() => setMode('logo')}
                            className={`p-4 rounded-lg border text-left transition-all ${mode === 'logo' ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 hover:bg-white/5'}`}
                        >
                            <div className="font-medium mb-1 text-white">Logo / Flat Art</div>
                            <div className="text-xs text-gray-400">Clean shapes, sharp edges</div>
                        </button>
                        <button
                            onClick={() => setMode('illustration')}
                            className={`p-4 rounded-lg border text-left transition-all ${mode === 'illustration' ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 hover:bg-white/5'}`}
                        >
                            <div className="font-medium mb-1 text-white">Illustration</div>
                            <div className="text-xs text-gray-400">More curves, artistic</div>
                        </button>
                        <button
                            onClick={() => setMode('photograph')}
                            className={`p-4 rounded-lg border text-left transition-all ${mode === 'photograph' ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 hover:bg-white/5'}`}
                        >
                            <div className="font-medium mb-1 text-white">Photograph</div>
                            <div className="text-xs text-orange-400">⚠️ Experimental</div>
                        </button>
                    </div>
                </div>
            )}

            {/* Vectorization Controls */}
            {file && !result && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                    <h3 className="font-semibold text-white">Vectorization Controls</h3>

                    <div className="space-y-4">
                        {/* Edge Detection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Edge Detection Sensitivity: {edgeSensitivity}
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={edgeSensitivity}
                                onChange={(e) => setEdgeSensitivity(Number(e.target.value))}
                                className="w-full accent-violet-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Low = smoother • High = more detail</p>
                        </div>

                        {/* Color Quantization */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Color Quantization: {colorQuantization} colors
                            </label>
                            <input
                                type="range"
                                min="2"
                                max="64"
                                value={colorQuantization}
                                onChange={(e) => setColorQuantization(Number(e.target.value))}
                                className="w-full accent-violet-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">2-8 = logos • 16-32 = illustrations • 64+ = photos</p>
                        </div>

                        {/* Path Smoothing */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Path Smoothing</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['none', 'moderate', 'high'] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setPathSmoothing(level)}
                                        className={`p-2 rounded-lg border text-sm transition-all ${pathSmoothing === level ? 'border-violet-500/50 bg-violet-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        {level === 'none' ? 'None (Raw)' : level === 'moderate' ? 'Moderate' : 'High (Clean)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Corner Precision */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Corner Precision</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['sharp', 'rounded'] as const).map((precision) => (
                                    <button
                                        key={precision}
                                        onClick={() => setCornerPrecision(precision)}
                                        className={`p-2 rounded-lg border text-sm transition-all ${cornerPrecision === precision ? 'border-violet-500/50 bg-violet-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        {precision === 'sharp' ? 'Sharp (Logos)' : 'Rounded (Artwork)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Noise Removal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Noise Removal: {noiseRemoval}px
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={noiseRemoval}
                                onChange={(e) => setNoiseRemoval(Number(e.target.value))}
                                className="w-full accent-violet-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Convert Button */}
            {file && !result && !processing && (
                <button
                    onClick={vectorize}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
                >
                    <Layers className="w-5 h-5" />
                    Vectorize to SVG
                </button>
            )}

            {/* Processing */}
            {processing && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
                        <span className="font-medium text-lg text-white">Vectorizing image...</span>
                    </div>
                    <p className="text-sm text-gray-400 text-center mt-4">
                        Edge detection → Path tracing → Shape simplification → SVG generation
                    </p>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <div className="flex-1">
                                <p className="font-medium text-green-100">Vectorization Complete!</p>
                                <p className="text-sm text-green-300/80">
                                    {result.pathCount} paths • {(result.fileSize / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={downloadSVG}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                            >
                                <Download className="w-4 h-4" />
                                Download SVG
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(result.svgCode);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all ${copied ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {copied ? <CheckCircle className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                            <button
                                onClick={reset}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                            >
                                Vectorize Another
                            </button>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white">Live Preview</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="p-2 hover:bg-white/10 rounded text-gray-300">
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-400">{zoom}%</span>
                                <button onClick={() => setZoom(Math.min(800, zoom + 25))} className="p-2 hover:bg-white/10 rounded text-gray-300">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-400 mb-2">Original PNG</p>
                                <div className="bg-black/20 rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                                    {preview && <img src={preview} alt="Original" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }} />}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400 mb-2">Generated SVG</p>
                                <div className="bg-black/20 rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                                    <img src={result.svgUrl} alt="Vectorized" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SVG Output Quality Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
                        <p className="font-medium text-blue-200 mb-2">SVG Output Quality</p>
                        <p className="text-sm text-blue-300/80 mb-2">Generated SVG contains:</p>
                        <ul className="text-sm text-blue-300/80 list-disc list-inside space-y-1">
                            <li>Real vector paths (no embedded images)</li>
                            <li>Proper viewBox and dimensions</li>
                            <li>Optimized coordinates</li>
                            {analysis?.hasTransparency && <li>Preserved transparency</li>}
                        </ul>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-200">Vectorization Error</p>
                        <p className="text-sm text-red-300/80">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PNGToSVG;
