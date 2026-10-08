import { createInfluenceMask } from '@/experience/stages/attractor/InfluenceMask';

export const maskSize = { width: 48, height: 32 };

export function createRectangularWordmarkMask() {
  const { width, height } = maskSize;
  const alpha = new Uint8ClampedArray(width * height * 4);
  for (let y = 10; y < 22; y++) {
    for (let x = 15; x < 33; x++) alpha[(y * width + x) * 4 + 3] = 255;
  }
  return createInfluenceMask(width, height, alpha);
}

export function createPaddedWordmarkMask(paddingX: number, paddingY: number) {
  const { width, height } = maskSize;
  const fieldWidth = width + paddingX * 2;
  const fieldHeight = height + paddingY * 2;
  const alpha = new Uint8ClampedArray(fieldWidth * fieldHeight * 4);
  for (let y = 10; y < 22; y++) {
    for (let x = 15; x < 33; x++) {
      alpha[((y + paddingY) * fieldWidth + x + paddingX) * 4 + 3] = 255;
    }
  }
  return createInfluenceMask(fieldWidth, fieldHeight, alpha, { x: paddingX, y: paddingY, width, height });
}
