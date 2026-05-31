import React, { useState, useRef, useEffect } from 'react';
import { Eraser, Image as ImageIcon, Layers, Download, RefreshCw, Eye, EyeOff, Scissors, Droplet } from 'lucide-react';
import { Button } from '../../components/CommonUI';

const BackgroundRemover: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

    // Tools
    const [tool, setTool] = useState<'auto' | 'manual'>('auto');
    const [tolerance, setTolerance] = useState(20);
    const [brushSize, setBrushSize] = useState(20);
    const [isProcessing, setIsProcessing] = useState(false);

    // Canvas References
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasUrl, setCanvasUrl] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);

        const img = new Image();
        img.onload = () => {
            setOriginalImage(img);
            resetCanvas(img);
        };
        img.src = url;
    };

    const resetCanvas = (img: HTMLImageElement) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Resize canvas to manageable size for performance while keeping aspect ratio
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w *= ratio;
            h *= ratio;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            setCanvasUrl(canvas.toDataURL());
        }
    };

    // Magic Wand / Color Key Removal (Simplified)
    const removeColor = (startX: number, startY: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Get target color
        const targetIndex = (Math.floor(startY) * w + Math.floor(startX)) * 4;
        const r0 = data[targetIndex];
        const g0 = data[targetIndex + 1];
        const b0 = data[targetIndex + 2];

        // Simple threshold removal (Flood fill would be better but expensive in JS without optimized algos for large images)
        // We'll do a global color key for now as it's faster and often what users want for solid backgrounds
        // OR a flood fill if we want to be fancy. Let's do a simple "Similarity Mask" which is robust.

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue; // Already transparent

            const dist = Math.sqrt(
                Math.pow(r - r0, 2) +
                Math.pow(g - g0, 2) +
                Math.pow(b - b0, 2)
            );

            if (dist <= tolerance) {
                data[i + 3] = 0; // Transparent
            }
        }

        ctx.putImageData(imageData, 0, 0);
        setCanvasUrl(canvas.toDataURL());
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool !== 'auto') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        removeColor(x, y);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool !== 'manual' || e.buttons !== 1) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Update preview infrequently? No, live is okay for canvas
    };

    const handleMouseUp = () => {
        if (canvasRef.current) {
            setCanvasUrl(canvasRef.current.toDataURL());
        }
    };

    const download = () => {
        if (!canvasUrl) return;
        const link = document.createElement('a');
        link.download = `removed_bg_${file?.name.split('.')[0]}.png`;
        link.href = canvasUrl;
        link.click();
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-red-500/20 backdrop-blur-md rounded-full mb-3">
                    <Eraser className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Background Remover</h1>
                <p className="text-gray-300">Remove backgrounds using Magic Wand or Manual Eraser</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-red-500 bg-red-500/10' : 'border-white/20 hover:border-red-400'
                        }`}>
                        {!file ? (
                            <label className="cursor-pointer block">
                                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <h3 className="font-medium text-white">Upload Image</h3>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        ) : (
                            <div>
                                <h3 className="font-medium text-white truncate">{file.name}</h3>
                                <button onClick={() => { setFile(null); setOriginalImage(null); }} className="text-xs text-red-400 hover:underline mt-2">Change Image</button>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5 space-y-6">
                            {/* Tool Select */}
                            <div className="flex bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => setTool('auto')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${tool === 'auto' ? 'bg-white/10 text-red-400 shadow-sm' : 'text-gray-400'}`}
                                >
                                    <Droplet className="w-4 h-4" /> Magic Wand
                                </button>
                                <button
                                    onClick={() => setTool('manual')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${tool === 'manual' ? 'bg-white/10 text-red-400 shadow-sm' : 'text-gray-400'}`}
                                >
                                    <Scissors className="w-4 h-4" /> Eraser
                                </button>
                            </div>

                            {tool === 'auto' ? (
                                <div>
                                    <label className="text-sm font-medium block mb-2 text-gray-300">
                                        Color Tolerance ({tolerance})
                                    </label>
                                    <input
                                        type="range" min="1" max="100"
                                        value={tolerance} onChange={(e) => setTolerance(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-400 mt-2">Click on the background color in the image to remove it.</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium block mb-2 text-gray-300">
                                        Eraser Size ({brushSize}px)
                                    </label>
                                    <input
                                        type="range" min="5" max="100"
                                        value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-400 mt-2">Click and drag to manually erase parts of the image.</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/10">
                                <Button onClick={() => originalImage && resetCanvas(originalImage)} variant="outline" className="w-full mb-2 bg-transparent border-white/20 text-white hover:bg-white/10">
                                    <RefreshCw className="w-4 h-4 mr-2" /> Reset
                                </Button>
                                <Button onClick={download} className="w-full bg-red-600 hover:bg-red-700 text-white border-0">
                                    <Download className="w-4 h-4 mr-2" /> Download PNG
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Canvas Area */}
                <div className="lg:col-span-2 bg-[url('https://t3.ftcdn.net/jpg/02/67/78/58/360_F_267785834_6R2j6kK1f5tt9kE2w5c7z8k3.jpg')] bg-contain bg-black/40 rounded-3xl border border-white/20 overflow-hidden flex items-center justify-center relative touch-none shadow-2xl">
                    {!file && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
                            <div className="text-center text-gray-400">
                                <Layers className="w-16 h-16 mx-auto mb-4 opacity-30 text-white" />
                                <p className="text-white font-medium text-lg">Upload an Image to Start Editing</p>
                            </div>
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className={`max-w-full max-h-[600px] shadow-2xl ${tool === 'auto' ? 'cursor-crosshair' : 'cursor-cell'}`}
                        onMouseDown={handleCanvasClick}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    // Touch support could be added but stick to mouse for MVP stability
                    />
                </div>
            </div>

            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-center text-sm text-yellow-500">
                To remove complex backgrounds (like hair) automatically, professional software is usually required.
                This tool is best for removing solid colors or manual cleanup.
            </div>
        </div>
    );
};

export default BackgroundRemover;
