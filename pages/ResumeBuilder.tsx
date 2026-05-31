// @ts-nocheck
import React, { useEffect } from 'react';
import EditorPanel from '../components/resume/editor/EditorPanel';
import ResumePreview from '../components/resume/preview/ResumePreview';
import ATSPanel from '../components/resume/ats/ATSPanel';
import { useResumeStore } from '../store/useResumeStore';
import { Download, FileText, Share2 } from 'lucide-react';
import { ComingSoon } from '../components/CommonUI';

const ResumeBuilder: React.FC = () => {
  // Hydrate store on mount if needed, handled by persist middleware mostly
  const { resume } = useResumeStore();

  return <ComingSoon title="Resume Builder" />;
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-transparent overflow-hidden relative">
      {/* Background blobs for liquid glass effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-primary-500/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-secondary-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-indigo-500/15 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Bar - Liquid Glass */}
      <header className="h-16 bg-white/10 backdrop-blur-2xl border-b border-white/20 flex items-center justify-between px-6 z-10 shrink-0 shadow-lg shadow-black/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-lg shadow-primary-500/30 ring-2 ring-white/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight font-heading text-lg">Untitled <span className="font-signature text-xl text-primary-300">Resume</span></h1>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">ATS <span className="font-signature text-sm text-cyan-300">Optimized</span> Mode</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/20 transition-all">
            Templates
          </button>
          <button className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white rounded-xl shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-all ring-2 ring-white/10">
            <Download className="w-4 h-4" /> <span className="font-signature">Export</span> PDF
          </button>
        </div>
      </header>

      {/* 3-Pane Layout - All Liquid Glass */}
      <div className="flex-1 flex overflow-hidden gap-1 p-1">
        {/* Left: Editor Panel */}
        <div className="w-[350px] md:w-[400px] shrink-0 h-full z-10">
          <div className="h-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl shadow-xl overflow-hidden">
            <EditorPanel />
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 h-full overflow-hidden relative">
          <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg overflow-hidden">
            <ResumePreview />
          </div>
        </div>

        {/* Right: ATS Panel */}
        <div className="w-[300px] md:w-[350px] shrink-0 h-full z-10">
          <div className="h-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl shadow-xl overflow-hidden">
            <ATSPanel />
          </div>
        </div>
      </div>

      {/* Mobile Warning Overlay - Liquid Glass */}
      <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-2xl max-w-sm border border-white/20 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2 font-heading text-white"><span className="font-signature text-2xl text-primary-300">Desktop</span> Required</h3>
          <p className="text-gray-400">The ATS Resume Builder requires a larger screen for split-view editing and preview.</p>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;