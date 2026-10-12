import { describe, expect, it } from 'vitest';
import { ParticleField, type Grain } from '@/experience/stages/attractor/ParticleField';
import config from '@/experience/stages/attractor/AttractorConfig';
import { createPaddedWordmarkMask, createRectangularWordmarkMask, maskSize } from '../fixtures/influenceMask';

function createFieldWithGrain(grain: Grain): ParticleField {
  const field = new ParticleField();
  field.resize(maskSize.width, maskSize.height);
  field.grains.splice(0, field.grains.length, grain);
  return field;
}

describe('particle and wordmark interaction', () => {
  it('repels a grain before it reaches the invisible SVG boundary', () => {
    const grain = { x: 13, y: 16, vx: 0, vy: 0, size: 1, seed: 0 };
    const field = createFieldWithGrain(grain);

    field.step(0.016, 0, [], { x: -1000, y: -1000 }, 0, createRectangularWordmarkMask(), { x: 0, y: 0, w: maskSize.width, h: maskSize.height }, false);

    expect(grain.vx).toBeLessThan(0);
    expect(grain.x).toBeLessThan(13);
  });

  it('pushes a grain that begins inside the SVG fill back outside', () => {
    const grain = { x: 15, y: 16, vx: 0, vy: 0, size: 1, seed: 0 };
    const field = createFieldWithGrain(grain);

    field.step(0.016, 0, [], { x: -1000, y: -1000 }, 0, createRectangularWordmarkMask(), { x: 0, y: 0, w: maskSize.width, h: maskSize.height }, false);

    expect(grain.vx).toBeLessThan(0);
    expect(grain.x).toBeLessThan(15);
  });

  it('produces a stronger outward force near the SVG path than the autonomous field alone', () => {
    const withMask = { x: 13, y: 16, vx: 0, vy: 0, size: 1, seed: 0 };
    const autonomous = { ...withMask };
    const box = { x: 0, y: 0, w: maskSize.width, h: maskSize.height };
    createFieldWithGrain(withMask).step(0.016, 0, [], { x: -1000, y: -1000 }, 0, createRectangularWordmarkMask(), box, false);
    createFieldWithGrain(autonomous).step(0.016, 0, [], { x: -1000, y: -1000 }, 0, null, box, false);

    expect(withMask.vx).toBeLessThan(autonomous.vx - 1);
  });

  it('keeps wordmark influence independent of visual reveal state', () => {
    const grain = { x: 13, y: 16, vx: 0, vy: 0, size: 1, seed: 0 };
    const field = createFieldWithGrain(grain);

    field.step(0.016, 0, [], { x: -1000, y: -1000 }, 0, createRectangularWordmarkMask(), { x: 0, y: 0, w: maskSize.width, h: maskSize.height }, false);

    expect(grain.x).toBeLessThan(13);
  });

  it('changes from repulsion to ingress over a slow oscillating cycle', () => {
    const period = 1 / config.wordmark.influence.oscillationFrequency;
    const closed = { x: 13, y: 16, vx: 0, vy: 0, size: 1, seed: 0 };
    const open = { ...closed };
    const box = { x: 0, y: 0, w: maskSize.width, h: maskSize.height };
    const mask = createRectangularWordmarkMask();
    createFieldWithGrain(closed).step(0.016, period / 2, [], { x: -1000, y: -1000 }, 0, mask, box, false);
    createFieldWithGrain(open).step(0.016, 0, [], { x: -1000, y: -1000 }, 0, mask, box, false);

    expect(closed.vx).toBeLessThan(0);
    expect(open.vx).toBeGreaterThan(closed.vx);
  });

  it('draws grains toward the padded wordmark region to build a denser orbiting veil', () => {
    const withMask = { x: 20, y: 182, vx: 0, vy: 0, size: 1, seed: 0 };
    const autonomous = { ...withMask };
    const fieldBox = { x: 150, y: 150, w: 96, h: 64 };
    const paddedMask = createPaddedWordmarkMask(128, 80);
    const fieldWithMask = new ParticleField();
    const autonomousField = new ParticleField();
    fieldWithMask.resize(400, 300);
    autonomousField.resize(400, 300);
    fieldWithMask.grains.splice(0, fieldWithMask.grains.length, withMask);
    autonomousField.grains.splice(0, autonomousField.grains.length, autonomous);

    fieldWithMask.step(0.016, 0, [], { x: -1000, y: -1000 }, 0, paddedMask, fieldBox, false);
    autonomousField.step(0.016, 0, [], { x: -1000, y: -1000 }, 0, null, fieldBox, false);

    expect(withMask.vx).toBeGreaterThan(autonomous.vx);
  });

  it('spreads grains radially when pinching out and gathers them when pinching in', () => {
    const createGestureGrain = () => ({ x: 210, y: 150, vx: 0, vy: 0, size: 1, seed: 0.5 });
    const baseline = createGestureGrain();
    const spread = createGestureGrain();
    const contract = createGestureGrain();
    const pointer = { x: 200, y: 150 };
    const stepWithGesture = (grain: typeof baseline, pinch: number) => {
      const field = new ParticleField();
      field.resize(400, 300);
      field.grains.splice(0, field.grains.length, grain);
      field.step(
        0.016,
        0,
        [],
        pointer,
        0,
        null,
        { x: 0, y: 0, w: 0, h: 0 },
        false,
        { x: 0, y: 0 },
        undefined,
        { pinch, rotation: 0 },
      );
    };

    stepWithGesture(baseline, 0);
    stepWithGesture(spread, 1);
    stepWithGesture(contract, -1);

    expect(spread.vx).toBeGreaterThan(baseline.vx);
    expect(contract.vx).toBeLessThan(baseline.vx);
  });

  it('applies rotation as tangential grain movement around the gesture center', () => {
    const baseline = { x: 210, y: 150, vx: 0, vy: 0, size: 1, seed: 0.5 };
    const rotated = { ...baseline };
    const run = (grain: typeof baseline, rotation: number) => {
      const field = new ParticleField();
      field.resize(400, 300);
      field.grains.splice(0, field.grains.length, grain);
      field.step(
        0.016,
        0,
        [],
        { x: 200, y: 150 },
        0,
        null,
        { x: 0, y: 0, w: 0, h: 0 },
        false,
        { x: 0, y: 0 },
        undefined,
        { pinch: 0, rotation },
      );
    };

    run(baseline, 0);
    run(rotated, 1);

    expect(rotated.vy).toBeGreaterThan(baseline.vy);
  });

  it('carries cursor movement direction into nearby grain velocity without a press', () => {
    const sampleVelocity = (cursorVelocityX: number) => {
      const grain = { x: 210, y: 150, vx: 0, vy: 0, size: 1, seed: 0.5 };
      const field = new ParticleField();
      field.resize(400, 300);
      field.grains.splice(0, field.grains.length, grain);
      field.step(
        0.016,
        0,
        [],
        { x: 200, y: 150 },
        0,
        null,
        { x: 0, y: 0, w: 0, h: 0 },
        false,
        { x: cursorVelocityX, y: 0 },
      );
      return grain.vx;
    };

    expect(sampleVelocity(0.2)).toBeGreaterThan(sampleVelocity(-0.2));
  });
});
