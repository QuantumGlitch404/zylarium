import { HustleIdea } from '../types';

// Extended Hustle Data with rich content
export interface HustleDetailContent {
    aboutSection: string;
    stepsToStart: { step: number; title: string; description: string }[];
    proofOfSuccess: { title: string; source: string; link: string; description: string }[];
    tipsForSuccess: string[];
    whatToLearn: { skill: string; description: string; priority: 'Essential' | 'Recommended' | 'Optional' }[];
    keyInfo: {
        earningPotential: string;
        timeRequired: string;
        toolsAndPlatforms: string[];
        difficultyLevel: string;
    };
    testimonials: { name: string; avatar: string; rating: number; review: string; date: string; location: string }[];
    faqs: { question: string; answer: string }[];
    tags: string[];
    heroImage: string;
}

// Testimonial name pools
const FIRST_NAMES = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Christopher', 'Amanda', 'Matthew', 'Ashley', 'Daniel', 'Jennifer', 'Andrew', 'Stephanie', 'Joshua', 'Nicole', 'Ryan', 'Melissa', 'Brandon', 'Rebecca', 'Kevin', 'Laura', 'Brian', 'Michelle', 'Justin', 'Kimberly', 'Robert', 'Elizabeth', 'William', 'Heather', 'Anthony', 'Rachel', 'Jonathan', 'Samantha', 'Tyler', 'Katherine', 'Eric', 'Angela', 'Adam', 'Brittany', 'Steven', 'Megan', 'Timothy', 'Hannah', 'Richard', 'Victoria', 'Jeffrey', 'Alexis', 'Thomas', 'Grace', 'Marcus', 'Natalie', 'Patrick', 'Olivia', 'Sean', 'Alyssa', 'Jeremy', 'Christina', 'Aaron', 'Lauren'];

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const LOCATIONS = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC', 'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Nashville, TN', 'Portland, OR', 'Las Vegas, NV', 'Detroit, MI', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD', 'Milwaukee, WI', 'Albuquerque, NM', 'Tucson, AZ', 'London, UK', 'Toronto, Canada', 'Sydney, Australia', 'Berlin, Germany', 'Dubai, UAE', 'Singapore', 'Tokyo, Japan', 'Mumbai, India', 'Paris, France', 'Amsterdam, Netherlands'];

const POSITIVE_PHRASES = [
    'This changed my life completely.',
    'I was skeptical at first, but the results speak for themselves.',
    'Best decision I ever made for my career.',
    'The flexibility is unmatched.',
    'I replaced my full-time income within months.',
    'Started as a side hustle, now it\'s my main income.',
    'The learning curve was worth every minute.',
    'I wish I had started this sooner.',
    'Perfect for anyone looking for financial freedom.',
    'The community support is incredible.',
    'My only regret is not starting earlier.',
    'This gave me the work-life balance I always wanted.',
    'Genuine opportunity that actually delivers.',
    'Exceeded all my expectations.',
    'Finally found something that works for me.',
    'The income potential is real and achievable.',
    'Transformed my financial situation entirely.',
    'Highly recommend to anyone serious about earning.',
    'The skills I learned are invaluable.',
    'This opened doors I never knew existed.'
];

const REVIEW_TEMPLATES = [
    "I started {hustle} about {months} months ago and I'm now earning {earning}. {phrase} The key was staying consistent and following the proven methods. Would definitely recommend to anyone looking to build a sustainable income stream.",
    "After {months} months of doing {hustle}, I can confidently say this is legitimate. {phrase} The initial investment of time was significant, but the returns have been more than worth it. Currently making {earning} per month on average.",
    "Was looking for ways to supplement my income and discovered {hustle}. {phrase} Now I'm earning {earning} monthly while working from home. The flexibility to set my own schedule is priceless.",
    "{phrase} I've been doing {hustle} for {months} months now. Started with zero experience and now I'm making {earning}. The learning resources available made all the difference.",
    "Took the leap into {hustle} and never looked back. {phrase} Currently at {earning} per month and still growing. The scalability of this opportunity is what makes it special.",
    "As someone who was skeptical about side hustles, {hustle} proved me wrong. {phrase} {months} months in and I'm earning {earning}. Real results from real effort.",
    "The journey with {hustle} has been incredible. {phrase} From knowing nothing to earning {earning} in {months} months. Patience and persistence are key.",
    "{hustle} has given me financial freedom I never thought possible. {phrase} Earning {earning} now after {months} months of dedicated work. Highly recommend for anyone serious about changing their financial situation.",
    "Started {hustle} as a complete beginner. {phrase} Now {months} months later, I'm bringing in {earning} per month. The support and resources available are top-notch.",
    "If you're on the fence about {hustle}, just do it. {phrase} I'm now at {earning} monthly after {months} months. Best career decision I've made."
];

const FAQ_TEMPLATES = [
    { q: "How much money can I realistically make with {hustle}?", a: "Earnings vary significantly based on experience, time invested, and market conditions. Beginners typically start at {low_earning}, while experienced professionals can earn {high_earning}. Consistency and skill development are key factors in reaching higher income levels." },
    { q: "How long does it take to start earning with {hustle}?", a: "Most people see their first earnings within 2-4 weeks of starting, though significant income usually takes 3-6 months of consistent effort. The timeline depends on your existing skills, time commitment, and how quickly you can establish yourself in the market." },
    { q: "Do I need any special qualifications or degrees?", a: "No formal qualifications are required to start. However, developing relevant skills through online courses, certifications, and practical experience will significantly increase your earning potential and credibility with clients." },
    { q: "What are the startup costs for {hustle}?", a: "Initial costs are typically minimal - usually between $0-500 for basic tools and resources. Many successful practitioners started with just a computer and internet connection. As you scale, you may invest in premium tools and courses." },
    { q: "Can I do {hustle} part-time while working a full-time job?", a: "Absolutely. Many successful practitioners started part-time, dedicating 10-20 hours per week alongside their regular employment. The flexibility allows you to build income gradually before transitioning to full-time if desired." },
    { q: "What are the most important skills I need to develop?", a: "Key skills include {skills}. Additionally, communication, time management, and self-discipline are crucial for success. Most skills can be learned through online resources and practice." },
    { q: "How do I find my first clients or customers?", a: "Start by leveraging freelance platforms, social media, and your personal network. Building a portfolio with sample work or offering initial discounts can help attract your first clients. Referrals become increasingly important as you establish yourself." },
    { q: "What tools and software do I need?", a: "Essential tools include {tools}. Start with free or basic versions and upgrade as your income grows. Many successful practitioners use a combination of industry-standard and budget-friendly alternatives." },
    { q: "How competitive is the market for {hustle}?", a: "While the market is competitive, there's substantial demand for quality work. Success comes from specializing in a niche, delivering exceptional value, and building long-term client relationships rather than competing solely on price." },
    { q: "What are the biggest challenges I should expect?", a: "Common challenges include inconsistent income initially, client acquisition, time management, and staying motivated during slow periods. Building systems and routines, along with continuous skill development, helps overcome these obstacles." },
    { q: "How do I scale my {hustle} income over time?", a: "Scaling strategies include raising rates as you gain experience, specializing in higher-value services, building recurring revenue streams, outsourcing tasks, and creating passive income products like courses or templates." },
    { q: "Is {hustle} sustainable as a long-term career?", a: "Yes, with the right approach. The key is continuous learning, adapting to market changes, building a strong reputation, and diversifying your income streams. Many practitioners have built decade-long careers in this field." },
    { q: "What mistakes should I avoid when starting?", a: "Common mistakes include underpricing services, taking on too many projects, neglecting skill development, poor client communication, and not setting boundaries. Learning from others' experiences can help you avoid these pitfalls." },
    { q: "How do I handle taxes and legal requirements?", a: "Consult with a tax professional familiar with self-employment. Generally, you'll need to track income and expenses, make quarterly estimated tax payments, and potentially register as a business entity depending on your location and income level." },
    { q: "Where can I learn more and connect with others doing {hustle}?", a: "Join online communities on Reddit, Facebook Groups, Discord servers, and industry-specific forums. Follow thought leaders on social media, take online courses, and consider finding a mentor who can guide your journey." }
];

// Generate random date within last 2 years
const generateRandomDate = (): string => {
    const now = new Date();
    const past = new Date(now.getTime() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000);
    return past.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Generate testimonials for a hustle
const generateTestimonials = (hustle: HustleIdea, count: number): HustleDetailContent['testimonials'] => {
    const testimonials = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
        let firstName, lastName, fullName;
        do {
            firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            fullName = `${firstName} ${lastName}`;
        } while (usedNames.has(fullName));
        usedNames.add(fullName);

        const template = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
        const phrase = POSITIVE_PHRASES[Math.floor(Math.random() * POSITIVE_PHRASES.length)];
        const months = Math.floor(Math.random() * 18) + 3;
        const earningMultiplier = Math.floor(Math.random() * 5) + 1;
        const baseEarning = hustle.earningTier === 'Beginner Tier' ? 500 : hustle.earningTier === 'Intermediate Tier' ? 2000 : 5000;
        const earning = `$${(baseEarning * earningMultiplier / 2).toLocaleString()}`;

        const review = template
            .replace(/{hustle}/g, hustle.title.toLowerCase())
            .replace(/{months}/g, months.toString())
            .replace(/{earning}/g, earning)
            .replace(/{phrase}/g, phrase);

        testimonials.push({
            name: fullName,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
            rating: Math.random() > 0.1 ? 5 : 4, // 90% 5-star, 10% 4-star
            review,
            date: generateRandomDate(),
            location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
        });
    }

    return testimonials.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate FAQs for a hustle
const generateFAQs = (hustle: HustleIdea, count: number): HustleDetailContent['faqs'] => {
    const faqs = [];
    const selectedTemplates = [...FAQ_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, count);

    for (const template of selectedTemplates) {
        const question = template.q.replace(/{hustle}/g, hustle.title);
        const answer = template.a
            .replace(/{hustle}/g, hustle.title)
            .replace(/{low_earning}/g, hustle.earningTier === 'Beginner Tier' ? '$200-500/month' : hustle.earningTier === 'Intermediate Tier' ? '$500-1500/month' : '$1500-3000/month')
            .replace(/{high_earning}/g, hustle.earningTier === 'Beginner Tier' ? '$1000-2000/month' : hustle.earningTier === 'Intermediate Tier' ? '$3000-6000/month' : '$8000-15000+/month')
            .replace(/{skills}/g, hustle.skills.join(', '))
            .replace(/{tools}/g, getToolsForCategory(hustle.category).slice(0, 3).join(', '));

        faqs.push({ question, answer });
    }

    return faqs;
};

// Get tools based on category
const getToolsForCategory = (category: string): string[] => {
    const toolsMap: Record<string, string[]> = {
        'Content': ['Google Docs', 'Grammarly', 'Hemingway Editor', 'WordPress', 'Medium', 'Notion', 'Canva'],
        'Tech': ['VS Code', 'GitHub', 'Figma', 'Postman', 'Docker', 'AWS', 'Vercel', 'Netlify'],
        'Creative': ['Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Canva', 'Procreate', 'Blender', 'After Effects'],
        'Admin': ['Google Workspace', 'Microsoft 365', 'Slack', 'Trello', 'Asana', 'Calendly', 'Zoom'],
        'Marketing': ['Google Analytics', 'Facebook Ads Manager', 'Mailchimp', 'HubSpot', 'Hootsuite', 'SEMrush', 'Ahrefs'],
        'E-commerce': ['Shopify', 'WooCommerce', 'Amazon Seller Central', 'Oberlo', 'Stripe', 'PayPal', 'Printful'],
        'Education': ['Zoom', 'Teachable', 'Udemy', 'Skillshare', 'Google Classroom', 'Notion', 'Loom'],
        'Finance': ['QuickBooks', 'Xero', 'Excel', 'Mint', 'Wave', 'TurboTax', 'FreshBooks'],
        'Health': ['Calendly', 'Zoom', 'Practice Better', 'MyFitnessPal', 'Canva', 'Teachable'],
        'Legal': ['Clio', 'LawPay', 'DocuSign', 'Google Workspace', 'Westlaw', 'LexisNexis'],
        'Real Estate': ['Zillow', 'Realtor.com', 'MLS', 'Canva', 'Matterport', 'DocuSign', 'CRM Tools'],
        'Consulting': ['Zoom', 'Calendly', 'Notion', 'Miro', 'Loom', 'Google Workspace', 'Slack'],
        'Entertainment': ['YouTube Studio', 'OBS Studio', 'Adobe Premiere', 'Twitch', 'TikTok', 'Instagram'],
        'Food': ['Instagram', 'Pinterest', 'Lightroom', 'Canva', 'ChefTap', 'Notion', 'WordPress'],
        'Travel': ['Google Maps', 'TripAdvisor', 'Booking.com', 'Canva', 'Lightroom', 'WordPress', 'Instagram'],
        'Fitness': ['Trainerize', 'TrueCoach', 'Zoom', 'Instagram', 'YouTube', 'MyFitnessPal', 'Canva'],
        'Photography': ['Adobe Lightroom', 'Adobe Photoshop', 'Capture One', 'Canva', 'SmugMug', 'Instagram'],
        'Music': ['Ableton Live', 'FL Studio', 'Logic Pro', 'Pro Tools', 'Splice', 'DistroKid', 'SoundCloud'],
        'Writing': ['Scrivener', 'Google Docs', 'Grammarly', 'ProWritingAid', 'Notion', 'Medium', 'Substack'],
        'Design': ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Canva', 'Dribbble', 'Behance']
    };
    return toolsMap[category] || ['Google Workspace', 'Notion', 'Slack', 'Zoom', 'Canva'];
};

// Generate about section
const generateAboutSection = (hustle: HustleIdea): string => {
    const intros = [
        `${hustle.title} represents one of the most accessible and rewarding opportunities in the modern digital economy.`,
        `The role of a ${hustle.title} has evolved significantly with the growth of remote work and digital platforms.`,
        `Becoming a ${hustle.title} offers a unique blend of creative fulfillment and financial opportunity.`,
        `${hustle.title} is a profession that combines specialized expertise with the flexibility of independent work.`
    ];

    const bodies = [
        `This opportunity is particularly well-suited for individuals who possess ${hustle.skills.join(', ')} skills and are looking to monetize their expertise. The ${hustle.category} industry continues to experience substantial growth, creating sustained demand for qualified professionals.`,
        `Success in this field requires a combination of technical proficiency and interpersonal skills. The ability to deliver consistent, high-quality work while managing client relationships is essential for long-term success.`,
        `What distinguishes top performers in this space is their commitment to continuous learning and adaptation. The landscape evolves rapidly, and those who stay current with industry trends and best practices maintain a competitive advantage.`
    ];

    const conclusions = [
        `Whether you're seeking a supplementary income stream or planning to transition to full-time independent work, ${hustle.title} offers a viable path to financial independence with relatively low barriers to entry.`,
        `The flexibility to work from anywhere, set your own schedule, and choose your clients makes this an attractive option for those prioritizing work-life balance alongside financial goals.`,
        `With dedication and the right approach, many practitioners have built six-figure businesses in this field, demonstrating the significant earning potential available to those who commit to excellence.`
    ];

    return `${intros[Math.floor(Math.random() * intros.length)]}\n\n${bodies[Math.floor(Math.random() * bodies.length)]}\n\n${conclusions[Math.floor(Math.random() * conclusions.length)]}`;
};

// Generate steps to start
const generateStepsToStart = (hustle: HustleIdea): HustleDetailContent['stepsToStart'] => {
    return [
        {
            step: 1,
            title: "Assess Your Current Skills and Knowledge",
            description: `Before diving in, honestly evaluate your existing proficiency in ${hustle.skills.slice(0, 2).join(' and ')}. Identify specific gaps that need addressing and create a prioritized learning plan. Take stock of any transferable skills from your current or previous work that could accelerate your progress.`
        },
        {
            step: 2,
            title: "Invest in Foundational Education",
            description: `Enroll in reputable courses covering the core competencies required for ${hustle.title}. Focus on practical, project-based learning rather than purely theoretical content. Platforms like Coursera, Udemy, and industry-specific resources offer structured paths from beginner to advanced levels.`
        },
        {
            step: 3,
            title: "Build a Professional Portfolio",
            description: `Create 3-5 high-quality portfolio pieces that demonstrate your capabilities. If you lack client work, develop speculative projects or offer pro-bono services to build your initial body of work. Quality significantly outweighs quantity at this stage.`
        },
        {
            step: 4,
            title: "Establish Your Professional Presence",
            description: `Create profiles on relevant platforms where potential clients seek ${hustle.category} services. Optimize your profiles with compelling descriptions, professional photos, and your best work samples. Consider building a personal website to serve as your central hub.`
        },
        {
            step: 5,
            title: "Set Strategic Pricing",
            description: `Research market rates for ${hustle.title} services at various experience levels. Start competitively to build your reputation and client base, with a clear roadmap for increasing rates as you establish credibility. Consider offering packages alongside hourly rates.`
        },
        {
            step: 6,
            title: "Acquire Your First Clients",
            description: `Begin outreach through multiple channels: respond to job postings, reach out to your network, engage in relevant online communities, and consider offering introductory rates. Focus on delivering exceptional results for early clients to generate testimonials and referrals.`
        },
        {
            step: 7,
            title: "Implement Systems and Processes",
            description: `As you take on clients, establish efficient workflows for communication, project management, invoicing, and delivery. Document your processes to ensure consistency and enable scaling. Invest in tools that reduce administrative burden.`
        },
        {
            step: 8,
            title: "Scale and Optimize Continuously",
            description: `Regularly review your performance, client feedback, and income metrics. Identify opportunities to increase efficiency, raise rates, and expand your service offerings. Consider specializing in a lucrative niche as you gain experience and market insight.`
        }
    ];
};

// Generate proof of success with accurate, real links
const generateProofOfSuccess = (hustle: HustleIdea): HustleDetailContent['proofOfSuccess'] => {
    const hustleQuery = encodeURIComponent(hustle.title);
    const hustleMoneyQuery = encodeURIComponent(`how to make money as ${hustle.title}`);
    const hustleIncomeQuery = encodeURIComponent(`${hustle.title} income salary`);
    const hustleSuccessQuery = encodeURIComponent(`${hustle.title} success story`);

    const resources = [
        {
            title: `Search "${hustle.title}" on Google`,
            source: "Google Search",
            link: `https://www.google.com/search?q=${hustleQuery}`,
            description: `Comprehensive search results for ${hustle.title} including guides, tutorials, and current opportunities.`
        },
        {
            title: `"How to Make Money" Guide`,
            source: "Google Search",
            link: `https://www.google.com/search?q=${hustleMoneyQuery}`,
            description: `Find detailed guides and strategies for monetizing your ${hustle.title} skills effectively.`
        },
        {
            title: `${hustle.title} Salary & Income Data`,
            source: "Google Search",
            link: `https://www.google.com/search?q=${hustleIncomeQuery}`,
            description: `Real salary data and income reports from professionals working as ${hustle.title}.`
        },
        {
            title: `${hustle.title} Success Stories`,
            source: "Google Search",
            link: `https://www.google.com/search?q=${hustleSuccessQuery}`,
            description: `Inspiring success stories from people who built careers in ${hustle.title}.`
        },
        {
            title: `${hustle.title} Tutorials`,
            source: "YouTube",
            link: `https://www.youtube.com/results?search_query=${hustleQuery}+tutorial`,
            description: `Video tutorials and walkthroughs for learning ${hustle.title} from scratch.`
        },
        {
            title: `r/${hustle.category} Community`,
            source: "Reddit",
            link: `https://www.reddit.com/search/?q=${hustleQuery}`,
            description: `Join discussions with thousands of ${hustle.title} practitioners sharing tips and experiences.`
        },
        {
            title: `${hustle.title} Courses`,
            source: "Udemy",
            link: `https://www.udemy.com/courses/search/?q=${hustleQuery}`,
            description: `Professional courses to master ${hustle.title} skills from industry experts.`
        },
        {
            title: `${hustle.title} Jobs & Gigs`,
            source: "Upwork",
            link: `https://www.upwork.com/freelance-jobs/${hustle.category.toLowerCase()}/`,
            description: `Browse current job postings and freelance opportunities for ${hustle.title}.`
        }
    ];

    // Return 5-6 resources
    return resources.slice(0, 5 + Math.floor(Math.random() * 2));
};

// Generate tips for success
const generateTipsForSuccess = (hustle: HustleIdea): string[] => {
    return [
        `Master the fundamentals of ${hustle.skills[0]} before attempting to specialize. A strong foundation in core competencies will serve you throughout your career and differentiate you from those who cut corners.`,
        `Prioritize client communication and set clear expectations from the outset. Most project failures stem from misaligned expectations rather than technical shortcomings. Confirm requirements in writing before beginning work.`,
        `Invest in continuous learning, dedicating at least 5 hours weekly to skill development. The ${hustle.category} industry evolves rapidly, and staying current is essential for maintaining competitive positioning.`,
        `Build a reputation for reliability by consistently meeting deadlines and delivering promised quality. In a market where many freelancers underdeliver, dependability becomes a significant competitive advantage.`,
        `Develop a specialty within ${hustle.title} rather than positioning yourself as a generalist. Specialists command higher rates and attract more qualified leads than those attempting to serve everyone.`,
        `Create systems for every recurring task in your business. Documentation and process optimization free mental bandwidth for high-value creative work and enable eventual delegation.`,
        `Network strategically within the ${hustle.category} community. Peer relationships often lead to referrals, collaborations, and invaluable insights that accelerate professional growth.`,
        `Request testimonials from satisfied clients immediately upon project completion. Social proof compounds over time and significantly influences prospective clients' decisions.`,
        `Set professional boundaries regarding working hours, scope changes, and communication channels. Sustainable success requires protecting your time and mental energy.`,
        `Track your income, expenses, and time investment meticulously. Data-driven decision making enables you to identify your most profitable activities and optimize accordingly.`
    ];
};

// Generate what to learn
const generateWhatToLearn = (hustle: HustleIdea): HustleDetailContent['whatToLearn'] => {
    const essentialSkills = hustle.skills.map(skill => ({
        skill,
        description: `Develop comprehensive proficiency in ${skill}, understanding both foundational principles and advanced applications relevant to ${hustle.title} work.`,
        priority: 'Essential' as const
    }));

    const recommendedSkills = [
        { skill: 'Client Communication', description: 'Master professional communication techniques for proposals, updates, and feedback discussions with clients.', priority: 'Recommended' as const },
        { skill: 'Time Management', description: 'Implement productivity systems and techniques to maximize output while preventing burnout.', priority: 'Recommended' as const },
        { skill: 'Business Development', description: 'Learn strategies for attracting clients, pricing services, and building a sustainable independent practice.', priority: 'Recommended' as const }
    ];

    const optionalSkills = [
        { skill: 'Personal Branding', description: 'Build a distinctive professional identity that attracts ideal clients and commands premium rates.', priority: 'Optional' as const },
        { skill: 'Automation Tools', description: 'Leverage software to streamline repetitive tasks and scale your capacity without proportionally increasing workload.', priority: 'Optional' as const }
    ];

    return [...essentialSkills, ...recommendedSkills, ...optionalSkills];
};

// Main function to generate complete hustle detail content
export const generateHustleDetailContent = (hustle: HustleIdea): HustleDetailContent => {
    const testimonialCount = 50 + Math.floor(Math.random() * 31); // 50-80
    const faqCount = 10 + Math.floor(Math.random() * 6); // 10-15

    return {
        aboutSection: generateAboutSection(hustle),
        stepsToStart: generateStepsToStart(hustle),
        proofOfSuccess: generateProofOfSuccess(hustle),
        tipsForSuccess: generateTipsForSuccess(hustle),
        whatToLearn: generateWhatToLearn(hustle),
        keyInfo: {
            earningPotential: hustle.earningPotential,
            timeRequired: hustle.difficulty === 'Beginner' ? '10-20 hours/week to start' : hustle.difficulty === 'Intermediate' ? '15-30 hours/week recommended' : '20-40+ hours/week for optimal results',
            toolsAndPlatforms: getToolsForCategory(hustle.category),
            difficultyLevel: hustle.difficulty
        },
        testimonials: generateTestimonials(hustle, testimonialCount),
        faqs: generateFAQs(hustle, faqCount),
        tags: [hustle.category, hustle.difficulty, hustle.earningTier, 'Remote Work', 'Flexible Schedule', ...hustle.skills.slice(0, 3)],
        heroImage: `https://images.unsplash.com/photo-${1500000000000 + hustle.id * 1000}?w=1200&h=600&fit=crop`
    };
};
