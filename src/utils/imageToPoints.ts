import { Vector2 } from '../engine/Vector2';

export interface PointData {
  pos: Vector2;
  color: string;
}

const offScreenCanvas = document.createElement('canvas');
const offScreenCtx = offScreenCanvas.getContext('2d', { willReadFrequently: true });

export const getImagePoints = (imageSrc: string, centerX: number, centerY: number): Promise<PointData[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      if (!offScreenCtx) {
        resolve([]);
        return;
      }

      // Limit max size to avoid too many particles
      const maxSize = 200; // Max width or height
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      offScreenCanvas.width = width;
      offScreenCanvas.height = height;

      offScreenCtx.clearRect(0, 0, width, height);
      offScreenCtx.drawImage(img, 0, 0, width, height);

      const imageData = offScreenCtx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const points: PointData[] = [];

      // Sampling step
      const step = 3; // Finer detail for images

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];

          if (a > 128) {
            const relX = x - width / 2;
            const relY = y - height / 2;
            
            // Jitter
            const jitter = 0.5;

            points.push({
              pos: new Vector2(
                centerX + relX + (Math.random() - 0.5) * jitter,
                centerY + relY + (Math.random() - 0.5) * jitter
              ),
              color: `rgba(${r},${g},${b},${a/255})`
            });
          }
        }
      }
      resolve(points);
    };
    img.onerror = () => {
      console.error('Failed to load image for fireworks');
      resolve([]);
    };
    img.src = imageSrc;
  });
};
