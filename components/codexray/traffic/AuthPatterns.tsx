
import React from 'react';
import { AuthInfo } from './types';
import { Shield, Key, Database, ArrowRight, Lock, Server } from 'lucide-react';

interface AuthPatternsProps {
    auth: AuthInfo[];
}

export default function AuthPatterns({ auth }: AuthPatternsProps) {

    if (auth.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
                <Shield className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">No explicit authentication patterns detected.</p>
                <p className="text-sm">This project might use cookies automatically or handles auth in a way we didn't catch.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1">
            <h3 className="text-white font-medium mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Authentication Flow Analysis
            </h3>

            <div className="space-y-8">
                {auth.map((pattern, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                        {/* Background Flow Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-y-1/2" />

                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">

                            {/* Step 1: Storage */}
                            <div className="flex flex-col items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5 w-full md:w-1/3 z-10">
                                <div className="p-3 bg-amber-500/10 rounded-full text-amber-400">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-sm font-bold text-white">Storage</h4>
                                    <code className="text-xs text-white/50 block mt-1 px-2 py-0.5 bg-white/5 rounded">
                                        {pattern.tokenSource?.storage || 'Unknown'}
                                    </code>
                                    <div className="text-[10px] text-white/40 mt-2 font-mono break-all">
                                        Key: "{pattern.tokenSource?.key}"
                                    </div>
                                </div>
                            </div>

                            <ArrowRight className="w-6 h-6 text-white/20 rotate-90 md:rotate-0" />

                            {/* Step 2: Mechanism */}
                            <div className="flex flex-col items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5 w-full md:w-1/3 z-10 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                                <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
                                    <Key className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-sm font-bold text-white">Retrieval Mechanism</h4>
                                    <p className="text-xs text-white/60 mt-1">
                                        {pattern.type === 'bearer' ? 'Bearer Token' : 'Cookie / Header'}
                                    </p>
                                    <code className="text-[10px] text-white/40 mt-2 block bg-white/5 p-1 rounded">
                                        {pattern.tokenSource?.retrievalCode.substring(0, 30)}...
                                    </code>
                                </div>
                            </div>

                            <ArrowRight className="w-6 h-6 text-white/20 rotate-90 md:rotate-0" />

                            {/* Step 3: Usage */}
                            <div className="flex flex-col items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5 w-full md:w-1/3 z-10">
                                <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                                    <Server className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-sm font-bold text-white">API Usage</h4>
                                    <p className="text-xs text-white/60 mt-1">
                                        Included in Requests
                                    </p>
                                    <div className="mt-2 flex items-center justify-center gap-2">
                                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                                            Protected Endpoints
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Code Snippet for Source */}
                        {pattern.tokenSource && (
                            <div className="mt-6 pt-4 border-t border-white/5">
                                <p className="text-xs text-white/40 mb-2">Detected in <span className="text-white/60 font-mono">{pattern.tokenSource.locations[0].filePath}</span>:</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
