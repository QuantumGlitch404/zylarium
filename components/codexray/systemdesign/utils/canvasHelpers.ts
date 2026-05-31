
// Canvas Helper Utilities

export const snapToGrid = (value: number, gridSize: number = 20): number => {
    return Math.round(value / gridSize) * gridSize;
};

// Calculate cubic bezier path for smooth connections
export const calculateBezierPath = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    arrowPosition: 'end' | 'both' | 'none' = 'end'
): string => {
    const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const curvature = Math.min(dist * 0.5, 150);

    // Simple horizontal flow logic:
    // If predominantly horizontal, control points extend horizontally
    const isHorizontal = Math.abs(end.x - start.x) > Math.abs(end.y - start.y);

    let cp1, cp2;

    if (isHorizontal) {
        cp1 = { x: start.x + curvature, y: start.y };
        cp2 = { x: end.x - curvature, y: end.y };
    } else {
        cp1 = { x: start.x, y: start.y + curvature };
        cp2 = { x: end.x, y: end.y - curvature };
    }

    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
};

export const getComponentAnchors = (x: number, y: number, w: number, h: number) => {
    return {
        top: { x: x + w / 2, y: y },
        bottom: { x: x + w / 2, y: y + h },
        left: { x: x, y: y + h / 2 },
        right: { x: x + w, y: y + h / 2 }
    };
};

// Determine best anchor points for closest connection
export const getBestConnectionPoints = (
    startRect: { x: number; y: number; w: number; h: number },
    endRect: { x: number; y: number; w: number; h: number }
) => {
    const startAnchors = getComponentAnchors(startRect.x, startRect.y, startRect.w, startRect.h);
    const endAnchors = getComponentAnchors(endRect.x, endRect.y, endRect.w, endRect.h);

    // Find pair with minimum distance
    let minDidst = Infinity;
    let bestStart = startAnchors.right;
    let bestEnd = endAnchors.left;

    Object.values(startAnchors).forEach(s => {
        Object.values(endAnchors).forEach(e => {
            const d = Math.pow(s.x - e.x, 2) + Math.pow(s.y - e.y, 2);
            if (d < minDidst) {
                minDidst = d;
                bestStart = s;
                bestEnd = e;
            }
        });
    });

    return { start: bestStart, end: bestEnd };
};
