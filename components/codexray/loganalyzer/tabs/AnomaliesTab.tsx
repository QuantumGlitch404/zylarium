// Anomalies Tab - Bursts, spikes, and outliers

import React from 'react';
import { AlertTriangle, TrendingUp, Users, Zap, BarChart2 } from 'lucide-react';
import { AnalysisResult, Anomaly, AnomalyType } from '../types';

interface AnomaliesTabProps {
    result: AnalysisResult;
    onViewFingerprint: (fingerprintId: string) => void;
    onViewSession: (sessionId: string) => void;
}

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 ${className}`}>
        {children}
    </div>
);

const ANOMALY_ICONS: Record<AnomalyType, React.ReactNode> = {
    'error_burst': <Zap className="w-5 h-5" />,
    'frequency_spike': <TrendingUp className="w-5 h-5" />,
    'unusual_session': <Users className="w-5 h-5" />,
    'pattern_change': <BarChart2 className="w-5 h-5" />,
};

const ANOMALY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    'HIGH': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    'MEDIUM': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    'LOW': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
};

const AnomalyCard: React.FC<{
    anomaly: Anomaly;
    onViewFingerprint: (id: string) => void;
    onViewSession: (id: string) => void;
}> = ({ anomaly, onViewFingerprint, onViewSession }) => {
    const colors = ANOMALY_COLORS[anomaly.severity];
    const icon = ANOMALY_ICONS[anomaly.type];

    return (
        <GlassPanel className={`p-4 ${colors.bg} ${colors.border}`}>
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                    {icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">{anomaly.description}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {anomaly.severity}
                        </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-3">{anomaly.details}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                            <span className="text-gray-500">Time:</span>
                            <span className="text-white ml-2">{anomaly.timestamp.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="text-white ml-2">
                                {Math.round((anomaly.timeRange.end.getTime() - anomaly.timeRange.start.getTime()) / 1000)}s
                            </span>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex gap-4 text-xs text-gray-500 mb-3">
                        <span>Observed: <strong className="text-white">{anomaly.metrics.observed}</strong></span>
                        <span>Expected: <strong className="text-white">{anomaly.metrics.expected.toFixed(0)}</strong></span>
                        <span>Deviation: <strong className={colors.text}>{anomaly.metrics.deviation > 0 ? '+' : ''}{anomaly.metrics.deviation.toFixed(0)}</strong></span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {anomaly.relatedFingerprint && (
                            <button
                                onClick={() => onViewFingerprint(anomaly.relatedFingerprint!)}
                                className="px-3 py-1 text-xs bg-white/10 rounded hover:bg-white/20 text-gray-300"
                            >
                                View Error Pattern
                            </button>
                        )}
                        {anomaly.relatedSession && (
                            <button
                                onClick={() => onViewSession(anomaly.relatedSession!)}
                                className="px-3 py-1 text-xs bg-white/10 rounded hover:bg-white/20 text-gray-300"
                            >
                                View Session
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </GlassPanel>
    );
};

export const AnomaliesTab: React.FC<AnomaliesTabProps> = ({ result, onViewFingerprint, onViewSession }) => {
    const { anomalies } = result;

    // Group by type
    const burstAnomalies = anomalies.filter(a => a.type === 'error_burst');
    const spikeAnomalies = anomalies.filter(a => a.type === 'frequency_spike');
    const sessionAnomalies = anomalies.filter(a => a.type === 'unusual_session');
    const patternAnomalies = anomalies.filter(a => a.type === 'pattern_change');

    // Also get anomalous sessions from result.sessions
    const anomalousSessions = Array.from(result.sessions.values()).filter(s => s.isAnomaly);

    if (anomalies.length === 0 && anomalousSessions.length === 0) {
        return (
            <GlassPanel className="p-12 text-center">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-bold text-white mb-2">No Anomalies Detected</h3>
                <p className="text-gray-400">Your logs appear to be within normal parameters.</p>
            </GlassPanel>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <GlassPanel className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold text-white">Anomaly Detection Summary</h3>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-red-400">{burstAnomalies.length}</div>
                        <div className="text-xs text-gray-500">Error Bursts</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">{spikeAnomalies.length}</div>
                        <div className="text-xs text-gray-500">Frequency Spikes</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-orange-400">{anomalousSessions.length}</div>
                        <div className="text-xs text-gray-500">Unusual Sessions</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-purple-400">{patternAnomalies.length}</div>
                        <div className="text-xs text-gray-500">Pattern Changes</div>
                    </div>
                </div>
            </GlassPanel>

            {/* Error Bursts */}
            {burstAnomalies.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-red-400" />
                        <h3 className="font-bold text-white">Error Bursts ({burstAnomalies.length})</h3>
                    </div>
                    <div className="space-y-3">
                        {burstAnomalies.map(a => (
                            <AnomalyCard
                                key={a.id}
                                anomaly={a}
                                onViewFingerprint={onViewFingerprint}
                                onViewSession={onViewSession}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Frequency Spikes */}
            {spikeAnomalies.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                        <h3 className="font-bold text-white">Frequency Spikes ({spikeAnomalies.length})</h3>
                    </div>
                    <div className="space-y-3">
                        {spikeAnomalies.map(a => (
                            <AnomalyCard
                                key={a.id}
                                anomaly={a}
                                onViewFingerprint={onViewFingerprint}
                                onViewSession={onViewSession}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Unusual Sessions */}
            {anomalousSessions.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-orange-400" />
                        <h3 className="font-bold text-white">Unusual Sessions ({anomalousSessions.length})</h3>
                    </div>
                    <div className="space-y-3">
                        {anomalousSessions.map(session => (
                            <GlassPanel
                                key={session.id}
                                className="p-4 bg-orange-500/10 border-orange-500/30 cursor-pointer hover:bg-orange-500/20 transition-colors"
                                onClick={() => onViewSession(session.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-medium text-white font-mono">{session.id.substring(0, 20)}...</h4>
                                        <p className="text-sm text-gray-400 mt-1">{session.anomalyReason}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                            <span>Errors: <strong className="text-red-400">{session.eventsByLevel.error}</strong></span>
                                            <span>Z-Score: <strong className="text-orange-400">{session.zScore?.toFixed(1)}</strong></span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">OUTLIER</span>
                                </div>
                            </GlassPanel>
                        ))}
                    </div>
                </div>
            )}

            {/* Pattern Changes */}
            {patternAnomalies.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart2 className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-white">Pattern Changes ({patternAnomalies.length})</h3>
                    </div>
                    <div className="space-y-3">
                        {patternAnomalies.map(a => (
                            <AnomalyCard
                                key={a.id}
                                anomaly={a}
                                onViewFingerprint={onViewFingerprint}
                                onViewSession={onViewSession}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnomaliesTab;
