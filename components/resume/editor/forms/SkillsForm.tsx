import React, { useState } from 'react';
import { useResumeStore } from '../../../../store/useResumeStore';
import { Wrench, Plus, X, Star } from 'lucide-react';

const SkillsForm: React.FC = () => {
    const { resume, addSkill, removeSkill } = useResumeStore();
    const { skills } = resume;
    const [newSkill, setNewSkill] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSkill.trim()) {
            addSkill(newSkill.trim());
            setNewSkill('');
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden mt-6">
            <div className="p-4 bg-white/5 border-b border-white/10">
                <h3 className="font-bold flex items-center gap-2 text-white font-heading">
                    <Wrench className="w-4 h-4 text-primary-400" /> <span className="font-signature text-base text-cyan-300">Skills</span>
                </h3>
            </div>

            <div className="p-4">
                <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                    <input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/10 transition-all"
                        placeholder="Add a skill (e.g. React, Python)"
                    />
                    <button
                        type="submit"
                        disabled={!newSkill.trim()}
                        className="px-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </form>

                <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                        <div key={skill.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md text-white rounded-xl text-sm group border border-white/10 hover:border-primary-500/50 hover:bg-white/15 transition-all">
                            <span>{skill.name}</span>
                            <button
                                onClick={() => removeSkill(skill.id)}
                                className="text-gray-400 hover:text-red-400 ml-1 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {skills.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No skills added yet. Add at least 5 strict skills.</p>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1.5">
                        <span>Skill <span className="font-signature text-cyan-300">Strength</span>:</span>
                        <span className={skills.length > 8 ? 'text-green-400' : 'text-orange-400'}>
                            {skills.length} / 10-15 recommended
                        </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 backdrop-blur-md rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${skills.length > 8 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`}
                            style={{ width: `${Math.min(100, (skills.length / 12) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillsForm;
