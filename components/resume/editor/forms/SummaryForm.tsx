import React, { useEffect, useState } from 'react';
import { useResumeStore } from '../../../../store/useResumeStore';
import { FileText, Wand2, AlertTriangle, Check } from 'lucide-react';

const SummaryForm: React.FC = () => {
    const { resume, updateSummary } = useResumeStore();
    const { summary } = resume;
    const [wordCount, setWordCount] = useState(0);

    useEffect(() => {
        setWordCount(summary.split(/\s+/).filter(w => w.length > 0).length);
    }, [summary]);

    // ATS Rules for Summary
    const isTooShort = wordCount < 30;
    const isTooLong = wordCount > 100;
    const hasFirstPerson = /\b(I|me|my)\b/i.test(summary);

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden mt-6">
            <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 text-white font-heading">
                    <FileText className="w-4 h-4 text-primary-400" /> Professional <span className="font-signature text-base text-cyan-300">Summary</span>
                </h3>
            </div>

            <div className="p-4 space-y-3">
                <textarea
                    value={summary}
                    onChange={(e) => updateSummary(e.target.value)}
                    className="w-full h-32 p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/10 transition-all leading-relaxed"
                    placeholder="Experienced [Role] with [Number] years of experience in..."
                />

                <div className="flex items-start gap-4">
                    <span className={`text-xs font-semibold ${isTooShort || isTooLong ? 'text-red-400' : 'text-green-400'}`}>
                        {wordCount} / 50-80 words recommended
                    </span>

                    {hasFirstPerson && (
                        <span className="text-xs text-orange-400 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3 h-3" /> Avoid first person ("I", "my")
                        </span>
                    )}
                </div>

                <div className="p-3 bg-blue-500/10 backdrop-blur-md rounded-xl border border-blue-500/20 text-xs text-blue-300">
                    <strong className="font-signature">ATS Tip:</strong> Use your target job title in the first sentence. Include 2-3 hard skills.
                </div>
            </div>
        </div>
    );
};

export default SummaryForm;
