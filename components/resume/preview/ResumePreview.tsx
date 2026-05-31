import React from 'react';
import { useResumeStore } from '../../../store/useResumeStore';

const ResumePreview: React.FC = () => {
    const { resume } = useResumeStore();
    const { header, summary, experience, education, skills } = resume;

    return (
        <div className="h-full bg-transparent p-8 flex justify-center overflow-y-auto pt-12 pb-32">
            {/* Resume paper with subtle glass frame */}
            <div className="relative">
                {/* Outer glass frame */}
                <div className="absolute -inset-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"></div>

                {/* Actual Resume - Pure white for printing */}
                <div className="relative w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl p-[25mm] origin-top transform scale-75 md:scale-90 lg:scale-100 transition-transform duration-300 selection:bg-yellow-200 selection:text-black">

                    {/* Header */}
                    <header className="border-b-2 border-gray-900 pb-4 mb-4">
                        <h1 className="text-4xl font-bold uppercase tracking-wide mb-2 text-gray-900 leading-none">
                            {header.fullName || 'YOUR NAME'}
                        </h1>
                        <div className="text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-1 font-medium mt-3">
                            {header.email && <span>{header.email}</span>}
                            {header.phone && <span>• {header.phone}</span>}
                            {header.city && <span>• {header.city}, {header.country}</span>}
                            {header.linkedin && <span>• {header.linkedin.replace(/^https?:\/\//, '')}</span>}
                            {header.github && <span>• {header.github.replace(/^https?:\/\//, '')}</span>}
                        </div>
                    </header>

                    {/* Summary */}
                    {summary && (
                        <section className="mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Professional Summary</h2>
                            <p className="text-[10pt] leading-relaxed text-gray-800 text-justify">
                                {summary}
                            </p>
                        </section>
                    )}

                    {/* Experience */}
                    {experience.length > 0 && (
                        <section className="mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">Experience</h2>
                            <div className="space-y-4">
                                {experience.map(exp => (
                                    <div key={exp.id}>
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className="font-bold text-[11pt] text-gray-900">{exp.role}</h3>
                                            <span className="text-[10pt] font-medium text-gray-600 whitespace-nowrap">
                                                {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-baseline mb-1.5">
                                            <span className="text-[10pt] font-semibold text-gray-700 italic">{exp.company}</span>
                                            <span className="text-[9pt] text-gray-500">{exp.location}</span>
                                        </div>
                                        <ul className="list-disc list-outside ml-4 space-y-1">
                                            {exp.bullets.map(bullet => (
                                                <li key={bullet.id} className="text-[10pt] leading-snug text-gray-800 pl-1">
                                                    {bullet.text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                        <section className="mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">Education</h2>
                            <div className="space-y-3">
                                {education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className="font-bold text-[11pt] text-gray-900">{edu.school}</h3>
                                            <span className="text-[10pt] font-medium text-gray-600">{edu.year}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[10pt] text-gray-800">{edu.degree}</span>
                                            <span className="text-[9pt] text-gray-500">{edu.location}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-200 pb-1">Technical Skills</h2>
                            <div className="text-[10pt] leading-relaxed text-gray-800">
                                <span className="font-bold">Core Competencies: </span>
                                {skills.map(s => s.name).join(', ')}.
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ResumePreview;
