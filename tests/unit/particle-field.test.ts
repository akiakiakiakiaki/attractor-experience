import { describe, expect, it } from 'vitest';
import { ParticleField } from '@/experience/stages/attractor/ParticleField';

describe('ParticleField behavior', () => {
  it('creates a repeatable initial sequence for the same seed', () => {
    const first = new ParticleField();
    const second = new ParticleField();
    first.resize(1200, 800);
    second.resize(1200, 800);

    expect(first.grains.slice(0, 20)).toEqual(second.grains.slice(0, 20));
  });

  it('keeps grains inside the viewport after crossing multiple wrapped edges', () => {
    const field = new ParticleField();
    const width = 1200;
    const height = 800;
    field.resize(width, height);
    field.grains[0]!.vx = width * 300;
    field.grains[0]!.vy = -height * 300;

    field.step(0.04, 1, [], { x: 0, y: 0 }, 0, null, { x: 0, y: 0, w: 0, h: 0 }, false);

    expect(field.grains[0]!.x).toBeGreaterThanOrEqual(0);
    expect(field.grains[0]!.x).toBeLessThan(width);
    expect(field.grains[0]!.y).toBeGreaterThanOrEqual(0);
    expect(field.grains[0]!.y).toBeLessThan(height);
  });
});
