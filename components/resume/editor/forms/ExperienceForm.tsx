import React, { useState } from 'react';
import { useResumeStore } from '../../../../store/useResumeStore';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const ExperienceForm: React.FC = () => {
    const { resume, addExperience, updateExperience, removeExperience, addBullet, updateBullet, removeBullet } = useResumeStore();
    const [expandedId, setExpandedId] = useState<string | null>(resume.experience[0]?.id || null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const inputClass = "w-full p-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/10 transition-all";
    const labelClass = "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block";

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-white font-heading"><span className="font-signature text-lg text-cyan-300">Experience</span></h3>
                <button
                    onClick={addExperience}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-xl transition-all font-medium backdrop-blur-md border border-primary-500/30"
                >
                    <Plus className="w-3 h-3" /> Add Job
                </button>
            </div>

            {resume.experience.map((exp, index) => (
                <div key={exp.id} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden transition-all">
                    {/* Header / Summary of Item */}
                    <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => toggleExpand(exp.id)}
                    >
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-white">{exp.role || '(No Role)'}</span>
                            <span className="text-xs text-gray-400">{exp.company || '(No Company)'} • {exp.startDate || 'Date'} - {exp.endDate || 'Date'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); removeExperience(exp.id); }}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {expandedId === exp.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedId === exp.id && (
                        <div className="p-4 border-t border-white/10 bg-white/5 space-y-4 animate-in slide-in-from-top-2 duration-200">

                            {/* Role & Company */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Job Title</label>
                                    <input
                                        value={exp.role}
                                        onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                                        className={inputClass}
                                        placeholder="Senior Engineer"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Company</label>
                                    <input
                                        value={exp.company}
                                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                        className={inputClass}
                                        placeholder="Google Inc."
                                    />
                                </div>
                            </div>

                            {/* Dates & Location */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelClass}>Start Date</label>
                                    <input
                                        type="month"
                                        value={exp.startDate}
                                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                        className={inputClass + " icon-none"}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>End Date</label>
                                    <input
                                        type="month"
                                        disabled={exp.isCurrent}
                                        value={exp.endDate}
                                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                        className={inputClass + " disabled:opacity-50"}
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={exp.isCurrent}
                                            onChange={(e) => updateExperience(exp.id, 'isCurrent', e.target.checked)}
                                            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 bg-white/10 border-white/20"
                                        />
                                        <span className="text-sm text-gray-300 font-medium">I Work Here</span>
                                    </label>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className={labelClass}>Location</label>
                                <input
                                    value={exp.location}
                                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                                    className={inputClass}
                                    placeholder="City, Country (e.g. San Francisco, CA)"
                                />
                            </div>

                            {/* Bullet Points Section - The Core */}
                            <div className="pt-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block flex justify-between">
                                    Achievements (Bullets)
                                    <span className="text-primary-400 cursor-pointer hover:text-primary-300 transition-colors font-signature" onClick={() => addBullet(exp.id, '')}>+ Add Bullet</span>
                                </label>
                                <div className="space-y-3">
                                    {exp.bullets.map(bullet => (
                                        <div key={bullet.id} className="group relative">
                                            <div className="flex gap-2">
                                                <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                                                <textarea
                                                    value={bullet.text}
                                                    onChange={(e) => updateBullet(exp.id, bullet.id, e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white placeholder-gray-500 h-20 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                                                    placeholder="Started with a strong action verb..."
                                                />
                                                <button
                                                    onClick={() => removeBullet(exp.id, bullet.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all self-center"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {/* Real-time Analysis */}
                                            {bullet.text.length > 5 && (
                                                <div className="ml-4 mt-1 flex gap-2">
                                                    {!bullet.actionVerb && <span className="text-[10px] text-red-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> Start with verb</span>}
                                                    {!bullet.hasMetric && <span className="text-[10px] text-orange-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> Add numbers</span>}
                                                    {bullet.text.length < 20 && <span className="text-[10px] text-yellow-400">Too short</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {exp.bullets.length === 0 && (
                                    <button
                                        onClick={() => addBullet(exp.id, '')}
                                        className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-sm text-gray-500 hover:border-primary-500/30 hover:text-primary-400 transition-all backdrop-blur-md"
                                    >
                                        Add Achievement Bullet
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ExperienceForm;
