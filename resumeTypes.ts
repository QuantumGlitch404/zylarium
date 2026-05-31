export type ResumeID = string;
export type TemplateID = 'modern' | 'classic' | 'minimal' | 'technical';

export interface ATSMetadata {
    parsingScore: number; // 0-100
    keywordScore: number; // 0-100
    structureScore: number; // 0-100
    formattingScore: number; // 0-100
    totalScore: number; // 0-100
    warnings: string[];
    tips: string[];
}

export interface BulletPoint {
    id: string;
    text: string;
    actionVerb: string | null; // Detected verb
    hasMetric: boolean; // Detected number/%/$
    isStrong: boolean; // Based on length and metrics
}

export interface HeaderInfo {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
}

export interface ExperienceItem {
    id: string;
    role: string;
    company: string;
    location: string; // ATS needs this
    startDate: string; // YYYY-MM
    endDate: string; // YYYY-MM or 'Present'
    isCurrent: boolean;
    bullets: BulletPoint[];
}

export interface EducationItem {
    id: string;
    degree: string;
    school: string;
    location: string;
    year: string; // Graduation year
    gpa?: string;
}

export interface SkillItem {
    id: string;
    name: string;
    category: 'technical' | 'soft' | 'tool' | 'language';
    level: number; // 1-5 (Internal usage, maybe hidden from ATS output)
}

export interface ProjectItem {
    id: string;
    name: string;
    techStack: string[];
    link?: string;
    description: string; // Plain text or bullets
}

export interface ResumeRoot {
    id: ResumeID;
    title: string; // "Software Engineer Resume"
    targetRole: string; // For keywords (e.g. "Frontend Dev")
    createdAt: number;
    updatedAt: number;

    // Sections
    header: HeaderInfo;
    summary: string;
    experience: ExperienceItem[];
    education: EducationItem[];
    skills: SkillItem[];
    projects: ProjectItem[];

    // ATS
    ats: ATSMetadata;
    keywords: string[]; // From Job Description

    // Meta
    templateId: TemplateID;
    style: {
        fontFamily: 'Roboto' | 'Open Sans' | 'Merriweather'; // Allowed fonts only
        fontSize: 'small' | 'medium' | 'large';
        lineHeight: 'tight' | 'normal' | 'relaxed';
    };
}

export const INITIAL_ATS_RESUME: ResumeRoot = {
    id: 'default',
    title: 'My Resume',
    targetRole: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),

    header: {
        fullName: '',
        email: '',
        phone: '',
        city: '',
        country: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],

    ats: {
        parsingScore: 0,
        keywordScore: 0,
        structureScore: 100,
        formattingScore: 100,
        totalScore: 0,
        warnings: [],
        tips: [],
    },
    keywords: [],

    templateId: 'modern',
    style: {
        fontFamily: 'Roboto',
        fontSize: 'medium',
        lineHeight: 'normal',
    },
};
