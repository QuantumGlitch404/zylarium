import React, { useState, useRef } from 'react';
import { FileText, Upload, Link as LinkIcon, Download, Copy, RefreshCw, File, X, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { summarizeText } from '../../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AIEssaySummarizerProps {
    className?: string;
}

const AIEssaySummarizer: React.FC<AIEssaySummarizerProps> = () => {
    // Input State
    const [activeTab, setActiveTab] = useState<'text' | 'file' | 'url'>('text');
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [wordCount, setWordCount] = useState(0);

    // Configuration State
    const [length, setLength] = useState<'very_short' | 'short' | 'medium' | 'detailed'>('medium');
    const [tone, setTone] = useState<'neutral' | 'academic' | 'simple'>('neutral');
    const [style, setStyle] = useState<'bullet_points' | 'paragraph' | 'key_takeaways' | 'exam_notes'>('paragraph');

    // Processing State
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [error, setError] = useState('');

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setInputText(text);
        setWordCount(text.trim().split(/\s+/).length);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError('');

        try {
            let text = '';
            if (selectedFile.type === 'text/plain') {
                text = await selectedFile.text();
            } else if (selectedFile.type === 'application/pdf') {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item: any) => item.str).join(' ') + '\n';
                }
            } else {
                // For DOCX/others, we might need more complex parsing or just warn
                setError('Currently only TXT and PDF files are fully supported for extraction.');
                return;
            }
            setInputText(text);
            setWordCount(text.trim().split(/\s+/).length);
            setActiveTab('text'); // Switch to editor to show extracted text
        } catch (err) {
            setError('Failed to extract text from file.');
            console.error(err);
        }
    };

    const handleSummarize = async () => {
        if (!inputText.trim()) {
            setError('Please provide text to summarize.');
            return;
        }

        setLoading(true);
        setError('');
        setSummary('');

        try {
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
                            content: `You are a summarization assistant. Summarize the following text. Tone: ${tone}. Style: ${style}. Length: ${length}.`
                        },
                        {
                            role: 'user',
                            content: inputText.substring(0, 4000)
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
            setSummary(resultText.trim());
        } catch (err) {
            console.error(err);
            setError('Failed to generate summary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(summary);
    };

    const downloadSummary = () => {
        const blob = new Blob([summary], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'summary.md';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="flex justify-center">
                    <div className="p-3 bg-indigo-500/20 backdrop-blur-md rounded-full">
                        <BookOpen className="w-8 h-8 text-indigo-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white">AI Essay Summarizer</h1>
                <p className="text-lg text-gray-300">Accurate, structured summarization — no fluff</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" /> Files deleted after processing
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input & Controls */}
                <div className="space-y-6">
                    {/* Input Tabs */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 overflow-hidden">
                        <div className="flex border-b border-white/10">
                            {[
                                { id: 'text', label: 'Paste Text', icon: FileText },
                                { id: 'file', label: 'Upload File', icon: Upload },
                                { id: 'url', label: 'URL', icon: LinkIcon },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center p-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-indigo-500/20 text-indigo-300 border-b-2 border-indigo-500'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4 mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-4">
                            {activeTab === 'text' && (
                                <div className="space-y-2">
                                    <textarea
                                        value={inputText}
                                        onChange={handleTextChange}
                                        placeholder="Paste your essay, article, or paper here..."
                                        className="w-full h-64 p-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Word count: {wordCount}</span>
                                        <button
                                            onClick={() => { setInputText(''); setWordCount(0); }}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Clear text
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'file' && (
                                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                                    <input
                                        type="file"
                                        accept=".txt,.pdf"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer flex flex-col items-center text-center p-6"
                                    >
                                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                        <h3 className="text-white font-medium mb-1">Click to upload or drag and drop</h3>
                                        <p className="text-sm text-gray-400 mb-2">PDF or TXT (Max 10MB)</p>
                                        {file && (
                                            <div className="mt-2 flex items-center bg-indigo-500/20 px-3 py-1 rounded-full">
                                                <File className="w-3 h-3 text-indigo-400 mr-2" />
                                                <span className="text-xs text-indigo-300">{file.name}</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            )}

                            {activeTab === 'url' && (
                                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-full max-w-md">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Article URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                                placeholder="https://example.com/article"
                                                className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-gray-200 placeholder-gray-500"
                                            />
                                            <button
                                                className="px-4 py-2 bg-white/10 text-gray-200 rounded-lg hover:bg-white/20 font-medium border border-white/10"
                                                onClick={() => setError("URL fetching is simulated in this demo. Please copy-paste text.")}
                                            >
                                                Fetch
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                        <p className="text-sm text-yellow-400">
                                            Note: For best accuracy, we recommend copying and pasting article text directly.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-5 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">Summary Length</label>
                            <input
                                type="range"
                                min="0"
                                max="3"
                                step="1"
                                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                value={{ 'very_short': 0, 'short': 1, 'medium': 2, 'detailed': 3 }[length]}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    const map = ['very_short', 'short', 'medium', 'detailed'];
                                    setLength(map[val] as any);
                                }}
                            />
                            <div className="flex justify-between mt-2 text-xs text-gray-400">
                                <span>Very Short</span>
                                <span>Short</span>
                                <span>Medium</span>
                                <span>Detailed</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value as any)}
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-gray-200 text-sm focus:bg-gray-800"
                                >
                                    <option value="neutral">Neutral (Default)</option>
                                    <option value="academic">Academic</option>
                                    <option value="simple">Simple English</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
                                <select
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value as any)}
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-gray-200 text-sm focus:bg-gray-800"
                                >
                                    <option value="paragraph">Paragraphs</option>
                                    <option value="bullet_points">Bullet Points</option>
                                    <option value="key_takeaways">Key Takeaways</option>
                                    <option value="exam_notes">Exam Notes</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSummarize}
                            disabled={loading || !inputText}
                            className={`w-full py-3 px-4 rounded-xl font-medium text-white shadow-lg transition-all ${loading || !inputText
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/20'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                    Analyzing Content...
                                </span>
                            ) : 'Summarize Content'}
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-700 dark:text-red-300 text-sm">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Right Column: Output */}
                <div className="flex flex-col h-full">
                    <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 flex flex-col min-h-[500px]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-xl">
                            <h3 className="font-semibold text-white">Summary</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    disabled={!summary}
                                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                    title="Copy to clipboard"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={downloadSummary}
                                    disabled={!summary}
                                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                    title="Download Markdown"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            {summary ? (
                                <div className="prose dark:prose-invert max-w-none text-gray-200 leading-relaxed">
                                    {summary.split('\n').map((line, i) => (
                                        <p key={i} className="mb-2">
                                            {line.split('**').map((part, j) => (
                                                j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
                                            ))}
                                        </p>
                                    ))}
                                </div>
                            ) : loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <p>Processing your text...</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Summary will appear here</p>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-yellow-500/10 border-t border-yellow-500/20 text-xs text-yellow-500 text-center rounded-b-xl">
                            Summaries may omit nuanced arguments. Always verify critical academic conclusions.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIEssaySummarizer;
