export interface InfluenceMask {
  width: number;
  height: number;
  signedDistance: Float32Array;
  content: { x: number; y: number; width: number; height: number };
}

const DIAGONAL = Math.SQRT2;
const FAR = 1e6;

function distanceToClass(width: number, height: number, alpha: Uint8ClampedArray, featureInside: boolean): Float32Array {
  const distances = new Float32Array(width * height);
  for (let i = 0; i < distances.length; i++) {
    const isInside = alpha[i * 4 + 3] > 32;
    distances[i] = isInside === featureInside ? 0 : FAR;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let distance = distances[i];
      if (x > 0) distance = Math.min(distance, distances[i - 1] + 1);
      if (y > 0) {
        distance = Math.min(distance, distances[i - width] + 1);
        if (x > 0) distance = Math.min(distance, distances[i - width - 1] + DIAGONAL);
        if (x + 1 < width) distance = Math.min(distance, distances[i - width + 1] + DIAGONAL);
      }
      distances[i] = distance;
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      let distance = distances[i];
      if (x + 1 < width) distance = Math.min(distance, distances[i + 1] + 1);
      if (y + 1 < height) {
        distance = Math.min(distance, distances[i + width] + 1);
        if (x > 0) distance = Math.min(distance, distances[i + width - 1] + DIAGONAL);
        if (x + 1 < width) distance = Math.min(distance, distances[i + width + 1] + DIAGONAL);
      }
      distances[i] = distance;
    }
  }
  return distances;
}

export function createInfluenceMask(
  width: number,
  height: number,
  alpha: Uint8ClampedArray,
  content = { x: 0, y: 0, width, height },
): InfluenceMask {
  const insideDistance = distanceToClass(width, height, alpha, false);
  const outsideDistance = distanceToClass(width, height, alpha, true);
  const signedDistance = new Float32Array(width * height);

  for (let i = 0; i < signedDistance.length; i++) {
    signedDistance[i] = alpha[i * 4 + 3] > 32 ? insideDistance[i] : -outsideDistance[i];
  }
  return { width, height, signedDistance, content };
}
