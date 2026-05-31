
import React, { useState, useEffect } from 'react';
import { InterviewSession } from '../types';
import { Timer, CheckSquare, HelpCircle, Pause, Play, Square } from 'lucide-react';

interface InterviewModeProps {
    session: InterviewSession;
    onUpdateSession: (session: InterviewSession) => void;
}

export const InterviewMode: React.FC<InterviewModeProps> = ({ session, onUpdateSession }) => {
    const [timeLeft, setTimeLeft] = useState(session.timeLimit * 60 - session.elapsedTime);
    const [isActive, setIsActive] = useState(session.status === 'active');

    useEffect(() => {
        let interval: any;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => {
                    const newTime = time - 1;
                    onUpdateSession({ ...session, elapsedTime: session.timeLimit * 60 - newTime });
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, session.status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
        onUpdateSession({ ...session, status: !isActive ? 'active' : 'paused' });
    };

    return (
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 h-full flex flex-col">
            <div className="mb-6 bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Time Remaining</div>
                <div className={`text-4xl font-mono font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                </div>
                <div className="mt-4 flex justify-center gap-2">
                    <button
                        onClick={toggleTimer}
                        className={`p-2 rounded-lg ${isActive ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'} text-white transition-colors`}
                    >
                        {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button className="p-2 bg-red-900/50 hover:bg-red-900/80 text-red-200 rounded-lg">
                        <Square className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-white mb-2">Problem Statement</h3>
                    <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                        {session.problem}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-white mb-2">Checkpoints</h3>
                    <div className="space-y-2">
                        {session.checkpoints.map((cp, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${cp.completed ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                                    {cp.completed && <CheckSquare className="w-3 h-3 text-white" />}
                                </div>
                                <span className={cp.completed ? 'text-green-400 line-through' : 'text-gray-300'}>
                                    {cp.name} ({cp.time}m)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-white mb-2">Hints</h3>
                    <div className="space-y-2">
                        {session.hints.map((hint, i) => (
                            <div key={i} className="group relative">
                                <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-750 transition-colors group-hover:opacity-0 z-10">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <HelpCircle className="w-3 h-3" /> Reveal Hint {i + 1}
                                    </span>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 text-sm text-indigo-300">
                                    {hint}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
