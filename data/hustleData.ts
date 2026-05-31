import { HustleIdea } from '../types';

// Categories for hustles
const CATEGORIES = [
    'Content', 'Tech', 'Creative', 'Admin', 'Marketing',
    'E-commerce', 'Education', 'Finance', 'Health', 'Legal',
    'Real Estate', 'Consulting', 'Entertainment', 'Food', 'Travel',
    'Fitness', 'Photography', 'Music', 'Writing', 'Design'
];

// Hustle templates per category
const HUSTLE_TEMPLATES: Record<string, { titles: string[], skills: string[][] }> = {
    'Content': {
        titles: [
            'Blog Writer', 'Content Strategist', 'Copywriter', 'Technical Writer', 'SEO Content Writer',
            'Newsletter Writer', 'Ghostwriter', 'Script Writer', 'Product Description Writer', 'Article Writer',
            'White Paper Author', 'Case Study Writer', 'Press Release Writer', 'Email Copywriter', 'Landing Page Writer',
            'Social Media Content Creator', 'Podcast Script Writer', 'eBook Author', 'Resume Writer', 'Grant Writer',
            'Speech Writer', 'Legal Content Writer', 'Medical Content Writer', 'Travel Writer', 'Food Blogger',
            'Fashion Writer', 'Sports Writer', 'Technology Blogger', 'Personal Finance Writer', 'Lifestyle Blogger',
            'B2B Content Writer', 'SaaS Content Writer', 'Real Estate Content Writer', 'Automotive Writer', 'Gaming Content Creator',
            'Review Writer', 'Comparison Article Writer', 'How-To Guide Writer', 'Tutorial Creator', 'FAQ Writer',
            'Knowledge Base Writer', 'Help Documentation Writer', 'API Documentation Writer', 'Course Content Writer', 'Quiz Content Creator',
            'Infographic Content Writer', 'Video Script Writer', 'Webinar Script Writer', 'Presentation Content Writer', 'Pitch Deck Writer',
            'Annual Report Writer', 'Company Bio Writer', 'Brand Story Writer', 'Tagline Creator', 'Slogan Writer',
            'Ad Copy Writer', 'Billboard Copy Writer', 'Radio Ad Writer', 'TV Commercial Script Writer', 'Print Ad Writer'
        ],
        skills: [
            ['Writing', 'SEO', 'Research'],
            ['Content Strategy', 'Analytics', 'Marketing'],
            ['Copywriting', 'Psychology', 'Sales'],
            ['Technical Writing', 'Documentation', 'Clarity'],
            ['SEO', 'Keyword Research', 'Content Optimization']
        ]
    },
    'Tech': {
        titles: [
            'Web Developer', 'Mobile App Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
            'WordPress Developer', 'Shopify Developer', 'React Developer', 'Node.js Developer', 'Python Developer',
            'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'AI Consultant', 'DevOps Engineer',
            'Cloud Architect', 'Cybersecurity Consultant', 'Penetration Tester', 'Network Administrator', 'Database Administrator',
            'API Developer', 'Blockchain Developer', 'Smart Contract Developer', 'NFT Developer', 'Crypto Trader Bot Developer',
            'Game Developer', 'Unity Developer', 'Unreal Engine Developer', 'AR/VR Developer', 'IoT Developer',
            'Embedded Systems Developer', 'Firmware Engineer', 'QA Engineer', 'Test Automation Engineer', 'Performance Tester',
            'UX Researcher', 'UI Developer', 'Accessibility Specialist', 'SEO Technical Specialist', 'Web Scraping Expert',
            'Automation Specialist', 'RPA Developer', 'Zapier Expert', 'Make.com Specialist', 'No-Code Developer',
            'Bubble Developer', 'Webflow Developer', 'Framer Developer', 'Notion Consultant', 'Airtable Expert',
            'Salesforce Developer', 'HubSpot Developer', 'CRM Specialist', 'ERP Consultant', 'SAP Consultant',
            'IT Support Specialist', 'Tech Trainer', 'Software Documentation Writer', 'Code Reviewer', 'Tech Blogger'
        ],
        skills: [
            ['JavaScript', 'React', 'Node.js'],
            ['Python', 'Django', 'Flask'],
            ['AWS', 'Docker', 'Kubernetes'],
            ['SQL', 'MongoDB', 'PostgreSQL'],
            ['Git', 'CI/CD', 'Testing']
        ]
    },
    'Creative': {
        titles: [
            'Graphic Designer', 'Logo Designer', 'Brand Identity Designer', 'UI Designer', 'UX Designer',
            'Illustrator', 'Digital Artist', 'Character Designer', 'Concept Artist', 'Storyboard Artist',
            'Motion Graphics Designer', 'Video Editor', 'Film Editor', 'Color Grader', 'VFX Artist',
            '3D Modeler', '3D Animator', 'Product Visualizer', 'Architectural Visualizer', 'Interior Visualizer',
            'Packaging Designer', 'Print Designer', 'Publication Designer', 'Book Cover Designer', 'Album Art Designer',
            'Merchandise Designer', 'T-Shirt Designer', 'Pattern Designer', 'Textile Designer', 'Fashion Designer',
            'Jewelry Designer', 'Product Designer', 'Furniture Designer', 'Toy Designer', 'Game Asset Designer',
            'Icon Designer', 'Emoji Designer', 'Sticker Designer', 'GIF Creator', 'Meme Creator',
            'Presentation Designer', 'Pitch Deck Designer', 'Infographic Designer', 'Data Visualization Designer', 'Chart Designer',
            'Social Media Designer', 'Ad Creative Designer', 'Banner Designer', 'Flyer Designer', 'Poster Designer',
            'Invitation Designer', 'Wedding Stationery Designer', 'Event Graphics Designer', 'Menu Designer', 'Signage Designer',
            'Vehicle Wrap Designer', 'Environmental Designer', 'Exhibition Designer', 'Retail Display Designer', 'Window Display Designer'
        ],
        skills: [
            ['Photoshop', 'Illustrator', 'Creativity'],
            ['Figma', 'Sketch', 'Prototyping'],
            ['After Effects', 'Premiere Pro', 'Animation'],
            ['Blender', 'Cinema 4D', '3D Modeling'],
            ['InDesign', 'Typography', 'Layout']
        ]
    },
    'Admin': {
        titles: [
            'Virtual Assistant', 'Executive Assistant', 'Administrative Assistant', 'Personal Assistant', 'Office Manager',
            'Calendar Manager', 'Email Manager', 'Inbox Zero Specialist', 'Travel Coordinator', 'Event Coordinator',
            'Project Coordinator', 'Operations Assistant', 'Customer Service Rep', 'Help Desk Agent', 'Live Chat Agent',
            'Data Entry Specialist', 'Database Manager', 'CRM Administrator', 'File Organizer', 'Document Controller',
            'Transcriptionist', 'Meeting Notes Taker', 'Minute Writer', 'Research Assistant', 'Internet Researcher',
            'Lead Generation Specialist', 'List Builder', 'Contact Database Manager', 'Outreach Coordinator', 'Follow-up Specialist',
            'Appointment Setter', 'Cold Caller', 'Warm Caller', 'Customer Follow-up Agent', 'Survey Conductor',
            'Feedback Collector', 'Review Manager', 'Reputation Manager', 'Community Moderator', 'Forum Manager',
            'Social Media Manager', 'Content Scheduler', 'Publishing Assistant', 'Editorial Assistant', 'Proofreader',
            'Quality Assurance Assistant', 'Compliance Assistant', 'HR Assistant', 'Recruiting Coordinator', 'Onboarding Specialist',
            'Payroll Assistant', 'Bookkeeping Assistant', 'Invoice Manager', 'Expense Tracker', 'Budget Assistant',
            'Vendor Manager', 'Supplier Coordinator', 'Procurement Assistant', 'Inventory Manager', 'Order Processor'
        ],
        skills: [
            ['Organization', 'Communication', 'Time Management'],
            ['Microsoft Office', 'Google Workspace', 'Scheduling'],
            ['Customer Service', 'Problem Solving', 'Patience'],
            ['Data Entry', 'Accuracy', 'Speed'],
            ['Research', 'Analysis', 'Reporting']
        ]
    },
    'Marketing': {
        titles: [
            'Digital Marketer', 'Social Media Manager', 'Content Marketer', 'Email Marketer', 'SEO Specialist',
            'PPC Specialist', 'Google Ads Expert', 'Facebook Ads Expert', 'Instagram Ads Expert', 'TikTok Ads Expert',
            'LinkedIn Marketing Expert', 'Pinterest Marketing Expert', 'YouTube Marketing Expert', 'Influencer Marketing Manager', 'Affiliate Marketing Manager',
            'Growth Hacker', 'Conversion Rate Optimizer', 'Landing Page Optimizer', 'A/B Testing Specialist', 'Marketing Analyst',
            'Brand Strategist', 'Market Researcher', 'Competitive Analyst', 'Customer Insights Analyst', 'Trend Analyst',
            'Product Marketing Manager', 'Launch Strategist', 'Go-to-Market Specialist', 'Positioning Expert', 'Messaging Specialist',
            'Community Manager', 'Brand Ambassador Coordinator', 'Referral Program Manager', 'Loyalty Program Manager', 'Customer Retention Specialist',
            'Event Marketing Specialist', 'Webinar Marketing Expert', 'Podcast Marketing Expert', 'Video Marketing Expert', 'Viral Marketing Specialist',
            'Guerrilla Marketing Expert', 'Street Marketing Specialist', 'Experiential Marketing Manager', 'Sponsorship Coordinator', 'Partnership Marketing Manager',
            'PR Specialist', 'Media Relations Expert', 'Press Kit Creator', 'Publicity Specialist', 'Crisis Communication Expert',
            'Internal Communication Specialist', 'Employer Branding Expert', 'Recruitment Marketing Specialist', 'Talent Attraction Marketer', 'Employee Advocacy Manager',
            'Marketing Automation Expert', 'HubSpot Specialist', 'Mailchimp Expert', 'ActiveCampaign Specialist', 'Klaviyo Expert'
        ],
        skills: [
            ['Social Media', 'Analytics', 'Strategy'],
            ['Google Ads', 'Facebook Ads', 'PPC'],
            ['SEO', 'SEM', 'Keyword Research'],
            ['Email Marketing', 'Automation', 'Segmentation'],
            ['Content Marketing', 'Copywriting', 'Storytelling']
        ]
    },
    'E-commerce': {
        titles: [
            'Dropshipping Expert', 'Amazon FBA Seller', 'eBay Seller', 'Etsy Shop Owner', 'Shopify Store Owner',
            'WooCommerce Expert', 'BigCommerce Specialist', 'Magento Developer', 'E-commerce Consultant', 'Online Store Manager',
            'Product Sourcing Expert', 'Supplier Negotiator', 'Import/Export Specialist', 'Customs Consultant', 'Logistics Coordinator',
            'Inventory Manager', 'Warehouse Coordinator', 'Fulfillment Specialist', '3PL Coordinator', 'Last Mile Delivery Optimizer',
            'Product Photographer', 'Product Videographer', 'Product Listing Expert', 'Amazon Listing Optimizer', 'SEO for E-commerce',
            'E-commerce Copywriter', 'Product Description Writer', 'Review Manager', 'Customer Service for E-commerce', 'Returns Manager',
            'Pricing Strategist', 'Competitor Price Tracker', 'Dynamic Pricing Expert', 'Bundle Creator', 'Upsell Strategist',
            'Email Marketing for E-commerce', 'Abandoned Cart Recovery Specialist', 'Customer Retention for E-commerce', 'Loyalty Program Designer', 'VIP Customer Manager',
            'Social Commerce Expert', 'Live Shopping Host', 'Shoppable Content Creator', 'Influencer Commerce Manager', 'Affiliate Program Manager',
            'Marketplace Manager', 'Multi-Channel Seller', 'Channel Integration Expert', 'Order Management Specialist', 'Platform Migration Expert',
            'E-commerce Analytics Expert', 'Conversion Funnel Optimizer', 'Customer Journey Mapper', 'Heatmap Analyst', 'User Behavior Analyst',
            'Print on Demand Expert', 'Custom Product Designer', 'Personalization Specialist', 'Gift Box Curator', 'Subscription Box Creator'
        ],
        skills: [
            ['Shopify', 'WooCommerce', 'E-commerce'],
            ['Product Sourcing', 'Negotiation', 'Logistics'],
            ['Amazon', 'eBay', 'Marketplace Selling'],
            ['Digital Marketing', 'Facebook Ads', 'Google Shopping'],
            ['Inventory Management', 'Order Fulfillment', 'Customer Service']
        ]
    },
    'Education': {
        titles: [
            'Online Tutor', 'Math Tutor', 'Science Tutor', 'English Tutor', 'Language Tutor',
            'SAT/ACT Prep Tutor', 'GRE/GMAT Prep Tutor', 'IELTS/TOEFL Tutor', 'College Admissions Consultant', 'Essay Coach',
            'Homework Helper', 'Study Skills Coach', 'Academic Coach', 'Learning Strategist', 'Exam Prep Specialist',
            'Course Creator', 'Online Course Instructor', 'Udemy Instructor', 'Skillshare Teacher', 'Teachable Expert',
            'Curriculum Developer', 'Lesson Plan Designer', 'Educational Content Writer', 'Textbook Author', 'Workbook Creator',
            'Quiz Designer', 'Assessment Creator', 'Educational Game Designer', 'Interactive Content Developer', 'E-learning Developer',
            'Instructional Designer', 'LMS Administrator', 'Training Coordinator', 'Corporate Trainer', 'Workshop Facilitator',
            'Webinar Host', 'Keynote Speaker', 'Guest Lecturer', 'Subject Matter Expert', 'Research Mentor',
            'Thesis Advisor', 'Dissertation Coach', 'Academic Editor', 'Citation Specialist', 'Plagiarism Checker',
            'Special Education Tutor', 'Dyslexia Specialist', 'ADHD Coach', 'Gifted Education Specialist', 'Homeschool Curriculum Consultant',
            'Music Teacher', 'Art Teacher', 'Drama Coach', 'Dance Instructor', 'Sports Coach',
            'Coding Instructor', 'Robotics Teacher', 'STEM Educator', 'Financial Literacy Teacher', 'Life Skills Coach'
        ],
        skills: [
            ['Teaching', 'Subject Expertise', 'Patience'],
            ['Curriculum Design', 'Lesson Planning', 'Assessment'],
            ['Online Teaching', 'Zoom', 'Digital Tools'],
            ['Communication', 'Mentoring', 'Motivation'],
            ['Content Creation', 'Video Editing', 'Course Design']
        ]
    },
    'Finance': {
        titles: [
            'Bookkeeper', 'Accountant', 'Tax Preparer', 'Tax Consultant', 'CPA Services',
            'Financial Analyst', 'Budget Analyst', 'Forecasting Expert', 'Financial Modeler', 'Valuation Analyst',
            'Personal Finance Coach', 'Debt Counselor', 'Credit Repair Specialist', 'Budget Coach', 'Savings Strategist',
            'Investment Advisor', 'Stock Market Analyst', 'Crypto Advisor', 'Portfolio Manager', 'Wealth Manager',
            'Retirement Planner', '401k Consultant', 'Pension Advisor', 'Estate Planner', 'Trust Administrator',
            'Insurance Advisor', 'Life Insurance Agent', 'Health Insurance Broker', 'Property Insurance Agent', 'Business Insurance Consultant',
            'Loan Consultant', 'Mortgage Advisor', 'Refinancing Expert', 'Business Loan Specialist', 'SBA Loan Consultant',
            'Grant Writer', 'Funding Consultant', 'Investor Relations Specialist', 'Pitch Deck Financial Analyst', 'Due Diligence Analyst',
            'Payroll Specialist', 'Compensation Analyst', 'Benefits Administrator', 'Executive Compensation Consultant', 'Equity Compensation Expert',
            'Forensic Accountant', 'Fraud Examiner', 'Internal Auditor', 'Compliance Officer', 'Risk Analyst',
            'QuickBooks Expert', 'Xero Specialist', 'FreshBooks Consultant', 'Wave Accounting Expert', 'Sage Specialist',
            'Invoicing Specialist', 'Accounts Receivable Manager', 'Accounts Payable Specialist', 'Collections Agent', 'Revenue Analyst'
        ],
        skills: [
            ['Accounting', 'Bookkeeping', 'QuickBooks'],
            ['Financial Analysis', 'Excel', 'Modeling'],
            ['Tax Preparation', 'Tax Planning', 'Compliance'],
            ['Investment', 'Portfolio Management', 'Risk Assessment'],
            ['Budgeting', 'Forecasting', 'Financial Planning']
        ]
    },
    'Health': {
        titles: [
            'Health Coach', 'Wellness Coach', 'Nutrition Coach', 'Diet Consultant', 'Meal Planner',
            'Personal Trainer', 'Fitness Coach', 'Yoga Instructor', 'Pilates Instructor', 'Meditation Guide',
            'Mental Health Advocate', 'Life Coach', 'Stress Management Coach', 'Anxiety Coach', 'Mindfulness Teacher',
            'Sleep Consultant', 'Recovery Coach', 'Addiction Counselor', 'Sobriety Coach', 'Habit Change Coach',
            'Weight Loss Coach', 'Body Transformation Coach', 'Sports Nutrition Expert', 'Supplement Advisor', 'Holistic Health Consultant',
            'Ayurveda Practitioner', 'Naturopath Consultant', 'Herbalist', 'Aromatherapy Expert', 'Essential Oils Educator',
            'Massage Therapy Business', 'Chiropractic Consultant', 'Physical Therapy Assistant', 'Occupational Therapy Consultant', 'Speech Therapy Aide',
            'Senior Care Consultant', 'Caregiver Coordinator', 'Home Health Aide Coordinator', 'Disability Services Consultant', 'Accessibility Advisor',
            'Women\'s Health Coach', 'Pregnancy Coach', 'Postpartum Doula', 'Fertility Consultant', 'Menopause Coach',
            'Men\'s Health Coach', 'Andropause Consultant', 'Prostate Health Educator', 'Sexual Health Educator', 'Relationship Health Coach',
            'Corporate Wellness Consultant', 'Workplace Health Coordinator', 'Ergonomics Consultant', 'Occupational Health Advisor', 'Employee Wellness Program Designer',
            'Telemedicine Consultant', 'Health Tech Advisor', 'Wearable Tech Consultant', 'Health Data Analyst', 'Medical Billing Specialist'
        ],
        skills: [
            ['Nutrition', 'Wellness', 'Coaching'],
            ['Fitness', 'Exercise Science', 'Motivation'],
            ['Mental Health', 'Counseling', 'Support'],
            ['Health Education', 'Communication', 'Empathy'],
            ['Holistic Health', 'Alternative Medicine', 'Natural Remedies']
        ]
    },
    'Legal': {
        titles: [
            'Legal Consultant', 'Paralegal Services', 'Legal Research Assistant', 'Contract Reviewer', 'Document Preparer',
            'Notary Public', 'Mobile Notary', 'Signing Agent', 'Apostille Agent', 'Document Legalization Specialist',
            'Business Formation Consultant', 'LLC Formation Expert', 'Corporate Compliance Advisor', 'Registered Agent Services', 'Annual Report Filer',
            'Trademark Researcher', 'Patent Research Assistant', 'IP Consultant', 'Copyright Registration Helper', 'Brand Protection Advisor',
            'Contract Drafter', 'NDA Specialist', 'Terms of Service Writer', 'Privacy Policy Writer', 'EULA Drafter',
            'Real Estate Closing Coordinator', 'Title Search Specialist', 'Deed Preparer', 'Lease Agreement Specialist', 'HOA Compliance Advisor',
            'Immigration Consultant', 'Visa Application Assistant', 'Green Card Consultant', 'Citizenship Test Prep', 'Translation for Legal Documents',
            'Family Law Paralegal', 'Divorce Document Preparer', 'Child Custody Mediator', 'Adoption Consultant', 'Guardianship Advisor',
            'Criminal Record Expungement Helper', 'Background Check Specialist', 'Court Document Researcher', 'Case Law Researcher', 'Legal Brief Writer',
            'Mediation Services', 'Arbitration Consultant', 'Dispute Resolution Specialist', 'Negotiation Advisor', 'Settlement Consultant',
            'Employment Law Consultant', 'Workplace Investigation Specialist', 'HR Compliance Advisor', 'Employee Handbook Writer', 'Non-Compete Agreement Specialist',
            'Estate Planning Assistant', 'Will Drafter', 'Trust Document Preparer', 'Power of Attorney Specialist', 'Beneficiary Designation Advisor'
        ],
        skills: [
            ['Legal Research', 'Writing', 'Analysis'],
            ['Contract Law', 'Document Review', 'Compliance'],
            ['Intellectual Property', 'Trademark', 'Patents'],
            ['Real Estate Law', 'Title Search', 'Closing'],
            ['Legal Documentation', 'Court Filings', 'Procedures']
        ]
    },
    'Real Estate': {
        titles: [
            'Real Estate Virtual Assistant', 'Property Manager', 'Rental Property Manager', 'Airbnb Host', 'Vacation Rental Manager',
            'Real Estate Photographer', 'Real Estate Videographer', 'Drone Photographer for Real Estate', 'Virtual Tour Creator', '3D Floor Plan Designer',
            'Real Estate Copywriter', 'Property Listing Writer', 'MLS Listing Expert', 'Real Estate Blog Writer', 'Neighborhood Guide Writer',
            'Home Staging Consultant', 'Virtual Staging Expert', 'Interior Design for Real Estate', 'Curb Appeal Consultant', 'Renovation Advisor',
            'Real Estate Lead Generator', 'Cold Caller for Real Estate', 'Door Knocker', 'Open House Coordinator', 'Showing Assistant',
            'Transaction Coordinator', 'Closing Coordinator', 'Title Company Liaison', 'Escrow Coordinator', 'Document Organizer',
            'Property Analyst', 'Comparative Market Analysis Expert', 'Investment Property Analyst', 'Cap Rate Calculator', 'Cash Flow Analyst',
            'Wholesaling Expert', 'Bird Dog', 'Skip Tracing Specialist', 'Distressed Property Finder', 'Probate Lead Specialist',
            'House Flipper Consultant', 'Rehab Cost Estimator', 'Contractor Coordinator', 'Project Manager for Flips', 'After Repair Value Analyst',
            'REIT Analyst', 'Real Estate Crowdfunding Advisor', 'Syndication Consultant', 'Investor Relations for Real Estate', 'Capital Raising Specialist',
            'Commercial Real Estate Analyst', 'Retail Space Consultant', 'Office Space Consultant', 'Industrial Property Specialist', 'Land Development Consultant',
            'Property Tax Appeal Specialist', 'Zoning Consultant', 'Permit Expediter', 'Environmental Assessment Coordinator', 'Accessibility Compliance Advisor'
        ],
        skills: [
            ['Property Management', 'Communication', 'Organization'],
            ['Photography', 'Videography', 'Virtual Tours'],
            ['Market Analysis', 'Research', 'Data Analysis'],
            ['Sales', 'Negotiation', 'Customer Service'],
            ['Investment Analysis', 'Financial Modeling', 'Due Diligence']
        ]
    },
    'Consulting': {
        titles: [
            'Business Consultant', 'Strategy Consultant', 'Management Consultant', 'Operations Consultant', 'Process Improvement Specialist',
            'Startup Advisor', 'Business Plan Writer', 'Pitch Deck Consultant', 'Investor Pitch Coach', 'Fundraising Consultant',
            'Small Business Consultant', 'Franchise Consultant', 'Exit Strategy Advisor', 'Business Valuation Expert', 'M&A Consultant',
            'HR Consultant', 'Recruiting Consultant', 'Organizational Development Specialist', 'Culture Consultant', 'Diversity & Inclusion Advisor',
            'Sales Consultant', 'Sales Process Designer', 'CRM Consultant', 'Sales Training Expert', 'Pipeline Coach',
            'Customer Experience Consultant', 'Customer Journey Mapper', 'NPS Improvement Specialist', 'Churn Reduction Expert', 'Retention Strategist',
            'Supply Chain Consultant', 'Procurement Advisor', 'Vendor Management Expert', 'Cost Reduction Specialist', 'Lean Consultant',
            'Quality Consultant', 'Six Sigma Specialist', 'ISO Certification Consultant', 'Audit Consultant', 'Process Documentation Expert',
            'Change Management Consultant', 'Project Management Consultant', 'Agile Coach', 'Scrum Master', 'PMO Consultant',
            'Digital Transformation Consultant', 'Technology Advisor', 'IT Strategy Consultant', 'Software Selection Consultant', 'Implementation Specialist',
            'Sustainability Consultant', 'ESG Advisor', 'Carbon Footprint Analyst', 'Green Business Consultant', 'Circular Economy Expert',
            'Innovation Consultant', 'Design Thinking Facilitator', 'Product Strategy Consultant', 'Market Entry Advisor', 'Localization Consultant'
        ],
        skills: [
            ['Business Strategy', 'Analysis', 'Problem Solving'],
            ['Communication', 'Presentation', 'Leadership'],
            ['Project Management', 'Process Improvement', 'Change Management'],
            ['Industry Expertise', 'Research', 'Benchmarking'],
            ['Consulting', 'Advisory', 'Coaching']
        ]
    },
    'Entertainment': {
        titles: [
            'YouTuber', 'Twitch Streamer', 'TikTok Creator', 'Instagram Influencer', 'Podcast Host',
            'Content Creator', 'Video Producer', 'Short Film Maker', 'Documentary Creator', 'Music Video Director',
            'Stand-up Comedian', 'Comedy Writer', 'Sketch Creator', 'Improv Performer', 'Roast Writer',
            'Voice Actor', 'Character Voice Artist', 'Audiobook Narrator', 'Commercial Voice Over', 'E-learning Narrator',
            'DJ', 'Event DJ', 'Wedding DJ', 'Club DJ', 'Radio DJ',
            'Music Producer', 'Beat Maker', 'Mixing Engineer', 'Mastering Engineer', 'Sound Designer',
            'Singer', 'Session Vocalist', 'Jingle Singer', 'Voice Coach', 'Vocal Coach',
            'Actor', 'Background Actor', 'Voice Actor for Games', 'Motion Capture Artist', 'Stunt Performer',
            'Model', 'Product Model', 'Fitness Model', 'Fashion Model', 'Stock Photo Model',
            'Dancer', 'Choreographer', 'Dance Teacher', 'Backup Dancer', 'Dance Video Creator',
            'Magician', 'Illusionist', 'Card Trick Performer', 'Virtual Magic Show Host', 'Magic Coach',
            'Game Streamer', 'E-sports Player', 'Gaming Coach', 'Game Reviewer', 'Gaming Content Creator'
        ],
        skills: [
            ['Content Creation', 'Video Editing', 'Social Media'],
            ['Performance', 'Entertainment', 'Creativity'],
            ['Music Production', 'Sound Engineering', 'Audio'],
            ['Acting', 'Voice Work', 'Presentation'],
            ['Gaming', 'Streaming', 'Community Building']
        ]
    },
    'Food': {
        titles: [
            'Food Blogger', 'Recipe Developer', 'Food Photographer', 'Food Stylist', 'Food Videographer',
            'Personal Chef', 'Meal Prep Service', 'Private Dinner Host', 'Catering Consultant', 'Food Truck Consultant',
            'Baking Business', 'Cake Decorator', 'Cookie Decorator', 'Pastry Chef', 'Bread Baker',
            'Food Delivery Coordinator', 'Ghost Kitchen Consultant', 'Restaurant Consultant', 'Menu Designer', 'Food Cost Analyst',
            'Nutrition Meal Planner', 'Diet Recipe Creator', 'Keto Recipe Developer', 'Vegan Recipe Developer', 'Allergen-Free Recipe Specialist',
            'Cooking Instructor', 'Online Cooking Class Host', 'Culinary Coach', 'Kitchen Organization Consultant', 'Pantry Organizer',
            'Wine Consultant', 'Sommelier Services', 'Beer Consultant', 'Cocktail Recipe Developer', 'Mixology Teacher',
            'Food Writer', 'Restaurant Reviewer', 'Food Critic', 'Culinary Tour Guide', 'Food Experience Creator',
            'Farmers Market Vendor', 'Artisan Food Producer', 'Specialty Food Maker', 'Hot Sauce Creator', 'Jam & Preserve Maker',
            'Coffee Consultant', 'Barista Trainer', 'Tea Consultant', 'Beverage Developer', 'Smoothie Recipe Creator',
            'Food Packaging Designer', 'Food Label Designer', 'Nutrition Label Specialist', 'USDA Compliance Consultant', 'Food Safety Advisor',
            'Food Influencer', 'Mukbang Creator', 'ASMR Food Creator', 'Competitive Eater', 'Food Challenge Creator'
        ],
        skills: [
            ['Cooking', 'Recipe Development', 'Food Photography'],
            ['Baking', 'Pastry', 'Decoration'],
            ['Food Styling', 'Presentation', 'Photography'],
            ['Nutrition', 'Meal Planning', 'Diet Knowledge'],
            ['Food Business', 'Catering', 'Event Planning']
        ]
    },
    'Travel': {
        titles: [
            'Travel Blogger', 'Travel Vlogger', 'Travel Photographer', 'Travel Writer', 'Destination Guide Creator',
            'Travel Agent', 'Travel Consultant', 'Trip Planner', 'Itinerary Designer', 'Vacation Specialist',
            'Luxury Travel Advisor', 'Honeymoon Planner', 'Adventure Travel Specialist', 'Eco-Tourism Consultant', 'Sustainable Travel Advisor',
            'Tour Guide', 'Virtual Tour Guide', 'Local Experience Host', 'Food Tour Guide', 'Walking Tour Creator',
            'Travel Insurance Advisor', 'Visa Consultant', 'Passport Expediter', 'Travel Document Specialist', 'International Move Coordinator',
            'House Sitter', 'Pet Sitter While Traveling', 'Airbnb Experience Host', 'Unique Experience Creator', 'Local Expert',
            'Flight Deal Finder', 'Travel Hack Educator', 'Points & Miles Consultant', 'Credit Card Travel Advisor', 'Loyalty Program Expert',
            'Group Travel Coordinator', 'Corporate Travel Manager', 'Event Destination Planner', 'Destination Wedding Planner', 'Retreat Organizer',
            'Cruise Consultant', 'Cruise Ship Reviewer', 'Port Excursion Planner', 'River Cruise Specialist', 'Yacht Charter Advisor',
            'Backpacking Guide', 'Budget Travel Expert', 'Solo Travel Coach', 'Female Solo Travel Advisor', 'Family Travel Specialist',
            'Travel Photography Teacher', 'Mobile Photography Coach', 'Travel Journal Creator', 'Scrapbook Designer', 'Memory Book Creator',
            'Relocation Consultant', 'Expat Advisor', 'Digital Nomad Coach', 'Remote Work Location Scout', 'Workation Planner'
        ],
        skills: [
            ['Travel Planning', 'Research', 'Organization'],
            ['Photography', 'Videography', 'Content Creation'],
            ['Customer Service', 'Communication', 'Sales'],
            ['Cultural Knowledge', 'Languages', 'Adaptability'],
            ['Digital Nomad Skills', 'Remote Work', 'Flexibility']
        ]
    },
    'Fitness': {
        titles: [
            'Personal Trainer', 'Online Fitness Coach', 'Workout Program Designer', 'Fitness App Consultant', 'Home Workout Creator',
            'Yoga Teacher', 'Online Yoga Instructor', 'Yoga Retreat Organizer', 'Yoga Therapy Specialist', 'Chair Yoga Instructor',
            'Pilates Instructor', 'Barre Instructor', 'Dance Fitness Instructor', 'Zumba Instructor', 'Aerobics Teacher',
            'Strength Coach', 'Powerlifting Coach', 'Olympic Lifting Coach', 'Bodybuilding Coach', 'Physique Coach',
            'CrossFit Trainer', 'HIIT Instructor', 'Boot Camp Instructor', 'Outdoor Fitness Leader', 'Park Workout Organizer',
            'Sports Performance Coach', 'Speed Coach', 'Agility Trainer', 'Flexibility Coach', 'Mobility Specialist',
            'Running Coach', 'Marathon Trainer', 'Triathlon Coach', 'Cycling Coach', 'Swimming Instructor',
            'Golf Instructor', 'Tennis Coach', 'Basketball Trainer', 'Soccer Coach', 'Martial Arts Instructor',
            'Boxing Trainer', 'Kickboxing Instructor', 'MMA Coach', 'Self-Defense Instructor', 'Combat Fitness Trainer',
            'Senior Fitness Specialist', 'Youth Fitness Coach', 'Pre/Postnatal Fitness Expert', 'Adaptive Fitness Trainer', 'Wheelchair Fitness Coach',
            'Fitness Content Creator', 'Fitness YouTuber', 'Fitness Influencer', 'Transformation Coach', 'Accountability Coach',
            'Gym Design Consultant', 'Home Gym Setup Expert', 'Equipment Reviewer', 'Fitness Tech Consultant', 'Wearable Device Coach'
        ],
        skills: [
            ['Fitness Training', 'Exercise Science', 'Motivation'],
            ['Nutrition', 'Meal Planning', 'Supplementation'],
            ['Online Coaching', 'Video Production', 'Social Media'],
            ['Sports Performance', 'Athletics', 'Competition Prep'],
            ['Communication', 'Empathy', 'Leadership']
        ]
    },
    'Photography': {
        titles: [
            'Portrait Photographer', 'Headshot Photographer', 'Family Photographer', 'Newborn Photographer', 'Pet Photographer',
            'Wedding Photographer', 'Engagement Photographer', 'Event Photographer', 'Party Photographer', 'Concert Photographer',
            'Product Photographer', 'E-commerce Photographer', 'Food Photographer', 'Jewelry Photographer', 'Fashion Photographer',
            'Real Estate Photographer', 'Architectural Photographer', 'Interior Photographer', 'Drone Photographer', 'Aerial Photographer',
            'Landscape Photographer', 'Nature Photographer', 'Wildlife Photographer', 'Travel Photographer', 'Street Photographer',
            'Sports Photographer', 'Action Photographer', 'Motorsports Photographer', 'Fitness Photographer', 'Dance Photographer',
            'Photo Editor', 'Retoucher', 'Color Grader', 'Composite Artist', 'Photo Manipulation Expert',
            'Stock Photographer', 'Microstock Contributor', 'Photo Licensing Consultant', 'Image Rights Manager', 'Photo Agency Contributor',
            'Photography Teacher', 'Photo Workshop Host', 'Online Photography Course Creator', 'Lightroom Instructor', 'Photoshop Trainer',
            'Photo Booth Operator', 'Instant Print Service', 'Event Photo Keepsakes', 'Photo Gift Creator', 'Photo Album Designer',
            'Social Media Photographer', 'Brand Photographer', 'Lifestyle Photographer', 'Influencer Photographer', 'Content Photography',
            'Photo Restoration Expert', 'Old Photo Colorization', 'Damaged Photo Repair', 'Archive Digitization', 'Photo Scanning Service'
        ],
        skills: [
            ['Photography', 'Lighting', 'Composition'],
            ['Photo Editing', 'Lightroom', 'Photoshop'],
            ['Camera Equipment', 'Lenses', 'Accessories'],
            ['Client Management', 'Sales', 'Marketing'],
            ['Creativity', 'Vision', 'Storytelling']
        ]
    },
    'Music': {
        titles: [
            'Music Producer', 'Beat Maker', 'Hip Hop Producer', 'EDM Producer', 'Pop Producer',
            'Mixing Engineer', 'Mastering Engineer', 'Audio Engineer', 'Recording Engineer', 'Live Sound Engineer',
            'Songwriter', 'Lyricist', 'Topliner', 'Hook Writer', 'Jingle Composer',
            'Composer', 'Film Composer', 'Game Music Composer', 'Ad Music Creator', 'Library Music Composer',
            'Session Musician', 'Studio Guitarist', 'Studio Drummer', 'Session Bassist', 'Session Keyboardist',
            'Voice Teacher', 'Vocal Coach', 'Singing Instructor', 'Online Music Teacher', 'Piano Teacher',
            'Guitar Teacher', 'Drum Teacher', 'Bass Teacher', 'Violin Teacher', 'Music Theory Tutor',
            'Music Transcriber', 'Sheet Music Creator', 'Lead Sheet Writer', 'Arrangement Creator', 'Orchestrator',
            'Music Supervisor', 'Sync Licensing Specialist', 'Music Rights Manager', 'Catalog Manager', 'Royalty Tracker',
            'Podcast Editor', 'Audio Podcast Producer', 'Sound Designer', 'Foley Artist', 'Audio Post Production',
            'DJ', 'Wedding DJ', 'Party DJ', 'Radio DJ', 'Podcast DJ',
            'Artist Manager', 'Band Manager', 'Tour Manager', 'Booking Agent', 'Music Publicist'
        ],
        skills: [
            ['Music Production', 'DAWs', 'Mixing'],
            ['Instrument Proficiency', 'Music Theory', 'Sight Reading'],
            ['Audio Engineering', 'Sound Design', 'Recording'],
            ['Songwriting', 'Composition', 'Creativity'],
            ['Music Business', 'Licensing', 'Rights Management']
        ]
    },
    'Writing': {
        titles: [
            'Fiction Writer', 'Novel Writer', 'Short Story Writer', 'Flash Fiction Writer', 'Serialized Fiction Creator',
            'Non-Fiction Writer', 'Memoir Writer', 'Biography Writer', 'Self-Help Author', 'How-To Book Writer',
            'Children\'s Book Author', 'Picture Book Writer', 'Middle Grade Author', 'Young Adult Writer', 'Educational Book Writer',
            'Academic Writer', 'Research Paper Writer', 'Thesis Writer', 'Dissertation Consultant', 'Journal Article Writer',
            'Ghostwriter', 'Collaborative Writer', 'Book Doctor', 'Developmental Editor', 'Manuscript Consultant',
            'Screenwriter', 'TV Writer', 'Pilot Script Writer', 'Web Series Writer', 'Film Script Doctor',
            'Playwright', 'Theatre Writer', 'Musical Librettist', 'Monologue Writer', 'Sketch Writer',
            'Poet', 'Greeting Card Writer', 'Lyricist', 'Spoken Word Artist', 'Poetry Editor',
            'Editor', 'Copy Editor', 'Line Editor', 'Proofreader', 'Fact Checker',
            'Beta Reader', 'Sensitivity Reader', 'Continuity Editor', 'Series Bible Creator', 'Character Developer',
            'Writing Coach', 'Writing Workshop Host', 'Writing Course Creator', 'NaNoWriMo Coach', 'Creativity Coach',
            'Literary Agent Assistant', 'Query Letter Writer', 'Synopsis Writer', 'Book Proposal Writer', 'Publishing Consultant'
        ],
        skills: [
            ['Creative Writing', 'Storytelling', 'Imagination'],
            ['Editing', 'Proofreading', 'Grammar'],
            ['Research', 'Fact-Checking', 'Documentation'],
            ['Genre Knowledge', 'Market Awareness', 'Trends'],
            ['Self-Discipline', 'Time Management', 'Productivity']
        ]
    },
    'Design': {
        titles: [
            'UI Designer', 'UX Designer', 'Product Designer', 'Interaction Designer', 'Visual Designer',
            'Web Designer', 'App Designer', 'Dashboard Designer', 'SaaS Designer', 'Landing Page Designer',
            'Brand Designer', 'Logo Designer', 'Brand Identity Designer', 'Brand Guidelines Creator', 'Visual Identity Designer',
            'Print Designer', 'Brochure Designer', 'Catalog Designer', 'Magazine Designer', 'Book Designer',
            'Packaging Designer', 'Label Designer', 'Box Designer', 'Bottle Designer', 'Sustainable Packaging Designer',
            'Motion Designer', 'Animation Designer', 'Lottie Animation Creator', 'Micro-Interaction Designer', 'Loading Animation Designer',
            'Icon Designer', 'Iconography Specialist', 'System Icon Designer', 'App Icon Designer', 'Emoji Designer',
            'Illustration Designer', 'Digital Illustrator', 'Vector Illustrator', 'Character Illustrator', 'Editorial Illustrator',
            'Infographic Designer', 'Data Visualization Designer', 'Chart Designer', 'Diagram Creator', 'Process Flow Designer',
            'Presentation Designer', 'Pitch Deck Designer', 'Keynote Designer', 'PowerPoint Expert', 'Google Slides Designer',
            'Social Media Designer', 'Instagram Post Designer', 'Story Designer', 'Ad Creative Designer', 'Carousel Designer',
            'Design System Creator', 'Component Library Designer', 'Style Guide Creator', 'Pattern Library Designer', 'Figma Library Manager'
        ],
        skills: [
            ['Figma', 'Sketch', 'Adobe XD'],
            ['UI Design', 'UX Design', 'Prototyping'],
            ['Visual Design', 'Typography', 'Color Theory'],
            ['Brand Design', 'Identity', 'Guidelines'],
            ['Motion Design', 'Animation', 'Interaction']
        ]
    }
};

// Earning potential ranges and tiers
const EARNING_RANGES = {
    'Beginner Tier': [
        '$100 - $500/mo', '$200 - $600/mo', '$300 - $700/mo', '$50 - $300/mo', '$150 - $450/mo',
        '$10 - $25/hr', '$15 - $30/hr', '$20 - $40/hr', '$50 - $200/project', '$100 - $400/project'
    ],
    'Intermediate Tier': [
        '$500 - $2000/mo', '$800 - $2500/mo', '$1000 - $3000/mo', '$1500 - $3500/mo', '$2000 - $4000/mo',
        '$30 - $60/hr', '$40 - $75/hr', '$50 - $100/hr', '$200 - $800/project', '$500 - $1500/project'
    ],
    'Advanced Tier': [
        '$3000 - $8000/mo', '$5000 - $10000/mo', '$6000 - $15000/mo', '$8000 - $20000/mo', '$10000+/mo',
        '$80 - $150/hr', '$100 - $200/hr', '$150 - $300/hr', '$1000 - $5000/project', '$2500 - $10000/project'
    ]
};

// Generate descriptions based on title
const generateDescription = (title: string, category: string): string => {
    const descTemplates = [
        `Provide professional ${title.toLowerCase()} services to clients worldwide.`,
        `Help businesses and individuals with expert ${title.toLowerCase()} work.`,
        `Offer remote ${title.toLowerCase()} services with flexible scheduling.`,
        `Build a career as a ${title.toLowerCase()} working with diverse clients.`,
        `Leverage your skills as a ${title.toLowerCase()} for consistent income.`
    ];
    return descTemplates[Math.floor(Math.random() * descTemplates.length)];
};

// Generate all 1200 hustles
const generateHustles = (): HustleIdea[] => {
    const hustles: HustleIdea[] = [];
    let id = 1;
    const difficulties: Array<'Beginner' | 'Intermediate' | 'Advanced'> = ['Beginner', 'Intermediate', 'Advanced'];
    const earningTiers: Array<'Beginner Tier' | 'Intermediate Tier' | 'Advanced Tier'> = ['Beginner Tier', 'Intermediate Tier', 'Advanced Tier'];

    CATEGORIES.forEach(category => {
        const templates = HUSTLE_TEMPLATES[category];
        if (!templates) return;

        templates.titles.forEach((title, index) => {
            // Rotate through difficulties and earning tiers
            const difficulty = difficulties[index % 3];
            const earningTier = earningTiers[index % 3];
            const earningOptions = EARNING_RANGES[earningTier];
            const earningPotential = earningOptions[index % earningOptions.length];
            const skills = templates.skills[index % templates.skills.length];

            hustles.push({
                id: id++,
                title,
                category,
                difficulty,
                earningPotential,
                earningTier,
                skills,
                description: generateDescription(title, category)
            });
        });
    });

    return hustles;
};

export const HUSTLE_DATA: HustleIdea[] = generateHustles();
export { CATEGORIES };
