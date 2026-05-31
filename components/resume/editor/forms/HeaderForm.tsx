import React from 'react';
import { useResumeStore } from '../../../../store/useResumeStore';
import { User, Mail, Phone, MapPin, Linkedin, Globe, Github } from 'lucide-react';

const HeaderForm: React.FC = () => {
    const { resume, updateHeader } = useResumeStore();
    const { header } = resume;

    const inputClass = "w-full p-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/10 transition-all";
    const labelClass = "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1";

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10">
                <h3 className="font-bold flex items-center gap-2 text-white font-heading">
                    <User className="w-4 h-4 text-primary-400" /> Header <span className="font-signature text-base text-cyan-300">Information</span>
                </h3>
            </div>

            <div className="p-4 space-y-4">
                {/* Full Name */}
                <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                        type="text"
                        value={header.fullName}
                        onChange={(e) => updateHeader('fullName', e.target.value)}
                        placeholder="e.g. John Doe"
                        className={inputClass + " font-medium"}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                        <label className={labelClass}>
                            <Mail className="w-3 h-3" /> Email
                        </label>
                        <input
                            type="email"
                            value={header.email}
                            onChange={(e) => updateHeader('email', e.target.value)}
                            placeholder="john@example.com"
                            className={inputClass}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={labelClass}>
                            <Phone className="w-3 h-3" /> Phone
                        </label>
                        <input
                            type="tel"
                            value={header.phone}
                            onChange={(e) => updateHeader('phone', e.target.value)}
                            placeholder="(555) 123-4567"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* City */}
                    <div>
                        <label className={labelClass}>
                            <MapPin className="w-3 h-3" /> City
                        </label>
                        <input
                            type="text"
                            value={header.city}
                            onChange={(e) => updateHeader('city', e.target.value)}
                            placeholder="New York"
                            className={inputClass}
                        />
                    </div>
                    {/* Country */}
                    <div>
                        <label className={labelClass}>
                            <Globe className="w-3 h-3" /> Country
                        </label>
                        <input
                            type="text"
                            value={header.country}
                            onChange={(e) => updateHeader('country', e.target.value)}
                            placeholder="USA"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Links */}
                <div>
                    <label className={labelClass}>
                        <Linkedin className="w-3 h-3" /> LinkedIn URL <span className="text-red-400 text-[10px] ml-auto normal-case font-normal">*Required for tech roles</span>
                    </label>
                    <input
                        type="url"
                        value={header.linkedin || ''}
                        onChange={(e) => updateHeader('linkedin', e.target.value)}
                        placeholder="linkedin.com/in/johndoe"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>
                        <Github className="w-3 h-3" /> GitHub / Portfolio
                    </label>
                    <input
                        type="url"
                        value={header.github || ''}
                        onChange={(e) => updateHeader('github', e.target.value)}
                        placeholder="github.com/johndoe"
                        className={inputClass}
                    />
                </div>

            </div>
        </div>
    );
};

export default HeaderForm;
