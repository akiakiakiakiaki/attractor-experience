import { describe, expect, it } from 'vitest';
import { createInfluenceMask } from '@/experience/stages/attractor/InfluenceMask';
import { createRectangularWordmarkMask, maskSize } from '../fixtures/influenceMask';

describe('InfluenceMask', () => {
  it('stores positive signed distances inside the SVG shape and negative distances outside', () => {
    const mask = createRectangularWordmarkMask();

    expect(mask.signedDistance[16 * maskSize.width + 20]).toBeGreaterThan(0);
    expect(mask.signedDistance[16 * maskSize.width + 10]).toBeLessThan(0);
  });

  it('creates outward-pointing boundary gradients around the shape', () => {
    const mask = createRectangularWordmarkMask();
    const x = 13;
    const y = 16;
    const index = y * mask.width + x;
    const gradientX = mask.signedDistance[index + 1] - mask.signedDistance[index - 1];

    expect(gradientX).toBeGreaterThan(0);
  });

  it('treats a counter-shaped hole as empty space inside the outline', () => {
    const { width, height } = maskSize;
    const alpha = new Uint8ClampedArray(width * height * 4);
    for (let y = 5; y < 27; y++) {
      for (let x = 5; x < 27; x++) {
        if (x < 13 || x > 18 || y < 13 || y > 18) alpha[(y * width + x) * 4 + 3] = 255;
      }
    }
    const mask = createInfluenceMask(width, height, alpha);

    expect(mask.signedDistance[15 * width + 15]).toBeLessThan(0);
    expect(mask.signedDistance[15 * width + 12]).toBeGreaterThan(0);
  });

  it('leaves a fully empty input outside the influence band', () => {
    const { width, height } = maskSize;
    const empty = createInfluenceMask(width, height, new Uint8ClampedArray(width * height * 4));

    expect(empty.signedDistance.every((distance) => distance < 0)).toBe(true);
  });
});
