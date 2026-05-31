import React from 'react';
import Typewriter from 'typewriter-effect';

export const HeroTypewriter: React.FC = () => {
    return (
        <div className="text-4xl md:text-6xl font-bold font-heading bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent min-h-[80px]">
            <Typewriter
                options={{
                    strings: [
                        'Precision Architecture.',
                        'Unlimited Potential.',
                        'System Design Visualized.',
                        'The Future of Tools.'
                    ],
                    autoStart: true,
                    loop: true,
                    delay: 50,
                    deleteSpeed: 30,
                }}
            />
        </div>
    );
};
