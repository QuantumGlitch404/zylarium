
import { SystemDesign, StressTestResults } from '../types';
import { runSimulation } from './SimulationEngine';
import { detectBottlenecks } from './BottleneckDetector';

export const runStressTest = (design: SystemDesign): StressTestResults => {
    const chartData = [];
    let breakingPoint = 11; // Default if not found (max tested 10x)

    // Sweep from 1x to 10x
    for (let load = 1; load <= 10; load += 1) {
        const results = runSimulation(design, {
            duration: 10, // Short duration for fast sweep
            loadMultiplier: load
        });

        const bottlenecks = detectBottlenecks(results, design);

        // Check for "System Failure" condition (e.g. success rate drop)
        if (results.summary.successRate < 0.95 && breakingPoint === 11) {
            breakingPoint = load;
        }

        chartData.push({
            loadMultiplier: load,
            successRate: results.summary.successRate,
            p99Latency: results.summary.latency.p99,
            bottlenecks
        });
    }

    return {
        breakingPoint,
        componentLimits: [], // Todo: analyze specific component saturation
        chart: chartData
    };
};
