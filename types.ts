export interface NavItem {
  label: string;
  path: string;
  icon?: any;
}

export interface HustleIdea {
  id: number;
  title: string;
  category: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  earningPotential: string;
  earningTier: 'Beginner Tier' | 'Intermediate Tier' | 'Advanced Tier';
  skills: string[];
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  experience: {
    id: string;
    role: string;
    company: string;
    years: string;
    details: string;
  }[];
  education: {
    id: string;
    degree: string;
    school: string;
    year: string;
  }[];
  skills: string[];
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  title: string;
}

export type Platform = 'home' | 'unitoolbox' | 'hustlefinder' | 'resume' | 'finance';