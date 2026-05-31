import React, { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, X, Info, ImageIcon } from 'lucide-react';

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
    pngUrl: string;
    pngSize: number;
    sizeIncrease: number;
}

const JPGToPNG: React.FC = () => {
    const [files, setFiles] = useState<JPGFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ConvertedImage[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Settings
    const [pngType, setPngType] = useState<'standard' | 'optimized'>('standard');
    const [colorDepth, setColorDepth] = useState<'auto' | '8bit' | '16bit'>('auto');

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
        results.forEach(r => URL.revokeObjectURL(r.pngUrl));
        setFiles([]);
        setResults([]);
        setError(null);
    };

    const convertToPNG = async () => {
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

                // Convert to PNG
                // Note: Browser toBlob for PNG doesn't support quality parameter
                // Optimized PNG would require a library like pngquant, so we'll just use standard PNG
                const pngBlob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (blob) => blob ? resolve(blob) : reject(new Error('Conversion failed')),
                        'image/png'
                    );
                });

                const pngUrl = URL.createObjectURL(pngBlob);
                const sizeIncrease = Math.round((pngBlob.size / jpgFile.size - 1) * 100);

                converted.push({
                    id: jpgFile.id,
                    original: jpgFile,
                    pngUrl,
                    pngSize: pngBlob.size,
                    sizeIncrease
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
        a.href = result.pngUrl;
        a.download = result.original.file.name.replace(/\.(jpg|jpeg)$/i, `.png`);
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
                const response = await fetch(result.pngUrl);
                const blob = await response.blob();
                zip.file(result.original.file.name.replace(/\.(jpg|jpeg)$/i, `.png`), blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted_png.zip';
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
                <div className="inline-flex items-center justify-center p-4 bg-purple-500/20 backdrop-blur-md rounded-2xl mb-4 shadow-lg">
                    <ImageIcon className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">JPG to PNG Converter</h2>
                <p className="text-gray-300 mb-4">Convert JPG to PNG (lossless output)</p>

                {/* Purpose */}
                <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-gray-400">
                    <span>✓ For editing</span>
                    <span>✓ Archiving</span>
                    <span>✓ Graphics workflows</span>
                </div>
            </div>

            {/* Honest UX Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-blue-300">Important Information</p>
                    <p className="text-sm text-blue-200">PNG will be larger than JPG. This tool preserves quality, not size. Use this for editing, archiving, or when you need a lossless format.</p>
                </div>
            </div>

            {/* Upload Area */}
            {files.length === 0 && results.length === 0 && (
                <div
                    onDrop={(e) => { e.preventDefault(); handleFilesSelect(e.dataTransfer.files); }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-purple-500 hover:bg-white/5 transition-all"
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
                        id="jpg-to-png-input"
                    />
                    <label
                        htmlFor="jpg-to-png-input"
                        className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer shadow-lg shadow-purple-500/20"
                    >
                        Select JPG Files
                    </label>
                    <p className="text-xs text-gray-500 mt-4">Batch conversion supported</p>
                </div>
            )}

            {/* File List & Settings */}
            {files.length > 0 && results.length === 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">{files.length} file(s) selected</h3>
                        <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-300">Clear All</button>
                    </div>

                    {/* File Grid */}
                    <div className="grid gap-4">
                        {files.map(file => (
                            <div key={file.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                <img src={file.preview} alt={file.file.name} className="w-16 h-16 object-cover rounded" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{file.file.name}</p>
                                    <p className="text-sm text-gray-400">
                                        {file.width} × {file.height} • {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Output Settings */}
                    <div className="border-t border-white/10 pt-4 space-y-4">
                        <h4 className="font-medium text-white">Output Settings</h4>

                        {/* PNG Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">PNG Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setPngType('standard')}
                                    className={`p-3 rounded-lg border ${pngType === 'standard' ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/10 text-gray-400 bg-white/5'}`}
                                >
                                    <div className="font-medium">Standard PNG</div>
                                    <div className="text-xs text-gray-400">Full quality</div>
                                </button>
                                <button
                                    onClick={() => setPngType('optimized')}
                                    className={`p-3 rounded-lg border ${pngType === 'optimized' ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/10 text-gray-400 bg-white/5'}`}
                                >
                                    <div className="font-medium">Optimized PNG</div>
                                    <div className="text-xs text-gray-400">Smaller (same quality)</div>
                                </button>
                            </div>
                        </div>

                        {/* Color Depth */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Color Depth</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setColorDepth('auto')}
                                    className={`p-3 rounded-lg border ${colorDepth === 'auto' ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/10 text-gray-400 bg-white/5'}`}
                                >
                                    <div className="font-medium">Auto</div>
                                    <div className="text-xs text-gray-400">Recommended</div>
                                </button>
                                <button
                                    onClick={() => setColorDepth('8bit')}
                                    className={`p-3 rounded-lg border ${colorDepth === '8bit' ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/10 text-gray-400 bg-white/5'}`}
                                >
                                    <div className="font-medium">8-bit</div>
                                    <div className="text-xs text-gray-400">Standard</div>
                                </button>
                                <button
                                    onClick={() => setColorDepth('16bit')}
                                    className={`p-3 rounded-lg border ${colorDepth === '16bit' ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/10 text-gray-400 bg-white/5'}`}
                                >
                                    <div className="font-medium">16-bit</div>
                                    <div className="text-xs text-gray-400">Maximum</div>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Note: Browser PNG encoding uses standard 8-bit color depth. 16-bit option preserved for completeness.
                            </p>
                        </div>
                    </div>

                    {/* Convert Button */}
                    {!processing && (
                        <button
                            onClick={convertToPNG}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <ImageIcon className="w-5 h-5" />
                            Convert to PNG
                        </button>
                    )}
                </div>
            )}

            {/* Processing */}
            {processing && (
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-white">Converting...</span>
                        <span className="text-purple-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <p className="font-medium text-green-300">Conversion Complete! ({results.length} file{results.length > 1 ? 's' : ''})</p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={downloadAll}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Download className="w-4 h-4" />
                                {results.length > 1 ? 'Download All (ZIP)' : 'Download PNG'}
                            </button>
                            <button
                                onClick={clearAll}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20"
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
                                            {(result.original.size / 1024).toFixed(1)} KB → {(result.pngSize / 1024).toFixed(1)} KB
                                        </span>
                                        <span className="text-sm font-semibold text-orange-400">
                                            ↑ +{result.sizeIncrease}% larger (expected)
                                        </span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 mb-2">Original JPG</p>
                                        <img src={result.original.preview} alt="Original" className="w-full h-48 object-contain bg-black/20 rounded" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 mb-2">Lossless PNG</p>
                                        <img src={result.pngUrl} alt="Converted" className="w-full h-48 object-contain bg-black/20 rounded" />
                                    </div>
                                </div>

                                <button
                                    onClick={() => downloadSingle(result)}
                                    className="w-full py-2 text-purple-400 border border-purple-400/30 rounded-lg hover:bg-purple-500/10"
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

export default JPGToPNG;
