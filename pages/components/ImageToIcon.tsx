import React, { useState, useRef, useEffect } from 'react';
import { Layers, Download, Check, Settings, Image as ImageIcon } from 'lucide-react';
import JSZip from 'jszip';
import { Button } from '../../components/CommonUI';

const SIZES = [16, 32, 48, 64, 128, 256];

const ImageToIcon: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [rounded, setRounded] = useState(false);
    const [background, setBackground] = useState<'transparent' | 'white' | 'black'>('transparent');
    const [padding, setPadding] = useState(0); // Percent padding
    const [isGenerating, setIsGenerating] = useState(false);

    // Store data urls for previews
    const [generatedIcons, setGeneratedIcons] = useState<{ [key: number]: string }>({});

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    // Live Generate Previews
    useEffect(() => {
        if (!file || !preview) return;

        const generate = async () => {
            const img = new Image();
            img.src = preview;
            await new Promise(r => img.onload = r);

            const newIcons: { [key: number]: string } = {};

            for (const size of SIZES) {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (!ctx) continue;

                // Background
                if (background !== 'transparent') {
                    ctx.fillStyle = background;
                    if (rounded) {
                        ctx.beginPath();
                        ctx.roundRect(0, 0, size, size, size * 0.2); // 20% radius
                        ctx.fill();
                        ctx.clip(); // Clip image to rounded rect
                    } else {
                        ctx.fillRect(0, 0, size, size);
                    }
                } else if (rounded) {
                    // Transparent but rounded crop?
                    ctx.beginPath();
                    ctx.roundRect(0, 0, size, size, size * 0.2);
                    ctx.clip();
                }

                // Draw Image with Padding
                const p = (size * padding) / 100;
                const drawSize = size - (p * 2);

                // Maintain aspect ratio fit
                const ratio = Math.min(drawSize / img.width, drawSize / img.height);
                const w = img.width * ratio;
                const h = img.height * ratio;
                const x = p + (drawSize - w) / 2;
                const y = p + (drawSize - h) / 2;

                ctx.drawImage(img, x, y, w, h);
                newIcons[size] = canvas.toDataURL('image/png');
            }
            setGeneratedIcons(newIcons);
        };

        generate();
    }, [preview, rounded, background, padding]);

    const downloadZip = async () => {
        if (!generatedIcons[16]) return;
        setIsGenerating(true);

        const zip = new JSZip();
        const iconFolder = zip.folder("icons");

        // Add PNGs
        SIZES.forEach(size => {
            if (generatedIcons[size]) {
                const data = generatedIcons[size].split(',')[1];
                iconFolder?.file(`favicon-${size}x${size}.png`, data, { base64: true });
            }
        });

        // Generate Basic ICO (using 32x32 generally, or specialized lib. Here we save pngs primarily, maybe just rename 32 to ico for simple use or just provide pngs)
        // Creating a real multi-size ICO binary is complex without a library. We'll provide the PNG suite and an HTML snippet.

        const html = `
<!-- Favicon HTML -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-128x128.png"> <!-- Approx -->
        `;
        zip.file("index.html", html.trim());

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "favicons_pack.zip";
        a.click();
        setIsGenerating(false);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full mb-3 shadow-lg shadow-pink-500/20">
                    <Layers className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Image to Icon</h1>
                <p className="text-gray-400">Create professional favicon packs for your websites</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Settings */}
                <div className="space-y-6">
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all backdrop-blur-xl ${file ? 'border-pink-500/50 bg-pink-500/10' : 'border-white/20 hover:border-pink-400/50 bg-white/5'
                        }`}>
                        {!file ? (
                            <label className="cursor-pointer block">
                                <ImageIcon className="w-10 h-10 text-white/70 mx-auto mb-3" />
                                <h3 className="font-medium text-white">Upload Logo</h3>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        ) : (
                            <div className="flex items-center gap-3">
                                <img src={preview} className="w-12 h-12 object-contain rounded bg-white/10" />
                                <div className="text-left overflow-hidden">
                                    <h3 className="font-medium text-white truncate w-32">{file.name}</h3>
                                    <button onClick={() => { setFile(null); setPreview(''); }} className="text-xs text-red-400 hover:text-red-300 hover:underline">Remove</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5 space-y-5">
                            <h3 className="font-bold text-white flex items-center"><Settings className="w-4 h-4 mr-2" />Style Settings</h3>

                            <div>
                                <label className="text-sm font-medium block mb-2 text-gray-300">Style</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setRounded(false)}
                                        className={`flex-1 py-1.5 text-sm rounded border transition-all ${!rounded ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        Square
                                    </button>
                                    <button
                                        onClick={() => setRounded(true)}
                                        className={`flex-1 py-1.5 text-sm rounded border transition-all ${rounded ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        Rounded
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-2 text-gray-300">Background</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['transparent', 'white', 'black'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setBackground(c as any)}
                                            className={`py-1.5 text-xs capitalize rounded border transition-all ${background === c
                                                ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                                                : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-2 text-gray-300">Padding ({padding}%)</label>
                                <input type="range" min="0" max="40" value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} className="w-full accent-pink-500" />
                            </div>

                            <Button onClick={downloadZip} className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-500/20 border-none" disabled={isGenerating}>
                                {isGenerating ? 'Zipping...' : 'Download Icon Pack (ZIP)'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right: Grid */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
                    {!file ? (
                        <div className="h-full flex items-center justify-center text-gray-400 min-h-[300px]">
                            Previews will appear here
                        </div>
                    ) : (
                        <div>
                            <h3 className="font-bold text-white mb-6">Generated Previews</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {SIZES.map(size => (
                                    <div key={size} className="bg-black/20 p-4 rounded-xl shadow-sm border border-white/10 flex flex-col items-center justify-center backdrop-blur-sm hover:bg-black/30 transition-colors">
                                        <div className="flex-1 flex items-center justify-center mb-3 min-h-[64px]">
                                            {generatedIcons[size] && (
                                                <img
                                                    src={generatedIcons[size]}
                                                    width={size}
                                                    style={{ width: size > 64 ? 64 : size, height: size > 64 ? 64 : size, imageRendering: 'pixelated' }}
                                                    className="shadow-sm border border-white/20 bg-[url('https://t3.ftcdn.net/jpg/02/67/78/58/360_F_267785834_6R2j6kK1f5tt9kE2w5c7z8k3.jpg')] bg-contain rounded-sm"
                                                />
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-gray-400">{size}x{size}</span>
                                        <span className="text-xs text-green-400 font-medium mt-1">PNG</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageToIcon;
