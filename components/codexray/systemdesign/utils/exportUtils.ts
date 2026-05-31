
import { SystemDesign } from '../types';

// Real implementation to fix corrupted image issue
export const exportImage = async (design: SystemDesign, format: 'png' | 'svg' | 'json' | 'md') => {
    try {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
            downloadFile(blob, `${design.name}.json`);
            return;
        }

        if (format === 'md') {
            // ... strict simple markdown export ...
            const content = `# ${design.name}\n${design.description}\n\nComponents: ${design.components.length}\nConnections: ${design.connections.length}`;
            const blob = new Blob([content], { type: 'text/markdown' });
            downloadFile(blob, `${design.name}.md`);
            return;
        }

        // --- Image Export Logic ---
        const svgElement = document.getElementById('designer-canvas-svg')?.querySelector('svg');
        if (!svgElement) throw new Error('Canvas not found');

        // 1. Clone node to avoid modifying live canvas during processing
        const clone = svgElement.cloneNode(true) as SVGSVGElement;

        // 2. Inline specific styles if necessary (usually browser handles basic SVG well)
        // Add minimal background to avoid transparent images appearing black
        clone.style.backgroundColor = '#111827'; // gray-900

        // 3. Serialize to XML
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

        if (format === 'svg') {
            downloadFile(svgBlob, `${design.name}.svg`);
            return;
        }

        // 4. Convert to PNG using Canvas
        if (format === 'png') {
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Use actual size or reasonable default
                canvas.width = clone.viewBox.baseVal.width || 1200;
                canvas.height = clone.viewBox.baseVal.height || 800;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Draw background manually since SVG BG might not capture
                ctx.fillStyle = '#111827';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, 0, 0);

                canvas.toBlob((pngBlob) => {
                    if (pngBlob) downloadFile(pngBlob, `${design.name}.png`);
                    URL.revokeObjectURL(url);
                });
            };
            img.src = url;
            return;
        }

    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export image. Please try JSON export instead.');
    }
};

const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
