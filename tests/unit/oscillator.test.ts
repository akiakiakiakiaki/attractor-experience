import { describe, expect, it } from 'vitest';
import { Oscillator } from '@/experience/signal-engine/audioMath';

describe('Oscillator', () => {
  it.each([
    ['sine', 0, 0],
    ['tri', 0, -1],
    ['saw', 0, -1],
    ['rect', 0, 1],
    ['tri', 0.5, 1],
    ['saw', 0.5, 0],
    ['rect', 0.5, -1],
  ] as const)('generates the expected %s waveform at phase %s', (waveform, time, expected) => {
    expect(new Oscillator(1, 0, 1, waveform).value(time)).toBeCloseTo(expected);
  });

  it('applies phase and amplitude consistently', () => {
    const oscillator = new Oscillator(1, Math.PI / 2, 0.25, 'sine');
    expect(oscillator.value(0)).toBeCloseTo(0.25);
    expect(oscillator.value(0.25)).toBeCloseTo(0);
  });
});
