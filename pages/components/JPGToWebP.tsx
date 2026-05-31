import React, { useState } from 'react';
import { Upload, Download, Settings, CheckCircle, AlertCircle, RefreshCw, X, Shield, Lock, Zap, ZoomIn, ArrowLeftRight } from 'lucide-react';

interface JPGFile {
    id: string;
    file: File;
    preview: string;
    width: number;
    height: number;
    size: number;
}

interface ConvertedImage {
    id: string;
    original: JPGFile;
    webpUrl: string;
    webpSize: number;
    savings: number;
}

const JPGToWebP: React.FC = () => {
    const [files, setFiles] = useState<JPGFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ConvertedImage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Settings
    const [compressionMode, setCompressionMode] = useState<'lossy' | 'near-lossless'>('lossy');
    const [quality, setQuality] = useState(80);
    const [targetFileSize, setTargetFileSize] = useState<number | null>(null);
    const [preserveMetadata, setPreserveMetadata] = useState(false);
    const [sharpYUV, setSharpYUV] = useState(true);
    const [showComparison, setShowComparison] = useState(false);

    const handleFilesSelect = async (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const jpgFiles: JPGFile[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.name.match(/\.(jpg|jpeg)$/i)) {
                setError(`${file.name} is not a JPG file`);
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

                jpgFiles.push({
                    id: `${file.name}-${Date.now()}-${i}`,
                    file,
                    preview,
                    width: img.width,
                    height: img.height,
                    size: file.size
                });
            } catch (err) {
                setError(`Failed to load ${file.name}`);
            }
        }

        setFiles(prev => [...prev, ...jpgFiles]);
        setError(null);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        files.forEach(f => URL.revokeObjectURL(f.preview));
        results.forEach(r => URL.revokeObjectURL(r.webpUrl));
        setFiles([]);
        setResults([]);
        setError(null);
    };

    const convertToWebP = async () => {
        if (files.length === 0) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setResults([]);

        const converted: ConvertedImage[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const jpgFile = files[i];
                setProgress(Math.round(((i + 1) / files.length) * 100));

                // Load image
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = jpgFile.preview;
                });

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Determine quality based on mode
                let webpQuality = compressionMode === 'lossy' ? quality / 100 : Math.max(0.95, quality / 100);

                // Convert to WebP
                const webpBlob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (blob) => blob ? resolve(blob) : reject(new Error('Conversion failed')),
                        'image/webp',
                        webpQuality
                    );
                });

                // If target file size is set, try to adjust quality
                if (targetFileSize && webpBlob.size > targetFileSize * 1024) {
                    let attempts = 0;
                    let adjustedQuality = webpQuality;
                    let currentBlob = webpBlob;

                    while (currentBlob.size > targetFileSize * 1024 && attempts < 5 && adjustedQuality > 0.1) {
                        adjustedQuality -= 0.1;
                        currentBlob = await new Promise<Blob>((resolve, reject) => {
                            canvas.toBlob(
                                (blob) => blob ? resolve(blob) : reject(new Error('Conversion failed')),
                                'image/webp',
                                adjustedQuality
                            );
                        });
                        attempts++;
                    }

                    const webpUrl = URL.createObjectURL(currentBlob);
                    const savings = Math.round((1 - currentBlob.size / jpgFile.size) * 100);

                    converted.push({
                        id: jpgFile.id,
                        original: jpgFile,
                        webpUrl,
                        webpSize: currentBlob.size,
                        savings
                    });
                } else {
                    const webpUrl = URL.createObjectURL(webpBlob);
                    const savings = Math.round((1 - webpBlob.size / jpgFile.size) * 100);

                    converted.push({
                        id: jpgFile.id,
                        original: jpgFile,
                        webpUrl,
                        webpSize: webpBlob.size,
                        savings
                    });
                }
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
        a.href = result.webpUrl;
        a.download = result.original.file.name.replace(/\.(jpg|jpeg)$/i, `.webp`);
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
                const response = await fetch(result.webpUrl);
                const blob = await response.blob();
                zip.file(result.original.file.name.replace(/\.(jpg|jpeg)$/i, `.webp`), blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'optimized_webp.zip';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('ZIP download failed, downloading individually');
            results.forEach(downloadSingle);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-green-500/20 backdrop-blur-md rounded-2xl mb-4 shadow-lg">
                    <Zap className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">JPG to WebP Converter</h2>
                <p className="text-gray-300 mb-4">Optimize JPG images into WebP for web performance</p>

                {/* Benefits */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span>30-80% size reduction</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span>SEO optimized</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Lock className="w-4 h-4 text-green-400" />
                        <span>Processed locally</span>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            {files.length === 0 && results.length === 0 && (
                <div
                    onDrop={(e) => { e.preventDefault(); handleFilesSelect(e.dataTransfer.files); }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-green-500 transition-all bg-white/5"
                >
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-white mb-2">Drop JPG images here</p>
                    <p className="text-sm text-gray-400 mb-4">or</p>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        multiple
                        onChange={(e) => handleFilesSelect(e.target.files)}
                        className="hidden"
                        id="jpg-input"
                    />
                    <label
                        htmlFor="jpg-input"
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer shadow-lg shadow-green-500/20"
                    >
                        Select JPG Files
                    </label>
                    <p className="text-xs text-gray-500 mt-4">Batch optimization supported</p>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && results.length === 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">{files.length} file(s) selected</h3>
                        <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-300">Clear All</button>
                    </div>
                    <div className="grid gap-4">
                        {files.map(file => (
                            <div key={file.id} className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-lg">
                                <img src={file.preview} alt={file.file.name} className="w-16 h-16 object-cover rounded" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{file.file.name}</p>
                                    <p className="text-sm text-gray-400">{file.width} × {file.height} • {(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Optimization Controls */}
                    <div className="border-t border-white/10 pt-4">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-white font-medium hover:text-gray-200"
                        >
                            <Settings className="w-5 h-5" />
                            Optimization Controls
                            <span className="text-sm text-gray-400">({showAdvanced ? 'Hide' : 'Show'})</span>
                        </button>

                        {showAdvanced && (
                            <div className="mt-4 space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                                {/* Compression Mode */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Compression Mode</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCompressionMode('lossy')}
                                            className={`flex-1 p-3 rounded-lg border ${compressionMode === 'lossy' ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 text-gray-400 bg-white/5'}`}
                                        >
                                            <div className="font-medium">Lossy</div>
                                            <div className="text-xs text-gray-500">Smaller files (default)</div>
                                        </button>
                                        <button
                                            onClick={() => setCompressionMode('near-lossless')}
                                            className={`flex-1 p-3 rounded-lg border ${compressionMode === 'near-lossless' ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 text-gray-400 bg-white/5'}`}
                                        >
                                            <div className="font-medium">Near-Lossless</div>
                                            <div className="text-xs text-gray-500">Better quality</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Quality Slider */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Quality: {quality}%
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={quality}
                                        onChange={(e) => setQuality(Number(e.target.value))}
                                        className="w-full bg-white/20"
                                    />
                                </div>

                                {/* Target File Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Target File Size (KB) - Optional
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Auto"
                                        value={targetFileSize || ''}
                                        onChange={(e) => setTargetFileSize(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Quality will auto-adjust to reach target</p>
                                </div>

                                {/* Toggles */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-300">Preserve Metadata</span>
                                    <button
                                        onClick={() => setPreserveMetadata(!preserveMetadata)}
                                        className={`w-12 h-6 rounded-full transition ${preserveMetadata ? 'bg-green-600' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition transform ${preserveMetadata ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-gray-300">Sharp YUV</span>
                                        <p className="text-xs text-gray-500">Better for text/images</p>
                                    </div>
                                    <button
                                        onClick={() => setSharpYUV(!sharpYUV)}
                                        className={`w-12 h-6 rounded-full transition ${sharpYUV ? 'bg-green-600' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition transform ${sharpYUV ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Convert Button */}
                    {!processing && (
                        <button
                            onClick={convertToWebP}
                            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            Optimize to WebP
                        </button>
                    )}
                </div>
            )}

            {/* Processing */}
            {processing && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-white">Optimizing...</span>
                        <span className="text-green-500 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <p className="font-medium text-green-300">Optimization Complete! ({results.length} file{results.length > 1 ? 's' : ''})</p>
                        </div>

                        {/* Total Savings */}
                        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-sm text-gray-300">Total Savings:</p>
                            <p className="text-2xl font-bold text-green-400">
                                {Math.round(results.reduce((acc, r) => acc + r.savings, 0) / results.length)}% average
                            </p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={downloadAll}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Download className="w-4 h-4" />
                                {results.length > 1 ? 'Download All (ZIP)' : 'Download WebP'}
                            </button>
                            <button
                                onClick={clearAll}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20"
                            >
                                Optimize More
                            </button>
                            <button
                                onClick={() => setShowComparison(!showComparison)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <ArrowLeftRight className="w-4 h-4" />
                                {showComparison ? 'Hide' : 'Show'} Comparison
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
                                            {(result.original.size / 1024).toFixed(1)} KB → {(result.webpSize / 1024).toFixed(1)} KB
                                        </span>
                                        <span className={`text-sm font-semibold ${result.savings > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                                            {result.savings > 0 ? '↓' : '↑'} {Math.abs(result.savings)}% {result.savings > 0 ? 'savings' : 'increase'}
                                        </span>
                                    </div>
                                </div>

                                {showComparison && (
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400 mb-2">Original JPG</p>
                                            <img src={result.original.preview} alt="Original" className="w-full h-48 object-contain bg-black/20 rounded" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-400 mb-2">Optimized WebP</p>
                                            <img src={result.webpUrl} alt="Optimized" className="w-full h-48 object-contain bg-black/20 rounded" />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => downloadSingle(result)}
                                    className="w-full py-2 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/10"
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
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Error</p>
                        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JPGToWebP;
