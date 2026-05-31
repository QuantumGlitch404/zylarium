import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, FileText, Check, Cpu, Clock, AlertCircle } from 'lucide-react';

const AIVoiceNotes: React.FC = () => {
    // State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcription, setTranscription] = useState('');
    const [processedLayout, setProcessedLayout] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
    const [mode, setMode] = useState<'clean' | 'summary' | 'action_items'>('clean');
    const [error, setError] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize SpeechRecognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
                setTranscription(finalTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone permissions.');
                    stopRecording();
                }
            };
        } else {
            setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const startRecording = () => {
        if (!recognitionRef.current) {
            setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }
        setError('');
        setTranscription('');
        
        try {
            recognitionRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const processAudio = async () => {
        if (!transcription.trim()) {
            setError('No transcription available to process.');
            return;
        }
        
        setStep('processing');
        setLoading(true);

        try {
            // Format/Summarize (using NVIDIA dracarys model)
            const formatResponse = await fetch('/nvidia-api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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',
                },
                body: JSON.stringify({
                    model: 'abacusai/dracarys-llama-3.1-70b-instruct',
                    messages: [
                        { role: 'system', content: `Format this transcription as ${mode}. Be concise and well-structured.` },
                        { role: 'user', content: transcription.substring(0, 4000) }
                    ],
                    temperature: 0.5,
                    max_tokens: 1024,
                }),
            });

            if (formatResponse.ok) {
                const formatData = await formatResponse.json();
                const formatted = formatData.choices?.[0]?.message?.content || transcription;
                setProcessedLayout(formatted.trim());
            } else {
                setProcessedLayout(transcription);
            }

            setStep('result');
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
            setStep('upload');
            setError("Processing failed. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-rose-500/20 backdrop-blur-md rounded-full mb-3">
                    <Mic className="w-8 h-8 text-rose-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">AI Voice Notes</h1>
                <p className="text-gray-300">Transcribe meetings, lectures, and thoughts into structured notes instantly.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                {/* Steps Header */}
                <div className="flex border-b border-white/10 bg-white/5">
                    {['Record', 'Processing', 'Result'].map((s, i) => (
                        <div key={s} className={`flex-1 p-4 text-center text-sm font-medium ${step === (s === 'Record' ? 'upload' : s.toLowerCase()) ? 'text-rose-400 border-b-2 border-rose-500' : 'text-gray-400'
                            }`}>
                            {i + 1}. {s}
                        </div>
                    ))}
                </div>

                <div className="p-8 min-h-[400px]">
                    {step === 'upload' && (
                        <div className="space-y-8 max-w-lg mx-auto text-center">
                            
                            {error && (
                                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center text-red-200 text-sm">
                                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Record Button */}
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`w-full max-w-[280px] mx-auto border-2 border-solid rounded-xl p-8 transition-all group relative overflow-hidden ${isRecording
                                    ? 'border-rose-500 bg-rose-500/10'
                                    : 'border-white/20 hover:border-rose-500 hover:bg-rose-500/10'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isRecording ? 'bg-rose-600 animate-pulse' : 'bg-white/10 group-hover:bg-rose-500/20'
                                    }`}>
                                    <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-gray-400 group-hover:text-rose-400'}`} />
                                </div>
                                <h3 className="font-semibold text-white text-lg">
                                    {isRecording ? formatTime(recordingTime) : 'Start Recording'}
                                </h3>
                                <p className="text-sm text-gray-400 mt-2">
                                    {isRecording ? 'Click to Stop' : 'Use your microphone'}
                                </p>
                            </button>

                            {/* Live Transcript Preview */}
                            {(transcription || isRecording) && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                        Live Transcript
                                    </h4>
                                    <div className="text-left text-sm text-gray-300 h-24 overflow-y-auto italic">
                                        {transcription || "Listening..."}
                                    </div>
                                </div>
                            )}

                            {!isRecording && transcription && (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-300 mb-2">Processing Mode</p>
                                        <div className="flex bg-white/5 p-1 rounded-lg">
                                            {[
                                                { id: 'clean', label: 'Clean Transcript' },
                                                { id: 'summary', label: 'Summary' },
                                                { id: 'action_items', label: 'Action Items' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setMode(opt.id as any)}
                                                    className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === opt.id
                                                        ? 'bg-white/10 shadow text-rose-400 font-medium'
                                                        : 'text-gray-400 hover:text-gray-200'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={processAudio}
                                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center"
                                    >
                                        <Cpu className="w-5 h-5 mr-2" /> Format Notes
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Cpu className="w-8 h-8 text-rose-500 opacity-50" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-white">Formatting Notes...</h3>
                                <p className="text-gray-400">Restructuring your voice notes into a clean document.</p>
                            </div>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            {/* Transcript */}
                            <div className="bg-white/5 rounded-xl p-6 overflow-y-auto max-h-[500px] border border-white/10">
                                <h3 className="font-semibold text-gray-300 mb-4 flex items-center">
                                    <FileAudio className="w-4 h-4 mr-2" /> Raw Transcription
                                </h3>
                                <div className="prose dark:prose-invert text-sm text-gray-400 leading-relaxed">
                                    {transcription}
                                </div>
                            </div>

                            {/* Formatted Output */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-white flex items-center">
                                        <Check className="w-4 h-4 mr-2 text-green-500" />
                                        {mode === 'clean' ? 'Formatted Notes' : mode === 'summary' ? 'Summary' : 'Action Items'}
                                    </h3>
                                    <button 
                                        className="text-xs text-rose-400 hover:underline"
                                        onClick={() => setStep('upload')}
                                    >
                                        New Note
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto prose dark:prose-invert max-w-none text-gray-300 leading-relaxed">
                                    {processedLayout.split('\n').map((line, i) => (
                                        <p key={i} className="mb-2">
                                            {line.split('**').map((part, j) => (
                                                j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
                                            ))}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIVoiceNotes;
