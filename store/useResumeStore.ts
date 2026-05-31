import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ResumeRoot, INITIAL_ATS_RESUME, ExperienceItem, BulletPoint, SkillItem, EducationItem, ProjectItem, ATSMetadata } from '../resumeTypes';
import { calculateATSScore } from '../utils/ats';
import { v4 as uuidv4 } from 'uuid';

interface ResumeState {
    resume: ResumeRoot;

    // Actions
    updateHeader: (field: keyof ResumeRoot['header'], value: string) => void;
    updateSummary: (summary: string) => void;

    // Experience
    addExperience: () => void;
    updateExperience: (id: string, field: keyof ExperienceItem, value: any) => void;
    removeExperience: (id: string) => void;

    // Bullets
    addBullet: (expId: string, text: string) => void;
    updateBullet: (expId: string, bulletId: string, text: string) => void; // Will trigger ATS analysis
    removeBullet: (expId: string, bulletId: string) => void;

    // Education
    addEducation: () => void;
    updateEducation: (id: string, field: keyof EducationItem, value: any) => void;
    removeEducation: (id: string) => void;

    // Skills
    addSkill: (name: string) => void;
    removeSkill: (id: string) => void;

    // Projects
    addProject: () => void;
    updateProject: (id: string, field: keyof ProjectItem, value: any) => void;
    removeProject: (id: string) => void;

    // ATS / Meta
    setTemplate: (id: ResumeRoot['templateId']) => void;
    calculateScore: () => void;
}

export const useResumeStore = create<ResumeState>()(
    persist(
        (set, get) => ({
            resume: INITIAL_ATS_RESUME,

            updateHeader: (field, value) => {
                set((state) => ({
                    resume: { ...state.resume, header: { ...state.resume.header, [field]: value } }
                }));
                get().calculateScore();
            },

            updateSummary: (summary) => {
                set((state) => ({
                    resume: { ...state.resume, summary }
                }));
                get().calculateScore();
            },

            // Experience
            addExperience: () => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        experience: [
                            ...state.resume.experience,
                            {
                                id: uuidv4(),
                                role: '',
                                company: '',
                                location: '',
                                startDate: '',
                                endDate: '',
                                isCurrent: false,
                                bullets: []
                            }
                        ]
                    }
                }));
                get().calculateScore();
            },

            updateExperience: (id, field, value) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        experience: state.resume.experience.map(exp =>
                            exp.id === id ? { ...exp, [field]: value } : exp
                        )
                    }
                }));
                get().calculateScore();
            },

            removeExperience: (id) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        experience: state.resume.experience.filter(e => e.id !== id)
                    }
                }));
                get().calculateScore();
            },

            // Bullets
            addBullet: (expId, text) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        experience: state.resume.experience.map(exp => {
                            if (exp.id === expId) {
                                return {
                                    ...exp,
                                    bullets: [...exp.bullets, {
                                        id: uuidv4(),
                                        text,
                                        actionVerb: null,
                                        hasMetric: false,
                                        isStrong: false
                                    }]
                                };
                            }
                            return exp;
                        })
                    }
                }));
                get().calculateScore();
            },

            updateBullet: (expId, bulletId, text) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        experience: state.resume.experience.map(exp => {
                            if (exp.id === expId) {
                                return {
                                    ...exp,
                                    bullets: exp.bullets.map(b => b.id === bulletId ? { ...b, text } : b)
                                }
                            }
                            return exp;
                        })
                    }
                }));
                get().calculateScore();
            },

            removeBullet: (expId, bulletId) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        experience: state.resume.experience.map(exp => {
                            if (exp.id === expId) {
                                return {
                                    ...exp,
                                    bullets: exp.bullets.filter(b => b.id !== bulletId)
                                }
                            }
                            return exp;
                        })
                    }
                }));
                get().calculateScore();
            },

            // Education
            addEducation: () => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        education: [...state.resume.education, {
                            id: uuidv4(),
                            degree: '',
                            school: '',
                            location: '',
                            year: ''
                        }]
                    }
                }));
                get().calculateScore();
            },

            updateEducation: (id, field, value) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        education: state.resume.education.map(edu =>
                            edu.id === id ? { ...edu, [field]: value } : edu
                        )
                    }
                }));
                get().calculateScore();
            },

            removeEducation: (id) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        education: state.resume.education.filter(e => e.id !== id)
                    }
                }));
                get().calculateScore();
            },

            // Skills
            addSkill: (name) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        skills: [...state.resume.skills, {
                            id: uuidv4(),
                            name,
                            category: 'technical',
                            level: 3
                        }]
                    }
                }));
                get().calculateScore();
            },

            removeSkill: (id) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        skills: state.resume.skills.filter(s => s.id !== id)
                    }
                }));
                get().calculateScore();
            },

            // Projects
            addProject: () => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        projects: [...state.resume.projects, {
                            id: uuidv4(),
                            name: '',
                            description: '',
                            techStack: []
                        }]
                    }
                }));
                get().calculateScore();
            },

            updateProject: (id, field, value) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        projects: state.resume.projects.map(p =>
                            p.id === id ? { ...p, [field]: value } : p
                        )
                    }
                }));
                get().calculateScore();
            },

            removeProject: (id) => {
                set((state) => ({
                    resume: {
                        ...state.resume,
                        projects: state.resume.projects.filter(p => p.id !== id)
                    }
                }));
                get().calculateScore();
            },

            setTemplate: (id) => set((state) => ({
                resume: { ...state.resume, templateId: id }
            })),

            calculateScore: () => set((state) => {
                const atsResult = calculateATSScore(state.resume);
                return {
                    resume: {
                        ...state.resume,
                        ats: atsResult
                    }
                };
            })

        }),
        {
            name: 'pro_ats_resume_v2',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.calculateScore();
            }
        }
    )
);
