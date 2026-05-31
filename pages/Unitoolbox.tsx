
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Search, Image as ImageIcon, FileText, Code, Maximize2, Scissors, Type,
    Mic, Globe, FileStack, ArrowRightLeft, FileCheck, Download, Upload,
    RefreshCw, Layers, Monitor, PenTool, Printer, Loader, Copy, Check,
    Book, Mic2, Crop, UserSquare, Video, Settings, Calculator, Lock, ShieldCheck,
    Grid, Eraser, FileCode, Play, Pause, Square, Plus, Trash2, X, ArrowUp, ArrowDown,
    Eye, EyeOff, Share2, AlertCircle, CheckCircle, Minimize2, Zap, Shield, Sliders,
    Pointer, List, Files, ArrowLeft, ArrowRight, RotateCw, Code2
} from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as math from 'mathjs';
import JSZip from 'jszip';
// pdf-lib is now loaded globally via index.html script tag
import { Card, Button, Input, Badge } from '../components/CommonUI';
import { summarizeText, translateText, transcribeAudioFile, summarizeBook, formatVoiceNotes } from '../services/geminiService';
import { motion, useScroll, useTransform } from 'framer-motion';
import WebPToJPG from './components/WebPToJPG';
import JPGToWebP from './components/JPGToWebP';
import PNGToJPG from './components/PNGToJPG';
import JPGToPNG from './components/JPGToPNG';
import SVGToPNG from './components/SVGToPNG';
import PNGToSVG from './components/PNGToSVG';
import ProUnitConverter from './components/ProUnitConverter';
import ProCalculator from './components/ProCalculator';
import ProPasswordGenerator from './components/ProPasswordGenerator';
import ProPasswordStrength from './components/ProPasswordStrength';
import AIEssaySummarizer from './components/AIEssaySummarizer';
import AITranslator from './components/AITranslator';
import AIBookSummarizer from './components/AIBookSummarizer';
import AsciiToText from './components/AsciiToText';
import TextToHandwriting from './components/TextToHandwriting';
import AIVoiceNotes from './components/AIVoiceNotes';
import ImageCompressor from './components/ImageCompressor';
import ImageResizer from './components/ImageResizer';
import ImageOCR from './components/ImageOCR';
import ImageToIcon from './components/ImageToIcon';
import BackgroundRemover from './components/BackgroundRemover';
import PassportPhotoGen from './components/PassportPhotoGen';
import { CodeUsageFinder } from '../components/codexray/CodeUsageFinder';
import Base64Encode from './components/Base64Encode';
import Base64Decode from './components/Base64Decode';
import UrlEncode from './components/UrlEncode';
import UrlDecode from './components/UrlDecode';
import HtmlEncode from './components/HtmlEncode';
import HtmlDecode from './components/HtmlDecode';
import AesEncrypt from './components/AesEncrypt';
import AesDecrypt from './components/AesDecrypt';
import Sha256Hash from './components/Sha256Hash';
import Md5Hash from './components/Md5Hash';
import TextToHash from './components/TextToHash';


// --- Safe Library Accessors ---

// PDF-LIB Helper (Global UMD)
const getPDFLib = () => {
    return (window as any).PDFLib;
};

// PDF.js Helper (Handles ESM vs CommonJS vs Browser Global differences)
const getPdfLib = () => {
    try {
        const lib = pdfjsLib as any;
        if (lib.getDocument) return lib;
        if (lib.default && lib.default.getDocument) return lib.default;
        if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
        return lib;
    } catch (e) {
        console.error("PDF Lib Access Error", e);
        return null;
    }
};

// Initialize PDF Worker
try {
    const pdf = getPdfLib();
    if (pdf && !pdf.GlobalWorkerOptions.workerSrc) {
        pdf.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
    }
} catch (e) {
    console.warn("PDF Worker Init Warning:", e);
}

// MathJS Helper
const getMath = () => {
    try {
        // @ts-ignore
        if (math && math.evaluate) return math;
        // @ts-ignore
        if (math && math.default && math.default.evaluate) return math.default;
        return (window as any).math || null;
    } catch { return null; }
};

// --- Constants ---
const LANGUAGES = [
    "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bengali", "Bosnian",
    "Bulgarian", "Catalan", "Cebuano", "Chichewa", "Chinese (Simplified)", "Chinese (Traditional)", "Corsican", "Croatian",
    "Czech", "Danish", "Dutch", "English", "Esperanto", "Estonian", "Filipino", "Finnish", "French", "Frisian", "Galician",
    "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", "Hungarian",
    "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", "Kazakh", "Khmer", "Kinyarwanda",
    "Korean", "Kurdish (Kurmanji)", "Kyrgyz", "Lao", "Latin", "Latvian", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy",
    "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Myanmar (Burmese)", "Nepali", "Norwegian", "Odia (Oriya)",
    "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan", "Scots Gaelic", "Serbian", "Sesotho",
    "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish", "Tajik", "Tamil",
    "Tatar", "Telugu", "Thai", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uyghur", "Uzbek", "Vietnamese", "Welsh", "Xhosa",
    "Yiddish", "Yoruba", "Zulu"
];

const FONTS = [
    { name: 'Caveat', family: "'Caveat', cursive" },
    { name: 'Dancing Script', family: "'Dancing Script', cursive" },
    { name: 'Great Vibes', family: "'Great Vibes', cursive" },
    { name: 'Indie Flower', family: "'Indie Flower', cursive" },
    { name: 'Kalam', family: "'Kalam', cursive" },
    { name: 'Pacifico', family: "'Pacifico', cursive" },
    { name: 'Patrick Hand', family: "'Patrick Hand', cursive" },
    { name: 'Sacramento', family: "'Sacramento', cursive" },
    { name: 'Satisfy', family: "'Satisfy', cursive" },
    { name: 'Shadows Into Light', family: "'Shadows Into Light', cursive" },
];

type Category = 'All' | 'Image' | 'Document & Data' | 'Text & AI' | 'Media' | 'Converter' | 'Utilities' | 'Encoding & Crypto';

interface Tool {
    id: string;
    name: string;
    cat: Category;
    icon: React.ReactNode;
    desc: string;
}

// --- Parallax Tool Grid Component ---
const ParallaxToolGrid = ({ tools, onSelect }: { tools: Tool[], onSelect: (id: string) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            if (window.innerWidth >= 1024) setColumns(3);
            else if (window.innerWidth >= 768) setColumns(2);
            else setColumns(1);
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    // Track scroll position
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Calculate transforms for each column (Only active on desktop/3-col to avoid mobile confusion)
    // We keep them defined but conditionally apply
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
    const y2 = useTransform(scrollYProgress, [0, 1], [-100, 50]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -100]);

    // 2-col transforms (milder)
    const y2_1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const y2_2 = useTransform(scrollYProgress, [0, 1], [-50, 0]);

    // Distribute tools into columns dynamically
    const distributedTools = React.useMemo(() => {
        const cols: Tool[][] = Array.from({ length: columns }, () => []);
        tools.forEach((tool, i) => {
            cols[i % columns].push(tool);
        });
        return cols;
    }, [tools, columns]);

    const ToolCard = ({ t }: { t: Tool }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="mb-6"
        >
            <div className="group relative">
                {/* Simple elegant glass card - NO color blooming on hover */}
                <div
                    onClick={() => onSelect(t.id)}
                    className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.06] hover:border-white/20 cursor-pointer"
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-primary-300 group-hover:text-white transition-colors shadow-lg">
                                {t.icon}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-5 h-5 text-white/50" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-2 text-white font-heading tracking-wide group-hover:text-primary-300 transition-colors">{t.name}</h3>
                        <p className="text-gray-400 font-light text-sm leading-relaxed">{t.desc}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div ref={containerRef} className={`grid gap-6 ${columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {distributedTools.map((colTools, colIndex) => {
                // Determine style and padding based on column configuration
                let style = {};
                let className = "flex flex-col gap-6";

                if (columns === 3) {
                    // Desktop Parallax
                    if (colIndex === 0) style = { y: y1 };
                    if (colIndex === 1) { style = { y: y2 }; className += " pt-24"; }
                    if (colIndex === 2) { style = { y: y3 }; className += " pt-12"; }
                } else if (columns === 2) {
                    // Tablet Parallax (Milder)
                    if (colIndex === 0) style = { y: y2_1 };
                    if (colIndex === 1) { style = { y: y2_2 }; className += " pt-12"; }
                }
                // Mobile (1 col) -> No parallax y, no top padding.

                return (
                    <motion.div key={colIndex} style={style} className={className}>
                        {colTools.map(t => <ToolCard key={t.id} t={t} />)}
                    </motion.div>
                );
            })}
        </div>
    );
};

// --- Helper: Robust File Upload with Drag & Drop ---
const FileUploadArea: React.FC<{
    accept: string;
    onChange: (file: File) => void;
    onMultipleChange?: (files: File[]) => void;
    label?: string;
    subLabel?: string;
    icon?: React.ReactNode;
    currentFile?: File | null;
    multiple?: boolean;
}> = ({ accept, onChange, onMultipleChange, label = "Click to Upload", subLabel, icon, currentFile, multiple = false }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleClick = () => {
        if (inputRef.current) {
            inputRef.current.value = ''; // Reset to allow re-uploading same file
            inputRef.current.click();
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (multiple && onMultipleChange) {
                onMultipleChange(Array.from(e.dataTransfer.files));
            } else {
                onChange(e.dataTransfer.files[0]);
            }
        }
    };

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`block w-full cursor-pointer group border-2 border-dashed p-8 text-center rounded-xl transition-all select-none
                ${isDragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-gray-800 hover:border-primary-400'
                }
            `}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        if (multiple && onMultipleChange) {
                            onMultipleChange(Array.from(e.target.files));
                        } else {
                            onChange(e.target.files[0]);
                        }
                    }
                }}
                className="hidden"
                style={{ display: 'none' }}
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className={`p-3 rounded-full shadow-sm transition-all ${isDragging ? 'bg-primary-100 text-primary-600' : 'bg-white dark:bg-gray-700 text-primary-500 group-hover:scale-110 group-hover:text-primary-600'}`}>
                    {icon || <Upload className="w-6 h-6" />}
                </div>
                <div>
                    <p className="font-medium text-lg text-gray-700 dark:text-gray-200">
                        {currentFile ? currentFile.name : (isDragging ? "Drop files here" : label)}
                    </p>
                    {subLabel && <p className="text-sm text-gray-500 mt-1">{subLabel}</p>}
                </div>
                {currentFile && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        File Selected
                    </span>
                )}
            </div>
        </div>
    );
};

const Unitoolbox: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category>('All');

    const tools: Tool[] = [
        // Text & AI Tools
        { id: 'ai-summarizer', name: 'AI Essay Summarizer', cat: 'Text & AI', icon: <FileCheck />, desc: 'Condense articles and essays instantly.' },
        { id: 'ai-translator', name: 'AI Language Translator', cat: 'Text & AI', icon: <Globe />, desc: 'Free multi-language translation.' },
        { id: 'ai-book-summary', name: 'AI Book Summary', cat: 'Text & AI', icon: <Book />, desc: 'Summarize PDF/DOCX/TXT files.' },
        { id: 'ascii-to-text', name: 'ASCII to Text', cat: 'Text & AI', icon: <Code />, desc: 'Decode ASCII codes to text.' },
        { id: 'text-handwriting', name: 'Text to Handwriting', cat: 'Text & AI', icon: <PenTool />, desc: 'Convert typed text to handwriting image.' },
        { id: 'voice-notes', name: 'AI Voice Notes', cat: 'Text & AI', icon: <Mic2 />, desc: 'Transcribe & organize voice notes.' },

        // Image Tools
        { id: 'img-compressor', name: 'Image Compressor', cat: 'Image', icon: <Maximize2 />, desc: 'Reduce JPG, PNG, WebP file size.' },
        { id: 'img-resizer', name: 'Image Resizer', cat: 'Image', icon: <ImageIcon />, desc: 'Resize images to custom dimensions.' },
        { id: 'bg-remover', name: 'Background Remover', cat: 'Image', icon: <Scissors />, desc: 'Remove image backgrounds professionally.' },
        { id: 'img-ocr', name: 'Image to Text (OCR)', cat: 'Image', icon: <Type />, desc: 'Extract text from images using AI.' },
        { id: 'img-to-icon', name: 'Image to Icon', cat: 'Image', icon: <Layers />, desc: 'Create favicons from images.' },
        { id: 'passport-photo', name: 'Passport Photo Gen', cat: 'Image', icon: <UserSquare />, desc: 'Create official size passport photos.' },

        // Document & Data Tools
        { id: 'pdf-to-word', name: 'PDF to Word', cat: 'Document & Data', icon: <FileText />, desc: 'Convert PDF to DOCX (Professional).' },
        { id: 'word-to-pdf', name: 'Word to PDF', cat: 'Document & Data', icon: <FileText />, desc: 'Convert DOC/DOCX to PDF (Professional).' },
        { id: 'text-to-pdf', name: 'Text to PDF', cat: 'Document & Data', icon: <FileText />, desc: 'Convert plain text to PDF.' },
        { id: 'pdf-protect', name: 'Password Protect PDF', cat: 'Document & Data', icon: <Lock />, desc: 'Secure your PDF documents with AES-256 encryption.' },
        { id: 'img-to-pdf', name: 'Image to PDF', cat: 'Document & Data', icon: <FileStack />, desc: 'Combine images into a PDF.' },
        { id: 'pdf-to-img', name: 'PDF to Image', cat: 'Document & Data', icon: <ImageIcon />, desc: 'Convert PDF pages to PNG.' },
        { id: 'pdf-compressor', name: 'PDF Compressor', cat: 'Document & Data', icon: <Maximize2 className="rotate-45" />, desc: 'Reduce PDF file size professionally.' },
        { id: 'pdf-split', name: 'PDF Splitter', cat: 'Document & Data', icon: <Scissors />, desc: 'Extract pages or split PDF into multiple files.' },
        { id: 'pdf-merge', name: 'PDF Merger', cat: 'Document & Data', icon: <Files />, desc: 'Combine multiple PDFs into one document.' },

        // Media Tools (Professional Suite)
        { id: 'pro-video-compressor', name: 'Pro Video Compressor', cat: 'Media', icon: <Video />, desc: 'Professional video compression with quality presets.' },
        { id: 'pro-video-to-gif', name: 'Video to GIF Pro', cat: 'Media', icon: <Monitor />, desc: 'High-quality animated GIF creator.' },

        { id: 'pro-video-resolution', name: 'Resolution Changer', cat: 'Media', icon: <Maximize2 />, desc: 'Precision video scaling.' },
        { id: 'pro-video-converter', name: 'Format Converter', cat: 'Media', icon: <RefreshCw />, desc: 'Professional video transcoder.' },
        { id: 'pro-video-rotator', name: 'Lossless Rotator', cat: 'Media', icon: <RotateCw />, desc: 'Rotate videos without re-encoding.' },

        // Converter Tools
        { id: 'webp-to-jpg', name: 'WebP to JPG', cat: 'Converter', icon: <RefreshCw />, desc: 'Convert WebP to JPG.' },
        { id: 'jpg-to-webp', name: 'JPG to WebP', cat: 'Converter', icon: <RefreshCw />, desc: 'Optimize JPG to WebP.' },
        { id: 'png-to-jpg', name: 'PNG to JPG', cat: 'Converter', icon: <RefreshCw />, desc: 'Convert PNG to JPG.' },
        { id: 'jpg-to-png', name: 'JPG to PNG', cat: 'Converter', icon: <RefreshCw />, desc: 'Convert JPG to PNG.' },
        { id: 'svg-to-png', name: 'SVG to PNG', cat: 'Converter', icon: <RefreshCw />, desc: 'Convert SVG code/file to PNG.' },
        { id: 'png-to-svg', name: 'PNG to SVG', cat: 'Converter', icon: <RefreshCw />, desc: 'Embed PNG in SVG container.' },

        // Code X-Ray Tools
        { id: 'code-usage-finder', name: 'Code Usage Finder', cat: 'Utilities', icon: <Code2 />, desc: 'Instant symbol usage search, rename limits, & hotspot analysis.' },

        // Utilities
        { id: 'unit-converter', name: 'Unit Converter', cat: 'Utilities', icon: <ArrowRightLeft />, desc: 'Professional Unit Converter.' },
        { id: 'calculator', name: 'Advanced Calculator', cat: 'Utilities', icon: <Calculator />, desc: 'Scientific calc with history.' },
        { id: 'password-gen', name: 'Password Generator', cat: 'Utilities', icon: <Lock />, desc: 'Create strong passwords.' },
        { id: 'password-check', name: 'Password Strength', cat: 'Utilities', icon: <ShieldCheck />, desc: 'Analyze password security.' },

        // Encoding & Crypto Tools
        { id: 'base64-encode', name: 'Base64 Encode', cat: 'Encoding & Crypto', icon: <Code />, desc: 'Convert text to Base64 instantly.' },
        { id: 'base64-decode', name: 'Base64 Decode', cat: 'Encoding & Crypto', icon: <Code />, desc: 'Decode Base64 to original text.' },
        { id: 'url-encode', name: 'URL Encode', cat: 'Encoding & Crypto', icon: <Globe />, desc: 'Encode URLs and query strings.' },
        { id: 'url-decode', name: 'URL Decode', cat: 'Encoding & Crypto', icon: <Globe />, desc: 'Decode encoded URLs instantly.' },
        { id: 'html-encode', name: 'HTML Encode', cat: 'Encoding & Crypto', icon: <FileCode />, desc: 'Escape HTML special characters.' },
        { id: 'html-decode', name: 'HTML Decode', cat: 'Encoding & Crypto', icon: <FileCode />, desc: 'Decode HTML entities to readable HTML.' },
        { id: 'aes-encrypt', name: 'AES Encryption', cat: 'Encoding & Crypto', icon: <Lock />, desc: 'Encrypt text with AES-128/192/256.' },
        { id: 'aes-decrypt', name: 'AES Decryption', cat: 'Encoding & Crypto', icon: <Shield />, desc: 'Decrypt AES encrypted text.' },
        { id: 'sha256-hash', name: 'SHA-256 Hash', cat: 'Encoding & Crypto', icon: <ShieldCheck />, desc: 'Generate SHA-256 hash in real-time.' },
        { id: 'md5-hash', name: 'MD5 Hash', cat: 'Encoding & Crypto', icon: <ShieldCheck />, desc: 'Fast MD5 hash generation with compare.' },
        { id: 'text-to-hash', name: 'Multi-Hash Generator', cat: 'Encoding & Crypto', icon: <Layers />, desc: 'Generate MD5, SHA-1, SHA-256, SHA-512 at once.' },
    ];

    const filteredTools = tools.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.desc.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = activeCategory === 'All' || t.cat === activeCategory;
        return matchSearch && matchCat;
    });

    const categories: Category[] = ['All', 'Text & AI', 'Image', 'Document & Data', 'Media', 'Converter', 'Utilities', 'Encoding & Crypto'];

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            {!activeTool ? (
                <>
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold mb-2 font-heading">Uni<span className="font-signature text-5xl text-primary-400">ToolBox</span></h1>
                        <p className="text-gray-400"><span className="font-signature text-lg text-cyan-300">Our Suite of Tools:</span> Discover a wide range of utilities.</p>
                    </div>

                    <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center max-w-7xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                            {categories.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setActiveCategory(c)}
                                    className={`px-5 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-300 backdrop-blur-xl border ${activeCategory === c
                                        ? 'bg-primary-500/30 text-primary-300 border-primary-500/50 shadow-lg shadow-primary-500/20'
                                        : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20 hover:text-white'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-72">
                            <Input
                                placeholder="Search tools..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                            <Search className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto py-8">
                        <ParallaxToolGrid tools={filteredTools} onSelect={setActiveTool} />
                    </div>
                </>
            ) : (
                <div className="max-w-6xl mx-auto">
                    <Button variant="ghost" onClick={() => setActiveTool(null)} className="mb-6 group">
                        <span className="group-hover:-translate-x-1 transition-transform inline-block mr-1">←</span> Back to Tools
                    </Button>

                    <Card className="p-0 overflow-hidden min-h-[600px] shadow-xl">
                        <div className="bg-white/10 backdrop-blur-xl p-6 border-b border-white/20 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3 text-white font-heading">
                                    {tools.find(t => t.id === activeTool)?.icon}
                                    <span>{tools.find(t => t.id === activeTool)?.name}</span>
                                </h2>
                                <p className="text-gray-400 mt-1">{tools.find(t => t.id === activeTool)?.desc}</p>
                            </div>
                            <Badge color="blue"><span className="font-signature">Professional</span></Badge>
                        </div>

                        <div className="p-8">
                            <ActiveToolComponent toolId={activeTool} />
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const ActiveToolComponent: React.FC<{ toolId: string }> = ({ toolId }) => {
    if (toolId === 'ai-summarizer') return <AIEssaySummarizer />;
    if (toolId === 'ai-translator') return <AITranslator />;
    if (toolId === 'ai-book-summary') return <AIBookSummarizer />;
    if (toolId === 'voice-notes') return <AIVoiceNotes />;

    if (toolId === 'ascii-to-text') return <AsciiToText />;
    if (toolId === 'text-handwriting') return <TextToHandwriting />;

    if (toolId === 'img-compressor') return <ImageCompressor />;
    if (toolId === 'img-resizer') return <ImageResizer />;
    if (toolId === 'img-to-icon') return <ImageToIcon />;
    if (toolId === 'bg-remover') return <BackgroundRemover />;
    if (toolId === 'img-ocr') return <ImageOCR />;
    if (toolId === 'passport-photo') return <PassportPhotoGen />;

    if (toolId === 'pdf-to-word') return <PdfToWord />;
    if (toolId === 'word-to-pdf') return <WordToPdf />;
    if (toolId === 'text-to-pdf') return <TextToPdf />;
    if (toolId === 'img-to-pdf') return <ImageToPdf />;
    if (toolId === 'pdf-to-img') return <PdfToImage />;
    if (toolId === 'pdf-protect') return <PdfProtect />;
    if (toolId === 'pdf-compressor') return <PdfCompressor />;
    if (toolId === 'pdf-split') return <PdfSplitter />;
    if (toolId === 'pdf-merge') return <PdfMerger />;

    // Professional Media Tools Suite
    if (toolId === 'pro-video-compressor') return <ProVideoCompressor />;
    if (toolId === 'pro-video-to-gif') return <ProVideoToGif />;

    if (toolId === 'pro-video-resolution') return <ProVideoResolution />;
    if (toolId === 'pro-video-converter') return <ProVideoConverter />;
    if (toolId === 'pro-video-rotator') return <ProVideoRotator />;

    // Converter Tools
    if (toolId === 'webp-to-jpg') return <WebPToJPG />;
    if (toolId === 'jpg-to-webp') return <JPGToWebP />;
    if (toolId === 'png-to-jpg') return <PNGToJPG />;
    if (toolId === 'jpg-to-png') return <JPGToPNG />;
    if (toolId === 'svg-to-png') return <SVGToPNG />;
    if (toolId === 'png-to-svg') return <PNGToSVG />;

    // Encoding & Crypto Tools
    if (toolId === 'base64-encode') return <Base64Encode />;
    if (toolId === 'base64-decode') return <Base64Decode />;
    if (toolId === 'url-encode') return <UrlEncode />;
    if (toolId === 'url-decode') return <UrlDecode />;
    if (toolId === 'html-encode') return <HtmlEncode />;
    if (toolId === 'html-decode') return <HtmlDecode />;
    if (toolId === 'aes-encrypt') return <AesEncrypt />;
    if (toolId === 'aes-decrypt') return <AesDecrypt />;
    if (toolId === 'sha256-hash') return <Sha256Hash />;
    if (toolId === 'md5-hash') return <Md5Hash />;
    if (toolId === 'text-to-hash') return <TextToHash />;

    if (toolId === 'unit-converter') return <ProUnitConverter />;
    if (toolId === 'calculator') return <ProCalculator />;
    if (toolId === 'password-gen') return <ProPasswordGenerator />;
    if (toolId === 'password-check') return <ProPasswordStrength />;
    if (toolId === 'code-usage-finder') return <CodeUsageFinder />;

    // Image Converter wildcard MUST be last among tools containing '-to-'
    if (toolId.includes('-to-')) return <ImageConverter mode={toolId} />;

    return <div>Tool under construction.</div>;
};

// --- Component Implementations ---

// 1. PDF PROTECT
const PdfProtect: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProtecting, setIsProtecting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const getStrength = (pwd: string) => {
        if (!pwd) return { label: 'Empty', color: 'bg-gray-200', val: 0 };
        let score = 0;
        if (pwd.length > 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 1) return { label: 'Weak', color: 'bg-red-500', val: 25 };
        if (score === 2) return { label: 'Medium', color: 'bg-yellow-500', val: 50 };
        if (score === 3) return { label: 'Strong', color: 'bg-green-500', val: 75 };
        return { label: 'Very Strong', color: 'bg-green-600', val: 100 };
    };

    const strength = getStrength(password);

    const handleProtect = async () => {
        if (!file || password !== confirmPassword || !password) return;

        setIsProtecting(true);
        setProgress(10);
        setResultUrl(null);

        try {
            // Cloudflare Worker URL
            const API_URL = 'https://pdf-protect-api.meezabmomin07.workers.dev';

            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('password', password);

            setProgress(30);

            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
            });

            setProgress(60);

            if (!response.ok) {
                let errorMessage = 'Protection failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    const text = await response.text();
                    if (text) errorMessage = text;
                }
                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            setProgress(100);
            setResultUrl(url);

        } catch (error: any) {
            console.error("PDF Protection Error:", error);
            const errorMessage = error.message || "Unknown error occurred";
            alert(`Error protecting PDF: ${errorMessage}\n\nPlease ensure you have deployed the Cloudflare Worker and updated the API_URL in the code.`);
        } finally {
            setIsProtecting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPassword('');
        setConfirmPassword('');
        setResultUrl(null);
        setProgress(0);
    };

    if (resultUrl && file) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="bg-green-500/20 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-lg shadow-green-500/20">
                    <ShieldCheck className="w-12 h-12 text-green-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">PDF Protected Successfully!</h3>
                    <p className="text-gray-400">Your file has been secured with metadata and watermarking.</p>
                </div>

                <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/10 max-w-md mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500/20 p-2 rounded text-red-400">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-sm text-white truncate max-w-[150px]">{file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <Badge color="green">Secured</Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href={resultUrl} download={`protected-${file.name}`} className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto"><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
                    </a>
                    <Button variant="outline" size="lg" onClick={() => {
                        navigator.clipboard.writeText(resultUrl);
                        alert("Link copied to clipboard!");
                    }}>
                        <Share2 className="w-4 h-4 mr-2" /> Copy Link
                    </Button>
                </div>

                <button onClick={handleReset} className="text-sm text-gray-400 hover:text-white underline">
                    Protect Another File
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {!file ? (
                <div className="space-y-6">
                    <FileUploadArea
                        accept=".pdf"
                        onChange={setFile}
                        label="Upload PDF to Protect"
                        icon={<Lock className="w-12 h-12" />}
                        subLabel="Add security metadata and visual markers"
                    />
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                            <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                            <h4 className="font-bold text-sm text-white">Security Metadata</h4>
                            <p className="text-xs text-gray-400">Tags file as protected</p>
                        </div>
                        <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                            <Monitor className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                            <h4 className="font-bold text-sm text-white">Visual Watermark</h4>
                            <p className="text-xs text-gray-400">Overlays protection stamp</p>
                        </div>
                        <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                            <Lock className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                            <h4 className="font-bold text-sm text-white">Owner Info</h4>
                            <p className="text-xs text-gray-400">Embeds ownership data</p>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex gap-3">
                        <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                        <div className="text-sm text-blue-200">
                            <strong>Note:</strong> This tool adds metadata and visual markers to indicate the document is protected. Due to browser technology limitations, it does not apply cryptographic encryption (AES).
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* File Card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">{file.name}</h3>
                                <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button onClick={() => setFile(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Password Section */}
                    <Card className="space-y-6">
                        <div className="flex items-center gap-2 text-lg font-bold border-b border-white/10 pb-4 text-white">
                            <Lock className="w-5 h-5 text-primary-400" /> Protection Settings
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Set Password (for Hint)</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2.5 border rounded-lg bg-white/5 border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-white placeholder-gray-500"
                                            placeholder="Type strong password"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {/* Strength Meter */}
                                    {password && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-400">Strength: <span className={`${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span></span>
                                                <span className="text-gray-400">{strength.val}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${strength.color}`}
                                                    style={{ width: `${strength.val}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Confirm Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-lg bg-white/5 outline-none transition-all text-white placeholder-gray-500 ${confirmPassword && password !== confirmPassword
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-white/10 focus:ring-primary-500'
                                            }`}
                                        placeholder="Retype password"
                                    />
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Passwords do not match
                                        </p>
                                    )}
                                </div>
                                <div className="bg-yellow-500/10 p-3 rounded-lg text-xs text-yellow-300 flex items-start gap-2 border border-yellow-500/20">
                                    <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p>This password will be used to generate a password hint in the document metadata, not for encryption.</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center">
                            {isProtecting ? (
                                <div className="w-full space-y-2">
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Protecting...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 animate-pulse transition-all duration-200"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleProtect}
                                        disabled={!password || password !== confirmPassword || strength.val < 50}
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        <Lock className="w-4 h-4 mr-2" /> Mark as Protected
                                    </Button>
                                    <Button variant="ghost" onClick={handleReset}>Reset</Button>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

// 1. TEXT TO PDF - Fixed with Separated Toolbar & Scroll Area
const TextToPdf: React.FC = () => {
    const [text, setText] = useState('');
    const [fontSize, setFontSize] = useState(12);
    const [fontFamily, setFontFamily] = useState('Arial');
    const [generating, setGenerating] = useState(false);
    const scale = 0.6; // Scale factor for preview

    const generatePDF = async () => {
        if (!text) return;
        setGenerating(true);

        try {
            // Create a hidden "ghost" element to capture
            // Force text to BLACK and background to WHITE to ignore dark mode
            const ghost = document.createElement('div');
            Object.assign(ghost.style, {
                position: 'fixed', left: '-9999px', top: '0',
                width: '210mm', minHeight: '297mm',
                padding: '20mm',
                backgroundColor: '#ffffff',
                color: '#000000', // Enforce black text
                fontFamily: fontFamily,
                fontSize: `${fontSize}pt`,
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                boxSizing: 'border-box'
            });
            ghost.innerText = text;
            document.body.appendChild(ghost);

            const canvas = await html2canvas(ghost, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            });

            document.body.removeChild(ghost);

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;
            const canvasPageHeightPx = (canvas.width / pageWidth) * pageHeight;

            let totalHeightPx = canvas.height;
            let currentYPx = 0;

            // Slice Canvas Logic
            while (totalHeightPx > 0) {
                const sliceHeightPx = Math.min(totalHeightPx, canvasPageHeightPx);

                // Create temp canvas for slice
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sliceHeightPx;
                const ctx = sliceCanvas.getContext('2d');

                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                    ctx.drawImage(
                        canvas,
                        0, currentYPx, canvas.width, sliceHeightPx,
                        0, 0, sliceCanvas.width, sliceHeightPx
                    );

                    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                    if (currentYPx > 0) pdf.addPage();
                    // Calculate height in mm for the slice (might be less than full page on last page)
                    const sliceHeightMm = (sliceHeightPx / canvas.width) * pageWidth;
                    pdf.addImage(sliceData, 'JPEG', 0, 0, pageWidth, sliceHeightMm);
                }

                currentYPx += sliceHeightPx;
                totalHeightPx -= sliceHeightPx;
            }

            pdf.save('document.pdf');
        } catch (e) {
            console.error(e);
            alert("PDF Generation Failed");
        }
        setGenerating(false);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            <div className="flex flex-col gap-4 h-full">
                <div className="flex justify-between items-center bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
                    <span className="font-bold text-white">Editor</span>
                    <div className="flex items-center gap-3">
                        <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="p-1 border border-white/10 rounded text-sm bg-white/5 backdrop-blur-md text-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                            <option value="Arial" className="bg-gray-900 text-white">Arial</option>
                            <option value="Times New Roman" className="bg-gray-900 text-white">Times New Roman</option>
                            <option value="Courier New" className="bg-gray-900 text-white">Courier New</option>
                        </select>
                        <input type="number" min="8" max="72" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-14 border border-white/10 rounded p-1 text-sm bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </div>
                </div>
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="flex-grow p-4 border border-white/10 rounded-xl resize-none outline-none text-base bg-white/5 backdrop-blur-md text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50"
                    placeholder="Type your text here..."
                />
                <Button onClick={generatePDF} disabled={!text || generating} size="lg" className="w-full shadow-lg shadow-primary-500/20">
                    {generating ? 'Generating PDF...' : 'Download PDF'}
                </Button>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner flex flex-col h-full overflow-hidden">
                {/* Fixed Header Toolbar (Outside Scroll) */}
                <div className="p-3 bg-white/5 border-b border-white/10 flex-shrink-0 z-10">
                    <div className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Live Preview (Scale {scale * 100}%)
                    </div>
                </div>

                {/* Independent Scrollable Content Area */}
                <div className="overflow-auto flex-grow p-4 relative bg-gray-200 dark:bg-gray-900">
                    {/* Tight Wrapper: Matches visual size, centers safely via margin-auto */}
                    <div
                        className="mx-auto shadow-2xl transition-all origin-top-left bg-white"
                        style={{
                            width: `${210 * scale}mm`,
                            minHeight: `${297 * scale}mm`,
                        }}
                    >
                        <div
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                padding: '20mm',
                                fontSize: `${fontSize}pt`,
                                lineHeight: 1.5,
                                fontFamily: fontFamily,
                                color: '#000000',
                                backgroundColor: '#ffffff',
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'break-word',
                                boxSizing: 'border-box',
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left'
                            }}
                        >
                            {text || <span className="text-gray-300 select-none">Start typing...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. IMAGE TO PDF - FULLY IMPLEMENTED
interface PdfImage {
    id: string;
    file: File;
    preview: string;
}

const ImageToPdf: React.FC = () => {
    const [images, setImages] = useState<PdfImage[]>([]);
    const [generating, setGenerating] = useState(false);
    const [settings, setSettings] = useState({
        pageSize: 'a4', // a4, letter, fit
        orientation: 'p', // p, l
        margin: 'normal', // none, small, normal
    });

    // Handle new files
    const handleFiles = (files: File[]) => {
        const newImages = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const clearAll = () => {
        setImages([]);
    };

    const moveImage = (index: number, direction: -1 | 1) => {
        const newImages = [...images];
        if (index + direction < 0 || index + direction >= newImages.length) return;
        const temp = newImages[index];
        newImages[index] = newImages[index + direction];
        newImages[index + direction] = temp;
        setImages(newImages);
    };

    const generatePDF = async () => {
        if (images.length === 0) return;
        setGenerating(true);

        try {
            // Initialize PDF
            // Note: If 'fit' is selected, orientation doesn't matter initially, we'll set it per page
            const doc = new jsPDF(settings.orientation as any, 'mm', settings.pageSize === 'fit' ? 'a4' : settings.pageSize);

            // Margins in mm
            const marginSize = settings.margin === 'none' ? 0 : settings.margin === 'small' ? 10 : 20;

            for (let i = 0; i < images.length; i++) {
                const imgItem = images[i];
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(imgItem.file);
                });

                // Get image dims
                const dims = await new Promise<{ w: number, h: number }>(resolve => {
                    const img = new Image();
                    img.onload = () => resolve({ w: img.width, h: img.height });
                    img.src = base64;
                });

                // Page Config
                let pageWidth = doc.internal.pageSize.getWidth();
                let pageHeight = doc.internal.pageSize.getHeight();

                // If 'Fit to Image' mode, resize page to match image (converted to mm)
                if (settings.pageSize === 'fit') {
                    // Convert px to mm (approx 96 DPI) -> 1px = 0.264583 mm
                    const pxToMm = 0.264583;
                    const imgW_mm = dims.w * pxToMm;
                    const imgH_mm = dims.h * pxToMm;

                    // Reset page size
                    if (i > 0) doc.addPage([imgW_mm, imgH_mm], imgW_mm > imgH_mm ? 'l' : 'p');
                    else {
                        // For first page, we might need to change existing page size or just delete and add new?
                        // jsPDF is tricky with resizing first page. 
                        // Strategy: Add new page with correct size, then delete first blank one if possible.
                        // Easier strategy: Set page size for first page directly? 
                        // jsPDF doesn't easily support resizing page 1.
                        // Workaround: We will just draw on standard A4 for fit mode if it's tricky, 
                        // OR we default init with A4 and 'fit' logic changes rendering bounds.
                        // ACTUALLY: Let's stick to standard sizes for reliability, or use 'a4' base.
                        // Better approach for 'fit': Just use the image size for the page.
                        doc.deletePage(1);
                        doc.addPage([imgW_mm, imgH_mm], imgW_mm > imgH_mm ? 'l' : 'p');
                    }

                    pageWidth = doc.internal.pageSize.getWidth();
                    pageHeight = doc.internal.pageSize.getHeight();
                    doc.addImage(base64, 'JPEG', 0, 0, pageWidth, pageHeight);
                } else {
                    // Standard A4/Letter
                    if (i > 0) doc.addPage();

                    const workingWidth = pageWidth - (marginSize * 2);
                    const workingHeight = pageHeight - (marginSize * 2);

                    // Fit logic (contain)
                    const imgRatio = dims.w / dims.h;
                    const pageRatio = workingWidth / workingHeight;

                    let finalW = workingWidth;
                    let finalH = workingWidth / imgRatio;

                    if (finalH > workingHeight) {
                        finalH = workingHeight;
                        finalW = workingHeight * imgRatio;
                    }

                    const x = (pageWidth - finalW) / 2;
                    const y = (pageHeight - finalH) / 2;

                    doc.addImage(base64, 'JPEG', x, y, finalW, finalH);
                }
            }

            // Cleanup extra first page if 'fit' mode hack was used 
            // (We did doc.deletePage(1) then added pages, so index shift handled)

            doc.save('images-combined.pdf');
        } catch (e) {
            console.error(e);
            alert("Error generating PDF");
        }
        setGenerating(false);
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Left Col: Upload & List */}
            <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden h-full">
                <div className="flex-shrink-0">
                    <FileUploadArea
                        accept="image/*"
                        multiple={true}
                        onChange={(f) => handleFiles([f])}
                        onMultipleChange={handleFiles}
                        label="Drop images here or click to upload"
                        subLabel="Supports JPG, PNG, WEBP"
                        icon={<FileStack className="w-8 h-8" />}
                    />
                </div>

                <div className="flex justify-between items-center px-1">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">
                        Selected Files ({images.length})
                    </h3>
                    {images.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-3 h-3" /> Clear All
                        </button>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    {images.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                            <p>No images selected</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div key={img.id} className="group relative bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/10 overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all flex flex-col">
                                    <div className="relative aspect-[3/4] bg-black/20 overflow-hidden">
                                        <img src={img.preview} alt="preview" className="w-full h-full object-contain p-2" />

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => moveImage(idx, -1)}
                                                    disabled={idx === 0}
                                                    className="p-1.5 bg-white/20 backdrop-blur-sm rounded text-white hover:bg-white/40 disabled:opacity-30 transition-colors"
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moveImage(idx, 1)}
                                                    disabled={idx === images.length - 1}
                                                    className="p-1.5 bg-white/20 backdrop-blur-sm rounded text-white hover:bg-white/40 disabled:opacity-30 transition-colors"
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Delete Button (Always visible on hover) */}
                                        <button
                                            onClick={() => removeImage(img.id)}
                                            className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-100 scale-90"
                                            title="Remove Image"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>

                                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                            #{idx + 1}
                                        </div>
                                    </div>

                                    {/* File Info */}
                                    <div className="p-2 border-t border-white/10 bg-white/5 text-xs text-center">
                                        <div className="font-medium truncate text-gray-200" title={img.file.name}>{img.file.name}</div>
                                        <div className="text-gray-400 mt-0.5">{(img.file.size / 1024).toFixed(0)} KB</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Col: Settings */}
            <div className="flex flex-col gap-6 p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 h-fit sticky top-4">
                <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" /> PDF Settings
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Page Size</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['a4', 'letter', 'fit'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSettings(p => ({ ...p, pageSize: s }))}
                                        className={`px-3 py-2 text-sm rounded-lg border capitalize transition-colors ${settings.pageSize === s
                                            ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {s === 'fit' ? 'Fit Img' : s.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Orientation</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setSettings(p => ({ ...p, orientation: 'p' }))}
                                    className={`px-3 py-2 text-sm rounded-lg border flex items-center justify-center gap-2 transition-colors ${settings.orientation === 'p'
                                        ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <div className="w-3 h-4 border border-current rounded-sm" /> Portrait
                                </button>
                                <button
                                    onClick={() => setSettings(p => ({ ...p, orientation: 'l' }))}
                                    className={`px-3 py-2 text-sm rounded-lg border flex items-center justify-center gap-2 transition-colors ${settings.orientation === 'l'
                                        ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <div className="w-4 h-3 border border-current rounded-sm" /> Landscape
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-300">Margins</label>
                            <select
                                value={settings.margin}
                                onChange={(e) => setSettings(p => ({ ...p, margin: e.target.value }))}
                                className="w-full p-2 border rounded-lg bg-white/5 backdrop-blur-md border-white/10 text-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                            >
                                <option value="none" className="bg-gray-900 text-white">No Margin (Full Bleed)</option>
                                <option value="small" className="bg-gray-900 text-white">Small (10mm)</option>
                                <option value="normal" className="bg-gray-900 text-white">Normal (20mm)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex justify-between text-sm mb-4 text-gray-500 dark:text-gray-400">
                        <span>Total Images:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{images.length}</span>
                    </div>
                    <Button
                        onClick={generatePDF}
                        disabled={images.length === 0 || generating}
                        className="w-full"
                        size="lg"
                    >
                        {generating ? <><Loader className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><Download className="w-4 h-4 mr-2" /> Download PDF</>}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// 3. PDF TO IMAGE
const PdfToImage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [converting, setConverting] = useState(false);

    const handleConvert = async () => {
        if (!file) return;
        setConverting(true);
        setImages([]);

        try {
            const pdfLib = getPdfLib();
            if (!pdfLib) throw new Error("PDF Library not loaded");

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfLib.getDocument(arrayBuffer).promise;

            const newImages: string[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // High res for better quality
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    newImages.push(canvas.toDataURL('image/png'));
                }
            }
            setImages(newImages);

        } catch (e) {
            console.error(e);
            alert("Error converting PDF to Image");
        }
        setConverting(false);
    };

    const downloadAll = async () => {
        if (images.length === 0) return;
        const zip = new JSZip();
        images.forEach((img, idx) => {
            const data = img.split(',')[1];
            zip.file(`page-${idx + 1}.png`, data, { base64: true });
        });
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file?.name.replace('.pdf', '')}-images.zip`;
        a.click();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!file || images.length === 0 ? (
                <div className="space-y-4">
                    <FileUploadArea accept=".pdf" onChange={setFile} currentFile={file} label="Upload PDF to Convert" icon={<FileText className="w-8 h-8" />} />
                    <Button onClick={handleConvert} disabled={!file || converting} className="w-full" size="lg">
                        {converting ? <><Loader className="animate-spin mr-2" /> Converting Pages...</> : "Convert to Images"}
                    </Button>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/10">
                        <h3 className="font-bold text-white">Converted {images.length} Pages</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setFile(null); setImages([]); }}>Start Over</Button>
                            <Button onClick={downloadAll}><Download className="w-4 h-4 mr-2" /> Download All (ZIP)</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10">
                                <img src={img} alt={`Page ${idx + 1}`} className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <a href={img} download={`page-${idx + 1}.png`}>
                                        <Button size="sm" variant="secondary"><Download className="w-4 h-4 mr-1" /> Page {idx + 1}</Button>
                                    </a>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs text-center py-1 border-t border-white/10">
                                    Page {idx + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// 4. AI Book Summarizer


// 5. Office Tools (and other components...)
const OfficeTools: React.FC<{ mode: string }> = ({ mode }) => {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const isPDFInput = mode.startsWith('pdf-');

    const handleConvert = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            if (mode === 'pdf-word') {
                const ab = await file.arrayBuffer();
                const pdfLib = getPdfLib();
                const doc = await pdfLib.getDocument(ab).promise;
                let text = "";
                for (let i = 1; i <= doc.numPages; i++) {
                    const p = await doc.getPage(i);
                    const c = await p.getTextContent();
                    text += c.items.map((item: any) => item.str).join(' ') + "\n\n";
                }
                const blob = new Blob([text], { type: 'application/msword' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'converted.doc';
                link.click();
            } else {
                alert("This specific conversion is simulated for client-side safety. Real docx/xlsx generation requires heavy libraries.");
            }
        } catch (e) {
            alert("Conversion failed.");
        }
        setProcessing(false);
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex justify-center mb-4 text-sm font-bold bg-gray-100 p-2 rounded">{mode.toUpperCase().replace('-', ' TO ')}</div>
            <FileUploadArea accept={isPDFInput ? ".pdf" : ".docx,.xlsx,.pptx"} onChange={setFile} currentFile={file} label={`Upload ${isPDFInput ? 'PDF' : 'File'}`} icon={<FileStack className="w-8 h-8" />} />
            <Button size="lg" className="w-full" onClick={handleConvert} disabled={!file || processing}>
                {processing ? 'Converting...' : "Convert Now"}
            </Button>
        </div>
    );
};



// [Placeholder Components for brevity, ensuring they compile]


const VideoCompressor = () => <div>Video</div>;
const VideoToGif = () => <div>Gif</div>;
const SpeechToText = () => <div>Speech</div>;
const SvgTools: React.FC<{ mode: any }> = () => <div>SVG</div>;
const ImageConverter: React.FC<{ mode: any }> = () => <div>Img Converter</div>;



export default Unitoolbox;
// 14. PDF COMPRESSOR - Professional Implementation
const PdfCompressor: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultStats, setResultStats] = useState<{ oldSize: number, newSize: number } | null>(null);

    // Settings
    const [compressionLevel, setCompressionLevel] = useState<'high' | 'balanced' | 'quality' | 'custom'>('balanced');
    const [customDpi, setCustomDpi] = useState(150); // Default for balanced
    const [customQuality, setCustomQuality] = useState(0.8); // Default for balanced
    const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
    const [removeMetadata, setRemoveMetadata] = useState(true);
    const [flatten, setFlatten] = useState(true);

    // Update settings based on preset
    useEffect(() => {
        if (compressionLevel === 'high') {
            setCustomDpi(96); // Screen res
            setCustomQuality(0.5);
            setFormat('jpeg');
        } else if (compressionLevel === 'balanced') {
            setCustomDpi(150); // Good for ebooks
            setCustomQuality(0.75);
            setFormat('jpeg');
        } else if (compressionLevel === 'quality') {
            setCustomDpi(300); // Print res
            setCustomQuality(0.9);
            setFormat('jpeg');
        }
    }, [compressionLevel]);

    const handleCompress = async () => {
        if (!file) return;
        setIsCompressing(true);
        setProgress(5);
        setResultUrl(null);
        setResultStats(null);

        try {
            // 1. Load Libraries
            const PDFLib = getPDFLib();
            const pdfjs = getPdfLib();
            if (!PDFLib || !pdfjs) throw new Error("Libraries not ready. Please refresh.");

            // 2. Read File to ArrayBuffer
            const originalBuffer = await file.arrayBuffer();
            setProgress(15);

            // 3. Load PDF with PDF.js for rendering
            const loadingTask = pdfjs.getDocument({ data: originalBuffer });
            const originalPdf = await loadingTask.promise;
            const totalPages = originalPdf.numPages;

            // 4. Create New PDF with PDF-lib
            const newPdfDoc = await PDFLib.PDFDocument.create();

            // 5. Create Ghost Canvas for Rendering
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas context failed");

            // 6. Process Pages
            for (let i = 1; i <= totalPages; i++) {
                // Update Progress
                const pageProgress = 15 + ((i / totalPages) * 70);
                setProgress(Math.round(pageProgress));

                // Get Page
                const page = await originalPdf.getPage(i);

                // Calculate Scale based on DPI (72dpi is standard PDF point size)
                // scale = targetDPI / 72
                const scale = customDpi / 72;
                const viewport = page.getViewport({ scale });

                // Resize Canvas
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Render Page to Canvas
                await page.render({
                    canvasContext: ctx,
                    viewport: viewport
                }).promise;

                // Convert to Image Blob/DataURL
                const imgType = format === 'png' ? 'image/png' : 'image/jpeg';
                const imgDataUrl = canvas.toDataURL(imgType, customQuality);

                // Embed in New PDF
                let embeddedImage;
                if (format === 'png') {
                    embeddedImage = await newPdfDoc.embedPng(imgDataUrl);
                } else {
                    embeddedImage = await newPdfDoc.embedJpg(imgDataUrl);
                }

                // Add Page to New PDF (Use original page dimensions if flattening transparency, or new dimensions)
                // We use the image dimensions to ensure crispness
                const newPage = newPdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
                newPage.drawImage(embeddedImage, {
                    x: 0,
                    y: 0,
                    width: embeddedImage.width,
                    height: embeddedImage.height,
                });

                // Cleanup
                // page.cleanup(); // PDF.js handles this mostly
            }

            setProgress(90);

            // 7. Metadata Handling
            if (!removeMetadata) {
                // Note: We are creating a NEW PDF, so original metadata is gone by default.
                // If we wanted to keep it, we'd have to load the original with PDF-lib and copy it.
                // For "Compression" usually stripping is desired. 
                // If user wants to "keep", we set basic info.
                newPdfDoc.setTitle(file.name.replace('.pdf', ''));
                newPdfDoc.setProducer('UniToolBox Compressor');
            } else {
                newPdfDoc.setTitle('');
                newPdfDoc.setAuthor('');
                newPdfDoc.setSubject('');
                newPdfDoc.setKeywords([]);
                newPdfDoc.setProducer('');
                newPdfDoc.setCreator('');
            }

            // 8. Save
            const newPdfBytes = await newPdfDoc.save();
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Stats
            setResultStats({
                oldSize: file.size,
                newSize: blob.size
            });

            setResultUrl(url);
            setProgress(100);

        } catch (e: any) {
            console.error(e);
            alert(`Compression Failed: ${e.message}`);
        } finally {
            setIsCompressing(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (resultUrl && resultStats) {
        const percentSaved = Math.round(((resultStats.oldSize - resultStats.newSize) / resultStats.oldSize) * 100);
        const isSavings = percentSaved > 0;

        return (
            <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>

                <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Compression Complete!</h3>
                    <p className={`text-lg font-medium ${isSavings ? 'text-green-600' : 'text-orange-500'}`}>
                        {isSavings ? `You saved ${percentSaved}% file size` : 'File size increased (Try lower DPI)'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Original Size</p>
                        <p className="text-xl font-bold text-white">{formatBytes(resultStats.oldSize)}</p>
                    </div>
                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30">
                        <p className="text-xs text-green-400 uppercase tracking-wider mb-1">New Size</p>
                        <p className="text-xl font-bold text-green-400">{formatBytes(resultStats.newSize)}</p>
                    </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <a href={resultUrl} download={`compressed-${file?.name}`} className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary-500/20"><Download className="w-5 h-5 mr-2" /> Download Compressed PDF</Button>
                    </a>
                </div>

                <button
                    onClick={() => { setFile(null); setResultUrl(null); }}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white underline text-sm"
                >
                    Compress Another File
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {!file ? (
                <div className="space-y-8">
                    <FileUploadArea
                        accept=".pdf"
                        onChange={setFile}
                        label="Upload PDF to Compress"
                        icon={<Minimize2 className="w-12 h-12" />}
                        subLabel="Reduce file size while maintaining quality"
                    />

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { t: 'High Compression', d: 'Best for web & sharing', i: <Zap className="w-6 h-6" /> },
                            { t: 'Secure Processing', d: '100% Client-side', i: <Shield className="w-6 h-6" /> },
                            { t: 'Custom Control', d: 'DPI & Quality settings', i: <Sliders className="w-6 h-6" /> },
                        ].map((f, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-sm p-6 rounded-xl text-center border border-white/10 hover:bg-white/10 hover:shadow-lg transition-all">
                                <div className="text-primary-400 mb-3 flex justify-center">{f.i}</div>
                                <h4 className="font-bold mb-1 text-white">{f.t}</h4>
                                <p className="text-sm text-gray-400">{f.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-500">
                    {/* Left: Preview & File Info */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <FileText className="w-32 h-32 text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-red-400 mb-4 border border-white/5">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-white break-all line-clamp-2">{file.name}</h3>
                                <p className="text-gray-400 mt-2 font-mono text-sm">{formatBytes(file.size)}</p>
                                <button onClick={() => setFile(null)} className="mt-4 text-red-400 text-sm hover:underline flex items-center">
                                    <X className="w-4 h-4 mr-1" /> Remove File
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Settings */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-8 shadow-lg">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-white">
                                <Sliders className="w-5 h-5 text-primary-400" /> Compression Settings
                            </h3>

                            {/* Compression Level Selector */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                                {[
                                    { id: 'high', label: 'High', sub: 'Low Quality' },
                                    { id: 'balanced', label: 'Balanced', sub: 'Recommended' },
                                    { id: 'quality', label: 'Quality', sub: 'Min Compression' },
                                    { id: 'custom', label: 'Custom', sub: 'Manual' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setCompressionLevel(opt.id as any)}
                                        className={`p-3 rounded-xl border text-left transition-all ${compressionLevel === opt.id
                                            ? 'border-primary-500/50 bg-primary-500/20 ring-2 ring-primary-500/30'
                                            : 'border-white/10 hover:border-white/30 text-gray-400'
                                            }`}
                                    >
                                        <div className={`font-bold text-sm ${compressionLevel === opt.id ? 'text-primary-300' : 'text-gray-300'}`}>
                                            {opt.label}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{opt.sub}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Advanced Settings (Visible always but disabled if not custom? No, let's allow seeing them) */}
                            <div className={`space-y-6 transition-all duration-300 ${compressionLevel !== 'custom' ? 'opacity-75 grayscale pointer-events-none' : ''}`}>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image DPI (Resolution)</label>
                                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 rounded">{customDpi} DPI</span>
                                    </div>
                                    <input
                                        type="range" min="72" max="300" step="1"
                                        value={customDpi}
                                        onChange={(e) => setCustomDpi(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>72 (Screen)</span>
                                        <span>300 (Print)</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image Quality</label>
                                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 rounded">{Math.round(customQuality * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min="0.1" max="1.0" step="0.05"
                                        value={customQuality}
                                        onChange={(e) => setCustomQuality(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-300 mb-2 block">Image Format</label>
                                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                                            {['jpeg', 'png'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setFormat(f as any)}
                                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize ${format === f
                                                        ? 'bg-white/10 shadow-sm text-white border border-white/10'
                                                        : 'text-gray-400 hover:text-gray-200'
                                                        }`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`mt-6 space-y-3 pt-6 border-t border-gray-100 dark:border-gray-700 ${compressionLevel !== 'custom' ? 'opacity-100' : ''}`}>
                                {/* Toggles - Available in all modes logically, but let's link them to presets too? No, let user override */}
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${removeMetadata ? 'bg-primary-600' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${removeMetadata ? 'translate-x-4' : ''}`} />
                                    </div>
                                    <input type="checkbox" checked={removeMetadata} onChange={e => setRemoveMetadata(e.target.checked)} className="hidden" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">Remove Metadata (Title, Author, etc)</span>
                                </label>
                            </div>

                            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                                {isCompressing ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-primary-600 animate-pulse">Compressing PDF...</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="text-xs text-gray-400 text-center mt-2">Large dictionaries may take a few moments.</p>
                                    </div>
                                ) : (
                                    <Button onClick={handleCompress} size="lg" className="w-full h-12 text-lg shadow-lg shadow-primary-600/20">
                                        Compress PDF
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 15. PDF SPLITTER - Professional Implementation
const PdfSplitter: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [mode, setMode] = useState<'extract' | 'split-all' | 'range' | 'custom'>('custom');

    // Inputs
    const [manualRange, setManualRange] = useState('');
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(1);
    const [asZip, setAsZip] = useState(false);

    // Processing
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Load PDF & Generate Thumbnails
    useEffect(() => {
        if (!file) {
            setPageCount(0);
            setThumbnails([]);
            setSelectedPages([]);
            return;
        }

        const loadPdf = async () => {
            setIsLoading(true);
            try {
                const pdfjs = getPdfLib();
                if (!pdfjs) throw new Error("PDF Library not ready");

                const buffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: buffer }).promise;
                setPageCount(pdf.numPages);

                // Set default range
                setEndPage(pdf.numPages);

                // Generate Thumbnails (Limited to first 20 for perf, or lazy load? Let's do batch)
                // For a "Professional" tool, we should try to load all, but maybe low res.
                const thumbs: string[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnail
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        await page.render({ canvasContext: ctx, viewport }).promise;
                        thumbs.push(canvas.toDataURL());
                    }
                }
                setThumbnails(thumbs);
                // Default select all? No, default select none for custom
            } catch (e) {
                console.error(e);
                alert("Failed to load PDF pages.");
            } finally {
                setIsLoading(false);
            }
        };

        loadPdf();
    }, [file]);

    // Handle Selection Logic based on Mode
    useEffect(() => {
        if (mode === 'split-all') {
            // All pages selected logic is implicit in the execute step, 
            // but for UI visualization let's select all
            setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1));
            setAsZip(true); // Split all implies ZIP usually
        } else if (mode === 'range') {
            // Validate
            const start = Math.max(1, Math.min(startPage, pageCount));
            const end = Math.min(pageCount, Math.max(start, endPage));
            const range = [];
            for (let i = start; i <= end; i++) range.push(i);
            setSelectedPages(range);
        } else if (mode === 'extract') {
            // Parse manual range string "1, 3-5"
            // Simple parser:
            try {
                const parts = manualRange.split(',').map(s => s.trim());
                const pages = new Set<number>();
                parts.forEach(part => {
                    if (part.includes('-')) {
                        const [s, e] = part.split('-').map(Number);
                        if (!isNaN(s) && !isNaN(e)) {
                            for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
                                if (i >= 1 && i <= pageCount) pages.add(i);
                            }
                        }
                    } else {
                        const p = Number(part);
                        if (!isNaN(p) && p >= 1 && p <= pageCount) pages.add(p);
                    }
                });
                setSelectedPages(Array.from(pages).sort((a, b) => a - b));
            } catch {
                // Ignore parse errors while typing
            }
        }
    }, [mode, manualRange, startPage, endPage, pageCount]);

    const togglePage = (pageIds: number) => {
        if (mode !== 'custom') setMode('custom');

        setSelectedPages(prev => {
            if (prev.includes(pageIds)) return prev.filter(p => p !== pageIds);
            return [...prev, pageIds].sort((a, b) => a - b);
        });
    };

    const handleSplit = async () => {
        if (selectedPages.length === 0) {
            alert("Please select at least one page.");
            return;
        }

        setIsProcessing(true);
        setProgress(10);

        try {
            const PDFLib = getPDFLib();
            const pdfDoc = await PDFLib.PDFDocument.load(await file!.arrayBuffer());
            setProgress(30);

            if (asZip || mode === 'split-all') {
                const zip = new JSZip();
                let count = 0;

                for (const pageNum of selectedPages) {
                    const newPdf = await PDFLib.PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();

                    zip.file(`page_${pageNum}.pdf`, pdfBytes);

                    count++;
                    setProgress(30 + Math.round((count / selectedPages.length) * 40));
                }

                const content = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${file!.name.replace('.pdf', '')}_split.zip`;
                a.click();

            } else {
                // Merge Mode (Single PDF)
                const newPdf = await PDFLib.PDFDocument.create();
                const copiedPages = await newPdf.copyPages(pdfDoc, selectedPages.map(p => p - 1));
                copiedPages.forEach(page => newPdf.addPage(page));

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `${file!.name.replace('.pdf', '')}_split.pdf`;
                a.click();
            }

            setProgress(100);
            setTimeout(() => setProgress(0), 1000);

        } catch (e: any) {
            console.error(e);
            alert("Error splitting PDF: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {!file ? (
                <div className="max-w-xl mx-auto py-12">
                    <FileUploadArea
                        accept=".pdf"
                        onChange={setFile}
                        label="Upload PDF to Split"
                        icon={<Scissors className="w-12 h-12" />}
                        subLabel="View pages and extract what you need"
                    />
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 animate-in delay-100 fade-in">
                    {/* Sidebar Controls */}
                    <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                        <Card className="p-5 sticky top-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{file.name}</h3>
                                    <p className="text-sm text-gray-500">{pageCount} Pages</p>
                                </div>
                                <button onClick={() => setFile(null)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <hr className="my-4 border-gray-100 dark:border-gray-700" />

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Split Mode</label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'custom', label: 'Custom Select', icon: <Pointer className="w-4 h-4" /> },
                                        { id: 'range', label: 'By Range', icon: <ArrowRightLeft className="w-4 h-4" /> },
                                        { id: 'extract', label: 'Specific Pages', icon: <List className="w-4 h-4" /> },
                                        { id: 'split-all', label: 'Extract All Pages', icon: <Copy className="w-4 h-4" /> },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMode(m.id as any)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${mode === m.id
                                                ? 'bg-primary-600/80 text-white shadow-lg border border-primary-500/50'
                                                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                                                }`}
                                        >
                                            {m.icon} {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Inputs */}
                            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 min-h-[100px]">
                                {mode === 'custom' && (
                                    <p className="text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                                        <Pointer className="w-6 h-6 opacity-50" />
                                        Click pages in the grid to select them.
                                    </p>
                                )}
                                {mode === 'split-all' && (
                                    <p className="text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                                        <Copy className="w-6 h-6 opacity-50" />
                                        Every page will be saved as a separate PDF file.
                                    </p>
                                )}
                                {mode === 'range' && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Page Range</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number" min="1" max={pageCount} value={startPage}
                                                onChange={e => setStartPage(Number(e.target.value))}
                                                className="w-full p-2 border rounded text-center"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="number" min="1" max={pageCount} value={endPage}
                                                onChange={e => setEndPage(Number(e.target.value))}
                                                className="w-full p-2 border rounded text-center"
                                            />
                                        </div>
                                    </div>
                                )}
                                {mode === 'extract' && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Enter Page Numbers</p>
                                        <input
                                            type="text"
                                            value={manualRange}
                                            onChange={e => setManualRange(e.target.value)}
                                            placeholder="e.g. 1, 3-5, 8"
                                            className="w-full p-2 border rounded text-sm"
                                        />
                                        <p className="text-xs text-gray-400">Comma separated or ranges</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-3">
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={asZip}
                                        onChange={e => setAsZip(e.target.checked)}
                                        disabled={mode === 'split-all'} // Always ZIP for split-all
                                        className="rounded text-primary-600 focus:ring-primary-500"
                                    />
                                    Export as ZIP archive
                                </label>

                                <Button
                                    onClick={handleSplit}
                                    disabled={selectedPages.length === 0 || isProcessing}
                                    className="w-full py-6 text-lg font-bold shadow-xl shadow-primary-500/20"
                                >
                                    {isProcessing ? `Processing...` : `Download (${selectedPages.length})`}
                                </Button>
                            </div>

                            {isProcessing && (
                                <div className="mt-4">
                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}

                        </Card>
                    </div>

                    {/* Main Grid */}
                    <div className="flex-grow">
                        {isLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 animate-pulse">
                                <Loader className="w-10 h-10 animate-spin mb-4" />
                                <p>Renderings pages...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {thumbnails.map((src, idx) => {
                                    const pageNum = idx + 1;
                                    const isSelected = selectedPages.includes(pageNum);

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => togglePage(pageNum)}
                                            className={`relative group cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${isSelected
                                                ? 'ring-4 ring-primary-500 ring-offset-2 scale-[1.02]'
                                                : 'hover:ring-2 hover:ring-gray-300 scale-100 opacity-80 hover:opacity-100'
                                                }`}
                                        >
                                            <div className="aspect-[1/1.414] bg-white shadow-sm border rounded-lg overflow-hidden">
                                                <img src={src} alt={`Page ${pageNum}`} className="w-full h-full object-contain" />
                                            </div>

                                            {/* Overlay Info */}
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-bold rounded backdrop-blur-sm">
                                                Page {pageNum}
                                            </div>

                                            {/* Checkmark */}
                                            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-primary-600 text-white scale-100' : 'bg-gray-200 text-transparent scale-0 group-hover:scale-100'
                                                }`}>
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 16. PDF MERGER - Professional Implementation
const PdfMerger: React.FC = () => {
    // Types
    type PdfFileItem = {
        id: string;
        file: File;
        pageCount: number;
        thumbnail: string;
    };

    const [files, setFiles] = useState<PdfFileItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [normalize, setNormalize] = useState(false);

    const handleUpload = async (newFiles: FileList | File[]) => {
        setIsProcessing(true);
        const processed: PdfFileItem[] = [];

        try {
            const pdfjs = getPdfLib();
            if (!pdfjs) throw new Error("PDF Lib not ready");

            for (let i = 0; i < newFiles.length; i++) {
                const f = newFiles[i];
                if (f.type !== 'application/pdf') continue;

                const buff = await f.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: buff }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;

                processed.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file: f,
                    pageCount: pdf.numPages,
                    thumbnail: canvas.toDataURL()
                });
            }
            setFiles(prev => [...prev, ...processed]);
        } catch (e) {
            console.error(e);
            alert("Error loading PDF previews");
        } finally {
            setIsProcessing(false);
        }
    };

    const moveFile = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return;
        if (direction === 'right' && index === files.length - 1) return;

        const newFiles = [...files];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
        setFiles(newFiles);
    };

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const handleMerge = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setProgress(5);

        try {
            const PDFLib = getPDFLib();
            const mergedPdf = await PDFLib.PDFDocument.create();

            for (let i = 0; i < files.length; i++) {
                const fileItem = files[i];
                const pdfDoc = await PDFLib.PDFDocument.load(await fileItem.file.arrayBuffer());

                if (normalize) {
                    // A4 Dimensions: 595.28 x 841.89
                    const A4 = [595.28, 841.89];
                    const pages = pdfDoc.getPages();

                    for (let j = 0; j < pages.length; j++) {
                        // We must embed pages to place them on new A4 pages? 
                        // No, copyPages works better but keeps dimensions.
                        // To resize, we embed the page content into a new page.
                        const embeddedPage = await mergedPdf.embedPage(pages[j]);
                        const newPage = mergedPdf.addPage(A4);

                        // Scale to fit
                        const { width, height } = embeddedPage;
                        const scale = Math.min(A4[0] / width, A4[1] / height);

                        const scaledWidth = width * (scale * 0.95); // 5% margin
                        const scaledHeight = height * (scale * 0.95);

                        newPage.drawPage(embeddedPage, {
                            x: (A4[0] - scaledWidth) / 2,
                            y: (A4[1] - scaledHeight) / 2,
                            width: scaledWidth,
                            height: scaledHeight,
                        });
                    }
                } else {
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    copiedPages.forEach(page => mergedPdf.addPage(page));
                }

                setProgress(5 + Math.round(((i + 1) / files.length) * 80));
            }

            const mergedBytes = await mergedPdf.save();
            const blob = new Blob([mergedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `merged_document_${new Date().getTime()}.pdf`;
            a.click();

            setProgress(100);
            setTimeout(() => setProgress(0), 1000);

        } catch (e: any) {
            console.error(e);
            alert("Merge failed: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <Card className="p-8 border-dashed border-2 border-primary-500/30 bg-primary-500/5">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400">
                        <Files className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Merge PDF Files</h3>
                        <p className="text-gray-500">Combine multiple documents into one.</p>
                    </div>

                    <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))}
                        className="hidden"
                        id="merge-upload"
                    />
                    <Button onClick={() => document.getElementById('merge-upload')?.click()} size="lg" className="shadow-xl shadow-primary-500/20">
                        <Plus className="w-5 h-5 mr-2" /> Add Files
                    </Button>
                </div>
            </Card>

            {files.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                                {files.length}
                            </div>
                            <span className="font-medium">Files selected</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={normalize}
                                    onChange={e => setNormalize(e.target.checked)}
                                    className="rounded text-primary-600 focus:ring-primary-500"
                                />
                                Normalize to A4
                            </label>

                            <Button onClick={() => setFiles([])} variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                                Clear All
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map((file, idx) => (
                            <div key={file.id} className="relative group bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg overflow-hidden transition-all hover:shadow-xl hover:border-primary-500/50">
                                {/* Move Controls Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col justify-between p-2">
                                    <div className="flex justify-end">
                                        <button onClick={() => removeFile(file.id)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <button
                                            onClick={() => moveFile(idx, 'left')}
                                            disabled={idx === 0}
                                            className="bg-white/80 p-2 rounded-full hover:bg-white disabled:opacity-50"
                                        >
                                            <ArrowLeft className="w-4 h-4 text-gray-900" />
                                        </button>
                                        <span className="text-white font-bold text-shadow">{idx + 1}</span>
                                        <button
                                            onClick={() => moveFile(idx, 'right')}
                                            disabled={idx === files.length - 1}
                                            className="bg-white/80 p-2 rounded-full hover:bg-white disabled:opacity-50"
                                        >
                                            <ArrowRight className="w-4 h-4 text-gray-900" />
                                        </button>
                                    </div>
                                </div>

                                <div className="aspect-[1/1.4] bg-gray-50 w-full overflow-hidden flex flex-col">
                                    <img src={file.thumbnail} className="w-full flex-grow object-contain bg-gray-200" alt="thumb" />
                                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                        <p className="text-xs font-medium truncate mb-1" title={file.file.name}>{file.file.name}</p>
                                        <p className="text-[10px] text-gray-500">{file.pageCount} Pages • {(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-center">
                        {isProcessing && progress > 0 ? (
                            <div className="w-full max-w-md">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Merging...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        ) : (
                            <Button onClick={handleMerge} size="lg" className="w-full md:w-auto px-12 py-6 text-lg shadow-2xl shadow-primary-600/30">
                                Merge PDF Files
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 17. WORD TO PDF - Professional Implementation
const WordToPdf = () => {
    const [file, setFile] = useState<File | null>(null);
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'application/vnd.oasis.opendocument.text'
            ];

            if (!validTypes.includes(selectedFile.type) &&
                !selectedFile.name.match(/\.(docx?|odt)$/i)) {
                setError('Please select a valid Word document (.doc, .docx, .odt)');
                return;
            }

            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('File size must be less than 50MB');
                return;
            }

            setFile(selectedFile);
            setError(null);
            setSuccess(false);
        }
    };

    const convertToPdf = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setConverting(true);
        setProgress(0);
        setError(null);
        setSuccess(false);

        try {
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:3001/convert-word-to-pdf', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Conversion failed: ${response.statusText}`);
            }

            const pdfBlob = await response.blob();
            setProgress(100);

            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace(/\.(docx?|odt)$/i, '.pdf');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setSuccess(true);
            setTimeout(() => {
                setFile(null);
                setProgress(0);
                setSuccess(false);
            }, 3000);

        } catch (err) {
            console.error('Conversion error:', err);
            setError(err instanceof Error ? err.message : 'Conversion failed');
            setProgress(0);
        } finally {
            setConverting(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const fakeEvent = { target: { files: [droppedFile] } } as any;
            handleFileSelect(fakeEvent);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4 shadow-lg shadow-blue-500/20">
                    <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Professional Word to PDF Converter
                </h2>
                <p className="text-gray-400">
                    Convert .doc, .docx, and .odt files to high-quality PDF
                </p>
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400 font-medium">
                        Professional LibreOffice Engine
                    </span>
                </div>
            </div>

            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-blue-400/50 bg-white/5 hover:bg-white/10'
                    }`}
            >
                {!file ? (
                    <>
                        <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-200 mb-2 font-medium">
                            Drop your Word document here
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                        <input
                            type="file"
                            accept=".doc,.docx,.odt"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="word-file-input"
                        />
                        <label
                            htmlFor="word-file-input"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Select File
                        </label>
                        <p className="text-xs text-gray-400 mt-3">
                            Supports: .doc, .docx, .odt • Max size: 50MB
                        </p>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                            <div className="text-left">
                                <p className="font-medium text-gray-800">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        </div>

                        {!converting && !success && (
                            <button
                                onClick={() => {
                                    setFile(null);
                                    setError(null);
                                }}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                                Choose different file
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {converting && (
                <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Converting...</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Professional conversion using LibreOffice engine...
                    </p>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                        <p className="text-green-200 font-medium">Conversion successful!</p>
                        <p className="text-sm text-green-400">PDF downloaded to your device</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-800 font-medium">Conversion failed</p>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
            )}

            {/* Convert Button */}
            {file && !converting && !success && (
                <button
                    onClick={convertToPdf}
                    className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                    <FileText className="w-5 h-5" />
                    Convert to Professional PDF
                </button>
            )}

            {/* Features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">Fast Conversion</h3>
                    <p className="text-xs text-gray-400">
                        Professional-grade processing in seconds
                    </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                        <Shield className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">High Fidelity</h3>
                    <p className="text-xs text-gray-400">
                        Preserves formatting, tables, and images
                    </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">Secure</h3>
                    <p className="text-xs text-gray-400">
                        Files processed securely and deleted after conversion
                    </p>
                </div>
            </div>
        </div>
    );
};

// 18. PDF TO WORD - Professional Implementation
const PdfToWord = () => {
    const [file, setFile] = useState<File | null>(null);
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf' && !selectedFile.name.match(/\.pdf$/i)) {
                setError('Please select a valid PDF file');
                return;
            }

            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('File size must be less than 50MB');
                return;
            }

            setFile(selectedFile);
            setError(null);
            setSuccess(false);
        }
    };

    const convertToWord = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setConverting(true);
        setProgress(0);
        setError(null);
        setSuccess(false);

        try {
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:3001/convert-pdf-to-word', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Conversion failed: ${response.statusText}`);
            }

            const docxBlob = await response.blob();
            setProgress(100);

            const url = window.URL.createObjectURL(docxBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace(/\.pdf$/i, '.docx');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setSuccess(true);
            setTimeout(() => {
                setFile(null);
                setProgress(0);
                setSuccess(false);
            }, 3000);

        } catch (err) {
            console.error('Conversion error:', err);
            setError(err instanceof Error ? err.message : 'Conversion failed');
            setProgress(0);
        } finally {
            setConverting(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const fakeEvent = { target: { files: [droppedFile] } } as any;
            handleFileSelect(fakeEvent);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4 shadow-lg shadow-blue-500/20">
                    <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Professional PDF to Word Converter
                </h2>
                <p className="text-gray-400">
                    Convert complex PDFs to editable Word documents
                </p>
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400 font-medium">
                        Professional OCR & Layout Engine
                    </span>
                </div>
            </div>

            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-blue-400/50 bg-white/5 hover:bg-white/10'
                    }`}
            >
                {!file ? (
                    <>
                        <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-200 mb-2 font-medium">
                            Drop your PDF here
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="pdf-word-input"
                        />
                        <label
                            htmlFor="pdf-word-input"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Select PDF
                        </label>
                        <p className="text-xs text-gray-400 mt-3">
                            Supports: .pdf • Max size: 50MB
                        </p>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                            <div className="text-left">
                                <p className="font-medium text-gray-800">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        </div>

                        {!converting && !success && (
                            <button
                                onClick={() => {
                                    setFile(null);
                                    setError(null);
                                }}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                                Choose different file
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {converting && (
                <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Converting...</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Extracting layout, tables, and images...
                    </p>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <div>
                        <p className="text-green-800 dark:text-green-200 font-medium">Conversion successful!</p>
                        <p className="text-sm text-green-600 dark:text-green-400">Word document downloaded</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-800 dark:text-red-200 font-medium">Conversion failed</p>
                        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    </div>
                </div>
            )}

            {/* Convert Button */}
            {file && !converting && !success && (
                <button
                    onClick={convertToWord}
                    className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                    <FileText className="w-5 h-5" />
                    Convert to Word
                </button>
            )}

            {/* Features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">OCR Support</h3>
                    <p className="text-xs text-gray-400">
                        Extracts text from scanned PDFs automatically
                    </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                        <Shield className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">Layout Preservation</h3>
                    <p className="text-xs text-gray-400">
                        Keeps tables, columns, and images intact
                    </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="font-medium text-white mb-1">Secure</h3>
                    <p className="text-xs text-gray-400">
                        Files processed securely and deleted after conversion
                    </p>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// PROFESSIONAL MEDIA TOOLS SUITE
// ============================================================================

// 19. PRO VIDEO COMPRESSOR - Professional Grade
const ProVideoCompressor = () => {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [videoInfo, setVideoInfo] = useState<{ duration: string; resolution: string; size: string } | null>(null);

    // Settings
    const [preset, setPreset] = useState<'ultra' | 'balanced' | 'maximum' | 'custom'>('balanced');
    const [codec, setCodec] = useState<'h264' | 'h265' | 'vp9'>('h264');
    const [bitrateMode, setBitrateMode] = useState<'cbr' | 'vbr' | 'target'>('vbr');
    const [targetSize, setTargetSize] = useState(10);
    const [resolution, setResolution] = useState<'original' | '720p' | '480p' | '360p'>('original');
    const [keepAudio, setKeepAudio] = useState(true);

    const ffmpegRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi'];
            if (!validTypes.some(t => selectedFile.type.includes(t.split('/')[1])) &&
                !selectedFile.name.match(/\.(mp4|mov|mkv|avi|webm)$/i)) {
                setError('Please select a valid video file (MP4, MOV, MKV, AVI, WebM)');
                return;
            }

            setFile(selectedFile);
            setError(null);
            setResult(null);

            // Get video info
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const duration = Math.floor(video.duration);
                const mins = Math.floor(duration / 60);
                const secs = duration % 60;
                setVideoInfo({
                    duration: `${mins}:${secs.toString().padStart(2, '0')}`,
                    resolution: `${video.videoWidth}x${video.videoHeight}`,
                    size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                });
                URL.revokeObjectURL(video.src);
            };
            video.src = URL.createObjectURL(selectedFile);
        }
    };

    const compressVideo = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setResult(null);
        setProgressMessage('Uploading video...');

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('preset', preset);
            formData.append('codec', codec);
            formData.append('resolution', resolution);
            formData.append('keepAudio', keepAudio.toString());

            // Start progress simulation
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 5;
                });
                setProgressMessage('Compressing with native FFmpeg...');
            }, 500);

            // Call backend API
            const response = await fetch('http://localhost:3001/compress-video', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Compression failed: ${response.statusText}`);
            }

            // Get compression stats from headers
            const originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
            const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0');
            const savedPercent = response.headers.get('X-Saved-Percent') || '0';

            // Get the compressed video
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            setResult({
                url,
                size: blob.size,
                name: file.name.replace(/\.[^.]+$/, '_compressed.mp4')
            });

            setProgress(100);
            setProgressMessage(`Complete! Saved ${savedPercent}%`);

        } catch (err) {
            console.error('Compression error:', err);
            setError(err instanceof Error ? err.message : 'Compression failed. Make sure the backend server is running.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const fakeEvent = { target: { files: [droppedFile] } } as any;
            handleFileSelect(fakeEvent);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
                    <Video className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Professional Video Compressor</h2>
                <p className="text-gray-600 dark:text-gray-400">Reduce file size while preserving quality</p>
            </div>

            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 hover:border-purple-400 bg-white/5'
                    }`}
            >
                {!file ? (
                    <>
                        <Video className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-200 mb-2 font-medium">Drop your video here</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                        <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.mov,.mkv,.avi,.webm"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="video-compressor-input"
                        />
                        <label
                            htmlFor="video-compressor-input"
                            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Select Video
                        </label>
                        <p className="text-xs text-gray-400 mt-3">MP4, MOV, MKV, AVI, WebM • Max 500MB</p>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <Video className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                            <div className="text-left">
                                <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                                {videoInfo && (
                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <span>{videoInfo.size}</span>
                                        <span>{videoInfo.resolution}</span>
                                        <span>{videoInfo.duration}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {!processing && !result && (
                            <button
                                onClick={() => { setFile(null); setVideoInfo(null); }}
                                className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Choose different file
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Settings Panel */}
            {file && !processing && !result && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-6 shadow-lg">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-purple-400" />
                        Compression Settings
                    </h3>

                    {/* Preset Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quality Preset</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'ultra', label: 'Ultra Quality', desc: 'Minimal compression' },
                                { id: 'balanced', label: 'Balanced', desc: 'Recommended' },
                                { id: 'maximum', label: 'Maximum', desc: 'Smallest size' },
                                { id: 'custom', label: 'Custom', desc: 'Advanced' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPreset(p.id as any)}
                                    className={`p-3 rounded-xl border text-left transition-all ${preset === p.id
                                        ? 'border-purple-500/50 bg-purple-500/20 ring-2 ring-purple-500/30'
                                        : 'border-white/10 hover:border-purple-500/30 bg-white/5'
                                        }`}
                                >
                                    <div className="font-medium text-sm text-white">{p.label}</div>
                                    <div className="text-xs text-gray-400">{p.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Codec Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Codec</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'h264', label: 'H.264', desc: 'Best compatibility' },
                                { id: 'h265', label: 'H.265/HEVC', desc: 'Better compression' },
                                { id: 'vp9', label: 'VP9', desc: 'Web optimized' }
                            ].map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setCodec(c.id as any)}
                                    className={`flex-1 p-3 rounded-lg border text-center transition-all ${codec === c.id
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                                        }`}
                                >
                                    <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{c.label}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{c.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resolution */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Resolution</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'original', label: 'Original' },
                                { id: '720p', label: '720p' },
                                { id: '480p', label: '480p' },
                                { id: '360p', label: '360p' }
                            ].map(res => (
                                <button
                                    key={res.id}
                                    onClick={() => setResolution(res.id as any)}
                                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${resolution === res.id
                                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {res.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Audio Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-sm text-gray-700 dark:text-gray-300">Keep Audio</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Preserve audio track in output</div>
                        </div>
                        <button
                            onClick={() => setKeepAudio(!keepAudio)}
                            className={`w-12 h-6 rounded-full transition-colors ${keepAudio ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${keepAudio ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                        </button>
                    </div>
                </div>
            )}

            {/* Progress */}
            {processing && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{progressMessage}</span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                        This may take a few minutes depending on file size...
                    </p>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
                        <div>
                            <p className="font-medium text-green-800 dark:text-green-200">Compression Complete!</p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                                New size: {(result.size / (1024 * 1024)).toFixed(2)} MB
                                {videoInfo && (
                                    <span className="ml-2">
                                        (Saved {Math.round((1 - result.size / file!.size) * 100)}%)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <a
                        href={result.url}
                        download={result.name}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download Compressed Video
                    </a>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Compression Failed</p>
                        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    </div>
                </div>
            )}

            {/* Compress Button */}
            {file && !processing && !result && (
                <button
                    onClick={compressVideo}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                    <Zap className="w-5 h-5" />
                    Compress Video
                </button>
            )}
        </div>
    );
}

// 20. PRO VIDEO TO GIF - High-Quality Animator
const ProVideoToGif = () => {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [videoInfo, setVideoInfo] = useState<{ duration: number; resolution: string } | null>(null);

    // Settings
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(5);
    const [fps, setFps] = useState(15);
    const [width, setWidth] = useState(480);
    const [loop, setLoop] = useState(0); // 0 = infinite

    const ffmpegRef = useRef<any>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);

            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                setVideoInfo({
                    duration: video.duration,
                    resolution: `${video.videoWidth}x${video.videoHeight}`
                });
                setEndTime(Math.min(5, video.duration));
                URL.revokeObjectURL(video.src);
            };
            video.src = URL.createObjectURL(selectedFile);
        }
    };

    const convertToGif = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setResult(null);
        setProgressMessage('Uploading video...');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('startTime', startTime.toString());
            formData.append('endTime', endTime.toString());
            formData.append('fps', fps.toString());
            formData.append('width', width.toString());

            // Progress simulation
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
                setProgressMessage('Creating GIF with native FFmpeg...');
            }, 400);

            const response = await fetch('http://localhost:3001/video-to-gif', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `GIF conversion failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            setResult({
                url,
                size: blob.size,
                name: file.name.replace(/\.[^.]+$/, '.gif')
            });

            setProgress(100);
            setProgressMessage('Complete!');

        } catch (err) {
            console.error('GIF conversion error:', err);
            setError(err instanceof Error ? err.message : 'Conversion failed. Make sure the backend server is running.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
                    <Monitor className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Video to GIF Pro</h2>
                <p className="text-gray-600 dark:text-gray-400">Create high-quality animated GIFs</p>
            </div>

            {/* Upload Area */}
            <div
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect({ target: { files: e.dataTransfer.files } } as any); }}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-green-400 bg-white/5'
                    }`}
            >
                {!file ? (
                    <>
                        <Monitor className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-200 mb-2 font-medium">Drop your video here</p>
                        <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" id="gif-video-input" />
                        <label htmlFor="gif-video-input" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />Select Video
                        </label>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <Video className="w-12 h-12 text-green-600 dark:text-green-400" />
                            <div className="text-left">
                                <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                                {videoInfo && <p className="text-sm text-gray-500 dark:text-gray-400">{videoInfo.resolution} • {videoInfo.duration.toFixed(1)}s</p>}
                            </div>
                        </div>
                        {!processing && !result && (
                            <button onClick={() => { setFile(null); setVideoInfo(null); }} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                Choose different file
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Settings */}
            {file && !processing && !result && videoInfo && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4 shadow-lg">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Settings className="w-5 h-5" />GIF Settings
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time (s)</label>
                            <input type="number" value={startTime} onChange={(e) => setStartTime(Number(e.target.value))} min={0} max={videoInfo.duration}
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time (s)</label>
                            <input type="number" value={endTime} onChange={(e) => setEndTime(Number(e.target.value))} min={startTime} max={videoInfo.duration}
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frame Rate (FPS)</label>
                            <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                <option value={10}>10 FPS</option>
                                <option value={15}>15 FPS</option>
                                <option value={24}>24 FPS</option>
                                <option value={30}>30 FPS</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Width (px)</label>
                            <select value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                <option value={320}>320px</option>
                                <option value={480}>480px</option>
                                <option value={640}>640px</option>
                                <option value={800}>800px</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress */}
            {processing && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{progressMessage}</span>
                        <span className="text-green-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <div>
                            <p className="font-medium text-green-200">GIF Created!</p>
                            <p className="text-sm text-green-300">Size: {(result.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                    <img src={result.url} alt="GIF Preview" className="max-w-full h-auto rounded-lg border" />
                    <a href={result.url} download={result.name} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Download className="w-4 h-4" />Download GIF
                    </a>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div><p className="font-medium text-red-200">Conversion Failed</p><p className="text-sm text-red-300">{error}</p></div>
                </div>
            )}

            {file && !processing && !result && (
                <button onClick={convertToGif} className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />Convert to GIF
                </button>
            )}
        </div>
    );
};

// 22. PRO VIDEO RESOLUTION - Precision Scaler
const ProVideoResolution = () => {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [videoInfo, setVideoInfo] = useState<{ width: number; height: number } | null>(null);

    const [targetResolution, setTargetResolution] = useState<'480p' | '720p' | '1080p' | '1440p' | '4k' | 'custom'>('720p');
    const [customWidth, setCustomWidth] = useState(1280);
    const [customHeight, setCustomHeight] = useState(720);
    const [scaleMethod, setScaleMethod] = useState<'bilinear' | 'bicubic' | 'lanczos'>('lanczos');

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);

            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                setVideoInfo({ width: video.videoWidth, height: video.videoHeight });
                URL.revokeObjectURL(video.src);
            };
            video.src = URL.createObjectURL(selectedFile);
        }
    };

    const resizeVideo = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setResult(null);
        setProgressMessage('Starting upload...');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetResolution', targetResolution);
        if (targetResolution === 'custom') {
            formData.append('customWidth', customWidth.toString());
            formData.append('customHeight', customHeight.toString());
        }
        formData.append('scaleMethod', scaleMethod);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3001/change-resolution', true);
        xhr.responseType = 'blob';

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 50);
                setProgress(percentComplete);
                if (percentComplete >= 50) {
                    setProgressMessage(`Processing on Server (this may take a moment)... ${percentComplete}%`);
                } else {
                    setProgressMessage(`Uploading... ${percentComplete}%`);
                }
            }
        };

        xhr.onload = async () => {
            if (xhr.status === 200) {
                setProgress(100);
                setProgressMessage('Complete!');
                const blob = xhr.response;
                const url = URL.createObjectURL(blob);
                setResult({
                    url,
                    size: blob.size,
                    name: file.name.replace(/\.[^.]+$/, `_${targetResolution}.mp4`)
                });
                setProcessing(false);
            } else {
                // Try to read error message from blob
                const text = await xhr.response.text();
                try {
                    const json = JSON.parse(text);
                    setError(json.error || 'Server processing failed');
                } catch (e) {
                    setError('Server processing failed');
                }
                setProcessing(false);
            }
        };

        xhr.onerror = () => {
            setError('Network error. Check if backend server is running.');
            setProcessing(false);
        };

        xhr.onprogress = (event) => {
            // Download progress (processing + download)
            // We can map 50-100% here roughly
            if (event.lengthComputable) {
                const percentComplete = 50 + Math.round((event.loaded / event.total) * 50);
                setProgress(percentComplete);
                setProgressMessage(`Processing & Downloading... ${percentComplete}%`);
            }
        };

        xhr.send(formData);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg">
                    <Maximize2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Video Resolution Changer</h2>
                <p className="text-gray-600 dark:text-gray-400">Precision video scaling with quality preservation</p>
            </div>

            {/* Upload */}
            <div
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect({ target: { files: e.dataTransfer.files } } as any); }}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/10 hover:border-orange-400 bg-white/5'
                    }`}
            >
                {!file ? (
                    <>
                        <Video className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" id="resolution-input" />
                        <label htmlFor="resolution-input" className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />Select Video
                        </label>
                    </>
                ) : (
                    <div className="space-y-2">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                        {videoInfo && <p className="text-sm text-gray-500 dark:text-gray-400">Current: {videoInfo.width}x{videoInfo.height}</p>}
                    </div>
                )}
            </div>

            {/* Settings */}
            {file && !processing && !result && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4 shadow-lg">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Resolution Settings</h3>

                    <div className="grid grid-cols-3 gap-2">
                        {['480p', '720p', '1080p', '1440p', '4k', 'custom'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setTargetResolution(r as any)}
                                className={`p-3 rounded-lg border text-center transition-all ${targetResolution === r ? 'border-orange-500 bg-orange-500/20 shadow-lg shadow-orange-500/20' : 'border-white/10 hover:border-orange-500/50 hover:bg-white/5'
                                    } text-white`}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {targetResolution === 'custom' && (
                        <div className="flex gap-4">
                            <input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))}
                                placeholder="Width" className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
                            <span className="self-center dark:text-gray-400">x</span>
                            <input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))}
                                placeholder="Height" className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scaling Algorithm</label>
                        <select value={scaleMethod} onChange={(e) => setScaleMethod(e.target.value as any)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            <option value="bilinear">Bilinear (Fast)</option>
                            <option value="bicubic">Bicubic (Balanced)</option>
                            <option value="lanczos">Lanczos (High Quality)</option>
                        </select>
                    </div>
                </div>
            )}

            {processing && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4 shadow-lg">
                    <div className="flex justify-between"><span className="text-white">{progressMessage}</span><span className="text-orange-400 font-semibold">{progress}%</span></div>
                    <div className="w-full bg-white/10 rounded-full h-3"><div className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all" style={{ width: `${progress}%` }} /></div>
                </div>
            )}

            {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <p className="font-medium text-green-200">Resize Complete! ({(result.size / (1024 * 1024)).toFixed(2)} MB)</p>
                    </div>
                    <a href={result.url} download={result.name} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Download className="w-4 h-4" />Download
                    </a>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div><p className="font-medium text-red-200">Error</p><p className="text-sm text-red-300">{error}</p></div>
                </div>
            )}

            {file && !processing && !result && (
                <button onClick={resizeVideo} className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />Resize Video
                </button>
            )}
        </div>
    );
};

// 23. PRO VIDEO CONVERTER - Professional Transcoder
const ProVideoConverter = () => {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm' | 'mkv' | 'mov' | 'avi'>('mp4');
    const [profile, setProfile] = useState<'web' | 'mobile' | 'editing' | 'archive'>('web');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const convertVideo = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setResult(null);
        setProgressMessage('Starting upload...');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('outputFormat', outputFormat);
        formData.append('profile', profile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3001/convert-video', true);
        xhr.timeout = 0; // No client-side timeout (browser default is 0, but being explicit)
        xhr.responseType = 'blob';

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 50);
                setProgress(percentComplete);
                if (percentComplete >= 50) {
                    setProgressMessage(`Processing on Server... ${percentComplete}%`);

                    // Simulate processing progress (Fake 50-90%)
                    if ((window as any).processingInterval) clearInterval((window as any).processingInterval);

                    let currentFakeProgress = 50;
                    (window as any).processingInterval = setInterval(() => {
                        currentFakeProgress += 1;
                        if (currentFakeProgress > 90) {
                            clearInterval((window as any).processingInterval);
                        } else {
                            setProgress(currentFakeProgress);
                            setProgressMessage(`Processing on Server... ${currentFakeProgress}%`);
                        }
                    }, 500); // +1% every 500ms
                } else {
                    setProgressMessage(`Uploading... ${percentComplete}%`);
                }
            }
        };

        xhr.onload = async () => {
            if ((window as any).processingInterval) {
                clearInterval((window as any).processingInterval);
                (window as any).processingInterval = null;
            }

            if (xhr.status === 200) {
                setProgress(100);
                setProgressMessage('Complete!');
                const blob = xhr.response;
                const url = URL.createObjectURL(blob);
                setResult({
                    url,
                    size: blob.size,
                    name: file.name.replace(/\.[^.]+$/, `.${outputFormat}`)
                });
                setProcessing(false);
            } else {
                const text = await xhr.response.text();
                try {
                    const json = JSON.parse(text);
                    setError(json.error || 'Server processing failed');
                } catch (e) {
                    setError('Server processing failed');
                }
                setProcessing(false);
            }
        };

        xhr.onerror = () => {
            setError('Network error. Check if backend server is running.');
            setProcessing(false);
        };

        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = 50 + Math.round((event.loaded / event.total) * 50);
                setProgress(percentComplete);
                setProgressMessage(`Processing & Downloading... ${percentComplete}%`);
            } else {
                // Fallback if Content-Length is missing (e.g. chunked encoding)
                // Start at 51% and slowly increment or just show indeterminate state
                setProgress(Math.min(90, 50 + Math.round((event.loaded / (1024 * 1024)) * 5))); // Fake progress based on MB downloaded
                setProgressMessage(`Downloading... ${(event.loaded / (1024 * 1024)).toFixed(1)} MB`);
            }
        };

        xhr.send(formData);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                    <RefreshCw className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Video Format Converter</h2>
                <p className="text-gray-600 dark:text-gray-400">Professional transcoding between formats</p>
            </div>

            {/* Upload */}
            <div
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect({ target: { files: e.dataTransfer.files } } as any); }}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-xl p-8 text-center ${file ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-cyan-400'}`}
            >
                {!file ? (
                    <>
                        <Video className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" id="converter-input" />
                        <label htmlFor="converter-input" className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />Select Video
                        </label>
                    </>
                ) : (
                    <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                )}
            </div>

            {/* Settings */}
            {file && !processing && !result && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4 shadow-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Format</label>
                        <div className="flex gap-2">
                            {['mp4', 'webm', 'mkv', 'mov', 'avi'].map((f) => (
                                <button key={f} onClick={() => setOutputFormat(f as any)}
                                    className={`flex-1 p-3 rounded-lg border uppercase font-medium transition-all ${outputFormat === f ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20' : 'border-white/10 text-gray-300 hover:border-cyan-500/30'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compatibility Profile</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'web', label: 'Web Optimized', desc: 'Best for streaming' },
                                { id: 'mobile', label: 'Mobile', desc: 'Smaller size' },
                                { id: 'editing', label: 'Editing', desc: 'High quality' },
                                { id: 'archive', label: 'Archive', desc: 'Maximum quality' }
                            ].map((p) => (
                                <button key={p.id} onClick={() => setProfile(p.id as any)}
                                    className={`p-3 rounded-lg border text-left transition-all ${profile === p.id ? 'border-cyan-500 bg-cyan-500/20' : 'border-white/10 hover:border-cyan-500/30'}`}>
                                    <div className="font-medium text-sm text-white">{p.label}</div>
                                    <div className="text-xs text-gray-400">{p.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {processing && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4 shadow-lg">
                    <div className="flex justify-between"><span className="text-white">{progressMessage}</span><span className="text-cyan-400 font-semibold">{progress}%</span></div>
                    <div className="w-full bg-white/10 rounded-full h-3"><div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full" style={{ width: `${progress}%` }} /></div>
                </div>
            )}

            {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <p className="font-medium text-green-200">Conversion Complete! ({(result.size / (1024 * 1024)).toFixed(2)} MB)</p>
                    </div>
                    <a href={result.url} download={result.name} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Download className="w-4 h-4" />Download
                    </a>
                </div>
            )}

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"><p className="text-red-200">{error}</p></div>}

            {file && !processing && !result && (
                <button onClick={convertVideo} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />Convert Video
                </button>
            )}
        </div>
    );
};

// 24. PRO VIDEO ROTATOR - Lossless Rotation
const ProVideoRotator = () => {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ url: string; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [rotation, setRotation] = useState<90 | 180 | 270>(90);
    const [flip, setFlip] = useState<'none' | 'horizontal' | 'vertical'>('none');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const rotateVideo = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('rotation', rotation.toString());
            formData.append('flip', flip);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://localhost:3001/rotate-video', true);
            xhr.timeout = 900000; // 15 minute timeout for large videos
            xhr.responseType = 'blob';

            let progressSimInterval: any = null;

            // Upload progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 50);
                    setProgress(percentComplete);
                }
            };

            // Start simulating progress after upload completes
            xhr.upload.onload = () => {
                setProgress(50);
                // Simulate gradual progress from 50% to 90%
                let currentProgress = 50;
                progressSimInterval = setInterval(() => {
                    if (currentProgress < 90) {
                        currentProgress += 2;
                        setProgress(currentProgress);
                    } else {
                        clearInterval(progressSimInterval);
                    }
                }, 1000); // Increment every second
            };

            // Response handling
            xhr.onload = async () => {
                if (xhr.status === 200) {
                    setProgress(100);
                    const blob = xhr.response;
                    const url = URL.createObjectURL(blob);

                    setResult({
                        url,
                        name: file.name.replace(/\.[^.]+$/, '_rotated.mp4')
                    });
                    setProcessing(false);
                } else {
                    const text = await xhr.response.text();
                    try {
                        const json = JSON.parse(text);
                        setError(json.error || 'Rotation failed');
                    } catch (e) {
                        setError('Rotation failed');
                    }
                    setProcessing(false);
                }
            };

            xhr.onerror = () => {
                if (progressSimInterval) clearInterval(progressSimInterval);
                setError('Network error. Check if backend server is running.');
                setProcessing(false);
            };

            xhr.ontimeout = () => {
                if (progressSimInterval) clearInterval(progressSimInterval);
                setError('Request timed out. The video may be too large or complex to process.');
                setProcessing(false);
            };

            xhr.send(formData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Rotation failed');
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                    <RotateCw className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Lossless Video Rotator</h2>
                <p className="text-gray-600 dark:text-gray-400">Rotate videos without quality loss</p>
            </div>

            {/* Upload */}
            <div
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect({ target: { files: e.dataTransfer.files } } as any); }}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-violet-400'}`}
            >
                {!file ? (
                    <>
                        <RotateCw className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" id="rotator-input" />
                        <label htmlFor="rotator-input" className="inline-flex items-center px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />Select Video
                        </label>
                    </>
                ) : (
                    <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                )}
            </div>

            {/* Rotation Controls */}
            {file && !processing && !result && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4 shadow-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rotation</label>
                        <div className="flex gap-2">
                            {[90, 180, 270].map((r) => (
                                <button key={r} onClick={() => setRotation(r as 90 | 180 | 270)}
                                    className={`flex-1 p-4 rounded-lg border text-center transition-all ${rotation === r ? 'border-violet-500 bg-violet-500/20' : 'border-white/10 hover:border-violet-500/30'} text-gray-200`}>
                                    <RotateCw className={`w-6 h-6 mx-auto mb-1 ${rotation === r ? 'text-violet-400' : 'text-gray-400'}`} style={{ transform: `rotate(${r}deg)` }} />
                                    <span className="text-sm font-medium">{r}°</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Flip</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'none', label: 'None' },
                                { id: 'horizontal', label: 'Horizontal' },
                                { id: 'vertical', label: 'Vertical' }
                            ].map((f) => (
                                <button key={f.id} onClick={() => setFlip(f.id as any)}
                                    className={`flex-1 p-3 rounded-lg border transition-all ${flip === f.id ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-white/10 text-gray-200 hover:border-violet-500/30'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {processing && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4 shadow-lg">
                    <div className="flex justify-between"><span className="text-white">Rotating...</span><span className="text-violet-400 font-semibold">{progress}%</span></div>
                    <div className="w-full bg-white/10 rounded-full h-3"><div className="bg-gradient-to-r from-violet-500 to-purple-500 h-full" style={{ width: `${progress}%` }} /></div>
                </div>
            )}

            {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <p className="font-medium text-green-200">Rotation Complete!</p>
                    </div>
                    <a href={result.url} download={result.name} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Download className="w-4 h-4" />Download
                    </a>
                </div>
            )}

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"><p className="text-red-200">{error}</p></div>}

            {file && !processing && !result && (
                <button onClick={rotateVideo} className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    <RotateCw className="w-5 h-5" />Rotate Video
                </button>
            )}
        </div>
    );
}
