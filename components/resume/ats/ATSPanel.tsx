import React from 'react';
import { useResumeStore } from '../../../store/useResumeStore';
import { AlertCircle, CheckCircle, Trophy } from 'lucide-react';

const ATSPanel: React.FC = () => {
    const { resume } = useResumeStore();
    const { ats } = resume;

    // Determine score color for liquid glass
    const getScoreStyles = (score: number) => {
        if (score >= 90) return { ring: 'ring-green-400/50', bg: 'bg-green-500/20', text: 'text-green-400' };
        if (score >= 70) return { ring: 'ring-blue-400/50', bg: 'bg-blue-500/20', text: 'text-blue-400' };
        if (score >= 50) return { ring: 'ring-orange-400/50', bg: 'bg-orange-500/20', text: 'text-orange-400' };
        return { ring: 'ring-red-400/50', bg: 'bg-red-500/20', text: 'text-red-400' };
    };

    const scoreStyles = getScoreStyles(ats?.totalScore || 0);

    return (
        <div className="h-full overflow-y-auto p-6 bg-transparent">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white font-heading">
                <Trophy className="w-6 h-6 text-yellow-400" />
                ATS <span className="font-signature text-2xl text-yellow-300">Score</span>
            </h2>

            {/* Score Ring - Liquid Glass */}
            <div className="flex justify-center mb-8">
                <div className={`relative w-40 h-40 flex flex-col items-center justify-center rounded-full ring-8 ${scoreStyles.ring} ${scoreStyles.bg} backdrop-blur-xl`}>
                    <span className={`text-5xl font-bold ${scoreStyles.text} font-heading`}>{ats?.totalScore || 0}</span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1 font-signature">/ 100</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
                    <span className="block text-2xl font-bold text-white font-heading">{Math.round(ats?.parsingScore || 0)}</span>
                    <span className="text-[10px] uppercase text-gray-400 font-bold font-signature">Parsing</span>
                </div>
                <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
                    <span className="block text-2xl font-bold text-white font-heading">{Math.round(ats?.structureScore || 0)}</span>
                    <span className="text-[10px] uppercase text-gray-400 font-bold font-signature">Structure</span>
                </div>
            </div>

            <div className="space-y-4">
                {ats?.warnings.length > 0 && (
                    <div className="p-4 bg-red-500/10 backdrop-blur-md rounded-xl border border-red-500/20 animate-in slide-in-from-right-4">
                        <h4 className="font-semibold text-red-400 flex items-center gap-2 mb-2 font-heading">
                            <AlertCircle className="w-4 h-4" /> Critical <span className="font-signature">Issues</span>
                        </h4>
                        <ul className="list-disc list-outside ml-4 text-xs text-red-300/80 space-y-2">
                            {ats.warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                    </div>
                )}

                {ats?.tips.length > 0 && (
                    <div className="p-4 bg-blue-500/10 backdrop-blur-md rounded-xl border border-blue-500/20">
                        <h4 className="font-semibold text-blue-400 flex items-center gap-2 mb-2 font-heading">
                            <CheckCircle className="w-4 h-4" /> Optimization <span className="font-signature">Tips</span>
                        </h4>
                        <ul className="list-disc list-outside ml-4 text-xs text-blue-300/80 space-y-2">
                            {ats.tips.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                    </div>
                )}

                {ats?.warnings.length === 0 && (
                    <div className="p-4 bg-green-500/10 backdrop-blur-md rounded-xl border border-green-500/20 text-center animate-pulse">
                        <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-green-400 font-bold font-heading">ATS <span className="font-signature">Optimized!</span></p>
                        <p className="text-xs text-green-500/80">Ready for export.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ATSPanel;
