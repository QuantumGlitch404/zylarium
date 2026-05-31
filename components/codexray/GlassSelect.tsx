import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface GlassSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    icon,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full bg-black/30 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5 hover:border-white/20 transition-all ${isOpen ? 'ring-1 ring-primary-500/50 border-primary-500/50' : ''}`}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <span className="font-medium truncate">{selectedLabel}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[140px] max-h-60 overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xl border border-white/15 rounded-lg shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${isSelected
                                            ? 'bg-primary-500/20 text-primary-200'
                                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <span>{option.label}</span>
                                    {isSelected && <Check className="w-3 h-3 text-primary-400" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
