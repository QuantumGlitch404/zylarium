/* eslint-disable no-restricted-globals */

// Graph types for worker
interface WorkerNode {
    id: string;
    path: string;
    name: string;
    folder: string; // For clustering
    x: number;
    y: number;
    vx: number;
    vy: number;
    centrality: number;
    inDegree: number;
    outDegree: number;
    risk: 'low' | 'medium' | 'high';
    extension: string;
    size: number;
    language: string;
    imports: string[];
    content?: string;
}

interface WorkerEdge {
    source: string;
    target: string;
    weight: number;
}

interface WorkerMessage {
    type: 'INIT' | 'TICK' | 'STOP';
    nodes?: any[];
    edges?: WorkerEdge[];
    width?: number;
    height?: number;
}

let nodes: WorkerNode[] = [];
let edges: WorkerEdge[] = [];
let width = 800;
let height = 600;
let simulationId: number | null = null;
let folderCenters: Map<string, { x: number, y: number }> = new Map();

// Tarjan's Algo for Cycles
function detectCycles(nodeList: WorkerNode[], edgeList: WorkerEdge[]): Set<string> {
    const adj = new Map<string, string[]>();
    edgeList.forEach(e => {
        if (!adj.has(e.source)) adj.set(e.source, []);
        adj.get(e.source)?.push(e.target);
    });

    const indexMap = new Map<string, number>();
    const lowLik = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    let index = 0;
    const cycles = new Set<string>();

    function strongconnect(v: string) {
        indexMap.set(v, index);
        lowLik.set(v, index);
        index++;
        stack.push(v);
        onStack.add(v);

        const neighbors = adj.get(v) || [];
        for (const w of neighbors) {
            if (!indexMap.has(w)) {
                strongconnect(w);
                lowLik.set(v, Math.min(lowLik.get(v)!, lowLik.get(w)!));
            } else if (onStack.has(w)) {
                lowLik.set(v, Math.min(lowLik.get(v)!, indexMap.get(w)!));
            }
        }

        if (lowLik.get(v) === indexMap.get(v)) {
            const component: string[] = [];
            let w;
            do {
                w = stack.pop()!;
                onStack.delete(w);
                component.push(w);
            } while (w !== v);

            if (component.length > 1) {
                component.forEach(id => cycles.add(id));
            }
        }
    }

    nodeList.forEach(n => {
        if (!indexMap.has(n.id)) strongconnect(n.id);
    });

    return cycles;
}

function calculateMetrics(rawEdges: WorkerEdge[]) {
    const inD = new Map<string, number>();
    const outD = new Map<string, number>();

    rawEdges.forEach(e => {
        outD.set(e.source, (outD.get(e.source) || 0) + 1);
        inD.set(e.target, (inD.get(e.target) || 0) + 1);
    });

    return { inD, outD };
}

// Extract folder from path
function getFolder(path: string): string {
    const parts = path.split('/');
    if (parts.length <= 1) return 'root';
    return parts.slice(0, Math.min(2, parts.length - 1)).join('/'); // Group by top 2 levels
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { type, nodes: initNodes, edges: initEdges, width: w, height: h } = e.data;

    if (type === 'INIT' && initNodes && initEdges) {
        if (w) width = w;
        if (h) height = h;

        const { inD, outD } = calculateMetrics(initEdges);

        // Group nodes by folder for clustering
        const folderGroups = new Map<string, any[]>();
        initNodes.forEach(n => {
            const folder = getFolder(n.path);
            if (!folderGroups.has(folder)) folderGroups.set(folder, []);
            folderGroups.get(folder)!.push(n);
        });

        // Create folder centers in a circular layout
        const folderArr = Array.from(folderGroups.keys());
        const numFolders = folderArr.length;
        const radius = Math.min(width, height) * 0.35;

        folderCenters = new Map();
        folderArr.forEach((folder, i) => {
            const angle = (2 * Math.PI * i) / numFolders;
            folderCenters.set(folder, {
                x: width / 2 + radius * Math.cos(angle),
                y: height / 2 + radius * Math.sin(angle)
            });
        });

        // Detect cycles
        const tempNodes = initNodes.map(n => ({ ...n } as WorkerNode));
        const cyclicIds = detectCycles(tempNodes, initEdges);

        // Initialize nodes with positions clustered around their folder center
        nodes = initNodes.map(n => {
            const folder = getFolder(n.path);
            const center = folderCenters.get(folder) || { x: width / 2, y: height / 2 };
            const incoming = inD.get(n.id) || 0;
            const outgoing = outD.get(n.id) || 0;

            let risk: 'low' | 'medium' | 'high' = 'low';
            if (cyclicIds.has(n.id)) risk = 'high';
            else if (incoming > 5 && outgoing > 5) risk = 'medium';

            // Start position near folder center with small random offset
            const offsetRadius = 80 + Math.random() * 60;
            const offsetAngle = Math.random() * 2 * Math.PI;

            return {
                ...n,
                folder,
                x: center.x + offsetRadius * Math.cos(offsetAngle),
                y: center.y + offsetRadius * Math.sin(offsetAngle),
                vx: 0,
                vy: 0,
                centrality: incoming,
                inDegree: incoming,
                outDegree: outgoing,
                risk
            };
        });

        edges = initEdges;

        if (simulationId) clearInterval(simulationId);
        simulationId = self.setInterval(step, 16) as unknown as number;
    }

    if (type === 'STOP') {
        if (simulationId) clearInterval(simulationId);
        simulationId = null;
    }
};

function step() {
    // Increased repulsion for better spacing
    const repulsion = 4000;
    const attraction = 0.03; // Reduced for less clumping
    const folderPull = 0.02; // Pull towards folder center
    const damping = 0.8;
    const minDistance = 50; // Minimum distance between nodes

    // 1. Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Extra strong repulsion if too close
            if (dist < minDistance) {
                const pushForce = (minDistance - dist) * 2;
                const nx = dx / dist;
                const ny = dy / dist;
                a.vx += nx * pushForce;
                a.vy += ny * pushForce;
                b.vx -= nx * pushForce;
                b.vy -= ny * pushForce;
            }

            if (dist > 500) continue;

            const force = repulsion / (dist * dist + 1);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
        }
    }

    // 2. Attraction along edges (only for connected nodes)
    edges.forEach(e => {
        const s = nodes.find(n => n.id === e.source);
        const t = nodes.find(n => n.id === e.target);
        if (!s || !t) return;

        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Only attract if distance is large
        if (dist > 150) {
            const force = (dist - 150) * attraction;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            s.vx += fx;
            s.vy += fy;
            t.vx -= fx;
            t.vy -= fy;
        }
    });

    // 3. Pull nodes towards their folder center (clustering force)
    nodes.forEach(n => {
        const center = folderCenters.get(n.folder);
        if (center) {
            const dx = center.x - n.x;
            const dy = center.y - n.y;
            n.vx += dx * folderPull;
            n.vy += dy * folderPull;
        }
    });

    // 4. Apply velocities with damping
    nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= damping;
        n.vy *= damping;

        // Keep in bounds with padding
        const padding = 100;
        n.x = Math.max(padding, Math.min(width - padding, n.x));
        n.y = Math.max(padding, Math.min(height - padding, n.y));
    });

    self.postMessage({ nodes });
}
