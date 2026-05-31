import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Upload, Download, Sliders, CheckCircle, AlertTriangle, Layers, FileImage } from 'lucide-react';
import { Button, Input } from '../../components/CommonUI';

const ImageCompressor: React.FC = () => {
    // State
    const [file, setFile] = useState<File | null>(null);
    const [originalPreview, setOriginalPreview] = useState<string>('');
    const [compressedPreview, setCompressedPreview] = useState<string>('');
    const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Settings
    const [quality, setQuality] = useState(0.8);
    const [format, setFormat] = useState<'original' | 'jpeg' | 'png' | 'webp'>('original');
    const [mode, setMode] = useState<'smart' | 'manual'>('smart');

    // Stats
    const [stats, setStats] = useState<{ originalSize: number; compressedSize: number } | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Reset
        setFile(selectedFile);
        setCompressedPreview('');
        setCompressedFile(null);
        setStats(null);

        // Create Preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            setOriginalPreview(ev.target?.result as string);
            // Auto compress on load if in smart mode
            compressImage(selectedFile, 0.8, 'original');
        };
        reader.readAsDataURL(selectedFile);
    };

    const compressImage = async (inputFile: File, q: number, fmt: string) => {
        setIsProcessing(true);

        const img = new Image();
        img.src = URL.createObjectURL(inputFile);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                setIsProcessing(false);
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Determine format
            let mimeType = inputFile.type;
            if (fmt === 'jpeg') mimeType = 'image/jpeg';
            if (fmt === 'png') mimeType = 'image/png';
            if (fmt === 'webp') mimeType = 'image/webp';

            canvas.toBlob((blob) => {
                if (!blob) return;

                const url = URL.createObjectURL(blob);
                setCompressedPreview(url);
                setCompressedFile(blob);
                setStats({
                    originalSize: inputFile.size,
                    compressedSize: blob.size
                });
                setIsProcessing(false);

                // Cleanup
                URL.revokeObjectURL(img.src);
            }, mimeType, q);
        };
    };

    // Re-compress when settings change (debounced ideally, but immediate for now)
    useEffect(() => {
        if (!file || mode === 'smart') return;
        compressImage(file, quality, format);
    }, [quality, format]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = () => {
        if (!compressedFile || !file) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedFile);

        let ext = file.name.split('.').pop();
        if (format !== 'original') ext = format === 'jpeg' ? 'jpg' : format;

        link.download = `min_${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;
        link.click();
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500/20 backdrop-blur-md rounded-full mb-3">
                    <Maximize2 className="w-8 h-8 text-blue-400 rotate-45" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Image Compressor</h1>
                <p className="text-gray-300">Reduce image size without visible quality loss</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Upload */}
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-blue-400'
                        }`}>
                        {!file ? (
                            <label className="cursor-pointer block">
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <h3 className="font-medium text-white">Upload Image</h3>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        ) : (
                            <div>
                                <h3 className="font-medium text-white truncate">{file.name}</h3>
                                <p className="text-xs text-gray-400 mt-1">{formatBytes(file.size)}</p>
                                <button onClick={() => setFile(null)} className="text-xs text-red-400 hover:underline mt-2">Remove</button>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    {file && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5 space-y-6">
                            <div className="flex bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => { setMode('smart'); setQuality(0.8); }}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'smart' ? 'bg-white/10 text-blue-400 shadow-sm' : 'text-gray-400'}`}
                                >
                                    Smart
                                </button>
                                <button
                                    onClick={() => setMode('manual')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'manual' ? 'bg-white/10 text-blue-400 shadow-sm' : 'text-gray-400'}`}
                                >
                                    Manual
                                </button>
                            </div>

                            {mode === 'manual' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                                            Quality <span>{Math.round(quality * 100)}%</span>
                                        </label>
                                        <input
                                            type="range" min="0.1" max="1.0" step="0.05"
                                            value={quality}
                                            onChange={(e) => setQuality(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                                        <select
                                            value={format}
                                            onChange={(e) => setFormat(e.target.value as any)}
                                            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white appearance-none"
                                        >
                                            <option value="original" className="bg-gray-800">Original</option>
                                            <option value="jpeg" className="bg-gray-800">JPEG</option>
                                            <option value="png" className="bg-gray-800">PNG</option>
                                            <option value="webp" className="bg-gray-800">WebP</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {stats && (
                                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-green-300 font-medium">Saved</span>
                                        <span className="text-sm font-bold text-green-400">
                                            {Math.round((1 - stats.compressedSize / stats.originalSize) * 100)}%
                                        </span>
                                    </div>
                                    <div className="text-xs text-green-500 opacity-80">
                                        {formatBytes(stats.originalSize)} → {formatBytes(stats.compressedSize)}
                                    </div>
                                </div>
                            )}

                            <Button onClick={handleDownload} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white border-0">
                                <Download className="w-4 h-4 mr-2" /> Download Compressed
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right: Preview */}
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                    {!originalPreview ? (
                        <div className="text-center text-gray-400">
                            <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Upload an image to see the comparison</p>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Valid Preview */}
                            <div className="grid grid-cols-2 gap-4 w-full h-full">
                                <div className="space-y-2 text-center">
                                    <span className="text-xs font-medium text-gray-400 uppercase">Original</span>
                                    <img src={originalPreview} className="max-h-[300px] mx-auto object-contain rounded-lg shadow-md bg-black/20" />
                                </div>
                                <div className="space-y-2 text-center relative">
                                    <span className="text-xs font-medium text-gray-400 uppercase">Compressed</span>
                                    {isProcessing ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <img src={compressedPreview} className="max-h-[300px] mx-auto object-contain rounded-lg shadow-md bg-black/20" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-center">
                {[
                    { t: 'Secure Processing', d: 'All compression happens in your browser.' },
                    { t: 'No Quality Loss', d: 'Smart algorithms preserve visual detail.' },
                    { t: 'Fast & Free', d: 'No limits on file size or usage.' }
                ].map((f, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                        <h4 className="font-semibold text-sm text-white">{f.t}</h4>
                        <p className="text-xs text-gray-400">{f.d}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageCompressor;
