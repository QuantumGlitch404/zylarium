# Zylarium AI Tool Suite & Multi-Utility Platform

Zylarium is an advanced, ultra-fast, and comprehensive multi-utility web platform. It integrates state-of-the-art AI microservices (powered by NVIDIA NIM and LLaMA 3.1) with over 30+ everyday utilities spanning from Image Processing and Cryptography to Web Development and Personal Productivity tools.

Designed with a premium glassmorphism UI, a flawless dark-mode aesthetic, and seamless performance, Zylarium is your all-in-one digital Swiss Army knife.

---

## 🛠 Tech Stack

**Frontend Framework & UI**
- **React 18** (with React DOM)
- **Vite** (Next-generation lightning-fast bundler)
- **TypeScript** (Strict typing for enterprise-grade stability)
- **TailwindCSS 3.4** (Utility-first CSS for rapid UI development and custom dark mode)
- **Lucide-React** (Premium SVG icon library)
- **Framer Motion** (For fluid animations and micro-interactions)

**Backend & AI Integration (Serverless / Proxy)**
- **NVIDIA NIM API:** Powering the `meta/llama-3.1-8b-instruct` and `abacusai/dracarys-llama-3.1-70b-instruct` models for ultra-fast, uncensored text processing and translation.
- **Web Speech API (`SpeechRecognition`):** Utilized for 100% free, real-time, browser-native voice transcription, entirely bypassing API quota limits.
- **Vite Proxy:** A local proxy configuration (`vite.config.ts`) routes `/nvidia-api` traffic seamlessly to bypass CORS restrictions during development.

**Utility Libraries**
- **PDF.js (pdfjs-dist):** Client-side PDF parsing for extracting text from books and essays.
- **Crypto-JS:** Secure client-side AES encryption/decryption, SHA-256, and MD5 hashing.
- **Tesseract.js:** Optical Character Recognition (OCR) for extracting text from images locally.
- **JSZip / html2canvas:** Assisting with local file compression and DOM-to-Image exports.

---

## 🏗 Project Architecture & Structure

Zylarium uses a standard modern React SPA architecture.

```text
📁 Zylarium (Root)
│
├── 📁 components/        # Core UI layout components
│   ├── Layout.tsx        # Main application layout, sidebar navigation, header
│   └── ui/               # Reusable stylized UI elements (Splash cursors, backgrounds)
│
├── 📁 pages/
│   └── 📁 components/    # 30+ Individual Tools and Utilities (The core features)
│       ├── AIBookSummarizer.tsx    # 128k context LLaMA AI book breakdown
│       ├── AIEssaySummarizer.tsx   # Fast text summarization with rich markdown
│       ├── AITranslator.tsx        # Ultra-fast real-time translation
│       ├── AIVoiceNotes.tsx        # Web Speech API to NVIDIA Dracarys formatting
│       ├── ImageOCR.tsx            # Optical Character Recognition
│       ├── AesEncrypt.tsx          # AES encryption/decryption utilities
│       ├── ProCalculator.tsx       # Advanced mathematical calculator
│       ├── ProPasswordGenerator.tsx# Secure password generation
│       ├── ImageResizer.tsx        # Client-side image manipulation
│       └── ... (20+ more utilities)
│
├── 📁 services/          # External API Integrations
│   └── geminiService.ts  # Legacy services (deprecated/replaced by native + NVIDIA)
│
├── 📁 data/              # Static data configurations
│   └── hustleData.ts     # Content mappings for specific features
│
├── 📄 index.html         # Application HTML entry point
├── 📄 index.tsx          # React DOM root render file
├── 📄 index.css          # Global Tailwind styles & custom animations
├── 📄 vite.config.ts     # Vite bundler & CORS proxy configuration
├── 📄 tailwind.config.js # Custom colors, fonts, and dark mode setup
├── 📄 package.json       # Project dependencies & npm scripts
└── 📄 tsconfig.json      # TypeScript compiler rules
```

---

## 🧠 Core AI Features Detail

1. **AI Voice Notes:** Completely serverless real-time voice transcription using the browser's native `SpeechRecognition` API. Once transcription finishes, the text is routed to the `dracarys-70b` model to format the chaotic speech into structured Meeting Minutes, Action Items, or a Clean Summary.
2. **AI Book Summarizer:** Utilizes the `meta/llama-3.1-8b-instruct` model with an expanded 100,000+ character context window. This allows entire books and lengthy PDFs to be uploaded and processed in a single chunk, providing accurate chapter-by-chapter breakdowns.
3. **AI Essay Summarizer:** Instantaneous summarization using LLaMA 8B. Includes custom UI logic to natively render markdown (`**bold**`) without exposing raw markdown syntax to the end-user.
4. **AI Translator:** Extremely fast contextual translation bypassing generic translation limitations by using LLaMA's conversational capabilities.

---

## 🌐 Deployment & Hosting Information

### Does this project contain a Backend?
**No.** Zylarium is a **Single Page Application (SPA)**. It relies on a "Backend-as-a-Service" model. All heavy lifting is either done client-side in the browser (like image processing, OCR, encryption) or by directly communicating with 3rd-party APIs (like NVIDIA NIM) via HTTP fetch requests.

### Will both Frontend and Backend work on Vercel?
If you deploy this project to Vercel exactly as it is right now, **the UI (frontend) will work perfectly, but the AI API calls will fail.**

**Why?**
During local development, `vite.config.ts` acts as a proxy server. When the React app fetches `/nvidia-api/...`, Vite intercepts it and secretly forwards it to `https://integrate.api.nvidia.com/...` to bypass browser CORS (Cross-Origin Resource Sharing) security policies. 

When you host on Vercel, Vite is only used to *build* the static files; the Vite development server doesn't run in production. Therefore, requests to `/nvidia-api` will return a `404 Not Found`.

**How to fix this for Vercel:**
To make the API calls work on Vercel, you need to create a `vercel.json` file in the root directory to recreate the proxy:

```json
{
  "rewrites": [
    {
      "source": "/nvidia-api/:path*",
      "destination": "https://integrate.api.nvidia.com/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
*(The second rule ensures React Router works correctly on page refreshes).*

---

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```
   *Note: This automatically spins up the Vite proxy required for AI functionalities.*

3. **Build for Production:**
   ```bash
   npm run build
   ```
