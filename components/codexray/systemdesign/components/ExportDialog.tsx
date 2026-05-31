
import React from 'react';
import { X, Image, FileJson } from 'lucide-react';
import { SystemDesign } from '../types';
import { exportImage } from '../utils/exportUtils';

interface ExportDialogProps {
    design: SystemDesign;
    isOpen: boolean;
    onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ design, isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleExportPNG = async () => {
        await exportImage(design, 'png');
        onClose();
    };

    const handleExportJSON = () => {
        exportImage(design, 'json');
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl p-6 w-96 animate-in zoom-in-95 duration-200 shadow-2xl shadow-indigo-900/50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Export Design</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button onClick={handleExportPNG} className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-xl hover:bg-indigo-500/20 rounded-xl border border-white/10 hover:border-indigo-400/30 transition-all group hover:shadow-lg hover:shadow-indigo-500/10">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20">
                            <Image className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-white">Export as PNG</div>
                            <div className="text-xs text-gray-500">High resolution image</div>
                        </div>
                    </button>

                    <button onClick={handleExportJSON} className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-xl hover:bg-green-500/20 rounded-xl border border-white/10 hover:border-green-400/30 transition-all group hover:shadow-lg hover:shadow-green-500/10">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-lg group-hover:bg-green-500/20">
                            <FileJson className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-white">Export as JSON</div>
                            <div className="text-xs text-gray-500">Data format for backup</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
