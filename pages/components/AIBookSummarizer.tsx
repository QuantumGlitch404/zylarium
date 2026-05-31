import React, { useState } from 'react';
import { Book, FileText, Upload, Clock, Quote, Layers, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { summarizeBook } from '../../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker (if not already configured globally)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;


const AIBookSummarizer: React.FC = () => {
    // State
    const [file, setFile] = useState<File | null>(null);
    const [isFileProcessed, setIsFileProcessed] = useState(false);
    const [fullText, setFullText] = useState('');
    const [summaryMode, setSummaryMode] = useState<'full' | 'chapter'>('full');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    // Book Stats (Mocked or calculated)
    const [pageCount, setPageCount] = useState(0);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setResult('');
        setError('');
        setIsFileProcessed(false);
        setLoading(true);

        try {
            let text = '';
            if (selectedFile.type === 'text/plain') {
                text = await selectedFile.text();
                setPageCount(Math.ceil(text.length / 3000)); // Approx pages
            } else if (selectedFile.type === 'application/pdf') {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                setPageCount(pdf.numPages);

                // Extract text (limit to first 50 pages for demo performance if needed, or all)
                const maxPages = Math.min(pdf.numPages, 50);
                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item: any) => item.str).join(' ') + '\n';
                }
            } else {
                setError('Please upload a PDF or TXT file.');
                setLoading(false);
                return;
            }

            setFullText(text);
            setIsFileProcessed(true);
        } catch (err) {
            setError('Failed to process file. It may be corrupted or password protected.');
        } finally {
            setLoading(false);
        }
    };

    const generateSummary = async () => {
        if (!fullText) return;
        setLoading(true);
        setError('');
        setResult('');

        try {
            // LLaMA 3.1 8B has 128k context length, we can send ~100000 characters
            const truncatedText = fullText.substring(0, 100000);

            const response = await fetch('/nvidia-api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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',
                },
                body: JSON.stringify({
                    model: 'meta/llama-3.1-8b-instruct',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a book summarization expert. Provide a ${summaryMode} summary of the following text.`
                        },
                        {
                            role: 'user',
                            content: truncatedText
                        }
                    ],
                    temperature: 0.5,
                    top_p: 1,
                    max_tokens: 1024,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const resultText = data.choices?.[0]?.message?.content || '';
            setResult(resultText.trim());
        } catch (err) {
            console.error(err);
            setError('Summarization failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-amber-500/20 rounded-full mb-3 backdrop-blur-md">
                    <Book className="w-8 h-8 text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">AI Book Summarizer</h1>
                <p className="text-gray-300 max-w-2xl mx-auto">
                    Transform lengthy documents into structured insights. Perfect for research, study, and quick reviews.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Panel: Upload & Config */}
                <div className="md:col-span-1 space-y-6">
                    {/* Upload Card */}
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-amber-400 bg-amber-500/10' : 'border-white/20 hover:border-amber-400 bg-white/5 hover:bg-white/10'
                        }`}>
                        {!file ? (
                            <label className="cursor-pointer block">
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <h3 className="font-medium text-white">Upload Book/Doc</h3>
                                <p className="text-xs text-gray-400 mt-1">PDF, TXT (Max 50MB)</p>
                                <input type="file" onChange={handleFileUpload} accept=".pdf,.txt" className="hidden" />
                            </label>
                        ) : (
                            <div>
                                <FileText className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                                <h3 className="font-medium text-white truncate px-2">{file.name}</h3>
                                <div className="mt-2 text-xs text-gray-400 flex justify-center items-center gap-2">
                                    <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                    <span>•</span>
                                    <span>~{pageCount} Pages</span>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setFullText(''); setIsFileProcessed(false); setResult(''); }}
                                    className="mt-4 text-xs text-red-400 hover:text-red-300 underline"
                                >
                                    Remove File
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Configuration */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5">
                        <h3 className="font-semibold text-white mb-4 flex items-center">
                            <Layers className="w-4 h-4 mr-2" /> Summary Mode
                        </h3>

                        <div className="space-y-3">
                            <button
                                onClick={() => setSummaryMode('full')}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${summaryMode === 'full'
                                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                                    : 'border-white/10 hover:bg-white/10 text-gray-300'
                                    }`}
                            >
                                <div className="font-medium text-sm">Overall Overview</div>
                                <div className="text-xs opacity-80 mt-1">Executive summary, themes, and key takeaways.</div>
                            </button>

                            <button
                                onClick={() => setSummaryMode('chapter')}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${summaryMode === 'chapter'
                                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                                    : 'border-white/10 hover:bg-white/10 text-gray-300'
                                    }`}
                            >
                                <div className="font-medium text-sm">Chapter-wise Breakdown</div>
                                <div className="text-xs opacity-80 mt-1">Detailed analysis of sequential sections.</div>
                            </button>
                        </div>

                        <button
                            onClick={generateSummary}
                            disabled={!isFileProcessed || loading}
                            className={`w-full mt-6 py-2 px-4 rounded-lg font-medium text-white transition-all ${!isFileProcessed || loading
                                ? 'bg-gray-600/50 cursor-not-allowed text-gray-400'
                                : 'bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/20'
                                }`}
                        >
                            {loading ? 'Analyzing Book...' : 'Generate Summary'}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="md:col-span-2 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-700 dark:text-red-300 text-sm">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="h-full min-h-[400px] bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="w-10 h-10 opacity-50 text-white" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Ready to Analyze</h3>
                            <p className="max-w-sm mt-2 text-gray-300">Upload a book or document to extract key insights, themes, and summaries automatically.</p>

                            <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-left max-w-md w-full">
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10 text-gray-300">
                                    <Clock className="w-4 h-4 text-amber-500" /> Saves 90% Reading Time
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10 text-gray-300">
                                    <Quote className="w-4 h-4 text-amber-500" /> Extracts Key Quotes
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10 text-gray-300">
                                    <Layers className="w-4 h-4 text-amber-500" /> Structural Analysis
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10 text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-amber-500" /> Actionable Insights
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full min-h-[400px] bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 flex flex-col items-center justify-center p-8">
                            <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                            <h3 className="font-medium text-white">Reading Document...</h3>
                            <p className="text-sm text-gray-400 mt-2">This may take a minute for larger files.</p>
                        </div>
                    )}

                    {result && (
                        <div className={`prose dark:prose-invert max-w-none bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-8 text-gray-300 leading-relaxed ${loading ? 'opacity-50' : ''}`}>
                            {result.split('\n').map((line, i) => (
                                <p key={i} className="mb-2">
                                    {line.split('**').map((part, j) => (
                                        j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
                                    ))}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center p-4">
                <p className="text-xs text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 inline-block px-4 py-2 rounded-full border border-amber-100 dark:border-amber-900/30">
                    Warning: This tool summarizes content and does not replace the experience of reading the full book.
                </p>
            </div>
        </div>
    );
};

export default AIBookSummarizer;
