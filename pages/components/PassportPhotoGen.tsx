import React, { useState, useRef, useEffect } from 'react';
import { UserSquare, Download, Move, ZoomIn, ZoomOut, Upload, RotateCw } from 'lucide-react';
import { Button } from '../../components/CommonUI';

const COUNTRIES = [
    { name: 'United States', w: 600, h: 600, ratio: 1, desc: '2x2 inches (600x600px)' },
    { name: 'United Kingdom', w: 827, h: 1063, ratio: 0.77, desc: '35x45mm' },
    { name: 'Schengen (EU)', w: 827, h: 1063, ratio: 0.77, desc: '35x45mm' },
    { name: 'India', w: 600, h: 600, ratio: 1, desc: '2x2 inches (51x51mm)' },
    { name: 'China', w: 354, h: 472, ratio: 0.75, desc: '33x48mm' },
    { name: 'Japan', w: 827, h: 1063, ratio: 0.77, desc: '35x45mm' },
];

const PassportPhotoGen: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [country, setCountry] = useState(COUNTRIES[0]);

    // Transform
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [rotate, setRotate] = useState(0);

    // Canvas
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                imgRef.current = img;
                // Center image initially
                setPos({ x: 0, y: 0 });
                setScale(1);
                setRotate(0);
                draw();
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(selectedFile);
        setFile(selectedFile);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas to output size
        canvas.width = country.w;
        canvas.height = country.h;

        // Clear
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Image Transformed
        ctx.save();
        ctx.translate(canvas.width / 2 + pos.x, canvas.height / 2 + pos.y);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
    };

    // Redraw on changes
    useEffect(() => {
        draw();
    }, [scale, pos, rotate, country]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPos({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const download = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `passport_photo_${country.name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full mb-3 shadow-lg shadow-indigo-500/20">
                    <UserSquare className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Passport Photo Generator</h1>
                <p className="text-gray-400">Create compliant ID photos for passports and visas</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all backdrop-blur-xl ${file ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/20 hover:border-indigo-400/50 bg-white/5'
                        }`}>
                        {!file ? (
                            <label className="cursor-pointer block">
                                <Upload className="w-10 h-10 text-white/70 mx-auto mb-3" />
                                <h3 className="font-medium text-white">Upload Portrait</h3>
                                <p className="text-xs text-gray-400 mt-1">Neutral background recommended</p>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        ) : (
                            <div>
                                <h3 className="font-medium text-white truncate">{file.name}</h3>
                                <button onClick={() => { setFile(null); imgRef.current = null; }} className="text-xs text-red-400 hover:text-red-300 hover:underline mt-2">Change Image</button>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Select Country / Format</label>
                                <select
                                    value={COUNTRIES.indexOf(country)}
                                    onChange={(e) => setCountry(COUNTRIES[parseInt(e.target.value)])}
                                    className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-white appearance-none cursor-pointer hover:bg-black/30 transition-colors"
                                >
                                    {COUNTRIES.map((c, i) => (
                                        <option key={c.name} value={i} className="bg-gray-800">{c.name} ({c.desc})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="flex justify-between text-xs font-medium text-gray-400 mb-1">
                                        <span>Zoom</span>
                                        <span>{Math.round(scale * 100)}%</span>
                                    </label>
                                    <input
                                        type="range" min="0.5" max="3" step="0.1"
                                        value={scale} onChange={(e) => setScale(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="flex justify-between text-xs font-medium text-gray-400 mb-1">
                                        <span>Rotate</span>
                                        <span>{rotate}°</span>
                                    </label>
                                    <input
                                        type="range" min="-180" max="180" step="1"
                                        value={rotate} onChange={(e) => setRotate(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-blue-500/10 text-xs text-blue-200 rounded-lg border border-blue-500/20">
                                Drag the image in the preview to position your face within the guide.
                            </div>

                            <Button onClick={download} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20 border-none">
                                <Download className="w-4 h-4 mr-2" /> Download Photo
                            </Button>
                        </div>
                    )}
                </div>

                {/* Preview */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 flex flex-col items-center justify-center p-8 overflow-hidden">
                    <div className="relative shadow-2xl bg-white rounded-sm">
                        <canvas
                            ref={canvasRef}
                            className={`max-w-full max-h-[600px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{ maxWidth: '100%', maxHeight: '500px', width: 'auto', height: 'auto' }}
                        />
                        {/* Overlay Guide - Pure CSS over Canvas */}
                        <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/50">
                            {/* Face Oval */}
                            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50%] h-[70%] border-2 border-dashed border-red-500/50 rounded-full opacity-50"></div>
                            {/* Center Line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-500/30"></div>
                            {/* Eye Line */}
                            <div className="absolute top-[45%] left-0 right-0 h-px bg-blue-500/30"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-400 mt-4">
                Requirement Disclaimer: All photos generated are estimates. Please verify with official government tools before submission.
            </div>
        </div>
    );
};

export default PassportPhotoGen;
