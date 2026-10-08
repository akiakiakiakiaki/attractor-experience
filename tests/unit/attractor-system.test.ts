import { describe, expect, it } from 'vitest';
import { AttractorStage } from '@/experience/stages/attractor/AttractorStage';

function sampleAttractors(energy: number) {
  const stage = new AttractorStage();
  stage.setEnergy(energy);
  return stage.tick(17, 0.016, 1200, 800).attractors;
}

describe('AttractorStage signal mapping', () => {
  it('returns three finite attractors and repeats deterministically for the same input', () => {
    const first = sampleAttractors(0.3);

    expect(first).toHaveLength(3);
    expect(first.flatMap(({ position, strength, radius }) => [position.x, position.y, strength, radius]).every(Number.isFinite)).toBe(true);
    expect(sampleAttractors(0.3)).toEqual(first);
  });

  it('routes interaction energy into attractor strength', () => {
    const resting = sampleAttractors(0);
    const active = sampleAttractors(1);

    expect(active[0]!.strength).toBeGreaterThan(resting[0]!.strength);
    expect(active[1]!.strength).toBeGreaterThan(resting[1]!.strength);
  });
});
