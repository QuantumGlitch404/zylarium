
import { Component, Connection } from '../types';

export const autoLayout = (components: Component[], connections: Connection[]): Component[] => {
    // Simple layered grid layout
    const layers = new Map<number, Component[]>();
    const processing = new Set<string>();

    // Identify sources (no incoming)
    // Identify sinks (no outgoing)

    // Simple approach: Assign rank based on BFS depth from sources or 'client' types
    const rank = new Map<string, number>();

    components.forEach(c => {
        if (c.type === 'client' || c.type === 'external-api') rank.set(c.id, 0);
    });

    if (rank.size === 0 && components.length > 0) rank.set(components[0].id, 0);

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
        changed = false;
        connections.forEach(conn => {
            const startRank = rank.get(conn.fromId);
            if (startRank !== undefined) {
                const endRank = rank.get(conn.toId);
                if (endRank === undefined || endRank <= startRank) {
                    rank.set(conn.toId, startRank + 1);
                    changed = true;
                }
            }
        });
        iterations++;
    }

    // Group by rank
    components.forEach(c => {
        const r = rank.get(c.id) || 0;
        if (!layers.has(r)) layers.set(r, []);
        layers.get(r)!.push(c);
    });

    // Assign geometric positions
    const layerHeight = 150;
    const itemWidth = 140; // width + gap

    const newComponents = [...components];

    layers.forEach((layerComponents, layerIndex) => {
        const layerWidth = layerComponents.length * itemWidth;
        const startX = 100 + (Math.max(0, 1000 - layerWidth) / 2); // Center on 1200 wide canvas approx

        layerComponents.forEach((comp, idx) => {
            const target = newComponents.find(c => c.id === comp.id)!;
            target.position = {
                x: startX + (idx * itemWidth),
                y: 100 + (layerIndex * layerHeight)
            };
        });
    });

    return newComponents;
};
