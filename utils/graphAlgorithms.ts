import { DependencyGraph, FileNode } from './codeProcessor';

export interface SimulationNode extends FileNode {
    x: number;
    y: number;
    vx: number;
    vy: number;
    centrality: number;
    description?: string; // e.g. "Core Util"
    risk: 'low' | 'medium' | 'high';
}

export const analyzeGraph = (graph: DependencyGraph, width: number, height: number): SimulationNode[] => {
    // 1. Calculate Centrality (Degree Centrality for simplicity)
    // In-Degree = Fan-in (How many files import me?) -> High = Core/Shared
    // Out-Degree = Fan-out (How many files do I import?) -> High = Coordinator/Controller

    const inDegree: Record<string, number> = {};
    const outDegree: Record<string, number> = {};

    graph.nodes.forEach(n => { inDegree[n.id] = 0; outDegree[n.id] = 0; });
    graph.edges.forEach(e => {
        outDegree[e.source] = (outDegree[e.source] || 0) + 1;
        inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    });

    // 2. Cycle Detection (DFS)
    // Simple cycle check for visualization emphasis
    const cyclicNodes = new Set<string>();
    // (Skipping full cycle detection implementation for brevity in this step, defaulting to Centrality logic)

    // 3. Initialize Simulation Nodes
    return graph.nodes.map(node => {
        const dIn = inDegree[node.id] || 0;
        const dOut = outDegree[node.id] || 0;

        let risk: 'low' | 'medium' | 'high' = 'low';
        if (dIn > 5 && dOut > 5) risk = 'high'; // God object?
        if (dIn === 0 && dOut === 0) risk = 'low'; // Orphan

        // Initial random positions
        return {
            ...node,
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            centrality: dIn, // Represent size by In-Degree (Importance)
            risk
        };
    });
};

export const runForceSimulation = (
    nodes: SimulationNode[],
    edges: { source: string, target: string }[],
    iterations: number = 300,
    width: number,
    height: number
) => {
    // Basic Force-Directed Graph Layout (Fruchterman-Reingold inspired)
    const k = Math.sqrt((width * height) / (nodes.length + 1)); // Optimal distance
    const repulsion = 1500; // Repulsive force strength
    const attraction = 0.05; // Spring constant
    const damping = 0.9;
    const centerAttraction = 0.02;

    for (let i = 0; i < iterations; i++) {
        // Reset forces logic would go here if accumulating force vectors
        // We'll update velocities directly

        // Repulsion (Node vs Node)
        for (let a = 0; a < nodes.length; a++) {
            for (let b = a + 1; b < nodes.length; b++) {
                const nodeA = nodes[a];
                const nodeB = nodes[b];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distSq = dx * dx + dy * dy || 1;
                const dist = Math.sqrt(distSq);

                const force = repulsion / distSq;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                nodeA.vx += fx;
                nodeA.vy += fy;
                nodeB.vx -= fx;
                nodeB.vy -= fy;
            }
        }

        // Attraction (Edges)
        edges.forEach(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            const force = dist * attraction;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
        });

        // Gravity (Center)
        const cx = width / 2;
        const cy = height / 2;
        nodes.forEach(node => {
            node.vx += (cx - node.x) * centerAttraction;
            node.vy += (cy - node.y) * centerAttraction;

            // Apply velocity
            node.x += node.vx;
            node.y += node.vy;

            // Dampen
            node.vx *= damping;
            node.vy *= damping;
        });
    }

    return nodes;
};
