import React, { useEffect } from 'react';
import { useResumeStore } from '../../../../store/useResumeStore';

const ATSParserSimulator: React.FC = () => {
    const { resume } = useResumeStore();
    const { header, summary, experience, education, skills } = resume;

    // This component renders a hidden text-only version of the resume
    // and calculates parsing integrity score based on regex extraction
    // mimicking a real ATS (like Taleo or Greenhouse)

    useEffect(() => {
        // Run simulation logic
        // For now we just log to console, but in future this will update the store's ATS score
        console.log("Running ATS Simulation...");
    }, [resume]);

    return (
        <div className="hidden" aria-hidden="true" id="ats-parser-text">
            {header.fullName}
            {header.email}
            {header.phone}
            {summary}
            {experience.map(e => `${e.role} ${e.company} ${e.bullets.map(b => b.text).join(' ')}`).join(' ')}
            {education.map(e => `${e.degree} ${e.school}`).join(' ')}
            {skills.map(s => s.name).join(' ')}
        </div>
    );
};

export default ATSParserSimulator;
