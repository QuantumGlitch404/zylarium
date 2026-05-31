import React, { useState } from 'react';
import { Languages, ArrowRightLeft, Copy, Download, Volume2, Upload, AlertCircle, FileText } from 'lucide-react';
import { translateText } from '../../services/geminiService';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
];

const AITranslator: React.FC = () => {
    // State
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Settings
    const [formality, setFormality] = useState<'informal' | 'neutral' | 'formal'>('neutral');

    const handleSwapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setInputText(outputText);
        setOutputText(inputText);
    };

    const handleTranslate = async () => {
        if (!inputText.trim()) return;

        setLoading(true);
        setError('');

        try {
            const sLang = LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
            const tLang = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

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
                            role: 'user',
                            content: `Translate the following text from ${sLang} to ${tLang}. Formality: ${formality}. Only return the translated text, nothing else.\n\n${inputText.substring(0, 4000)}`
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: 2000,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const translatedText = data.choices?.[0]?.message?.content || '';
            setOutputText(translatedText.trim());

        } catch (err) {
            console.error(err);
            setError('Translation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'text/plain') {
            const text = await file.text();
            setInputText(text);
        } else {
            setError('Please upload a .txt file for translation.');
        }
    };

    const playTTS = (text: string, lang: string) => {
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500/20 backdrop-blur-md rounded-full mb-3">
                    <Languages className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">AI Language Translator</h1>
                <p className="text-gray-300">Context-aware professional translation</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-white/10 gap-4 bg-white/5">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="flex-1 md:w-40 p-2 bg-white/5 border border-white/10 rounded-lg text-white appearance-none"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-gray-800">{l.name}</option>)}
                        </select>

                        <button
                            onClick={handleSwapLanguages}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                        </button>

                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="flex-1 md:w-40 p-2 bg-white/5 border border-white/10 rounded-lg text-white appearance-none"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-gray-800">{l.name}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                        <select
                            value={formality}
                            onChange={(e) => setFormality(e.target.value as any)}
                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm appearance-none"
                        >
                            <option value="neutral" className="bg-gray-800">Neutral</option>
                            <option value="formal" className="bg-gray-800">Formal</option>
                            <option value="informal" className="bg-gray-800">Informal</option>
                        </select>
                        <button
                            onClick={handleTranslate}
                            disabled={loading}
                            className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Translating...' : 'Translate'}
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 h-[500px] divide-y md:divide-y-0 md:divide-x divide-white/10">
                    {/* Input */}
                    <div className="flex flex-col relative text-white">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter text to translate..."
                            className="flex-1 p-6 bg-transparent resize-none focus:outline-none text-lg text-white placeholder-gray-500"
                            maxLength={5000}
                        />
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <label className="cursor-pointer p-2 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-sm">
                                <Upload className="w-4 h-4" />
                                <span className="hidden sm:inline">Upload .txt</span>
                                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                            </label>
                            <button
                                onClick={() => playTTS(inputText, sourceLang)}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="absolute bottom-4 right-4 text-xs text-gray-500 font-medium">
                            {inputText.length} / 5000
                        </div>
                    </div>

                    {/* Output */}
                    <div className="flex flex-col relative bg-white/5">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="space-y-4 text-center">
                                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                                    <p className="text-gray-400 animate-pulse">Translating...</p>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                readOnly
                                value={outputText}
                                placeholder="Translation will appear here"
                                className="flex-1 p-6 bg-transparent resize-none focus:outline-none text-lg text-white placeholder-gray-500"
                            />
                        )}
                        <div className="absolute bottom-4 left-4 flex gap-2">
                            <button
                                onClick={() => playTTS(outputText, targetLang)}
                                disabled={!outputText}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigator.clipboard.writeText(outputText)}
                                disabled={!outputText}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex justify-center">
                    <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                </div>
            )}

            <div className="text-center">
                <p className="text-xs text-gray-500">
                    Machine translation may not reflect cultural nuance perfectly. Designed for accuracy over literal word-for-word translation.
                </p>
            </div>
        </div>
    );
};

export default AITranslator;
