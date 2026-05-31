import { ResumeRoot, ATSMetadata } from '../resumeTypes';

const ACTION_VERBS = [
    'Led', 'Managed', 'Developed', 'Created', 'Designed', 'Implemented', 'Optimized', 'Achieved',
    'Increased', 'Decreased', 'Saved', 'Generated', 'Launched', 'Built', 'Engineered', 'Orchestrated',
    'Spearheaded', 'Directed', 'Supervised', 'Coordinated', 'Executed', 'Streamlined', 'Transformed'
];

export const calculateATSScore = (resume: ResumeRoot): ATSMetadata => {
    let parsingScore = 100;
    let keywordScore = 0; // Starts at 0, builds up
    let structureScore = 100;
    let formattingScore = 100;
    const warnings: string[] = [];
    const tips: string[] = [];

    // --- 1. Structure Check (Critical) ---
    if (!resume.header.email) {
        structureScore -= 20;
        warnings.push("Missing Email Address (Critical)");
    }
    if (!resume.header.phone) {
        structureScore -= 20;
        warnings.push("Missing Phone Number");
    }
    if (!resume.header.city) {
        structureScore -= 10;
        warnings.push("Missing Location (City/Country)");
    }
    if (!resume.summary || resume.summary.length < 50) {
        structureScore -= 10;
        tips.push("Summary is too short. Aim for 3-4 lines.");
    }
    if (resume.experience.length === 0) {
        structureScore -= 30;
        warnings.push("No Experience listed");
    }

    // --- 2. Formatting Check (Safety) ---
    // Since we enforce strict inputs, formatting is generally safe, but we check content
    const hasSpecialChars = /[^\x00-\x7F]+/.test(JSON.stringify(resume)); // crude check for non-ascii
    if (hasSpecialChars) {
        // actually modern ATS handles some unicode, but let's be strict
        // formattingScore -= 5; 
        // tips.push("Avoid special characters or icons.");
    }

    // --- 3. Content / Parsing Quality ---
    resume.experience.forEach(exp => {
        exp.bullets.forEach(bullet => {
            const words = bullet.text.split(/\s+/);
            if (words.length < 5) {
                parsingScore -= 2;
                warnings.push(`Bullet too short: "${bullet.text.substring(0, 20)}..."`);
            }

            // Check for Action Verb
            const firstWord = words[0]?.replace(/[^a-zA-Z]/g, '');
            if (firstWord && !ACTION_VERBS.some(v => v.toLowerCase() === firstWord.toLowerCase())) {
                parsingScore -= 2;
                // Don't warn for every single one to avoid spam, but deduct score
            }

            // Check for Metrics (Numbers)
            if (!/\d+/.test(bullet.text)) {
                parsingScore -= 1;
            }
        });
    });

    // --- 4. Keyword Match (Simulated for now, would match against Target Job) ---
    const skillCount = resume.skills.length;
    if (skillCount < 5) {
        keywordScore = 20;
        warnings.push("Add more skills (at least 5)");
    } else if (skillCount < 10) {
        keywordScore = 60;
    } else {
        keywordScore = 100;
    }

    // Normalize Scores
    parsingScore = Math.max(0, parsingScore);
    structureScore = Math.max(0, structureScore);

    // Weighted Total
    // Parsing: 30%, Structure: 30%, Keywords: 30%, Formatting: 10%
    const totalScore = Math.round(
        (parsingScore * 0.3) +
        (structureScore * 0.3) +
        (keywordScore * 0.3) +
        (formattingScore * 0.1)
    );

    return {
        parsingScore,
        structureScore,
        keywordScore,
        formattingScore,
        totalScore,
        warnings,
        tips
    };
};
