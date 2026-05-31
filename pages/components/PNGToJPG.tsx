import React, { useState } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle, AlertCircle, X, Palette } from 'lucide-react';

interface PNGFile {
    id: string;
    file: File;
    preview: string;
    width: number;
    height: number;
    size: number;
    hasTransparency: boolean;
}

interface ConvertedImage {
    id: string;
    original: PNGFile;
    jpgUrl: string;
    jpgSize: number;
    savings: number;
}

const PNGToJPG: React.FC = () => {
    const [files, setFiles] = useState<PNGFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ConvertedImage[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Settings
    const [backgroundColor, setBackgroundColor] = useState<'white' | 'black' | 'custom'>('white');
    const [customBgColor, setCustomBgColor] = useState('#ffffff');
    const [quality, setQuality] = useState(90);
    const [chromaSubsampling, setChromaSubsampling] = useState<'4:4:4' | '4:2:0'>('4:2:0');

    const checkTransparency = async (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] < 255) {
                        resolve(true);
                        return;
                    }
                }
                resolve(false);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFilesSelect = async (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const pngFiles: PNGFile[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (!file.type.includes('png') && !file.name.endsWith('.png')) {
                setError(`${file.name} is not a PNG file`);
                continue;
            }

            try {
                const preview = URL.createObjectURL(file);
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = preview;
                });

                const hasTransparency = await checkTransparency(file);

                pngFiles.push({
                    id: `${file.name}-${Date.now()}-${i}`,
                    file,
                    preview,
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    hasTransparency
                });
            } catch (err) {
                setError(`Failed to load ${file.name}`);
            }
        }

        setFiles(prev => [...prev, ...pngFiles]);
        setError(null);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        files.forEach(f => URL.revokeObjectURL(f.preview));
        results.forEach(r => URL.revokeObjectURL(r.jpgUrl));
        setFiles([]);
        setResults([]);
        setError(null);
    };

    const convertToJPG = async () => {
        if (files.length === 0) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setResults([]);

        const converted: ConvertedImage[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const pngFile = files[i];
                setProgress(Math.round(((i + 1) / files.length) * 100));

                // Load image
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = pngFile.preview;
                });

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;

                // Apply background color to handle transparency
                const bgColor = backgroundColor === 'custom' ? customBgColor :
                    backgroundColor === 'white' ? '#ffffff' : '#000000';
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Convert to JPG
                const jpgQuality = quality / 100;
                const jpgBlob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (blob) => blob ? resolve(blob) : reject(new Error('Conversion failed')),
                        'image/jpeg',
                        jpgQuality
                    );
                });

                const jpgUrl = URL.createObjectURL(jpgBlob);
                const savings = Math.round((1 - jpgBlob.size / pngFile.size) * 100);

                converted.push({
                    id: pngFile.id,
                    original: pngFile,
                    jpgUrl,
                    jpgSize: jpgBlob.size,
                    savings
                });
            }

            setResults(converted);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Conversion failed');
        } finally {
            setProcessing(false);
        }
    };

    const downloadSingle = (result: ConvertedImage) => {
        const a = document.createElement('a');
        a.href = result.jpgUrl;
        a.download = result.original.file.name.replace(/\.png$/i, `.jpg`);
        a.click();
    };

    const downloadAll = async () => {
        if (results.length === 1) {
            downloadSingle(results[0]);
            return;
        }

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            for (const result of results) {
                const response = await fetch(result.jpgUrl);
                const blob = await response.blob();
                zip.file(result.original.file.name.replace(/\.png$/i, `.jpg`), blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted_jpg.zip';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('ZIP download failed, downloading individually');
            results.forEach(downloadSingle);
        }
    };

    const hasAnyTransparency = files.some(f => f.hasTransparency);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
                    <Palette className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">PNG to JPG Converter</h2>
                <p className="text-gray-400 mb-6">Convert PNG to JPG with smart transparency handling</p>

                {/* Purpose */}
                <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-gray-300">
                    <span>✓ Reduce file size</span>
                    <span>✓ Faster load times</span>
                    <span>✓ Meet upload limits</span>
                </div>
            </div>

            {/* Transparency Warning */}
            {hasAnyTransparency && files.length > 0 && results.length === 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-orange-200">Transparency Warning</p>
                        <p className="text-sm text-orange-300/80">PNG transparency will be removed and replaced with your selected background color. JPG format does not support transparency.</p>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            {files.length === 0 && results.length === 0 && (
                <div
                    onDrop={(e) => { e.preventDefault(); handleFilesSelect(e.dataTransfer.files); }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-orange-400/50 transition-all bg-white/5 backdrop-blur-xl group"
                >
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-white/70" />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">Drop PNG images here</p>
                    <p className="text-sm text-gray-400 mb-6">or</p>
                    <input
                        type="file"
                        accept=".png,image/png"
                        multiple
                        onChange={(e) => handleFilesSelect(e.target.files)}
                        className="hidden"
                        id="png-input"
                    />
                    <label
                        htmlFor="png-input"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 cursor-pointer shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                    >
                        Select PNG Files
                    </label>
                    <p className="text-xs text-gray-500 mt-4">Batch conversion supported</p>
                </div>
            )}

            {/* File List & Settings */}
            {files.length > 0 && results.length === 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">{files.length} file(s) selected</h3>
                        <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-300 transition-colors">Clear All</button>
                    </div>

                    {/* File Grid */}
                    <div className="grid gap-4">
                        {files.map(file => (
                            <div key={file.id} className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                                <img src={file.preview} alt={file.file.name} className="w-16 h-16 object-cover rounded bg-black/20" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{file.file.name}</p>
                                    <p className="text-sm text-gray-400">
                                        {file.width} × {file.height} • {(file.size / 1024).toFixed(1)} KB
                                        {file.hasTransparency && <span className="ml-2 text-orange-400">• Has transparency</span>}
                                    </p>
                                </div>
                                <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Transparency Handling Panel */}
                    <div className="border-t border-white/10 pt-6 space-y-4">
                        <h4 className="font-medium text-white">Transparency Handling</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Background Fill</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setBackgroundColor('white')}
                                    className={`p-3 rounded-lg border transition-all ${backgroundColor === 'white' ? 'border-orange-500/50 bg-orange-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="w-full h-8 bg-white border border-gray-300 rounded mb-2"></div>
                                    <div className="text-sm font-medium">White</div>
                                </button>
                                <button
                                    onClick={() => setBackgroundColor('black')}
                                    className={`p-3 rounded-lg border transition-all ${backgroundColor === 'black' ? 'border-orange-500/50 bg-orange-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="w-full h-8 bg-black rounded mb-2"></div>
                                    <div className="text-sm font-medium">Black</div>
                                </button>
                                <button
                                    onClick={() => setBackgroundColor('custom')}
                                    className={`p-3 rounded-lg border transition-all ${backgroundColor === 'custom' ? 'border-orange-500/50 bg-orange-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="w-full h-8 rounded mb-2" style={{ backgroundColor: customBgColor }}></div>
                                    <div className="text-sm font-medium">Custom</div>
                                </button>
                            </div>
                            {backgroundColor === 'custom' && (
                                <div className="mt-3">
                                    <label className="block text-sm text-gray-400 mb-1">Pick Custom Color</label>
                                    <input
                                        type="color"
                                        value={customBgColor}
                                        onChange={(e) => setCustomBgColor(e.target.value)}
                                        className="w-full h-12 rounded border border-white/20 bg-transparent cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Quality Controls */}
                        <div className="border-t border-white/10 pt-4 space-y-4">
                            <h4 className="font-medium text-white">Quality Controls</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Quality: {quality}%
                                </label>
                                <input
                                    type="range"
                                    min="60"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className="w-full accent-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Chroma Subsampling</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setChromaSubsampling('4:4:4')}
                                        className={`p-3 rounded-lg border transition-all ${chromaSubsampling === '4:4:4' ? 'border-orange-500/50 bg-orange-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <div className="font-medium">4:4:4</div>
                                        <div className="text-xs text-gray-500">Best Quality</div>
                                    </button>
                                    <button
                                        onClick={() => setChromaSubsampling('4:2:0')}
                                        className={`p-3 rounded-lg border transition-all ${chromaSubsampling === '4:2:0' ? 'border-orange-500/50 bg-orange-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <div className="font-medium">4:2:0</div>
                                        <div className="text-xs text-gray-500">Smaller Size</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Convert Button */}
                    {!processing && (
                        <button
                            onClick={convertToJPG}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                        >
                            <Palette className="w-5 h-5" />
                            Convert to JPG
                        </button>
                    )}
                </div>
            )}

            {/* Processing */}
            {processing && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-8 space-y-6 text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div>
                        <p className="text-lg font-medium text-white mb-2">Converting Images...</p>
                        <p className="text-gray-400">Processing {progress}%</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden max-w-md mx-auto">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <p className="font-medium text-green-100">Conversion Complete! ({results.length} file{results.length > 1 ? 's' : ''})</p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={downloadAll}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                            >
                                <Download className="w-4 h-4" />
                                {results.length > 1 ? 'Download All (ZIP)' : 'Download JPG'}
                            </button>
                            <button
                                onClick={clearAll}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                            >
                                Convert Another
                            </button>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="grid gap-4">
                        {results.map(result => (
                            <div key={result.id} className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
                                <div className="mb-3">
                                    <p className="font-medium text-white">{result.original.file.name}</p>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-sm text-gray-400">
                                            {(result.original.size / 1024).toFixed(1)} KB → {(result.jpgSize / 1024).toFixed(1)} KB
                                        </span>
                                        <span className={`text-sm font-semibold ${result.savings > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                                            {result.savings > 0 ? '↓' : '↑'} {Math.abs(result.savings)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 mb-2">Original PNG</p>
                                        <img src={result.original.preview} alt="Original" className="w-full h-48 object-contain bg-black/20 rounded border border-white/10" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 mb-2">Converted JPG</p>
                                        <img src={result.jpgUrl} alt="Converted" className="w-full h-48 object-contain bg-black/20 rounded border border-white/10" />
                                    </div>
                                </div>

                                <button
                                    onClick={() => downloadSingle(result)}
                                    className="w-full py-2 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/10 transition-colors"
                                >
                                    Download This File
                                </button>
                            </div>
                        ))}
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

export default PNGToJPG;
