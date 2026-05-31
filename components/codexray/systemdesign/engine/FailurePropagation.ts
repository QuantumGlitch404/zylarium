
import { SystemDesign, FailureImpact } from '../types';
import { runSimulation } from './SimulationEngine';

export const simulateFailure = (design: SystemDesign, failedComponentId: string): FailureImpact => {
    // 1. Baseline
    const baseline = runSimulation(design, { duration: 30, loadMultiplier: 1 });

    // 2. Clone and Fail
    // In a real app we'd need deep clone. JSON parse/stringify is poor mans clone but works for simple data.
    const failedDesign: SystemDesign = JSON.parse(JSON.stringify(design));
    const target = failedDesign.components.find(c => c.id === failedComponentId);
    if (target) {
        target.properties.failureRate = 100; // 100% failure
    }

    // 3. Run Failure Sim
    const failureResults = runSimulation(failedDesign, { duration: 30, loadMultiplier: 1 });

    // 4. Analyze Impact
    let cascadeDepth = 0; // Logic to calculate depth of impact

    // Simple diff of failing components
    const baselineFailures = new Set(Array.from(baseline.componentMetrics.values()).filter(m => m.requestsFailed > 0).map(m => m.componentId));
    const newFailures = Array.from(failureResults.componentMetrics.values())
        .filter(m => m.requestsFailed > 0 && !baselineFailures.has(m.componentId))
        .map(m => m.componentId);

    return {
        failedComponent: failedComponentId,
        baseline: {
            successRate: baseline.summary.successRate,
            p99Latency: baseline.summary.latency.p99
        },
        withFailure: {
            successRate: failureResults.summary.successRate,
            p99Latency: failureResults.summary.latency.p99
        },
        impactedComponents: newFailures,
        cascadeDepth,
        recommendations: [
            target?.type === 'sql-database' ? 'Add read replicas for failover.' : 'Implement circuit breakers.'
        ]
    };
};
