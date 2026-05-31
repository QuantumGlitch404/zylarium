import { HustleIdea } from './types';

export const HUSTLE_DATA: HustleIdea[] = [
  { id: 1, title: "Freelance Writer", category: "Content", difficulty: "Beginner", earningPotential: "$500 - $3000/mo", skills: ["Writing", "SEO", "Research"], description: "Write articles, blogs, and marketing copy for clients." },
  { id: 2, title: "Web Developer", category: "Tech", difficulty: "Advanced", earningPotential: "$2000 - $10000/mo", skills: ["HTML", "CSS", "JS", "React"], description: "Build and maintain websites and web applications." },
  { id: 3, title: "Virtual Assistant", category: "Admin", difficulty: "Beginner", earningPotential: "$15 - $30/hr", skills: ["Organization", "Email", "Scheduling"], description: "Provide administrative and technical assistance remotely." },
  { id: 4, title: "Graphic Designer", category: "Creative", difficulty: "Intermediate", earningPotential: "$1000 - $5000/mo", skills: ["Canva", "Photoshop", "Creativity"], description: "Create visual content for print and digital media." },
  { id: 5, title: "Online Tutor", category: "Education", difficulty: "Intermediate", earningPotential: "$20 - $60/hr", skills: ["Teaching", "Subject Expertise"], description: "Teach students in academic subjects or skills online." },
  { id: 6, title: "Dropshipping", category: "E-commerce", difficulty: "Intermediate", earningPotential: "$500 - $5000+/mo", skills: ["Marketing", "Shopify", "Analysis"], description: "Sell products online without holding inventory." },
  { id: 7, title: "Stock Photography", category: "Creative", difficulty: "Beginner", earningPotential: "$100 - $1000/mo", skills: ["Photography", "Editing"], description: "Take and sell photos for commercial use." },
  { id: 8, title: "User Testing", category: "Tech", difficulty: "Beginner", earningPotential: "$10 - $60/test", skills: ["Observation", "Communication"], description: "Test websites and apps to improve user experience." },
  { id: 9, title: "Social Media Manager", category: "Marketing", difficulty: "Intermediate", earningPotential: "$1000 - $4000/mo", skills: ["Social Media", "Strategy", "Copywriting"], description: "Manage and grow social media presence for brands." },
  { id: 10, title: "Voice Over Artist", category: "Creative", difficulty: "Intermediate", earningPotential: "$100 - $500/project", skills: ["Voice Acting", "Audio Editing"], description: "Provide voice work for commercials, audiobooks, etc." },
  { id: 11, title: "Affiliate Marketing", category: "Marketing", difficulty: "Intermediate", earningPotential: "$500 - $10000/mo", skills: ["Content Creation", "SEO"], description: "Promote other companies' products for a commission." },
  { id: 12, title: "No-Code Builder", category: "Tech", difficulty: "Intermediate", earningPotential: "$50 - $150/hr", skills: ["Bubble", "Webflow", "Logic"], description: "Build software solutions using no-code platforms." },
];

export const RESUME_INITIAL_STATE = {
  fullName: "John Doe",
  email: "john@example.com",
  phone: "(555) 123-4567",
  summary: "Motivated professional with a strong background in...",
  experience: [
    { id: '1', role: "Software Engineer", company: "Tech Corp", years: "2020-Present", details: "Developed scalable web apps." }
  ],
  education: [
    { id: '1', degree: "B.S. Computer Science", school: "State University", year: "2019" }
  ],
  skills: ["JavaScript", "React", "Teamwork"]
};