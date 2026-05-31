import React, { useState } from 'react';
import { useResumeStore } from '../../../../store/useResumeStore';
import { GraduationCap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const EducationForm: React.FC = () => {
    const { resume, addEducation, updateEducation, removeEducation } = useResumeStore();
    const { education } = resume;
    const [expandedId, setExpandedId] = useState<string | null>(education[0]?.id || null);

    const inputClass = "w-full * p-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/10 transition-all";

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden mt-6">
            <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 text-white font-heading">
                    <GraduationCap className="w-4 h-4 text-primary-400" /> <span className="font-signature text-base text-cyan-300">Education</span>
                </h3>
                <button
                    onClick={addEducation}
                    className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-primary-400"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {education.map(edu => (
                    <div key={edu.id} className="border border-white/10 rounded-xl p-4 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    value={edu.school}
                                    onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                    placeholder="University / School"
                                    className={inputClass + " font-semibold"}
                                />
                                <input
                                    value={edu.degree}
                                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                    placeholder="Degree (e.g. BS Computer Science)"
                                    className={inputClass}
                                />
                            </div>
                            <button
                                onClick={() => removeEducation(edu.id)}
                                className="ml-2 text-gray-400 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                value={edu.location}
                                onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                                placeholder="City, Country"
                                className={inputClass}
                            />
                            <input
                                type="text"
                                value={edu.year}
                                onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                                placeholder="Year of Graduation"
                                className={inputClass}
                            />
                        </div>
                    </div>
                ))}

                {education.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No education listed. Click <span className="text-primary-400">+</span> to add.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EducationForm;
