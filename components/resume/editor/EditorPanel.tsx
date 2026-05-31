import React from 'react';
import HeaderForm from './forms/HeaderForm';
import SummaryForm from './forms/SummaryForm';
import ExperienceForm from './forms/ExperienceForm';
import SkillsForm from './forms/SkillsForm';
import EducationForm from './forms/EducationForm';

const EditorPanel: React.FC = () => {
    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-transparent space-y-8 scrollbar-hide pb-32">

            <div className="bg-blue-500/10 backdrop-blur-md p-4 rounded-xl border border-blue-500/20 mb-6">
                <h2 className="text-sm font-bold text-blue-300 mb-1 font-heading">Strict <span className="font-signature text-base text-cyan-300">Mode</span> Active</h2>
                <p className="text-xs text-blue-400/80 leading-relaxed">
                    The editor enforces ATS-compliant data. Design options are limited to ensure 100% parsability.
                </p>
            </div>

            <section>
                <HeaderForm />
            </section>

            <section>
                <SummaryForm />
            </section>

            <hr className="border-white/10" />

            <section>
                <ExperienceForm />
            </section>

            <section>
                <EducationForm />
            </section>

            <section>
                <SkillsForm />
            </section>

        </div>
    );
};

export default EditorPanel;
