import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Lock, Unlock, Download, RefreshCw, Smartphone, Monitor, Instagram, Linkedin, Crop } from 'lucide-react';
import { Button } from '../../components/CommonUI';

const PRESETS = [
    { name: 'Instagram Square', w: 1080, h: 1080 },
    { name: 'Instagram Portrait', w: 1080, h: 1350 },
    { name: 'Instagram Story', w: 1080, h: 1920 },
    { name: 'LinkedIn Banner', w: 1584, h: 396 },
    { name: 'YouTube Thumbnail', w: 1280, h: 720 },
    { name: 'HD 1080p', w: 1920, h: 1080 },
];

const ImageResizer: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [originalDims, setOriginalDims] = useState<{ w: number, h: number }>({ w: 0, h: 0 });

    // Resize Settings
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [locked, setLocked] = useState(true);
    const [unit, setUnit] = useState<'px' | '%'>('px');
    const [fitMode, setFitMode] = useState<'fill' | 'contain' | 'stretch'>('stretch');
    const [isProcessing, setIsProcessing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);

        const img = new Image();
        img.onload = () => {
            setOriginalDims({ w: img.width, h: img.height });
            setWidth(img.width);
            setHeight(img.height);
            setPreview(url);
        };
        img.src = url;
    };

    const handleDimensionChange = (val: number, type: 'w' | 'h') => {
        if (type === 'w') {
            setWidth(val);
            if (locked && originalDims.w > 0) {
                const ratio = originalDims.h / originalDims.w;
                setHeight(Math.round(val * ratio));
            }
        } else {
            setHeight(val);
            if (locked && originalDims.h > 0) {
                const ratio = originalDims.w / originalDims.h;
                setWidth(Math.round(val * ratio));
            }
        }
    };

    const applyPreset = (preset: { w: number, h: number }) => {
        setWidth(preset.w);
        setHeight(preset.h);
        setLocked(false); // Presets might not match original aspect ratio
    };

    const handleDownload = () => {
        if (!file || !preview) return;
        setIsProcessing(true);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            // Fill bg white (optional, usually good for JPEGs)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // Draw
            // For simple "resize", drawImage(img, 0, 0, width, height) stretches. 
            // If user wants fit/contain, we need math. For this tool "Resize", stretch/fill is standard behavior unless cropping (which is different tool).
            // But let's respect fitMode if we were to implement advanced. For now, standard resize stretches logic (user sets W/H).

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) return;
                const link = document.createElement('a');
                link.download = `resized_${file.name}`;
                link.href = URL.createObjectURL(blob);
                link.click();
                setIsProcessing(false);
            }, file.type, 0.9);
        };
        img.src = preview;
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mb-3 shadow-lg shadow-purple-500/20">
                    <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Image Resizer</h1>
                <p className="text-gray-400">Resize visuals for any platform or specification</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload & Settings */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Upload */}
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all backdrop-blur-xl ${file ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/20 hover:border-purple-400/50 bg-white/5'
                        }`}>
                        {!file ? (
                            <label className="cursor-pointer block">
                                <RefreshCw className="w-10 h-10 text-white/70 mx-auto mb-3" />
                                <h3 className="font-medium text-white">Select Image</h3>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        ) : (
                            <div>
                                <img src={preview} className="h-20 mx-auto object-contain rounded mb-2 border border-white/10 bg-black/20" />
                                <div className="text-xs text-gray-400">{originalDims.w} x {originalDims.h} px</div>
                                <button onClick={() => { setFile(null); setPreview(''); }} className="text-xs text-red-400 hover:text-red-300 hover:underline mt-2">Change Image</button>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5 space-y-6">
                            {/* Dimensions */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-white">Dimensions</label>
                                    <button
                                        onClick={() => setLocked(!locked)}
                                        className={`p-1 rounded hover:bg-white/10 transition-colors ${locked ? 'text-purple-400' : 'text-gray-400'}`}
                                        title={locked ? "Aspect Ratio Locked" : "Aspect Ratio Unlocked"}
                                    >
                                        {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-xs text-gray-400 mb-1 block">Width</span>
                                        <input
                                            type="number"
                                            value={width}
                                            onChange={(e) => handleDimensionChange(parseInt(e.target.value), 'w')}
                                            className="w-full p-2 border border-white/10 rounded-lg bg-black/20 text-white focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-400 mb-1 block">Height</span>
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => handleDimensionChange(parseInt(e.target.value), 'h')}
                                            className="w-full p-2 border border-white/10 rounded-lg bg-black/20 text-white focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Presets */}
                            <div>
                                <label className="text-sm font-bold text-white mb-2 block">Presets</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PRESETS.map(p => (
                                        <button
                                            key={p.name}
                                            onClick={() => applyPreset(p)}
                                            className="p-2 text-xs text-left border rounded hover:bg-white/10 border-white/10 text-gray-300 hover:text-white transition-colors"
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleDownload} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 border-none" disabled={isProcessing}>
                                {isProcessing ? (
                                    <span className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Processing...
                                    </span>
                                ) : 'Download Resized Image'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Preview */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden flex items-center justify-center p-8 relative">
                    {!file ? (
                        <div className="text-center text-gray-400">
                            <Crop className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                            <p>Live preview will appear here</p>
                        </div>
                    ) : (
                        <div
                            className="bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 flex items-center justify-center overflow-hidden backdrop-blur-sm"
                            style={{
                                width: Math.min(width, 600), // Max view width 600
                                height: Math.min(height, 600 * (height / width)), // Maintain aspect ratio for view
                                maxWidth: '100%',
                            }}
                        >
                            <img src={preview} className="w-full h-full object-fill" />
                        </div>
                    )}
                    {file && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md border border-white/10">
                            Preview: {width} x {height} px
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageResizer;
