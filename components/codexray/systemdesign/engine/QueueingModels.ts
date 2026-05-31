
// M/M/1 and M/M/c Queueing Theory Models
// Used for approximating system performance

// M/M/1 Queue: Single server, Poisson arrival, Exponential service time
export const calculateMM1 = (arrivalRate: number, serviceRate: number) => {
    // arrivalRate = lambda (req/s)
    // serviceRate = mu (req/s)

    if (arrivalRate <= 0) return { utilization: 0, avgQueueLength: 0, avgWaitTime: 0, avgResponseTime: 1 / serviceRate };
    if (serviceRate <= 0) return { utilization: 1, avgQueueLength: Infinity, avgWaitTime: Infinity, avgResponseTime: Infinity };

    const utilization = arrivalRate / serviceRate; // rho

    // Stability condition: rho < 1
    if (utilization >= 1) {
        return {
            utilization: 1, // Caps at 100%
            avgQueueLength: 100, // Arbitrary high number for unstable
            avgWaitTime: 10000,
            avgResponseTime: 10000
        };
    }

    const avgQueueLength = (utilization * utilization) / (1 - utilization); // Lq
    const avgWaitTime = utilization / (serviceRate * (1 - utilization)); // Wq
    const avgResponseTime = 1 / (serviceRate - arrivalRate); // W = Wq + 1/mu

    return {
        utilization,
        avgQueueLength,
        avgWaitTime,
        avgResponseTime
    };
};

// M/M/c Queue: Multiple servers (c), Poisson arrival, Exponential service time
export const calculateMMc = (arrivalRate: number, serviceRate: number, servers: number) => {
    // arrivalRate = lambda
    // serviceRate = mu per server
    // servers = c

    if (arrivalRate <= 0) return { utilization: 0, avgQueueLength: 0, avgWaitTime: 0, avgResponseTime: 1 / serviceRate };
    if (serviceRate <= 0) return { utilization: 1, avgQueueLength: Infinity, avgWaitTime: Infinity, avgResponseTime: Infinity };

    const utilization = arrivalRate / (servers * serviceRate); // rho

    if (utilization >= 1) {
        return {
            utilization: 1,
            avgQueueLength: 100 * servers,
            avgWaitTime: 10000,
            avgResponseTime: 10000
        };
    }

    // Calculate P0 (Probability of 0 items in system)
    let sum = 0;
    const r = arrivalRate / serviceRate;

    for (let n = 0; n < servers; n++) {
        sum += Math.pow(r, n) / factorial(n);
    }

    const term2 = (Math.pow(r, servers) / factorial(servers)) * (1 / (1 - utilization));
    const p0 = 1 / (sum + term2);

    // Calculate Lq (Average queue length)
    const avgQueueLength = (Math.pow(r, servers) * utilization * p0) / (factorial(servers) * Math.pow(1 - utilization, 2));

    // Calculate Wq (Average wait in queue)
    const avgWaitTime = avgQueueLength / arrivalRate; // Little's Law

    // Calculate W (Total response time)
    const avgResponseTime = avgWaitTime + (1 / serviceRate);

    return {
        utilization,
        avgQueueLength,
        avgWaitTime,
        avgResponseTime
    };
};

// Helper for factorial
const factorial = (n: number): number => {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
};

// Sample processing time from exponential distribution
// meanMs = mean processing time in milliseconds
export const sampleProcessingTime = (meanMs: number): number => {
    // Time = -ln(U) * mean
    return -Math.log(Math.random()) * meanMs;
};

export const isStable = (arrivalRate: number, serviceRate: number, servers: number = 1): boolean => {
    return (arrivalRate / (servers * serviceRate)) < 1;
};
