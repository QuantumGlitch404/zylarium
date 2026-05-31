import React, { useState, useEffect } from 'react';
import { Type, Upload, Copy, Download, FileText, CheckCircle, AlertTriangle, ScanLine } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { Button } from '../../components/CommonUI';

const LANGUAGES = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'rus', name: 'Russian' },
    { code: 'hin', name: 'Hindi' },
    { code: 'ara', name: 'Arabic' },
];

const ImageOCR: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [text, setText] = useState('');
    const [language, setLanguage] = useState('eng');
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
        setText('');
        setConfidence(0);
        setProgress(0);
    };

    const processOCR = async () => {
        if (!file) return;
        setIsProcessing(true);
        setStatus('Processing...');
        setProgress(0);

        try {
            const worker = await Tesseract.createWorker(language);

            setStatus('Recognizing...');
            const ret = await worker.recognize(file);
            const text = ret.data.text;
            const confidence = ret.data.confidence;

            setText(text);
            setConfidence(confidence);
            setStatus('Completed');
            setIsProcessing(false);

            await worker.terminate();

        } catch (err) {
            console.error(err);
            setStatus('Error occurred');
            setIsProcessing(false);
            setText('Failed to extract text. Please ensure the image is clear.');
        }
    };

    const copyText = () => {
        navigator.clipboard.writeText(text);
    };

    const downloadText = () => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ocr_result_${file?.name.split('.')[0]}.txt`;
        a.click();
    };


    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full mb-3 shadow-lg shadow-yellow-500/20">
                    <ScanLine className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Image to Text (OCR)</h1>
                <p className="text-gray-400">Extract editable text from images, documents, and screenshots</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Input */}
                <div className="space-y-6">
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all backdrop-blur-xl ${file ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/20 hover:border-yellow-400/50 bg-white/5'
                        }`}>
                        {!file ? (
                            <label className="cursor-pointer block">
                                <Upload className="w-10 h-10 text-white/70 mx-auto mb-3" />
                                <h3 className="font-medium text-white">Upload Image</h3>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP, BMP</p>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        ) : (
                            <div className="relative">
                                <img src={preview} className="max-h-64 mx-auto object-contain rounded-lg shadow-sm" />
                                <button
                                    onClick={() => { setFile(null); setPreview(''); setText(''); }}
                                    className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-red-400 hover:text-red-300 backdrop-blur-sm border border-white/10"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-white appearance-none cursor-pointer hover:bg-black/30 transition-colors"
                                >
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-gray-800">{l.name}</option>)}
                                </select>
                            </div>

                            <Button onClick={processOCR} disabled={isProcessing} className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white shadow-lg shadow-yellow-500/20 border-none">
                                {isProcessing ? (
                                    <span className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {status}
                                    </span>
                                ) : 'Extract Text'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right: Output */}
                <div className="flex flex-col h-full min-h-[500px] bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="font-semibold text-white">Extracted Text</span>
                        </div>
                        {confidence > 0 && (
                            <span className={`text-xs px-2 py-1 rounded-full ${confidence > 80 ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'}`}>
                                {Math.round(confidence)}% Confidence
                            </span>
                        )}
                    </div>

                    <div className="flex-1 relative">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full h-full p-6 bg-transparent resize-none focus:outline-none text-gray-200 font-mono text-sm leading-relaxed placeholder-gray-500"
                            placeholder="Text will appear here after extraction..."
                        />
                        {!text && !isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <Type className="w-24 h-24 text-white" />
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                        <Button variant="outline" onClick={copyText} disabled={!text} className="bg-white/5 hover:bg-white/10 border-white/20 text-white">
                            <Copy className="w-4 h-4 mr-2" /> Copy
                        </Button>
                        <Button onClick={downloadText} disabled={!text} className="bg-white/10 hover:bg-white/20 text-white border border-white/20">
                            <Download className="w-4 h-4 mr-2" /> Download .txt
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center backdrop-blur-sm">
                <p className="text-sm text-blue-200">
                    <strong>Tip:</strong> For best results, ensure the image is well-lit and text is clearly visible.
                    Handwriting recognition capability is limited.
                </p>
            </div>
        </div>
    );
};

export default ImageOCR;
