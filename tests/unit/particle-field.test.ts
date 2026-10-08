import { describe, expect, it } from 'vitest';
import { ParticleField } from '@/experience/stages/attractor/ParticleField';
import { sampleVeilProfile } from '@/experience/stages/attractor/ParticleDistribution';
import config from '@/experience/stages/attractor/AttractorConfig';

describe('ParticleField initialization', () => {
  it('creates a denser deterministic field with a left-weighted distribution', () => {
    const first = new ParticleField();
    const second = new ParticleField();
    first.resize(1200, 800);
    second.resize(1200, 800);

    expect(first.grains).toHaveLength(Math.min(
      config.particles.maximumCount,
      Math.max(config.particles.minimumCount, Math.round(1200 * 800 / config.particles.countPerArea)),
    ));
    expect(first.grains.slice(0, 20)).toEqual(second.grains.slice(0, 20));
    const averageX = first.grains.reduce((sum, grain) => sum + grain.x, 0) / first.grains.length;
    const leftHalfRatio = first.grains.filter((grain) => grain.x < 600).length / first.grains.length;
    expect(averageX).toBeLessThan(600);
    expect(leftHalfRatio).toBeGreaterThan(0.58);
  });

  it('uses a pronounced size range with small grains dominant and occasional large grains', () => {
    const field = new ParticleField();
    field.resize(1200, 800);
    const sizes = field.grains.map(({ size }) => size);
    const smallCount = sizes.filter((size) => size < 1.4).length;

    expect(Math.min(...sizes)).toBeLessThan(0.5);
    expect(Math.max(...sizes)).toBeGreaterThan(7);
    expect(smallCount / sizes.length).toBeGreaterThan(0.8);
  });

  it('places grains along broad curved veils with only a sparse background layer', () => {
    const field = new ParticleField();
    field.resize(1200, 800);
    const veilGrains = field.grains.filter((grain) => {
      const xProgress = grain.x / 1200;
      const profile = sampleVeilProfile(xProgress);
      const yProgress = grain.y / 800;
      return Math.min(Math.abs(yProgress - profile.mainCenter), Math.abs(yProgress - profile.secondCenter)) < 0.18;
    });

    expect(veilGrains.length / field.grains.length).toBeGreaterThan(0.68);
  });

  it('keeps the particle count bounded on large displays', () => {
    const field = new ParticleField();
    field.resize(4000, 2400);

    expect(field.grains).toHaveLength(config.particles.maximumCount);
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
