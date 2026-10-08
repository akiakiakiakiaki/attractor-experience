import { describe, expect, it } from 'vitest';
import { Envelope } from '@/experience/signal-engine/audioMath';

describe('Envelope', () => {
  it('starts at zero and moves toward its target using the attack time', () => {
    const envelope = new Envelope();
    envelope.target = 1;

    expect(envelope.tick(1, 1, 2)).toBeCloseTo(1 - Math.exp(-1));
    expect(envelope.value).toBeGreaterThan(0);
    expect(envelope.value).toBeLessThan(1);
  });

  it('uses release time when moving down toward zero', () => {
    const envelope = new Envelope();
    envelope.value = 1;
    envelope.target = 0;

    expect(envelope.tick(1, 1, 2)).toBeCloseTo(Math.exp(-0.5));
  });

  it('adds a trigger and clamps its value at one', () => {
    const envelope = new Envelope();
    envelope.trigger(0.4);
    envelope.trigger(0.9);

    expect(envelope.value).toBe(1);
  });

  it('remains bounded for zero or negative envelope times', () => {
    const envelope = new Envelope();
    envelope.target = 1;

    expect(envelope.tick(0.1, 0, -1)).toBeLessThanOrEqual(1);
    expect(envelope.value).toBeGreaterThanOrEqual(0);
  });
});
