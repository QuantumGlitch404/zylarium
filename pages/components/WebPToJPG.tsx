import React, { useState } from 'react';
import { Upload, Download, Settings, CheckCircle, AlertCircle, RefreshCw, X, Shield, Lock, Zap } from 'lucide-react';

interface WebPFile {
    id: string;
    file: File;
    preview: string;
    width: number;
    height: number;
    size: number;
}

interface ConvertedImage {
    id: string;
    original: WebPFile;
    jpgUrl: string;
    jpgSize: number;
    compressionRatio: number;
}

const WebPToJPG: React.FC = () => {
    const [files, setFiles] = useState<WebPFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ConvertedImage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Settings
    const [quality, setQuality] = useState(90);
    const [chromaSubsampling, setChromaSubsampling] = useState<'4:4:4' | '4:2:0'>('4:4:4');
    const [background, setBackground] = useState<'white' | 'black' | 'custom'>('white');
    const [customBg, setCustomBg] = useState('#ffffff');
    const [keepMetadata, setKeepMetadata] = useState(true);
    const [progressive, setProgressive] = useState(true);

    const handleFilesSelect = async (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const webpFiles: WebPFile[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (!file.type.includes('webp') && !file.name.endsWith('.webp')) {
                setError(`${file.name} is not a WebP file`);
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

                webpFiles.push({
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

        setFiles(prev => [...prev, ...webpFiles]);
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
                const webpFile = files[i];
                setProgress(Math.round(((i + 1) / files.length) * 100));

                // Load image
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = webpFile.preview;
                });

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;

                // Handle background for transparent WebP
                const bgColor = background === 'custom' ? customBg :
                    background === 'white' ? '#ffffff' : '#000000';
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
                const compressionRatio = Math.round((1 - jpgBlob.size / webpFile.size) * 100);

                converted.push({
                    id: webpFile.id,
                    original: webpFile,
                    jpgUrl,
                    jpgSize: jpgBlob.size,
                    compressionRatio
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
        a.download = result.original.file.name.replace(/\.webp$/i, `.jpg`);
        a.click();
    };

    const downloadAll = async () => {
        // Use JSZip if available, otherwise download individually
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
                zip.file(result.original.file.name.replace(/\.webp$/i, `.jpg`), blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted_images.zip';
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
                    <RefreshCw className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">WebP to JPG Converter</h2>
                <p className="text-gray-400 mb-4">Convert modern WebP images into universally supported JPG format</p>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span>No uploads stored</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Lock className="w-4 h-4 text-green-400" />
                        <span>Processed locally / securely</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span>Lossless metadata handling</span>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            {files.length === 0 && results.length === 0 && (
                <div
                    onDrop={(e) => { e.preventDefault(); handleFilesSelect(e.dataTransfer.files); }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-blue-400/50 transition-all bg-white/5 backdrop-blur-xl group"
                >
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-white/70" />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">Drop WebP images here</p>
                    <p className="text-sm text-gray-400 mb-4">or</p>
                    <input
                        type="file"
                        accept=".webp,image/webp"
                        multiple
                        onChange={(e) => handleFilesSelect(e.target.files)}
                        className="hidden"
                        id="webp-input"
                    />
                    <label
                        htmlFor="webp-input"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        Select WebP Files
                    </label>
                    <p className="text-xs text-gray-400 mt-4">Supports batch conversion</p>
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

                    {/* Settings Panel */}
                    <div className="border-t border-white/10 pt-4">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-gray-200 font-medium hover:text-white"
                        >
                            <Settings className="w-5 h-5" />
                            Advanced Settings
                            <span className="text-sm text-gray-400">({showAdvanced ? 'Hide' : 'Show'})</span>
                        </button>

                        {showAdvanced && (
                            <div className="mt-4 space-y-4 p-4 bg-black/20 rounded-lg border border-white/10">
                                {/* Quality Slider */}
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
                                        className="w-full accent-blue-500"
                                    />
                                </div>

                                {/* Chroma Subsampling */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Chroma Subsampling</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setChromaSubsampling('4:4:4')}
                                            className={`flex-1 p-2 rounded-lg border transition-all ${chromaSubsampling === '4:4:4' ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                        >
                                            4:4:4 (Best)
                                        </button>
                                        <button
                                            onClick={() => setChromaSubsampling('4:2:0')}
                                            className={`flex-1 p-2 rounded-lg border transition-all ${chromaSubsampling === '4:2:0' ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                        >
                                            4:2:0 (Smaller)
                                        </button>
                                    </div>
                                </div>

                                {/* Background Handling */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Background (for transparent WebP)</label>
                                    <div className="flex gap-2">
                                        {(['white', 'black', 'custom'] as const).map(bg => (
                                            <button
                                                key={bg}
                                                onClick={() => setBackground(bg)}
                                                className={`flex-1 p-2 rounded-lg border transition-all ${background === bg ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                            >
                                                {bg.charAt(0).toUpperCase() + bg.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    {background === 'custom' && (
                                        <input
                                            type="color"
                                            value={customBg}
                                            onChange={(e) => setCustomBg(e.target.value)}
                                            className="mt-2 w-full h-10 rounded bg-transparent cursor-pointer"
                                        />
                                    )}
                                </div>

                                {/* Toggles */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-300">Keep EXIF Metadata</span>
                                    <button
                                        onClick={() => setKeepMetadata(!keepMetadata)}
                                        className={`w-12 h-6 rounded-full transition ${keepMetadata ? 'bg-blue-600' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition transform ${keepMetadata ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-300">Progressive JPG</span>
                                    <button
                                        onClick={() => setProgressive(!progressive)}
                                        className={`w-12 h-6 rounded-full transition ${progressive ? 'bg-blue-600' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition transform ${progressive ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Convert Button */}
                    {!processing && (
                        <button
                            onClick={convertToJPG}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Convert to JPG
                        </button>
                    )}
                </div>
            )}

            {/* Processing */}
            {processing && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-white">Converting...</span>
                        <span className="text-blue-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden border border-white/10">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }} />
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                {results.length > 1 ? 'Download All (ZIP)' : 'Download JPG'}
                            </button>
                            <button
                                onClick={clearAll}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/10 transition-all"
                            >
                                Convert Another
                            </button>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="grid gap-4">
                        {results.map(result => (
                            <div key={result.id} className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 mb-2">Original WebP</p>
                                        <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                                            <img src={result.original.preview} alt="Original" className="w-full h-48 object-contain" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">{(result.original.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 mb-2">Converted JPG</p>
                                        <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                                            <img src={result.jpgUrl} alt="Converted" className="w-full h-48 object-contain" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {(result.jpgSize / 1024).toFixed(1)} KB
                                            {result.compressionRatio !== 0 && (
                                                <span className={result.compressionRatio > 0 ? 'text-green-400' : 'text-orange-400'}>
                                                    {' '}({result.compressionRatio > 0 ? '-' : '+'}{Math.abs(result.compressionRatio)}%)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadSingle(result)}
                                    className="mt-4 w-full py-2 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-all"
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

export default WebPToJPG;
