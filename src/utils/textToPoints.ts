import { Vector2 } from '../engine/Vector2';

const offScreenCanvas = document.createElement('canvas');
const offScreenCtx = offScreenCanvas.getContext('2d', { willReadFrequently: true });

export const getTextPoints = (text: string, centerX: number, centerY: number): Vector2[] => {
  if (!offScreenCtx) return [];

  const fontSize = 120; // Large font for detail
  const fontFamily = 'Arial, Helvetica, sans-serif';
  
  // Set font to measure
  offScreenCtx.font = `bold ${fontSize}px ${fontFamily}`;
  const metrics = offScreenCtx.measureText(text);
  const width = Math.ceil(metrics.width);
  const height = Math.ceil(fontSize * 1.2); // Approximate height

  // Resize canvas
  offScreenCanvas.width = width;
  offScreenCanvas.height = height;

  // Draw text
  offScreenCtx.font = `bold ${fontSize}px ${fontFamily}`;
  offScreenCtx.fillStyle = '#ffffff';
  offScreenCtx.textBaseline = 'middle';
  offScreenCtx.textAlign = 'center';
  offScreenCtx.clearRect(0, 0, width, height);
  offScreenCtx.fillText(text, width / 2, height / 2);

  // Get pixel data
  const imageData = offScreenCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const points: Vector2[] = [];

  // Sampling step (smaller = more particles)
  const step = 4; 

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      
      if (alpha > 128) {
        // Calculate relative position centered at (0,0) based on text bounds
        const relX = x - width / 2;
        const relY = y - height / 2;
        
        // Add some jitter for realism
        const jitter = 1;
        
        points.push(new Vector2(
          centerX + relX + (Math.random() - 0.5) * jitter,
          centerY + relY + (Math.random() - 0.5) * jitter
        ));
      }
    }
  }

  return points;
};
