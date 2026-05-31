
import { SimulationResults, Bottleneck, Component, ComponentMetrics } from '../types';

export const detectBottlenecks = (results: SimulationResults, design: { components: Component[] }): Bottleneck[] => {
    const bottlenecks: Bottleneck[] = [];

    results.componentMetrics.forEach((metrics, componentId) => {
        const component = design.components.find(c => c.id === componentId);
        if (!component) return;

        // 1. Capacity / Utilization Check
        if (metrics.utilization > 0.70) {
            const isCritical = metrics.utilization > 0.90;
            bottlenecks.push({
                componentId,
                componentName: component.name,
                severity: isCritical ? 'critical' : 'warning',
                type: 'capacity',
                metric: 'utilization',
                currentValue: metrics.utilization,
                threshold: 0.70,
                description: `${component.name} is at ${(metrics.utilization * 100).toFixed(1)}% utilization.`,
                recommendation: isCritical
                    ? 'Immediate Action: Add replicas or increase capacity.'
                    : 'Warning: Approaching capacity limits.'
            });
        }

        // 2. Queue Length Check
        const queueThreshold = 50; // Arbitrary for now, sensitive to concurrency
        if (metrics.avgQueueLength > queueThreshold) {
            bottlenecks.push({
                componentId,
                componentName: component.name,
                severity: 'warning',
                type: 'queue',
                metric: 'avgQueueLength',
                currentValue: metrics.avgQueueLength,
                threshold: queueThreshold,
                description: `Queue buildup detected (${metrics.avgQueueLength.toFixed(0)} requests).`,
                recommendation: 'Increase concurrency limit or process faster.'
            });
        }

        // 3. Latency Check
        const latencyThreshold = component.properties.timeoutMs * 0.7;
        if (metrics.avgLatencyMs > latencyThreshold) {
            bottlenecks.push({
                componentId,
                componentName: component.name,
                severity: 'warning',
                type: 'latency',
                metric: 'avgLatencyMs',
                currentValue: metrics.avgLatencyMs,
                threshold: latencyThreshold,
                description: `High latency (${metrics.avgLatencyMs.toFixed(0)}ms).`,
                recommendation: 'Optimize processing or add caching.'
            });
        }
    });

    return bottlenecks;
};
